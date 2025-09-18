import { NextRequest, NextResponse } from 'next/server';
import { EnhancedClassificationIntegrationService } from '@/utils/EnhancedClassificationIntegrationService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const timeRange = parseInt(searchParams.get('timeRange') || '24');

    const enhancedClassifier = EnhancedClassificationIntegrationService.getInstance();

    switch (action) {
      case 'report':
        const report = enhancedClassifier.getAnalyticsReport(timeRange);
        return NextResponse.json({
          success: true,
          data: report
        });

      case 'cache-stats':
        const cacheStats = enhancedClassifier.getCacheStats();
        const cacheMetrics = enhancedClassifier.getCacheMetrics();
        return NextResponse.json({
          success: true,
          data: {
            stats: cacheStats,
            metrics: cacheMetrics
          }
        });

      case 'recent-events':
        const limit = parseInt(searchParams.get('limit') || '100');
        const events = enhancedClassifier.getRecentEvents(limit);
        return NextResponse.json({
          success: true,
          data: events
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: report, cache-stats, recent-events'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productName, predictedCategory, actualCategory, feedback } = body;

    const enhancedClassifier = EnhancedClassificationIntegrationService.getInstance();

    switch (action) {
      case 'feedback':
        if (!productName || !predictedCategory || !actualCategory || !feedback) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: productName, predictedCategory, actualCategory, feedback'
          }, { status: 400 });
        }

        enhancedClassifier.recordFeedback(productName, predictedCategory, actualCategory, feedback);
        
        return NextResponse.json({
          success: true,
          message: 'Feedback recorded successfully'
        });

      case 'clear-cache':
        enhancedClassifier.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: feedback, clear-cache'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}