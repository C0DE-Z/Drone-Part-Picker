import { SelectedComponents, PerformanceEstimate } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { WeightCalculator, WeightBreakdown } from '@/utils/calculations/weight';
import { ThrustCalculator, ThrustData } from '@/utils/calculations/thrust';
import { PowerCalculator, PowerData } from '@/utils/calculations/power';
import { FlightTimeCalculator } from '@/utils/calculations/flightTime';
import { computeSIPhysics, roundTo, validateSIPhysics } from '@/utils/calculations/siPhysics';
import { estimateComponentPrice } from '@/utils/math/cost';

type ComponentData = {
  price?: number;
  [key: string]: string | number | undefined;
};

export class DronePerformanceService {
  static calculatePerformance(
    components: SelectedComponents, 
    advancedSettings: AdvancedSettings = defaultAdvancedSettings
  ): PerformanceEstimate {
    const core = computeSIPhysics(components, advancedSettings);
    const validation = validateSIPhysics(core);

    // Keep existing public module boundaries while internally using the SI core.
    const weights = WeightCalculator.calculateWeights(components);
    const thrustData = ThrustCalculator.calculateThrust(components, advancedSettings);
    const powerData = PowerCalculator.calculatePowerConsumption(components, advancedSettings);
    const flightTimeData = FlightTimeCalculator.calculateFlightTime(components, powerData, advancedSettings);

    const hoveringMetrics = this.calculateHoveringMetrics(components, weights, thrustData, powerData);
    const motorMetrics = this.getMotorMetrics(components, core);
    const batteryMetrics = this.getBatteryMetrics(components, core);
    const pricing = this.calculatePricing(components);
    const compatibility = this.checkCompatibility(components);

    const estimatedTopSpeed = Math.round(core.speed.estimatedTopSpeedKmh);
    
    return {
      totalWeight: Math.round(weights.total * 10) / 10,
      thrustToWeightRatio: roundTo(thrustData.thrustToWeightRatio, 2),
      maxThrust: Math.round((thrustData.totalThrust / 1000) * 100) / 100, // Convert to kg
      maxThrustGrams: Math.round(thrustData.totalThrust),
      estimatedTopSpeed,
      estimatedFlightTime: flightTimeData.estimatedFlightTime,
      powerConsumption: roundTo(core.power.averagePowerW, 1),
      hovering: hoveringMetrics,
      motors: motorMetrics,
      battery: batteryMetrics,
      flightEstimates: {
        hover: roundTo(core.flight.hoverMin, 1),
        cruise: roundTo(core.flight.cruiseMin, 1),
        aggressive: roundTo(core.flight.aggressiveMin, 1)
      },
      validation,
      totalPrice: pricing.total,
      priceBreakdown: pricing.breakdown,
      compatibility
    };
  }

  static getDetailedBreakdown(
    components: SelectedComponents,
    advancedSettings: AdvancedSettings = defaultAdvancedSettings
  ) {
    const core = computeSIPhysics(components, advancedSettings);
    const validation = validateSIPhysics(core);
    const weights = WeightCalculator.calculateWeights(components);
    const thrustData = ThrustCalculator.calculateThrust(components, advancedSettings);
    const powerData = PowerCalculator.calculatePowerConsumption(components, advancedSettings);
    const flightTimeData = FlightTimeCalculator.calculateFlightTime(components, powerData, advancedSettings);
    
    return {
      weights,
      thrust: thrustData,
      power: powerData,
      flightTime: flightTimeData,
      weightDistribution: WeightCalculator.getWeightDistribution(weights),
      hoverThrottle: ThrustCalculator.calculateHoverThrottle(thrustData, weights.total),
      siCore: core,
      validation
    };
  }

  private static calculateHoveringMetrics(
    components: SelectedComponents,
    weights: WeightBreakdown,
    thrustData: ThrustData,
    powerData: PowerData
  ) {
    const hoverThrottle = ThrustCalculator.calculateHoverThrottle(thrustData, weights.total);

    // Hover time from SI model (already uses usable battery capacity and current draw).
    let hoverTime = 0;
    if (powerData.hoverCurrent > 0 && components.battery?.data.capacity) {
      const batteryModel = FlightTimeCalculator.buildBatteryModel(components, defaultAdvancedSettings);
      hoverTime = (batteryModel.usableCapacityAh / powerData.hoverCurrent) * 60;
    }
    
    return {
      throttlePercentage: hoverThrottle,
      currentDraw: roundTo(powerData.hoverCurrent, 1),
      hoverPowerWatts: roundTo(powerData.hoverPower || 0, 1),
      hoverTime: roundTo(hoverTime, 1)
    };
  }

  private static getMotorMetrics(
    components: SelectedComponents,
    core: ReturnType<typeof computeSIPhysics>
  ) {
    const kv = core.motor.kv;
    const voltage = core.battery.nominalVoltage;
    const fullVoltage = core.battery.fullVoltage;
    const estimatedRPM = Math.round(core.motor.loadedRpmNominal);
    const propSize = components.prop?.data.size || 'N/A';
    
    return {
      kv,
      voltage: roundTo(voltage, 1),
      fullVoltage: roundTo(fullVoltage, 1),
      estimatedRPM,
      estimatedRPMNominal: Math.round(core.motor.loadedRpmNominal),
      estimatedRPMFull: Math.round(core.motor.loadedRpmFull),
      propSize
    };
  }

  private static getBatteryMetrics(
    components: SelectedComponents,
    core: ReturnType<typeof computeSIPhysics>
  ) {
    if (!components.battery) {
      return { voltage: 0, fullVoltage: 0, capacity: 0, cells: 0, dischargeRate: 0, usableCapacityAh: 0 };
    }
    
    return {
      voltage: roundTo(core.battery.nominalVoltage, 1),
      fullVoltage: roundTo(core.battery.fullVoltage, 1),
      capacity: Math.round(core.battery.capacityAh * 1000),
      cells: core.battery.cells,
      dischargeRate: roundTo(core.battery.maxContinuousCurrentA, 1),
      usableCapacityAh: roundTo(core.battery.usableCapacityAh, 2)
    };
  }

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

  private static checkCompatibility(components: SelectedComponents) {
    return {
      propMotorMatch: this.checkPropMotorCompatibility(components),
      voltageMatch: this.checkVoltageCompatibility(components),
      mountingMatch: this.checkMountingCompatibility(components),
      frameStackMatch: this.checkFrameStackCompatibility(components)
    };
  }

  private static checkPropMotorCompatibility(components: SelectedComponents): boolean {
    if (!components.motor || !components.prop) return true;
    
    const motorStator = components.motor.data.statorSize;
    const propRecommended = components.prop.data.recommendedMotorSize;
    
    return propRecommended.includes(motorStator);
  }

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

  private static checkMountingCompatibility(components: SelectedComponents): boolean {
    if (!components.frame || !components.stack) return true;
    
    const frameMount = components.frame.data.stackMounting;
    const stackMount = components.stack.data.mountingSize;
    
    return frameMount.includes(stackMount);
  }

  private static checkFrameStackCompatibility(components: SelectedComponents): boolean {
    if (!components.frame || !components.prop) return true;
    
    const framePropSize = components.frame.data.propellerSizeCompatibility;
    const propSize = components.prop.data.size;
    
    return framePropSize.includes(propSize.replace(' inch', ''));
  }

  private static parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0;
    const match = weightStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private static getBatteryVoltage(voltageStr: string): number {
    const match = voltageStr.match(/(\d+)S/);
    if (match) {
      return parseInt(match[1]) * 3.7;
    }
    return 14.8;
  }
}
