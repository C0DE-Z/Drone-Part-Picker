import { DronePartCategory, NormalizedProductRecord } from './types';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return true;
};

const requirements: Record<DronePartCategory, Array<keyof NormalizedProductRecord['specifications']>> = {
  motor: ['kv', 'statorSize'],
  propeller: ['propSizeInch', 'propPitch'],
  battery: ['batteryCellCount', 'batteryCapacityMah'],
  frame: ['weightGrams'],
  flight_controller: ['voltageSupport'],
  esc: ['voltageSupport'],
  aio: ['voltageSupport'],
  vtx: ['voltageSupport'],
  camera: [],
  receiver: [],
  antenna: [],
  stack: ['voltageSupport'],
  gps: [],
  action_camera_mount: [],
  accessory: [],
  unknown: []
};

export const applyProductQualityValidation = (record: NormalizedProductRecord): NormalizedProductRecord => {
  const requiredFields = requirements[record.category] || [];
  const missingRequired = requiredFields.filter((field) => !hasValue(record.specifications[field]));

  const warnings: string[] = [];

  if (!record.brand || record.brand.toLowerCase() === 'unknown') {
    warnings.push('Brand could not be confidently determined.');
  }

  if (!record.model && ['motor', 'frame', 'propeller', 'battery', 'stack', 'flight_controller'].includes(record.category)) {
    warnings.push('Model identifier not detected.');
  }

  if (record.priceUsd <= 0) {
    warnings.push('Price parsing failed or returned zero.');
  }

  if (record.stockStatus === 'unknown') {
    warnings.push('Stock status could not be determined.');
  }

  if (missingRequired.length > 0) {
    warnings.push(`Missing required fields for ${record.category}: ${missingRequired.join(', ')}`);
  }

  let qualityScore = Math.round(record.confidence.overall * 0.6);
  qualityScore += Math.round((record.confidence.normalization / 100) * 25);
  qualityScore -= missingRequired.length * 12;
  qualityScore -= warnings.filter((warning) => warning.toLowerCase().includes('failed')).length * 6;

  qualityScore = clamp(qualityScore, 0, 100);

  return {
    ...record,
    quality: {
      score: qualityScore,
      missingRequired: missingRequired.map((field) => String(field)),
      warnings
    }
  };
};
