import { NextRequest, NextResponse } from 'next/server';
import { WebScraperService } from '@/services/WebScraperService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendor = searchParams.get('vendor') || 'GetFPV';
  const category = searchParams.get('category') || 'motors';

  console.log(`Testing enhanced ${vendor} scraper for ${category}...`);

  const scraper = new WebScraperService();
  
  try {
    const products = await scraper.scrapeCategory(vendor, category);
    
    await scraper.closeBrowser();

    return NextResponse.json({
      success: true,
      vendor,
      category,
      found: products.length,
      products: products.slice(0, 5), // Return first 5 for preview
      message: products.length > 0 
        ? `✅ Successfully scraped ${products.length} products from ${vendor}!`
        : `⚠️ No products found - may still be encountering bot protection`,
      scraperType: 'enhanced-puppeteer-with-cloudflare-bypass'
    });

  } catch (error) {
    await scraper.closeBrowser();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`Enhanced scraper error for ${vendor}:`, errorMessage);
    
    return NextResponse.json({
      success: false,
      vendor,
      category,
      error: errorMessage,
      message: errorMessage.includes('timeout') || errorMessage.includes('challenge')
        ? '🔄 Cloudflare challenge detected - the enhanced bypass should handle this automatically. Try again.'
        : `❌ Scraping failed: ${errorMessage}`,
      scraperType: 'enhanced-puppeteer-with-cloudflare-bypass'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { vendor = 'GetFPV', category = 'motors' } = await request.json();
  
  // Reuse the GET logic
  const url = new URL(request.url);
  url.searchParams.set('vendor', vendor);
  url.searchParams.set('category', category);
  
  const mockRequest = new NextRequest(url);
  return GET(mockRequest);
}