import { ComponentClassificationService } from './ComponentClassificationService';

interface ClassificationKeyword {
  word: string;
  category: string;
  confidence: number;
  context?: string[];
}

interface ClassificationPattern {
  pattern: RegExp;
  category: string;
  confidence: number;
  description: string;
}

export interface ProductFeatures {
  hasKv: boolean;
  hasStatorSize: boolean;
  hasVoltageRating: boolean;
  hasCapacity: boolean;
  hasConnector: boolean;
  hasResolution: boolean;
  hasFrameSize: boolean;
  hasPropSize: boolean;
  keywords: string[];
  numericalFeatures: {
    kv?: number;
    statorSize?: string;
    capacity?: number;
    cellCount?: number;
    propDiameter?: number;
  };
}

export class AIClassificationService {
  private static instance: AIClassificationService;
  
  // Training data - keywords with weighted confidence scores
  private static keywords: ClassificationKeyword[] = [
    // Motor keywords
    { word: 'motor', category: 'motor', confidence: 0.8 },
    { word: 'kv', category: 'motor', confidence: 0.95 },
    { word: 'brushless', category: 'motor', confidence: 0.9 },
    { word: 'stator', category: 'motor', confidence: 0.85 },
    { word: 'rotor', category: 'motor', confidence: 0.8 },
    { word: 'rpm', category: 'motor', confidence: 0.7 },
    { word: 'thrust', category: 'motor', confidence: 0.75 },
    { word: 'bearings', category: 'motor', confidence: 0.6 },
    
    // ESC/Stack keywords
    { word: 'esc', category: 'stack', confidence: 0.9 },
    { word: 'speed controller', category: 'stack', confidence: 0.95 },
    { word: 'flight controller', category: 'stack', confidence: 0.9 },
    { word: 'fc', category: 'stack', confidence: 0.8, context: ['flight', 'controller'] },
    { word: 'aio', category: 'stack', confidence: 0.85 },
    { word: 'all in one', category: 'stack', confidence: 0.85 },
    { word: 'f4', category: 'stack', confidence: 0.7 },
    { word: 'f7', category: 'stack', confidence: 0.7 },
    { word: 'gyro', category: 'stack', confidence: 0.7 },
    { word: 'dshot', category: 'stack', confidence: 0.8 },
    { word: 'betaflight', category: 'stack', confidence: 0.7 },
    { word: 'current sensor', category: 'stack', confidence: 0.75 },
    
    // Frame keywords
    { word: 'frame', category: 'frame', confidence: 0.9 },
    { word: 'chassis', category: 'frame', confidence: 0.8 },
    { word: 'arms', category: 'frame', confidence: 0.6 },
    { word: 'carbon fiber', category: 'frame', confidence: 0.7 },
    { word: 'wheelbase', category: 'frame', confidence: 0.8 },
    { word: 'freestyle frame', category: 'frame', confidence: 0.95 },
    { word: 'racing frame', category: 'frame', confidence: 0.95 },
    
    // Battery keywords
    { word: 'battery', category: 'battery', confidence: 0.9 },
    { word: 'lipo', category: 'battery', confidence: 0.95 },
    { word: 'mah', category: 'battery', confidence: 0.9 },
    { word: 'cells', category: 'battery', confidence: 0.7 },
    { word: 'discharge', category: 'battery', confidence: 0.6 },
    { word: 'charging', category: 'battery', confidence: 0.5 },
    { word: 'xt60', category: 'battery', confidence: 0.8 },
    { word: 'xt30', category: 'battery', confidence: 0.8 },
    
    // Camera keywords
    { word: 'camera', category: 'camera', confidence: 0.9 },
    { word: 'fpv camera', category: 'camera', confidence: 0.95 },
    { word: 'lens', category: 'camera', confidence: 0.7 },
    { word: 'cmos', category: 'camera', confidence: 0.8 },
    { word: 'resolution', category: 'camera', confidence: 0.6 },
    { word: 'fov', category: 'camera', confidence: 0.7 },
    
    // Propeller keywords
    { word: 'propeller', category: 'prop', confidence: 0.9 },
    { word: 'prop', category: 'prop', confidence: 0.8 },
    { word: 'blade', category: 'prop', confidence: 0.7 },
    { word: 'pitch', category: 'prop', confidence: 0.6 },
    { word: 'inch', category: 'prop', confidence: 0.5 }
  ];

  // Advanced pattern matching
  private static patterns: ClassificationPattern[] = [
    // Motor patterns
    { pattern: /\d+kv/i, category: 'motor', confidence: 0.95, description: 'KV rating' },
    { pattern: /\d{4}.*motor/i, category: 'motor', confidence: 0.85, description: 'Motor with stator size' },
    { pattern: /brushless.*motor/i, category: 'motor', confidence: 0.9, description: 'Brushless motor' },
    { pattern: /motor.*\d+kv/i, category: 'motor', confidence: 0.95, description: 'Motor with KV' },
    
    // ESC/Stack patterns
    { pattern: /\d+a.*esc/i, category: 'stack', confidence: 0.9, description: 'ESC with amperage' },
    { pattern: /esc.*\d+a/i, category: 'stack', confidence: 0.9, description: 'ESC with amperage' },
    { pattern: /flight.*controller/i, category: 'stack', confidence: 0.9, description: 'Flight controller' },
    { pattern: /f[47].*flight/i, category: 'stack', confidence: 0.85, description: 'F4/F7 flight controller' },
    { pattern: /\d+bit.*dshot/i, category: 'stack', confidence: 0.85, description: 'DShot ESC' },
    { pattern: /all.*in.*one/i, category: 'stack', confidence: 0.8, description: 'AIO stack' },
    
    // Frame patterns
    { pattern: /\d+mm.*frame/i, category: 'frame', confidence: 0.85, description: 'Frame with size' },
    { pattern: /frame.*\d+mm/i, category: 'frame', confidence: 0.85, description: 'Frame with size' },
    { pattern: /carbon.*frame/i, category: 'frame', confidence: 0.8, description: 'Carbon frame' },
    { pattern: /freestyle.*frame/i, category: 'frame', confidence: 0.9, description: 'Freestyle frame' },
    { pattern: /racing.*frame/i, category: 'frame', confidence: 0.9, description: 'Racing frame' },
    
    // Battery patterns
    { pattern: /\d+mah/i, category: 'battery', confidence: 0.9, description: 'Battery capacity' },
    { pattern: /\d+s.*lipo/i, category: 'battery', confidence: 0.95, description: 'LiPo battery' },
    { pattern: /lipo.*\d+s/i, category: 'battery', confidence: 0.95, description: 'LiPo battery' },
    { pattern: /\d+c.*battery/i, category: 'battery', confidence: 0.8, description: 'Battery C rating' },
    
    // Camera patterns
    { pattern: /fpv.*camera/i, category: 'camera', confidence: 0.9, description: 'FPV camera' },
    { pattern: /camera.*\d+mm/i, category: 'camera', confidence: 0.8, description: 'Camera with lens size' },
    { pattern: /\d+mm.*camera/i, category: 'camera', confidence: 0.8, description: 'Camera with lens size' },
    
    // Propeller patterns
    { pattern: /\d+\.?\d*.*inch.*prop/i, category: 'prop', confidence: 0.9, description: 'Propeller size' },
    { pattern: /\d+x\d+.*prop/i, category: 'prop', confidence: 0.9, description: 'Propeller dimensions' },
    { pattern: /prop.*\d+\.?\d*.*inch/i, category: 'prop', confidence: 0.9, description: 'Propeller size' }
  ];

  public static getInstance(): AIClassificationService {
    if (!AIClassificationService.instance) {
      AIClassificationService.instance = new AIClassificationService();
    }
    return AIClassificationService.instance;
  }

  /**
   * Enhanced AI-powered classification using multiple methods
   */
  public classifyProduct(name: string, description: string = ''): {
    category: string;
    confidence: number;
    reasoning: string[];
    features: ProductFeatures;
  } {
    const text = `${name} ${description}`.toLowerCase();
    const reasoning: string[] = [];
    
    // Extract product features
    const features = this.extractFeatures(text);
    
    // Method 1: Pattern matching (highest confidence)
    const patternResult = this.classifyByPatterns(text);
    if (patternResult.confidence > 0.8) {
      reasoning.push(`Pattern match: ${patternResult.reasoning}`);
      return {
        category: patternResult.category,
        confidence: patternResult.confidence,
        reasoning,
        features
      };
    }

    // Method 2: Keyword scoring
    const keywordResult = this.classifyByKeywords(text);
    reasoning.push(`Keyword analysis: ${keywordResult.reasoning}`);

    // Method 3: Feature-based classification
    const featureResult = this.classifyByFeatures(features);
    reasoning.push(`Feature analysis: ${featureResult.reasoning}`);

    // Method 4: Legacy classification as fallback
    const legacyResult = ComponentClassificationService.classifyComponent(name, description);
    reasoning.push(`Legacy classification: ${legacyResult.reasons.join(', ')}`);

    // Combine results with weighted scoring
    const scores = this.combineResults([
      { result: keywordResult, weight: 0.4 },
      { result: featureResult, weight: 0.3 },
      { result: { category: legacyResult.category, confidence: legacyResult.confidence / 100 }, weight: 0.3 }
    ]);

    const finalCategory = this.getBestCategory(scores);
    const finalConfidence = scores[finalCategory] || 0;

    return {
      category: finalCategory,
      confidence: finalConfidence,
      reasoning,
      features
    };
  }

  private extractFeatures(text: string): ProductFeatures {
    const features: ProductFeatures = {
      hasKv: /\d+kv/i.test(text),
      hasStatorSize: /\d{4}/i.test(text),
      hasVoltageRating: /\d+s\s*(lipo|battery)/i.test(text),
      hasCapacity: /\d+mah/i.test(text),
      hasConnector: /(xt60|xt30|jst|ph2\.0|deans)/i.test(text),
      hasResolution: /\d+x\d+/i.test(text),
      hasFrameSize: /\d+mm.*frame/i.test(text),
      hasPropSize: /\d+\.?\d*.*inch/i.test(text),
      keywords: [],
      numericalFeatures: {}
    };

    // Extract numerical features
    const kvMatch = text.match(/(\d+)kv/i);
    if (kvMatch) features.numericalFeatures.kv = parseInt(kvMatch[1]);

    const statorMatch = text.match(/(\d{4})/);
    if (statorMatch) features.numericalFeatures.statorSize = statorMatch[1];

    const capacityMatch = text.match(/(\d+)mah/i);
    if (capacityMatch) features.numericalFeatures.capacity = parseInt(capacityMatch[1]);

    const cellMatch = text.match(/(\d+)s/i);
    if (cellMatch) features.numericalFeatures.cellCount = parseInt(cellMatch[1]);

    const propMatch = text.match(/(\d+\.?\d*).*inch/i);
    if (propMatch) features.numericalFeatures.propDiameter = parseFloat(propMatch[1]);

    // Extract keywords
    AIClassificationService.keywords.forEach(keyword => {
      if (text.includes(keyword.word)) {
        features.keywords.push(keyword.word);
      }
    });

    return features;
  }

  private classifyByPatterns(text: string): { category: string; confidence: number; reasoning: string } {
    let bestMatch = { category: 'unknown', confidence: 0, reasoning: 'No pattern match' };

    for (const pattern of AIClassificationService.patterns) {
      if (pattern.pattern.test(text)) {
        if (pattern.confidence > bestMatch.confidence) {
          bestMatch = {
            category: pattern.category,
            confidence: pattern.confidence,
            reasoning: pattern.description
          };
        }
      }
    }

    return bestMatch;
  }

  private classifyByKeywords(text: string): { category: string; confidence: number; reasoning: string } {
    const categoryScores: Record<string, number> = {};
    const matchedKeywords: string[] = [];

    AIClassificationService.keywords.forEach(keyword => {
      if (text.includes(keyword.word)) {
        // Check context if specified
        if (keyword.context) {
          const hasContext = keyword.context.some(ctx => text.includes(ctx));
          if (!hasContext) return;
        }

        if (!categoryScores[keyword.category]) {
          categoryScores[keyword.category] = 0;
        }
        categoryScores[keyword.category] += keyword.confidence;
        matchedKeywords.push(keyword.word);
      }
    });

    // Normalize scores
    Object.keys(categoryScores).forEach(category => {
      categoryScores[category] = Math.min(1, categoryScores[category] / 2);
    });

    const bestCategory = this.getBestCategory(categoryScores);
    return {
      category: bestCategory,
      confidence: categoryScores[bestCategory] || 0,
      reasoning: `Keywords: ${matchedKeywords.join(', ')}`
    };
  }

  private classifyByFeatures(features: ProductFeatures): { category: string; confidence: number; reasoning: string } {
    const scores: Record<string, number> = {};
    const reasons: string[] = [];

    // Motor features
    if (features.hasKv) {
      scores.motor = (scores.motor || 0) + 0.9;
      reasons.push('has KV rating');
    }
    if (features.hasStatorSize && !features.hasCapacity) {
      scores.motor = (scores.motor || 0) + 0.7;
      reasons.push('has stator size');
    }

    // Battery features
    if (features.hasCapacity) {
      scores.battery = (scores.battery || 0) + 0.8;
      reasons.push('has capacity rating');
    }
    if (features.hasVoltageRating) {
      scores.battery = (scores.battery || 0) + 0.7;
      reasons.push('has voltage rating');
    }
    if (features.hasConnector) {
      scores.battery = (scores.battery || 0) + 0.6;
      reasons.push('has connector type');
    }

    // Frame features
    if (features.hasFrameSize) {
      scores.frame = (scores.frame || 0) + 0.8;
      reasons.push('has frame size');
    }

    // Propeller features
    if (features.hasPropSize) {
      scores.prop = (scores.prop || 0) + 0.8;
      reasons.push('has propeller size');
    }

    // Camera features
    if (features.hasResolution) {
      scores.camera = (scores.camera || 0) + 0.6;
      reasons.push('has resolution');
    }

    const bestCategory = this.getBestCategory(scores);
    return {
      category: bestCategory,
      confidence: scores[bestCategory] || 0,
      reasoning: reasons.join(', ')
    };
  }

  private combineResults(results: Array<{ result: { category: string; confidence: number }; weight: number }>): Record<string, number> {
    const combinedScores: Record<string, number> = {};

    results.forEach(({ result, weight }) => {
      if (result.category !== 'unknown' && result.confidence > 0) {
        if (!combinedScores[result.category]) {
          combinedScores[result.category] = 0;
        }
        combinedScores[result.category] += result.confidence * weight;
      }
    });

    return combinedScores;
  }

  private getBestCategory(scores: Record<string, number>): string {
    let bestCategory = 'unknown';
    let bestScore = 0;

    Object.entries(scores).forEach(([category, score]) => {
      if (score > bestScore) {
        bestCategory = category;
        bestScore = score;
      }
    });

    return bestCategory;
  }
}