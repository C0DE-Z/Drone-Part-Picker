import * as cheerio from 'cheerio';
import { AnyNode } from 'domhandler';
import { buildAbsoluteUrl } from './fetcher';
import { ParsedDetailData, RawListingProduct, VendorListingDefinition } from './types';

const firstNonEmpty = (values: Array<string | undefined | null>): string => {
  const found = values.find((value) => Boolean(value && value.trim()));
  return found?.trim() || '';
};

const readFirstText = (
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  selectors: string[]
): string => {
  for (const selector of selectors) {
    const value = root.find(selector).first().text().trim();
    if (value) return value;
  }
  return '';
};

const readFirstAttr = (
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  selectors: string[],
  attr: 'href' | 'src'
): string => {
  for (const selector of selectors) {
    const value = root.find(selector).first().attr(attr)?.trim();
    if (value) return value;
  }
  return '';
};

const collectCards = (
  $: cheerio.CheerioAPI,
  selectors: string[]
): cheerio.Cheerio<AnyNode>[] => {
  const unique = new Map<string, cheerio.Cheerio<AnyNode>>();

  selectors.forEach((selector) => {
    $(selector).each((index, element) => {
      const card = $(element);
      const marker = card.attr('data-product-id') || card.attr('id') || `${selector}-${index}`;
      if (!unique.has(marker)) {
        unique.set(marker, card);
      }
    });
  });

  return [...unique.values()];
};

export const parseListingProducts = (
  html: string,
  config: VendorListingDefinition,
  categoryKey: string,
  listingUrl: string
): RawListingProduct[] => {
  const categoryConfig = config.categories[categoryKey];
  if (!categoryConfig) return [];

  const $ = cheerio.load(html);
  const cards = collectCards($, categoryConfig.cardSelectors);

  const records: RawListingProduct[] = [];
  const seen = new Set<string>();

  cards.forEach((card) => {
    const rawName = readFirstText($, card, categoryConfig.nameSelectors);
    const rawPrice = readFirstText($, card, categoryConfig.priceSelectors);
    const rawBrand = categoryConfig.brandSelectors
      ? readFirstText($, card, categoryConfig.brandSelectors)
      : '';
    const rawStock = categoryConfig.stockSelectors
      ? readFirstText($, card, categoryConfig.stockSelectors)
      : '';
    const rawDescription = categoryConfig.descriptionSelectors
      ? readFirstText($, card, categoryConfig.descriptionSelectors)
      : '';

    const link = readFirstAttr($, card, categoryConfig.linkSelectors, 'href');
    const image = categoryConfig.imageSelectors
      ? readFirstAttr($, card, categoryConfig.imageSelectors, 'src')
      : '';

    const sourceProductUrl = buildAbsoluteUrl(link, config.baseUrl);
    const imageUrl = image ? buildAbsoluteUrl(image, config.baseUrl) : undefined;

    if (!rawName || !sourceProductUrl) {
      return;
    }

    const key = `${rawName.toLowerCase()}::${sourceProductUrl}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    records.push({
      vendor: config.vendor,
      listingCategoryKey: categoryKey,
      sourceListingUrl: listingUrl,
      sourceProductUrl,
      rawName,
      rawPrice,
      rawBrand,
      rawStock,
      imageUrl,
      rawDescription
    });
  });

  return records;
};

export const parseListingNextPageUrls = (html: string, currentUrl: string): string[] => {
  const $ = cheerio.load(html);

  const nextCandidates = [
    $('a[rel="next"]').attr('href'),
    $('link[rel="next"]').attr('href'),
    $('a[aria-label*="Next"]').attr('href'),
    $('a.pagination-next').attr('href'),
    $('a.next').attr('href')
  ];

  const resolved = nextCandidates
    .map((candidate) => (candidate ? buildAbsoluteUrl(candidate, currentUrl) : ''))
    .filter(Boolean);

  return [...new Set(resolved)];
};

export const parseProductDetailData = (html: string): ParsedDetailData => {
  const $ = cheerio.load(html);

  const title = firstNonEmpty([
    $('h1').first().text(),
    $('.product-title').first().text(),
    $('.product-name').first().text(),
    $('[data-testid="product-title"]').first().text()
  ]);

  const description = firstNonEmpty([
    $('.product-description').first().text(),
    $('.description').first().text(),
    $('.product-content').first().text(),
    $('[data-testid="product-description"]').first().text()
  ]);

  const sku = firstNonEmpty([
    $('.sku').first().text(),
    $('[data-sku]').attr('data-sku'),
    $('[itemprop="sku"]').first().text()
  ]);

  const brand = firstNonEmpty([
    $('.brand').first().text(),
    $('.vendor').first().text(),
    $('.product-vendor').first().text(),
    $('[itemprop="brand"]').first().text()
  ]);

  const stockText = firstNonEmpty([
    $('.availability').first().text(),
    $('.stock-status').first().text(),
    $('.inventory').first().text(),
    $('[data-stock]').attr('data-stock')
  ]);

  const specificationPairs: Record<string, string> = {};

  $('table tr').each((_, row) => {
    const key = $(row).find('th, td').first().text().trim();
    const value = $(row).find('td').last().text().trim();
    if (key && value && key.toLowerCase() !== value.toLowerCase()) {
      specificationPairs[key] = value;
    }
  });

  $('dl').each((_, dl) => {
    const terms = $(dl).find('dt');
    terms.each((__, dt) => {
      const key = $(dt).text().trim();
      const value = $(dt).next('dd').text().trim();
      if (key && value) {
        specificationPairs[key] = value;
      }
    });
  });

  const bulletLines: string[] = [];
  $('ul li').each((_, li) => {
    const text = $(li).text().replace(/\s+/g, ' ').trim();
    if (text.length >= 3 && text.length <= 180) {
      bulletLines.push(text);
    }
  });

  const variants: string[] = [];
  $('select option').each((_, option) => {
    const variant = $(option).text().trim();
    if (variant && !/choose|select|default/i.test(variant)) {
      variants.push(variant);
    }
  });

  return {
    title: title || undefined,
    description: description || undefined,
    sku: sku || undefined,
    brand: brand || undefined,
    stockText: stockText || undefined,
    variants: variants.length ? [...new Set(variants)] : undefined,
    specificationPairs,
    bulletLines: [...new Set(bulletLines)]
  };
};
