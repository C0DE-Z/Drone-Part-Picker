import { NextRequest, NextResponse } from 'next/server';
import { deploymentFriendlyScraperService } from '@/services/DeploymentFriendlyScraperService';
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

    scrapeInBackground(job.id, vendor, category);

    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id,
      info: 'Using deployment-friendly scraper (no browser required)'
    });
  } catch (error) {
    console.error('Error starting scraping job:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const vendor = searchParams.get('vendor');
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    if (action === 'vendors') {
      const vendors = ['GetFPV', 'RDQ'];
      const categories = ['motors', 'props', 'frames'];
      return NextResponse.json({ vendors, categories });
    }

    const where: Record<string, unknown> = {};
    if (jobId) where.id = jobId;
    if (vendor) where.vendor = vendor;
    if (status) where.status = status;

    const jobs = await prisma.scrapingJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching scraping jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scraping jobs' },
      { status: 500 }
    );
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

    let products;
    
    if (vendor && category) {
      console.log(`Scraping ${vendor} ${category}`);
      products = await deploymentFriendlyScraperService.scrapeCategory(vendor, category, 100);
    } else if (vendor) {
      console.log(`Scraping all categories for ${vendor}`);
      const vendorConfig = deploymentFriendlyScraperService.getVendorConfig(vendor);
      if (!vendorConfig) {
        throw new Error(`Vendor ${vendor} not found`);
      }
      
      products = [];
      for (const categoryName of Object.keys(vendorConfig.categories)) {
        try {
          const categoryProducts = await deploymentFriendlyScraperService.scrapeCategory(vendor, categoryName, 50);
          products.push(...categoryProducts);
          console.log(`${vendor} ${categoryName}: ${categoryProducts.length} products`);
        } catch (error) {
          console.error(`Error scraping ${vendor} ${categoryName}:`, error);
        }
      }
    } else {
      console.log('Scraping all vendors');
      products = await deploymentFriendlyScraperService.scrapeAllVendors();
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    let errors = 0;

    console.log(`Processing ${products.length} scraped products`);

    for (const scrapedProduct of products) {
      try {
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
              { name: scrapedProduct.name },
              { sku: scrapedProduct.sku }
            ].filter(condition => Object.values(condition)[0]) // Filter out empty conditions
          }
        });

        let product;
        if (existingProduct) {
          product = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              brand: scrapedProduct.brand || existingProduct.brand,
              sku: scrapedProduct.sku || existingProduct.sku,
              description: scrapedProduct.description || existingProduct.description,
              imageUrl: scrapedProduct.imageUrl || existingProduct.imageUrl,
              specifications: scrapedProduct.specifications || existingProduct.specifications || {},
              updatedAt: new Date()
            }
          });
          productsUpdated++;
        } else {
          product = await prisma.product.create({
            data: {
              name: scrapedProduct.name,
              category: scrapedProduct.category,
              brand: scrapedProduct.brand || '',
              sku: scrapedProduct.sku || '',
              description: scrapedProduct.description || '',
              imageUrl: scrapedProduct.imageUrl || '',
              specifications: scrapedProduct.specifications || {}
            }
          });
          productsCreated++;
        }

        await prisma.vendorPrice.upsert({
          where: {
            productId_vendorId: {
              productId: product.id,
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
            productId: product.id,
            vendorId: vendor.id,
            price: scrapedProduct.price,
            url: scrapedProduct.url,
            inStock: scrapedProduct.inStock
          }
        });

        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            vendorId: vendor.id,
            price: scrapedProduct.price
          }
        });
      } catch (productError) {
        console.error(`Error processing product ${scrapedProduct.name}:`, productError);
        errors++;
      }
    }

    const completionMessage = `Processed ${products.length} products: ${productsCreated} created, ${productsUpdated} updated, ${errors} errors`;
    console.log(completionMessage);

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        productsFound: products.length,
        productsCreated,
        productsUpdated,
        errorMessage: errors > 0 ? `${errors} products had errors` : null
      }
    });

  } catch (error) {
    console.error('Scraping job failed:', error);
    
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

function getVendorWebsite(vendorName: string): string {
  const vendorWebsites: Record<string, string> = {
    'GetFPV': 'https://www.getfpv.com',
    'RDQ': 'https://www.racedayquads.com',
    'PyrodroneFPV': 'https://pyrodrone.com',
    'HobbyKing': 'https://hobbyking.com'
  };
  
  return vendorWebsites[vendorName] || '';
}