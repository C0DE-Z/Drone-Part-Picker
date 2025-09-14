import * as cron from 'node-cron';
import { webScraperService } from './WebScraperService';
import { prisma } from '@/lib/prisma';
import { ScrapedProduct } from '@/types/drone';

class ScheduledScrapingService {
  private isRunning = false;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduledJobs();
  }

  private initializeScheduledJobs() {
    // Schedule daily full scrape at 3 AM
    const dailyJob = cron.schedule('0 3 * * *', async () => {
      console.log('Starting scheduled daily scrape at 3 AM');
      await this.runFullScrape();
    }, {
      timezone: 'America/New_York'
    });

    // Schedule hourly price updates during business hours (9 AM - 9 PM)
    const hourlyJob = cron.schedule('0 9-21 * * *', async () => {
      console.log('Starting scheduled hourly price update');
      await this.runPriceUpdate();
    }, {
      timezone: 'America/New_York'
    });

    this.jobs.set('daily', dailyJob);
    this.jobs.set('hourly', hourlyJob);
  }

  startScheduledJobs() {
    console.log('Starting scheduled scraping jobs');
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started ${name} scraping job`);
    });
  }

  stopScheduledJobs() {
    console.log('Stopping scheduled scraping jobs');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} scraping job`);
    });
  }

  private async runFullScrape() {
    if (this.isRunning) {
      console.log('Scraping already in progress, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      // Create scraping job record
      const job = await prisma.scrapingJob.create({
        data: {
          vendor: 'all',
          category: 'all',
          status: 'RUNNING',
          startedAt: startTime
        }
      });

      console.log(`Starting full scrape job ${job.id}`);

      // Get all vendor configurations
      const configs = webScraperService.getScraperConfigs();
      let totalProducts = 0;
      let totalCreated = 0;
      let totalUpdated = 0;

      for (const config of configs) {
        console.log(`Scraping vendor: ${config.vendor}`);
        
        for (const categoryName of Object.keys(config.categories)) {
          try {
            const products = await webScraperService.scrapeCategory(config.vendor, categoryName);
            const { created, updated } = await this.saveProducts(products);
            
            totalProducts += products.length;
            totalCreated += created;
            totalUpdated += updated;
            
            console.log(`Scraped ${products.length} products from ${config.vendor} ${categoryName}`);
            
            // Rate limiting between categories
            await this.delay(config.rateLimit);
          } catch (error) {
            console.error(`Error scraping ${config.vendor} ${categoryName}:`, error);
          }
        }
        
        // Longer delay between vendors
        await this.delay(5000);
      }

      // Update job as completed
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          productsFound: totalProducts,
          productsCreated: totalCreated,
          productsUpdated: totalUpdated
        }
      });

      console.log(`Full scrape completed: ${totalProducts} products found, ${totalCreated} created, ${totalUpdated} updated`);
    } catch (error) {
      console.error('Full scrape failed:', error);
    } finally {
      this.isRunning = false;
      await webScraperService.cleanup();
    }
  }

  private async runPriceUpdate() {
    if (this.isRunning) {
      console.log('Scraping already in progress, skipping price update');
      return;
    }

    this.isRunning = true;

    try {
      console.log('Starting price update scrape');
      
      // Get a sample of popular products to update prices more frequently
      const popularProducts = await prisma.product.findMany({
        take: 100,
        include: {
          vendorPrices: {
            include: {
              vendor: true
            }
          }
        },
        orderBy: [
          { updatedAt: 'asc' }, // Prioritize products that haven't been updated recently
        ]
      });

      let updated = 0;
      
      for (const product of popularProducts) {
        try {
          for (const vendorPrice of product.vendorPrices) {
            // Re-scrape specific product page for updated price
            const productDetails = await webScraperService.scrapeProductDetails(vendorPrice.url);
            
            if (productDetails.specifications) {
              // Update product specifications if new data found
              await prisma.product.update({
                where: { id: product.id },
                data: {
                  specifications: productDetails.specifications
                }
              });
            }
            
            updated++;
          }
          
          // Small delay between products
          await this.delay(500);
        } catch (error) {
          console.error(`Error updating product ${product.name}:`, error);
        }
      }

      console.log(`Price update completed: ${updated} products updated`);
    } catch (error) {
      console.error('Price update failed:', error);
    } finally {
      this.isRunning = false;
      await webScraperService.cleanup();
    }
  }

  private async saveProducts(scrapedProducts: ScrapedProduct[]) {
    let created = 0;
    let updated = 0;

    for (const scrapedProduct of scrapedProducts) {
      try {
        // Ensure vendor exists
        const vendor = await prisma.vendor.upsert({
          where: { name: scrapedProduct.vendor },
          update: {},
          create: {
            name: scrapedProduct.vendor,
            website: this.getVendorWebsite(scrapedProduct.vendor)
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
          updated++;
        } else {
          product = await prisma.product.create({
            data: {
              name: scrapedProduct.name,
              category: scrapedProduct.category,
              brand: scrapedProduct.brand,
              sku: scrapedProduct.sku,
              description: scrapedProduct.description,
              imageUrl: scrapedProduct.imageUrl,
              specifications: scrapedProduct.specifications || {}
            }
          });
          created++;
        }

        // Update vendor price
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
      } catch (error) {
        console.error(`Error saving product ${scrapedProduct.name}:`, error);
      }
    }

    return { created, updated };
  }

  private getVendorWebsite(vendorName: string): string {
    const vendorWebsites: Record<string, string> = {
      'GetFPV': 'https://www.getfpv.com',
      'RDQ': 'https://www.racedayquads.com',
      'PyrodroneFPV': 'https://pyrodrone.com',
      'HobbyKing': 'https://hobbyking.com'
    };
    
    return vendorWebsites[vendorName] || '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger methods
  async triggerFullScrape() {
    console.log('Manually triggering full scrape');
    await this.runFullScrape();
  }

  async triggerPriceUpdate() {
    console.log('Manually triggering price update');
    await this.runPriceUpdate();
  }

  getJobStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.jobs.keys()).map(name => ({
        name,
        exists: !!this.jobs.get(name)
      }))
    };
  }
}

export const scheduledScrapingService = new ScheduledScrapingService();
