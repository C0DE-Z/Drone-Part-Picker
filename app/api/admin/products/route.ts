import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  try {
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const where: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        brand?: { contains: string; mode: 'insensitive' };
      }>;
      category?: string;
    } = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          brand: true,
          sku: true,
          imageUrl: true,
          specifications: true,
          createdAt: true,
          updatedAt: true,
          vendorPrices: {
            select: {
              price: true,
              currency: true,
              vendor: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      brand, 
      sku,
      imageUrl, 
      specifications
    } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json({
        success: false,
        error: 'Name and category are required'
      }, { status: 400 });
    }

    // Create new product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        category,
        brand: brand?.trim() || '',
        sku: sku?.trim() || '',
        imageUrl: imageUrl?.trim() || '',
        specifications: specifications || {}
      }
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create product'
    }, { status: 500 });
  }
}