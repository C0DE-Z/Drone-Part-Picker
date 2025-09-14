import { SelectedComponents, Battery } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { PowerCalculator } from './power';

export interface FlightTimeData {
  estimatedFlightTime: number; // minutes
  hoverTime: number; // minutes
  sportTime: number; // minutes
  batteryUtilization: number; // percentage
  recommendations?: string[];
}

export class FlightTimeCalculator {
  static calculateFlightTime(
    components: SelectedComponents, 
    powerData: ReturnType<typeof PowerCalculator.calculatePowerConsumption>,
    settings: AdvancedSettings = defaultAdvancedSettings
  ): FlightTimeData {
    if (!components.battery || powerData.averageCurrent === 0) {
      return {
        estimatedFlightTime: 0,
        hoverTime: 0,
        sportTime: 0,
        batteryUtilization: 0,
        recommendations: ['Battery and valid power consumption required for flight time calculation']
      };
    }

    const batterySpecs = this.parseBatterySpecs(components.battery.data);
    const effectiveCapacity = this.calculateEffectiveCapacity(batterySpecs, settings);
    
    // Calculate flight times for different scenarios
    const hoverTime = this.calculateScenarioTime(effectiveCapacity, powerData.hoverCurrent);
    const sportTime = this.calculateScenarioTime(effectiveCapacity, powerData.sportCurrent);
    const estimatedFlightTime = this.calculateScenarioTime(effectiveCapacity, powerData.averageCurrent);
    
    const batteryUtilization = this.calculateBatteryUtilization(powerData.averageCurrent, batterySpecs);
    const analysis = this.analyzeFlightTime(estimatedFlightTime, batterySpecs, components);
    
    return {
      estimatedFlightTime: Math.round(estimatedFlightTime * 10) / 10,
      hoverTime: Math.round(hoverTime * 10) / 10,
      sportTime: Math.round(sportTime * 10) / 10,
      batteryUtilization: Math.round(batteryUtilization),
      recommendations: analysis.recommendations
    };
  }

  private static parseBatterySpecs(batteryData: { capacity?: string; cRating?: string; voltage?: string }) {
    const capacityMatch = batteryData.capacity?.match(/(\d+)/);
    const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 1300;
    
    const cRatingMatch = batteryData.cRating?.match(/(\d+)/);
    const cRating = cRatingMatch ? parseInt(cRatingMatch[1]) : 50;
    
    const voltageMatch = batteryData.voltage?.match(/(\d+)S/);
    const cells = voltageMatch ? parseInt(voltageMatch[1]) : 4;
    
    return { capacity, cRating, cells };
  }

  private static calculateEffectiveCapacity(
    batterySpecs: { capacity: number; cRating: number; cells: number },
    settings: AdvancedSettings
  ): number {
    let effectiveCapacity = batterySpecs.capacity;
    
    // Apply usable capacity factor (typically 80-90% for LiPo)
    effectiveCapacity *= settings.battery.usableCapacityFactor;
    
    // Temperature effects
    const { temperature } = settings.environment;
    let temperatureFactor = 1.0;
    
    if (temperature < 0) temperatureFactor = settings.battery.temperatureEfficiency.freezing;
    else if (temperature < 10) temperatureFactor = settings.battery.temperatureEfficiency.cold;
    else if (temperature < 20) temperatureFactor = settings.battery.temperatureEfficiency.cool;
    else if (temperature <= 25) temperatureFactor = settings.battery.temperatureEfficiency.optimal;
    else if (temperature <= 35) temperatureFactor = settings.battery.temperatureEfficiency.warm;
    else if (temperature <= 45) temperatureFactor = settings.battery.temperatureEfficiency.hot;
    else temperatureFactor = settings.battery.temperatureEfficiency.extreme;
    
    effectiveCapacity *= temperatureFactor;
    
    // Battery age factor
    effectiveCapacity *= settings.battery.ageFactor;
    
    // Altitude effects (air density affects cooling)
    const { altitude } = settings.environment;
    if (altitude > 3000) effectiveCapacity *= 0.85;
    else if (altitude > 2000) effectiveCapacity *= 0.92;
    else if (altitude > 1000) effectiveCapacity *= 0.96;
    
    // Wind effects (increases power consumption)
    const { windSpeed } = settings.environment;
    if (windSpeed > 30) effectiveCapacity *= 0.75;
    else if (windSpeed > 20) effectiveCapacity *= 0.85;
    else if (windSpeed > 10) effectiveCapacity *= 0.95;
    
    return effectiveCapacity;
  }

  private static calculateScenarioTime(effectiveCapacity: number, current: number): number {
    if (current <= 0) return 0;
    
    // Basic calculation: capacity (mAh) / current (A) = time (hours)
    const timeHours = (effectiveCapacity / 1000) / current;
    const timeMinutes = timeHours * 60;
    
    // Apply safety margin (don't discharge to 0%)
    return timeMinutes * 0.9; // 10% safety margin
  }

  private static calculateBatteryUtilization(current: number, batterySpecs: { capacity: number; cRating: number }): number {
    const maxContinuousCurrent = (batterySpecs.capacity * batterySpecs.cRating) / 1000;
    return (current / maxContinuousCurrent) * 100;
  }

  private static analyzeFlightTime(
    flightTime: number, 
    batterySpecs: { capacity: number; cRating: number; cells: number },
    components: SelectedComponents
  ): { recommendations: string[] } {
    const recommendations: string[] = [];
    
    // Flight time analysis
    if (flightTime < 2) {
      recommendations.push('Very short flight time. Consider larger battery or more efficient setup.');
    } else if (flightTime < 4) {
      recommendations.push('Short flight time. Good for racing but limited for other activities.');
    } else if (flightTime < 6) {
      recommendations.push('Moderate flight time. Good balance for sport flying.');
    } else if (flightTime < 10) {
      recommendations.push('Good flight time for recreational flying and light work.');
    } else if (flightTime > 15) {
      recommendations.push('Excellent flight time. Great for long-range flights and work applications.');
    }
    
    // Battery recommendations
    if (batterySpecs.capacity < 1000) {
      recommendations.push('Small battery capacity. Consider larger battery for longer flights.');
    } else if (batterySpecs.capacity > 2500) {
      recommendations.push('Large battery. Excellent for endurance but will increase weight.');
    }
    
    // C-rating analysis
    if (batterySpecs.cRating < 30) {
      recommendations.push('Low C-rating battery. May limit performance in aggressive flying.');
    } else if (batterySpecs.cRating > 100) {
      recommendations.push('High C-rating battery. Excellent for racing and high-performance applications.');
    }
    
    // Setup-specific recommendations
    const motorKv = components.motor?.data.kv || 2000;
    const frameSize = components.frame?.data.wheelbase || '220mm';
    
    if (motorKv > 2400 && frameSize.includes('220')) {
      recommendations.push('High-KV racing setup. Flight time will be shorter but performance excellent.');
    } else if (motorKv < 1800) {
      recommendations.push('Efficient low-KV setup. Good for cinematography and long-range flying.');
    }
    
    return { recommendations };
  }

  static calculateTimeWithCapacity(
    capacity: number,
    current: number,
    settings: AdvancedSettings = defaultAdvancedSettings
  ): number {
    const batterySpecs = { capacity, cRating: 50, cells: 4 }; // Default specs
    const effectiveCapacity = this.calculateEffectiveCapacity(batterySpecs, settings);
    return this.calculateScenarioTime(effectiveCapacity, current);
  }

  static getRecommendedCapacity(
    targetFlightTime: number, // minutes
    current: number,
    settings: AdvancedSettings = defaultAdvancedSettings
  ): number {
    // Work backwards from target time
    const requiredCapacityHours = (targetFlightTime / 60) * current;
    const requiredCapacityMah = requiredCapacityHours * 1000;
    
    // Account for efficiency factors
    const temperatureFactor = settings.battery.temperatureEfficiency.optimal;
    const usabilityFactor = settings.battery.usableCapacityFactor;
    const ageFactor = settings.battery.ageFactor;
    const safetyMargin = 0.9;
    
    const totalEfficiency = temperatureFactor * usabilityFactor * ageFactor * safetyMargin;
    
    const recommendedCapacity = requiredCapacityMah / totalEfficiency;
    
    // Round to common battery capacities
    const commonCapacities = [650, 850, 1050, 1300, 1500, 1800, 2200, 2600, 3300, 4200, 5200];
    return commonCapacities.find(cap => cap >= recommendedCapacity) || Math.ceil(recommendedCapacity / 100) * 100;
  }
}
