import { ScrapedProduct } from '@/types/drone';
import { EnhancedClassificationIntegrationService } from '@/utils/EnhancedClassificationIntegrationService';

interface ScraperConfig {
  vendor: string;
  baseUrl: string;
  rateLimit: number;
  retryAttempts: number;
  headers: Record<string, string>;
  categories: Record<string, CategoryConfig>;
}

interface CategoryConfig {
  url: string;
  selectors: {
    productContainer: string;
    name: string;
    price: string;
    url: string;
    inStock?: string;
    image?: string;
    sku?: string;
    brand?: string;
    description?: string;
  };
  pagination?: {
    nextButton?: string;
    pageParam?: string;
    maxPages?: number;
  };
}

// Intelligent product classification using Enhanced AI Engine
function classifyProduct(productName: string, description: string = '', url: string = ''): string {
  // Use enhanced classification for superior accuracy
  const enhancedClassifier = EnhancedClassificationIntegrationService.getInstance();
  
  try {
    const result = enhancedClassifier.classifyProduct(productName, description, { url });
    const enhancedResult = result.enhanced;
    
    console.log(`🚀 Enhanced scraper classification for "${productName}": ${enhancedResult.category} (${enhancedResult.confidence}%)`);
    
    // Enhanced classifier has high accuracy, use lower confidence threshold
    if (enhancedResult.confidence >= 65) {
      return enhancedResult.category;
    }
    
    console.log(`⚠️ Enhanced confidence too low (${enhancedResult.confidence}%), using fallback classification`);
  } catch (error) {
    console.error('Enhanced classification failed, falling back to legacy:', error);
  }
  
  // Fallback to legacy rule-based classification
  return legacyClassifyProduct(productName, description, url);
}

// Legacy classification as fallback
function legacyClassifyProduct(productName: string, description: string = '', url: string = ''): string {
  const text = `${productName} ${description} ${url}`.toLowerCase()
  
  // Definitive checks with more specific rules
  
  // Stack/Flight Controller has priority over motor (for cases like "T-Motor F7 AIO")
  if (text.includes('flight controller') || text.includes('aio') || text.includes('all-in-one') || 
      (text.includes('stack') && !text.includes('mount') && !text.includes('dampener'))) {
    return 'stack'
  }
  
  // Motor - but exclude mounts and accessories
  if (text.includes('motor') && !text.includes('motor mount') && !text.includes('mount')) {
    return 'motor'
  }
  
  // Frame - but exclude mounts and accessories
  if ((text.includes('frame') || text.includes('chassis')) && 
      !text.includes('mount') && !text.includes('dampener')) {
    return 'frame'
  }
  
  if (text.includes('camera') || text.includes('cam ') || text.includes(' cam')) {
    return 'camera'
  }
  if (text.includes('propeller') || text.includes('props') || text.includes('prop ')) {
    return 'prop'
  }
  if (text.includes('battery') || text.includes('lipo') || text.includes('li-po')) {
    return 'battery'
  }
  if (text.includes('esc') && !text.includes('mount')) {
    return 'stack'
  }
  
  // Scoring-based fallback
  const scores = {
    motor: 0,
    frame: 0,
    camera: 0,
    prop: 0,
    battery: 0,
    stack: 0
  }
  
  // Exclude accessories and mounts from scoring
  if (text.includes('mount') || text.includes('dampener') || text.includes('accessory')) {
    return 'other'
  }
  
  // Motor keywords
  if (text.includes('kv') || text.includes('stator') || text.includes('brushless') || text.includes('2207') || text.includes('2306') || text.includes('2208')) scores.motor += 2
  if (text.includes('motor') && !text.includes('mount')) scores.motor += 1
  
  // Frame keywords
  if (text.includes('frame') || text.includes('chassis') || text.includes('wheelbase') || text.includes('carbon fiber')) scores.frame += 2
  if (text.includes('freestyle') || text.includes('racing') || text.includes('micro')) scores.frame += 1
  
  // Camera keywords  
  if (text.includes('fpv') && (text.includes('camera') || text.includes('cam'))) scores.camera += 2
  if (text.includes('lens') || text.includes('cmos') || text.includes('ccd')) scores.camera += 1
  
  // Prop keywords
  if (text.includes('propeller') || text.includes('props') || text.includes('blades')) scores.prop += 2
  if (text.includes('5inch') || text.includes('6inch') || text.includes('tri-blade')) scores.prop += 1
  
  // Battery keywords
  if (text.includes('battery') || text.includes('lipo') || text.includes('mah') || text.includes('cell')) scores.battery += 2
  if (text.includes('1300mah') || text.includes('1500mah') || text.includes('4s') || text.includes('6s')) scores.battery += 1
  
  // Stack keywords - give priority to flight controller terms
  if (text.includes('flight controller') || text.includes('aio') || text.includes('all-in-one')) scores.stack += 3
  if (text.includes('stack') && !text.includes('mount') && !text.includes('dampener')) scores.stack += 2
  if (text.includes('esc') || text.includes('gyro')) scores.stack += 1
  
  // Find the highest scoring category
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return 'other'
  
  const winningEntry = Object.entries(scores).find(([, score]) => score === maxScore)
  return winningEntry ? winningEntry[0] : 'other'
}

export class DeploymentFriendlyScraperService {
  private scraperConfigs: ScraperConfig[] = [];
  private maxRetries = 3;
  private requestDelay = 1000; // 1 second between requests

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs() {
    this.scraperConfigs = [
      {
        vendor: 'GetFPV',
        baseUrl: 'https://www.getfpv.com',
        rateLimit: 2000,
        retryAttempts: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        categories: {
          motors: {
            url: '/products/motors?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a',
              price: '.price-box .price',
              url: '.product-name a',
              inStock: '.availability',
              image: '.product-image img',
              sku: '[data-sku]',
              brand: '.brand'
            },
            pagination: {
              pageParam: 'p',
              maxPages: 10
            }
          },
          props: {
            url: '/products/propellers?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a',
              price: '.price-box .price',
              url: '.product-name a',
              inStock: '.availability',
              image: '.product-image img'
            },
            pagination: {
              pageParam: 'p',
              maxPages: 5
            }
          },
          frames: {
            url: '/products/frames?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-name a',
              price: '.price-box .price',
              url: '.product-name a',
              inStock: '.availability',
              image: '.product-image img'
            },
            pagination: {
              pageParam: 'p',
              maxPages: 8
            }
          }
        }
      },
      {
        vendor: 'RDQ',
        baseUrl: 'https://www.racedayquads.com',
        rateLimit: 1500,
        retryAttempts: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        categories: {
          motors: {
            url: '/collections/motors?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          },
          frames: {
            url: '/collections/frames?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          },
          stacks: {
            url: '/collections/stacks-aios-fc-esc?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          },
          cameras: {
            url: '/collections/fpv-cameras?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          },
          props: {
            url: '/collections/propellers?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          },
          batteries: {
            url: '/collections/batteries?limit=48',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title a',
              price: '.price--highlight',
              url: '.product-item__title a',
              inStock: '.product-form__cart-submit',
              image: '.product-item__primary-image img'
            }
          }
        }
      },
      {
        vendor: 'PyrodDrone',
        baseUrl: 'https://pyrodrone.com',
        rateLimit: 2000,
        retryAttempts: 3,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        categories: {
          motors: {
            url: '/collections/motors',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          },
          frames: {
            url: '/collections/frames',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          },
          cameras: {
            url: '/collections/cameras',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          },
          props: {
            url: '/collections/propellers',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          },
          batteries: {
            url: '/collections/batteries',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          },
          stacks: {
            url: '/collections/flight-controllers',
            selectors: {
              productContainer: '.product-item',
              name: '.product-item__title',
              price: '.price',
              url: '.product-item__link',
              inStock: '.product-form__buttons',
              image: '.product-item__image img'
            }
          }
        }
      }
    ];
  }

  async scrapeCategory(vendor: string, category: string, maxProducts = 100): Promise<ScrapedProduct[]> {
    const config = this.scraperConfigs.find(c => c.vendor === vendor);
    if (!config) {
      throw new Error(`Vendor ${vendor} not found`);
    }

    const categoryConfig = config.categories[category];
    if (!categoryConfig) {
      throw new Error(`Category ${category} not found for vendor ${vendor}`);
    }

    const products: ScrapedProduct[] = [];
    let page = 1;
    const maxPages = categoryConfig.pagination?.maxPages || 1;

    while (page <= maxPages && products.length < maxProducts) {
      try {
        const url = this.buildUrl(config.baseUrl, categoryConfig.url, page, categoryConfig.pagination?.pageParam);
        console.log(`Scraping ${vendor} ${category} page ${page}: ${url}`);

        const pageProducts = await this.scrapePage(url, config, categoryConfig, category);
        
        if (pageProducts.length === 0) {
          console.log(`No products found on page ${page}, stopping`);
          break;
        }

        products.push(...pageProducts);
        console.log(`Found ${pageProducts.length} products on page ${page}, total: ${products.length}`);

        if (pageProducts.length < 20) {
          console.log('Fewer products than expected, likely last page');
          break;
        }

        page++;
        await this.delay(config.rateLimit);
      } catch (error) {
        console.error(`Error scraping page ${page}:`, error);
        break;
      }
    }

    return products.slice(0, maxProducts);
  }

  private buildUrl(baseUrl: string, categoryUrl: string, page: number, pageParam?: string): string {
    const url = new URL(categoryUrl, baseUrl);
    if (pageParam && page > 1) {
      url.searchParams.set(pageParam, page.toString());
    }
    return url.toString();
  }

  private async scrapePage(
    url: string, 
    config: ScraperConfig, 
    categoryConfig: CategoryConfig, 
    category: string
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: config.headers,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        return this.parseHtml(html, config.vendor, categoryConfig, category);

      } catch (error) {
        console.error(`Attempt ${attempt} failed for ${url}:`, error);
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        await this.delay(attempt * 1000);
      }
    }

    return products;
  }

  private parseHtml(html: string, vendor: string, categoryConfig: CategoryConfig, category: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    
    try {
      // Use basic regex parsing instead of cheerio for better compatibility
      const productContainerRegex = new RegExp(
        `<[^>]*class="[^"]*${categoryConfig.selectors.productContainer.replace('.', '')}[^"]*"[^>]*>[\\s\\S]*?</[^>]+>`,
        'gi'
      );

      const productMatches = html.match(productContainerRegex) || [];

      for (const productHtml of productMatches.slice(0, 50)) { // Limit per page
        try {
          const product = this.extractProductData(productHtml, vendor, categoryConfig, category);
          if (product) {
            products.push(product);
          }
        } catch (error) {
          console.error('Error parsing product:', error);
          continue;
        }
      }
    } catch (error) {
      console.error('Error parsing HTML:', error);
    }

    return products;
  }

  private extractProductData(
    productHtml: string, 
    vendor: string, 
    categoryConfig: CategoryConfig, 
    category: string
  ): ScrapedProduct | null {
    try {
      const name = this.extractText(productHtml, categoryConfig.selectors.name);
      const priceText = this.extractText(productHtml, categoryConfig.selectors.price);
      const url = this.extractAttribute(productHtml, categoryConfig.selectors.url, 'href');

      if (!name || !priceText) {
        return null;
      }

      const price = this.parsePrice(priceText);
      if (price <= 0) {
        return null;
      }

      const fullUrl = url?.startsWith('http') ? url : `${this.getBaseUrl(vendor)}${url}`;
      const inStockText = this.extractText(productHtml, categoryConfig.selectors.inStock || '');
      const inStock = this.parseInStock(inStockText);
      const imageUrl = this.extractAttribute(productHtml, categoryConfig.selectors.image || '', 'src');
      const sku = this.extractText(productHtml, categoryConfig.selectors.sku || '');
      const brand = this.extractText(productHtml, categoryConfig.selectors.brand || '');
      const description = this.extractText(productHtml, categoryConfig.selectors.description || '');

      // Use intelligent classification instead of URL-based category
      const classifiedCategory = classifyProduct(name, description, fullUrl || '');
      console.log(`[Classification] "${name}" -> ${classifiedCategory} (URL category was: ${category})`);

      return {
        name: name.trim(),
        price,
        vendor,
        category: classifiedCategory as 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery',
        url: fullUrl || '',
        inStock,
        imageUrl: imageUrl || '',
        sku: sku || '',
        brand: brand || this.extractBrandFromName(name),
        description: description || '',
        specifications: {},
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }

  private extractText(html: string, selector: string): string {
    if (!selector) return '';
    
    try {
      // Simple regex to extract text content
      const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
      if (classMatch) {
        const className = classMatch[1];
        const regex = new RegExp(`<[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)</[^>]+>`, 'i');
        const match = html.match(regex);
        if (match) {
          return match[1].replace(/<[^>]*>/g, '').trim();
        }
      }
      
      // Try tag-based extraction
      const tagMatch = selector.match(/^([a-zA-Z]+)/);
      if (tagMatch) {
        const tag = tagMatch[1];
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
        const match = html.match(regex);
        if (match) {
          return match[1].replace(/<[^>]*>/g, '').trim();
        }
      }
    } catch (error) {
      console.error('Error extracting text:', error);
    }
    
    return '';
  }

  private extractAttribute(html: string, selector: string, attribute: string): string {
    if (!selector) return '';
    
    try {
      const classMatch = selector.match(/\.([a-zA-Z0-9_-]+)/);
      if (classMatch) {
        const className = classMatch[1];
        const regex = new RegExp(`<[^>]*class="[^"]*${className}[^"]*"[^>]*${attribute}="([^"]*)"[^>]*>`, 'i');
        const match = html.match(regex);
        if (match) {
          return match[1];
        }
      }
    } catch (error) {
      console.error('Error extracting attribute:', error);
    }
    
    return '';
  }

  private parsePrice(priceText: string): number {
    try {
      const cleanPrice = priceText.replace(/[^\d.,]/g, '');
      const price = parseFloat(cleanPrice.replace(',', ''));
      return isNaN(price) ? 0 : price;
    } catch {
      return 0;
    }
  }

  private parseInStock(inStockText: string): boolean {
    if (!inStockText) return true; // Assume in stock if no info
    
    const lowerText = inStockText.toLowerCase();
    const outOfStockKeywords = ['out of stock', 'sold out', 'unavailable', 'backorder'];
    return !outOfStockKeywords.some(keyword => lowerText.includes(keyword));
  }

  private extractBrandFromName(name: string): string {
    const commonBrands = [
      'TMotor', 'EMAX', 'BetaFPV', 'iFlight', 'HappyModel', 'Foxeer', 'RunCam',
      'Armattan', 'ImpulseRC', 'TBS', 'FrSky', 'Radiomaster', 'DJI', 'Fat Shark'
    ];
    
    for (const brand of commonBrands) {
      if (name.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return name.split(' ')[0] || '';
  }

  private getBaseUrl(vendor: string): string {
    const config = this.scraperConfigs.find(c => c.vendor === vendor);
    return config?.baseUrl || '';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAllVendors(): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    
    for (const config of this.scraperConfigs) {
      console.log(`Scraping vendor: ${config.vendor}`);
      
      for (const categoryName of Object.keys(config.categories)) {
        try {
          const products = await this.scrapeCategory(config.vendor, categoryName, 50);
          allProducts.push(...products);
          console.log(`${config.vendor} ${categoryName}: ${products.length} products`);
        } catch (error) {
          console.error(`Error scraping ${config.vendor} ${categoryName}:`, error);
        }
      }
    }
    
    return allProducts;
  }

  getVendorConfig(vendor: string) {
    return this.scraperConfigs.find(c => c.vendor === vendor);
  }

  async testScraping(vendor: string, category: string): Promise<{ success: boolean; products: ScrapedProduct[]; error?: string }> {
    try {
      const products = await this.scrapeCategory(vendor, category, 5);
      return {
        success: true,
        products
      };
    } catch (error) {
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const deploymentFriendlyScraperService = new DeploymentFriendlyScraperService();