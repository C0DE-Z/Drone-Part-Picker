import { NextRequest, NextResponse } from 'next/server';
import { scheduledScrapingService } from '@/services/ScheduledScrapingService';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        scheduledScrapingService.startScheduledJobs();
        return NextResponse.json({ message: 'Scheduled jobs started' });
      
      case 'stop':
        scheduledScrapingService.stopScheduledJobs();
        return NextResponse.json({ message: 'Scheduled jobs stopped' });
      
      case 'trigger-full':
        // Run full scrape manually
        scheduledScrapingService.triggerFullScrape();
        return NextResponse.json({ message: 'Full scrape triggered' });
      
      case 'trigger-price-update':
        // Run price update manually
        scheduledScrapingService.triggerPriceUpdate();
        return NextResponse.json({ message: 'Price update triggered' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing scheduled scraping:', error);
    return NextResponse.json(
      { error: 'Failed to manage scheduled scraping' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = scheduledScrapingService.getJobStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting scraping status:', error);
    return NextResponse.json(
      { error: 'Failed to get scraping status' },
      { status: 500 }
    );
  }
}
