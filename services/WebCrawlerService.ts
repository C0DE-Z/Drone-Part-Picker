import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScrapedProduct } from '@/types/drone';

interface CrawlerConfig {
  vendor: string;
  baseUrl: string;
  seedUrls: string[]; // Starting URLs (category pages, main product sections)
  linkSelectors: string[]; // CSS selectors to find product/category links
  productPageIndicators: string[]; // Patterns that indicate a URL is a product page
  excludePatterns: string[]; // URL patterns to avoid
  maxPages: number;
  maxDepth: number;
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
  rateLimit: number;
  categoryMapping: Record<string, string>;
}

interface CrawlQueueItem {
  url: string;
  depth: number;
  isProductPage: boolean;
}

export class WebCrawlerService {
  private browser: Browser | null = null;
  private crawlerConfigs: CrawlerConfig[] = [];
  private visitedUrls: Set<string> = new Set();
  private crawlQueue: CrawlQueueItem[] = [];

  constructor() {
    this.initializeCrawlerConfigs();
  }

  private initializeCrawlerConfigs() {
    this.crawlerConfigs = [
      {
        vendor: 'GetFPV',
        baseUrl: 'https://www.getfpv.com',
        seedUrls: [
          'https://www.getfpv.com/motors/mini-quad-motors.html',
          'https://www.getfpv.com/motors/micro-quad-motors.html',
          'https://www.getfpv.com/motors/commercial-cinematography-motors.html',
          'https://www.getfpv.com/multi-rotor-frames.html',
          'https://www.getfpv.com/electronics.html'
        ],
        linkSelectors: [
          '.product-item a[href$=".html"]',
          '.product-item-link',
          '.product-name a',
          '.product-image a',
          'a[href*="/motors/mini-quad-motors/"]',
          'a[href*="/motors/micro-quad-motors/"]',
          'a[href*="/motors/commercial-cinematography-motors/"]',
          'a[href*="/multi-rotor-frames/"]',
          'a[href*="/electronics/"]'
        ],
        productPageIndicators: [
          '/motors/mini-quad-motors/',
          '/motors/micro-quad-motors/',
          '/motors/commercial-cinematography-motors/',
          '/multi-rotor-frames/',
          '/electronics/',
          'iflight-',
          'axisflying-',
          'lumenier-',
          'tmotor-',
          'mamba-',
          'hyperlite-'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/customer',
          '/blog',
          '/info',
          '/about',
          '/contact',
          '/review',
          '/compare',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/catalogsearch',
          '/motors.html',
          '/multi-rotor-frames.html',
          '/electronics.html'
        ],
        maxPages: 1000,
        maxDepth: 3,
        productPageSelectors: {
          name: 'h1.page-title, .product-name h1, .product-title',
          price: '.price, .regular-price, .special-price .price',
          brand: '.product-brand, .brand, [data-brand]',
          sku: '.product-sku, .sku, [data-sku]',
          description: '.product-description, .description, .product-info-main .value',
          image: '.product-image-main img, .product-photo img',
          inStock: '.stock, .availability, .in-stock, .out-of-stock',
          category: '.breadcrumbs a, .nav-breadcrumb a',
          specifications: '.product-attributes, .additional-attributes, .tech-specs'
        },
        rateLimit: 3000,
        categoryMapping: {
          '/motors/mini-quad-motors/': 'motor',
          '/motors/micro-quad-motors/': 'motor',
          '/motors/commercial-cinematography-motors/': 'motor',
          '/multi-rotor-frames/': 'frame',
          '/electronics/': 'stack'
        }
      },
      {
        vendor: 'RDQ',
        baseUrl: 'https://www.racedayquads.com',
        seedUrls: [
          'https://www.racedayquads.com/collections/all-motors',
          'https://www.racedayquads.com/collections/all-frames',
          'https://www.racedayquads.com/collections/stacks-aios-fc-esc',
          'https://www.racedayquads.com/collections/fpv-cameras',
          'https://www.racedayquads.com/collections/all-props',
          'https://www.racedayquads.com/collections/all-batteries'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          'a[href*="/collections/"]',
          'h3 a[href*="/products/"]',
          '.product-item-link',
          '.product-title a',
          '.product-name a'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/pages',
          '/blogs',
          '/password',
          '/admin',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/policies/',
          '/customer_authentication',
          '#',
          'javascript:',
          'mailto:'
        ],
        maxPages: 1000,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1, .product-title, [data-testid="product-title"]',
          price: '[data-testid="price"], .price, .money, .price-item--sale, .price-item--regular',
          brand: '.product-vendor, .vendor, .brand, [data-brand]',
          sku: '.product-single__sku, .sku, .product-sku',
          description: '.product-single__description, .product-description, .rte, .product-form__description',
          image: '.product-single__photo img, .product-photo img, .product__media img, img[alt*="product"]',
          inStock: '.product-form__inventory, .inventory, .in-stock, .product-form__buttons, .btn',
          specifications: '.product-single__description table, .specifications, .product-specs'
        },
        rateLimit: 2000,
        categoryMapping: {
          '/collections/all-motors': 'motor',
          '/collections/all-frames': 'frame',
          '/collections/stacks-aios-fc-esc': 'stack', 
          '/collections/fpv-cameras': 'camera',
          '/collections/all-props': 'prop',
          '/collections/all-batteries': 'battery'
        }
      },
      {
        vendor: 'Pyrodrone',
        baseUrl: 'https://pyrodrone.com',
        seedUrls: [
          'https://pyrodrone.com/collections/motor',
          'https://pyrodrone.com/collections/frames',
          'https://pyrodrone.com/collections/flight-controllers',
          'https://pyrodrone.com/collections/esc',
          'https://pyrodrone.com/collections/cameras',
          'https://pyrodrone.com/collections/propellers',
          'https://pyrodrone.com/collections/batteries'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          'a[href*="/collections/"]',
          '.product-item__link',
          '.product-card-wrapper a',
          '.product-card__title a',
          '.grid-view-item__link'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/pages',
          '/blogs',
          '/password',
          '/admin',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/policies/',
          '#',
          'javascript:',
          'mailto:'
        ],
        maxPages: 800,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product-single__title, .product__title, h1.product-title',
          price: '.price--highlight, .product__price, .price, .money',
          brand: '.product__vendor, .vendor, .product-meta__vendor',
          sku: '.product__sku, .sku, .variant-sku',
          description: '.product-single__description, .product__description, .rte',
          image: '.product-single__photo img, .product__media img, .product-photo-wrapper img',
          inStock: '.product-form__inventory, .product__inventory, .btn--add-to-cart, .product-form__cart-submit',
          specifications: '.product-single__description table, .product__description table, .specifications'
        },
        rateLimit: 2500,
        categoryMapping: {
          '/collections/motor': 'motor',
          '/collections/frames': 'frame',
          '/collections/flight-controllers': 'stack',
          '/collections/esc': 'stack',
          '/collections/cameras': 'camera',
          '/collections/propellers': 'prop',
          '/collections/batteries': 'battery'
        }
      },
      {
        vendor: 'ReadyMadeRC',
        baseUrl: 'https://www.readymaderc.com',
        seedUrls: [
          'https://www.readymaderc.com/products/brushless-motors',
          'https://www.readymaderc.com/products/frames',
          'https://www.readymaderc.com/products/flight-controllers',
          'https://www.readymaderc.com/products/electronic-speed-controllers',
          'https://www.readymaderc.com/products/fpv-cameras',
          'https://www.readymaderc.com/products/propellers',
          'https://www.readymaderc.com/products/lipo-batteries'
        ],
        linkSelectors: [
          'a[href*="/product/"]',
          '.product-grid-item a',
          '.product-title a',
          '.product-link',
          'h3 a[href*="/product/"]'
        ],
        productPageIndicators: [
          '/product/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/contact',
          '/about',
          '/blog',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/compare',
          '/reviews'
        ],
        maxPages: 600,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product-title, .product-name h1, .product-details h1',
          price: '.product-price .price, .price, .regular-price',
          brand: '.product-brand, .brand, .manufacturer',
          sku: '.product-sku .sku, .sku, .product-code',
          description: '.product-description, .product-info .description, .product-details-content',
          image: '.product-image img, .product-photo img, .main-product-image img',
          inStock: '.stock-status, .availability, .inventory-status, .add-to-cart',
          specifications: '.product-specs, .specifications table, .tech-specs'
        },
        rateLimit: 3000,
        categoryMapping: {
          '/products/brushless-motors': 'motor',
          '/products/frames': 'frame',
          '/products/flight-controllers': 'stack',
          '/products/electronic-speed-controllers': 'stack',
          '/products/fpv-cameras': 'camera',
          '/products/propellers': 'prop',
          '/products/lipo-batteries': 'battery'
        }
      },
      {
        vendor: 'iFlight Store',
        baseUrl: 'https://store.iflight-rc.com',
        seedUrls: [
          'https://store.iflight-rc.com/collections/brushless-motor',
          'https://store.iflight-rc.com/collections/frame',
          'https://store.iflight-rc.com/collections/flight-controller',
          'https://store.iflight-rc.com/collections/esc',
          'https://store.iflight-rc.com/collections/fpv-camera',
          'https://store.iflight-rc.com/collections/propeller',
          'https://store.iflight-rc.com/collections/lipo-battery'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          '.product-item__link',
          '.product-card__link',
          '.grid-view-item__link',
          '.product-title a'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/pages',
          '/blogs',
          '/password',
          '/admin',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/policies/',
          '#',
          'javascript:',
          'mailto:'
        ],
        maxPages: 1000,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product__title, .product-single__title, h1.product-title',
          price: '.product__price .price, .price, .money, .product-price',
          brand: '.product__vendor, .vendor, .product-brand',
          sku: '.product__sku, .sku, .variant-sku',
          description: '.product__description, .product-single__description, .rte',
          image: '.product__media img, .product-single__photo img, .product-photo img',
          inStock: '.product-form__buttons, .btn--add-to-cart, .product__inventory, .in-stock',
          specifications: '.product__description table, .specifications, .tech-specs'
        },
        rateLimit: 2000,
        categoryMapping: {
          '/collections/brushless-motor': 'motor',
          '/collections/frame': 'frame',
          '/collections/flight-controller': 'stack',
          '/collections/esc': 'stack',
          '/collections/fpv-camera': 'camera',
          '/collections/propeller': 'prop',
          '/collections/lipo-battery': 'battery'
        }
      },
      {
        vendor: 'HobbyKing',
        baseUrl: 'https://hobbyking.com',
        seedUrls: [
          'https://hobbyking.com/en_us/multirotor-brushless-motors.html',
          'https://hobbyking.com/en_us/multirotor-frames.html',
          'https://hobbyking.com/en_us/multi-rotor-control-boards.html',
          'https://hobbyking.com/en_us/multirotor-escs.html',
          'https://hobbyking.com/en_us/fpv-cameras.html',
          'https://hobbyking.com/en_us/multirotor-propellers.html',
          'https://hobbyking.com/en_us/lipoly-batteries/multirotor.html'
        ],
        linkSelectors: [
          'a[href*="/en_us/"]',
          '.product-item-link',
          '.product-name a',
          '.product-image a',
          'h3 a[href*="/en_us/"]'
        ],
        productPageIndicators: [
          '/en_us/multirotor-',
          '/en_us/fpv-',
          '/en_us/lipoly-batteries/',
          '/en_us/multi-rotor-'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/customer',
          '/account',
          '/blog',
          '/info',
          '/about',
          '/contact',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/compare',
          '/review'
        ],
        maxPages: 800,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.page-title, .product-name h1, .product-title',
          price: '.price, .regular-price, .special-price .price, .price-box .price',
          brand: '.product-brand, .brand, .manufacturer',
          sku: '.product-sku, .sku',
          description: '.product-description, .description, .product-collateral .std',
          image: '.product-image-main img, .product-photo img',
          inStock: '.availability, .stock-status, .in-stock, .add-to-cart-buttons',
          specifications: '.product-attributes, .additional-attributes, .data-table'
        },
        rateLimit: 4000,
        categoryMapping: {
          '/en_us/multirotor-brushless-motors.html': 'motor',
          '/en_us/multirotor-frames.html': 'frame',
          '/en_us/multi-rotor-control-boards.html': 'stack',
          '/en_us/multirotor-escs.html': 'stack',
          '/en_us/fpv-cameras.html': 'camera',
          '/en_us/multirotor-propellers.html': 'prop',
          '/en_us/lipoly-batteries/multirotor.html': 'battery'
        }
      },
      {
        vendor: 'NextFPV',
        baseUrl: 'https://www.nextfpv.com',
        seedUrls: [
          'https://www.nextfpv.com/collections/motors',
          'https://www.nextfpv.com/collections/frames',
          'https://www.nextfpv.com/collections/flight-controllers',
          'https://www.nextfpv.com/collections/escs',
          'https://www.nextfpv.com/collections/cameras',
          'https://www.nextfpv.com/collections/propellers',
          'https://www.nextfpv.com/collections/batteries'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          '.product-item__link',
          '.product-card__link',
          '.grid-view-item__link',
          '.product-title a'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/pages',
          '/blogs',
          '/password',
          '/admin',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/policies/',
          '#',
          'javascript:',
          'mailto:'
        ],
        maxPages: 600,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product__title, .product-single__title, h1.product-title',
          price: '.product__price .price, .price, .money, .product-price',
          brand: '.product__vendor, .vendor, .product-brand',
          sku: '.product__sku, .sku, .variant-sku',
          description: '.product__description, .product-single__description, .rte',
          image: '.product__media img, .product-single__photo img, .product-photo img',
          inStock: '.product-form__buttons, .btn--add-to-cart, .product__inventory',
          specifications: '.product__description table, .specifications, .tech-specs'
        },
        rateLimit: 2500,
        categoryMapping: {
          '/collections/motors': 'motor',
          '/collections/frames': 'frame',
          '/collections/flight-controllers': 'stack',
          '/collections/escs': 'stack',
          '/collections/cameras': 'camera',
          '/collections/propellers': 'prop',
          '/collections/batteries': 'battery'
        }
      },
      {
        vendor: 'Banggood',
        baseUrl: 'https://www.banggood.com',
        seedUrls: [
          'https://www.banggood.com/search/rc-drone-motor.html',
          'https://www.banggood.com/search/fpv-frame.html',
          'https://www.banggood.com/search/flight-controller.html',
          'https://www.banggood.com/search/esc-drone.html',
          'https://www.banggood.com/search/fpv-camera.html',
          'https://www.banggood.com/search/fpv-propeller.html',
          'https://www.banggood.com/search/lipo-battery.html'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          '.goods-item-link',
          '.product-link',
          '.goods-title a',
          'h3 a[href*="/products/"]'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/cart',
          '/checkout',
          '/account',
          '/help',
          '/blog',
          '/company',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/compare',
          '/review'
        ],
        maxPages: 1000,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product-title, .goods-title h1, .product-name',
          price: '.goods-price .price, .price-current, .sale-price',
          brand: '.product-brand, .brand, .goods-brand',
          sku: '.product-sku, .sku, .goods-sku',
          description: '.product-description, .goods-desc, .product-info',
          image: '.goods-img img, .product-image img, .main-img img',
          inStock: '.stock-info, .availability, .add-to-cart',
          specifications: '.product-specs, .goods-params table, .specifications'
        },
        rateLimit: 3000,
        categoryMapping: {
          '/search/rc-drone-motor.html': 'motor',
          '/search/fpv-frame.html': 'frame',
          '/search/flight-controller.html': 'stack',
          '/search/esc-drone.html': 'stack',
          '/search/fpv-camera.html': 'camera',
          '/search/fpv-propeller.html': 'prop',
          '/search/lipo-battery.html': 'battery'
        }
      },
      {
        vendor: 'HeliDirect',
        baseUrl: 'https://www.helidirect.com',
        seedUrls: [
          'https://www.helidirect.com/collections/motors',
          'https://www.helidirect.com/collections/frames',
          'https://www.helidirect.com/collections/flight-controllers',
          'https://www.helidirect.com/collections/escs',
          'https://www.helidirect.com/collections/cameras',
          'https://www.helidirect.com/collections/propellers',
          'https://www.helidirect.com/collections/batteries'
        ],
        linkSelectors: [
          'a[href*="/products/"]',
          '.product-item__link',
          '.product-card__link',
          '.grid-view-item__link',
          '.product-title a'
        ],
        productPageIndicators: [
          '/products/'
        ],
        excludePatterns: [
          '/search',
          '/cart',
          '/checkout',
          '/account',
          '/pages',
          '/blogs',
          '/password',
          '/admin',
          '.pdf',
          '.jpg',
          '.png',
          '.zip',
          '/policies/',
          '#',
          'javascript:',
          'mailto:'
        ],
        maxPages: 500,
        maxDepth: 2,
        productPageSelectors: {
          name: 'h1.product__title, .product-single__title, h1.product-title',
          price: '.product__price .price, .price, .money, .product-price',
          brand: '.product__vendor, .vendor, .product-brand',
          sku: '.product__sku, .sku, .variant-sku',
          description: '.product__description, .product-single__description, .rte',
          image: '.product__media img, .product-single__photo img, .product-photo img',
          inStock: '.product-form__buttons, .btn--add-to-cart, .product__inventory',
          specifications: '.product__description table, .specifications, .tech-specs'
        },
        rateLimit: 2500,
        categoryMapping: {
          '/collections/motors': 'motor',
          '/collections/frames': 'frame',
          '/collections/flight-controllers': 'stack',
          '/collections/escs': 'stack',
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

  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      // Handle relative URLs
      if (url.startsWith('/')) {
        return new URL(url, baseUrl).href;
      }
      if (url.startsWith('http')) {
        return url;
      }
      return new URL(url, baseUrl).href;
    } catch {
      return '';
    }
  }

  private isProductPage(url: string, config: CrawlerConfig): boolean {
    return config.productPageIndicators.some(indicator => url.includes(indicator));
  }

  private shouldExcludeUrl(url: string, config: CrawlerConfig): boolean {
    return config.excludePatterns.some(pattern => url.includes(pattern));
  }

  private isValidUrl(url: string, config: CrawlerConfig): boolean {
    if (!url || url === '#' || url.startsWith('javascript:') || url.startsWith('mailto:')) {
      return false;
    }
    
    if (this.shouldExcludeUrl(url, config)) {
      return false;
    }

    // Must be from the same domain
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(config.baseUrl);
      return urlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  }

  private async extractLinksFromPage(page: Page, config: CrawlerConfig): Promise<string[]> {
    const content = await page.content();
    const $ = cheerio.load(content);
    const links: string[] = [];

    // Extract links using configured selectors
    for (const selector of config.linkSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const normalizedUrl = this.normalizeUrl(href, config.baseUrl);
          if (normalizedUrl && this.isValidUrl(normalizedUrl, config)) {
            links.push(normalizedUrl);
          }
        }
      });
    }

    // Also extract any other product-looking links from common patterns
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const normalizedUrl = this.normalizeUrl(href, config.baseUrl);
        if (normalizedUrl && this.isValidUrl(normalizedUrl, config) && this.isProductPage(normalizedUrl, config)) {
          links.push(normalizedUrl);
        }
      }
    });

    // Log what links we found for debugging
    const productLinks = links.filter(link => this.isProductPage(link, config));
    const collectionLinks = links.filter(link => !this.isProductPage(link, config));
    
    if (productLinks.length > 0) {
      console.log(`Found ${productLinks.length} product links and ${collectionLinks.length} collection links`);
    }

    // Remove duplicates
    return [...new Set(links)];
  }

  private determineCategory(url: string, config: CrawlerConfig, productName?: string, description?: string): string {
    // First check URL patterns from config
    for (const [pattern, category] of Object.entries(config.categoryMapping)) {
      if (url.includes(pattern)) {
        return category;
      }
    }
    
    // If no URL match, use advanced scoring system to analyze product name and description
    return this.determineCategoryByScoring(productName || '', description || '');
  }

  /**
   * Hybrid classification system combining rule-based logic with enhanced scoring
   * for maximum accuracy (targeting 99%+)
   */
  public determineCategoryByScoring(productName: string, description: string): string {
    const textToAnalyze = `${productName} ${description}`.toLowerCase();
    
    console.log(`🔍 Analyzing: "${productName}"`);
    console.log(`📝 Text to analyze: "${textToAnalyze}"`);
    
    // Step 1: Try rule-based classification first (high confidence)
    const ruleBasedResult = this.classifyByRules(textToAnalyze);
    const ruleConfidence = this.getRuleConfidence(textToAnalyze, ruleBasedResult);
    
    console.log(`🎯 Rule-based result: ${ruleBasedResult} (confidence: ${ruleConfidence}%)`);
    
    // Step 2: If rule-based confidence is high enough, use it
    if (ruleConfidence >= 85) {
      console.log(`✅ High confidence rule-based classification: ${ruleBasedResult}`);
      return ruleBasedResult;
    }
    
    // Step 3: For lower confidence cases, use enhanced scoring as backup
    console.log(`⚖️ Using enhanced scoring for edge case analysis...`);
    const scoringResult = this.enhancedScoringClassification(textToAnalyze);
    const scoringConfidence = this.getScoringConfidence(textToAnalyze, scoringResult);
    
    console.log(`🎯 Scoring result: ${scoringResult} (confidence: ${scoringConfidence}%)`);
    
    // Step 4: Choose the result with higher confidence
    if (ruleConfidence >= scoringConfidence) {
      console.log(`📂 Final classification (rule-based): ${ruleBasedResult}`);
      return ruleBasedResult;
    } else {
      console.log(`📂 Final classification (scoring): ${scoringResult}`);
      return scoringResult;
    }
  }

  /**
   * Rule-based classification with hierarchical decision making
   */
  private classifyByRules(text: string): string {
    // Step 1: Check for DEFINITIVE exclusions first
    if (this.isDefinitelyBattery(text)) return 'battery';
    
    // Step 1.5: Check for power systems BEFORE props (to avoid confusion)
    if (this.isDefinitelyMotor(text)) return 'motor';
    
    if (this.isDefinitelyProp(text)) return 'prop';
    if (this.isDefinitelyFrame(text)) return 'frame';
    if (this.isDefinitelyCamera(text)) return 'camera';
    
    // Step 2: Check for ESC/Stack classification (most complex)
    const escStackResult = this.classifyEscStack(text);
    if (escStackResult) return escStackResult;
    
    // Step 4: Fallback scoring for edge cases
    return this.fallbackClassification(text);
  }

  /**
   * Definitive battery classification
   */
  private isDefinitelyBattery(text: string): boolean {
    // Battery brands are almost 100% definitive
    const batteryBrands = ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy'];
    if (batteryBrands.some(brand => text.includes(brand))) {
      console.log(`✅ Battery brand detected`);
      return true;
    }
    
    // Strong battery indicators
    if ((text.includes('lipo') || text.includes('battery')) && text.includes('mah')) {
      console.log(`✅ Battery: lipo/battery + mAh`);
      return true;
    }
    
    // Cell count with voltage or battery context
    if (/\d+s.*(?:lipo|battery)|(?:lipo|battery).*\d+s/.test(text)) {
      console.log(`✅ Battery: cell count pattern`);
      return true;
    }
    
    return false;
  }

  /**
   * Definitive prop classification
   */
  private isDefinitelyProp(text: string): boolean {
    // Prop brands are highly definitive
    const propBrands = ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal', 'ethix'];
    if (propBrands.some(brand => text.includes(brand))) {
      console.log(`✅ Prop brand detected`);
      return true;
    }
    
    // Definitive prop indicators
    if (text.includes('propeller') || text.includes('propellers')) {
      console.log(`✅ Prop: propeller keyword`);
      return true;
    }
    
    // Prop size patterns with blade count
    if (/\d+x\d+x\d+|\d+x\d+\.\d+.*blade|\d{4}.*(?:prop|blade)/.test(text)) {
      console.log(`✅ Prop: size pattern with blades`);
      return true;
    }
    
    return false;
  }

  /**
   * Definitive frame classification
   */
  private isDefinitelyFrame(text: string): boolean {
    // Frame is usually very clear
    if (text.includes('frame') && !text.includes('flight controller') && !text.includes('esc')) {
      console.log(`✅ Frame: frame keyword without electronics`);
      return true;
    }
    
    // Wheelbase is definitive for frames
    if (text.includes('wheelbase') || /\d+mm.*frame/.test(text)) {
      console.log(`✅ Frame: wheelbase or frame size`);
      return true;
    }
    
    return false;
  }

  /**
   * Definitive camera classification
   */
  private isDefinitelyCamera(text: string): boolean {
    // Digital FPV systems
    if (text.includes('dji air unit') || text.includes('air unit') || 
        text.includes('walksnail avatar') || text.includes('hdzero')) {
      console.log(`✅ Camera: digital FPV system`);
      return true;
    }
    
    // Camera brands
    const cameraBrands = ['runcam', 'foxeer', 'caddx'];
    if (cameraBrands.some(brand => text.includes(brand))) {
      console.log(`✅ Camera: camera brand`);
      return true;
    }
    
    // Exclude action cameras (they should be "other")
    if (text.includes('gopro') || text.includes('action camera')) {
      console.log(`❌ Camera: action camera excluded`);
      return false;
    }
    
    if (text.includes('fpv camera') || (text.includes('camera') && text.includes('tvl'))) {
      console.log(`✅ Camera: FPV camera or TVL spec`);
      return true;
    }
    
    return false;
  }

  /**
   * ESC/Stack classification (most complex logic)
   */
  private classifyEscStack(text: string): string | null {
    // 4-in-1 ESCs are always stack
    if (text.includes('4in1') || text.includes('4-in-1') || text.includes('four in one')) {
      console.log(`✅ Stack: 4-in-1 ESC`);
      return 'stack';
    }
    
    // All-in-one systems
    if (text.includes('aio') || text.includes('all in one') || text.includes('all-in-one')) {
      console.log(`✅ Stack: AIO system`);
      return 'stack';
    }
    
    // Individual ESCs with current rating (go to stack category)
    if ((text.includes('esc') || text.includes('electronic speed controller')) && 
        /\d+a\b|\d+\s*amp/.test(text)) {
      // Check if it's NOT integrated with FC
      if (!text.includes('flight controller') && !text.includes('aio') && !text.includes('fc')) {
        console.log(`✅ Stack: Individual ESC`);
        return 'stack';
      }
    }
    
    // Flight controllers
    if (text.includes('flight controller') || 
        (text.includes('fc') && /f\d+|stm32/.test(text))) {
      console.log(`✅ Stack: Flight controller`);
      return 'stack';
    }
    
    // Processor indicators for FC
    if (/f411|f722|f405|f745|stm32/.test(text) && !text.includes('motor')) {
      console.log(`✅ Stack: FC processor`);
      return 'stack';
    }
    
    return null;
  }

  /**
   * Definitive motor classification
   */
  private isDefinitelyMotor(text: string): boolean {
    // Power systems are ALWAYS motors (even if they mention props)
    if (text.includes('power system')) {
      console.log(`✅ Motor: power system (overrides other indicators)`);
      return true;
    }
    
    // T-Motor products (unless they're FCs) - specifically VELOX power systems
    if (text.includes('t-motor') && !text.includes('flight controller') && !text.includes('aio')) {
      if (text.includes('velox') || text.includes('power')) {
        console.log(`✅ Motor: T-Motor power product`);
        return true;
      }
      console.log(`✅ Motor: T-Motor product`);
      return true;
    }
    
    // Motor with KV rating
    if (text.includes('motor') && /\d+kv/.test(text)) {
      console.log(`✅ Motor: motor + KV rating`);
      return true;
    }
    
    // Brushless motor
    if (text.includes('brushless motor') || 
        (text.includes('brushless') && text.includes('motor'))) {
      console.log(`✅ Motor: brushless motor`);
      return true;
    }
    
    return false;
  }

  /**
   * Fallback classification for edge cases
   */
  private fallbackClassification(text: string): string {
    console.log(`⚠️ Using fallback classification`);
    
    // Count definitive keywords for each category
    const scores = {
      motor: 0,
      prop: 0,
      battery: 0,
      stack: 0,
      frame: 0,
      camera: 0
    };
    
    // Motor indicators
    if (text.includes('motor')) scores.motor += 3;
    if (text.includes('kv')) scores.motor += 2;
    if (text.includes('brushless')) scores.motor += 1;
    if (text.includes('stator')) scores.motor += 1;
    
    // Prop indicators
    if (text.includes('prop')) scores.prop += 3;
    if (text.includes('blade')) scores.prop += 2;
    if (/\d+x\d+/.test(text)) scores.prop += 1;
    
    // Battery indicators
    if (text.includes('battery')) scores.battery += 3;
    if (text.includes('mah')) scores.battery += 2;
    if (/\d+s/.test(text)) scores.battery += 1;
    if (text.includes('lipo')) scores.battery += 2;
    
    // Stack indicators
    if (text.includes('esc')) scores.stack += 3;
    if (text.includes('fc')) scores.stack += 2;
    if (/f\d+/.test(text)) scores.stack += 1;
    
    // Frame indicators
    if (text.includes('frame')) scores.frame += 3;
    if (text.includes('carbon')) scores.frame += 1;
    if (text.includes('wheelbase')) scores.frame += 2;
    
    // Camera indicators
    if (text.includes('camera')) scores.camera += 3;
    if (text.includes('tvl')) scores.camera += 2;
    if (text.includes('lens')) scores.camera += 1;
    
    // Return highest scoring category
    const maxScore = Math.max(...Object.values(scores));
    const bestCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0];
    
    console.log(`📊 Fallback scores:`, scores);
    console.log(`🎯 Fallback result: ${bestCategory || 'motor'}`);
    
    return bestCategory || 'motor'; // Default fallback
  }

  /**
   * Calculate confidence level for rule-based classification
   */
  private getRuleConfidence(text: string, category: string): number {
    let confidence = 50; // Base confidence
    
    // High confidence indicators per category
    switch (category) {
      case 'battery':
        if (['tattu', 'gnb', 'cnhl'].some(brand => text.includes(brand))) confidence += 40;
        if (text.includes('lipo') && text.includes('mah')) confidence += 30;
        if (/\d+s/.test(text)) confidence += 20;
        break;
        
      case 'motor':
        if (text.includes('power system')) confidence += 40;
        if (text.includes('t-motor')) confidence += 35;
        if (text.includes('kv') && text.includes('motor')) confidence += 30;
        break;
        
      case 'prop':
        if (['gemfan', 'hqprop', 'dalprop'].some(brand => text.includes(brand))) confidence += 40;
        if (text.includes('propeller')) confidence += 35;
        if (/\d+x\d+x\d+/.test(text)) confidence += 25;
        break;
        
      case 'stack':
        if (text.includes('4in1') || text.includes('4-in-1')) confidence += 45;
        if (text.includes('aio')) confidence += 40;
        if (text.includes('esc') && /\d+a/.test(text)) confidence += 35;
        break;
        
      case 'frame':
        if (text.includes('wheelbase')) confidence += 40;
        if (text.includes('frame') && !text.includes('controller')) confidence += 30;
        break;
        
      case 'camera':
        if (text.includes('air unit') || text.includes('hdzero')) confidence += 45;
        if (['runcam', 'foxeer', 'caddx'].some(brand => text.includes(brand))) confidence += 35;
        break;
    }
    
    return Math.min(confidence, 95); // Cap at 95%
  }

  /**
   * Enhanced scoring classification system with improved weights
   */
  private enhancedScoringClassification(text: string): string {
    const categoryScores = {
      motor: 0,
      prop: 0,
      battery: 0,
      stack: 0,
      frame: 0,
      camera: 0
    };

    // Enhanced scoring with better weights and patterns
    this.calculateEnhancedScores(text, categoryScores);
    
    // Apply advanced negative scoring
    this.applyAdvancedNegativeScoring(text, categoryScores);
    
    // Find the category with the highest score
    const maxScore = Math.max(...Object.values(categoryScores));
    const bestCategory = Object.entries(categoryScores).find(([, score]) => score === maxScore)?.[0];

    console.log(`📊 Enhanced scoring results:`, categoryScores);
    
    return bestCategory && maxScore > 0 ? bestCategory : 'motor';
  }

  /**
   * Calculate enhanced scores with improved weights
   */
  private calculateEnhancedScores(text: string, scores: Record<string, number>): void {
    // MOTOR SCORING (Enhanced)
    const motorIndicators = [
      { pattern: /power system/i, weight: 80 },
      { pattern: /t-motor/i, weight: 70 },
      { pattern: /\d+kv/i, weight: 60 },
      { pattern: /brushless motor/i, weight: 50 },
      { pattern: /motor/i, weight: 40 },
      { pattern: /stator/i, weight: 30 },
      { pattern: /rotor/i, weight: 25 }
    ];
    
    // BATTERY SCORING (Enhanced)
    const batteryIndicators = [
      { pattern: /tattu|gnb|cnhl|gens ace/i, weight: 75 },
      { pattern: /lipo.*mah|mah.*lipo/i, weight: 70 },
      { pattern: /\d+s.*lipo|lipo.*\d+s/i, weight: 65 },
      { pattern: /battery/i, weight: 50 },
      { pattern: /\d+mah/i, weight: 45 },
      { pattern: /\d+s\b/i, weight: 40 }
    ];
    
    // PROP SCORING (Enhanced)
    const propIndicators = [
      { pattern: /gemfan|hqprop|dalprop|ethix/i, weight: 75 },
      { pattern: /propeller/i, weight: 60 },
      { pattern: /\d+x\d+x\d+/i, weight: 55 },
      { pattern: /tri-blade|quad-blade/i, weight: 50 },
      { pattern: /blade/i, weight: 40 },
      { pattern: /\d+x\d+/i, weight: 35 }
    ];
    
    // STACK SCORING (Enhanced)
    const stackIndicators = [
      { pattern: /4in1|4-in-1/i, weight: 85 },
      { pattern: /aio|all.in.one/i, weight: 80 },
      { pattern: /esc.*\d+a|\d+a.*esc/i, weight: 75 },
      { pattern: /flight controller/i, weight: 70 },
      { pattern: /f411|f722|f405|f745/i, weight: 65 },
      { pattern: /esc/i, weight: 50 },
      { pattern: /fc\b/i, weight: 45 }
    ];
    
    // FRAME SCORING (Enhanced)
    const frameIndicators = [
      { pattern: /wheelbase/i, weight: 80 },
      { pattern: /frame/i, weight: 60 },
      { pattern: /carbon fiber|carbon fibre/i, weight: 50 },
      { pattern: /\d+mm.*frame/i, weight: 55 }
    ];
    
    // CAMERA SCORING (Enhanced)
    const cameraIndicators = [
      { pattern: /air unit|dji.*unit/i, weight: 85 },
      { pattern: /walksnail|hdzero/i, weight: 80 },
      { pattern: /runcam|foxeer|caddx/i, weight: 70 },
      { pattern: /fpv camera/i, weight: 60 },
      { pattern: /\d+tvl/i, weight: 55 },
      { pattern: /camera/i, weight: 40 }
    ];
    
    // Apply scoring
    this.applyIndicatorScoring(text, motorIndicators, scores, 'motor');
    this.applyIndicatorScoring(text, batteryIndicators, scores, 'battery');
    this.applyIndicatorScoring(text, propIndicators, scores, 'prop');
    this.applyIndicatorScoring(text, stackIndicators, scores, 'stack');
    this.applyIndicatorScoring(text, frameIndicators, scores, 'frame');
    this.applyIndicatorScoring(text, cameraIndicators, scores, 'camera');
  }

  /**
   * Apply indicator-based scoring
   */
  private applyIndicatorScoring(
    text: string, 
    indicators: Array<{pattern: RegExp, weight: number}>, 
    scores: Record<string, number>, 
    category: string
  ): void {
    for (const indicator of indicators) {
      if (indicator.pattern.test(text)) {
        scores[category] += indicator.weight;
        
        // Bonus for multiple matches
        const matches = text.match(indicator.pattern) || [];
        if (matches.length > 1) {
          scores[category] += Math.min(matches.length - 1, 3) * (indicator.weight * 0.2);
        }
      }
    }
  }

  /**
   * Apply advanced negative scoring to prevent misclassification
   */
  private applyAdvancedNegativeScoring(text: string, scores: Record<string, number>): void {
    // ESC-specific negative scoring
    if (text.includes('esc') && /\d+a/.test(text)) {
      scores.battery -= 80;
      scores.motor -= 60;
      scores.prop -= 70;
      scores.camera -= 50;
      scores.frame -= 40;
    }
    
    // Power system specific
    if (text.includes('power system')) {
      scores.prop -= 70;
      scores.stack -= 60;
      scores.battery -= 50;
      scores.frame -= 40;
    }
    
    // 4-in-1 specific
    if (text.includes('4in1') || text.includes('4-in-1')) {
      scores.motor -= 70;
      scores.battery -= 80;
      scores.prop -= 60;
      scores.camera -= 50;
      scores.frame -= 40;
    }
    
    // Battery specific negative scoring
    if ((text.includes('lipo') || text.includes('battery')) && text.includes('mah')) {
      scores.motor -= 60;
      scores.stack -= 50;
      scores.prop -= 70;
      scores.camera -= 40;
      scores.frame -= 30;
    }
    
    // Propeller specific
    if (text.includes('propeller') || (['gemfan', 'hqprop'].some(brand => text.includes(brand)))) {
      scores.motor -= 40;
      scores.stack -= 50;
      scores.battery -= 60;
      scores.camera -= 30;
      scores.frame -= 30;
    }
    
    // Action camera exclusion
    if (text.includes('gopro') || text.includes('action camera')) {
      scores.camera -= 100;
      scores.motor -= 40;
      scores.stack -= 40;
    }
  }

  /**
   * Calculate confidence level for scoring-based classification
   */
  private getScoringConfidence(text: string, category: string): number {
    // Recalculate scores to get confidence
    const scores = {
      motor: 0, prop: 0, battery: 0, stack: 0, frame: 0, camera: 0
    };
    
    this.calculateEnhancedScores(text, scores);
    this.applyAdvancedNegativeScoring(text, scores);
    
    const maxScore = Math.max(...Object.values(scores));
    const categoryScore = scores[category as keyof typeof scores];
    const otherScores = Object.values(scores).filter(score => score !== categoryScore);
    const secondHighest = Math.max(...otherScores);
    
    // Confidence based on score difference and absolute score
    let confidence = 50;
    
    if (categoryScore === maxScore) {
      const scoreDifference = categoryScore - secondHighest;
      confidence += Math.min(scoreDifference / 10, 40); // Up to 40% bonus for score difference
      confidence += Math.min(categoryScore / 20, 10); // Up to 10% bonus for absolute score
    } else {
      confidence -= 30; // Penalty if not the highest score
    }
    
    return Math.max(Math.min(confidence, 95), 10); // Cap between 10% and 95%
  }

  private parsePrice(priceText: string): number {
    if (!priceText) return 0;
    
    // Handle formats like "Sale price $21.77Regular price$28.78" or "$21.77 $28.78"
    // Look for sale price first
    const saleMatch = priceText.match(/(?:sale\s*price|price)\s*\$?(\d+\.?\d*)/i);
    if (saleMatch) {
      return parseFloat(saleMatch[1]) || 0;
    }
    
    // Look for any price with $ symbol
    const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1]) || 0;
    }
    
    // Fallback to extracting first number
    const cleaned = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Normalize and clean product titles
   */
  private normalizeProductTitle(title: string, vendor: string): string {
    let cleaned = title;

    // Remove excessive whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove common vendor-specific prefixes/suffixes
    const vendorPrefixes: Record<string, string[]> = {
      'GetFPV': ['GetFPV', 'Get FPV'],
      'RDQ': ['RDQ', 'Race Day Quads', 'RaceDay'],
      'Pyrodrone': ['Pyrodrone', 'Pyro Drone'],
      'ReadyMadeRC': ['ReadyMade', 'Ready Made', 'RMRC'],
      'iFlight Store': ['iFlight', 'i-Flight'],
      'HobbyKing': ['HobbyKing', 'Hobby King', 'HK'],
      'NextFPV': ['NextFPV', 'Next FPV'],
      'Banggood': ['Banggood', 'Bang Good'],
      'HeliDirect': ['HeliDirect', 'Heli Direct']
    };

    const prefixesToRemove = vendorPrefixes[vendor] || [];
    for (const prefix of prefixesToRemove) {
      const regex = new RegExp(`^${prefix}\\s*[-:]?\\s*`, 'i');
      cleaned = cleaned.replace(regex, '');
    }

    // Remove pack quantity indicators when they make title too long
    const packQuantityPattern = /\b(\d+)\s*[x×]\s*pack|\b(\d+)\s*pack(?:\s*of\s*\d+)?|\b(\d+)\s*piece[s]?|\b(\d+)\s*pcs|\b(\d+)\s*count|\bset\s*of\s*(\d+)/gi;
    let match;
    while ((match = packQuantityPattern.exec(cleaned)) !== null) {
      const quantity = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
      if (quantity && parseInt(quantity) > 1) {
        // Only keep pack info if title is reasonable length after removal
        const withoutPack = cleaned.replace(match[0], '').trim();
        if (withoutPack.length > 20) {
          cleaned = withoutPack + ` (${quantity}-Pack)`;
        }
      }
    }

    // Remove common marketing terms that add no value
    const marketingTerms = [
      /\b(?:new|brand new|original|genuine|authentic|official|latest|updated|improved|enhanced|premium|professional|high[- ]quality|top[- ]quality|best|super|ultra|max|pro)\b/gi,
      /\b(?:free shipping|fast delivery|quick ship|in stock|available now|on sale|discount|special offer|limited time|hot deal)\b/gi,
      /\b(?:for fpv|for drone|for quadcopter|for racing|for freestyle|for multirotor)\b/gi
    ];

    for (const pattern of marketingTerms) {
      cleaned = cleaned.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
    }

    // Remove redundant parenthetical information
    cleaned = cleaned.replace(/\([^)]*\bincluded\b[^)]*\)/gi, '');
    cleaned = cleaned.replace(/\([^)]*\binclude[s]?\b[^)]*\)/gi, '');
    
    // Clean up multiple spaces and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Truncate if still too long (keep essential info)
    if (cleaned.length > 80) {
      // Try to preserve the most important parts
      const parts = cleaned.split(/[-–—|]/);
      if (parts.length > 1) {
        // Take the first substantial part
        cleaned = parts[0].trim();
        if (cleaned.length < 30 && parts[1]) {
          cleaned += ' - ' + parts[1].trim();
        }
      }
      
      // Final length check
      if (cleaned.length > 80) {
        cleaned = cleaned.substring(0, 77).trim() + '...';
      }
    }

    return cleaned;
  }

  private extractSpecifications($: cheerio.CheerioAPI, selector: string): Record<string, string> {
    const specs: Record<string, string> = {};
    
    // Extract from structured specification sections
    $(selector).find('tr, dt, .spec-item, li').each((_, element) => {
      const $el = $(element);
      let key = '';
      let value = '';

      if ($el.is('tr')) {
        key = $el.find('td:first-child, th:first-child').text().trim();
        value = $el.find('td:last-child, td:nth-child(2)').text().trim();
      } else if ($el.is('dt')) {
        key = $el.text().trim();
        value = $el.next('dd').text().trim();
      } else if ($el.is('li')) {
        const text = $el.text().trim();
        // Handle "key: value" or "key - value" formats
        const colonMatch = text.match(/^([^:]+):\s*(.+)$/);
        const dashMatch = text.match(/^([^-]+)-\s*(.+)$/);
        if (colonMatch) {
          key = colonMatch[1].trim();
          value = colonMatch[2].trim();
        } else if (dashMatch) {
          key = dashMatch[1].trim();
          value = dashMatch[2].trim();
        }
      } else {
        key = $el.find('.spec-name, .label, .attribute-name').text().trim();
        value = $el.find('.spec-value, .value, .attribute-value').text().trim();
        
        // If no structured format found, try text content
        if (!key && !value) {
          const text = $el.text().trim();
          const match = text.match(/^([^:]+):\s*(.+)$/);
          if (match) {
            key = match[1].trim();
            value = match[2].trim();
          }
        }
      }

      if (key && value) {
        // Normalize key names
        const normalizedKey = key.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');
        specs[normalizedKey] = value;
      }
    });

    return specs;
  }

  private extractAllSpecifications($: cheerio.CheerioAPI, name: string, description: string, category: string): Record<string, string> {
    const specs: Record<string, string> = {};
    const textContent = `${name} ${description}`.toLowerCase();

    console.log(`🔍 Extracting all specs for ${category}: ${name}`);

    // Common specifications for all components
    // Extract brand
    const brandMatch = textContent.match(/\b(t-motor|emax|brotherhobby|racestar|gemfan|dalprop|hqprop|fpvmodel|lumenier|tbs|team blacksheep|iflight|diatone|armattan|realacc|tattu|cnhl|gaoneng|sls|turnigy|zippy|thunder power|gens ace|ace|dinogy|ovonic|zeee|goldbat|hoovo|spektrum|frsky|tbs|immersionrc|foxeer|caddx|runcam|eagle|fatshark|skyzone|orqa|dji|walksnail|avatar|hdzero|rapidfire|tango|radiomaster|jumper|betafpv|happymodel|tinyhawk|emax|flywoo|geprc|diatone|holybro|matek|speedybee|mamba|aikon|spedix|racerstar|amdii|sunnysky|kde|cobra|scorpion|hyperion|motrolfly|hacker|axi|plettenberg|neu|aveox|feigao|turnigy|ntm|multistar|rimfire|park|e-flite|great planes|hangar 9|horizon hobby|futaba)\b/i);
    if (brandMatch) {
      specs.brand = brandMatch[1];
    }

    // Category-specific extraction
    switch (category) {
      case 'motor':
        return { ...specs, ...this.extractMotorSpecs($, name, description) };
      
      case 'prop':
        // Enhanced prop size extraction with multiple patterns
        const propSizePatterns = [
          // Standard format: 5x4.3x3, 6x4.5, 5x4.3
          /(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)(?:\s*[xX×]\s*(\d+))?/,
          // Compressed format: 5045, 5043, 6045
          /(\d)(\d)(\d)(\d)/,
          // Alternative format: 5 x 4.3 x 3
          /(\d+(?:\.\d+)?)\s+[xX×]\s+(\d+(?:\.\d+)?)(?:\s+[xX×]\s+(\d+))?/,
          // Dash format: 5-4.3-3
          /(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(?:-(\d+))?/
        ];
        
        let propSize = '';
        for (const pattern of propSizePatterns) {
          const match = textContent.match(pattern);
          if (match) {
            if (pattern.source.includes('(\\d)(\\d)(\\d)(\\d)')) {
              // Handle 4-digit format like 5045
              const diameter = match[1] + match[2];
              const pitch = match[3] + match[4];
              propSize = `${diameter}x${pitch}`;
            } else {
              // Handle standard formats
              const diameter = match[1];
              const pitch = match[2];
              const blades = match[3];
              propSize = blades ? `${diameter}x${pitch}x${blades}` : `${diameter}x${pitch}`;
            }
            break;
          }
        }
        if (propSize) specs.size = propSize;
        
        // Enhanced blade count extraction
        const bladePatterns = [
          /(\d+)\s*blade/i,
          /(\d+)bl\b/i,
          /(tri|quad|bi)[\s-]?blade/i,
          /(\d+)\s*b\b/i,
          /blade\s*count.*?(\d+)/i
        ];
        
        for (const pattern of bladePatterns) {
          const match = textContent.match(pattern);
          if (match) {
            let blades = match[1];
            if (match[1] === 'tri') blades = '3';
            else if (match[1] === 'quad') blades = '4';
            else if (match[1] === 'bi') blades = '2';
            specs.blades = blades;
            break;
          }
        }
        
        // Enhanced material extraction
        const materialPatterns = [
          /\b(carbon fiber|polycarbonate|plastic|abs|pc|nylon|glass fiber|durable|composite|polyamide|reinforced)\b/i,
          /material.*?(carbon|plastic|pc|abs|nylon)/i,
          /made\s+(?:of|from)\s+(carbon|plastic|pc|abs|nylon)/i
        ];
        
        for (const pattern of materialPatterns) {
          const match = textContent.match(pattern);
          if (match) {
            specs.material = match[1];
            break;
          }
        }
        
        // Enhanced weight extraction
        const propWeightPatterns = [
          /(\d+(?:\.\d+)?)\s*g(?:rams?)?(?:\s*each|\s*per\s*prop)?/i,
          /(\d+)\s*mg/i,
          /weight.*?(\d+(?:\.\d+)?)\s*g/i,
          /(\d+(?:\.\d+)?)\s*grams?\s*each/i,
          /each\s*prop.*?(\d+(?:\.\d+)?)\s*g/i
        ];
        
        for (const pattern of propWeightPatterns) {
          const weightMatch = textContent.match(pattern);
          if (weightMatch) {
            specs.weight = pattern.source.includes('mg') ? `${weightMatch[1]}mg` : `${weightMatch[1]}g`;
            break;
          }
        }
        
        // Enhanced pitch extraction
        const pitchPatterns = [
          /pitch\s*(\d+(?:\.\d+)?)/i,
          /(\d+(?:\.\d+)?)\s*inch\s*pitch/i,
          /(\d+(?:\.\d+)?)\s*"\s*pitch/i,
          /aggressive.*?(\d+(?:\.\d+)?)/i
        ];
        
        for (const pattern of pitchPatterns) {
          const match = textContent.match(pattern);
          if (match) {
            specs.pitch = match[1];
            break;
          }
        }
        
        // Extract prop type/style
        const typePatterns = [
          /\b(racing|freestyle|cinematic|smooth|aggressive|efficient|high\s*speed|low\s*noise)\b/i,
          /\b(bullnose|pointed|rounded|square)\b.*?tip/i,
          /style.*?(racing|freestyle|cinematic)/i
        ];
        
        for (const pattern of typePatterns) {
          const match = textContent.match(pattern);
          if (match) {
            specs.type = match[1];
            break;
          }
        }
        
        // Extract rotation direction
        const rotationMatch = textContent.match(/\b(cw|ccw|clockwise|counterclockwise|counter-clockwise)\b/i);
        if (rotationMatch) {
          specs.rotation = rotationMatch[1].toLowerCase().includes('cw') && !rotationMatch[1].toLowerCase().includes('ccw') ? 'CW' : 'CCW';
        }
        
        // Extract hub diameter/mounting
        const hubMatch = textContent.match(/(\d+(?:\.\d+)?)\s*mm\s*(?:hub|mount|shaft)/i);
        if (hubMatch) specs.hubDiameter = `${hubMatch[1]}mm`;
        
        break;

      case 'frame':
        // Extract wheelbase (more patterns)
        const wheelbasePatterns = [
          /(\d+)\s*mm\s*wheelbase/i,
          /wheelbase.*?(\d+)\s*mm/i,
          /(\d+)mm\s*wheelbase/i
        ];
        
        for (const pattern of wheelbasePatterns) {
          const wheelbaseMatch = textContent.match(pattern);
          if (wheelbaseMatch) {
            specs.wheelbase = `${wheelbaseMatch[1]}mm`;
            break;
          }
        }
        
        // Extract frame type/size (more patterns)
        const frameTypePatterns = [
          /(\d+)["']\s*frame/i,
          /(\d+)\s*inch/i,
          /(\d+)["]\s*class/i,
          /(\d+mm)\s*frame/i
        ];
        
        for (const pattern of frameTypePatterns) {
          const frameTypeMatch = textContent.match(pattern);
          if (frameTypeMatch) {
            specs.frameType = frameTypeMatch[1].includes('mm') ? frameTypeMatch[1] : `${frameTypeMatch[1]}"`;
            break;
          }
        }
        
        // Extract material
        const frameMaterialMatch = textContent.match(/\b(carbon fiber|aluminum|steel|titanium|3k carbon|ud carbon|carbon fibre|cf|alloy)\b/i);
        if (frameMaterialMatch) specs.material = frameMaterialMatch[1];
        
        // Extract thickness
        const thicknessMatch = textContent.match(/(\d+(?:\.\d+)?)\s*mm\s*thick/i);
        if (thicknessMatch) specs.thickness = `${thicknessMatch[1]}mm`;
        
        // Extract arm thickness
        const armThicknessMatch = textContent.match(/(\d+)\s*mm\s*arm/i);
        if (armThicknessMatch) specs.armThickness = `${armThicknessMatch[1]}mm`;
        break;

      case 'stack':
        // Extract current rating for ESC
        const currentRatingMatch = textContent.match(/(\d+)\s*a(?:mp)?(?:s)?/i);
        if (currentRatingMatch) specs.current = `${currentRatingMatch[1]}A`;
        
        // Extract firmware
        const stackFirmwareMatch = textContent.match(/\b(betaflight|cleanflight|butterflight|emuflight|ardupilot)\b/i);
        if (stackFirmwareMatch) specs.firmware = stackFirmwareMatch[1];
        
        // Extract processor
        const stackProcessorMatch = textContent.match(/\b(f4|f7|h7|stm32|at32)\b/i);
        if (stackProcessorMatch) specs.processor = stackProcessorMatch[1].toUpperCase();
        
        // Extract mounting holes
        const mountingMatch = textContent.match(/(\d+(?:\.\d+)?)\s*mm\s*mount/i);
        if (mountingMatch) specs.mounting = `${mountingMatch[1]}mm`;
        
        // Extract voltage input
        const voltageInputMatch = textContent.match(/(\d+(?:-\d+)?s)\s*input/i);
        if (voltageInputMatch) specs.inputVoltage = voltageInputMatch[1].toUpperCase();
        break;

      case 'battery':
        // Enhanced capacity extraction with better validation
        const capacityPatterns = [
          // Match format like "1500mAh", "2200 mAh", "1.5Ah"
          /(\d+(?:\.\d+)?)\s*mah\b/i,
          /(\d+(?:\.\d+)?)\s*ah\b/i,
          /capacity.*?(\d+(?:\.\d+)?)\s*mah/i,
          /(\d+(?:\.\d+)?)mah/i,
          // Match formats like "1500mah battery" or "battery 2200mah"
          /battery.*?(\d+(?:\.\d+)?)\s*mah/i,
          /(\d+(?:\.\d+)?)\s*mah.*?battery/i
        ];
        
        for (const pattern of capacityPatterns) {
          const capacityMatch = textContent.match(pattern);
          if (capacityMatch) {
            const value = parseFloat(capacityMatch[1]);
            
            // Validate reasonable capacity ranges for drone batteries
            if (pattern.source.includes('ah') && !pattern.source.includes('mah')) {
              // Convert Ah to mAh only if it's in a reasonable range (0.1-10 Ah)
              if (value >= 0.1 && value <= 10) {
                specs.capacity = `${Math.round(value * 1000)}mAh`;
              }
            } else {
              // For mAh values, validate they're in reasonable range (100-50000 mAh)
              if (value >= 100 && value <= 50000) {
                specs.capacity = `${Math.round(value)}mAh`;
              }
            }
            break;
          }
        }
        
        // Enhanced C rating extraction
        const cRatingPatterns = [
          /(\d+)\s*c\s*(?:rating|discharge|constant)/i,
          /(\d+)c\s*discharge/i,
          /(\d+)c\b(?!\s*temperature)/i,  // Avoid temperature readings
          /c.*?rating.*?(\d+)/i,
          /discharge.*?(\d+)c/i
        ];
        
        for (const pattern of cRatingPatterns) {
          const cRatingMatch = textContent.match(pattern);
          if (cRatingMatch) {
            const cValue = parseInt(cRatingMatch[1]);
            // Validate reasonable C rating (1-200C)
            if (cValue >= 1 && cValue <= 200) {
              specs.cRating = `${cValue}C`;
            }
            break;
          }
        }
        
        // Enhanced cell count extraction with validation
        const cellCountPatterns = [
          /(\d+)s\s*(?:lipo|battery|pack)/i,
          /(\d+)s\b(?!\s*(?:shipping|warranty|delivery))/i, // Avoid non-battery "s" meanings
          /(\d+)\s*cell(?:s)?\s*(?:pack|battery|lipo)/i,
          /(\d+)\s*series/i,
          /cell.*?count.*?(\d+)/i
        ];
        
        for (const pattern of cellCountPatterns) {
          const cellMatch = textContent.match(pattern);
          if (cellMatch) {
            const cellValue = parseInt(cellMatch[1]);
            // Validate reasonable cell count (1-12S for drones)
            if (cellValue >= 1 && cellValue <= 12) {
              specs.cellCount = `${cellValue}S`;
            }
            break;
          }
        }
        
        // Enhanced connector type extraction
        const connectorPatterns = [
          /\b(xt60|xt30|xt90|jst|ph2\.0|ph|deans|tamiya|banana|ec3|ec5|t-plug|trx)\b/i,
          /connector.*?(xt60|xt30|xt90|jst|ph2\.0|deans)/i,
          /plug.*?(xt60|xt30|xt90|deans)/i
        ];
        
        for (const pattern of connectorPatterns) {
          const connectorMatch = textContent.match(pattern);
          if (connectorMatch) {
            specs.connector = connectorMatch[1].toUpperCase();
            break;
          }
        }
        
        // Enhanced voltage extraction
        const voltagePatterns = [
          /(\d+(?:\.\d+)?)\s*v\s*(?:battery|pack|nominal)/i,
          /(\d+(?:\.\d+)?)\s*volt(?:s)?/i,
          /(\d+(?:\.\d+)?)v\b(?!\s*(?:warranty|shipping))/i,
          /voltage.*?(\d+(?:\.\d+)?)\s*v/i
        ];
        
        for (const pattern of voltagePatterns) {
          const voltageMatch = textContent.match(pattern);
          if (voltageMatch) {
            const voltValue = parseFloat(voltageMatch[1]);
            // Validate reasonable voltage for drone batteries (3-50V)
            if (voltValue >= 3 && voltValue <= 50) {
              specs.voltage = `${voltValue}V`;
            }
            break;
          }
        }
        
        // Extract battery type/chemistry
        const chemistryMatch = textContent.match(/\b(lipo|lipolymer|li-po|lihv|life|liion|li-ion|nimh|nicd)\b/i);
        if (chemistryMatch) {
          specs.chemistry = chemistryMatch[1].toUpperCase();
        }
        
        break;

      case 'camera':
        // Extract sensor size
        const sensorMatch = textContent.match(/(\d+\/\d+)\s*(?:inch|")|(\d+(?:\.\d+)?)\s*mm\s*sensor/i);
        if (sensorMatch) specs.sensor = sensorMatch[1] || `${sensorMatch[2]}mm`;
        
        // Extract resolution (enhanced patterns)
        const resolutionPatterns = [
          /(\d+)\s*tvl/i,
          /(\d+)\s*x\s*(\d+)/i,
          /(\d+p)/i,
          /(\d+k)\s*resolution/i
        ];
        
        for (const pattern of resolutionPatterns) {
          const resolutionMatch = textContent.match(pattern);
          if (resolutionMatch) {
            if (resolutionMatch[3]) {
              specs.resolution = `${resolutionMatch[1]}x${resolutionMatch[2]}`;
            } else {
              specs.resolution = resolutionMatch[1] + (resolutionMatch[0].includes('tvl') ? 'TVL' : 
                                   resolutionMatch[0].includes('p') ? '' : 
                                   resolutionMatch[0].includes('k') ? '' : '');
            }
            break;
          }
        }
        
        // Extract FOV
        const fovMatch = textContent.match(/(\d+)°?\s*(?:fov|field of view)/i);
        if (fovMatch) specs.fov = `${fovMatch[1]}°`;
        
        // Extract lens size (enhanced)
        const lensPatterns = [
          /(\d+(?:\.\d+)?)\s*mm\s*lens/i,
          /lens.*?(\d+(?:\.\d+)?)\s*mm/i,
          /(\d+(?:\.\d+)?)mm\s*lens/i
        ];
        
        for (const pattern of lensPatterns) {
          const lensMatch = textContent.match(pattern);
          if (lensMatch) {
            specs.lens = `${lensMatch[1]}mm`;
            break;
          }
        }
        
        // Extract frame rate
        const fpsMatch = textContent.match(/(\d+)\s*fps/i);
        if (fpsMatch) specs.fps = `${fpsMatch[1]}fps`;
        
        // Extract format
        const formatMatch = textContent.match(/\b(ntsc|pal|both)\b/i);
        if (formatMatch) specs.format = formatMatch[1].toUpperCase();
        break;

      case 'stack':
        // Extract processor
        const processorMatch = textContent.match(/\b(f[347]\d*|h743|h750|at32f435)\b/i);
        if (processorMatch) specs.processor = processorMatch[1].toUpperCase();
        
        // Extract ESC current
        const escMatch = textContent.match(/(\d+)a\s*esc/i);
        if (escMatch) specs.escCurrent = `${escMatch[1]}A`;
        break;
    }

    console.log(`✅ Final ${category} specs: ${JSON.stringify(specs)}`);
    return specs;
  }

  async scrapeProductFromUrl(url: string, config: CrawlerConfig): Promise<ScrapedProduct | null> {
    await this.initializeBrowser();
    const page = await this.browser!.newPage();

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      console.log(`Scraping product: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract product data
      const rawName = $(config.productPageSelectors.name).first().text().trim();
      console.log(`Raw product name: "${rawName}"`);
      if (!rawName) {
        console.log(`No product name found for ${url}`);
        return null;
      }
      
      const name = this.normalizeProductTitle(rawName, config.vendor);
      console.log(`Normalized product name: "${name}"`);
      if (!name) {
        console.log(`Name became empty after normalization for ${url}`);
        return null;
      }

      const priceText = $(config.productPageSelectors.price).first().text().trim();
      console.log(`Price text extraction: selector="${config.productPageSelectors.price}" result="${priceText}"`);
      const price = this.parsePrice(priceText);
      console.log(`Parsed price: ${price}`);
      if (price <= 0) {
        console.log(`No valid price found for ${url} (priceText: "${priceText}")`);
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

      const category = this.determineCategory(url, config, name, description);

      // Enhanced specification extraction combining structured data and pattern matching
      let specifications = config.productPageSelectors.specifications ? 
        this.extractSpecifications($, config.productPageSelectors.specifications) : {};

      // Combine with category-specific extraction
      const allSpecs = this.extractAllSpecifications($, name, description || '', category);
      specifications = { ...specifications, ...allSpecs };

      console.log(`📊 Final specifications for "${name}" (${category}): ${JSON.stringify(specifications, null, 2)}`);
      console.log(`🏷️ Product details: Name="${name}", Category="${category}", Price=$${price}, InStock=${inStock}`);

      return {
        name,
        price,
        url,
        vendor: config.vendor,
        inStock,
        imageUrl: imageUrl ? this.normalizeUrl(imageUrl, config.baseUrl) : undefined,
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

  async crawlVendor(vendorName: string, maxPages: number = 500): Promise<ScrapedProduct[]> {
    const config = this.crawlerConfigs.find(c => c.vendor === vendorName);
    if (!config) {
      throw new Error(`Vendor ${vendorName} not configured`);
    }

    console.log(`Starting web crawl for ${vendorName}`);
    
    // Reset state
    this.visitedUrls.clear();
    this.crawlQueue = [];

    // Initialize queue with seed URLs
    for (const seedUrl of config.seedUrls) {
      this.crawlQueue.push({
        url: seedUrl,
        depth: 0,
        isProductPage: this.isProductPage(seedUrl, config)
      });
    }

    const products: ScrapedProduct[] = [];
    let crawledPages = 0;
    let crawledProductPages = 0;
    let crawledCollectionPages = 0;
    const maxCollectionPages = Math.max(3, Math.min(10, Math.floor(maxPages * 0.2))); // At least 3 collection pages, max 10
    const maxConcurrent = 3; // Number of parallel browser instances

    console.log(`Starting crawl with maxPages: ${maxPages}, maxCollectionPages: ${maxCollectionPages}, parallel instances: ${maxConcurrent}`);

    await this.initializeBrowser();
    
    // Process collection pages first to discover product links
    const collectionQueue = this.crawlQueue.filter(item => !item.isProductPage);
    const productQueue: CrawlQueueItem[] = [];
    
    // Crawl collection pages sequentially to discover product links
    for (const queueItem of collectionQueue.slice(0, maxCollectionPages)) {
      if (this.visitedUrls.has(queueItem.url)) continue;
      
      this.visitedUrls.add(queueItem.url);
      crawledPages++;
      crawledCollectionPages++;

      try {
        const page = await this.browser!.newPage();
        console.log(`Crawling collection [${crawledCollectionPages}/${maxCollectionPages}]: ${queueItem.url}`);
        
        await page.goto(queueItem.url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Extract product links
        const links = await this.extractLinksFromPage(page, config);
        const productLinks = links.filter(link => this.isProductPage(link, config));
        
        console.log(`Found ${productLinks.length} product links from ${queueItem.url}`);
        
        // Add product links to product queue
        for (const link of productLinks) {
          if (!this.visitedUrls.has(link)) {
            productQueue.push({
              url: link,
              depth: queueItem.depth + 1,
              isProductPage: true
            });
          }
        }

        await page.close();
        await this.delay(config.rateLimit);
      } catch (error) {
        console.error(`Error crawling collection ${queueItem.url}:`, error);
      }
    }

    console.log(`Discovered ${productQueue.length} product pages, starting parallel scraping...`);

    // Now process product pages in parallel
    const remainingProductPages = Math.min(productQueue.length, maxPages - crawledPages);
    const productBatches = this.chunkArray(productQueue.slice(0, remainingProductPages), maxConcurrent);

    for (const batch of productBatches) {
      const batchPromises = batch.map(async (queueItem) => {
        if (this.visitedUrls.has(queueItem.url)) return null;
        
        this.visitedUrls.add(queueItem.url);
        crawledPages++;
        crawledProductPages++;

        try {
          const product = await this.scrapeProductFromUrl(queueItem.url, config);
          if (product) {
            console.log(`✓ Scraped: ${product.name} - $${product.price} (${product.category})`);
            return product;
          }
        } catch (error) {
          console.error(`Error scraping product ${queueItem.url}:`, error);
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      const validProducts = batchResults.filter(p => p !== null) as ScrapedProduct[];
      products.push(...validProducts);

      console.log(`Batch completed: ${validProducts.length}/${batch.length} products, Total: ${products.length}`);
      
      // Rate limiting between batches
      await this.delay(1000);
    }

    console.log(`Completed crawling ${vendorName}: ${products.length} products found from ${crawledPages} pages (${crawledProductPages} product pages, ${crawledCollectionPages} collection pages)`);
    return products;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private extractMotorSpecs($: cheerio.CheerioAPI, name: string, description: string): Record<string, string> | undefined {
    const specs: Record<string, string> = {};
    const textContent = `${name} ${description}`.toLowerCase();
    
    console.log(`🔍 Extracting motor specs for: ${name}`);
    console.log(`📝 Text content: ${textContent}`);

    // Extract KV rating from name or description - handle multiple KV options
    const multiKvPattern = /(\d+kv(?:\s*\/\s*\d+kv)+)/i;
    const multiKvMatch = textContent.match(multiKvPattern);
    
    if (multiKvMatch) {
      // Multiple KV options found (e.g., "400KV/500KV/640KV/900KV")
      const kvOptions = multiKvMatch[1].match(/\d+/g);
      if (kvOptions && kvOptions.length > 1) {
        specs.kvOptions = kvOptions.join(', ');
        specs.kv = kvOptions[0]; // Use first option as primary
        console.log(`⚡ Found multiple KV options: ${specs.kvOptions}, primary: ${specs.kv}`);
      }
    } else {
      // Single KV rating
      const kvPatterns = [
        /(\d+)\s*kv/i,
        /kv\s*(\d+)/i,
        /(\d+)\s*rpm\/v/i
      ];
      
      for (const pattern of kvPatterns) {
        const kvMatch = textContent.match(pattern);
        if (kvMatch) {
          specs.kv = kvMatch[1];
          console.log(`⚡ Found KV: ${specs.kv}`);
          break;
        }
      }
    }

    // Extract stator size (e.g., 2207, 2306, 1407, 2004, 1102, 3115)
    const statorPatterns = [
      /(\d{4})/,
      /motor\s*size\s*(\d{4})/i,
      /stator\s*(\d{4})/i
    ];
    
    for (const pattern of statorPatterns) {
      const statorMatch = textContent.match(pattern);
      if (statorMatch && statorMatch[1].length === 4) {
        specs.statorSize = statorMatch[1];
        console.log(`📏 Found stator: ${specs.statorSize}`);
        break;
      }
    }

    // Extract motor configuration (e.g., 12N14P)
    const configMatch = textContent.match(/(\d+n\d+p)/i);
    if (configMatch) {
      specs.configuration = configMatch[1].toUpperCase();
      console.log(`🔧 Found config: ${specs.configuration}`);
    }

    // Extract voltage rating (e.g., 3-6S, 4S, 6S)
    const voltagePatterns = [
      /(\d+(?:-\d+)?s)/i,
      /(\d+)s\s*lipo/i,
      /voltage.*?(\d+(?:-\d+)?s)/i
    ];
    
    for (const pattern of voltagePatterns) {
      const voltageMatch = textContent.match(pattern);
      if (voltageMatch) {
        specs.voltage = voltageMatch[1].toUpperCase();
        console.log(`🔋 Found voltage: ${specs.voltage}`);
        break;
      }
    }

    // Extract shaft diameter (e.g., 5mm, 1.5mm)
    const shaftPatterns = [
      /(\d+(?:\.\d+)?)\s*mm.*shaft/i,
      /shaft.*?(\d+(?:\.\d+)?)\s*mm/i,
      /(\d+(?:\.\d+)?)\s*mm\s*shaft/i
    ];
    
    for (const pattern of shaftPatterns) {
      const shaftMatch = textContent.match(pattern);
      if (shaftMatch) {
        specs.shaftDiameter = `${shaftMatch[1]}mm`;
        console.log(`🎯 Found shaft: ${specs.shaftDiameter}`);
        break;
      }
    }

    // Extract weight (e.g., 37g, 40g)
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*g(?:rams?)?/i,
      /weight.*?(\d+(?:\.\d+)?)\s*g/i
    ];
    
    for (const pattern of weightPatterns) {
      const weightMatch = textContent.match(pattern);
      if (weightMatch) {
        specs.weight = `${weightMatch[1]}g`;
        console.log(`⚖️ Found weight: ${specs.weight}`);
        break;
      }
    }

    // Extract thrust data if available
    const thrustPatterns = [
      /(\d+(?:\.\d+)?)\s*g.*thrust/i,
      /thrust.*?(\d+(?:\.\d+)?)\s*g/i,
      /(\d+(?:\.\d+)?)\s*grams?\s*thrust/i
    ];
    
    for (const pattern of thrustPatterns) {
      const thrustMatch = textContent.match(pattern);
      if (thrustMatch) {
        specs.thrust = `${thrustMatch[1]}g`;
        console.log(`🚀 Found thrust: ${specs.thrust}`);
        break;
      }
    }

    // Look for specifications in HTML structure more thoroughly
    $('tr, dt, .spec-item, li, .product-single__description *').each((_, element) => {
      const $el = $(element);
      const text = $el.text().toLowerCase();
      
      // KV from table/list (if not already found)
      if (text.includes('kv') && !specs.kv) {
        const kvMatch = text.match(/(\d+)\s*kv/i);
        if (kvMatch) {
          specs.kv = kvMatch[1];
          console.log(`⚡ Found KV from table: ${specs.kv}`);
        }
      }
      
      // Thrust from table/list
      if ((text.includes('thrust') || text.includes('force')) && !specs.thrust) {
        const thrustMatch = text.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (thrustMatch) {
          specs.thrust = `${thrustMatch[1]}g`;
          console.log(`🚀 Found thrust from table: ${specs.thrust}`);
        }
      }
      
      // Weight from table/list (if not already found)
      if (text.includes('weight') && !specs.weight) {
        const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*g/i);
        if (weightMatch) {
          specs.weight = `${weightMatch[1]}g`;
          console.log(`⚖️ Found weight from table: ${specs.weight}`);
        }
      }
    });

    return Object.keys(specs).length > 0 ? specs : undefined;
  }

  async crawlAllVendors(maxPagesPerVendor: number = 500): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];

    for (const config of this.crawlerConfigs) {
      try {
        const vendorProducts = await this.crawlVendor(config.vendor, maxPagesPerVendor);
        allProducts.push(...vendorProducts);
        
        // Longer delay between vendors
        await this.delay(10000);
      } catch (error) {
        console.error(`Error crawling vendor ${config.vendor}:`, error);
      }
    }

    return allProducts;
  }

  getAvailableVendors(): string[] {
    return this.crawlerConfigs.map(config => config.vendor);
  }

  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

export const webCrawlerService = new WebCrawlerService();
