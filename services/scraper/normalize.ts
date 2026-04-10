import { ClassificationResult } from './classifier';
import {
  LegacyProductCategory,
  NormalizedProductRecord,
  NormalizedSpecification,
  ParsedDetailData,
  RawListingProduct,
  StockStatus
} from './types';

const KNOWN_BRANDS = [
  't-motor',
  'tmotor',
  'iflight',
  'emax',
  'happymodel',
  'foxeer',
  'runcam',
  'axisflying',
  'speedybee',
  'diatone',
  'geprc',
  'gemfan',
  'hqprop',
  'ethix',
  'lumenier',
  'matek',
  'mamba',
  'holybro',
  'radiomaster',
  'frsky',
  'tbs',
  'walksnail',
  'dji',
  'caddx',
  'rushfpv',
  'flywoo',
  'newbeedrone',
  'gnb',
  'gaoneng'
];

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toLower = (value?: string): string => (value || '').toLowerCase();

const cleanText = (value?: string): string =>
  (value || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

const parsePriceUsd = (value?: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/,/g, '');
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  return Number.parseFloat(match[1]) || 0;
};

const parseStockStatus = (rawStock?: string, detailStock?: string): StockStatus => {
  const text = `${rawStock || ''} ${detailStock || ''}`.toLowerCase();
  if (!text.trim()) return 'unknown';
  if (/out of stock|sold out|unavailable|backorder/.test(text)) return 'out_of_stock';
  if (/preorder|pre-order|back order/.test(text)) return 'preorder';
  if (/in stock|available|add to cart|ships/.test(text)) return 'in_stock';
  return 'unknown';
};

const findBrand = (name: string, listingBrand?: string, detailBrand?: string): { brand: string; confidence: number } => {
  const listingCandidate = cleanText(listingBrand);
  const detailCandidate = cleanText(detailBrand);

  if (detailCandidate) {
    return { brand: detailCandidate, confidence: 90 };
  }

  if (listingCandidate) {
    return { brand: listingCandidate, confidence: 84 };
  }

  const lower = toLower(name);
  const matched = KNOWN_BRANDS.find((brand) => lower.includes(brand));
  if (matched) {
    return {
      brand: matched
        .split(/[-\s]/g)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      confidence: 72
    };
  }

  const firstWord = cleanText(name).split(' ')[0] || 'Unknown';
  return { brand: firstWord, confidence: 35 };
};

const findModel = (name: string, details: ParsedDetailData): { model?: string; confidence: number } => {
  const sourceText = `${name} ${details.title || ''} ${Object.values(details.specificationPairs).join(' ')}`;

  const explicit = sourceText.match(/\b([A-Z]{1,4}\d{1,4}[A-Z]?\d*)\b/);
  if (explicit) {
    return { model: explicit[1], confidence: 75 };
  }

  const statorKv = sourceText.match(/\b(\d{4})\b\s*(?:\d{3,4}\s*kv)?/i);
  if (statorKv) {
    return { model: statorKv[1], confidence: 60 };
  }

  return { model: undefined, confidence: 15 };
};

const parseKv = (raw: RawListingProduct, details: ParsedDetailData): { value?: number; confidence: number } => {
  const text = `${raw.rawName} ${raw.rawDescription || ''} ${details.description || ''} ${Object.values(details.specificationPairs).join(' ')} ${details.bulletLines.join(' ')}`.toLowerCase();
  const match = text.match(/(\d{3,4})\s*kv\b/);
  if (!match) return { confidence: 0 };
  return { value: Number.parseInt(match[1], 10), confidence: 82 };
};

const parseStator = (raw: RawListingProduct, details: ParsedDetailData): { value?: string; confidence: number } => {
  const combined = `${raw.rawName} ${details.title || ''} ${details.description || ''}`;
  const match = combined.match(/\b(\d{4})\b/);
  if (!match) return { confidence: 0 };

  const value = match[1];
  const plausible = /^((11|12|13|14|15|16|18|20|22|23|24|25|26|27|28|30)\d{2})$/.test(value);
  return plausible ? { value, confidence: 76 } : { confidence: 0 };
};

const parseProp = (raw: RawListingProduct, details: ParsedDetailData): { size?: number; pitch?: number; confidence: number } => {
  const text = `${raw.rawName} ${details.title || ''} ${details.description || ''}`.toLowerCase();

  const pattern = text.match(/\b(\d(?:\.\d+)?)\s*[x×]\s*(\d(?:\.\d+)?)\b/);
  if (pattern) {
    return {
      size: Number.parseFloat(pattern[1]),
      pitch: Number.parseFloat(pattern[2]),
      confidence: 86
    };
  }

  const simple = text.match(/\b(\d(?:\.\d+)?)\s*(?:inch|in|\")\b/);
  if (simple) {
    return {
      size: Number.parseFloat(simple[1]),
      confidence: 65
    };
  }

  return { confidence: 0 };
};

const parseBatteryInfo = (raw: RawListingProduct, details: ParsedDetailData): {
  cellCount?: number;
  capacityMah?: number;
  confidence: number;
} => {
  const text = `${raw.rawName} ${raw.rawDescription || ''} ${details.title || ''} ${details.description || ''} ${Object.values(details.specificationPairs).join(' ')}`.toLowerCase();

  const cellMatch = text.match(/\b(\d{1,2})\s*s\b/);
  const capMatch = text.match(/\b(\d{3,5})\s*mah\b/);

  const cellCount = cellMatch ? Number.parseInt(cellMatch[1], 10) : undefined;
  const capacityMah = capMatch ? Number.parseInt(capMatch[1], 10) : undefined;

  let confidence = 0;
  if (cellCount) confidence += 40;
  if (capacityMah) confidence += 40;

  return { cellCount, capacityMah, confidence };
};

const parseWeightGrams = (raw: RawListingProduct, details: ParsedDetailData): { value?: number; confidence: number } => {
  const text = `${raw.rawName} ${raw.rawDescription || ''} ${details.description || ''} ${Object.values(details.specificationPairs).join(' ')}`.toLowerCase();
  const gramMatch = text.match(/\b(\d+(?:\.\d+)?)\s*g\b/);
  if (gramMatch) {
    return { value: Number.parseFloat(gramMatch[1]), confidence: 70 };
  }

  const kiloMatch = text.match(/\b(\d+(?:\.\d+)?)\s*kg\b/);
  if (kiloMatch) {
    return { value: Number.parseFloat(kiloMatch[1]) * 1000, confidence: 70 };
  }

  return { confidence: 0 };
};

const parseVoltageSupport = (raw: RawListingProduct, details: ParsedDetailData): { value?: string; confidence: number } => {
  const text = `${raw.rawName} ${raw.rawDescription || ''} ${details.description || ''} ${Object.values(details.specificationPairs).join(' ')}`;
  const rangeMatch = text.match(/\b(\d+\s*s\s*[-–]\s*\d+\s*s)\b/i);
  if (rangeMatch) {
    return { value: rangeMatch[1].replace(/\s+/g, ''), confidence: 68 };
  }

  const single = text.match(/\b(\d+\s*s)\b/i);
  if (single) {
    return { value: single[1].replace(/\s+/g, ''), confidence: 56 };
  }

  return { confidence: 0 };
};

const canonicalizeName = (name: string): string =>
  cleanText(name)
    .replace(/[\[\]{}()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildIdentityKey = (
  legacyCategory: LegacyProductCategory,
  brand: string,
  model: string | undefined,
  canonicalName: string
): string => {
  const base = `${legacyCategory}|${brand}|${model || canonicalName}`
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return base.slice(0, 160);
};

export const normalizeProductRecord = (
  listing: RawListingProduct,
  details: ParsedDetailData,
  classification: ClassificationResult
): NormalizedProductRecord => {
  const productName = canonicalizeName(details.title || listing.rawName);

  const brandResult = findBrand(productName, listing.rawBrand, details.brand);
  const modelResult = findModel(productName, details);

  const kvResult = parseKv(listing, details);
  const statorResult = parseStator(listing, details);
  const propResult = parseProp(listing, details);
  const batteryResult = parseBatteryInfo(listing, details);
  const weightResult = parseWeightGrams(listing, details);
  const voltageResult = parseVoltageSupport(listing, details);

  const canonicalName = canonicalizeName(
    `${brandResult.brand} ${modelResult.model || productName}`
      .replace(new RegExp(`^${brandResult.brand}\s+`, 'i'), `${brandResult.brand} `)
  );

  const identityKey = buildIdentityKey(
    classification.legacyCategory,
    brandResult.brand,
    modelResult.model,
    canonicalName
  );

  const specifications: NormalizedSpecification = {
    kv: kvResult.value,
    statorSize: statorResult.value,
    propSizeInch: propResult.size,
    propPitch: propResult.pitch,
    batteryCellCount: batteryResult.cellCount,
    batteryCapacityMah: batteryResult.capacityMah,
    voltageSupport: voltageResult.value,
    weightGrams: weightResult.value,
    model: modelResult.model,
    ...Object.fromEntries(
      Object.entries(details.specificationPairs)
        .slice(0, 50)
        .map(([k, v]) => [cleanText(k).slice(0, 60), cleanText(v).slice(0, 120)])
    )
  };

  const fields: Record<string, number> = {
    brand: brandResult.confidence,
    model: modelResult.confidence,
    kv: kvResult.confidence,
    stator: statorResult.confidence,
    prop: propResult.confidence,
    battery: batteryResult.confidence,
    weight: weightResult.confidence,
    voltage: voltageResult.confidence,
    category: classification.confidence
  };

  const normalizationScore = clamp(
    Math.round(
      Object.values(fields).reduce((sum, value) => sum + value, 0) /
      Math.max(Object.values(fields).length, 1)
    ),
    0,
    100
  );

  const overallConfidence = clamp(
    Math.round(classification.confidence * 0.45 + normalizationScore * 0.55),
    0,
    100
  );

  const sourceDescription = cleanText(details.description || listing.rawDescription);

  return {
    vendor: listing.vendor,
    sourceUrl: listing.sourceProductUrl,
    storefront: listing.vendor,
    sourceCategoryKey: listing.listingCategoryKey,
    productName,
    canonicalName,
    brand: brandResult.brand,
    model: modelResult.model,
    category: classification.category,
    legacyCategory: classification.legacyCategory,
    priceUsd: parsePriceUsd(listing.rawPrice),
    stockStatus: parseStockStatus(listing.rawStock, details.stockText),
    imageUrl: listing.imageUrl,
    description: sourceDescription || undefined,
    sku: cleanText(details.sku) || undefined,
    specifications,
    confidence: {
      overall: overallConfidence,
      category: classification.confidence,
      normalization: normalizationScore,
      fields
    },
    quality: {
      score: 0,
      missingRequired: [],
      warnings: []
    },
    identityKey
  };
};
