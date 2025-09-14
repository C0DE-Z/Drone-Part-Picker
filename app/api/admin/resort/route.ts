import { NextRequest, NextResponse } from 'next/server';
import { ProductResortService } from '@/services/ProductResortService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');

  const resortService = new ProductResortService();

  try {
    switch (action) {
      case 'report':
        const report = await resortService.generateResortReport();
        return NextResponse.json({
          success: true,
          data: report
        });

      case 'preview':
        // Preview what would be changed without actually making changes
        if (category) {
          const products = await resortService.resortByCurrentCategory(category);
          return NextResponse.json({
            success: true,
            data: {
              type: 'category',
              target: category,
              preview: products.changes.map(change => ({
                name: change.name,
                oldCategory: change.oldCategory,
                newCategory: change.newCategory,
                reason: change.reason
              }))
            }
          });
        } else if (brand) {
          const products = await resortService.resortByBrand(brand);
          return NextResponse.json({
            success: true,
            data: {
              type: 'brand',
              target: brand,
              preview: products.changes.map(change => ({
                name: change.name,
                oldCategory: change.oldCategory,
                newCategory: change.newCategory,
                reason: change.reason
              }))
            }
          });
        } else {
          const products = await resortService.resortAllProducts();
          return NextResponse.json({
            success: true,
            data: {
              type: 'all',
              preview: products.changes.map(change => ({
                name: change.name,
                oldCategory: change.oldCategory,
                newCategory: change.newCategory,
                reason: change.reason
              }))
            }
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: report, preview'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Resort API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  } finally {
    await resortService.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category, brand } = body;

    const resortService = new ProductResortService();

    let result;
    switch (action) {
      case 'resort-all':
        result = await resortService.resortAllProducts();
        break;

      case 'resort-category':
        if (!category) {
          return NextResponse.json({
            success: false,
            error: 'Category is required for resort-category action'
          }, { status: 400 });
        }
        result = await resortService.resortByCurrentCategory(category);
        break;

      case 'resort-brand':
        if (!brand) {
          return NextResponse.json({
            success: false,
            error: 'Brand is required for resort-brand action'
          }, { status: 400 });
        }
        result = await resortService.resortByBrand(brand);
        break;

      default:
        await resortService.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: resort-all, resort-category, resort-brand'
        }, { status: 400 });
    }

    await resortService.close();

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: result.totalProcessed,
        reclassified: result.reclassified,
        changes: result.changes
      }
    });

  } catch (error) {
    console.error('Resort API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}