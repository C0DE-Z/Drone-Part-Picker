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

/**
 * Weight calculation utilities for drone components
 */
export class WeightCalculator {
  /**
   * Calculate total weight and breakdown of all components
   */
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
      weights.motor = this.parseWeight(components.motor.data.weight) * 4; // 4 motors
    }
    
    if (components.frame) {
      weights.frame = this.parseWeight(components.frame.data.weight);
    }
    
    if (components.stack) {
      weights.stack = this.calculateStackWeight(components.stack.data.type);
    }
    
    if (components.camera) {
      weights.camera = this.parseWeight(components.camera.data.weight);
    }
    
    if (components.prop) {
      weights.prop = this.parseWeight(components.prop.data.weight) * 4; // 4 props
    }
    
    if (components.battery) {
      weights.battery = this.parseWeight(components.battery.data.weight);
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

  /**
   * Parse weight string and extract numeric value
   */
  static parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0;
    
    // Extract first number from string (handles formats like "31.5g", "85g", "30.5g (with short wires)")
    const match = weightStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Calculate stack weight based on type
   */
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

  /**
   * Get weight distribution as percentages
   */
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

  /**
   * Check if weight is within reasonable limits for drone type
   */
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
