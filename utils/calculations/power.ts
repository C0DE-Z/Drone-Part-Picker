import { SelectedComponents } from '@/types/drone';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import { computeSIPhysics, roundTo, validateSIPhysics } from './siPhysics';

export interface PowerData {
  averageCurrent: number; // Amps
  hoverCurrent: number; // Amps
  sportCurrent: number; // Amps
  powerConsumption: number; // Watts (mixed flight estimate)
  efficiency: number; // g/W at hover
  aggressiveCurrent?: number;
  hoverPower?: number;
  cruisePower?: number;
  aggressivePower?: number;
  validation?: ReturnType<typeof validateSIPhysics>;
  recommendations?: string[];
}

export class PowerCalculator {
  static calculatePowerConsumption(
    components: SelectedComponents,
    settings: AdvancedSettings = defaultAdvancedSettings
  ): PowerData {
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

    const core = computeSIPhysics(components, settings);
    const validation = validateSIPhysics(core);

    const analysis = this.analyzePowerConsumption(core.power.averageCurrentA, core.battery.maxContinuousCurrentA);
    const recommendations = [...analysis.recommendations, ...validation.warnings];

    return {
      averageCurrent: roundTo(core.power.averageCurrentA, 1),
      hoverCurrent: roundTo(core.hover.hoverCurrentA, 1),
      sportCurrent: roundTo(core.power.sportCurrentA, 1),
      aggressiveCurrent: roundTo(core.power.aggressiveCurrentA, 1),
      powerConsumption: roundTo(core.power.averagePowerW, 1),
      hoverPower: roundTo(core.hover.hoverPowerW, 1),
      cruisePower: roundTo(core.power.cruisePowerW, 1),
      aggressivePower: roundTo(core.power.aggressivePowerW, 1),
      efficiency: roundTo(core.hover.hoverEfficiencyGramPerWatt, 2),
      validation,
      recommendations
    };
  }

  private static analyzePowerConsumption(current: number, batteryMaxCurrent: number): {
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (batteryMaxCurrent > 0) {
      const utilization = (current / batteryMaxCurrent) * 100;
      if (utilization > 85) {
        recommendations.push('Average current draw is high relative to battery C-rating capability.');
      } else if (utilization < 25) {
        recommendations.push('Battery is conservatively loaded. Endurance should be stable for long sessions.');
      }
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
