// AI-powered services for custom parts feature
interface CustomPart {
  id: string;
  name: string;
  description?: string;
  category: string;
  specifications: Record<string, unknown>;
  isPublic: boolean;
  viewCount?: number;
  modelFile?: string;
  modelFormat?: string;
  modelSize?: number;
  creator: {
    username: string;
    email: string;
  };
  stats: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

// AI Part Classification Service
export class AIPartClassificationService {
  private static readonly CLASSIFICATION_RULES = {
    motors: {
      keywords: ['motor', 'kv', 'rpm', 'watts', 'stator', 'rotor', 'bell', 'shaft'],
      specs: ['kv', 'voltage', 'current', 'power', 'weight', 'shaft_diameter'],
      patterns: /\b(\d+\s*(kv|rpm|w|watts|a|amps|v|volts))\b/gi,
    },
    frames: {
      keywords: ['frame', 'chassis', 'body', 'carbon', 'fiber', 'arms', 'wheelbase', 'thickness'],
      specs: ['wheelbase', 'weight', 'material', 'thickness', 'arm_thickness', 'size'],
      patterns: /\b(\d+\s*(mm|inch|g|grams|oz))\b/gi,
    },
    props: {
      keywords: ['prop', 'propeller', 'blade', 'pitch', 'diameter', 'carbon', 'plastic'],
      specs: ['diameter', 'pitch', 'blades', 'material', 'weight'],
      patterns: /\b(\d+x\d+|\d+\s*(inch|"|mm)\s*x\s*\d+)\b/gi,
    },
    batteries: {
      keywords: ['battery', 'lipo', 'li-po', 'mah', 'cell', 'discharge', 'voltage', 'connector'],
      specs: ['capacity', 'voltage', 'cells', 'discharge_rate', 'weight', 'connector'],
      patterns: /\b(\d+s|\d+\s*mah|\d+c|\d+\s*v)\b/gi,
    },
    stacks: {
      keywords: ['stack', 'fc', 'esc', 'pdb', 'osd', 'current', 'sensor', 'gyro', 'accelerometer'],
      specs: ['current_rating', 'voltage', 'weight', 'size', 'mounting_holes'],
      patterns: /\b(\d+\s*(a|amps|v|volts|mm))\b/gi,
    },
    cameras: {
      keywords: ['camera', 'cmos', 'ccd', 'lens', 'resolution', 'fov', 'tvl', 'latency'],
      specs: ['resolution', 'fov', 'weight', 'voltage', 'connector', 'latency'],
      patterns: /\b(\d+\s*(tvl|p|degrees|°|ms|hz))\b/gi,
    },
  };

  static async classifyPart(part: {
    name: string;
    description?: string;
    specifications: Record<string, unknown>;
  }): Promise<{
    suggestedCategory: string;
    confidence: number;
    reasoning: string[];
    detectedSpecs: Record<string, unknown>;
  }> {
    const text = `${part.name} ${part.description || ''}`.toLowerCase();
    const specs = Object.keys(part.specifications);
    
    const scores: Record<string, { score: number; reasons: string[] }> = {};
    
    // Analyze each category
    for (const [category, rules] of Object.entries(this.CLASSIFICATION_RULES)) {
      let score = 0;
      const reasons: string[] = [];
      
      // Check keywords
      const keywordMatches = rules.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      score += keywordMatches.length * 10;
      if (keywordMatches.length > 0) {
        reasons.push(`Contains ${category} keywords: ${keywordMatches.join(', ')}`);
      }
      
      // Check specification names
      const specMatches = rules.specs.filter(spec =>
        specs.some(s => s.toLowerCase().includes(spec.toLowerCase()))
      );
      score += specMatches.length * 15;
      if (specMatches.length > 0) {
        reasons.push(`Has relevant specifications: ${specMatches.join(', ')}`);
      }
      
      // Check patterns
      const patternMatches = text.match(rules.patterns) || [];
      score += patternMatches.length * 5;
      if (patternMatches.length > 0) {
        reasons.push(`Matches patterns: ${patternMatches.slice(0, 3).join(', ')}`);
      }
      
      scores[category] = { score, reasons };
    }
    
    // Find best match
    const bestMatch = Object.entries(scores).reduce((best, [category, data]) => {
      return data.score > best.score ? { category, score: data.score, reasons: data.reasons } : best;
    }, { category: 'other', score: 0, reasons: [] as string[] });
    
    // Calculate confidence (0-1)
    const totalPossibleScore = 100;
    const confidence = Math.min(bestMatch.score / totalPossibleScore, 1);
    
    // Extract detected specifications
    const detectedSpecs = this.extractSpecifications(text);
    
    return {
      suggestedCategory: bestMatch.category,
      confidence,
      reasoning: bestMatch.reasons,
      detectedSpecs,
    };
  }

  private static extractSpecifications(text: string): Record<string, unknown> {
    const specs: Record<string, unknown> = {};
    
    // Common patterns for different types of specs
    const patterns = {
      weight: /(\d+(?:\.\d+)?)\s*(g|grams|oz|ounces)/gi,
      voltage: /(\d+(?:\.\d+)?)\s*(v|volts?)/gi,
      current: /(\d+(?:\.\d+)?)\s*(a|amps?|ma|milliamps?)/gi,
      size: /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|inch|")/gi,
      kv: /(\d+)\s*kv/gi,
      capacity: /(\d+)\s*mah/gi,
      cells: /(\d+)s/gi,
      discharge: /(\d+)c/gi,
    };
    
    for (const [specName, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        specs[specName] = matches[0];
      }
    }
    
    return specs;
  }
}

// AI Compatibility Checker
export class AICompatibilityChecker {
  private static readonly COMPATIBILITY_RULES = {
    motor_prop: {
      check: (motor: CustomPart, prop: CustomPart) => {
        const motorKV = parseFloat(String(this.getSpecValue(motor, 'kv') || '0'));
        const propDiameter = parseFloat(String(this.getSpecValue(prop, 'diameter') || '0'));
        const propPitch = parseFloat(String(this.getSpecValue(prop, 'pitch') || '0'));
        const motorPower = parseFloat(String(this.getSpecValue(motor, 'power') || '0'));
        
        if (!motorKV || !propDiameter) return { compatible: null, reason: 'Insufficient motor/prop data' };
        
        // Advanced motor-prop matching using multiple factors
        let compatibilityScore = 1.0;
        const reasons: string[] = [];
        const warnings: string[] = [];
        
        // 1. KV to prop diameter matching (primary factor)
        const theoreticalOptimalDiameter = Math.sqrt(1000000 / (motorKV * motorKV * 0.1)); // Simplified formula
        const diameterRatio = propDiameter / theoreticalOptimalDiameter;
        
        if (diameterRatio >= 0.7 && diameterRatio <= 1.3) {
          reasons.push('Excellent KV-to-diameter ratio');
        } else if (diameterRatio >= 0.5 && diameterRatio <= 1.7) {
          compatibilityScore *= 0.8;
          warnings.push('Suboptimal KV-to-diameter ratio');
        } else {
          compatibilityScore *= 0.4;
          reasons.push('Poor KV-to-diameter matching - efficiency issues likely');
        }
        
        // 2. Pitch analysis (if available)
        if (propPitch > 0) {
          const pitchToDiameterRatio = propPitch / propDiameter;
          if (pitchToDiameterRatio >= 0.6 && pitchToDiameterRatio <= 1.2) {
            reasons.push('Good pitch-to-diameter ratio');
          } else if (pitchToDiameterRatio < 0.6) {
            warnings.push('Low pitch may limit top speed');
            compatibilityScore *= 0.9;
          } else {
            warnings.push('High pitch may cause motor strain');
            compatibilityScore *= 0.85;
          }
        }
        
        // 3. Power loading analysis
        if (motorPower > 0) {
          const diskLoading = motorPower / (Math.PI * Math.pow(propDiameter * 0.0254 / 2, 2)); // W/m²
          if (diskLoading > 2000) {
            warnings.push('High disk loading - may cause turbulence');
            compatibilityScore *= 0.9;
          } else if (diskLoading < 500) {
            warnings.push('Low disk loading - may be underpowered');
            compatibilityScore *= 0.95;
          }
        }
        
        // 4. KV-specific recommendations
        if (motorKV > 3000 && propDiameter > 6) {
          compatibilityScore *= 0.6;
          reasons.push('High KV motor with large prop - high current draw and heat');
        } else if (motorKV < 1800 && propDiameter < 4) {
          compatibilityScore *= 0.7;
          reasons.push('Low KV motor with small prop - may lack responsiveness');
        }
        
        const finalReason = reasons.length > 0 ? reasons.join(', ') : 'Standard compatibility';
        const warningText = warnings.length > 0 ? warnings.join(', ') : undefined;
        
        if (compatibilityScore >= 0.8) {
          return { compatible: true, reason: finalReason, warning: warningText };
        } else if (compatibilityScore >= 0.6) {
          return { compatible: true, reason: finalReason, warning: warningText || 'May not be optimal' };
        } else {
          return { compatible: false, reason: finalReason };
        }
      }
    },
    
    battery_esc: {
      check: (battery: CustomPart, esc: CustomPart) => {
        const batteryCells = this.getSpecValue(battery, 'cells');
        const batteryVoltage = this.getSpecValue(battery, 'voltage');
        const escVoltage = this.getSpecValue(esc, 'voltage') || this.getSpecValue(esc, 'max_voltage');
        
        const actualVoltage = batteryCells ? parseInt(String(batteryCells)) * 3.7 : parseFloat(String(batteryVoltage));
        const maxEscVoltage = parseFloat(String(escVoltage));
        
        if (!actualVoltage || !maxEscVoltage) {
          return { compatible: null, reason: 'Insufficient voltage data' };
        }
        
        if (actualVoltage <= maxEscVoltage) {
          return { compatible: true, reason: 'Voltage compatibility confirmed' };
        } else {
          return { compatible: false, reason: 'Battery voltage exceeds ESC rating - damage may occur' };
        }
      }
    },
    
    frame_motor: {
      check: (frame: CustomPart) => {
        const frameSize = this.getSpecValue(frame, 'size') || this.getSpecValue(frame, 'wheelbase');
        
        if (!frameSize) return { compatible: null, reason: 'Frame size not specified' };
        
        const frameSizeNum = parseFloat(String(frameSize));
        
        // Rough compatibility based on frame size
        if (frameSizeNum >= 250) {
          return { compatible: true, reason: 'Large frame compatible with most motors' };
        } else if (frameSizeNum >= 180) {
          return { compatible: true, reason: 'Medium frame - suitable for mid-range motors' };
        } else if (frameSizeNum >= 100) {
          return { compatible: true, reason: 'Small frame - use smaller motors for best performance', warning: 'Verify motor mounting' };
        } else {
          return { compatible: true, reason: 'Micro frame - ensure motor is micro-sized', warning: 'Check motor dimensions carefully' };
        }
      }
    }
  };

  static async checkCompatibility(part1: CustomPart, part2: CustomPart): Promise<{
    compatible: boolean | null;
    confidence: number;
    reason: string;
    warning?: string;
    suggestions?: string[];
  }> {
    const categories = [part1.category.toLowerCase(), part2.category.toLowerCase()].sort();
    const ruleKey = categories.join('_');
    
    // Try different rule combinations
    const possibleKeys = [
      ruleKey,
      categories.reverse().join('_'),
      `${categories[0]}_${categories[1]}`,
    ];
    
    for (const key of possibleKeys) {
      const rule = this.COMPATIBILITY_RULES[key as keyof typeof this.COMPATIBILITY_RULES];
      if (rule) {
        const result = rule.check(part1, part2);
        return {
          ...result,
          confidence: result.compatible !== null ? 0.8 : 0.2,
          suggestions: this.generateSuggestions(part1, part2, result),
        };
      }
    }
    
    return {
      compatible: null,
      confidence: 0.1,
      reason: 'No compatibility rules available for these part types',
      suggestions: ['Verify compatibility manually', 'Check manufacturer specifications'],
    };
  }

  private static getSpecValue(part: CustomPart, specName: string): unknown {
    const specs = part.specifications;
    const keys = Object.keys(specs);
    
    // Try exact match first
    if (specs[specName]) return specs[specName];
    
    // Try case-insensitive match
    const key = keys.find(k => k.toLowerCase() === specName.toLowerCase());
    if (key) return specs[key];
    
    // Try partial match
    const partialKey = keys.find(k => k.toLowerCase().includes(specName.toLowerCase()));
    if (partialKey) return specs[partialKey];
    
    return null;
  }

  private static generateSuggestions(part1: CustomPart, part2: CustomPart, result: { compatible: boolean | null; warning?: string }): string[] {
    const suggestions: string[] = [];
    
    if (result.compatible === false) {
      suggestions.push('Consider alternative parts with better compatibility');
      suggestions.push('Consult manufacturer specifications');
      
      if (part1.category.toLowerCase() === 'motor' || part2.category.toLowerCase() === 'motor') {
        suggestions.push('Check motor KV rating and power requirements');
      }
      
      if (part1.category.toLowerCase() === 'battery' || part2.category.toLowerCase() === 'battery') {
        suggestions.push('Verify voltage and current ratings');
      }
    } else if (result.warning) {
      suggestions.push('Test compatibility carefully before full implementation');
      suggestions.push('Monitor performance and temperatures during operation');
    }
    
    return suggestions;
  }
}

// AI Performance Predictor
export class AIPerformancePredictor {
  static async predictPerformance(parts: CustomPart[]): Promise<{
    estimatedPerformance: {
      thrust: number; // in grams
      flightTime: number; // in minutes
      topSpeed: number; // in km/h
      powerConsumption: number; // in watts
      thrustToWeight: number; // ratio
      totalWeight: number; // in grams
      maxTheoreticalSpeed: number; // in km/h
      powerToWeight: number; // watts per kg
    };
    confidence: number;
    limitations: string[];
    recommendations: string[];
  }> {
    const motors = parts.filter(p => p.category.toLowerCase() === 'motors');
    const props = parts.filter(p => p.category.toLowerCase() === 'props');
    const batteries = parts.filter(p => p.category.toLowerCase() === 'batteries');
    const frame = parts.find(p => p.category.toLowerCase() === 'frames');
    
    // Basic performance estimation
    let totalThrust = 0;
    let totalPowerConsumption = 0;
    let estimatedWeight = 0;
    const limitations: string[] = [];
    const recommendations: string[] = [];
    
    // Advanced motor performance calculation
    motors.forEach((motor, index) => {
      const motorPower = parseFloat(String(this.getSpecValue(motor, 'power') || '0'));
      const motorKV = parseFloat(String(this.getSpecValue(motor, 'kv') || '2300'));
      const motorWeight = parseFloat(String(this.getSpecValue(motor, 'weight') || '30'));
      const motorEfficiency = parseFloat(String(this.getSpecValue(motor, 'efficiency') || '0.85'));
      
      // Get voltage from battery
      const batteryVoltage = batteries.length > 0 ? 
        parseFloat(String(this.getSpecValue(batteries[0], 'voltage') || '14.8')) : 14.8;
      
      // Calculate actual power consumption
      let actualPower = motorPower;
      if (motorPower === 0 && motorKV > 0) {
        // Estimate power from KV and size
        const estimatedCurrent = Math.min(motorKV * 0.08, 25); // Conservative current estimate
        actualPower = batteryVoltage * estimatedCurrent * motorEfficiency;
      }
      
      // Get matching propeller
      const prop = props[index] || props[0];
      let thrustPerMotor = actualPower * 4.5; // Base thrust coefficient
      
      if (prop) {
        const propDiameter = parseFloat(String(this.getSpecValue(prop, 'diameter') || '5'));
        const propPitch = parseFloat(String(this.getSpecValue(prop, 'pitch') || '4.3'));
        
        // Propeller physics - momentum theory approximation
        const rpm = motorKV * batteryVoltage * 0.8; // Account for load
        const tipSpeed = (rpm / 60) * (propDiameter * 0.0254) * Math.PI;
        
        // Thrust calculation using simplified momentum theory
        if (tipSpeed < 200) { // Below sonic speeds
          const thrustCoeff = 0.1 + (propPitch / propDiameter) * 0.05;
          thrustPerMotor = thrustCoeff * 1.225 * Math.pow(rpm / 60, 2) * Math.pow(propDiameter * 0.0254, 4) * 101.97; // N to grams
        }
      }
      
      totalThrust += thrustPerMotor;
      totalPowerConsumption += actualPower;
      estimatedWeight += motorWeight;
    });
    
    // Account for props
    props.forEach(prop => {
      const propDiameter = parseFloat(String(this.getSpecValue(prop, 'diameter') || '5'));
      const propWeight = parseFloat(String(this.getSpecValue(prop, 'weight') || '2'));
      
      // Props affect efficiency
      const efficiencyFactor = Math.min(propDiameter / 5, 1.2);
      totalThrust *= efficiencyFactor;
      estimatedWeight += propWeight;
    });
    
    // Advanced battery calculation with discharge curves
    let flightTime = 0;
    let totalBatteryCapacity = 0;
    let avgBatteryVoltage = 0;
    
    batteries.forEach(battery => {
      const capacity = parseFloat(String(this.getSpecValue(battery, 'capacity') || '0'));
      const batteryWeight = parseFloat(String(this.getSpecValue(battery, 'weight') || '0'));
      const voltage = parseFloat(String(this.getSpecValue(battery, 'voltage') || '14.8'));
      const cells = parseFloat(String(this.getSpecValue(battery, 'cells') || '4'));
      
      // Estimate weight if not provided
      const actualWeight = batteryWeight || (capacity * cells * 0.15);
      
      totalBatteryCapacity += capacity;
      avgBatteryVoltage += voltage;
      estimatedWeight += actualWeight;
    });
    
    if (batteries.length > 0) {
      avgBatteryVoltage /= batteries.length;
      
      // Advanced flight time calculation with efficiency factors
      if (totalBatteryCapacity > 0 && totalPowerConsumption > 0) {
        const currentDraw = totalPowerConsumption / avgBatteryVoltage;
        const cRate = currentDraw / (totalBatteryCapacity / 1000);
        
        // Peukert's law for battery discharge
        const peukertExponent = 1.3;
        const peukertCorrection = Math.pow(1 / cRate, peukertExponent - 1);
        const effectiveCapacity = totalBatteryCapacity * peukertCorrection * 0.8; // 80% usable
        
        // System efficiency
        const escEfficiency = 0.95;
        const motorEfficiency = 0.85;
        const systemEfficiency = escEfficiency * motorEfficiency;
        
        flightTime = (effectiveCapacity * avgBatteryVoltage / 1000) / (totalPowerConsumption / systemEfficiency / 1000) * 60;
        
        // Apply environmental factors
        flightTime *= 0.9; // 10% reduction for real-world conditions
      }
    }
    
    // Account for frame
    if (frame) {
      const frameWeight = parseFloat(String(this.getSpecValue(frame, 'weight') || '50'));
      estimatedWeight += frameWeight;
    }
    
    // Estimate additional component weight
    estimatedWeight += 100; // ESCs, FC, camera, etc.
    
    // Calculate thrust-to-weight ratio
    const thrustToWeight = totalThrust / estimatedWeight;
    
    // Advanced speed calculation using aerodynamics
    const dragCoefficient = 0.4; // Typical for multirotor
    const frontalArea = 0.05; // m² - estimated frontal area
    const airDensity = 1.225; // kg/m³ at sea level
    const propEfficiency = 0.75;
    
    // Maximum theoretical speed (drag = thrust)
    const maxThrustN = (totalThrust / 1000) * 9.81; // Convert to Newtons
    const maxSpeed = Math.sqrt((2 * maxThrustN * propEfficiency) / (dragCoefficient * frontalArea * airDensity)) * 3.6; // Convert to km/h
    
    // Practical top speed (accounting for power limitations)
    const practicalSpeed = Math.min(maxSpeed, Math.sqrt(thrustToWeight - 1) * 60); // Ensure some thrust for control
    
    // Advanced analysis and recommendations
    const powerToWeightRatio = totalPowerConsumption / (estimatedWeight / 1000);
    
    // Performance category analysis
    if (thrustToWeight < 1.2) {
      limitations.push('Very low TWR - may not achieve stable flight');
      recommendations.push('Increase motor power or reduce weight significantly');
    } else if (thrustToWeight < 1.8) {
      limitations.push('Low TWR limits agility and wind resistance');
      recommendations.push('Consider 15-25% more powerful motors for better performance');
    } else if (thrustToWeight > 5) {
      limitations.push('Extremely high TWR may cause control difficulties');
      recommendations.push('Consider throttle limiting or prop guards for safety');
    } else if (thrustToWeight > 3.5) {
      limitations.push('Very high power setup - monitor temperatures');
      recommendations.push('Ensure adequate cooling and quality ESCs');
    }
    
    // Flight time analysis
    if (flightTime < 2) {
      limitations.push('Very short flight time limits usability');
      recommendations.push('Increase battery capacity by 50-100% or reduce power consumption');
    } else if (flightTime < 5) {
      limitations.push('Short flight time for most applications');
      recommendations.push('Consider larger battery or more efficient propellers');
    } else if (flightTime > 25) {
      limitations.push('Very optimistic flight time - real performance likely 60-70% of estimate');
      recommendations.push('Account for wind, aggressive flying, and battery aging');
    }
    
    // Power analysis
    if (powerToWeightRatio > 800) {
      limitations.push('Very high power density - excellent for racing but may cause overheating');
      recommendations.push('Consider active cooling and high-quality components');
    } else if (powerToWeightRatio < 200) {
      limitations.push('Low power density limits performance capabilities');
      recommendations.push('Increase motor power or reduce total weight');
    }
    
    // Speed analysis
    if (practicalSpeed > 100) {
      limitations.push('High speed capability requires experienced pilot');
      recommendations.push('Ensure proper safety equipment and flight space');
    } else if (practicalSpeed < 30) {
      limitations.push('Limited speed capability');
      recommendations.push('Consider higher KV motors or larger propellers');
    }
    
    // Component balance analysis
    const motorPowerPercent = (totalPowerConsumption / (totalPowerConsumption + estimatedWeight)) * 100;
    if (motorPowerPercent < 60) {
      recommendations.push('Build is motor-limited - consider upgrading motors for better performance');
    } else if (motorPowerPercent > 85) {
      recommendations.push('Build is weight-limited - consider lighter components or larger battery');
    }
    
    // Confidence based on available data
    const dataCompleteness = (motors.length + props.length + batteries.length + (frame ? 1 : 0)) / 4;
    const confidence = Math.min(dataCompleteness * 0.8, 0.9);
    
    return {
      estimatedPerformance: {
        thrust: Math.round(totalThrust),
        flightTime: Math.round(flightTime * 10) / 10,
        topSpeed: Math.round(practicalSpeed),
        powerConsumption: Math.round(totalPowerConsumption),
        thrustToWeight: Math.round(thrustToWeight * 100) / 100,
        totalWeight: Math.round(estimatedWeight),
        maxTheoreticalSpeed: Math.round(maxSpeed),
        powerToWeight: Math.round((totalPowerConsumption / (estimatedWeight / 1000)) * 10) / 10,
      },
      confidence,
      limitations,
      recommendations,
    };
  }

  private static getSpecValue(part: CustomPart, specName: string): unknown {
    const specs = part.specifications;
    const keys = Object.keys(specs);
    
    // Try exact match first
    if (specs[specName]) return specs[specName];
    
    // Try case-insensitive match
    const key = keys.find(k => k.toLowerCase() === specName.toLowerCase());
    if (key) return specs[key];
    
    // Try partial match
    const partialKey = keys.find(k => k.toLowerCase().includes(specName.toLowerCase()));
    if (partialKey) return specs[partialKey];
    
    return null;
  }
}

// AI Smart Recommendations
export class AISmartRecommendations {
  static async getRecommendations(userParts: CustomPart[], allParts: CustomPart[]): Promise<{
    recommendations: Array<{
      part: CustomPart;
      reason: string;
      compatibility: number;
      category: 'missing' | 'upgrade' | 'alternative' | 'complement';
    }>;
    buildSuggestions: string[];
  }> {
    const recommendations: Array<{
      part: CustomPart;
      reason: string;
      compatibility: number;
      category: 'missing' | 'upgrade' | 'alternative' | 'complement';
    }> = [];
    
    const buildSuggestions: string[] = [];
    
    // Identify missing essential components
    const essentialCategories = ['motors', 'frames', 'props', 'batteries'];
    const userCategories = new Set(userParts.map(p => p.category.toLowerCase()));
    
    for (const category of essentialCategories) {
      if (!userCategories.has(category)) {
        const categoryParts = allParts.filter(p => p.category.toLowerCase() === category);
        const popularParts = categoryParts
          .sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
          .slice(0, 3);
        
        popularParts.forEach(part => {
          recommendations.push({
            part,
            reason: `Missing essential component: ${category}`,
            compatibility: 0.9,
            category: 'missing',
          });
        });
      }
    }
    
    // Find complementary parts
    userParts.forEach(userPart => {
      const complementaryParts = this.findComplementaryParts(userPart, allParts);
      complementaryParts.forEach(({ part, reason, compatibility }) => {
        if (!userParts.some(up => up.id === part.id)) {
          recommendations.push({
            part,
            reason,
            compatibility,
            category: 'complement',
          });
        }
      });
    });
    
    // Generate build suggestions
    const frameCount = userParts.filter(p => p.category.toLowerCase() === 'frames').length;
    const motorCount = userParts.filter(p => p.category.toLowerCase() === 'motors').length;
    
    if (frameCount > 0 && motorCount === 0) {
      buildSuggestions.push('Add motors that match your frame size for optimal performance');
    }
    
    if (motorCount > 0 && userParts.filter(p => p.category.toLowerCase() === 'props').length === 0) {
      buildSuggestions.push('Select propellers that complement your motor KV rating');
    }
    
    if (userParts.length > 3) {
      buildSuggestions.push('Consider performance optimization - check thrust-to-weight ratio');
    }
    
    // Remove duplicates and sort by compatibility
    const uniqueRecommendations = recommendations
      .filter((rec, index, arr) => arr.findIndex(r => r.part.id === rec.part.id) === index)
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 10); // Limit to top 10
    
    return {
      recommendations: uniqueRecommendations,
      buildSuggestions,
    };
  }

  private static findComplementaryParts(userPart: CustomPart, allParts: CustomPart[]): Array<{
    part: CustomPart;
    reason: string;
    compatibility: number;
  }> {
    const complementary: Array<{
      part: CustomPart;
      reason: string;
      compatibility: number;
    }> = [];
    
    const category = userPart.category.toLowerCase();
    
    // Define complementary relationships
    const relationships = {
      motors: ['props', 'stacks'],
      frames: ['motors', 'cameras', 'batteries'],
      props: ['motors'],
      batteries: ['stacks', 'frames'],
      stacks: ['motors', 'batteries'],
      cameras: ['frames'],
    };
    
    const complementaryCategories = relationships[category as keyof typeof relationships] || [];
    
    complementaryCategories.forEach(compCategory => {
      const candidates = allParts
        .filter(p => p.category.toLowerCase() === compCategory)
        .sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
        .slice(0, 5);
      
      candidates.forEach(candidate => {
        const compatibility = this.calculateCompatibility(userPart, candidate);
        if (compatibility > 0.6) {
          complementary.push({
            part: candidate,
            reason: `Complements your ${userPart.category.toLowerCase()} choice`,
            compatibility,
          });
        }
      });
    });
    
    return complementary.sort((a, b) => b.compatibility - a.compatibility);
  }

  private static calculateCompatibility(part1: CustomPart, part2: CustomPart): number {
    // Simple compatibility scoring based on specifications overlap
    const specs1 = Object.keys(part1.specifications);
    const specs2 = Object.keys(part2.specifications);
    
    const commonSpecs = specs1.filter(spec => specs2.includes(spec));
    const totalSpecs = new Set([...specs1, ...specs2]).size;
    
    if (totalSpecs === 0) return 0.5; // Default compatibility
    
    const specOverlap = commonSpecs.length / totalSpecs;
    
    // Boost compatibility for popular combinations
    const popularityBoost = Math.min((part1.stats?.likes || 0) + (part2.stats?.likes || 0), 100) / 100 * 0.2;
    
    return Math.min(specOverlap + popularityBoost + 0.3, 1.0);
  }
}

const AIServices = {
  AIPartClassificationService,
  AICompatibilityChecker,
  AIPerformancePredictor,
  AISmartRecommendations,
};

export default AIServices;