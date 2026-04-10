import { NextRequest, NextResponse } from 'next/server';
import { deploymentFriendlyScraperService } from '@/services/DeploymentFriendlyScraperService';
import { persistNormalizedProducts } from '@/services/scraper/persistence';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { vendor, category, test = false } = await request.json();

    if (test) {
      const result = await deploymentFriendlyScraperService.testScraping(vendor, category);
      return NextResponse.json(result);
    }

    const job = await prisma.scrapingJob.create({
      data: {
        vendor: vendor || 'all',
        category: category || 'all',
        status: 'PENDING'
      }
    });

    void scrapeInBackground(job.id, vendor, category);

    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id,
      info: 'Using modular pipeline scraper (deployment-safe)'
    });
  } catch (error) {
    console.error('Error starting deployment-friendly scraping job:', error);
    return NextResponse.json({ error: 'Failed to start scraping job' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'vendors') {
      return NextResponse.json({
        vendors: deploymentFriendlyScraperService.getAvailableVendors(),
        categories: ['motors', 'frames', 'stacks', 'cameras', 'props', 'batteries']
      });
    }

    const jobs = await prisma.scrapingJob.findMany({
      where: {
        category: {
          not: 'sitemap-based'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching deployment-friendly scraping jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch scraping jobs' }, { status: 500 });
  }
}

async function scrapeInBackground(jobId: string, vendor?: string, category?: string) {
  try {
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    let metadata;

    if (vendor && category) {
      metadata = await deploymentFriendlyScraperService.scrapeCategoryWithMetadata(vendor, category, 120);
    } else if (vendor) {
      const config = deploymentFriendlyScraperService.getVendorConfig(vendor);
      if (!config) {
        throw new Error(`Vendor ${vendor} not configured`);
      }

      const allRecords = [];
      let pages = 0;
      let raw = 0;
      let low = 0;
      let invalid = 0;

      for (const categoryKey of Object.keys(config.categories)) {
        const categoryResult = await deploymentFriendlyScraperService.scrapeCategoryWithMetadata(vendor, categoryKey, 80);
        allRecords.push(...categoryResult.records);
        pages += categoryResult.listingPagesVisited;
        raw += categoryResult.rawCount;
        low += categoryResult.lowConfidenceCount;
        invalid += categoryResult.invalidCount;
      }

      metadata = {
        vendor,
        sourceCategory: 'all',
        listingPagesVisited: pages,
        rawCount: raw,
        normalizedCount: allRecords.length,
        dedupedCount: allRecords.length,
        lowConfidenceCount: low,
        invalidCount: invalid,
        records: allRecords,
        deduped: []
      };
    } else {
      metadata = await deploymentFriendlyScraperService.scrapeAllVendorsWithMetadata(120);
    }

    const persisted = await persistNormalizedProducts(metadata.records);

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        productsFound: metadata.records.length,
        productsCreated: persisted.productsCreated,
        productsUpdated: persisted.productsUpdated,
        errorMessage: metadata.lowConfidenceCount > 0
          ? `${metadata.lowConfidenceCount} low-confidence records flagged for manual review.`
          : metadata.invalidCount > 0
            ? `${metadata.invalidCount} records missed required category fields.`
            : null
      }
    });
  } catch (error) {
    console.error('Deployment-friendly scraping job failed:', error);

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown scraper error'
      }
    });
  }
}
