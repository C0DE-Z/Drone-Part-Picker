import { NextRequest, NextResponse } from 'next/server';
import { deploymentFriendlyScraperService } from '@/services/DeploymentFriendlyScraperService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendor = searchParams.get('vendor') || 'GetFPV';
  const category = searchParams.get('category') || 'motors';
  
  try {
    console.log(`Testing scraper for ${vendor} ${category}`);
    
    const result = await deploymentFriendlyScraperService.testScraping(vendor, category);
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      testUrl: `${vendor} ${category}`,
      deployment: 'friendly',
      message: result.success 
        ? `Successfully scraped ${result.products.length} products` 
        : `Scraping failed: ${result.error}`
    });
    
  } catch (error) {
    console.error('Test scraping error:', error);
    return NextResponse.json({
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vendor = 'GetFPV', category = 'motors', maxProducts = 5 } = await request.json();
    
    console.log(`Full test scraping for ${vendor} ${category} (max ${maxProducts})`);
    
    const products = await deploymentFriendlyScraperService.scrapeCategory(vendor, category, maxProducts);
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      vendor,
      category,
      timestamp: new Date().toISOString(),
      message: `Successfully scraped ${products.length} products from ${vendor} ${category}`
    });
    
  } catch (error) {
    console.error('Full test scraping error:', error);
    return NextResponse.json({
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}