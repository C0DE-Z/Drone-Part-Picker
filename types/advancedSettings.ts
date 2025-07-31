export interface AdvancedSettings {
  // Environmental Factors
  environment: {
    altitude: number; // meters above sea level
    temperature: number; // Celsius
    humidity: number; // percentage (0-100)
    windSpeed: number; // km/h
    airDensity: number; // kg/m³ (default 1.225 at sea level)
  };

  // Battery Settings
  battery: {
    usableCapacityFactor: number; // Base usable capacity (0-1, default 0.85)
    temperatureEfficiency: {
      freezing: number; // < 0°C (default 0.70)
      cold: number; // < 10°C (default 0.85)
      cool: number; // < 20°C (default 0.95)
      optimal: number; // 20-25°C (default 1.0)
      warm: number; // < 35°C (default 0.98)
      hot: number; // < 45°C (default 0.92)
      extreme: number; // > 45°C (default 0.85)
    };
    ageFactor: number; // Battery age/condition factor (default 0.92)
    voltageNominal: number; // Nominal voltage per cell (default 3.7V)
  };

  // Motor Settings
  motor: {
    baseEfficiency: number; // Base motor efficiency (default 0.85)
    efficiencyByStatorSize: {
      verySmall: number; // < 20mm (default 0.78)
      small: number; // 20-22mm (default 0.82)
      standard: number; // 22-25mm (default 0.85)
      mediumLarge: number; // 25-28mm (default 0.88)
      large: number; // > 28mm (default 0.90)
    };
    kvOptimizationCurve: {
      baseKV: number; // Base optimal KV (default 1400)
      voltageMultiplier: number; // KV adjustment per volt (default 180)
    };
  };

  // Propeller Settings
  propeller: {
    baseEfficiency: number; // Base propeller efficiency (default 0.80)
    optimalAdvanceRatio: {
      min: number; // Optimal range min (default 0.6)
      max: number; // Optimal range max (default 0.9)
    };
    figureOfMerit: number; // Hover efficiency (default 0.75)
    materialFactors: {
      carbon: number; // Carbon fiber multiplier (default 1.05)
      glassFilled: number; // Glass-filled multiplier (default 1.02)
      plastic: number; // Basic plastic multiplier (default 0.98)
    };
  };

  // System Efficiency
  system: {
    escEfficiency: {
      highEnd: number; // > 60A ESCs (default 0.96)
      standard: number; // 40-60A ESCs (default 0.95)
      budget: number; // 25-40A ESCs (default 0.93)
      lowEnd: number; // < 25A ESCs (default 0.90)
    };
    wiringEfficiency: number; // Wiring and connector losses (default 0.92)
    conditionFactor: number; // Component wear factor (default 0.95)
    toleranceFactor: number; // Manufacturing tolerance (default 0.98)
  };

  // Flight Style Factors
  flightStyle: {
    racing: {
      aggressive: number; // High KV + small frame (default 0.82)
      sport: number; // High performance (default 0.85)
    };
    freestyle: {
      balanced: number; // Freestyle builds (default 0.88)
      sport: number; // Sport/freestyle (default 0.90)
    };
    cinematic: {
      efficient: number; // Cinematic flying (default 0.95)
      longRange: number; // Long-range setup (default 1.02)
      ultraLongRange: number; // Ultra efficient (default 1.05)
    };
  };

  // Power Consumption Factors
  power: {
    flightMixing: {
      hoverRatio: number; // Time spent hovering (default 0.30)
      cruiseRatio: number; // Time spent cruising (default 0.45)
      sportRatio: number; // Time spent in sport mode (default 0.20)
      aggressiveRatio: number; // Time spent aggressive (default 0.05)
    };
    thrustFactors: {
      hover: number; // Hover thrust factor (default 1.0)
      cruise: number; // Cruise thrust factor (default 1.4)
      sport: number; // Sport thrust factor (default 1.8)
      aggressive: number; // Aggressive thrust factor (default 2.2)
    };
  };

  // Realistic Limits
  limits: {
    flightTime: {
      capacityMultipliers: {
        veryLarge: number; // > 2500mAh (default 55min)
        large: number; // > 2200mAh (default 50min)
        mediumLarge: number; // > 1800mAh (default 45min)
        medium: number; // > 1500mAh (default 40min)
        standard: number; // > 1300mAh (default 38min)
        small: number; // > 1100mAh (default 32min)
        verySmall: number; // < 650mAh (default 20min)
      };
      buildTypeMultipliers: {
        racing: number; // Racing builds (default 0.75)
        freestyle: number; // Freestyle builds (default 0.88)
        sport: number; // Sport builds (default 0.92)
        longRange: number; // Long-range builds (default 1.08)
      };
    };
    topSpeed: {
      frameClassLimits: {
        tinyWhoop: number; // < 100mm (default 120 km/h)
        threeInch: number; // < 150mm (default 150 km/h)
        fourInch: number; // < 180mm (default 180 km/h)
        fiveInch: number; // < 220mm (default 200 km/h)
        sixSeven: number; // < 280mm (default 170 km/h)
        large: number; // > 280mm (default 140 km/h)
      };
    };
  };
}

export const defaultAdvancedSettings: AdvancedSettings = {
  environment: {
    altitude: 0,
    temperature: 20,
    humidity: 60,
    windSpeed: 5,
    airDensity: 1.225,
  },
  battery: {
    usableCapacityFactor: 0.85,
    temperatureEfficiency: {
      freezing: 0.70,
      cold: 0.85,
      cool: 0.95,
      optimal: 1.0,
      warm: 0.98,
      hot: 0.92,
      extreme: 0.85,
    },
    ageFactor: 0.92,
    voltageNominal: 3.7,
  },
  motor: {
    baseEfficiency: 0.85,
    efficiencyByStatorSize: {
      verySmall: 0.78,
      small: 0.82,
      standard: 0.85,
      mediumLarge: 0.88,
      large: 0.90,
    },
    kvOptimizationCurve: {
      baseKV: 1400,
      voltageMultiplier: 180,
    },
  },
  propeller: {
    baseEfficiency: 0.80,
    optimalAdvanceRatio: {
      min: 0.6,
      max: 0.9,
    },
    figureOfMerit: 0.75,
    materialFactors: {
      carbon: 1.05,
      glassFilled: 1.02,
      plastic: 0.98,
    },
  },
  system: {
    escEfficiency: {
      highEnd: 0.96,
      standard: 0.95,
      budget: 0.93,
      lowEnd: 0.90,
    },
    wiringEfficiency: 0.92,
    conditionFactor: 0.95,
    toleranceFactor: 0.98,
  },
  flightStyle: {
    racing: {
      aggressive: 0.82,
      sport: 0.85,
    },
    freestyle: {
      balanced: 0.88,
      sport: 0.90,
    },
    cinematic: {
      efficient: 0.95,
      longRange: 1.02,
      ultraLongRange: 1.05,
    },
  },
  power: {
    flightMixing: {
      hoverRatio: 0.30,
      cruiseRatio: 0.45,
      sportRatio: 0.20,
      aggressiveRatio: 0.05,
    },
    thrustFactors: {
      hover: 1.0,
      cruise: 1.4,
      sport: 1.8,
      aggressive: 2.2,
    },
  },
  limits: {
    flightTime: {
      capacityMultipliers: {
        veryLarge: 55,
        large: 50,
        mediumLarge: 45,
        medium: 40,
        standard: 38,
        small: 32,
        verySmall: 20,
      },
      buildTypeMultipliers: {
        racing: 0.75,
        freestyle: 0.88,
        sport: 0.92,
        longRange: 1.08,
      },
    },
    topSpeed: {
      frameClassLimits: {
        tinyWhoop: 120,
        threeInch: 150,
        fourInch: 180,
        fiveInch: 200,
        sixSeven: 170,
        large: 140,
      },
    },
  },
};
