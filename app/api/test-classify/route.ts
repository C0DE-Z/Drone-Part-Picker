import { NextRequest, NextResponse } from 'next/server';
import { WebCrawlerService } from '@/services/WebCrawlerService';

export async function POST(request: NextRequest) {
  try {
    const { productName, description } = await request.json();
    
    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const crawler = new WebCrawlerService();
    const category = crawler.determineCategoryByScoring(productName, description || '');
    
    return NextResponse.json({
      success: true,
      category,
      productName,
      description
    });

  } catch (error) {
    console.error('Classification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}