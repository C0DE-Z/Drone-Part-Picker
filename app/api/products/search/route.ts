import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const kv = searchParams.get('kv');
    const statorSize = searchParams.get('statorSize');
    const voltage = searchParams.get('voltage');
    const inStock = searchParams.get('inStock');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query && !category && !vendor && !kv && !statorSize && !voltage) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Add specification filters
    const specFilters = [];
    
    if (kv) {
      specFilters.push({
        specifications: {
          path: ['kv'],
          equals: kv
        }
      });
    }

    if (statorSize) {
      specFilters.push({
        specifications: {
          path: ['statorSize'],
          equals: statorSize
        }
      });
    }

    if (voltage) {
      specFilters.push({
        specifications: {
          path: ['voltage'],
          string_contains: voltage
        }
      });
    }

    if (specFilters.length > 0) {
      where.AND = specFilters;
    }

    if (category) {
      where.category = category;
    }

    // Price filter through vendor prices
    if (minPrice || maxPrice || vendor) {
      where.vendorPrices = {
        some: {
          ...(vendor && { vendor: { name: vendor } }),
          ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
          ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
        }
      };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        vendorPrices: {
          include: {
            vendor: true
          },
          orderBy: {
            price: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Transform results to include best price
    const productsWithBestPrice = products.map(product => {
      const bestPrice = product.vendorPrices[0];
      return {
        ...product,
        bestPrice: bestPrice ? {
          price: bestPrice.price,
          vendor: bestPrice.vendor.name,
          url: bestPrice.url,
          inStock: bestPrice.inStock
        } : null
      };
    });

    return NextResponse.json({
      products: productsWithBestPrice,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    );
  }
}