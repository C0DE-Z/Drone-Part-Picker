import { SelectedComponents } from '@/types/drone';
import { DronePerformanceService } from '@/services/DronePerformanceService';
import { buildBatteryProfile, computeSIPhysics, validateSIPhysics } from '../siPhysics';

const sampleComponents: SelectedComponents = {
  motor: {
    name: 'Test Motor 2207 1800KV',
    data: {
      statorSize: '2207',
      kv: 1800,
      voltageCompatibility: '4-6S',
      weight: '32g',
      maxThrust: '1.8kg',
      propCompatibility: '5-inch',
      shaftDiameter: '5mm',
      bearings: 'NMB',
      magnetType: 'N52',
      wireGauge: '20AWG'
    }
  },
  frame: {
    name: 'Test 5-inch Frame',
    data: {
      type: 'Freestyle',
      weight: '120g',
      wheelbase: '220mm',
      propellerSizeCompatibility: '5',
      material: 'Carbon Fiber',
      armThickness: '4mm',
      topPlateThickness: '2mm',
      bottomPlateThickness: '2mm',
      cameraMount: '19mm',
      stackMounting: '30.5x30.5'
    }
  },
  stack: {
    name: 'F7 55A Stack',
    data: {
      type: 'FC + ESC',
      fcProcessor: 'F7',
      escCurrentRating: '55A',
      mountingSize: '30.5x30.5',
      gyro: 'ICM42688',
      osd: 'AT7456E',
      bluetooth: 'No',
      voltageInput: '3-6S'
    }
  },
  prop: {
    name: '5x4.3x3 Prop',
    data: {
      size: '5x4.3',
      pitch: '4.3',
      blades: 3,
      material: 'Polycarbonate',
      weight: '4.2g',
      hubID: '5mm',
      recommendedMotorSize: '2207'
    }
  },
  battery: {
    name: '1500mAh 6S 100C',
    data: {
      capacity: '1500mAh',
      voltage: '6S',
      cRating: '100C',
      weight: '250g',
      connector: 'XT60',
      dimensions: '75x35x40mm'
    }
  }
};

describe('SI physics engine', () => {
  it('models 6S battery nominal and full voltage correctly', () => {
    const battery = buildBatteryProfile(sampleComponents);

    expect(battery.cells).toBe(6);
    expect(battery.nominalVoltage).toBeCloseTo(22.2, 1);
    expect(battery.fullVoltage).toBeCloseTo(25.2, 1);
  });

  it('produces realistic flight and thrust outputs in SI pipeline', () => {
    const result = computeSIPhysics(sampleComponents);
    const validation = validateSIPhysics(result);

    expect(result.mass.totalKg).toBeGreaterThan(0.2);
    expect(result.thrust.totalGrams).toBeGreaterThan(1000);
    expect(result.thrust.totalGrams).toBeLessThan(25000);
    expect(result.hover.throttlePercent).toBeGreaterThan(0);
    expect(result.hover.throttlePercent).toBeLessThanOrEqual(100);
    expect(result.flight.mixedMin).toBeGreaterThan(1);
    expect(result.flight.mixedMin).toBeLessThan(35);
    expect(result.speed.estimatedTopSpeedKmh).toBeLessThanOrEqual(230);
    expect(validation.flags.suspiciousThrustOutput).toBe(false);
  });

  it('feeds cleaned metrics into service output contract', () => {
    const performance = DronePerformanceService.calculatePerformance(sampleComponents);

    expect(performance.powerConsumption).toBeGreaterThan(0);
    expect(performance.maxThrust).toBeLessThan(30);
    expect(performance.flightEstimates?.hover).toBeGreaterThan(0);
    expect(performance.battery.voltage).toBeCloseTo(22.2, 1);
    expect(performance.battery.fullVoltage).toBeCloseTo(25.2, 1);
  });

  it('keeps mixed-flight estimates practical when weight metadata is missing', () => {
    const sparseWeightComponents: SelectedComponents = {
      ...sampleComponents,
      motor: {
        ...sampleComponents.motor!,
        data: {
          ...sampleComponents.motor!.data,
          weight: ''
        }
      },
      frame: {
        ...sampleComponents.frame!,
        data: {
          ...sampleComponents.frame!.data,
          weight: ''
        }
      },
      battery: {
        ...sampleComponents.battery!,
        data: {
          ...sampleComponents.battery!.data,
          weight: ''
        }
      }
    };

    const result = computeSIPhysics(sparseWeightComponents);

    expect(result.mass.totalKg).toBeGreaterThan(0.25);
    expect(result.flight.mixedMin).toBeGreaterThan(2);
    expect(result.flight.mixedMin).toBeLessThan(20);
  });
});
