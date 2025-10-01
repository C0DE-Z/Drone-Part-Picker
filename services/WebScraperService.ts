import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScrapedProduct, ScraperConfig, VendorPrice } from '@/types/drone';

export class WebScraperService {
  private browser: Browser | null = null;
  private scraperConfigs: ScraperConfig[] = [];
  private retryAttempts = 3;
  private retryDelay = 2000;
  private maxConcurrency = 2;
  private requestQueue: Array<() => Promise<void>> = [];
  private activeRequests = 0;

  constructor() {
    this.initializeScraperConfigs();
  }

  private initializeScraperConfigs() {
    this.scraperConfigs = [
      {
        vendor: 'GetFPV',
        baseUrl: 'https://www.getfpv.com',
        rateLimit: 3000, // Increased delay for Cloudflare
        categories: {
          motors: {
            url: '/products/motors?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a, .product-item-title a',
              price: '.price-box .price, .price',
              url: '.product-name a, .product-item-title a',
              inStock: '.availability, .stock-status',
              image: '.product-image img, .product-item-photo img',
              sku: '[data-sku], .sku',
              brand: '.brand'
            }
          },
          frames: {
            url: '/products/frames?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a, .product-item-title a',
              price: '.price-box .price, .price',
              url: '.product-name a, .product-item-title a',
              inStock: '.availability, .stock-status',
              image: '.product-image img, .product-item-photo img',
              sku: '[data-sku], .sku',
              brand: '.brand'
            }
          },
          props: {
            url: '/products/propellers?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a, .product-item-title a',
              price: '.price-box .price, .price',
              url: '.product-name a, .product-item-title a',
              inStock: '.availability, .stock-status',
              image: '.product-image img, .product-item-photo img'
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
        headless: true, // Keep as boolean for compatibility
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--window-size=1920,1080',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('✅ Browser closed successfully');
      } catch (error) {
        console.error('⚠️ Error closing browser:', error);
      } finally {
        this.browser = null;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 ${context} (attempt ${attempt}/${this.retryAttempts})`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ ${context} failed (attempt ${attempt}):`, error);
        
        if (attempt < this.retryAttempts) {
          const delayMs = this.retryDelay * attempt; // Exponential backoff
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await this.delay(delayMs);
        }
      }
    }
    
    throw new Error(`${context} failed after ${this.retryAttempts} attempts: ${lastError!.message}`);
  }

  private async queueRequest<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          this.activeRequests++;
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      });
      
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.activeRequests < this.maxConcurrency && this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        nextRequest();
      }
    }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async setupAntiDetection(page: any): Promise<void> {
    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set advanced user agent with realistic headers
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set extra headers to mimic real browser
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });

    // Remove webdriver traces
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // Mock chrome runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).chrome = {
        runtime: {}
      };
      
      // Override permissions query - simplified to avoid type issues
      if (window.navigator.permissions && window.navigator.permissions.query) {
        const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
        window.navigator.permissions.query = function(parameters: PermissionDescriptor) {
          if (parameters.name === 'notifications') {
            return Promise.resolve({
              state: 'granted' as PermissionState,
              name: parameters.name,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false
            } as PermissionStatus);
          }
          return originalQuery(parameters);
        };
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async navigateWithCloudflareBypass(page: any, url: string, vendor: string): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // For GetFPV, use a more sophisticated approach
        if (vendor === 'GetFPV') {
          // First visit the homepage to establish session
          await page.goto('https://www.getfpv.com', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
          });
          await this.delay(2000);

          // Add some mouse movement to appear human
          await page.mouse.move(100, 100);
          await page.mouse.move(200, 200);
          await this.delay(1000);
        }

        // Navigate to target URL
        await page.goto(url, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        // Check if navigation was successful
        const title = await page.title();
        if (!title.includes('Just a moment') && !title.includes('Checking your browser')) {
          console.log(`Successfully navigated to ${url}`);
          return;
        }

        attempt++;
        if (attempt < maxRetries) {
          console.log(`Navigation attempt ${attempt} failed, retrying...`);
          await this.delay(3000);
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        console.log(`Navigation error, attempt ${attempt}:`, error);
        await this.delay(3000);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleCloudflareChallenge(page: any): Promise<void> {
    try {
      console.log('Handling Cloudflare challenge...');
      
      // Wait for potential challenge completion
      await page.waitForFunction(
        () => {
          const title = document.title;
          const body = document.body?.innerText || '';
          return !title.includes('Just a moment') && 
                 !title.includes('Checking your browser') &&
                 !body.includes('Enable JavaScript and cookies');
        },
        { timeout: 15000 }
      );

      // Additional wait for dynamic content
      await this.delay(2000);
      
      console.log('Cloudflare challenge completed');
    } catch (error) {
      console.log('Cloudflare challenge handling timeout or error:', error);
      // Continue anyway, might still work
    }
  }

  async scrapeCategory(vendor: string, category: string): Promise<ScrapedProduct[]> {
    const config = this.scraperConfigs.find(c => c.vendor === vendor);
    if (!config || !config.categories[category]) {
      throw new Error(`Configuration not found for vendor: ${vendor}, category: ${category}`);
    }

    await this.initializeBrowser();
    const page = await this.browser!.newPage();
    
    try {
      // Advanced anti-detection setup
      await this.setupAntiDetection(page);

      const categoryConfig = config.categories[category];
      const url = `${config.baseUrl}${categoryConfig.url}`;
      
      console.log(`Scraping ${vendor} - ${category}: ${url}`);
      
      // Enhanced navigation with Cloudflare bypass
      await this.navigateWithCloudflareBypass(page, url, vendor);
      
      await this.delay(config.rateLimit);

      const content = await page.content();
      
      // Check if we got a Cloudflare challenge page
      if (content.includes('cf_chl_opt') || content.includes('Just a moment') || content.includes('Enable JavaScript and cookies')) {
        console.log(`Cloudflare challenge detected for ${vendor}, attempting bypass...`);
        await this.handleCloudflareChallenge(page);
        await this.delay(5000); // Wait for challenge to complete
      }

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

      console.log(`${vendor} ${category}: Found ${products.length} products`);
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
