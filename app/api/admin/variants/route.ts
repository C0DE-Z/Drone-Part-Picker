import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProductVariantService } from '@/services/ProductVariantService';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const variantService = new ProductVariantService();

    switch (action) {
      case 'detect': {
        const products = await prisma.product.findMany({
          select: {
            id: true,
            name: true,
            category: true
          }
        });

        const productsWithVariants = products.filter(product => 
          variantService.hasLikelyVariants(product.name)
        );

        const detectedVariants = productsWithVariants.map(product => {
          const detected = variantService.detectVariants(product.name, product.category);
          return {
            id: product.id,
            name: product.name,
            category: product.category,
            detected
          };
        }).filter(item => item.detected !== null);

        return NextResponse.json({
          success: true,
          data: {
            totalProducts: products.length,
            productsWithVariants: detectedVariants.length,
            products: detectedVariants
          }
        });
      }

      case 'stats': {
        const products = await prisma.product.findMany({
          select: { name: true }
        });

        const productNames = products.map(p => p.name);
        const stats = variantService.getVariantStats(productNames);

        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: detect, stats'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Variant API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, productIds } = body;

    const variantService = new ProductVariantService();

    switch (action) {
      case 'split-single': {
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID is required'
          }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: {
            vendorPrices: true
          }
        });

        if (!product) {
          return NextResponse.json({
            success: false,
            error: 'Product not found'
          }, { status: 404 });
        }

        const splitProducts = variantService.splitProductVariants({
          name: product.name,
          description: product.description || undefined,
          category: product.category,
          brand: product.brand || undefined,
          sku: product.sku || undefined,
          imageUrl: product.imageUrl || undefined,
          specifications: product.specifications as Record<string, unknown> || undefined
        });
        
        if (splitProducts.length <= 1) {
          return NextResponse.json({
            success: false,
            error: 'No variants detected in this product'
          }, { status: 400 });
        }

        const createdProducts = [];
        
        for (const splitProduct of splitProducts) {
          const newProduct = await prisma.product.create({
            data: {
              name: splitProduct.name,
              description: splitProduct.description || '',
              category: splitProduct.category,
              brand: splitProduct.brand || '',
              sku: splitProduct.sku || '',
              imageUrl: splitProduct.imageUrl || ''
            }
          });

          if (product.vendorPrices && product.vendorPrices.length > 0) {
            for (const vendorPrice of product.vendorPrices) {
              await prisma.vendorPrice.create({
                data: {
                  productId: newProduct.id,
                  vendorId: vendorPrice.vendorId,
                  price: vendorPrice.price,
                  currency: vendorPrice.currency,
                  url: vendorPrice.url,
                  inStock: vendorPrice.inStock,
                  lastUpdated: vendorPrice.lastUpdated
                }
              });
            }
          }

          createdProducts.push(newProduct);
        }

        await prisma.product.delete({
          where: { id: productId }
        });

        return NextResponse.json({
          success: true,
          data: {
            originalProduct: product.name,
            createdProducts: createdProducts.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category
            })),
            message: `Split "${product.name}" into ${createdProducts.length} variant products`
          }
        });
      }

      case 'split-batch': {
        if (!productIds || !Array.isArray(productIds)) {
          return NextResponse.json({
            success: false,
            error: 'Product IDs array is required'
          }, { status: 400 });
        }

        const results = [];
        let totalSplit = 0;
        let totalCreated = 0;

        for (const id of productIds) {
          try {
            const product = await prisma.product.findUnique({
              where: { id },
              include: { vendorPrices: true }
            });

            if (!product) {
              results.push({
                id,
                success: false,
                error: 'Product not found'
              });
              continue;
            }

            const splitProducts = variantService.splitProductVariants({
              name: product.name,
              description: product.description || undefined,
              category: product.category,
              brand: product.brand || undefined,
              sku: product.sku || undefined,
              imageUrl: product.imageUrl || undefined,
              specifications: product.specifications as Record<string, unknown> || undefined
            });
            
            if (splitProducts.length <= 1) {
              results.push({
                id,
                success: false,
                name: product.name,
                error: 'No variants detected'
              });
              continue;
            }

            const createdProducts = [];
            
            for (const splitProduct of splitProducts) {
              const newProduct = await prisma.product.create({
                data: {
                  name: splitProduct.name,
                  description: splitProduct.description || '',
                  category: splitProduct.category,
                  brand: splitProduct.brand || '',
                  sku: splitProduct.sku || '',
                  imageUrl: splitProduct.imageUrl || ''
                }
              });

              if (product.vendorPrices && product.vendorPrices.length > 0) {
                for (const vendorPrice of product.vendorPrices) {
                  await prisma.vendorPrice.create({
                    data: {
                      productId: newProduct.id,
                      vendorId: vendorPrice.vendorId,
                      price: vendorPrice.price,
                      currency: vendorPrice.currency,
                      url: vendorPrice.url,
                      inStock: vendorPrice.inStock,
                      lastUpdated: vendorPrice.lastUpdated
                    }
                  });
                }
              }

              createdProducts.push(newProduct);
            }

            await prisma.product.delete({
              where: { id }
            });

            results.push({
              id,
              success: true,
              originalName: product.name,
              createdCount: createdProducts.length,
              createdProducts: createdProducts.map(p => p.name)
            });

            totalSplit++;
            totalCreated += createdProducts.length;

          } catch (error) {
            results.push({
              id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            totalProcessed: productIds.length,
            totalSplit,
            totalCreated,
            results
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: split-single, split-batch'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Variant split error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}