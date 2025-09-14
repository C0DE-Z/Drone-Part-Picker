import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get('vendor');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get recent scraping jobs
    const jobs = await prisma.scrapingJob.findMany({
      where: vendor ? { vendor } : undefined,
      orderBy: { startedAt: 'desc' },
      take: limit
    });

    // Get latest products scraped
    const latestProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        vendorPrices: {
          include: {
            vendor: true
          }
        }
      }
    });

    // Get scraping statistics
    const stats = await prisma.scrapingJob.groupBy({
      by: ['vendor', 'status'],
      _count: {
        _all: true
      },
      _sum: {
        productsFound: true,
        productsCreated: true,
        productsUpdated: true
      }
    });

    // Get currently running jobs
    const runningJobs = await prisma.scrapingJob.findMany({
      where: { status: 'RUNNING' },
      orderBy: { startedAt: 'desc' }
    });

    return NextResponse.json({
      jobs,
      latestProducts,
      stats,
      runningJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get scraper status' },
      { status: 500 }
    );
  }
}

// Server-Sent Events endpoint for real-time updates
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'subscribe') {
      // In a real implementation, you'd set up SSE here
      // For now, return current status
      return NextResponse.json({
        message: 'Subscribed to real-time updates',
        status: 'connected'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Status subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to updates' },
      { status: 500 }
    );
  }
}
