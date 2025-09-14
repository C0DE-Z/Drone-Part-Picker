import { SelectedComponents } from '@/types/drone';
import { WeightCalculator } from './weight';

export interface PowerData {
  averageCurrent: number; // Amps
  hoverCurrent: number; // Amps
  sportCurrent: number; // Amps
  powerConsumption: number; // Watts
  efficiency: number; // Percentage
  recommendations?: string[];
}

export class PowerCalculator {
  static calculatePowerConsumption(components: SelectedComponents): PowerData {
    if (!components.motor || !components.stack || !components.battery) {
      return {
        averageCurrent: 0,
        hoverCurrent: 0,
        sportCurrent: 0,
        powerConsumption: 0,
        efficiency: 0,
        recommendations: ['Motor, ESC, and battery required for power calculations']
      };
    }

    const weights = WeightCalculator.calculateWeights(components);
    const voltage = this.getBatteryVoltage(components.battery.data.voltage || '4S');
    
    // Calculate current for different flight modes
    const hoverCurrent = this.calculateHoverCurrent(components, weights.total);
    const sportCurrent = hoverCurrent * 2.5; // Sport mode uses ~2.5x hover current
    const aggressiveCurrent = hoverCurrent * 4.0; // Aggressive flying
    
    // Calculate weighted average based on typical flying patterns
    const averageCurrent = this.calculateAverageCurrent(hoverCurrent, sportCurrent, aggressiveCurrent);
    
    const powerConsumption = averageCurrent * voltage;
    const efficiency = this.calculateSystemEfficiency(components);
    
    const analysis = this.analyzePowerConsumption(averageCurrent, components);
    
    return {
      averageCurrent: Math.round(averageCurrent * 10) / 10,
      hoverCurrent: Math.round(hoverCurrent * 10) / 10,
      sportCurrent: Math.round(sportCurrent * 10) / 10,
      powerConsumption: Math.round(powerConsumption * 10) / 10,
      efficiency: Math.round(efficiency * 100),
      recommendations: analysis.recommendations
    };
  }

  private static calculateHoverCurrent(components: SelectedComponents, totalWeight: number): number {
    const kv = components.motor?.data.kv || 2000;
    const voltage = this.getBatteryVoltage(components.battery?.data.voltage || '4S');
    const propDiameter = this.parseNumeric(components.prop?.data.size) || 5;
    const motorStatorSize = this.parseNumeric(components.motor?.data.statorSize) || 22;
    
    // Calculate ideal hover power using momentum theory
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2); // m²
    const hoverThrustNewtons = (totalWeight / 1000) * 9.81; // Convert grams to Newtons
    const hoverVelocity = Math.sqrt(hoverThrustNewtons / (2 * 1.225 * diskArea)); // m/s
    const idealPowerWatts = hoverThrustNewtons * hoverVelocity; // Watts per motor
    
    // Apply figure of merit (propeller efficiency)
    const figureOfMerit = this.calculateFigureOfMerit(propDiameter, totalWeight);
    const realPowerPerMotor = idealPowerWatts / figureOfMerit;
    
    // Apply motor efficiency
    const motorEfficiency = this.calculateMotorEfficiency(kv, voltage, motorStatorSize);
    const electricalPowerPerMotor = realPowerPerMotor / motorEfficiency;
    
    // Calculate current per motor
    const currentPerMotor = electricalPowerPerMotor / voltage;
    
    // Total current for 4 motors with system overhead
    const totalCurrent = currentPerMotor * 4 * 1.08; // 8% system overhead
    
    // Apply ESC efficiency
    const escEfficiency = this.getEscEfficiency(components.stack?.data.escCurrentRating || '30A');
    const finalCurrent = totalCurrent / escEfficiency;
    
    return Math.max(3.0, finalCurrent); // Minimum realistic current
  }

  private static calculateAverageCurrent(hover: number, sport: number, aggressive: number): number {
    // Typical flight pattern weights
    const hoverWeight = 0.30;      // 30% hovering/slow flight
    const cruiseWeight = 0.45;     // 45% cruise flight
    const sportWeight = 0.20;      // 20% sport flying
    const aggressiveWeight = 0.05; // 5% aggressive maneuvers
    
    const cruiseCurrent = hover * 1.6; // Cruise is between hover and sport
    
    return (hover * hoverWeight) + 
           (cruiseCurrent * cruiseWeight) + 
           (sport * sportWeight) + 
           (aggressive * aggressiveWeight);
  }

  private static calculateFigureOfMerit(propDiameter: number, totalWeight: number): number {
    // Disk loading calculation
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2); // m²
    const diskLoading = (totalWeight / 1000 * 9.81) / diskArea; // N/m²
    
    // Figure of merit based on disk loading
    let figureOfMerit = 0.80; // Base efficiency
    
    if (diskLoading < 15) {
      figureOfMerit = 0.85; // Low disk loading = high efficiency
    } else if (diskLoading < 25) {
      figureOfMerit = 0.82;
    } else if (diskLoading < 35) {
      figureOfMerit = 0.80;
    } else if (diskLoading < 45) {
      figureOfMerit = 0.77;
    } else {
      figureOfMerit = 0.73; // High disk loading = lower efficiency
    }
    
    return figureOfMerit;
  }

  private static calculateMotorEfficiency(kv: number, voltage: number, statorSize: number): number {
    // Base efficiency based on stator size
    let efficiency = 0.85;
    
    if (statorSize >= 28) efficiency = 0.90;
    else if (statorSize >= 25) efficiency = 0.88;
    else if (statorSize >= 22) efficiency = 0.85;
    else if (statorSize >= 20) efficiency = 0.82;
    else efficiency = 0.78;
    
    // Adjust for KV/voltage combination
    const optimalKV = 1400 + (voltage - 14.8) * 180;
    const kvDeviation = Math.abs(kv - optimalKV) / optimalKV;
    
    if (kvDeviation > 0.4) efficiency *= 0.88;
    else if (kvDeviation > 0.3) efficiency *= 0.92;
    else if (kvDeviation > 0.2) efficiency *= 0.96;
    else if (kvDeviation < 0.1) efficiency *= 1.02;
    
    return Math.min(0.95, efficiency);
  }

  private static getEscEfficiency(escRating: string): number {
    const ratingMatch = escRating.match(/(\d+)A/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 30;
    
    if (rating >= 60) return 0.96;
    else if (rating >= 40) return 0.95;
    else if (rating >= 25) return 0.93;
    else return 0.90;
  }

  private static calculateSystemEfficiency(components: SelectedComponents): number {
    const motorEff = this.calculateMotorEfficiency(
      components.motor?.data.kv || 2000,
      this.getBatteryVoltage(components.battery?.data.voltage || '4S'),
      this.parseNumeric(components.motor?.data.statorSize) || 22
    );
    
    const escEff = this.getEscEfficiency(components.stack?.data.escCurrentRating || '30A');
    const propEff = 0.80; // Typical propeller efficiency
    const systemEff = 0.92; // System losses
    
    return motorEff * escEff * propEff * systemEff;
  }

  private static parseNumeric(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const match = value.toString().match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private static getBatteryVoltage(voltageStr: string): number {
    const match = voltageStr.match(/(\d+)S/);
    if (match) {
      return parseInt(match[1]) * 3.7;
    }
    return 14.8;
  }

  private static analyzePowerConsumption(current: number, components: SelectedComponents): {
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const escRating = this.parseNumeric(components.stack?.data.escCurrentRating || '30');
    
    // Check ESC current capacity
    const escUtilization = (current / escRating) * 100;
    
    if (escUtilization > 85) {
      recommendations.push('High ESC utilization. Consider higher rated ESCs for better reliability.');
    } else if (escUtilization > 70) {
      recommendations.push('Moderate ESC utilization. Good for performance flying.');
    } else if (escUtilization < 30) {
      recommendations.push('Low ESC utilization. ESCs may be oversized for this setup.');
    }
    
    // Power consumption recommendations
    if (current > 50) {
      recommendations.push('High power consumption setup. Expect shorter flight times but excellent performance.');
    } else if (current > 35) {
      recommendations.push('Moderate power consumption. Good balance of performance and flight time.');
    } else if (current < 20) {
      recommendations.push('Low power consumption. Excellent for long flight times and efficiency.');
    }
    
    return { recommendations };
  }
}
