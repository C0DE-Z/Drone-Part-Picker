import { prisma } from '@/lib/prisma';
import { PersistResult, NormalizedProductRecord } from './types';

const inferWebsite = (sourceUrl: string): string => {
  try {
    return new URL(sourceUrl).origin;
  } catch {
    return '';
  }
};

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const shouldSkipRecord = (record: NormalizedProductRecord): boolean => {
  const name = record.productName.toLowerCase();

  if (!name || name.length < 5) return true;
  if (record.priceUsd <= 0) return true;
  if (/gift card|sticker|t-shirt|apparel|hat\b/.test(name)) return true;

  return false;
};

export const persistNormalizedProducts = async (
  records: NormalizedProductRecord[]
): Promise<PersistResult> => {
  const result: PersistResult = {
    productsFound: records.length,
    productsCreated: 0,
    productsUpdated: 0
  };

  for (const record of records) {
    if (shouldSkipRecord(record)) {
      continue;
    }

    const vendor = await prisma.vendor.upsert({
      where: { name: record.vendor },
      update: {
        website: inferWebsite(record.sourceUrl) || undefined
      },
      create: {
        name: record.vendor,
        website: inferWebsite(record.sourceUrl)
      }
    });

    const normalizedCategory = record.legacyCategory === 'other' ? 'stack' : record.legacyCategory;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          ...(record.sku
            ? [{ sku: record.sku, category: normalizedCategory }]
            : []),
          {
            name: record.canonicalName,
            category: normalizedCategory,
            brand: record.brand || undefined
          },
          {
            name: record.productName,
            category: normalizedCategory,
            brand: record.brand || undefined
          }
        ]
      }
    });

    const enrichmentPayload = {
      ...record.specifications,
      sourceCategory: record.sourceCategoryKey,
      normalizedCategory: record.category,
      legacyCategory: record.legacyCategory,
      identityKey: record.identityKey,
      confidence: record.confidence,
      quality: record.quality,
      ingest: {
        sourceUrl: record.sourceUrl,
        vendor: record.vendor,
        collectedAt: new Date().toISOString()
      }
    };

    let productId: string;

    if (existingProduct) {
      const previousSpecs = (existingProduct.specifications as Record<string, unknown>) || {};
      const mergedSpecs = {
        ...previousSpecs,
        ...enrichmentPayload
      };

      const updated = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: record.canonicalName,
          category: normalizedCategory,
          brand: record.brand || existingProduct.brand,
          sku: record.sku || existingProduct.sku,
          description: record.description || existingProduct.description,
          imageUrl: record.imageUrl || existingProduct.imageUrl,
          specifications: asJson(mergedSpecs)
        }
      });

      productId = updated.id;
      result.productsUpdated += 1;
    } else {
      const created = await prisma.product.create({
        data: {
          name: record.canonicalName,
          category: normalizedCategory,
          brand: record.brand,
          sku: record.sku,
          description: record.description,
          imageUrl: record.imageUrl,
          specifications: asJson(enrichmentPayload)
        }
      });

      productId = created.id;
      result.productsCreated += 1;
    }

    await prisma.vendorPrice.upsert({
      where: {
        productId_vendorId: {
          productId,
          vendorId: vendor.id
        }
      },
      update: {
        price: record.priceUsd,
        url: record.sourceUrl,
        inStock: record.stockStatus !== 'out_of_stock',
        lastUpdated: new Date()
      },
      create: {
        productId,
        vendorId: vendor.id,
        price: record.priceUsd,
        url: record.sourceUrl,
        inStock: record.stockStatus !== 'out_of_stock'
      }
    });

    await prisma.priceHistory.create({
      data: {
        productId,
        vendorId: vendor.id,
        price: record.priceUsd
      }
    });
  }

  return result;
};
