import {
  ScraperPipelineResult,
  NormalizedProductRecord,
  VendorListingDefinition,
  ParsedDetailData,
  RawListingProduct
} from './types';
import { ScrapedProduct } from '@/types/drone';
import { getVendorConfig, vendorListingConfigs } from './vendorConfigs';
import { buildAbsoluteUrl, delay, fetchHtmlWithRetry } from './fetcher';
import { parseListingNextPageUrls, parseListingProducts, parseProductDetailData } from './extractor';
import { classifyDroneProduct } from './classifier';
import { normalizeProductRecord } from './normalize';
import { applyProductQualityValidation } from './validate';
import { dedupeNormalizedRecords } from './dedupe';

const DETAIL_CONCURRENCY = 4;

const buildPageUrl = (
  vendorConfig: VendorListingDefinition,
  categoryPath: string,
  page: number
): string => {
  const baseUrl = buildAbsoluteUrl(categoryPath, vendorConfig.baseUrl);
  if (page <= 1) return baseUrl;

  const url = new URL(baseUrl);

  if (vendorConfig.vendor.toLowerCase().includes('getfpv')) {
    url.searchParams.set('p', `${page}`);
  } else {
    url.searchParams.set('page', `${page}`);
  }

  return url.toString();
};

const parseDetailSafe = async (
  listing: RawListingProduct,
  headers?: Record<string, string>
): Promise<ParsedDetailData> => {
  try {
    const detailResponse = await fetchHtmlWithRetry(listing.sourceProductUrl, {
      headers,
      timeoutMs: 20000,
      retries: 2
    });

    return parseProductDetailData(detailResponse.html);
  } catch {
    return {
      title: listing.rawName,
      description: listing.rawDescription,
      brand: listing.rawBrand,
      stockText: listing.rawStock,
      specificationPairs: {},
      bulletLines: []
    };
  }
};

const processInBatches = async <TInput, TOutput>(
  items: TInput[],
  worker: (item: TInput) => Promise<TOutput>,
  concurrency: number
): Promise<TOutput[]> => {
  const results: TOutput[] = [];
  let index = 0;

  const runWorker = async (): Promise<void> => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const output = await worker(items[currentIndex]);
      results[currentIndex] = output;
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => runWorker());
  await Promise.all(workers);

  return results;
};

export class ScraperPipeline {
  getAvailableVendors(): string[] {
    return vendorListingConfigs.map((config) => config.vendor);
  }

  getVendorConfig(vendor: string): VendorListingDefinition | undefined {
    return getVendorConfig(vendor);
  }

  async scrapeVendorCategory(
    vendor: string,
    categoryKey: string,
    maxProducts = 100
  ): Promise<ScraperPipelineResult> {
    const vendorConfig = getVendorConfig(vendor);
    if (!vendorConfig) {
      throw new Error(`Vendor ${vendor} not configured`);
    }

    const categoryConfig = vendorConfig.categories[categoryKey];
    if (!categoryConfig) {
      throw new Error(`Category ${categoryKey} not configured for ${vendor}`);
    }

    const maxPages = Math.max(1, categoryConfig.maxPages || 1);
    const listingPagesVisited: string[] = [];
    const rawCandidates: RawListingProduct[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const pageUrl = buildPageUrl(vendorConfig, categoryConfig.path, page);
      listingPagesVisited.push(pageUrl);

      const pageResponse = await fetchHtmlWithRetry(pageUrl, {
        headers: vendorConfig.headers,
        timeoutMs: 22000,
        retries: 3
      });

      const parsed = parseListingProducts(pageResponse.html, vendorConfig, categoryKey, pageUrl);
      rawCandidates.push(...parsed);

      const nextLinks = parseListingNextPageUrls(pageResponse.html, pageUrl);
      const hasPaginationSignal = nextLinks.length > 0;

      if (parsed.length === 0 && page > 1) {
        break;
      }

      if (!hasPaginationSignal && page > 2 && parsed.length < 6) {
        break;
      }

      if (rawCandidates.length >= maxProducts * 2) {
        break;
      }

      await delay(vendorConfig.rateLimitMs ?? 600);
    }

    const uniqueRaw = [...new Map(rawCandidates.map((item) => [`${item.rawName.toLowerCase()}|${item.sourceProductUrl}`, item])).values()]
      .slice(0, Math.max(maxProducts, 30));

    const normalized = await processInBatches(uniqueRaw, async (listing) => {
      const detail = await parseDetailSafe(listing, vendorConfig.headers);
      const classification = classifyDroneProduct(listing, detail);
      const normalizedRecord = normalizeProductRecord(listing, detail, classification);
      return applyProductQualityValidation(normalizedRecord);
    }, DETAIL_CONCURRENCY);

    const deduped = dedupeNormalizedRecords(normalized);

    const dedupedFlat: NormalizedProductRecord[] = deduped.flatMap((group) => {
      const byVendor = new Map<string, NormalizedProductRecord>();

      group.records.forEach((record) => {
        const existing = byVendor.get(record.vendor);
        if (!existing || record.confidence.overall > existing.confidence.overall) {
          byVendor.set(record.vendor, {
            ...record,
            canonicalName: group.canonicalName,
            identityKey: group.identityKey,
            specifications: {
              ...group.consolidatedSpecs,
              ...record.specifications
            }
          });
        }
      });

      return [...byVendor.values()];
    });

    const ranked = dedupedFlat
      .sort((a, b) => b.quality.score - a.quality.score)
      .slice(0, maxProducts);

    const lowConfidenceCount = ranked.filter(
      (record) => record.confidence.overall < 55 || record.quality.score < 50
    ).length;

    const invalidCount = ranked.filter((record) => record.quality.missingRequired.length > 0).length;

    return {
      vendor,
      sourceCategory: categoryKey,
      listingPagesVisited: listingPagesVisited.length,
      rawCount: uniqueRaw.length,
      normalizedCount: normalized.length,
      dedupedCount: deduped.length,
      lowConfidenceCount,
      invalidCount,
      records: ranked,
      deduped
    };
  }

  async scrapeVendor(vendor: string, maxProductsPerCategory = 100): Promise<ScraperPipelineResult> {
    const config = getVendorConfig(vendor);
    if (!config) {
      throw new Error(`Vendor ${vendor} not configured`);
    }

    const categories = Object.keys(config.categories);
    const pipelineResults: ScraperPipelineResult[] = [];

    for (const categoryKey of categories) {
      try {
        const result = await this.scrapeVendorCategory(vendor, categoryKey, Math.ceil(maxProductsPerCategory / Math.max(categories.length, 1)));
        pipelineResults.push(result);
      } catch {
        continue;
      }
    }

    const mergedRecords = pipelineResults.flatMap((result) => result.records);
    const mergedDeduped = dedupeNormalizedRecords(mergedRecords);

    return {
      vendor,
      sourceCategory: 'all',
      listingPagesVisited: pipelineResults.reduce((sum, result) => sum + result.listingPagesVisited, 0),
      rawCount: pipelineResults.reduce((sum, result) => sum + result.rawCount, 0),
      normalizedCount: mergedRecords.length,
      dedupedCount: mergedDeduped.length,
      lowConfidenceCount: mergedRecords.filter((record) => record.confidence.overall < 55 || record.quality.score < 50).length,
      invalidCount: mergedRecords.filter((record) => record.quality.missingRequired.length > 0).length,
      records: mergedRecords,
      deduped: mergedDeduped
    };
  }

  async scrapeAllVendors(maxProductsPerVendor = 120): Promise<ScraperPipelineResult> {
    const vendorResults: ScraperPipelineResult[] = [];

    for (const vendor of this.getAvailableVendors()) {
      try {
        const result = await this.scrapeVendor(vendor, maxProductsPerVendor);
        vendorResults.push(result);
      } catch {
        continue;
      }
    }

    const mergedRecords = vendorResults.flatMap((result) => result.records);
    const mergedDeduped = dedupeNormalizedRecords(mergedRecords);

    return {
      sourceCategory: 'all',
      listingPagesVisited: vendorResults.reduce((sum, result) => sum + result.listingPagesVisited, 0),
      rawCount: vendorResults.reduce((sum, result) => sum + result.rawCount, 0),
      normalizedCount: mergedRecords.length,
      dedupedCount: mergedDeduped.length,
      lowConfidenceCount: mergedRecords.filter((record) => record.confidence.overall < 55 || record.quality.score < 50).length,
      invalidCount: mergedRecords.filter((record) => record.quality.missingRequired.length > 0).length,
      records: mergedRecords,
      deduped: mergedDeduped
    };
  }
}

const stringifySpecValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  return typeof value === 'number' ? `${value}` : value;
};

export const toLegacyScrapedProducts = (
  records: NormalizedProductRecord[]
): ScrapedProduct[] => records.map((record) => ({
  name: record.canonicalName,
  price: record.priceUsd,
  url: record.sourceUrl,
  vendor: record.vendor,
  inStock: record.stockStatus !== 'out_of_stock',
  imageUrl: record.imageUrl,
  description: record.description,
  sku: record.sku,
  brand: record.brand,
  category: record.legacyCategory,
  specifications: Object.fromEntries(
    Object.entries({
      ...record.specifications,
      identityKey: record.identityKey,
      normalizedCategory: record.category,
      confidenceOverall: record.confidence.overall,
      confidenceCategory: record.confidence.category,
      qualityScore: record.quality.score,
      qualityMissing: record.quality.missingRequired.join(','),
      qualityWarnings: record.quality.warnings.join(' | ')
    }).map(([key, value]) => [key, stringifySpecValue(value as string | number | undefined)])
  ),
  lastUpdated: new Date()
}));
