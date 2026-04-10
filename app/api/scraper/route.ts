import { NextRequest, NextResponse } from 'next/server';
import { deploymentFriendlyScraperService } from '@/services/DeploymentFriendlyScraperService';
import { webScraperService } from '@/services/WebScraperService';
import { prisma } from '@/lib/prisma';
import { persistNormalizedProducts } from '@/services/scraper/persistence';
import { NormalizedProductRecord } from '@/services/scraper/types';
import { ScrapedProduct } from '@/types/drone';
import { Prisma } from '@prisma/client';

const getVendorWebsite = (vendorName: string): string => {
  const vendorWebsites: Record<string, string> = {
    GetFPV: 'https://www.getfpv.com',
    RDQ: 'https://www.racedayquads.com',
    PyrodDrone: 'https://pyrodrone.com',
    HobbyKing: 'https://hobbyking.com'
  };

  return vendorWebsites[vendorName] || '';
};

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const persistLegacyScrapedProducts = async (products: ScrapedProduct[]) => {
  let productsCreated = 0;
  let productsUpdated = 0;

  for (const scrapedProduct of products) {
    if (!scrapedProduct?.name || !scrapedProduct.url || !scrapedProduct.price || scrapedProduct.price <= 0) {
      continue;
    }

    const vendor = await prisma.vendor.upsert({
      where: { name: scrapedProduct.vendor },
      update: {},
      create: {
        name: scrapedProduct.vendor,
        website: getVendorWebsite(scrapedProduct.vendor)
      }
    });

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          ...(scrapedProduct.sku
            ? [{ sku: scrapedProduct.sku, category: scrapedProduct.category || 'motor' }]
            : []),
          {
            name: scrapedProduct.name,
            category: scrapedProduct.category || 'motor'
          }
        ]
      }
    });

    let productId: string;

    if (existingProduct) {
      const mergedSpecs = {
        ...((existingProduct.specifications as Record<string, unknown>) || {}),
        ...(scrapedProduct.specifications || {})
      };

      const updated = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: scrapedProduct.name,
          category: scrapedProduct.category || 'motor',
          brand: scrapedProduct.brand || existingProduct.brand,
          sku: scrapedProduct.sku || existingProduct.sku,
          description: scrapedProduct.description || existingProduct.description,
          imageUrl: scrapedProduct.imageUrl || existingProduct.imageUrl,
          specifications: asJson(mergedSpecs) as Prisma.InputJsonValue
        }
      });

      productId = updated.id;
      productsUpdated += 1;
    } else {
      const created = await prisma.product.create({
        data: {
          name: scrapedProduct.name,
          category: scrapedProduct.category || 'motor',
          brand: scrapedProduct.brand,
          sku: scrapedProduct.sku,
          description: scrapedProduct.description,
          imageUrl: scrapedProduct.imageUrl,
          specifications: asJson(scrapedProduct.specifications || {}) as Prisma.InputJsonValue
        }
      });

      productId = created.id;
      productsCreated += 1;
    }

    await prisma.vendorPrice.upsert({
      where: {
        productId_vendorId: {
          productId,
          vendorId: vendor.id
        }
      },
      update: {
        price: scrapedProduct.price,
        url: scrapedProduct.url,
        inStock: scrapedProduct.inStock,
        lastUpdated: new Date()
      },
      create: {
        productId,
        vendorId: vendor.id,
        price: scrapedProduct.price,
        url: scrapedProduct.url,
        inStock: scrapedProduct.inStock
      }
    });

    await prisma.priceHistory.create({
      data: {
        productId,
        vendorId: vendor.id,
        price: scrapedProduct.price
      }
    });
  }

  return {
    productsCreated,
    productsUpdated
  };
};

const collectNormalizedRecords = async (
  vendor?: string,
  category?: string
): Promise<{ records: NormalizedProductRecord[]; lowConfidenceCount: number }> => {
  if (vendor && category) {
    const result = await deploymentFriendlyScraperService.scrapeCategoryWithMetadata(vendor, category, 150);
    return {
      records: result.records,
      lowConfidenceCount: result.lowConfidenceCount
    };
  }

  if (vendor) {
    const vendorConfig = deploymentFriendlyScraperService.getVendorConfig(vendor);
    if (!vendorConfig) {
      throw new Error(`Vendor ${vendor} not configured`);
    }

    const allRecords: NormalizedProductRecord[] = [];
    let lowConfidenceCount = 0;

    for (const categoryKey of Object.keys(vendorConfig.categories)) {
      const categoryResult = await deploymentFriendlyScraperService.scrapeCategoryWithMetadata(vendor, categoryKey, 80);
      allRecords.push(...categoryResult.records);
      lowConfidenceCount += categoryResult.lowConfidenceCount;
    }

    return {
      records: allRecords,
      lowConfidenceCount
    };
  }

  const result = await deploymentFriendlyScraperService.scrapeAllVendorsWithMetadata(120);
  return {
    records: result.records,
    lowConfidenceCount: result.lowConfidenceCount
  };
};

export async function POST(request: NextRequest) {
  try {
    const { vendor, category, usePuppeteer = false, test = false } = await request.json();

    if (test) {
      if (usePuppeteer) {
        return NextResponse.json({
          success: false,
          products: [],
          error: 'Puppeteer-based test is disabled for deployment mode.',
          scraperType: 'puppeteer'
        });
      }

      const result = await deploymentFriendlyScraperService.testScraping(vendor, category);
      return NextResponse.json({
        ...result,
        scraperType: 'pipeline'
      });
    }

    const job = await prisma.scrapingJob.create({
      data: {
        vendor: vendor || 'all',
        category: category || 'all',
        status: 'PENDING'
      }
    });

    void scrapeInBackground(job.id, vendor, category, usePuppeteer);

    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id,
      scraperType: usePuppeteer ? 'puppeteer' : 'modular-pipeline'
    });
  } catch (error) {
    console.error('Error starting scraping job:', error);
    return NextResponse.json({ error: 'Failed to start scraping job' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const vendor = searchParams.get('vendor');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (jobId) where.id = jobId;
    if (vendor) where.vendor = vendor;
    if (status) where.status = status;

    const jobs = await prisma.scrapingJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 25
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching scraping jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch scraping jobs' }, { status: 500 });
  }
}

async function scrapeInBackground(
  jobId: string,
  vendor?: string,
  category?: string,
  usePuppeteer = false
) {
  try {
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    let productsFound = 0;
    let productsCreated = 0;
    let productsUpdated = 0;
    let lowConfidenceCount = 0;

    if (usePuppeteer) {
      let legacyProducts: ScrapedProduct[] = [];

      if (vendor && category) {
        legacyProducts = await webScraperService.scrapeCategory(vendor, category);
      } else if (vendor) {
        const vendorConfig = webScraperService.getVendorConfig(vendor);
        if (!vendorConfig) throw new Error(`Vendor ${vendor} not found`);

        for (const categoryKey of Object.keys(vendorConfig.categories)) {
          const batch = await webScraperService.scrapeCategory(vendor, categoryKey);
          legacyProducts.push(...batch);
        }
      } else {
        legacyProducts = await webScraperService.scrapeAllVendors();
      }

      const persisted = await persistLegacyScrapedProducts(legacyProducts);
      productsFound = legacyProducts.length;
      productsCreated = persisted.productsCreated;
      productsUpdated = persisted.productsUpdated;
    } else {
      const collected = await collectNormalizedRecords(vendor, category);
      const persisted = await persistNormalizedProducts(collected.records);

      productsFound = collected.records.length;
      productsCreated = persisted.productsCreated;
      productsUpdated = persisted.productsUpdated;
      lowConfidenceCount = collected.lowConfidenceCount;
    }

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        productsFound,
        productsCreated,
        productsUpdated,
        errorMessage: lowConfidenceCount > 0
          ? `${lowConfidenceCount} low-confidence records were flagged for review.`
          : null
      }
    });
  } catch (error) {
    console.error('Scraping job failed:', error);

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown scraper error'
      }
    });
  } finally {
    if (usePuppeteer) {
      await webScraperService.cleanup();
    }
  }
}
