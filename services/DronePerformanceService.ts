import { SelectedComponents, PerformanceEstimate } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { WeightCalculator, WeightBreakdown } from '@/utils/calculations/weight';
import { ThrustCalculator, ThrustData } from '@/utils/calculations/thrust';
import { PowerCalculator, PowerData } from '@/utils/calculations/power';
import { FlightTimeCalculator } from '@/utils/calculations/flightTime';
import { estimateComponentPrice } from '@/utils/math/cost';

type ComponentData = {
  price?: number;
  [key: string]: string | number | undefined;
};

/**
 * Master calculation service that orchestrates all drone performance calculations
 * This replaces the monolithic DroneCalculator class with a modular approach
 */
export class DronePerformanceService {
  /**
   * Calculate complete performance estimate for a drone build
   */
  static calculatePerformance(
    components: SelectedComponents, 
    advancedSettings: AdvancedSettings = defaultAdvancedSettings
  ): PerformanceEstimate {
    // Calculate individual aspects
    const weights = WeightCalculator.calculateWeights(components);
    const thrustData = ThrustCalculator.calculateThrust(components);
    const powerData = PowerCalculator.calculatePowerConsumption(components);
    const flightTimeData = FlightTimeCalculator.calculateFlightTime(components, powerData, advancedSettings);
    
    // Calculate derived metrics
    const hoveringMetrics = this.calculateHoveringMetrics(components, weights, thrustData, powerData);
    const motorMetrics = this.getMotorMetrics(components);
    const batteryMetrics = this.getBatteryMetrics(components);
    const pricing = this.calculatePricing(components);
    const compatibility = this.checkCompatibility(components);
    
    // Calculate top speed
    const estimatedTopSpeed = this.estimateTopSpeed(components, thrustData.thrustToWeightRatio);
    
    return {
      totalWeight: Math.round(weights.total * 10) / 10,
      thrustToWeightRatio: Math.round(thrustData.thrustToWeightRatio * 100) / 100,
      maxThrust: Math.round((thrustData.totalThrust / 1000) * 100) / 100, // Convert to kg
      maxThrustGrams: thrustData.totalThrust,
      estimatedTopSpeed,
      estimatedFlightTime: flightTimeData.estimatedFlightTime,
      powerConsumption: powerData.powerConsumption,
      hovering: hoveringMetrics,
      motors: motorMetrics,
      battery: batteryMetrics,
      totalPrice: pricing.total,
      priceBreakdown: pricing.breakdown,
      compatibility
    };
  }

  /**
   * Get detailed performance breakdown for analysis
   */
  static getDetailedBreakdown(
    components: SelectedComponents,
    advancedSettings: AdvancedSettings = defaultAdvancedSettings
  ) {
    const weights = WeightCalculator.calculateWeights(components);
    const thrustData = ThrustCalculator.calculateThrust(components);
    const powerData = PowerCalculator.calculatePowerConsumption(components);
    const flightTimeData = FlightTimeCalculator.calculateFlightTime(components, powerData, advancedSettings);
    
    return {
      weights,
      thrust: thrustData,
      power: powerData,
      flightTime: flightTimeData,
      weightDistribution: WeightCalculator.getWeightDistribution(weights),
      hoverThrottle: ThrustCalculator.calculateHoverThrottle(thrustData, weights.total)
    };
  }

  /**
   * Calculate hovering-specific metrics
   */
  private static calculateHoveringMetrics(
    components: SelectedComponents,
    weights: WeightBreakdown,
    thrustData: ThrustData,
    powerData: PowerData
  ) {
    const hoverThrottle = ThrustCalculator.calculateHoverThrottle(thrustData, weights.total);
    
    // Calculate hover time (pure hovering scenario)
    let hoverTime = 0;
    if (components.battery?.data.capacity) {
      const capacityMatch = components.battery.data.capacity.match(/(\d+)/);
      const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 1300;
      const usableCapacity = capacity * 0.90; // 90% usable for hovering
      hoverTime = (usableCapacity / 1000) / powerData.hoverCurrent * 60; // minutes
    }
    
    return {
      throttlePercentage: hoverThrottle,
      currentDraw: powerData.hoverCurrent,
      hoverTime: Math.round(hoverTime * 10) / 10
    };
  }

  /**
   * Get motor performance metrics
   */
  private static getMotorMetrics(components: SelectedComponents) {
    const kv = components.motor?.data.kv || 0;
    const voltage = this.getBatteryVoltage(components.battery?.data.voltage || '4S');
    const estimatedRPM = Math.round(kv * voltage);
    const propSize = components.prop?.data.size || 'N/A';
    
    return {
      kv,
      voltage: Math.round(voltage * 10) / 10,
      estimatedRPM,
      propSize
    };
  }

  /**
   * Get battery performance metrics
   */
  private static getBatteryMetrics(components: SelectedComponents) {
    if (!components.battery) {
      return { voltage: 0, capacity: 0, cells: 0, dischargeRate: 0 };
    }

    const voltageStr = components.battery.data.voltage || '4S';
    const capacityStr = components.battery.data.capacity || '1300mAh';
    const cRatingStr = components.battery.data.cRating || '50C';
    
    const cells = parseInt(voltageStr.match(/(\d+)S/)?.[1] || '4');
    const voltage = cells * 3.7;
    const capacity = parseInt(capacityStr.match(/(\d+)/)?.[1] || '1300');
    const cRating = parseInt(cRatingStr.match(/(\d+)/)?.[1] || '50');
    const dischargeRate = Math.round((capacity * cRating / 1000) * 10) / 10;
    
    return {
      voltage: Math.round(voltage * 10) / 10,
      capacity,
      cells,
      dischargeRate
    };
  }

  /**
   * Calculate component pricing
   */
  private static calculatePricing(components: SelectedComponents) {
    const breakdown = {
      motor: 0,
      frame: 0,
      stack: 0,
      camera: 0,
      prop: 0,
      battery: 0,
      customWeights: 0
    };

    // Motor pricing (4 motors)
    if (components.motor?.data.price) {
      breakdown.motor = components.motor.data.price * 4;
    } else if (components.motor) {
      breakdown.motor = estimateComponentPrice('motor', components.motor.data as unknown as ComponentData) * 4;
    }

    // Frame pricing
    if (components.frame?.data.price) {
      breakdown.frame = components.frame.data.price;
    } else if (components.frame) {
      breakdown.frame = estimateComponentPrice('frame', components.frame.data as unknown as ComponentData);
    }

    // Stack pricing
    if (components.stack?.data.price) {
      breakdown.stack = components.stack.data.price;
    } else if (components.stack) {
      breakdown.stack = estimateComponentPrice('stack', components.stack.data as unknown as ComponentData);
    }

    // Camera pricing
    if (components.camera?.data.price) {
      breakdown.camera = components.camera.data.price;
    } else if (components.camera) {
      breakdown.camera = estimateComponentPrice('camera', components.camera.data as unknown as ComponentData);
    }

    // Propeller pricing (4 props)
    if (components.prop?.data.price) {
      breakdown.prop = components.prop.data.price * 4;
    } else if (components.prop) {
      breakdown.prop = estimateComponentPrice('prop', components.prop.data as unknown as ComponentData) * 4;
    }

    // Battery pricing
    if (components.battery?.data.price) {
      breakdown.battery = components.battery.data.price;
    } else if (components.battery) {
      breakdown.battery = estimateComponentPrice('battery', components.battery.data as unknown as ComponentData);
    }

    // Custom weights pricing
    if (components.customWeights) {
      breakdown.customWeights = components.customWeights.reduce((total, weight) => {
        return total + (weight.data.price || estimateComponentPrice('customWeight', weight.data as unknown as ComponentData));
      }, 0);
    }

    const total = Object.values(breakdown).reduce((sum, price) => sum + price, 0);

    return {
      total: Math.round(total * 100) / 100,
      breakdown
    };
  }

  /**
   * Check component compatibility
   */
  private static checkCompatibility(components: SelectedComponents) {
    return {
      propMotorMatch: this.checkPropMotorCompatibility(components),
      voltageMatch: this.checkVoltageCompatibility(components),
      mountingMatch: this.checkMountingCompatibility(components),
      frameStackMatch: this.checkFrameStackCompatibility(components)
    };
  }

  /**
   * Check propeller/motor compatibility
   */
  private static checkPropMotorCompatibility(components: SelectedComponents): boolean {
    if (!components.motor || !components.prop) return true;
    
    const motorStator = components.motor.data.statorSize;
    const propRecommended = components.prop.data.recommendedMotorSize;
    
    return propRecommended.includes(motorStator);
  }

  /**
   * Check voltage compatibility
   */
  private static checkVoltageCompatibility(components: SelectedComponents): boolean {
    if (!components.battery || (!components.motor && !components.stack)) return true;
    
    const batteryVoltage = components.battery.data.voltage;
    const batteryCells = batteryVoltage.match(/(\d+)S/)?.[1];
    
    if (!batteryCells) return true;
    
    if (components.motor) {
      const motorVoltage = components.motor.data.voltageCompatibility;
      if (!motorVoltage.includes(batteryCells + 'S')) return false;
    }
    
    if (components.stack) {
      const stackVoltage = components.stack.data.voltageInput;
      if (!stackVoltage.includes(batteryCells + 'S')) return false;
    }
    
    return true;
  }

  /**
   * Check mounting compatibility
   */
  private static checkMountingCompatibility(components: SelectedComponents): boolean {
    if (!components.frame || !components.stack) return true;
    
    const frameMount = components.frame.data.stackMounting;
    const stackMount = components.stack.data.mountingSize;
    
    return frameMount.includes(stackMount);
  }

  /**
   * Check frame/propeller compatibility
   */
  private static checkFrameStackCompatibility(components: SelectedComponents): boolean {
    if (!components.frame || !components.prop) return true;
    
    const framePropSize = components.frame.data.propellerSizeCompatibility;
    const propSize = components.prop.data.size;
    
    return framePropSize.includes(propSize.replace(' inch', ''));
  }

  /**
   * Estimate top speed
   */
  private static estimateTopSpeed(components: SelectedComponents, twr: number): number {
    if (!components.motor || !components.prop || !components.frame) return 0;
    
    const kv = components.motor.data.kv || 2000;
    const propDiameter = this.parseWeight(components.prop.data.size) || 5;
    const propPitch = this.parseWeight(components.prop.data.pitch) || 4.5;
    const voltage = this.getBatteryVoltage(components.battery?.data.voltage || '4S');
    const frameWheelbase = this.parseWeight(components.frame.data.wheelbase) || 220;
    
    // Calculate propeller speed
    const noLoadRPM = kv * voltage;
    const loadedRPM = noLoadRPM * 0.75; // Account for load
    const propSpeedMeterPerSecond = (loadedRPM / 60) * (propPitch * 0.0254);
    
    // Calculate aerodynamic limitations
    const frameArea = Math.pow(frameWheelbase / 1000, 2);
    const dragCoefficient = 0.8 + (frameWheelbase / 1000) * 0.2;
    const airDensity = 1.225;
    
    // Apply TWR and frame size corrections
    let correctionFactor = 1.0;
    if (twr >= 3.5) correctionFactor *= 1.1;
    else if (twr < 2.0) correctionFactor *= 0.9;
    
    if (frameWheelbase <= 150) correctionFactor *= 1.15;
    else if (frameWheelbase >= 280) correctionFactor *= 0.9;
    
    const topSpeedKmh = propSpeedMeterPerSecond * 3.6 * correctionFactor * 0.7; // 0.7 for efficiency
    
    // Apply realistic limits based on frame size
    let maxRealisticSpeed = 200;
    if (frameWheelbase <= 100) maxRealisticSpeed = 120;
    else if (frameWheelbase <= 150) maxRealisticSpeed = 150;
    else if (frameWheelbase <= 220) maxRealisticSpeed = 200;
    else maxRealisticSpeed = 220;
    
    return Math.round(Math.min(topSpeedKmh, maxRealisticSpeed));
  }

  /**
   * Parse weight from string
   */
  private static parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0;
    const match = weightStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get battery voltage
   */
  private static getBatteryVoltage(voltageStr: string): number {
    const match = voltageStr.match(/(\d+)S/);
    if (match) {
      return parseInt(match[1]) * 3.7;
    }
    return 14.8;
  }
}
