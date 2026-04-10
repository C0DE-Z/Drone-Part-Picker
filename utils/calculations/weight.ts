import { SelectedComponents } from '@/types/drone';

export interface WeightBreakdown {
  motor: number;
  frame: number;
  stack: number;
  camera: number;
  prop: number;
  battery: number;
  customWeights: number;
  total: number;
}

export class WeightCalculator {
  static calculateWeights(components: SelectedComponents): WeightBreakdown {
    const weights: WeightBreakdown = {
      motor: 0,
      frame: 0,
      stack: 0,
      camera: 0,
      prop: 0,
      battery: 0,
      customWeights: 0,
      total: 0
    };

    if (components.motor) {
      const explicitMotorWeight = this.parseWeight(components.motor.data.weight);
      const perMotorWeight = explicitMotorWeight > 0
        ? explicitMotorWeight
        : this.estimateMotorWeight(components.motor.data.statorSize);
      weights.motor = perMotorWeight * 4; // 4 motors
    }
    
    if (components.frame) {
      const explicitFrameWeight = this.parseWeight(components.frame.data.weight);
      weights.frame = explicitFrameWeight > 0
        ? explicitFrameWeight
        : this.estimateFrameWeight(components.frame.data.wheelbase);
    }
    
    if (components.stack) {
      const explicitStackWeight = this.parseWeight((components.stack.data as unknown as { weight?: string }).weight);
      weights.stack = explicitStackWeight > 0
        ? explicitStackWeight
        : this.calculateStackWeight(components.stack.data.type);
    }
    
    if (components.camera) {
      const explicitCameraWeight = this.parseWeight(components.camera.data.weight);
      weights.camera = explicitCameraWeight > 0
        ? explicitCameraWeight
        : this.estimateCameraWeight();
    }
    
    if (components.prop) {
      const explicitPropWeight = this.parseWeight(components.prop.data.weight);
      const perPropWeight = explicitPropWeight > 0
        ? explicitPropWeight
        : this.estimatePropWeight(components.prop.data.size, components.prop.data.blades);
      weights.prop = perPropWeight * 4; // 4 props
    }
    
    if (components.battery) {
      const explicitBatteryWeight = this.parseWeight(components.battery.data.weight);
      weights.battery = explicitBatteryWeight > 0
        ? explicitBatteryWeight
        : this.estimateBatteryWeight(components.battery.data.capacity, components.battery.data.voltage);
    }

    if (components.customWeights) {
      weights.customWeights = components.customWeights.reduce((total, item) => {
        return total + this.parseWeight(item.data.weight);
      }, 0);
    }

    weights.total = weights.motor + weights.frame + weights.stack + 
                   weights.camera + weights.prop + weights.battery + weights.customWeights;
    
    return weights;
  }

  static parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0;

    const lower = weightStr.toLowerCase();
    const match = lower.match(/(\d+\.?\d*)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    if (!Number.isFinite(value) || value <= 0) return 0;

    // Normalize to grams for compatibility with existing APIs.
    if (lower.includes('kg')) return value * 1000;
    if (lower.includes('mg')) return value / 1000;
    if (lower.includes('lb')) return value * 453.59237;
    if (lower.includes('oz')) return value * 28.3495231;

    // Default to grams.
    return value;
  }

  private static parseNumber(value: string | undefined, fallback = 0): number {
    if (!value) return fallback;
    const match = value.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : fallback;
  }

  private static clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  private static estimateMotorWeight(statorSize: string | undefined): number {
    const raw = statorSize || '';
    const compact = raw.match(/(\d{4})/);

    let statorDiameterMm = 22;
    if (compact) {
      statorDiameterMm = parseInt(compact[1].slice(0, 2), 10);
    } else {
      statorDiameterMm = this.parseNumber(raw, 22);
    }

    const estimated = 0.06 * statorDiameterMm * statorDiameterMm;
    return this.clamp(Math.round(estimated), 7, 95);
  }

  private static estimateFrameWeight(wheelbase: string | undefined): number {
    const wheelbaseMm = this.parseNumber(wheelbase, 220);
    const estimated = 20 + wheelbaseMm * 0.45;
    return this.clamp(Math.round(estimated), 35, 450);
  }

  private static estimateCameraWeight(): number {
    return 16;
  }

  private static estimatePropWeight(size: string | undefined, blades: number | undefined): number {
    const sizeIn = this.parseNumber(size, 5);
    const bladeCount = blades && blades > 0 ? blades : 3;
    const estimated = sizeIn * (0.35 + bladeCount * 0.18);
    return this.clamp(Math.round(estimated * 10) / 10, 0.6, 12);
  }

  private static estimateBatteryWeight(capacity: string | undefined, voltage: string | undefined): number {
    const capacityMah = this.parseNumber(capacity, 1300);
    const cellsMatch = (voltage || '').match(/(\d+)S/i);
    const cells = cellsMatch ? parseInt(cellsMatch[1], 10) : 4;

    const nominalWh = (capacityMah / 1000) * cells * 3.7;
    // Approximate LiPo pack specific energy around 140 Wh/kg including packaging and leads.
    const estimatedMassG = (nominalWh / 140) * 1000;
    return this.clamp(Math.round(estimatedMassG), 25, 1200);
  }

  private static calculateStackWeight(stackType: string): number {
    const type = stackType.toLowerCase();
    
    if (type.includes('mini')) {
      return 15; // Mini stacks are lighter
    } else if (type.includes('aio')) {
      return 20; // All-in-one stacks
    } else if (type.includes('f7')) {
      return 30; // F7 stacks (standard)
    } else if (type.includes('f4')) {
      return 25; // F4 stacks
    } else {
      return 30; // Default stack weight
    }
  }

  static getWeightDistribution(weights: WeightBreakdown): Record<string, number> {
    if (weights.total === 0) return {};

    return {
      motor: Math.round((weights.motor / weights.total) * 100),
      frame: Math.round((weights.frame / weights.total) * 100),
      stack: Math.round((weights.stack / weights.total) * 100),
      camera: Math.round((weights.camera / weights.total) * 100),
      prop: Math.round((weights.prop / weights.total) * 100),
      battery: Math.round((weights.battery / weights.total) * 100),
      customWeights: Math.round((weights.customWeights / weights.total) * 100)
    };
  }

  static validateWeight(totalWeight: number, frameSize: string): {
    isValid: boolean;
    category: string;
    recommendations?: string[];
  } {
    const recommendations: string[] = [];
    
    // Determine frame category
    let category = 'Unknown';
    let minWeight = 0;
    let maxWeight = 10000; // Very high default
    
    if (frameSize.includes('65') || frameSize.includes('75')) {
      category = 'Tiny Whoop';
      minWeight = 20;
      maxWeight = 50;
    } else if (frameSize.includes('3') || frameSize.includes('110') || frameSize.includes('120')) {
      category = '3-inch';
      minWeight = 80;
      maxWeight = 200;
    } else if (frameSize.includes('4') || frameSize.includes('150') || frameSize.includes('180')) {
      category = '4-inch';
      minWeight = 150;
      maxWeight = 350;
    } else if (frameSize.includes('5') || frameSize.includes('220') || frameSize.includes('250')) {
      category = '5-inch';
      minWeight = 200;
      maxWeight = 700;
    } else if (frameSize.includes('6') || frameSize.includes('7') || frameSize.includes('280')) {
      category = '6-7 inch';
      minWeight = 400;
      maxWeight = 1200;
    }

    const isValid = totalWeight >= minWeight && totalWeight <= maxWeight;

    if (totalWeight < minWeight) {
      recommendations.push(`Weight seems too low for ${category} build. Consider adding components or checking calculations.`);
    }
    
    if (totalWeight > maxWeight) {
      recommendations.push(`Weight is high for ${category} build. Consider lighter components for better performance.`);
    }

    return {
      isValid,
      category,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }
}
