/**
 * Enhanced Classification Engine v2.0
 * 
 * Unified, context-aware classification system designed to achieve 99% accuracy
 * by addressing all identified weaknesses in the current system.
 * 
 * Key Improvements:
 * - Unified classification pipeline with proper prioritization
 * - Context-aware pattern matching with negative lookaheads
 * - Comprehensive brand database with aliases
 * - Semantic understanding of product hierarchies
 * - Advanced specification extraction
 * - Confidence calculation standardization
 */

export type ComponentCategory = 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'unknown';

export interface ProductSpecifications {
  // Motor specs
  kv?: number;
  statorSize?: string;
  thrust?: string;
  // Battery specs
  capacity?: number;
  cells?: number;
  voltage?: string;
  connector?: string;
  // Frame specs
  wheelbase?: string;
  size?: string;
  material?: string;
  // Prop specs
  diameter?: string;
  pitch?: string;
  blades?: number;
  // Camera specs
  resolution?: string;
  sensor?: string;
  lens?: string;
  // Stack specs
  current?: string;
  processor?: string;
  mounting?: string;
  // Generic
  [key: string]: string | number | boolean | undefined;
}

export interface ClassificationResult {
  category: ComponentCategory;
  confidence: number;
  method: string;
  reasoning: string[];
  specifications: ProductSpecifications;
  warnings: string[];
}

export interface ProductContext {
  name: string;
  description: string;
  url?: string;
  vendor?: string;
  price?: number;
  specifications?: ProductSpecifications;
}

export class EnhancedClassificationEngine {
  private static instance: EnhancedClassificationEngine;
  
  // Comprehensive brand database with aliases and variations
  private static readonly BRAND_DATABASE = {
    battery: {
      definitive: ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy', 'gaoneng'],
      aliases: {
        'gens ace': ['gensace', 'gens-ace'],
        'gnb': ['gaoneng']
      }
    },
    prop: {
      definitive: ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal prop', 'ethix', 'azure'],
      aliases: {
        'hqprop': ['hq prop', 'hq-prop'],
        'dalprop': ['dal prop', 'dal-prop']
      }
    },
    motor: {
      definitive: ['t-motor', 'tmotor', 'emax', 'brotherhobby', 'xing'],
      moderate: ['iflight motor', 'fps motor'],
      aliases: {
        't-motor': ['tmotor', 't motor'],
        'iflight': ['iflight motor']
      }
    },
    camera: {
      definitive: ['runcam', 'foxeer', 'caddx', 'hawkeye', 'walksnail', 'hdzero'],
      moderate: ['dji air unit', 'air unit'],
      aliases: {
        'dji air unit': ['air unit', 'dji o3', 'dji o4'],
        'walksnail': ['walksnail avatar']
      }
    },
    frame: {
      definitive: ['armattan', 'source one', 'realacc', 'lumenier frame'],
      moderate: ['iflight frame', 'geprc frame', 'speedybee frame'],
      aliases: {
        'speedybee': ['speedybee frame', 'speedy bee']
      }
    },
    stack: {
      definitive: ['holybro', 'matek', 'betafpv fc', 'mamba', 'speedybee fc', 'jhemcu'],
      moderate: ['iflight stack', 'geprc stack'],
      aliases: {
        'speedybee': ['speedybee fc', 'speedybee stack'],
        'matek': ['matek systems']
      }
    }
  };

  // Context-aware definitive patterns (highest priority)
  private static readonly DEFINITIVE_PATTERNS = {
    frame: [
      // Product name contains "frame kit" - this is 99.9% definitive
      { pattern: /\b(?:frame\s+kit|kit\s+frame)\b/i, confidence: 99, context: 'Product explicitly labeled as frame kit' },
      // Wheelbase measurement - only frames have this
      { pattern: /wheelbase.*?\b\d+mm\b/i, confidence: 95, context: 'Wheelbase specification is frame-specific' },
      // Frame with size but not in specs context
      { pattern: /\b\d+["']\s*frame\b/i, confidence: 90, context: 'Frame with size designation' },
      // Frame materials
      { pattern: /carbon\s+fiber\s+frame/i, confidence: 88, context: 'Carbon fiber frame material specification' }
    ],
    battery: [
      // Cell count with capacity
      { pattern: /\b\d+s\s+\d+mah\b/i, confidence: 99, context: 'Battery cell count with capacity' },
      { pattern: /\b\d+mah\s+\d+s\b/i, confidence: 99, context: 'Battery capacity with cell count' },
      // LiPo with specs
      { pattern: /lipo.*?\b\d+s\b/i, confidence: 95, context: 'LiPo battery with cell specification' },
      { pattern: /\b\d+s.*?lipo\b/i, confidence: 95, context: 'Cell count with LiPo designation' }
    ],
    motor: [
      // KV rating - highly specific to motors
      { pattern: /\b\d+kv\s+motor\b/i, confidence: 99, context: 'Motor with KV rating' },
      { pattern: /motor.*?\b\d+kv\b/i, confidence: 99, context: 'Motor product with KV specification' },
      // Brushless motor (but not in ESC context)
      { pattern: /brushless\s+motor(?!\s+(?:esc|controller))/i, confidence: 95, context: 'Brushless motor (not ESC)' },
      // Stator size - motor specific
      { pattern: /\b\d{4}\s+stator\b/i, confidence: 90, context: 'Motor stator size specification' }
    ],
    prop: [
      // Propeller full word
      { pattern: /\bpropellers?\b/i, confidence: 95, context: 'Explicit propeller designation' },
      // Prop size with blade count
      { pattern: /\b\d+x\d+x\d+\b.*?(?:prop|blade)/i, confidence: 90, context: 'Propeller dimensions with blade count' },
      // Blade count specification
      { pattern: /\b\d+\s*blade\s+(?:prop|propeller)\b/i, confidence: 88, context: 'Blade count specification' }
    ],
    stack: [
      // 4-in-1 ESC
      { pattern: /\b(?:4in1|4-in-1|four\s+in\s+one)\s+esc\b/i, confidence: 99, context: '4-in-1 ESC designation' },
      // All-in-one systems
      { pattern: /\b(?:aio|all-in-one|all\s+in\s+one)\b/i, confidence: 95, context: 'All-in-one system' },
      // Flight controller with processor
      { pattern: /flight\s+controller.*?f\d+/i, confidence: 90, context: 'Flight controller with processor' },
      // ESC with current rating
      { pattern: /\b\d+a\s+esc\b/i, confidence: 85, context: 'ESC with amperage rating' }
    ],
    camera: [
      // FPV camera
      { pattern: /fpv\s+camera/i, confidence: 95, context: 'FPV camera designation' },
      // Digital FPV systems
      { pattern: /(?:dji\s+)?(?:air\s+unit|o3|o4)/i, confidence: 90, context: 'Digital FPV system' },
      // Camera resolution specs
      { pattern: /camera.*?\b\d+tvl\b/i, confidence: 85, context: 'Camera with TVL resolution' }
    ]
  };

  // Context-aware exclusion patterns (prevent false positives)
  private static readonly EXCLUSION_PATTERNS = {
    prop: [
      // "Propeller compatibility" in frame descriptions should NOT classify as prop
      { pattern: /(?:propeller\s+)?compatibility.*?(?:up\s+to\s+)?\d+[\."']?/i, context: 'Compatibility specification, not actual propeller' },
      // "Supports X inch props" in frame specs
      { pattern: /supports?.*?\d+[\."']?\s*inch\s+props?/i, context: 'Frame prop support specification' },
      { pattern: /(?:max|maximum)\s+prop\s+size/i, context: 'Maximum prop size specification' }
    ],
    motor: [
      // "Motor mount" should not be classified as motor
      { pattern: /motor\s+mount/i, context: 'Motor mounting hardware, not motor' },
      { pattern: /motor\s+(?:protection|guard|dampener)/i, context: 'Motor accessory, not motor' }
    ],
    frame: [
      // "Frame rate" in camera context
      { pattern: /frame\s+rate/i, context: 'Camera frame rate, not physical frame' }
    ],
    camera: [
      // Action cameras should be excluded from drone cameras
      { pattern: /(?:gopro|action\s+camera)/i, context: 'Action camera, not FPV camera' }
    ]
  };

  // Enhanced keyword scoring with context weights
  private static readonly ENHANCED_KEYWORDS = {
    motor: [
      { word: 'motor', weight: 30, context: 'primary' },
      { word: 'kv', weight: 40, context: 'specification' },
      { word: 'brushless', weight: 25, context: 'type' },
      { word: 'stator', weight: 35, context: 'specification' },
      { word: 'thrust', weight: 20, context: 'performance' },
      { word: 'rpm', weight: 15, context: 'performance' }
    ],
    frame: [
      { word: 'frame', weight: 35, context: 'primary' },
      { word: 'wheelbase', weight: 45, context: 'specification' },
      { word: 'chassis', weight: 30, context: 'synonym' },
      { word: 'carbon fiber', weight: 25, context: 'material' },
      { word: 'freestyle', weight: 20, context: 'type' },
      { word: 'racing', weight: 20, context: 'type' }
    ],
    stack: [
      { word: 'esc', weight: 35, context: 'primary' },
      { word: 'flight controller', weight: 40, context: 'primary' },
      { word: 'fc', weight: 30, context: 'abbreviation' },
      { word: 'aio', weight: 35, context: 'type' },
      { word: 'stack', weight: 25, context: 'configuration' },
      { word: 'gyro', weight: 20, context: 'component' }
    ],
    battery: [
      { word: 'battery', weight: 35, context: 'primary' },
      { word: 'lipo', weight: 40, context: 'type' },
      { word: 'mah', weight: 45, context: 'specification' },
      { word: 'cells', weight: 30, context: 'configuration' },
      { word: 'discharge', weight: 20, context: 'specification' },
      { word: 'xt60', weight: 25, context: 'connector' }
    ],
    prop: [
      { word: 'propeller', weight: 40, context: 'primary' },
      { word: 'prop', weight: 30, context: 'abbreviation' },
      { word: 'blade', weight: 35, context: 'component' },
      { word: 'pitch', weight: 25, context: 'specification' }
    ],
    camera: [
      { word: 'camera', weight: 35, context: 'primary' },
      { word: 'lens', weight: 25, context: 'component' },
      { word: 'cmos', weight: 30, context: 'sensor' },
      { word: 'tvl', weight: 40, context: 'specification' },
      { word: 'fov', weight: 20, context: 'specification' }
    ]
  };

  public static getInstance(): EnhancedClassificationEngine {
    if (!EnhancedClassificationEngine.instance) {
      EnhancedClassificationEngine.instance = new EnhancedClassificationEngine();
    }
    return EnhancedClassificationEngine.instance;
  }

  /**
   * Main classification method with unified pipeline
   */
  public classifyProduct(context: ProductContext): ClassificationResult {
    const startTime = Date.now();
    console.log(`🚀 Enhanced Classification Engine v2.0`);
    console.log(`📦 Classifying: "${context.name}"`);
    
    // Step 1: Brand-based classification (99% confidence when matched)
    const brandResult = this.classifyByBrand(context);
    if (brandResult.confidence >= 95) {
      console.log(`✅ Definitive brand classification: ${brandResult.category} (${brandResult.confidence}%)`);
      return this.finalizeResult(brandResult, startTime);
    }

    // Step 2: Definitive pattern matching with exclusion checks
    const patternResult = this.classifyByDefinitivePatterns(context);
    if (patternResult.confidence >= 90) {
      console.log(`✅ Definitive pattern classification: ${patternResult.category} (${patternResult.confidence}%)`);
      return this.finalizeResult(patternResult, startTime);
    }

    // Step 3: Context-aware keyword analysis
    const keywordResult = this.classifyByEnhancedKeywords(context);
    if (keywordResult.confidence >= 85) {
      console.log(`✅ High-confidence keyword classification: ${keywordResult.category} (${keywordResult.confidence}%)`);
      return this.finalizeResult(keywordResult, startTime);
    }

    // Step 4: Semantic analysis and specification extraction
    const semanticResult = this.classifyBySemanticAnalysis(context);
    if (semanticResult.confidence >= 80) {
      console.log(`✅ Semantic classification: ${semanticResult.category} (${semanticResult.confidence}%)`);
      return this.finalizeResult(semanticResult, startTime);
    }

    // Step 5: Fallback scoring with weighted combination
    const fallbackResult = this.classifyByWeightedScoring(context);
    console.log(`⚠️ Fallback classification: ${fallbackResult.category} (${fallbackResult.confidence}%)`);
    
    return this.finalizeResult(fallbackResult, startTime);
  }

  private classifyByBrand(context: ProductContext): ClassificationResult {
    const text = `${context.name} ${context.description || ''}`.toLowerCase();
    const reasoning: string[] = [];
    
    for (const [category, brandData] of Object.entries(EnhancedClassificationEngine.BRAND_DATABASE)) {
      // Check definitive brands first
      for (const brand of brandData.definitive) {
        if (text.includes(brand)) {
          reasoning.push(`Definitive brand "${brand}" detected`);
          
          // Special handling for ambiguous brands
          if (brand === 't-motor' || brand === 'tmotor') {
            return this.handleTMotorClassification(text, reasoning);
          }
          
          return {
            category: category as ComponentCategory,
            confidence: 99,
            method: 'brand-definitive',
            reasoning,
            specifications: {},
            warnings: []
          };
        }
      }
      
      // Check brand aliases
      if (brandData.aliases) {
        for (const [mainBrand, aliases] of Object.entries(brandData.aliases)) {
          for (const alias of aliases) {
            if (text.includes(alias)) {
              reasoning.push(`Brand alias "${alias}" (${mainBrand}) detected`);
              return {
                category: category as ComponentCategory,
                confidence: 95,
                method: 'brand-alias',
                reasoning,
                specifications: {},
                warnings: []
              };
            }
          }
        }
      }
    }

    return {
      category: 'unknown',
      confidence: 0,
      method: 'brand',
      reasoning: ['No brand matches found'],
      specifications: {},
      warnings: []
    };
  }

  private handleTMotorClassification(text: string, reasoning: string[]): ClassificationResult {
    // T-Motor makes motors, props, and ESCs - need context
    if (text.includes('prop') || text.includes('propeller')) {
      reasoning.push('T-Motor propeller product detected');
      return {
        category: 'prop',
        confidence: 98,
        method: 'brand-context',
        reasoning,
        specifications: {},
        warnings: []
      };
    }
    
    if (text.includes('esc') || text.includes('flight controller') || text.includes('aio')) {
      reasoning.push('T-Motor ESC/FC product detected');
      return {
        category: 'stack',
        confidence: 98,
        method: 'brand-context',
        reasoning,
        specifications: {},
        warnings: []
      };
    }
    
    // Default T-Motor to motor
    reasoning.push('T-Motor motor product (default)');
    return {
      category: 'motor',
      confidence: 95,
      method: 'brand-default',
      reasoning,
      specifications: {},
      warnings: []
    };
  }

  private classifyByDefinitivePatterns(context: ProductContext): ClassificationResult {
    const text = `${context.name} ${context.description || ''}`.toLowerCase();
    const reasoning: string[] = [];
    const warnings: string[] = [];

    // First, check for exclusion patterns to prevent false positives
    for (const [category, exclusions] of Object.entries(EnhancedClassificationEngine.EXCLUSION_PATTERNS)) {
      for (const exclusion of exclusions) {
        if (exclusion.pattern.test(text)) {
          warnings.push(`Excluded from ${category}: ${exclusion.context}`);
        }
      }
    }

    // Then check definitive patterns
    let bestMatch: ClassificationResult = {
      category: 'unknown',
      confidence: 0,
      method: 'pattern',
      reasoning,
      specifications: {},
      warnings
    };

    for (const [category, patterns] of Object.entries(EnhancedClassificationEngine.DEFINITIVE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.pattern.test(text)) {
          // Check if this category was excluded
          const isExcluded = warnings.some(warning => warning.includes(`Excluded from ${category}`));
          if (isExcluded) {
            reasoning.push(`Pattern matched but excluded: ${pattern.context}`);
            continue;
          }

          if (pattern.confidence > bestMatch.confidence) {
            bestMatch = {
              category: category as ComponentCategory,
              confidence: pattern.confidence,
              method: 'pattern-definitive',
              reasoning: [`Pattern match: ${pattern.context}`],
              specifications: this.extractSpecifications(text, category as ComponentCategory),
              warnings
            };
          }
        }
      }
    }

    return bestMatch;
  }

  private classifyByEnhancedKeywords(context: ProductContext): ClassificationResult {
    const text = `${context.name} ${context.description || ''}`.toLowerCase();
    const scores: Record<string, number> = {};
    const reasoning: string[] = [];

    for (const [category, keywords] of Object.entries(EnhancedClassificationEngine.ENHANCED_KEYWORDS)) {
      scores[category] = 0;
      const foundKeywords: string[] = [];

      for (const keyword of keywords) {
        if (text.includes(keyword.word)) {
          // Apply context-based weighting
          let contextMultiplier = 1;
          switch (keyword.context) {
            case 'primary': contextMultiplier = 1.5; break;
            case 'specification': contextMultiplier = 1.3; break;
            case 'type': contextMultiplier = 1.2; break;
            default: contextMultiplier = 1;
          }

          const weightedScore = keyword.weight * contextMultiplier;
          scores[category] += weightedScore;
          foundKeywords.push(`${keyword.word}(${weightedScore.toFixed(1)})`);
        }
      }

      if (foundKeywords.length > 0) {
        reasoning.push(`${category}: ${foundKeywords.join(', ')}`);
      }
    }

    const bestCategory = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    const confidence = Math.min(95, Math.max(0, (scores[bestCategory] / 100) * 100));

    return {
      category: bestCategory as ComponentCategory,
      confidence,
      method: 'keyword-enhanced',
      reasoning,
      specifications: this.extractSpecifications(text, bestCategory as ComponentCategory),
      warnings: []
    };
  }

  private classifyBySemanticAnalysis(context: ProductContext): ClassificationResult {
    const name = context.name.toLowerCase();
    const description = (context.description || '').toLowerCase();
    const reasoning: string[] = [];

    // Analyze product name structure for definitive indicators
    if (name.includes('kit')) {
      if (name.includes('frame kit') || name.includes('kit frame')) {
        reasoning.push('Product name indicates frame kit');
        return {
          category: 'frame',
          confidence: 95,
          method: 'semantic-name',
          reasoning,
          specifications: this.extractSpecifications(`${name} ${description}`, 'frame'),
          warnings: []
        };
      }
      
      if (name.includes('power kit') || name.includes('motor kit')) {
        reasoning.push('Product name indicates motor/power kit');
        return {
          category: 'motor',
          confidence: 90,
          method: 'semantic-name',
          reasoning,
          specifications: this.extractSpecifications(`${name} ${description}`, 'motor'),
          warnings: []
        };
      }
    }

    // Analyze description for product hierarchy understanding
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      
      // Look for definitive statements
      if (/this\s+(?:is\s+)?(?:a\s+)?(\w+)/.test(cleanSentence)) {
        const match = cleanSentence.match(/this\s+(?:is\s+)?(?:a\s+)?(\w+)/);
        if (match) {
          const productType = match[1];
          if (['frame', 'motor', 'battery', 'camera', 'propeller'].includes(productType)) {
            reasoning.push(`Explicit product type statement: "${productType}"`);
            const category = productType === 'propeller' ? 'prop' : productType;
            return {
              category: category as ComponentCategory,
              confidence: 85,
              method: 'semantic-statement',
              reasoning,
              specifications: this.extractSpecifications(`${name} ${description}`, category as ComponentCategory),
              warnings: []
            };
          }
        }
      }
    }

    return {
      category: 'unknown',
      confidence: 0,
      method: 'semantic',
      reasoning: ['No semantic indicators found'],
      specifications: {},
      warnings: []
    };
  }

  private classifyByWeightedScoring(context: ProductContext): ClassificationResult {
    const text = `${context.name} ${context.description || ''}`.toLowerCase();
    const reasoning: string[] = [];
    
    // Use a combination of all previous methods with reduced weights
    const brandResult = this.classifyByBrand(context);
    const patternResult = this.classifyByDefinitivePatterns(context);
    const keywordResult = this.classifyByEnhancedKeywords(context);
    const semanticResult = this.classifyBySemanticAnalysis(context);

    const combinedScores: Record<string, number> = {};
    
    // Weight the results
    if (brandResult.confidence > 0) {
      combinedScores[brandResult.category] = (combinedScores[brandResult.category] || 0) + brandResult.confidence * 0.4;
    }
    if (patternResult.confidence > 0) {
      combinedScores[patternResult.category] = (combinedScores[patternResult.category] || 0) + patternResult.confidence * 0.3;
    }
    if (keywordResult.confidence > 0) {
      combinedScores[keywordResult.category] = (combinedScores[keywordResult.category] || 0) + keywordResult.confidence * 0.2;
    }
    if (semanticResult.confidence > 0) {
      combinedScores[semanticResult.category] = (combinedScores[semanticResult.category] || 0) + semanticResult.confidence * 0.1;
    }

    const bestCategory = Object.entries(combinedScores).reduce((a, b) => a[1] > b[1] ? a : b, ['unknown', 0]);
    
    reasoning.push(`Weighted combination of multiple methods`);
    if (brandResult.confidence > 0) reasoning.push(`Brand: ${brandResult.category}(${brandResult.confidence}%)`);
    if (patternResult.confidence > 0) reasoning.push(`Pattern: ${patternResult.category}(${patternResult.confidence}%)`);
    if (keywordResult.confidence > 0) reasoning.push(`Keyword: ${keywordResult.category}(${keywordResult.confidence}%)`);
    if (semanticResult.confidence > 0) reasoning.push(`Semantic: ${semanticResult.category}(${semanticResult.confidence}%)`);

    return {
      category: bestCategory[0] as ComponentCategory,
      confidence: Math.min(79, bestCategory[1]), // Cap at 79% for fallback
      method: 'weighted-combination',
      reasoning,
      specifications: this.extractSpecifications(text, bestCategory[0] as ComponentCategory),
      warnings: []
    };
  }

  private extractSpecifications(text: string, category: ComponentCategory): ProductSpecifications {
    const specs: ProductSpecifications = {};

    switch (category) {
      case 'motor':
        const kvMatch = text.match(/(\d+)kv/i);
        if (kvMatch) specs.kv = parseInt(kvMatch[1]);
        
        const statorMatch = text.match(/(\d{4})/);
        if (statorMatch) specs.statorSize = statorMatch[1];
        break;

      case 'battery':
        const capacityMatch = text.match(/(\d+)mah/i);
        if (capacityMatch) specs.capacity = parseInt(capacityMatch[1]);
        
        const cellMatch = text.match(/(\d+)s/i);
        if (cellMatch) specs.cells = parseInt(cellMatch[1]);
        break;

      case 'frame':
        const wheelbaseMatch = text.match(/wheelbase.*?(\d+)mm/i);
        if (wheelbaseMatch) specs.wheelbase = `${wheelbaseMatch[1]}mm`;
        
        const sizeMatch = text.match(/(\d+)["']\s*frame/i);
        if (sizeMatch) specs.size = `${sizeMatch[1]}"`;
        break;

      case 'prop':
        const propSizeMatch = text.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:x(\d+))?/);
        if (propSizeMatch) {
          specs.diameter = propSizeMatch[1];
          specs.pitch = propSizeMatch[2];
          if (propSizeMatch[3]) specs.blades = parseInt(propSizeMatch[3]);
        }
        break;

      case 'camera':
        const tvlMatch = text.match(/(\d+)tvl/i);
        if (tvlMatch) specs.resolution = `${tvlMatch[1]}TVL`;
        break;

      case 'stack':
        const currentMatch = text.match(/(\d+)a/i);
        if (currentMatch) specs.current = `${currentMatch[1]}A`;
        
        const processorMatch = text.match(/(f\d+)/i);
        if (processorMatch) specs.processor = processorMatch[1].toUpperCase();
        break;
    }

    return specs;
  }

  private finalizeResult(result: ClassificationResult, startTime: number): ClassificationResult {
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Classification completed in ${processingTime}ms`);
    console.log(`📊 Result: ${result.category} (${result.confidence}% confidence via ${result.method})`);
    console.log(`💭 Reasoning: ${result.reasoning.join(', ')}`);
    
    if (result.warnings.length > 0) {
      console.log(`⚠️ Warnings: ${result.warnings.join(', ')}`);
    }
    
    if (Object.keys(result.specifications).length > 0) {
      console.log(`📋 Specifications: ${JSON.stringify(result.specifications)}`);
    }

    return result;
  }

  /**
   * Utility method to test classification accuracy against known correct answers
   */
  public validateClassification(context: ProductContext, expectedCategory: ComponentCategory): boolean {
    const result = this.classifyProduct(context);
    const isCorrect = result.category === expectedCategory;
    
    console.log(`🧪 Validation: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`   Expected: ${expectedCategory}, Got: ${result.category} (${result.confidence}%)`);
    
    return isCorrect;
  }
}