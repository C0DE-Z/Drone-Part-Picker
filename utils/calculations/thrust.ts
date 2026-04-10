import { SelectedComponents } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { computeSIPhysics, roundTo, validateSIPhysics } from './siPhysics';

export interface ThrustData {
  totalThrust: number; // grams
  thrustPerMotor: number; // grams
  totalThrustNewtons?: number;
  thrustToWeightRatio: number;
  isOptimal: boolean;
  recommendations?: string[];
  validation?: ReturnType<typeof validateSIPhysics>;
}

export class ThrustCalculator {
  static calculateThrust(
    components: SelectedComponents,
    settings: AdvancedSettings = defaultAdvancedSettings
  ): ThrustData {
    if (!components.motor || !components.prop) {
      return {
        totalThrust: 0,
        thrustPerMotor: 0,
        totalThrustNewtons: 0,
        thrustToWeightRatio: 0,
        isOptimal: false,
        recommendations: ['Motor and propeller required for thrust calculation']
      };
    }

    const core = computeSIPhysics(components, settings);
    const validation = validateSIPhysics(core);
    const thrustPerMotor = (core.thrust.perMotorN / 9.80665) * 1000;
    const totalThrust = core.thrust.totalGrams;
    const thrustToWeightRatio = core.thrust.thrustToWeightRatio;

    const analysis = this.analyzeThrustToWeight(thrustToWeightRatio);
    const recommendations = [
      ...analysis.recommendations,
      ...(validation.warnings ?? [])
    ];

    return {
      totalThrust: Math.round(totalThrust),
      thrustPerMotor: Math.round(thrustPerMotor),
      totalThrustNewtons: roundTo(core.thrust.totalN, 2),
      thrustToWeightRatio: roundTo(thrustToWeightRatio, 2),
      isOptimal: analysis.isOptimal && validation.isRealistic,
      recommendations,
      validation
    };
  }

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

  static calculateHoverThrottle(thrustData: ThrustData, totalWeight: number): number {
    if (thrustData.totalThrust === 0) return 0;

    // Hover thrust is directly proportional to weight in steady-state hover.
    const hoverThrustPercentage = (totalWeight / thrustData.totalThrust) * 100;
    return Math.round(Math.min(100, Math.max(0, hoverThrustPercentage)));
  }
}
