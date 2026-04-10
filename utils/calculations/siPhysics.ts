import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { SelectedComponents } from '@/types/drone';
import { WeightBreakdown, WeightCalculator } from './weight';

const G = 9.80665;
const NOMINAL_CELL_VOLTAGE = 3.7;
const FULL_CELL_VOLTAGE = 4.2;
const DEFAULT_AIR_DENSITY = 1.225;

export interface BatteryProfile {
  cells: number;
  nominalVoltage: number;
  fullVoltage: number;
  capacityAh: number;
  usableCapacityAh: number;
  cRating: number;
  maxContinuousCurrentA: number;
}

export interface SIPhysicsResult {
  mass: {
    breakdown: WeightBreakdown;
    totalGrams: number;
    totalKg: number;
    totalWeightN: number;
  };
  battery: BatteryProfile;
  motor: {
    kv: number;
    statorMm: number;
    loadedRpmNominal: number;
    loadedRpmFull: number;
    motorEfficiency: number;
    propDiameterIn: number;
    propDiameterM: number;
    propPitchIn: number;
    propPitchM: number;
  };
  thrust: {
    source: 'spec' | 'model' | 'blended';
    perMotorN: number;
    totalN: number;
    totalGrams: number;
    thrustToWeightRatio: number;
  };
  hover: {
    throttlePercent: number;
    hoverPowerW: number;
    hoverCurrentA: number;
    hoverEfficiencyGramPerWatt: number;
  };
  power: {
    propulsionEfficiency: number;
    averagePowerW: number;
    averageCurrentA: number;
    cruisePowerW: number;
    sportPowerW: number;
    aggressivePowerW: number;
    sportCurrentA: number;
    aggressiveCurrentA: number;
  };
  flight: {
    hoverMin: number;
    cruiseMin: number;
    aggressiveMin: number;
    mixedMin: number;
    batteryUtilizationPercent: number;
  };
  speed: {
    frontalAreaM2: number;
    dragCoefficient: number;
    dragLimitedKmh: number;
    pitchLimitedKmh: number;
    estimatedTopSpeedKmh: number;
  };
}

export interface SIPhysicsValidation {
  isRealistic: boolean;
  warnings: string[];
  flags: {
    thrustTooLow: boolean;
    thrustTooHigh: boolean;
    hoverThrottleTooHigh: boolean;
    efficiencyOutOfRange: boolean;
    topSpeedOutOfRange: boolean;
    currentExceedsBatteryCapability: boolean;
    flightTimeOutOfRange: boolean;
    suspiciousThrustOutput: boolean;
  };
}

export const roundTo = (value: number, decimals = 2): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
};

const parseNumber = (value: string | number | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (!value) {
    return fallback;
  }

  const normalized = value.replace(',', '.');
  const match = normalized.match(/(-?\d+(?:\.\d+)?)/);

  if (!match) {
    return fallback;
  }

  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseLengthMeters = (value: string | number | undefined, assume: 'mm' | 'in' = 'mm'): number => {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value === 'number') {
    return assume === 'mm' ? value / 1000 : value * 0.0254;
  }

  const lower = value.toLowerCase();
  const amount = parseNumber(value, 0);

  if (amount <= 0) {
    return 0;
  }

  if (lower.includes('mm')) {
    return amount / 1000;
  }

  if (lower.includes('cm')) {
    return amount / 100;
  }

  if (lower.includes('m') && !lower.includes('mm') && !lower.includes('cm')) {
    return amount;
  }

  if (lower.includes('in') || lower.includes('inch') || lower.includes('"')) {
    return amount * 0.0254;
  }

  return assume === 'mm' ? amount / 1000 : amount * 0.0254;
};

const parseCapacityAh = (value: string | number | undefined, fallbackAh = 1.3): number => {
  if (value === undefined || value === null) {
    return fallbackAh;
  }

  if (typeof value === 'number') {
    return value > 20 ? value / 1000 : value;
  }

  const lower = value.toLowerCase();
  const amount = parseNumber(value, fallbackAh * 1000);

  if (amount <= 0) {
    return fallbackAh;
  }

  if (lower.includes('mah')) {
    return amount / 1000;
  }

  if (lower.includes('ah')) {
    return amount;
  }

  // If no unit is provided, assume mAh for large values.
  return amount > 20 ? amount / 1000 : amount;
};

const parseCRating = (value: string | number | undefined, fallback = 70): number => {
  const c = parseNumber(value, fallback);
  return clamp(c, 5, 220);
};

const parseCellCount = (
  voltageOrCellString: string | undefined,
  fallback = 4,
  allowNumericVoltageInference = true
): number => {
  if (!voltageOrCellString) {
    return fallback;
  }

  const lower = voltageOrCellString.toLowerCase();
  const sMatch = lower.match(/(\d+)\s*s/);
  if (sMatch) {
    return clamp(Number.parseInt(sMatch[1], 10), 1, 12);
  }

  const voltage = parseNumber(voltageOrCellString, 0);
  if (allowNumericVoltageInference && voltage > 0) {
    return clamp(Math.round(voltage / NOMINAL_CELL_VOLTAGE), 1, 12);
  }

  return fallback;
};

const parseStatorMm = (statorSize: string | number | undefined, fallback = 22): number => {
  if (statorSize === undefined || statorSize === null) {
    return fallback;
  }

  if (typeof statorSize === 'number') {
    if (statorSize > 99) {
      return clamp(Math.floor(statorSize / 100), 8, 40);
    }

    return clamp(statorSize, 8, 40);
  }

  const compactMatch = statorSize.match(/(\d{4})/);
  if (compactMatch) {
    return clamp(Number.parseInt(compactMatch[1].slice(0, 2), 10), 8, 40);
  }

  return clamp(parseNumber(statorSize, fallback), 8, 40);
};

const parsePropDimensions = (
  size: string | number | undefined,
  pitch: string | number | undefined
): { diameterIn: number; pitchIn: number } => {
  let diameterIn = 5;
  let pitchIn = 4.3;

  if (typeof size === 'string') {
    const sizeMatch = size.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
    if (sizeMatch) {
      diameterIn = parseNumber(sizeMatch[1], diameterIn);

      // Only use pitch from size when no dedicated pitch value is available.
      if (!pitch) {
        pitchIn = parseNumber(sizeMatch[2], pitchIn);
      }
    } else if (size.toLowerCase().includes('mm')) {
      diameterIn = parseLengthMeters(size, 'mm') / 0.0254;
    } else {
      diameterIn = parseNumber(size, diameterIn);
    }
  } else if (typeof size === 'number') {
    diameterIn = size;
  }

  if (typeof pitch === 'string') {
    if (pitch.toLowerCase().includes('mm')) {
      pitchIn = parseLengthMeters(pitch, 'mm') / 0.0254;
    } else {
      pitchIn = parseNumber(pitch, pitchIn);
    }
  } else if (typeof pitch === 'number') {
    pitchIn = pitch;
  }

  diameterIn = clamp(diameterIn, 1, 14);
  pitchIn = clamp(pitchIn, 1, 10);

  return { diameterIn, pitchIn };
};

const parseSpecThrustPerMotorN = (
  maxThrust: string | undefined,
  actualFullVoltage: number,
  propDiameterIn: number
): number => {
  if (!maxThrust) {
    return 0;
  }

  const lower = maxThrust.toLowerCase();
  const numericValue = parseNumber(maxThrust, 0);

  if (numericValue <= 0) {
    return 0;
  }

  let baseNewton = 0;

  if (lower.includes('kg')) {
    baseNewton = numericValue * G;
  } else if (lower.includes(' g') || lower.endsWith('g') || lower.includes('gram')) {
    baseNewton = (numericValue / 1000) * G;
  } else if (lower.includes('n')) {
    baseNewton = numericValue;
  } else {
    // Common FPV data source provides "1.8" meaning "1.8kg".
    if (numericValue <= 8) {
      baseNewton = numericValue * G;
    } else {
      baseNewton = (numericValue / 1000) * G;
    }
  }

  // Max-thrust strings often include mass units (e.g. "1.8kg") and should not be
  // interpreted as voltage when inferring the reference cell count.
  const referenceCells = parseCellCount(maxThrust, 6, false);
  const referenceFullVoltage = referenceCells * FULL_CELL_VOLTAGE;
  const voltageScale = clamp(Math.pow(actualFullVoltage / referenceFullVoltage, 1.7), 0.55, 1.55);

  const propScale = clamp(Math.pow(propDiameterIn / 5, 1.6), 0.7, 1.5);

  return clamp(baseNewton * voltageScale * propScale, 0.6, 45);
};

const estimateFallbackThrustPerMotorN = (
  loadedRpmFull: number,
  propDiameterM: number,
  propDiameterIn: number,
  propPitchIn: number,
  statorMm: number,
  motorEfficiency: number,
  airDensity: number
): number => {
  const n = loadedRpmFull / 60; // rev/s
  const pitchRatio = clamp(propPitchIn / propDiameterIn, 0.2, 1.8);

  // Typical static-thrust coefficient range for multirotor props.
  const thrustCoefficient = clamp(0.055 + pitchRatio * 0.012, 0.045, 0.095);

  let thrust = thrustCoefficient * airDensity * n * n * Math.pow(propDiameterM, 4);

  const statorFactor = clamp(Math.sqrt(statorMm / 22), 0.75, 1.35);
  const efficiencyFactor = clamp(motorEfficiency / 0.85, 0.85, 1.12);

  thrust *= statorFactor * efficiencyFactor;

  return clamp(thrust, 0.6, 40);
};

const getMotorEfficiency = (
  statorMm: number,
  kv: number,
  nominalVoltage: number,
  settings: AdvancedSettings
): number => {
  const bySize = settings.motor.efficiencyByStatorSize;
  let efficiency = settings.motor.baseEfficiency;

  if (statorMm < 20) {
    efficiency = bySize.verySmall;
  } else if (statorMm < 22) {
    efficiency = bySize.small;
  } else if (statorMm < 25) {
    efficiency = bySize.standard;
  } else if (statorMm < 28) {
    efficiency = bySize.mediumLarge;
  } else {
    efficiency = bySize.large;
  }

  const optimalKv = settings.motor.kvOptimizationCurve.baseKV
    + (nominalVoltage - 14.8) * settings.motor.kvOptimizationCurve.voltageMultiplier;

  const deviation = Math.abs(kv - optimalKv) / Math.max(optimalKv, 1);

  if (deviation > 0.45) {
    efficiency *= 0.88;
  } else if (deviation > 0.3) {
    efficiency *= 0.93;
  } else if (deviation < 0.12) {
    efficiency *= 1.02;
  }

  return clamp(efficiency, 0.68, 0.94);
};

const getEscEfficiency = (escCurrentRating: string | undefined, settings: AdvancedSettings): number => {
  const current = parseNumber(escCurrentRating, 40);
  const escEfficiency = settings.system.escEfficiency;

  if (current >= 60) {
    return escEfficiency.highEnd;
  }

  if (current >= 40) {
    return escEfficiency.standard;
  }

  if (current >= 25) {
    return escEfficiency.budget;
  }

  return escEfficiency.lowEnd;
};

const estimateFrontalAreaM2 = (wheelbaseMm: number, propDiameterIn: number): number => {
  const wheelbaseM = wheelbaseMm > 0 ? wheelbaseMm / 1000 : propDiameterIn * 0.0254 * 3.8;
  return clamp(0.45 * wheelbaseM * wheelbaseM + 0.008, 0.012, 0.085);
};

const getClassMassFloorGrams = (propDiameterIn: number, hasCoreComponents: boolean): number => {
  let completeBuildFloor = 320;

  if (propDiameterIn <= 2.2) {
    completeBuildFloor = 40;
  } else if (propDiameterIn <= 3.2) {
    completeBuildFloor = 85;
  } else if (propDiameterIn <= 4.2) {
    completeBuildFloor = 170;
  } else if (propDiameterIn <= 5.3) {
    completeBuildFloor = 320;
  } else if (propDiameterIn <= 6.3) {
    completeBuildFloor = 420;
  } else if (propDiameterIn <= 7.5) {
    completeBuildFloor = 520;
  } else {
    completeBuildFloor = 650;
  }

  // For incomplete builds (missing core components), keep a lower floor so
  // in-progress configuration previews still respond naturally.
  return hasCoreComponents
    ? completeBuildFloor
    : Math.round(Math.max(30, completeBuildFloor * 0.45));
};

const getHoverRealityMultiplier = (propDiameterIn: number): number => {
  // Momentum-theory-only power is optimistic for FPV quads. Apply an empirical
  // correction so hover current and mixed-flight time align with real-world logs.
  // Typical range maps to roughly 2.8x (micro) .. 3.5x (larger props).
  return clamp(2.55 + propDiameterIn * 0.13, 2.75, 3.55);
};

const estimateTopSpeedKmh = (
  totalThrustN: number,
  thrustToWeightRatio: number,
  loadedRpmFull: number,
  propPitchM: number,
  airDensity: number,
  frontalAreaM2: number,
  wheelbaseMm: number
): {
  estimated: number;
  dragLimited: number;
  pitchLimited: number;
  dragCoefficient: number;
} => {
  const dragCoefficient = clamp(1.05 + (frontalAreaM2 - 0.03) * 1.2, 0.9, 1.45);
  const forwardThrustFraction = clamp(0.15 + 0.05 * (thrustToWeightRatio - 1), 0.1, 0.42);
  const forwardThrustN = totalThrustN * forwardThrustFraction;

  const dragLimitedMs = Math.sqrt((2 * forwardThrustN) / (airDensity * dragCoefficient * frontalAreaM2));
  const pitchLimitedMs = (loadedRpmFull / 60) * propPitchM * 0.9;

  const dragLimitedKmh = dragLimitedMs * 3.6;
  const pitchLimitedKmh = pitchLimitedMs * 3.6;

  let estimated = Math.min(dragLimitedKmh, pitchLimitedKmh);

  let maxRealisticKmh = 190;
  if (wheelbaseMm <= 130) {
    maxRealisticKmh = 130;
  } else if (wheelbaseMm <= 170) {
    maxRealisticKmh = 165;
  } else if (wheelbaseMm <= 250) {
    maxRealisticKmh = 220;
  } else if (wheelbaseMm <= 320) {
    maxRealisticKmh = 190;
  } else {
    maxRealisticKmh = 160;
  }

  estimated = clamp(estimated, 10, maxRealisticKmh);

  return {
    estimated,
    dragLimited: dragLimitedKmh,
    pitchLimited: pitchLimitedKmh,
    dragCoefficient
  };
};

const getTemperatureFactor = (temperature: number, settings: AdvancedSettings): number => {
  const temp = settings.battery.temperatureEfficiency;

  if (temperature < 0) return temp.freezing;
  if (temperature < 10) return temp.cold;
  if (temperature < 20) return temp.cool;
  if (temperature <= 25) return temp.optimal;
  if (temperature <= 35) return temp.warm;
  if (temperature <= 45) return temp.hot;

  return temp.extreme;
};

const normalizeMix = (settings: AdvancedSettings): { hover: number; cruise: number; sport: number; aggressive: number } => {
  const mix = settings.power.flightMixing;
  const total = Math.max(mix.hoverRatio + mix.cruiseRatio + mix.sportRatio + mix.aggressiveRatio, 0.0001);

  return {
    hover: mix.hoverRatio / total,
    cruise: mix.cruiseRatio / total,
    sport: mix.sportRatio / total,
    aggressive: mix.aggressiveRatio / total
  };
};

export const buildBatteryProfile = (
  components: SelectedComponents,
  settings: AdvancedSettings = defaultAdvancedSettings
): BatteryProfile => {
  const battery = components.battery?.data;

  const cells = parseCellCount(battery?.voltage, 4);
  const nominalVoltage = cells * NOMINAL_CELL_VOLTAGE;
  const fullVoltage = cells * FULL_CELL_VOLTAGE;

  const capacityAh = parseCapacityAh(battery?.capacity, 1.3);
  const cRating = parseCRating(battery?.cRating, 70);

  // Requirement: default around 80% usable capacity.
  const baseUsableFactor = clamp(settings.battery.usableCapacityFactor || 0.8, 0.6, 0.95);
  const temperatureFactor = getTemperatureFactor(settings.environment.temperature, settings);
  const ageFactor = clamp(settings.battery.ageFactor, 0.6, 1);

  const usableCapacityAh = capacityAh * baseUsableFactor * temperatureFactor * ageFactor;
  const maxContinuousCurrentA = capacityAh * cRating;

  return {
    cells,
    nominalVoltage,
    fullVoltage,
    capacityAh,
    usableCapacityAh,
    cRating,
    maxContinuousCurrentA
  };
};

export const computeSIPhysics = (
  components: SelectedComponents,
  settings: AdvancedSettings = defaultAdvancedSettings
): SIPhysicsResult => {
  const prop = parsePropDimensions(components.prop?.data.size, components.prop?.data.pitch);
  const propDiameterM = prop.diameterIn * 0.0254;
  const propPitchM = prop.pitchIn * 0.0254;

  const massBreakdown = WeightCalculator.calculateWeights(components);
  const totalGramsFromWeights = Math.max(0, massBreakdown.total);

  const hasCoreComponents = Boolean(
    components.motor
    && components.frame
    && components.stack
    && components.prop
    && components.battery
  );

  const classMassFloorGrams = getClassMassFloorGrams(prop.diameterIn, hasCoreComponents);
  const effectiveMassGrams = Math.max(totalGramsFromWeights, classMassFloorGrams);

  // If any component weights are missing/zero, keep a fallback total mass floor so equations stay stable.
  const totalMassKg = clamp(effectiveMassGrams / 1000, 0.03, 40);
  const totalWeightN = totalMassKg * G;

  const battery = buildBatteryProfile(components, settings);

  const kv = clamp(components.motor?.data.kv || 2000, 500, 4000);
  const statorMm = parseStatorMm(components.motor?.data.statorSize, 22);

  const motorEfficiency = getMotorEfficiency(statorMm, kv, battery.nominalVoltage, settings);
  const loadedRpmNominal = kv * battery.nominalVoltage * motorEfficiency * 0.92;
  const loadedRpmFull = kv * battery.fullVoltage * motorEfficiency * 0.92;

  const airDensity = clamp(settings.environment.airDensity || DEFAULT_AIR_DENSITY, 0.8, 1.3);

  const specPerMotorN = parseSpecThrustPerMotorN(
    components.motor?.data.maxThrust,
    battery.fullVoltage,
    prop.diameterIn
  );

  const fallbackPerMotorN = estimateFallbackThrustPerMotorN(
    loadedRpmFull,
    propDiameterM,
    prop.diameterIn,
    prop.pitchIn,
    statorMm,
    motorEfficiency,
    airDensity
  );

  let source: 'spec' | 'model' | 'blended' = 'model';
  let perMotorN = fallbackPerMotorN;

  if (specPerMotorN > 0 && fallbackPerMotorN > 0) {
    perMotorN = specPerMotorN * 0.75 + fallbackPerMotorN * 0.25;
    source = 'blended';
  } else if (specPerMotorN > 0) {
    perMotorN = specPerMotorN;
    source = 'spec';
  }

  perMotorN = clamp(perMotorN, 0.6, 40);

  const totalThrustN = perMotorN * 4;
  const totalThrustGrams = (totalThrustN / G) * 1000;
  const thrustToWeightRatio = totalWeightN > 0 ? totalThrustN / totalWeightN : 0;

  const hoverThrottlePercent = totalThrustN > 0
    ? clamp((totalWeightN / totalThrustN) * 100, 0, 100)
    : 100;

  const singleDiskAreaM2 = Math.PI * Math.pow(propDiameterM / 2, 2);
  const totalDiskAreaM2 = Math.max(singleDiskAreaM2 * 4, 0.0001);

  const inducedVelocity = Math.sqrt(totalWeightN / (2 * airDensity * totalDiskAreaM2));
  const idealHoverPowerW = totalWeightN * inducedVelocity;

  const pitchRatio = clamp(prop.pitchIn / prop.diameterIn, 0.2, 1.8);
  let propEfficiency = clamp(settings.propeller.baseEfficiency, 0.55, 0.9);

  const optimalMin = settings.propeller.optimalAdvanceRatio.min;
  const optimalMax = settings.propeller.optimalAdvanceRatio.max;
  if (pitchRatio >= optimalMin && pitchRatio <= optimalMax) {
    propEfficiency += 0.03;
  } else if (pitchRatio < optimalMin * 0.8 || pitchRatio > optimalMax * 1.25) {
    propEfficiency -= 0.06;
  } else {
    propEfficiency -= 0.02;
  }

  const propMaterial = components.prop?.data.material?.toLowerCase() || '';
  if (propMaterial.includes('carbon')) {
    propEfficiency *= settings.propeller.materialFactors.carbon;
  } else if (propMaterial.includes('glass')) {
    propEfficiency *= settings.propeller.materialFactors.glassFilled;
  } else if (propMaterial.includes('plastic')) {
    propEfficiency *= settings.propeller.materialFactors.plastic;
  }

  propEfficiency = clamp(propEfficiency, 0.5, 0.92);

  const escEfficiency = getEscEfficiency(components.stack?.data.escCurrentRating, settings);
  const wiringEfficiency = clamp(settings.system.wiringEfficiency, 0.75, 0.99);

  const propulsionEfficiency = clamp(
    motorEfficiency
      * propEfficiency
      * escEfficiency
      * wiringEfficiency
      * clamp(settings.system.conditionFactor, 0.8, 1)
      * clamp(settings.system.toleranceFactor, 0.85, 1),
    0.3,
    0.88
  );

  const hoverRealityMultiplier = getHoverRealityMultiplier(prop.diameterIn);
  const hoverPowerW = clamp((idealHoverPowerW / propulsionEfficiency) * hoverRealityMultiplier, 20, 6000);
  const hoverCurrentA = hoverPowerW / battery.nominalVoltage;

  const cruisePowerW = hoverPowerW * clamp(settings.power.thrustFactors.cruise, 1.1, 2.2);
  const sportPowerW = hoverPowerW * clamp(settings.power.thrustFactors.sport, 1.3, 2.8);
  const aggressivePowerW = hoverPowerW * clamp(settings.power.thrustFactors.aggressive, 1.7, 3.4);

  const mix = normalizeMix(settings);
  const averagePowerW =
    hoverPowerW * mix.hover +
    cruisePowerW * mix.cruise +
    sportPowerW * mix.sport +
    aggressivePowerW * mix.aggressive;

  const averageCurrentA = averagePowerW / battery.nominalVoltage;
  const sportCurrentA = sportPowerW / battery.nominalVoltage;
  const aggressiveCurrentA = aggressivePowerW / battery.nominalVoltage;

  const hoverEfficiencyGramPerWatt = totalGramsFromWeights > 0
    ? effectiveMassGrams / hoverPowerW
    : 0;

  const hoverMin = hoverCurrentA > 0 ? (battery.usableCapacityAh / hoverCurrentA) * 60 : 0;
  const cruiseMin = (cruisePowerW > 0 && battery.nominalVoltage > 0)
    ? (battery.usableCapacityAh / (cruisePowerW / battery.nominalVoltage)) * 60
    : 0;
  const aggressiveMin = aggressiveCurrentA > 0 ? (battery.usableCapacityAh / aggressiveCurrentA) * 60 : 0;
  const mixedMin = averageCurrentA > 0 ? (battery.usableCapacityAh / averageCurrentA) * 60 : 0;

  const batteryUtilizationPercent = battery.maxContinuousCurrentA > 0
    ? (averageCurrentA / battery.maxContinuousCurrentA) * 100
    : 0;

  const wheelbaseMm = parseNumber(components.frame?.data.wheelbase, prop.diameterIn * 25.4 * 3.8);
  const frontalAreaM2 = estimateFrontalAreaM2(wheelbaseMm, prop.diameterIn);

  const speedEstimate = estimateTopSpeedKmh(
    totalThrustN,
    thrustToWeightRatio,
    loadedRpmFull,
    propPitchM,
    airDensity,
    frontalAreaM2,
    wheelbaseMm
  );

  return {
    mass: {
      breakdown: massBreakdown,
      totalGrams: totalMassKg * 1000,
      totalKg: totalMassKg,
      totalWeightN
    },
    battery,
    motor: {
      kv,
      statorMm,
      loadedRpmNominal,
      loadedRpmFull,
      motorEfficiency,
      propDiameterIn: prop.diameterIn,
      propDiameterM,
      propPitchIn: prop.pitchIn,
      propPitchM
    },
    thrust: {
      source,
      perMotorN,
      totalN: totalThrustN,
      totalGrams: totalThrustGrams,
      thrustToWeightRatio
    },
    hover: {
      throttlePercent: hoverThrottlePercent,
      hoverPowerW,
      hoverCurrentA,
      hoverEfficiencyGramPerWatt
    },
    power: {
      propulsionEfficiency,
      averagePowerW,
      averageCurrentA,
      cruisePowerW,
      sportPowerW,
      aggressivePowerW,
      sportCurrentA,
      aggressiveCurrentA
    },
    flight: {
      hoverMin,
      cruiseMin,
      aggressiveMin,
      mixedMin,
      batteryUtilizationPercent
    },
    speed: {
      frontalAreaM2,
      dragCoefficient: speedEstimate.dragCoefficient,
      dragLimitedKmh: speedEstimate.dragLimited,
      pitchLimitedKmh: speedEstimate.pitchLimited,
      estimatedTopSpeedKmh: speedEstimate.estimated
    }
  };
};

export const validateSIPhysics = (result: SIPhysicsResult): SIPhysicsValidation => {
  const warnings: string[] = [];

  const propIn = result.motor.propDiameterIn || 5;

  const maxRealisticTwr = (() => {
    if (propIn <= 2.5) return 8;
    if (propIn <= 3.5) return 10;
    if (propIn <= 4.5) return 13;
    if (propIn <= 5.5) return 18;
    if (propIn <= 7.5) return 15;
    return 13;
  })();

  const suspiciousUpperFactor = (() => {
    if (propIn <= 2.5) return 10;
    if (propIn <= 3.5) return 12;
    if (propIn <= 4.5) return 15;
    if (propIn <= 5.5) return 18;
    if (propIn <= 7.5) return 16;
    return 14;
  })();

  const flags = {
    thrustTooLow: result.thrust.thrustToWeightRatio < 1.2,
    thrustTooHigh: result.thrust.thrustToWeightRatio > maxRealisticTwr,
    hoverThrottleTooHigh: result.hover.throttlePercent > 80,
    efficiencyOutOfRange:
      result.hover.hoverEfficiencyGramPerWatt < 2
      || result.hover.hoverEfficiencyGramPerWatt > 12,
    topSpeedOutOfRange:
      result.speed.estimatedTopSpeedKmh > 230
      || (result.speed.estimatedTopSpeedKmh < 25 && result.thrust.thrustToWeightRatio > 2),
    currentExceedsBatteryCapability:
      result.battery.maxContinuousCurrentA > 0
      && result.power.aggressiveCurrentA > result.battery.maxContinuousCurrentA * 1.05,
    flightTimeOutOfRange:
      result.flight.mixedMin < 1
      || result.flight.mixedMin > 35,
    suspiciousThrustOutput:
      result.thrust.totalGrams > result.mass.totalGrams * suspiciousUpperFactor
      || result.thrust.totalGrams < result.mass.totalGrams * 0.75
  };

  if (flags.thrustTooLow) {
    warnings.push('Thrust-to-weight ratio is below 1.2:1. The configuration may not sustain safe flight.');
  }

  if (flags.thrustTooHigh) {
    warnings.push(`Thrust-to-weight ratio is above expected range for this prop class (>${maxRealisticTwr}:1). Verify motor thrust specifications and unit parsing.`);
  }

  if (flags.hoverThrottleTooHigh) {
    warnings.push('Hover throttle is above 80%. Consider lowering weight or increasing available thrust.');
  }

  if (flags.efficiencyOutOfRange) {
    warnings.push('Hover efficiency (g/W) is outside typical FPV ranges. Review propeller or motor assumptions.');
  }

  if (flags.topSpeedOutOfRange) {
    warnings.push('Estimated top speed falls outside realistic bounds for this build class.');
  }

  if (flags.currentExceedsBatteryCapability) {
    warnings.push('Aggressive current draw exceeds battery continuous C-rating capability.');
  }

  if (flags.flightTimeOutOfRange) {
    warnings.push('Estimated mixed flight time is outside realistic FPV expectations.');
  }

  if (flags.suspiciousThrustOutput) {
    warnings.push('Total thrust magnitude appears suspicious relative to total mass.');
  }

  const isRealistic = !(
    flags.thrustTooLow
    || flags.thrustTooHigh
    || flags.currentExceedsBatteryCapability
    || flags.suspiciousThrustOutput
  );

  return {
    isRealistic,
    warnings,
    flags
  };
};
