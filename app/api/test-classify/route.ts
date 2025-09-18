import { NextRequest, NextResponse } from 'next/server';
import { WebCrawlerService } from '@/services/WebCrawlerService';
import { EnhancedClassificationIntegrationService } from '@/utils/EnhancedClassificationIntegrationService';

export async function POST(request: NextRequest) {
  try {
    const { productName, description } = await request.json();
    
    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Use enhanced classification for superior accuracy
    const enhancedClassifier = EnhancedClassificationIntegrationService.getInstance();
    const enhancedResult = enhancedClassifier.classifyProduct(productName, description || '');
    
    // Also get legacy result for comparison
    const crawler = new WebCrawlerService();
    const legacyCategory = crawler.determineCategoryByScoring(productName, description || '');
    
    return NextResponse.json({
      success: true,
      enhanced: {
        category: enhancedResult.enhanced.category,
        confidence: enhancedResult.enhanced.confidence,
        reasoning: enhancedResult.enhanced.reasoning,
        specifications: enhancedResult.enhanced.specifications
      },
      legacy: {
        category: legacyCategory
      },
      analysis: enhancedResult.analysis,
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