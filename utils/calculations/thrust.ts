import { SelectedComponents } from '@/types/drone';
import { WeightCalculator } from './weight';

export interface ThrustData {
  totalThrust: number; // grams
  thrustPerMotor: number; // grams
  thrustToWeightRatio: number;
  isOptimal: boolean;
  recommendations?: string[];
}

/**
 * Thrust calculation utilities for drone performance
 */
export class ThrustCalculator {
  /**
   * Calculate total thrust and thrust-to-weight ratio
   */
  static calculateThrust(components: SelectedComponents): ThrustData {
    if (!components.motor || !components.prop) {
      return {
        totalThrust: 0,
        thrustPerMotor: 0,
        thrustToWeightRatio: 0,
        isOptimal: false,
        recommendations: ['Motor and propeller required for thrust calculation']
      };
    }
    
    const weights = WeightCalculator.calculateWeights(components);
    const thrustPerMotor = this.calculateSingleMotorThrust(components);
    const totalThrust = thrustPerMotor * 4; // 4 motors
    const thrustToWeightRatio = totalThrust / weights.total;
    
    const analysis = this.analyzeThrustToWeight(thrustToWeightRatio);
    
    return {
      totalThrust,
      thrustPerMotor,
      thrustToWeightRatio,
      isOptimal: analysis.isOptimal,
      recommendations: analysis.recommendations
    };
  }

  /**
   * Calculate thrust for a single motor/prop combination
   */
  private static calculateSingleMotorThrust(components: SelectedComponents): number {
    if (!components.motor || !components.prop) return 0;
    
    // Get basic specifications
    const kv = components.motor.data.kv || 2000;
    const voltage = this.getBatteryVoltage(components.battery?.data.voltage || '4S');
    const propDiameter = this.parseNumeric(components.prop.data.size) || 5;
    const propPitch = this.parseNumeric(components.prop.data.pitch) || 4.5;
    const motorStatorSize = this.parseNumeric(components.motor.data.statorSize) || 22;
    
    // Calculate base thrust from specifications
    const specThrustStr = components.motor.data.maxThrust;
    const specThrustMatch = specThrustStr.match(/(\d+\.?\d*)/);
    const specThrust = specThrustMatch ? parseFloat(specThrustMatch[1]) * 1000 : 0; // Convert kg to grams
    
    if (specThrust === 0) {
      // Estimate thrust if no spec available
      return this.estimateThrustFromSpecs(kv, voltage, propDiameter, propPitch, motorStatorSize);
    }
    
    // Apply motor/prop matching factor
    const matchingFactor = this.calculateMotorPropMatching(kv, voltage, propDiameter, propPitch, motorStatorSize);
    
    // Apply environmental factors
    const environmentalFactor = this.getEnvironmentalFactor();
    
    // Calculate final thrust with all adjustments
    let finalThrust = specThrust * matchingFactor * environmentalFactor;
    
    // Apply realistic bounds
    const minThrust = specThrust * 0.7; // Minimum 70% of spec
    const maxThrust = specThrust * 1.3; // Maximum 130% of spec
    finalThrust = Math.max(minThrust, Math.min(finalThrust, maxThrust));
    
    return Math.round(finalThrust);
  }

  /**
   * Estimate thrust from motor/prop specifications when no spec thrust available
   */
  private static estimateThrustFromSpecs(
    kv: number, 
    voltage: number, 
    propDiameter: number, 
    propPitch: number, 
    statorSize: number
  ): number {
    // Simplified thrust estimation based on motor power and prop loading
    const motorPower = (kv * voltage * statorSize) / 1000; // Rough power estimate
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2); // m²
    const diskLoading = 40; // Typical disk loading in N/m²
    
    const estimatedThrust = diskArea * diskLoading * 1000; // Convert to grams
    
    // Scale by motor power
    const powerFactor = Math.sqrt(motorPower / 100); // Normalize around 100W
    
    return Math.round(estimatedThrust * powerFactor);
  }

  /**
   * Calculate motor/prop compatibility factor
   */
  private static calculateMotorPropMatching(
    kv: number, 
    voltage: number, 
    propDiameter: number, 
    propPitch: number, 
    statorSize: number
  ): number {
    // Calculate optimal prop size for motor
    const motorPower = (kv * voltage * statorSize) / 10000;
    const optimalDiameter = Math.sqrt(motorPower * 8);
    const optimalPitch = optimalDiameter * 0.85;
    
    // Calculate matching scores
    const diameterMatch = 1 - Math.abs(propDiameter - optimalDiameter) / Math.max(propDiameter, optimalDiameter);
    const pitchMatch = 1 - Math.abs(propPitch - optimalPitch) / Math.max(propPitch, optimalPitch);
    
    const overallMatch = (diameterMatch * 0.6 + pitchMatch * 0.4);
    
    // Convert to efficiency factor (0.85 to 1.15 range)
    return Math.max(0.85, Math.min(1.15, 0.9 + overallMatch * 0.2));
  }

  /**
   * Get environmental adjustment factor
   */
  private static getEnvironmentalFactor(): number {
    // Standard conditions factor (can be enhanced with actual environment data)
    return 0.95; // 5% reduction for real-world conditions
  }

  /**
   * Parse numeric value from string
   */
  private static parseNumeric(value: string | number): number {
    if (typeof value === 'number') return value;
    const match = value.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get battery voltage from voltage string
   */
  private static getBatteryVoltage(voltageStr: string): number {
    const match = voltageStr.match(/(\d+)S/);
    if (match) {
      return parseInt(match[1]) * 3.7; // 3.7V per cell nominal
    }
    return 14.8; // Default 4S voltage
  }

  /**
   * Analyze thrust-to-weight ratio and provide recommendations
   */
  private static analyzeThrustToWeight(twr: number): {
    isOptimal: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let isOptimal = false;

    if (twr < 1.0) {
      recommendations.push('Very low thrust-to-weight ratio. Drone may not be able to fly.');
      recommendations.push('Consider more powerful motors or lighter components.');
    } else if (twr < 1.5) {
      recommendations.push('Low thrust-to-weight ratio. Limited maneuverability.');
      recommendations.push('Suitable for gentle flying only.');
    } else if (twr < 2.0) {
      recommendations.push('Adequate thrust for basic flying and slow cinematography.');
    } else if (twr >= 2.0 && twr <= 4.0) {
      isOptimal = true;
      recommendations.push('Good thrust-to-weight ratio for sport flying and freestyle.');
    } else if (twr > 4.0 && twr <= 6.0) {
      isOptimal = true;
      recommendations.push('High performance setup suitable for racing and aggressive freestyle.');
    } else if (twr > 6.0) {
      recommendations.push('Very high thrust-to-weight ratio. Excellent for racing but may reduce flight time.');
      recommendations.push('Consider if this much power is needed for your flying style.');
    }

    return { isOptimal, recommendations };
  }

  /**
   * Calculate hover throttle percentage
   */
  static calculateHoverThrottle(thrustData: ThrustData, totalWeight: number): number {
    if (thrustData.totalThrust === 0) return 0;
    
    const hoverThrustRequired = totalWeight; // grams
    const hoverThrustPercentage = (hoverThrustRequired / thrustData.totalThrust) * 100;
    
    // Apply non-linear throttle curve adjustment
    const baseThrottle = Math.sqrt(hoverThrustPercentage / 100) * 100;
    
    // Clamp to reasonable values
    return Math.min(75, Math.max(15, Math.round(baseThrottle)));
  }
}
