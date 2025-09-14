import { NextRequest, NextResponse } from 'next/server';
import { sitemapScraperService } from '@/services/SitemapScraperService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('POST route called');
    const { vendor, maxProducts = 500 } = await request.json();
    console.log('Received vendor:', vendor, 'maxProducts:', maxProducts);

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor is required' },
        { status: 400 }
      );
    }

    console.log('Creating scraping job...');
    // Create a scraping job
    const job = await prisma.scrapingJob.create({
      data: {
        vendor,
        category: 'sitemap-based',
        status: 'PENDING'
      }
    });
    console.log('Created job:', job.id);

    // Start scraping in the background
    scrapeFromSitemapInBackground(job.id, vendor, maxProducts);

    return NextResponse.json({
      message: 'Sitemap-based scraping job started',
      jobId: job.id,
      vendor,
      maxProducts
    });
  } catch (error) {
    console.error('Error starting sitemap scraping job:', error);
    return NextResponse.json(
      { error: 'Failed to start sitemap scraping job' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const availableVendors = sitemapScraperService.getAvailableVendors();
    
    return NextResponse.json({
      availableVendors,
      description: 'Sitemap-based scraper discovers products automatically from vendor sitemaps'
    });
  } catch (error) {
    console.error('Error getting sitemap scraper info:', error);
    return NextResponse.json(
      { error: 'Failed to get sitemap scraper info' },
      { status: 500 }
    );
  }
}

async function scrapeFromSitemapInBackground(jobId: string, vendor: string, maxProducts: number) {
  try {
    // Update job status to running
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    console.log(`Starting sitemap-based scrape for ${vendor} (max ${maxProducts} products)`);
    
    const products = await sitemapScraperService.scrapeVendorFromSitemap(vendor, maxProducts);
    
    let productsCreated = 0;
    let productsUpdated = 0;

    // Process and save products to database
    for (const scrapedProduct of products) {
      try {
        // First, ensure vendor exists
        const vendorRecord = await prisma.vendor.upsert({
          where: { name: scrapedProduct.vendor },
          update: {},
          create: {
            name: scrapedProduct.vendor,
            website: getVendorWebsite(scrapedProduct.vendor)
          }
        });

        // Find or create product - improved deduplication logic
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              // Exact match by SKU if available (most reliable)
              ...(scrapedProduct.sku ? [{
                sku: scrapedProduct.sku,
                category: scrapedProduct.category
              }] : []),
              // Exact name match from same category (but without requiring existing vendor price)
              {
                name: scrapedProduct.name,
                category: scrapedProduct.category
              }
            ]
          },
          include: {
            vendorPrices: {
              where: {
                vendor: {
                  name: scrapedProduct.vendor
                }
              }
            }
          }
        });

        let product;
        if (existingProduct) {
          // Update existing product
          console.log(`📦 Updating existing product: "${scrapedProduct.name}" (ID: ${existingProduct.id}) - Has ${existingProduct.vendorPrices.length} existing vendor prices`);
          
          // Merge specifications - preserve existing and add new
          const existingSpecs = (existingProduct.specifications as Record<string, unknown>) || {};
          const newSpecs = scrapedProduct.specifications || {};
          const mergedSpecs = { ...existingSpecs, ...newSpecs };
          
          console.log(`📊 Merging specs for "${scrapedProduct.name}":`, {
            existing: existingSpecs,
            new: newSpecs,
            merged: mergedSpecs
          });
          
          product = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              brand: scrapedProduct.brand || existingProduct.brand,
              sku: scrapedProduct.sku || existingProduct.sku,
              description: scrapedProduct.description || existingProduct.description,
              imageUrl: scrapedProduct.imageUrl || existingProduct.imageUrl,
              specifications: JSON.parse(JSON.stringify(mergedSpecs))
            }
          });
          productsUpdated++;
          console.log(`📦 Updated: ${scrapedProduct.name} (${scrapedProduct.vendor}) - Final specs: ${JSON.stringify(mergedSpecs)}`);
        } else {
          // Create new product
          console.log(`✨ Creating new product: "${scrapedProduct.name}" (${scrapedProduct.category}) - Specs: ${JSON.stringify(scrapedProduct.specifications)}`);
          product = await prisma.product.create({
            data: {
              name: scrapedProduct.name,
              category: scrapedProduct.category,
              brand: scrapedProduct.brand,
              sku: scrapedProduct.sku,
              description: scrapedProduct.description,
              imageUrl: scrapedProduct.imageUrl,
              specifications: scrapedProduct.specifications ? JSON.parse(JSON.stringify(scrapedProduct.specifications)) : {}
            }
          });
          productsCreated++;
          console.log(`✨ Created: ${scrapedProduct.name} (${scrapedProduct.vendor}) - Specs: ${JSON.stringify(scrapedProduct.specifications)}`);
        }

        // Update or create vendor price
        await prisma.vendorPrice.upsert({
          where: {
            productId_vendorId: {
              productId: product.id,
              vendorId: vendorRecord.id
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
            vendorId: vendorRecord.id,
            price: scrapedProduct.price,
            url: scrapedProduct.url,
            inStock: scrapedProduct.inStock
          }
        });

        // Add to price history
        await prisma.priceHistory.create({
          data: {
            productId: product.id,
            vendorId: vendorRecord.id,
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

    console.log(`Sitemap scraping completed for ${vendor}: ${products.length} products found, ${productsCreated} created, ${productsUpdated} updated`);

  } catch (error) {
    console.error('Sitemap scraping job failed:', error);
    
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
    await sitemapScraperService.cleanup();
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
