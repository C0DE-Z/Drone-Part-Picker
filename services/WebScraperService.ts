import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScrapedProduct, ScraperConfig, VendorPrice } from '@/types/drone';

export class WebScraperService {
  private browser: Browser | null = null;
  private scraperConfigs: ScraperConfig[] = [];

  constructor() {
    this.initializeScraperConfigs();
  }

  private initializeScraperConfigs() {
    this.scraperConfigs = [
      {
        vendor: 'GetFPV',
        baseUrl: 'https://www.getfpv.com',
        rateLimit: 2000,
        categories: {
          motors: {
            url: '/motors',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          },
          frames: {
            url: '/frames',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          },
          flight_controllers: {
            url: '/flight-controllers',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          },
          cameras: {
            url: '/fpv-cameras',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          },
          propellers: {
            url: '/propellers',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          },
          batteries: {
            url: '/batteries',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item-title a',
              price: '.price',
              url: '.product-item-title a',
              inStock: '.stock-status',
              image: '.product-item-photo img',
              sku: '.sku',
              brand: '.brand'
            }
          }
        }
      },
      {
        vendor: 'RDQ',
        baseUrl: 'https://www.racedayquads.com',
        rateLimit: 1500,
        categories: {
          motors: {
            url: '/collections/motors',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__title a',
              inStock: '.product-item__inventory',
              image: '.product-item__image img'
            }
          },
          frames: {
            url: '/collections/frames',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__title a',
              inStock: '.product-item__inventory',
              image: '.product-item__image img'
            }
          }
        }
      }
    ];
  }

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  async scrapeCategory(vendor: string, category: string): Promise<ScrapedProduct[]> {
    const config = this.scraperConfigs.find(c => c.vendor === vendor);
    if (!config || !config.categories[category]) {
      throw new Error(`Configuration not found for vendor: ${vendor}, category: ${category}`);
    }

    await this.initializeBrowser();
    const page = await this.browser!.newPage();
    
    try {
      // Set user agent to avoid bot detection
      await page.setUserAgent(config.userAgent || 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const categoryConfig = config.categories[category];
      const url = `${config.baseUrl}${categoryConfig.url}`;
      
      console.log(`Scraping ${vendor} - ${category}: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      await this.delay(config.rateLimit);

      const content = await page.content();
      const $ = cheerio.load(content);
      
      const products: ScrapedProduct[] = [];
      
      $(categoryConfig.selectors.productContainer).each((index, element) => {
        try {
          const $el = $(element);
          
          const name = $el.find(categoryConfig.selectors.name).text().trim();
          const priceText = $el.find(categoryConfig.selectors.price).text().trim();
          const price = this.parsePrice(priceText);
          const relativeUrl = $el.find(categoryConfig.selectors.url).attr('href') || '';
          const productUrl = this.normalizeUrl(relativeUrl, config.baseUrl);
          const stockText = $el.find(categoryConfig.selectors.inStock).text().trim().toLowerCase();
          const inStock = !stockText.includes('out of stock') && !stockText.includes('sold out');
          
          // Optional fields
          const imageUrl = $el.find(categoryConfig.selectors.image || '').attr('src') || '';
          const sku = $el.find(categoryConfig.selectors.sku || '').text().trim();
          const brand = $el.find(categoryConfig.selectors.brand || '').text().trim();

          if (name && price > 0) {
            products.push({
              name,
              price,
              url: productUrl,
              vendor: config.vendor,
              inStock,
              imageUrl: imageUrl ? this.normalizeUrl(imageUrl, config.baseUrl) : undefined,
              sku: sku || undefined,
              brand: brand || undefined,
              category: this.mapCategoryToType(category),
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.error(`Error parsing product ${index}:`, error);
        }
      });

      return products;
    } catch (error) {
      console.error(`Error scraping ${vendor} ${category}:`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  private mapCategoryToType(category: string): 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' {
    const mapping: Record<string, 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery'> = {
      motors: 'motor',
      frames: 'frame',
      flight_controllers: 'stack',
      cameras: 'camera',
      propellers: 'prop',
      batteries: 'battery'
    };
    return mapping[category] || 'motor';
  }

  async scrapeProductDetails(url: string): Promise<Partial<ScrapedProduct>> {
    await this.initializeBrowser();
    const page = await this.browser!.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract detailed specifications based on vendor
      const specifications: Record<string, string> = {};
      
      // Common selectors for product details
      $('.product-specifications tr, .product-details tr, .spec-table tr').each((_, row) => {
        const $row = $(row);
        const key = $row.find('td:first-child, th:first-child').text().trim();
        const value = $row.find('td:last-child, td:nth-child(2)').text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      });

      // Extract description
      const description = $('.product-description, .product-details-description').text().trim();

      return {
        specifications,
        description: description || undefined
      };
    } catch (error) {
      console.error(`Error scraping product details from ${url}:`, error);
      return {};
    } finally {
      await page.close();
    }
  }

  async scrapeAllVendors(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    
    for (const config of this.scraperConfigs) {
      console.log(`Starting scrape for vendor: ${config.vendor}`);
      
      for (const categoryName of Object.keys(config.categories)) {
        try {
          const products = await this.scrapeCategory(config.vendor, categoryName);
          allProducts.push(...products);
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
    
    return allProducts;
  }

  async findProductsByName(searchTerm: string, category?: string): Promise<ScrapedProduct[]> {
    const allProducts = await this.scrapeAllVendors();
    
    return allProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = !category || product.category === category;
      return nameMatch && categoryMatch;
    });
  }

  async getPriceComparison(productName: string): Promise<VendorPrice[]> {
    const products = await this.findProductsByName(productName);
    
    return products.map(product => ({
      vendor: product.vendor,
      price: product.price,
      url: product.url,
      inStock: product.inStock,
      lastUpdated: product.lastUpdated
    }));
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }

  // Public method to get scraper configs
  getScraperConfigs(): ScraperConfig[] {
    return this.scraperConfigs;
  }

  // Get vendor configuration
  getVendorConfig(vendorName: string): ScraperConfig | undefined {
    return this.scraperConfigs.find(config => config.vendor === vendorName);
  }
}

export const webScraperService = new WebScraperService();
