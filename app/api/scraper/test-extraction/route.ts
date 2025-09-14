import { NextRequest, NextResponse } from 'next/server';
import { webCrawlerService } from '@/services/WebCrawlerService';

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    console.log('Testing extraction for URLs:', urls);
    
    const results = [];
    
    for (const url of urls) {
      try {
        console.log('Testing URL:', url);
        
        // Use the same approach as crawlVendor - find RDQ config
        const rdqConfig = {
          vendor: 'RDQ',
          baseUrl: 'https://www.racedayquads.com',
          seedUrls: [],
          linkSelectors: [],
          productPageIndicators: ['/products/'],
          excludePatterns: [],
          maxPages: 1000,
          maxDepth: 2,
          productPageSelectors: {
            name: 'h1, .product-title, [data-testid="product-title"]',
            price: '[data-testid="price"], .price, .money, .price-item--sale, .price-item--regular',
            brand: '.product-vendor, .vendor, .brand, [data-brand]',
            description: '.product-description, .description, .product-content, [data-testid="product-description"]',
            image: '.product-image img, .product-photo img, .featured-image img, [data-testid="product-image"]',
            sku: '.product-sku, .sku, [data-sku]',
            inStock: '.stock-status, .availability, [data-in-stock]',
            specifications: '.product-specs, .specifications, .product-details'
          },
          rateLimit: 1000,
          categoryMapping: {
            '/motors/': 'motor',
            '/frames/': 'frame',
            '/stacks/': 'stack',
            '/cameras/': 'camera',
            '/propellers/': 'prop',
            '/batteries/': 'battery'
          }
        };
        
        const product = await webCrawlerService.scrapeProductFromUrl(url, rdqConfig);
        if (product) {
          results.push({
            url,
            success: true,
            product
          });
          console.log('✓ Successfully scraped:', product.name);
          console.log('  Specifications:', product.specifications);
        } else {
          results.push({
            url,
            success: false,
            error: 'No product returned'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('✗ Failed to scrape URL:', url, errorMessage);
        results.push({
          url,
          success: false,
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      message: 'Extraction test completed',
      results
    });
  } catch (error) {
    console.error('Error in extraction test:', error);
    return NextResponse.json(
      { error: 'Failed to run extraction test' },
      { status: 500 }
    );
  }
}
