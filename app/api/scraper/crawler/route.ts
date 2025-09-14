import { NextRequest, NextResponse } from 'next/server';
import { webCrawlerService } from '@/services/WebCrawlerService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { vendor, maxPages = 500 } = await request.json();

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor is required' },
        { status: 400 }
      );
    }

    // Validate vendor
    const availableVendors = webCrawlerService.getAvailableVendors();
    if (!availableVendors.includes(vendor)) {
      return NextResponse.json(
        { error: `Vendor must be one of: ${availableVendors.join(', ')}` },
        { status: 400 }
      );
    }

    // Create scraping job record
    const scrapingJob = await prisma.scrapingJob.create({
      data: {
        vendor,
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // Start crawling in background
    webCrawlerService.crawlVendor(vendor, maxPages)
      .then(async (products) => {
        console.log(`Crawler found ${products.length} products from ${vendor}`);

        // Process products and save to database
        let savedCount = 0;
        let updatedCount = 0;

        for (const product of products) {
          try {
            // Check if vendor exists, create if not
            let vendorRecord = await prisma.vendor.findUnique({
              where: { name: vendor }
            });

            if (!vendorRecord) {
              vendorRecord = await prisma.vendor.create({
                data: {
                  name: vendor,
                  website: product.url.split('/').slice(0, 3).join('/'),
                  isActive: true
                }
              });
            }

            // Improved deduplication logic - check by URL first (most unique), then name+category
            const existingProduct = await prisma.product.findFirst({
              where: {
                OR: [
                  // First priority: SKU match (if available and reliable)
                  ...(product.sku ? [{
                    sku: product.sku,
                    category: product.category
                  }] : []),
                  // Second priority: exact name and category match
                  {
                    name: product.name,
                    category: product.category
                  }
                ]
              },
              include: {
                vendorPrices: {
                  where: { vendorId: vendorRecord.id }
                }
              }
            });

            console.log(`🔍 Deduplication check for "${product.name}" (${product.category}):`, {
              sku: product.sku,
              foundExisting: !!existingProduct,
              existingId: existingProduct?.id,
              hasVendorPrice: (existingProduct?.vendorPrices?.length || 0) > 0
            });

            if (existingProduct) {
              console.log(`📦 Updating existing product: "${product.name}" (ID: ${existingProduct.id})`);
              
              // Merge specifications - preserve existing specs and add new ones
              const existingSpecs = (existingProduct.specifications as Record<string, unknown>) || {};
              const newSpecs = product.specifications || {};
              const mergedSpecs = { ...existingSpecs, ...newSpecs };
              
              console.log(`📊 Merging specs for "${product.name}":`, {
                existing: existingSpecs,
                new: newSpecs,
                merged: mergedSpecs
              });

              // Update product with enhanced specifications
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                  description: product.description || existingProduct.description,
                  imageUrl: product.imageUrl || existingProduct.imageUrl,
                  brand: product.brand || existingProduct.brand,
                  sku: product.sku || existingProduct.sku,
                  specifications: JSON.parse(JSON.stringify(mergedSpecs))
                }
              });

              // Update or create vendor price
              const existingVendorPrice = existingProduct.vendorPrices[0];
              if (existingVendorPrice) {
                // Update existing vendor price
                await prisma.vendorPrice.update({
                  where: { id: existingVendorPrice.id },
                  data: {
                    price: product.price,
                    inStock: product.inStock,
                    url: product.url,
                    lastUpdated: new Date()
                  }
                });

                // Create price history entry if price changed
                if (existingVendorPrice.price !== product.price) {
                  await prisma.priceHistory.create({
                    data: {
                      productId: existingProduct.id,
                      vendorId: vendorRecord.id,
                      price: product.price,
                      timestamp: new Date()
                    }
                  });
                }
              } else {
                // Create new vendor price
                await prisma.vendorPrice.create({
                  data: {
                    productId: existingProduct.id,
                    vendorId: vendorRecord.id,
                    price: product.price,
                    url: product.url,
                    inStock: product.inStock
                  }
                });

                // Create initial price history entry
                await prisma.priceHistory.create({
                  data: {
                    productId: existingProduct.id,
                    vendorId: vendorRecord.id,
                    price: product.price,
                    timestamp: new Date()
                  }
                });
              }

              updatedCount++;
            } else {
              console.log(`✨ Creating new product: "${product.name}" (${product.category}) with specs:`, product.specifications);
              
              // Create new product with specifications
              const newProduct = await prisma.product.create({
                data: {
                  name: product.name,
                  category: product.category,
                  description: product.description,
                  imageUrl: product.imageUrl,
                  sku: product.sku,
                  brand: product.brand,
                  specifications: product.specifications ? JSON.parse(JSON.stringify(product.specifications)) : {}
                }
              });

              // Create vendor price
              await prisma.vendorPrice.create({
                data: {
                  productId: newProduct.id,
                  vendorId: vendorRecord.id,
                  price: product.price,
                  url: product.url,
                  inStock: product.inStock
                }
              });

              // Create initial price history entry
              await prisma.priceHistory.create({
                data: {
                  productId: newProduct.id,
                  vendorId: vendorRecord.id,
                  price: product.price,
                  timestamp: new Date()
                }
              });

              savedCount++;
            }
          } catch (error) {
            console.error(`Error saving product ${product.name}:`, error);
          }
        }

        // Update scraping job
        await prisma.scrapingJob.update({
          where: { id: scrapingJob.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            productsFound: products.length,
            productsCreated: savedCount,
            productsUpdated: updatedCount
          }
        });

        console.log(`Crawler job completed: ${savedCount} new products, ${updatedCount} updated products`);
      })
      .catch(async (error) => {
        console.error(`Crawler error for ${vendor}:`, error);
        
        // Update scraping job with error
        await prisma.scrapingJob.update({
          where: { id: scrapingJob.id },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            errorMessage: error.message
          }
        });
      })
      .finally(() => {
        webCrawlerService.cleanup();
      });

    return NextResponse.json({
      message: `Web crawler started for ${vendor}`,
      jobId: scrapingJob.id,
      maxPages
    });

  } catch (error) {
    console.error('Crawler API error:', error);
    return NextResponse.json(
      { error: 'Failed to start web crawler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get('vendor');

    if (vendor) {
      // Get available vendors for specific vendor
      const availableVendors = webCrawlerService.getAvailableVendors();
      if (!availableVendors.includes(vendor)) {
        return NextResponse.json(
          { error: `Vendor ${vendor} not available for crawling` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        vendor,
        available: true,
        message: `Crawler available for ${vendor}`
      });
    }

    // Get all available vendors
    const vendors = webCrawlerService.getAvailableVendors();
    
    return NextResponse.json({
      vendors,
      count: vendors.length
    });

  } catch (error) {
    console.error('Crawler API error:', error);
    return NextResponse.json(
      { error: 'Failed to get crawler information' },
      { status: 500 }
    );
  }
}
