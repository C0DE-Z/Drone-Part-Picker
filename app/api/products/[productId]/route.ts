import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendorPrices: {
          include: {
            vendor: true
          },
          orderBy: {
            price: 'asc'
          }
        },
        priceHistory: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate price statistics
    const prices = product.vendorPrices.map(vp => vp.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Group price history by vendor
    const priceHistoryByVendor = product.priceHistory.reduce((acc, history) => {
      if (!acc[history.vendorId]) {
        acc[history.vendorId] = [];
      }
      acc[history.vendorId].push(history);
      return acc;
    }, {} as Record<string, typeof product.priceHistory>);

    return NextResponse.json({
      product,
      priceStats: {
        min: minPrice,
        max: maxPrice,
        average: avgPrice,
        vendorCount: product.vendorPrices.length
      },
      priceHistoryByVendor
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}
