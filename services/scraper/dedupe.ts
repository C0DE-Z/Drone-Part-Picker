import { DedupedProduct, NormalizedProductRecord, NormalizedSpecification } from './types';

const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenSet = (value: string): Set<string> =>
  new Set(
    normalizeKey(value)
      .split(' ')
      .filter((token) => token.length >= 3)
  );

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
};

const mergeSpecs = (records: NormalizedProductRecord[]): NormalizedSpecification => {
  const merged: NormalizedSpecification = {};

  records.forEach((record) => {
    Object.entries(record.specifications).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      if (!(key in merged)) {
        merged[key] = value;
      }
    });
  });

  return merged;
};

export const dedupeNormalizedRecords = (records: NormalizedProductRecord[]): DedupedProduct[] => {
  const buckets: DedupedProduct[] = [];

  records.forEach((record) => {
    const candidateTokens = tokenSet(record.canonicalName || record.productName);

    const existing = buckets.find((bucket) => {
      if (bucket.identityKey === record.identityKey) return true;
      if (bucket.category !== record.category) return false;
      if (normalizeKey(bucket.brand) !== normalizeKey(record.brand)) return false;

      const bucketTokens = tokenSet(bucket.canonicalName);
      const similarity = jaccardSimilarity(candidateTokens, bucketTokens);
      return similarity >= 0.78;
    });

    if (!existing) {
      buckets.push({
        identityKey: record.identityKey,
        canonicalName: record.canonicalName,
        brand: record.brand,
        model: record.model,
        category: record.category,
        legacyCategory: record.legacyCategory,
        consolidatedSpecs: { ...record.specifications },
        records: [record]
      });
      return;
    }

    existing.records.push(record);

    // Prefer better naming/model confidence when merging.
    if ((record.confidence.overall ?? 0) > (existing.records[0]?.confidence.overall ?? 0)) {
      existing.canonicalName = record.canonicalName;
      existing.model = record.model;
      existing.identityKey = record.identityKey;
    }

    existing.consolidatedSpecs = mergeSpecs(existing.records);
  });

  return buckets;
};
