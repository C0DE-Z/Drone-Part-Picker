import { ScrapedProduct } from '@/types/drone';

export type DronePartCategory =
  | 'frame'
  | 'motor'
  | 'flight_controller'
  | 'esc'
  | 'aio'
  | 'vtx'
  | 'camera'
  | 'receiver'
  | 'propeller'
  | 'battery'
  | 'antenna'
  | 'stack'
  | 'gps'
  | 'action_camera_mount'
  | 'accessory'
  | 'unknown';

export type LegacyProductCategory =
  | 'motor'
  | 'frame'
  | 'stack'
  | 'camera'
  | 'prop'
  | 'battery'
  | 'other';

export type StockStatus = 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';

export interface VendorListingDefinition {
  vendor: string;
  baseUrl: string;
  headers?: Record<string, string>;
  rateLimitMs?: number;
  categories: Record<string, {
    path: string;
    maxPages?: number;
    cardSelectors: string[];
    nameSelectors: string[];
    priceSelectors: string[];
    linkSelectors: string[];
    stockSelectors?: string[];
    imageSelectors?: string[];
    brandSelectors?: string[];
    descriptionSelectors?: string[];
  }>;
}

export interface RawListingProduct {
  vendor: string;
  listingCategoryKey: string;
  sourceListingUrl: string;
  sourceProductUrl: string;
  rawName: string;
  rawPrice?: string;
  rawBrand?: string;
  rawStock?: string;
  imageUrl?: string;
  rawDescription?: string;
}

export interface ParsedDetailData {
  title?: string;
  description?: string;
  sku?: string;
  brand?: string;
  stockText?: string;
  variants?: string[];
  specificationPairs: Record<string, string>;
  bulletLines: string[];
}

export interface FieldWithConfidence<T> {
  value: T | null;
  confidence: number;
  source: 'title' | 'table' | 'bullet' | 'description' | 'listing' | 'inferred' | 'none';
}

export interface NormalizedSpecification {
  kv?: number;
  statorSize?: string;
  propSizeInch?: number;
  propPitch?: number;
  batteryCellCount?: number;
  batteryCapacityMah?: number;
  voltageSupport?: string;
  weightGrams?: number;
  model?: string;
  [key: string]: string | number | undefined;
}

export interface NormalizedProductRecord {
  vendor: string;
  sourceUrl: string;
  storefront: string;
  sourceCategoryKey: string;

  productName: string;
  canonicalName: string;
  brand: string;
  model?: string;

  category: DronePartCategory;
  legacyCategory: LegacyProductCategory;

  priceUsd: number;
  stockStatus: StockStatus;
  imageUrl?: string;
  description?: string;
  sku?: string;

  specifications: NormalizedSpecification;

  confidence: {
    overall: number;
    category: number;
    normalization: number;
    fields: Record<string, number>;
  };

  quality: {
    score: number;
    missingRequired: string[];
    warnings: string[];
  };

  identityKey: string;
}

export interface DedupedProduct {
  identityKey: string;
  canonicalName: string;
  brand: string;
  model?: string;
  category: DronePartCategory;
  legacyCategory: LegacyProductCategory;
  consolidatedSpecs: NormalizedSpecification;
  records: NormalizedProductRecord[];
}

export interface ScraperPipelineResult {
  vendor?: string;
  sourceCategory?: string;
  listingPagesVisited: number;
  rawCount: number;
  normalizedCount: number;
  dedupedCount: number;
  lowConfidenceCount: number;
  invalidCount: number;
  records: NormalizedProductRecord[];
  deduped: DedupedProduct[];
}

export interface PersistResult {
  productsFound: number;
  productsCreated: number;
  productsUpdated: number;
}

export interface ScrapeTestResult {
  success: boolean;
  products: ScrapedProduct[];
  error?: string;
  meta?: {
    lowConfidenceCount: number;
    dedupedCount: number;
  };
}
