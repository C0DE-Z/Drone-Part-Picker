import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { parseString } from 'xml2js';
import { ScrapedProduct } from '@/types/drone';
import { WebCrawlerService } from './WebCrawlerService';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface VendorSitemapConfig {
  vendor: string;
  baseUrl: string;
  sitemapUrl: string;
  urlPatterns: string[]; // patterns to match relevant product URLs
  productPageSelectors: {
    name: string;
    price: string;
    brand?: string;
    sku?: string;
    description?: string;
    image?: string;
    inStock: string;
    category?: string;
    specifications?: string;
  };
  urlModifications?: {
    addExtension?: string; // e.g., ".html" for GetFPV
    removeParams?: boolean;
    customTransform?: (url: string) => string;
  };
  rateLimit: number;
  categoryMapping: Record<string, string>; // URL pattern to category mapping
}

export class SitemapScraperService {
  private browser: Browser | null = null;
  private vendorConfigs: VendorSitemapConfig[] = [];
  private webCrawlerService: WebCrawlerService;

  constructor() {
    this.initializeVendorConfigs();
    this.webCrawlerService = new WebCrawlerService();
  }

  private initializeVendorConfigs() {
    this.vendorConfigs = [
      // Note: GetFPV sitemap is not working, use WebCrawler instead
      {
        vendor: 'RDQ',
        baseUrl: 'https://www.racedayquads.com',
        sitemapUrl: 'https://www.racedayquads.com/sitemap_products_1.xml',
        urlPatterns: [
          '/products/',
          '/collections/motors',
          '/collections/frames',
          '/collections/flight-controllers',
          '/collections/cameras',
          '/collections/propellers',
          '/collections/batteries'
        ],
        productPageSelectors: {
          name: 'h1.product-single__title, .product-title h1',
          price: '.price, .product-single__price .money',
          brand: '.product-vendor, .vendor',
          sku: '.product-single__sku, .sku',
          description: '.product-single__description, .product-description',
          image: '.product-single__photo img, .product-photo img',
          inStock: '.product-form__inventory, .inventory',
          specifications: '.product-single__description table, .specifications'
        },
        rateLimit: 2000,
        categoryMapping: {
          '/collections/motors': 'motor',
          '/collections/frames': 'frame',
          '/collections/flight-controllers': 'stack',
          '/collections/cameras': 'camera',
          '/collections/propellers': 'prop',
          '/collections/batteries': 'battery'
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

  private async fetchSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
    try {
      console.log(`Fetching sitemap: ${sitemapUrl}`);
      const response = await axios.get(sitemapUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      return new Promise((resolve, reject) => {
        parseString(response.data, (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          const urls: SitemapUrl[] = [];
          
          // Handle different sitemap formats
          if (result.urlset?.url) {
            // Standard sitemap format
            result.urlset.url.forEach((urlObj: { loc: string[]; lastmod?: string[]; changefreq?: string[]; priority?: string[] }) => {
              urls.push({
                loc: urlObj.loc[0],
                lastmod: urlObj.lastmod?.[0],
                changefreq: urlObj.changefreq?.[0],
                priority: urlObj.priority?.[0]
              });
            });
          } else if (result.sitemapindex?.sitemap) {
            // Sitemap index - need to fetch individual sitemaps
            result.sitemapindex.sitemap.forEach((sitemapObj: { loc: string[]; lastmod?: string[] }) => {
              urls.push({
                loc: sitemapObj.loc[0],
                lastmod: sitemapObj.lastmod?.[0]
              });
            });
          }

          resolve(urls);
        });
      });
    } catch (error) {
      console.error(`Error fetching sitemap ${sitemapUrl}:`, error);
      return [];
    }
  }

  private async fetchAllSitemapUrls(config: VendorSitemapConfig): Promise<string[]> {
    const initialSitemap = await this.fetchSitemap(config.sitemapUrl);
    let allUrls: string[] = [];

    // Check if this is a sitemap index
    const hasProductUrls = initialSitemap.some(url => 
      config.urlPatterns.some(pattern => url.loc.includes(pattern))
    );

    if (hasProductUrls) {
      // Direct sitemap with product URLs
      allUrls = initialSitemap.map(url => url.loc);
    } else {
      // Sitemap index - fetch individual sitemaps
      for (const sitemapEntry of initialSitemap) {
        if (sitemapEntry.loc.includes('product') || sitemapEntry.loc.includes('sitemap')) {
          const subSitemap = await this.fetchSitemap(sitemapEntry.loc);
          allUrls.push(...subSitemap.map(url => url.loc));
          await this.delay(1000); // Rate limit sitemap requests
        }
      }
    }

    // Filter URLs based on patterns
    const filteredUrls = allUrls.filter(url => 
      config.urlPatterns.some(pattern => url.includes(pattern))
    );

    console.log(`Found ${filteredUrls.length} relevant URLs for ${config.vendor}`);
    return filteredUrls;
  }

  private applyUrlModifications(url: string, config: VendorSitemapConfig): string {
    let modifiedUrl = url;

    if (config.urlModifications) {
      if (config.urlModifications.addExtension && !url.endsWith(config.urlModifications.addExtension)) {
        modifiedUrl += config.urlModifications.addExtension;
      }

      if (config.urlModifications.removeParams) {
        modifiedUrl = modifiedUrl.split('?')[0];
      }

      if (config.urlModifications.customTransform) {
        modifiedUrl = config.urlModifications.customTransform(modifiedUrl);
      }
    }

    return modifiedUrl;
  }

  private determineCategory(url: string, config: VendorSitemapConfig): string {
    for (const [pattern, category] of Object.entries(config.categoryMapping)) {
      if (url.includes(pattern)) {
        return category;
      }
    }
    return 'motor'; // default category
  }

  private parsePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private extractSpecifications($: cheerio.CheerioAPI, selector: string, category: string, name: string, description?: string): Record<string, string> {
    const specs: Record<string, string> = {};
    
    // First, extract standard specifications from HTML tables/lists
    $(selector).find('tr, dt, .spec-item').each((_, element) => {
      const $el = $(element);
      let key = '';
      let value = '';

      if ($el.is('tr')) {
        key = $el.find('td:first-child, th:first-child').text().trim();
        value = $el.find('td:last-child, td:nth-child(2)').text().trim();
      } else if ($el.is('dt')) {
        key = $el.text().trim();
        value = $el.next('dd').text().trim();
      } else {
        key = $el.find('.spec-name, .label').text().trim();
        value = $el.find('.spec-value, .value').text().trim();
      }

      if (key && value) {
        specs[key] = value;
      }
    });

    // For motors, also extract specialized motor specifications using WebCrawlerService logic
    if (category === 'motor') {
      const allText = `${name} ${description || ''} ${$(selector).text()}`;
      console.log(`Extracting motor specs from text: ${allText.substring(0, 200)}...`);
      
      // Use the same extraction patterns as WebCrawlerService
      const motorSpecs = this.extractMotorSpecifications(allText);
      
      // Merge motor-specific specs with existing specs
      Object.assign(specs, motorSpecs);
      
      console.log(`Extracted motor specifications:`, motorSpecs);
    }

    return specs;
  }

  private extractMotorSpecifications(text: string): Record<string, string> {
    const specs: Record<string, string> = {};
    
    // KV rating extraction (multiple patterns)
    const kvPatterns = [
      /(\d+)\s*kv/i,
      /kv\s*:?\s*(\d+)/i,
      /(\d+)\s*rpm\/v/i,
      /kv\s*rating\s*:?\s*(\d+)/i
    ];
    
    for (const pattern of kvPatterns) {
      const kvMatch = text.match(pattern);
      if (kvMatch) {
        specs.kv = kvMatch[1];
        break;
      }
    }

    // Stator size (typically 4 digits like 2207, 2306, etc.)
    const statorMatch = text.match(/(\d{4})/);
    if (statorMatch) {
      specs.statorSize = statorMatch[1];
    }

    // Voltage/cell count
    const voltagePatterns = [
      /(\d+(?:-\d+)?s)/i,
      /(\d+(?:-\d+)?\s*cell)/i,
      /(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?v)/i
    ];
    
    for (const pattern of voltagePatterns) {
      const voltageMatch = text.match(pattern);
      if (voltageMatch) {
        specs.voltage = voltageMatch[1];
        break;
      }
    }

    // Configuration (e.g., 4S, 6S)
    const configMatch = text.match(/(\d+s)/i);
    if (configMatch) {
      specs.configuration = configMatch[1].toUpperCase();
    }

    // Shaft diameter
    const shaftPatterns = [
      /(\d+(?:\.\d+)?)\s*mm\s*shaft/i,
      /shaft\s*:?\s*(\d+(?:\.\d+)?)\s*mm/i,
      /(\d+(?:\.\d+)?)\s*mm\s*bore/i
    ];
    
    for (const pattern of shaftPatterns) {
      const shaftMatch = text.match(pattern);
      if (shaftMatch) {
        specs.shaftDiameter = `${shaftMatch[1]}mm`;
        break;
      }
    }

    // Weight
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*g(?:rams?)?\b/i,
      /weight\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      /(\d+(?:\.\d+)?)\s*grams?/i
    ];
    
    for (const pattern of weightPatterns) {
      const weightMatch = text.match(pattern);
      if (weightMatch) {
        specs.weight = `${weightMatch[1]}g`;
        break;
      }
    }

    return specs;
  }

  async scrapeProductFromUrl(url: string, config: VendorSitemapConfig): Promise<ScrapedProduct | null> {
    await this.initializeBrowser();
    const page = await this.browser!.newPage();

    try {
      const modifiedUrl = this.applyUrlModifications(url, config);
      
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      console.log(`Scraping: ${modifiedUrl}`);
      
      await page.goto(modifiedUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract product data
      const name = $(config.productPageSelectors.name).first().text().trim();
      if (!name) {
        console.log(`No product name found for ${modifiedUrl}`);
        return null;
      }

      const priceText = $(config.productPageSelectors.price).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price <= 0) {
        console.log(`No valid price found for ${modifiedUrl}`);
        return null;
      }

      const brand = config.productPageSelectors.brand ? 
        $(config.productPageSelectors.brand).first().text().trim() : undefined;
      
      const sku = config.productPageSelectors.sku ? 
        $(config.productPageSelectors.sku).first().text().trim() : undefined;
      
      const description = config.productPageSelectors.description ? 
        $(config.productPageSelectors.description).first().text().trim() : undefined;
      
      const imageUrl = config.productPageSelectors.image ? 
        $(config.productPageSelectors.image).first().attr('src') : undefined;
      
      const stockText = $(config.productPageSelectors.inStock).text().trim().toLowerCase();
      const inStock = !stockText.includes('out of stock') && 
                     !stockText.includes('sold out') && 
                     !stockText.includes('unavailable');

      const category = this.determineCategory(url, config);

      const specifications = config.productPageSelectors.specifications ? 
        this.extractSpecifications($, config.productPageSelectors.specifications, category, name, description) : undefined;

      return {
        name,
        price,
        url: modifiedUrl,
        vendor: config.vendor,
        inStock,
        imageUrl: imageUrl ? new URL(imageUrl, config.baseUrl).href : undefined,
        description,
        sku,
        brand,
        category: category as 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery',
        specifications,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  async scrapeVendorFromSitemap(vendorName: string, maxProducts: number = 500): Promise<ScrapedProduct[]> {
    const config = this.vendorConfigs.find(c => c.vendor === vendorName);
    if (!config) {
      throw new Error(`Vendor ${vendorName} not configured`);
    }

    console.log(`Starting sitemap-based scrape for ${vendorName}`);
    
    // Get all product URLs from sitemap
    const productUrls = await this.fetchAllSitemapUrls(config);
    
    // Limit the number of products to scrape
    const urlsToScrape = productUrls.slice(0, maxProducts);
    console.log(`Scraping ${urlsToScrape.length} products from ${vendorName}`);

    const products: ScrapedProduct[] = [];
    let scrapedCount = 0;

    for (const url of urlsToScrape) {
      try {
        const product = await this.scrapeProductFromUrl(url, config);
        if (product) {
          products.push(product);
          scrapedCount++;
          
          if (scrapedCount % 10 === 0) {
            console.log(`Scraped ${scrapedCount}/${urlsToScrape.length} products from ${vendorName}`);
          }
        }
        
        // Rate limiting
        await this.delay(config.rateLimit);
      } catch (error) {
        console.error(`Error processing URL ${url}:`, error);
      }
    }

    console.log(`Completed scraping ${vendorName}: ${products.length} products found`);
    return products;
  }

  async scrapeAllVendorsFromSitemap(maxProductsPerVendor: number = 500): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];

    for (const config of this.vendorConfigs) {
      try {
        const vendorProducts = await this.scrapeVendorFromSitemap(config.vendor, maxProductsPerVendor);
        allProducts.push(...vendorProducts);
        
        // Longer delay between vendors
        await this.delay(10000);
      } catch (error) {
        console.error(`Error scraping vendor ${config.vendor}:`, error);
      }
    }

    return allProducts;
  }

  getAvailableVendors(): string[] {
    return this.vendorConfigs.map(config => config.vendor);
  }

  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

export const sitemapScraperService = new SitemapScraperService();
