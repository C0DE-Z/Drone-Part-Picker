import { SelectedComponents, PerformanceEstimate } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';

type ComponentData = {
  price?: number;
  [key: string]: string | number | undefined;
};

export class DroneCalculator {
  static calculatePerformance(components: SelectedComponents, advancedSettings: AdvancedSettings = defaultAdvancedSettings): PerformanceEstimate {
    const weights = this.calculateWeights(components);
  const totalWeight = Math.round(weights.total * 10) / 10;
    
  const thrust = this.calculateThrust(components);
  const maxThrustKg = Math.round((thrust / 1000) * 100) / 100;
    
    
    console.log('Debug - Thrust calculation:', {
      totalWeight: weights.total,
      thrust: thrust,
      rawTWR: thrust / weights.total,
      componentWeights: {
        motor: weights.motor,
        frame: weights.frame,
        stack: weights.stack,
        camera: weights.camera,
        prop: weights.prop,
        battery: weights.battery
      }
    });
    
    
    const thrustToWeightRatio = Math.round((thrust / weights.total) * 100) / 100;
    
    
    const clampedTWR = Math.max(1.0, Math.min(15.0, thrustToWeightRatio));
    
    const estimatedTopSpeed = Math.round(this.estimateTopSpeed(components, clampedTWR));
    const powerConsumption = Math.round(this.estimatePowerConsumption(components) * 10) / 10;
    const estimatedFlightTime = Math.round(this.estimateFlightTime(components, powerConsumption, advancedSettings) * 10) / 10;
    
    const hovering = this.calculateHoveringMetrics(components, weights.total, thrust);
    const motors = this.getMotorMetrics(components);
    const battery = this.getBatteryMetrics(components);
    
    const pricing = this.calculatePricing(components);
    const compatibility = this.checkCompatibility(components);

    return {
      totalWeight,
      thrustToWeightRatio: clampedTWR,
      maxThrust: maxThrustKg,
      maxThrustGrams: thrust,
      estimatedTopSpeed,
      estimatedFlightTime,
      powerConsumption,
      hovering,
      motors,
      battery,
      totalPrice: pricing.total,
      priceBreakdown: pricing.breakdown,
      compatibility
    };
  }

  private static calculateWeights(components: SelectedComponents): { motor: number; frame: number; stack: number; camera: number; prop: number; battery: number; total: number } {
    const weights = {
      motor: 0,
      frame: 0,
      stack: 0,
      camera: 0,
      prop: 0,
      battery: 0,
      total: 0
    };

    if (components.motor) {
      weights.motor = this.parseWeight(components.motor.data.weight) * 4;
    }
    
    if (components.frame) {
      weights.frame = this.parseWeight(components.frame.data.weight);
    }
    
    if (components.stack) {
      const stackType = components.stack.data.type.toLowerCase();
      if (stackType.includes('mini')) {
        weights.stack = 15;
      } else if (stackType.includes('aio')) {
        weights.stack = 20;
      } else {
        weights.stack = 30;
      }
    }
    
    if (components.camera) {
      weights.camera = this.parseWeight(components.camera.data.weight);
    }
    
    if (components.prop) {
      weights.prop = this.parseWeight(components.prop.data.weight) * 4;
    }
    
    if (components.battery) {
      weights.battery = this.parseWeight(components.battery.data.weight);
    }

    let customWeight = 0;
    if (components.customWeights) {
      customWeight = components.customWeights.reduce((total, item) => {
        return total + this.parseWeight(item.data.weight);
      }, 0);
    }

    weights.total = weights.motor + weights.frame + weights.stack + weights.camera + weights.prop + weights.battery + customWeight;
    return weights;
  }

  private static parseWeight(weightStr: string | undefined): number {
    if (!weightStr) return 0;
    const match = weightStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private static calculateThrust(components: SelectedComponents): number {
    if (!components.motor || !components.prop) return 0;
    
    const thrustStr = components.motor.data.maxThrust;
    if (!thrustStr) return 0;
    
    const match = thrustStr.match(/(\d+\.?\d*)/);
    if (!match) return 0;
    
    const singleMotorThrust = parseFloat(match[1]);
    
    const kv = components.motor.data.kv || 2000;
    const voltage = components.battery ? this.getBatteryVoltage(components.battery.data.voltage || '4S') : 14.8;
    const propDiameter = this.parseWeight(components.prop.data.size) || 5;
    const propPitch = this.parseWeight(components.prop.data.pitch) || 4.5;
    const motorStatorSize = this.parseWeight(components.motor.data.statorSize) || 22;
    
    const airDensity = 1.225;
    const temperature = 20;
    const humidity = 60;
    
    const noLoadRPM = kv * voltage;
    
    let motorLoadEfficiency = 0.85;
    if (motorStatorSize >= 28) motorLoadEfficiency = 0.90;
    else if (motorStatorSize >= 25) motorLoadEfficiency = 0.88;
    else if (motorStatorSize >= 22) motorLoadEfficiency = 0.85;
    else if (motorStatorSize >= 20) motorLoadEfficiency = 0.82;
    else motorLoadEfficiency = 0.78;
    
    const optimalKVForThrust = 1600 + (voltage - 14.8) * 150;
    const kvThrustDeviation = Math.abs(kv - optimalKVForThrust) / optimalKVForThrust;
    if (kvThrustDeviation > 0.4) motorLoadEfficiency *= 0.92;
    else if (kvThrustDeviation > 0.3) motorLoadEfficiency *= 0.96;
    else if (kvThrustDeviation < 0.1) motorLoadEfficiency *= 1.03;
    
    const loadedRPM = noLoadRPM * motorLoadEfficiency;
    
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2);
    const tipSpeed = (loadedRPM / 60) * Math.PI * (propDiameter * 0.0254);
    
    const advanceRatio = (propPitch * 0.0254) / (propDiameter * 0.0254);
    
    let propEfficiency = 0.80;
    
    if (advanceRatio >= 0.6 && advanceRatio <= 0.9) {
      propEfficiency = 0.85;
    } else if (advanceRatio >= 0.5 && advanceRatio <= 1.0) {
      propEfficiency = 0.82;
    } else if (advanceRatio >= 0.4 && advanceRatio <= 1.1) {
      propEfficiency = 0.80;
    } else if (advanceRatio < 0.3 || advanceRatio > 1.3) {
      propEfficiency = 0.70;
    } else {
      propEfficiency = 0.75;
    }
    
    const tipMach = tipSpeed / 343;
    if (tipMach > 0.8) propEfficiency *= 0.85;
    else if (tipMach > 0.6) propEfficiency *= 0.92;
    else if (tipMach < 0.3) propEfficiency *= 0.95;
    
    const chord = (propDiameter * 0.0254) * 0.08;
    const reynoldsNumber = (airDensity * tipSpeed * chord) / (1.81e-5);
    if (reynoldsNumber < 50000) propEfficiency *= 0.90;
    else if (reynoldsNumber > 200000) propEfficiency *= 1.02;
    
    const propMaterial = components.prop.data.material || '';
    let materialFactor = 1.0;
    if (propMaterial.toLowerCase().includes('carbon')) {
      materialFactor = 1.05;
    } else if (propMaterial.toLowerCase().includes('glass')) {
      materialFactor = 1.02;
    } else if (propMaterial.toLowerCase().includes('plastic')) {
      materialFactor = 0.98;
    }
    propEfficiency *= materialFactor;
    
    let environmentalFactor = 1.0;
    
    const temperatureKelvin = temperature + 273.15;
    const densityCorrection = (288.15 / temperatureKelvin);
    const correctedAirDensity = airDensity * densityCorrection;
    environmentalFactor *= densityCorrection;
    
    const humidityFactor = 1 - (humidity / 100) * 0.01;
    environmentalFactor *= humidityFactor;
    
    const momentumThrust = 0.5 * correctedAirDensity * diskArea * Math.pow(tipSpeed * 0.08, 2) * propEfficiency;
    const momentumThrustGrams = momentumThrust * 1000;

    const bladeAngle = Math.atan(propPitch / (Math.PI * propDiameter)) * (180 / Math.PI);
    const optimalBladeAngle = 15;
    const angleEfficiency = 1 - Math.abs(bladeAngle - optimalBladeAngle) / 30;
    const betThrust = momentumThrustGrams * Math.max(0.7, angleEfficiency);
    
    const calculatedThrustGrams = (momentumThrustGrams + betThrust) / 2;
    const specThrustGrams = singleMotorThrust * 1000;
    
    let finalThrustPerMotor;
    
    const thrustRatio = calculatedThrustGrams / specThrustGrams;
    if (thrustRatio >= 0.7 && thrustRatio <= 1.3) {
      finalThrustPerMotor = (calculatedThrustGrams * 0.6 + specThrustGrams * 0.4);
    } else if (thrustRatio < 0.7) {
      finalThrustPerMotor = specThrustGrams * 0.85;
    } else {
      finalThrustPerMotor = specThrustGrams * 1.1;
    }
    
    finalThrustPerMotor *= environmentalFactor;
    
    const conditionFactor = 0.95;
    finalThrustPerMotor *= conditionFactor;
    
    const toleranceFactor = 0.98;
    finalThrustPerMotor *= toleranceFactor;
    
    const motorPropMatch = this.calculateMotorPropMatching(kv, voltage, propDiameter, propPitch, motorStatorSize);
    finalThrustPerMotor *= motorPropMatch;
    
    return Math.round(finalThrustPerMotor * 4);
  }
  
  private static calculateMotorPropMatching(kv: number, voltage: number, propDiameter: number, propPitch: number, statorSize: number): number {
    const motorPower = (kv * voltage * statorSize) / 10000;
    const optimalDiameter = Math.sqrt(motorPower * 8);
    const optimalPitch = optimalDiameter * 0.85;
    
    const diameterMatch = 1 - Math.abs(propDiameter - optimalDiameter) / Math.max(propDiameter, optimalDiameter);
    const pitchMatch = 1 - Math.abs(propPitch - optimalPitch) / Math.max(propPitch, optimalPitch);
    
    const overallMatch = (diameterMatch * 0.6 + pitchMatch * 0.4);
    
    return Math.max(0.85, Math.min(1.15, 0.9 + overallMatch * 0.2));
  }

  private static estimateTopSpeed(components: SelectedComponents, twr: number): number {
    if (!components.motor || !components.prop || !components.frame) return 0;
    
    const kv = components.motor.data.kv || 2000;
    const propDiameter = this.parseWeight(components.prop.data.size) || 5;
    const propPitch = this.parseWeight(components.prop.data.pitch) || 4.5;
    const voltage = components.battery ? this.getBatteryVoltage(components.battery.data.voltage || '4S') : 14.8;
    const frameWheelbase = this.parseWeight(components.frame.data.wheelbase) || 220;
    
    const noLoadRPM = kv * voltage;
    const loadedRPM = noLoadRPM * 0.75;
    
    const propSpeedMeterPerSecond = (loadedRPM / 60) * (propPitch * 0.0254);
    
    const frameArea = Math.pow(frameWheelbase / 1000, 2);
    const dragCoefficient = 0.8 + (frameWheelbase / 1000) * 0.2;
    const airDensity = 1.225;
        
    const maxThrust = this.calculateThrust(components) / 1000;
    
    const forwardThrust = maxThrust * 9.81 * 0.3;
    
    const maxSpeedFromDrag = Math.sqrt((2 * forwardThrust) / (airDensity * dragCoefficient * frameArea));
    
    const propEfficiencyAtSpeed = Math.max(0.3, 0.8 - (maxSpeedFromDrag / 50) * 0.3);
    const effectivePropSpeed = propSpeedMeterPerSecond * propEfficiencyAtSpeed;
    
    const finalSpeed = Math.min(effectivePropSpeed, maxSpeedFromDrag);
    
    let correctionFactor = 1.0;
    
    if (twr >= 3.5) correctionFactor *= 1.1;
    else if (twr >= 2.5) correctionFactor *= 1.05;
    else if (twr < 2.0) correctionFactor *= 0.9;
    
    if (frameWheelbase <= 150) correctionFactor *= 1.15;
    else if (frameWheelbase <= 180) correctionFactor *= 1.1;
    else if (frameWheelbase <= 220) correctionFactor *= 1.05;
    else if (frameWheelbase <= 280) correctionFactor *= 1.0;
    else correctionFactor *= 0.9;
    
    const pitchTooDiameterRatio = propPitch / propDiameter;
    if (pitchTooDiameterRatio >= 0.8 && pitchTooDiameterRatio <= 1.2) {
      correctionFactor *= 1.1;
    } else if (pitchTooDiameterRatio < 0.6 || pitchTooDiameterRatio > 1.4) {
      correctionFactor *= 0.85;
    }
    
    const topSpeedKmh = finalSpeed * 3.6 * correctionFactor;
    
    let maxRealisticSpeed = 200;
    if (frameWheelbase <= 100) maxRealisticSpeed = 120;
    else if (frameWheelbase <= 150) maxRealisticSpeed = 150;
    else if (frameWheelbase <= 180) maxRealisticSpeed = 180;
    else if (frameWheelbase <= 220) maxRealisticSpeed = 200;
    else if (frameWheelbase <= 280) maxRealisticSpeed = 210;
    else maxRealisticSpeed = 220;
    
    return Math.round(Math.min(topSpeedKmh, maxRealisticSpeed));
  }

  private static estimatePowerConsumption(components: SelectedComponents): number {
    if (!components.motor || !components.stack) return 25;
    
    const escRating = components.stack.data.escCurrentRating;
    if (!escRating) return 25;
    
    const currentMatch = escRating.match(/(\d+)A/);
    if (!currentMatch) return 25;
    
    const escMaxCurrent = parseInt(currentMatch[1]);
    const motorKV = components.motor.data.kv || 2000;
    const voltage = components.battery ? this.getBatteryVoltage(components.battery.data.voltage || '4S') : 14.8;
    
    const propDiameter = this.parseWeight(components.prop?.data.size) || 5;
    const propPitch = this.parseWeight(components.prop?.data.pitch) || 4.5;
    const motorStatorSize = this.parseWeight(components.motor.data.statorSize) || 22;
    const totalWeight = this.calculateWeights(components).total;
    const frameWheelbase = this.parseWeight(components.frame?.data.wheelbase) || 220;
    
    const airDensity = 1.225;
    const temperature = 20;
    const altitude = 0;
    
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2);
    
    const hoverThrustGrams = totalWeight;
    const hoverThrustNewtons = hoverThrustGrams * 0.001 * 9.81;
    const hoverVelocity = Math.sqrt(hoverThrustNewtons / (2 * airDensity * diskArea));
    const idealHoverPower = hoverThrustNewtons * hoverVelocity;
    const figureOfMerit = 0.75;
    const realHoverPower = (idealHoverPower / figureOfMerit) / 4;
    
    const aggressiveThrustFactor = 2.2;
    const aggressivePower = realHoverPower * Math.pow(aggressiveThrustFactor, 1.5);
    
    const hoverTimeRatio = 0.30;
    const cruiseTimeRatio = 0.45;
    const sportTimeRatio = 0.20;
    const aggressiveTimeRatio = 0.05;
    
    const cruisePower = realHoverPower * 1.4;
    const sportPower = realHoverPower * 1.8;
    
    const averageMechanicalPower = (
      realHoverPower * hoverTimeRatio +
      cruisePower * cruiseTimeRatio +
      sportPower * sportTimeRatio +
      aggressivePower * aggressiveTimeRatio
    );
    
    let motorEfficiency = 0.85;
    if (motorStatorSize >= 28) motorEfficiency = 0.90;
    else if (motorStatorSize >= 25) motorEfficiency = 0.88;
    else if (motorStatorSize >= 22) motorEfficiency = 0.85;
    else if (motorStatorSize >= 20) motorEfficiency = 0.82;
    else motorEfficiency = 0.78;
    
    const optimalKV = 1400 + (voltage - 14.8) * 180;
    const kvDeviation = Math.abs(motorKV - optimalKV) / optimalKV;
    if (kvDeviation > 0.4) motorEfficiency *= 0.88;
    else if (kvDeviation > 0.3) motorEfficiency *= 0.92;
    else if (kvDeviation > 0.2) motorEfficiency *= 0.96;
    else if (kvDeviation < 0.1) motorEfficiency *= 1.02;
    
    const propLoading = totalWeight / (Math.PI * Math.pow(propDiameter * 0.0254 / 2, 2) * 4);
    let propEfficiency = 0.80;
    
    if (propLoading < 15) propEfficiency = 0.85;
    else if (propLoading < 25) propEfficiency = 0.82;
    else if (propLoading < 35) propEfficiency = 0.80;
    else if (propLoading < 45) propEfficiency = 0.77;
    else propEfficiency = 0.73;
    
    const pitchToDiameterRatio = propPitch / propDiameter;
    let propDesignFactor = 1.0;
    if (pitchToDiameterRatio >= 0.85 && pitchToDiameterRatio <= 1.15) {
      propDesignFactor = 1.08;
    } else if (pitchToDiameterRatio >= 0.75 && pitchToDiameterRatio <= 1.25) {
      propDesignFactor = 1.04;
    } else if (pitchToDiameterRatio < 0.6 || pitchToDiameterRatio > 1.4) {
      propDesignFactor = 0.92;
    }
    propEfficiency *= propDesignFactor;
    
    const mechanicalPowerPerMotor = averageMechanicalPower / propEfficiency;
    const electricalPowerPerMotor = mechanicalPowerPerMotor / motorEfficiency;
    const baseCurrentPerMotor = electricalPowerPerMotor / voltage;
    
    let escEfficiency = 0.95;
    if (escMaxCurrent >= 60) escEfficiency = 0.96;
    else if (escMaxCurrent >= 40) escEfficiency = 0.95;
    else if (escMaxCurrent >= 25) escEfficiency = 0.93;
    else escEfficiency = 0.90;
    
    const systemEfficiency = 0.92;
    const totalSystemEfficiency = escEfficiency * systemEfficiency;
    const currentPerMotor = baseCurrentPerMotor / totalSystemEfficiency;
    
    let flightStyleMultiplier = 1.0;
    const powerToWeightRatio = (electricalPowerPerMotor * 4) / (totalWeight / 1000);
    
    if (motorKV >= 2600 && frameWheelbase <= 200) {
      flightStyleMultiplier = 1.12;
    } else if (motorKV >= 2400 && frameWheelbase <= 220) {
      flightStyleMultiplier = 1.08;
    } else if (motorKV >= 2200 && frameWheelbase <= 250) {
      flightStyleMultiplier = 1.05;
    } else if (motorKV >= 2000 && frameWheelbase <= 280) {
      flightStyleMultiplier = 1.02;
    } else if (motorKV >= 1600) {
      flightStyleMultiplier = 0.95;
    } else if (motorKV >= 1200) {
      flightStyleMultiplier = 0.90;
    } else {
      flightStyleMultiplier = 0.85;
    }
    
    if (powerToWeightRatio > 200) flightStyleMultiplier *= 1.05;
    else if (powerToWeightRatio > 150) flightStyleMultiplier *= 1.02;
    else if (powerToWeightRatio < 80) flightStyleMultiplier *= 0.95;
    
    let environmentalFactor = 1.0;
  if (altitude > 2000) environmentalFactor *= 1.08;
    else if (altitude > 1000) environmentalFactor *= 1.04;
    
  if (temperature > 35) environmentalFactor *= 1.03;
  else if (temperature < 5) environmentalFactor *= 1.05;
    
    
    const adjustedCurrentPerMotor = currentPerMotor * flightStyleMultiplier * environmentalFactor;
    
    const escSafeLimit = escMaxCurrent * 0.85;
    const cappedCurrentPerMotor = Math.min(adjustedCurrentPerMotor, escSafeLimit);
    const finalTotalCurrent = cappedCurrentPerMotor * 4;
    
    
    let aerodynamicFactor = 1.0;
  if (frameWheelbase <= 120) aerodynamicFactor = 0.88;
  else if (frameWheelbase <= 150) aerodynamicFactor = 0.92;
  else if (frameWheelbase <= 180) aerodynamicFactor = 0.96;
  else if (frameWheelbase <= 220) aerodynamicFactor = 1.00;
  else if (frameWheelbase <= 280) aerodynamicFactor = 1.04;
  else aerodynamicFactor = 1.08;
    
    const aerodynamicallyAdjustedCurrent = finalTotalCurrent * aerodynamicFactor;
    
    
  const minRealistic = Math.max(8, totalWeight * 0.020);
  const maxRealistic = Math.min(85, escMaxCurrent * 4 * 0.75);
    const thrustToWeightRatio = this.calculateThrust(components) / totalWeight;
    
    // TWR-based adjustments for realism
    let twrFactor = 1.0;
    if (thrustToWeightRatio > 4.0) twrFactor = 1.08; // Very high performance
    else if (thrustToWeightRatio > 3.0) twrFactor = 1.04; // High performance
    else if (thrustToWeightRatio < 2.0) twrFactor = 0.92; // Lower performance
    else if (thrustToWeightRatio < 1.5) twrFactor = 0.85; // Underpowered
    
    const finalCurrent = aerodynamicallyAdjustedCurrent * twrFactor;
    
    return Math.round(Math.max(minRealistic, Math.min(finalCurrent, maxRealistic)) * 10) / 10;
  }

  private static estimateFlightTime(components: SelectedComponents, powerConsumption: number, settings: AdvancedSettings = defaultAdvancedSettings): number {
    if (!components.battery || !components.battery.data.capacity) return 0;
    
    const capacityMatch = components.battery.data.capacity.match(/(\d+)/);
    if (!capacityMatch) return 0;
    
    const capacity = parseInt(capacityMatch[1]);
    const cRatingStr = components.battery.data.cRating || '50C';
    const cRating = parseInt(cRatingStr.match(/(\d+)/)?.[1] || '50');
    const cells = parseInt(components.battery.data.voltage?.match(/(\d+)S/)?.[1] || '4');
    const validPowerConsumption = powerConsumption > 0 ? powerConsumption : 25;
    
    const { altitude, temperature, windSpeed } = settings.environment;
    
    let usableCapacityFactor = settings.battery.usableCapacityFactor;
    
    const dischargeRate = validPowerConsumption / capacity;
    if (dischargeRate > 4.0) usableCapacityFactor *= 0.70;
    else if (dischargeRate > 3.0) usableCapacityFactor *= 0.75;
    else if (dischargeRate > 2.0) usableCapacityFactor *= 0.80;
    else if (dischargeRate > 1.5) usableCapacityFactor *= 0.83;
    else if (dischargeRate > 1.0) usableCapacityFactor *= 0.87;
    else if (dischargeRate > 0.5) usableCapacityFactor *= 0.90;
    else usableCapacityFactor *= 0.93;
    
    let temperatureFactor = 1.0;
    const tempSettings = settings.battery.temperatureEfficiency;
    if (temperature < 0) temperatureFactor = tempSettings.freezing;
    else if (temperature < 10) temperatureFactor = tempSettings.cold;
    else if (temperature < 20) temperatureFactor = tempSettings.cool;
    else if (temperature <= 25) temperatureFactor = tempSettings.optimal;
    else if (temperature <= 35) temperatureFactor = tempSettings.warm;
    else if (temperature <= 45) temperatureFactor = tempSettings.hot;
    else temperatureFactor = tempSettings.extreme;
    
    let altitudeFactor = 1.0;
    if (altitude > 3000) altitudeFactor = 0.85;
    else if (altitude > 2000) altitudeFactor = 0.92;
    else if (altitude > 1000) altitudeFactor = 0.96;
    
    let windFactor = 1.0;
    if (windSpeed > 30) windFactor = 0.75;
    else if (windSpeed > 20) windFactor = 0.85;
    else if (windSpeed > 10) windFactor = 0.95;
    
    const batteryAge = settings.battery.ageFactor;
    
    let chemistryFactor = 1.0;
    
    // Capacity-based chemistry quality
    if (capacity >= 2200) chemistryFactor = 1.08; // Premium large batteries
    else if (capacity >= 1800) chemistryFactor = 1.05; // High-quality batteries
    else if (capacity >= 1500) chemistryFactor = 1.03; // Good quality batteries
    else if (capacity >= 1300) chemistryFactor = 1.02; // Standard batteries
    else if (capacity >= 1000) chemistryFactor = 1.00; // Basic batteries
    else if (capacity >= 650) chemistryFactor = 0.97; // Small batteries
    else chemistryFactor = 0.94; // Very small batteries
    
    // C-rating quality and internal resistance modeling
    let cRatingFactor = 1.0;
    let internalResistanceFactor = 1.0;
    
    if (cRating >= 150) {
      cRatingFactor = 1.05; // Competition-grade batteries
      internalResistanceFactor = 1.03; // Lower internal resistance
    } else if (cRating >= 100) {
      cRatingFactor = 1.03; // High-performance batteries
      internalResistanceFactor = 1.02;
    } else if (cRating >= 70) {
      cRatingFactor = 1.01; // Quality batteries
      internalResistanceFactor = 1.01;
    } else if (cRating >= 50) {
      cRatingFactor = 1.00; // Standard batteries
      internalResistanceFactor = 1.00;
    } else if (cRating >= 30) {
      cRatingFactor = 0.98; // Budget batteries
      internalResistanceFactor = 0.98;
    } else {
      cRatingFactor = 0.95; // Low-quality batteries
      internalResistanceFactor = 0.95;
    }
    
    // 4. Advanced voltage sag modeling with load curves
    let voltageSagFactor = 1.0;
    const currentPerCell = validPowerConsumption / cells;
    const cellInternalResistance = 0.01 + (1 / cRating) * 0.02; // Estimated mΩ
    
    // Non-linear voltage sag calculation
    if (currentPerCell > 12) voltageSagFactor = 0.82; // Extreme current per cell
    else if (currentPerCell > 10) voltageSagFactor = 0.86; // Very high current
    else if (currentPerCell > 8) voltageSagFactor = 0.88; // High current
    else if (currentPerCell > 6) voltageSagFactor = 0.92; // Moderate-high current
    else if (currentPerCell > 4) voltageSagFactor = 0.95; // Moderate current
    else if (currentPerCell > 2) voltageSagFactor = 0.98; // Low current
    else voltageSagFactor = 0.99; // Very low current
    
    // Additional sag from internal resistance
    const voltageDrop = currentPerCell * cellInternalResistance;
    const additionalSagFactor = Math.max(0.9, 1 - (voltageDrop / 3.7) * 0.1);
    voltageSagFactor *= additionalSagFactor;
    
    // 5. Advanced flight style and motor load modeling
    let flightStyleFactor = 1.0;
    const motorKV = components.motor?.data.kv || 2000;
    const frameWheelbase = this.parseWeight(components.frame?.data.wheelbase) || 220;
    const totalWeight = this.calculateWeights(components).total;
    const powerToWeightRatio = validPowerConsumption / (totalWeight / 1000); // W/kg
    
    // Flight style based on motor KV, frame size, and power characteristics
    if (motorKV >= 2600 && frameWheelbase <= 200) {
      // Racing setup - high KV, small frame
      flightStyleFactor = 0.82; // Aggressive flying with brief cruising
    } else if (motorKV >= 2400 && frameWheelbase <= 220) {
      // Racing/freestyle - high performance
      flightStyleFactor = 0.85; // Mixed aggressive and sport flying
    } else if (motorKV >= 2200 && frameWheelbase <= 250) {
      // Freestyle - balanced performance
      flightStyleFactor = 0.88; // Sport flying with cruising
    } else if (motorKV >= 2000 && frameWheelbase <= 280) {
      // Sport/freestyle - moderate performance
      flightStyleFactor = 0.90; // Mixed sport and cruising
    } else if (motorKV >= 1800) {
      // Cinematic/sport - efficient flying
      flightStyleFactor = 0.95; // Smooth flying with occasional sport
    } else if (motorKV >= 1400) {
      // Long-range/cinematic - efficient setup
      flightStyleFactor = 1.02; // Efficient cruising
    } else {
      // Ultra long-range - very efficient
      flightStyleFactor = 1.05; // Maximum efficiency flying
    }
    
    // Power-to-weight ratio adjustments
    if (powerToWeightRatio > 200) flightStyleFactor *= 0.95; // High power = more aggressive capability
    else if (powerToWeightRatio > 150) flightStyleFactor *= 0.98;
    else if (powerToWeightRatio < 80) flightStyleFactor *= 1.03; // Lower power = more efficient
    
    // 6. Advanced system efficiency modeling
    const propDiameter = this.parseWeight(components.prop?.data.size) || 5;
    const propPitch = this.parseWeight(components.prop?.data.pitch) || 4.5;
    let systemEfficiencyFactor = 1.0;
    
    // Propeller efficiency with advanced modeling
    const pitchToDiameterRatio = propPitch / propDiameter;
    const diskLoading = totalWeight / (Math.PI * Math.pow(propDiameter * 0.0254 / 2, 2) * 4); // g/m² per prop
    
    // Optimal prop efficiency curve
    if (pitchToDiameterRatio >= 0.85 && pitchToDiameterRatio <= 1.15) {
      systemEfficiencyFactor *= 1.12; // Optimal prop ratio
    } else if (pitchToDiameterRatio >= 0.75 && pitchToDiameterRatio <= 1.25) {
      systemEfficiencyFactor *= 1.08; // Good prop ratio
    } else if (pitchToDiameterRatio >= 0.65 && pitchToDiameterRatio <= 1.35) {
      systemEfficiencyFactor *= 1.02; // Acceptable prop ratio
    } else if (pitchToDiameterRatio < 0.55 || pitchToDiameterRatio > 1.45) {
      systemEfficiencyFactor *= 0.88; // Poor prop ratio
    } else {
      systemEfficiencyFactor *= 0.95; // Suboptimal prop ratio
    }
    
    // Disk loading effects on efficiency
    if (diskLoading < 20) systemEfficiencyFactor *= 1.05; // Low disk loading = efficient
    else if (diskLoading > 40) systemEfficiencyFactor *= 0.95; // High disk loading = less efficient
    
    // Frame aerodynamic efficiency
    if (frameWheelbase <= 120) systemEfficiencyFactor *= 1.08; // Tiny whoop efficiency
    else if (frameWheelbase <= 150) systemEfficiencyFactor *= 1.06; // Small frame efficiency
    else if (frameWheelbase <= 180) systemEfficiencyFactor *= 1.03; // 4-inch efficiency
    else if (frameWheelbase <= 220) systemEfficiencyFactor *= 1.01; // 5-inch standard
    else if (frameWheelbase <= 280) systemEfficiencyFactor *= 0.98; // 6-7 inch
    else systemEfficiencyFactor *= 0.94; // Large frame drag
    
    const motorStatorSize = this.parseWeight(components.motor?.data.statorSize) || 22;
    
    if (motorStatorSize >= 28) systemEfficiencyFactor *= 1.04;
    else if (motorStatorSize >= 25) systemEfficiencyFactor *= 1.02;
    else if (motorStatorSize <= 18) systemEfficiencyFactor *= 0.96;
    
    const effectiveCapacity = capacity * 
      usableCapacityFactor * 
      temperatureFactor * 
      altitudeFactor * 
      windFactor * 
      batteryAge * 
      chemistryFactor * 
      cRatingFactor * 
      internalResistanceFactor * 
      voltageSagFactor * 
      systemEfficiencyFactor;
    
    const baseFlightTimeMinutes = (effectiveCapacity / 1000) / validPowerConsumption * 60;
    
    const adjustedFlightTime = baseFlightTimeMinutes * flightStyleFactor;
    
    let maxRealisticTime = 35;
    
    if (capacity >= 2500) maxRealisticTime = 55;
    else if (capacity >= 2200) maxRealisticTime = 50;
    else if (capacity >= 1800) maxRealisticTime = 45;
    else if (capacity >= 1500) maxRealisticTime = 40;
    else if (capacity >= 1300) maxRealisticTime = 38;
    else if (capacity >= 1100) maxRealisticTime = 32;
    else if (capacity >= 850) maxRealisticTime = 25;
    else if (capacity >= 650) maxRealisticTime = 20;
    else if (capacity >= 450) maxRealisticTime = 15;
    else maxRealisticTime = 10;
    
    if (motorKV >= 2600 && frameWheelbase <= 200) {
      maxRealisticTime *= 0.75;
    } else if (motorKV >= 2400 && frameWheelbase <= 220) {
      maxRealisticTime *= 0.82;
    } else if (motorKV >= 2200 && frameWheelbase <= 250) {
      maxRealisticTime *= 0.88;
    } else if (motorKV >= 2000) {
      maxRealisticTime *= 0.92;
    } else if (motorKV <= 1600) {
      maxRealisticTime *= 1.08;
    } else if (motorKV <= 1200) {
      maxRealisticTime *= 1.15;
    }
    
    if (powerToWeightRatio > 180) maxRealisticTime *= 0.90;
    else if (powerToWeightRatio < 100) maxRealisticTime *= 1.10;
    
    const finalTime = Math.min(adjustedFlightTime, maxRealisticTime);
    
    return Math.max(0.5, Math.round(finalTime * 10) / 10);
  }

  private static getBatteryVoltage(voltageStr: string): number {
    const match = voltageStr.match(/(\d+)S/);
    if (match) {
      return parseInt(match[1]) * 3.7;
    }
    return 14.8; 
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

  private static calculatePricing(components: SelectedComponents): { 
    total: number; 
    breakdown: {
      motor?: number;
      frame?: number;
      stack?: number;
      camera?: number;
      prop?: number;
      battery?: number;
      customWeights?: number;
    }
  } {
    const breakdown = {
      motor: 0,
      frame: 0,
      stack: 0,
      camera: 0,
      prop: 0,
      battery: 0,
      customWeights: 0
    };

    
    if (components.motor?.data.price) {
      breakdown.motor = components.motor.data.price * 4;
    } else if (components.motor) {
      
      breakdown.motor = this.estimateComponentPrice('motor', components.motor.data as unknown as ComponentData) * 4;
    }

    
    if (components.frame?.data.price) {
      breakdown.frame = components.frame.data.price;
    } else if (components.frame) {
      breakdown.frame = this.estimateComponentPrice('frame', components.frame.data as unknown as ComponentData);
    }

    if (components.stack?.data.price) {
      breakdown.stack = components.stack.data.price;
    } else if (components.stack) {
      breakdown.stack = this.estimateComponentPrice('stack', components.stack.data as unknown as ComponentData);
    }

    if (components.camera?.data.price) {
      breakdown.camera = components.camera.data.price;
    } else if (components.camera) {
      breakdown.camera = this.estimateComponentPrice('camera', components.camera.data as unknown as ComponentData);
    }

    if (components.prop?.data.price) {
  breakdown.prop = components.prop.data.price * 4;
    } else if (components.prop) {
  breakdown.prop = this.estimateComponentPrice('prop', components.prop.data as unknown as ComponentData) * 4;
    }

    if (components.battery?.data.price) {
      breakdown.battery = components.battery.data.price;
    } else if (components.battery) {
      breakdown.battery = this.estimateComponentPrice('battery', components.battery.data as unknown as ComponentData);
    }

    
    if (components.customWeights) {
      breakdown.customWeights = components.customWeights.reduce((total, weight) => {
        return total + (weight.data.price || this.estimateComponentPrice('customWeight', weight.data as unknown as ComponentData));
      }, 0);
    }

  const total = Object.values(breakdown).reduce((sum, price) => sum + price, 0);

    return {
      total: Math.round(total * 100) / 100,
      breakdown
    };
  }

  private static estimateComponentPrice(type: string, data: ComponentData): number {
    
    switch (type) {
      case 'motor':
        const kv = data.kv || 2000;
        const statorSizeStr = typeof data.statorSize === 'string' ? data.statorSize : String(data.statorSize || '20');
        const statorSize = parseFloat(statorSizeStr.replace(/[^\d.]/g, '') || '20');
  return Math.round((statorSize * 2 + Number(kv) * 0.01) * 0.8);

      case 'frame':
        const materialStr = typeof data.material === 'string' ? data.material : String(data.material || '');
        const material = materialStr.toLowerCase();
        const wheelbaseStr = typeof data.wheelbase === 'string' ? data.wheelbase : String(data.wheelbase || '220');
        const wheelbase = parseFloat(wheelbaseStr.replace(/[^\d]/g, '') || '220');
  let framePrice = wheelbase * 0.2;
  if (material.includes('carbon')) framePrice *= 1.5;
  if (material.includes('titanium')) framePrice *= 2;
  return Math.round(framePrice);

      case 'stack':
        const processorStr = typeof data.fcProcessor === 'string' ? data.fcProcessor : String(data.fcProcessor || '');
        const processor = processorStr.toLowerCase();
        const escRatingStr = typeof data.escCurrentRating === 'string' ? data.escCurrentRating : String(data.escCurrentRating || '30');
        const escRating = parseFloat(escRatingStr.replace(/[^\d]/g, '') || '30');
  let stackPrice = escRating * 2;
  if (processor.includes('f7')) stackPrice *= 1.5;
  if (processor.includes('f4')) stackPrice *= 1.2;
  return Math.round(stackPrice);

      case 'camera':
        const resolutionStr = typeof data.resolution === 'string' ? data.resolution : String(data.resolution || '');
        const resolution = resolutionStr.toLowerCase();
  let cameraPrice = 25;
  if (resolution.includes('4k')) cameraPrice = 45;
  if (resolution.includes('1080p')) cameraPrice = 30;
  if (resolution.includes('720p')) cameraPrice = 20;
  return cameraPrice;

      case 'prop':
        const sizeStr = typeof data.size === 'string' ? data.size : String(data.size || '5');
        const propSize = parseFloat(sizeStr.replace(/[^\d.]/g, '') || '5');
        const materialPropStr = typeof data.material === 'string' ? data.material : String(data.material || '');
        const material_prop = materialPropStr.toLowerCase();
  let propPrice = propSize * 0.8;
  if (material_prop.includes('carbon')) propPrice *= 2;
  return Math.round(propPrice * 100) / 100;

      case 'battery':
        const capacityStr = typeof data.capacity === 'string' ? data.capacity : String(data.capacity || '1300');
        const capacity = parseFloat(capacityStr.replace(/[^\d]/g, '') || '1300');
        const voltageStr = typeof data.voltage === 'string' ? data.voltage : String(data.voltage || '4S');
        const voltage = voltageStr;
        const cells = parseFloat(voltage.replace(/[^\d]/g, '') || '4');
        return Math.round((capacity / 100) * cells * 0.5);

      case 'customWeight':
  return data.price || 5;

      default:
        return 0;
    }
  }

  private static calculateHoveringMetrics(components: SelectedComponents, totalWeight: number, maxThrust: number): {
    throttlePercentage: number;
    currentDraw: number;
    hoverTime: number;
  } {
    
    const hoverThrustRequired = totalWeight; 
    const hoverThrustPercentage = (hoverThrustRequired / maxThrust) * 100;
    
    const propDiameter = this.parseWeight(components.prop?.data.size) || 5; // inches
    const diskArea = Math.PI * Math.pow((propDiameter * 0.0254) / 2, 2); // m²
    
    const hoverVelocity = Math.sqrt((hoverThrustRequired * 0.001 * 9.81) / (2 * 1.225 * diskArea)); // m/s
    const figureOfMerit = 0.75; 
    const idealPower = (hoverThrustRequired * 0.001 * 9.81 * hoverVelocity) / 1000; // kW
    const realPower = idealPower / figureOfMerit; // kW
    
    const voltage = components.battery ? this.getBatteryVoltage(components.battery.data.voltage || '4S') : 14.8;
    const kv = components.motor?.data.kv || 2000;
    const motorRPMAtHover = kv * voltage * Math.sqrt(hoverThrustPercentage / 100);
    
    const maxRPM = kv * voltage;
    const rpmRatio = motorRPMAtHover / maxRPM;
    let motorEfficiency = 0.85; // Base efficiency
    if (rpmRatio >= 0.7 && rpmRatio <= 0.8) motorEfficiency = 0.88; // Peak efficiency
    else if (rpmRatio < 0.5) motorEfficiency = 0.75; // Low RPM inefficiency
    else if (rpmRatio > 0.9) motorEfficiency = 0.80; // High RPM inefficiency
    
    const electricalPower = realPower / motorEfficiency; // kW per motor
    const currentPerMotor = (electricalPower * 1000) / voltage; // A per motor
    const totalHoverCurrent = currentPerMotor * 4; // 4 motors
    
    const systemEfficiency = 0.92;
    const actualHoverCurrent = totalHoverCurrent / systemEfficiency;
    
    let correctionFactor = 1.0;
    
    const frameWheelbase = this.parseWeight(components.frame?.data.wheelbase) || 220;
    if (frameWheelbase <= 150) correctionFactor *= 0.90; // Smaller frames more efficient
    else if (frameWheelbase >= 300) correctionFactor *= 1.10; // Larger frames less efficient
    
    const propLoading = hoverThrustRequired / (propDiameter * propDiameter); // g/inch²
    if (propLoading > 30) correctionFactor *= 1.05; // High loading = more current
    else if (propLoading < 15) correctionFactor *= 0.95; // Light loading = more efficient
    
    const motorStatorSize = this.parseWeight(components.motor?.data.statorSize) || 22;
    if (motorStatorSize >= 25) correctionFactor *= 0.95; // Larger motors more efficient
    else if (motorStatorSize <= 20) correctionFactor *= 1.05; // Smaller motors less efficient
    
    const finalHoverCurrent = Math.round(actualHoverCurrent * correctionFactor * 10) / 10;
    
    let hoverTime = 0;
    if (components.battery && components.battery.data.capacity) {
      const capacity = parseInt(components.battery.data.capacity.match(/(\d+)/)?.[1] || '1300');
      const cRating = parseInt(components.battery.data.cRating?.match(/(\d+)/)?.[1] || '50');
      
      let hoverBatteryEfficiency = 0.92; // Better than sport flying
      if (cRating >= 70) hoverBatteryEfficiency = 0.94; // High-quality batteries
      if (capacity >= 1500) hoverBatteryEfficiency += 0.02; // Larger batteries more efficient
      
      const cells = parseInt(components.battery.data.voltage?.match(/(\d+)S/)?.[1] || '4');
      const currentPerCell = finalHoverCurrent / cells;
      let voltageSagFactor = 0.98; // Minimal sag at hover
      if (currentPerCell > 4) voltageSagFactor = 0.95;
      else if (currentPerCell < 2) voltageSagFactor = 0.99;
      
      const usableCapacity = capacity * 0.90 * hoverBatteryEfficiency * voltageSagFactor; // 90% usable for hover
      hoverTime = (usableCapacity / 1000) / finalHoverCurrent * 60; // minutes
      
      const maxHoverTime = capacity >= 2000 ? 45 : capacity >= 1500 ? 35 : capacity >= 1000 ? 25 : 15;
      hoverTime = Math.min(hoverTime, maxHoverTime);
    }
    

    let hoverThrottlePercentage;
    if (hoverThrustPercentage <= 100) {

      const baseThrottleFromThrust = Math.sqrt(hoverThrustPercentage / 100) * 100;
      
      const kv = components.motor?.data.kv || 2000;
      let throttleAdjustmentFactor = 1.0;
      
      if (kv >= 2600) throttleAdjustmentFactor = 1.4; // Racing builds
      else if (kv >= 2400) throttleAdjustmentFactor = 1.3; // High performance
      else if (kv >= 2200) throttleAdjustmentFactor = 1.2; // Sport
      else if (kv >= 2000) throttleAdjustmentFactor = 1.15; // Standard 5"
      else if (kv >= 1800) throttleAdjustmentFactor = 1.1; // Efficient 5"
      else if (kv <= 1600) throttleAdjustmentFactor = 1.05; // Long range
      else if (kv <= 1200) throttleAdjustmentFactor = 1.0; // Ultra efficient
      
      const propDiameter = this.parseWeight(components.prop?.data.size) || 5;
      if (propDiameter >= 6) throttleAdjustmentFactor *= 0.95; // Larger props more efficient
      else if (propDiameter <= 4) throttleAdjustmentFactor *= 1.08; // Smaller props less efficient
      
      const powerToWeightRatio = (maxThrust / totalWeight);
      if (powerToWeightRatio > 3.0) throttleAdjustmentFactor *= 0.92; // Very overpowered
      else if (powerToWeightRatio > 2.5) throttleAdjustmentFactor *= 0.96; // Overpowered
      else if (powerToWeightRatio < 1.8) throttleAdjustmentFactor *= 1.08; // Underpowered
      else if (powerToWeightRatio < 1.5) throttleAdjustmentFactor *= 1.15; // Very underpowered
      
      hoverThrottlePercentage = baseThrottleFromThrust * throttleAdjustmentFactor;
      
      hoverThrottlePercentage = Math.min(75, Math.max(25, hoverThrottlePercentage));
    } else {
      hoverThrottlePercentage = 100;
    }
    
    return {
      throttlePercentage: Math.round(hoverThrottlePercentage),
      currentDraw: finalHoverCurrent,
      hoverTime: Math.round(Math.max(0.0, hoverTime) * 10) / 10
    };
  }

  private static getMotorMetrics(components: SelectedComponents): {
    kv: number;
    voltage: number;
    estimatedRPM: number;
    propSize: string;
  } {
    const kv = components.motor?.data.kv || 0;
    const voltage = components.battery ? this.getBatteryVoltage(components.battery.data.voltage || '4S') : 14.8;
    const estimatedRPM = Math.round(kv * voltage);
    const propSize = components.prop?.data.size || 'N/A';
    
    return {
      kv,
      voltage: Math.round(voltage * 10) / 10,
      estimatedRPM,
      propSize
    };
  }

  private static getBatteryMetrics(components: SelectedComponents): {
    voltage: number;
    capacity: number;
    cells: number;
    dischargeRate: number;
  } {
    if (!components.battery) {
      return {
        voltage: 0,
        capacity: 0,
        cells: 0,
        dischargeRate: 0
      };
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
}
