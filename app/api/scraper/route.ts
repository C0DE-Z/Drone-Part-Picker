import { NextRequest, NextResponse } from 'next/server';
import { webScraperService } from '@/services/WebScraperService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { vendor, category } = await request.json();

    // Create a new scraping job
    const job = await prisma.scrapingJob.create({
      data: {
        vendor: vendor || 'all',
        category,
        status: 'PENDING'
      }
    });

    // Start scraping in the background
    scrapeInBackground(job.id, vendor, category);

    return NextResponse.json({
      message: 'Scraping job started',
      jobId: job.id
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
    // Update job status to running
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    let products;
    if (vendor && category) {
      products = await webScraperService.scrapeCategory(vendor, category);
    } else if (vendor) {
      // Scrape all categories for specific vendor
      const vendorConfig = webScraperService.getVendorConfig(vendor);
      if (!vendorConfig) {
        throw new Error(`Vendor ${vendor} not found`);
      }
      
      products = [];
      for (const categoryName of Object.keys(vendorConfig.categories)) {
        const categoryProducts = await webScraperService.scrapeCategory(vendor, categoryName);
        products.push(...categoryProducts);
      }
    } else {
      // Scrape all vendors and categories
      products = await webScraperService.scrapeAllVendors();
    }

    let productsCreated = 0;
    let productsUpdated = 0;

    // Process and save products to database
    for (const scrapedProduct of products) {
      try {
        // First, ensure vendor exists
        const vendor = await prisma.vendor.upsert({
          where: { name: scrapedProduct.vendor },
          update: {},
          create: {
            name: scrapedProduct.vendor,
            website: getVendorWebsite(scrapedProduct.vendor)
          }
        });

        // Find or create product
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: scrapedProduct.name,
            category: scrapedProduct.category
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
              specifications: scrapedProduct.specifications || existingProduct.specifications || {}
            }
          });
          productsUpdated++;
        } else {
          product = await prisma.product.create({
            data: {
              name: scrapedProduct.name,
              category: scrapedProduct.category,
              brand: scrapedProduct.brand,
              sku: scrapedProduct.sku,
              description: scrapedProduct.description,
              imageUrl: scrapedProduct.imageUrl,
              specifications: scrapedProduct.specifications
            }
          });
          productsCreated++;
        }

        // Update or create vendor price
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

        // Add to price history
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            vendorId: vendor.id,
            price: scrapedProduct.price
          }
        });
      } catch (productError) {
        console.error(`Error processing product ${scrapedProduct.name}:`, productError);
      }
    }

    // Update job as completed
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        productsFound: products.length,
        productsCreated,
        productsUpdated
      }
    });

  } catch (error) {
    console.error('Scraping job failed:', error);
    
    // Update job as failed
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  } finally {
    // Clean up browser resources
    await webScraperService.cleanup();
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
