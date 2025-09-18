/**
 * Enhanced Component Classification Service
 * 
 * This service provides comprehensive classification methods to properly categorize
 * drone components, with special focus on distinguishing between motors, ESCs,
 * flight controllers, and stack systems.
 */

type ComponentCategory = 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'unknown';

interface ComponentSpecifications {
  kv?: number;
  statorSize?: string;
  capacity?: string;
  cells?: number;
  voltage?: string;
  blades?: number;
  pitch?: string;
  hubDiameter?: string;
  wheelbase?: string;
  resolution?: string;
  sensor?: string;
  lens?: string;
  escCurrentRating?: string;
  fcProcessor?: string;
  [key: string]: unknown;
}

export interface ClassificationResult {
  category: ComponentCategory;
  confidence: number;
  reasons: string[];
}

export class ComponentClassificationService {
  
  /**
   * Main classification method that combines multiple detection strategies
   */
  public static classifyComponent(
    name: string, 
    description?: string, 
    specifications?: ComponentSpecifications
  ): ClassificationResult {
    const text = `${name} ${description || ''}`.toLowerCase().trim();
    const specs = specifications || {};
    
    console.log(`🔍 Classifying: "${name}"`);
    console.log(`📝 Full text: "${text}"`);
    console.log(`📊 Specs: ${JSON.stringify(specs)}`);
    
    // Step 1: Use definitive brand-based classification
    const brandResult = this.classifyByBrand(text);
    if (brandResult.confidence >= 90) {
      console.log(`✅ High-confidence brand classification: ${brandResult.category}`);
      return brandResult;
    }
    
    // Step 2: Use definitive keyword patterns
    const keywordResult = this.classifyByDefinitiveKeywords(text, specs);
    if (keywordResult.confidence >= 85) {
      console.log(`✅ High-confidence keyword classification: ${keywordResult.category}`);
      return keywordResult;
    }
    
    // Step 3: Use enhanced pattern matching
    const patternResult = this.classifyByPatterns(text, specs);
    if (patternResult.confidence >= 80) {
      console.log(`✅ Pattern-based classification: ${patternResult.category}`);
      return patternResult;
    }
    
    // Step 4: Use scoring-based fallback
    const scoringResult = this.classifyByScoring(text, specs);
    console.log(`📊 Scoring-based classification: ${scoringResult.category} (${scoringResult.confidence}%)`);
    
    return scoringResult;
  }
  
  /**
   * Brand-based classification (highest confidence)
   */
  private static classifyByBrand(text: string): ClassificationResult {
    const brandMappings = {
      // Battery brands (very high confidence)
      battery: {
        brands: ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy', 'gaoneng'],
        confidence: 95
      },
      // Propeller brands (very high confidence)
      prop: {
        brands: ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal prop', 'ethix', 'azure', 't-motor prop'],
        confidence: 95
      },
      // Motor brands (high confidence, but check for ESC exclusions)
      motor: {
        brands: ['t-motor', 'tmotor', 'emax', 'brotherhobby', 'iflight motor', 'xing motor'],
        confidence: 90
      },
      // Camera brands (high confidence)
      camera: {
        brands: ['runcam', 'foxeer', 'caddx', 'hawkeye', 'dji air unit', 'walksnail', 'hdzero'],
        confidence: 92
      },
      // Frame brands (medium-high confidence)
      frame: {
        brands: ['iflight frame', 'armattan', 'source one', 'realacc', 'geprc frame'],
        confidence: 88
      },
      // Stack/ESC brands (high confidence)
      stack: {
        brands: ['holybro', 'matek', 'betafpv fc', 'mamba', 'speedybee', 'jhemcu'],
        confidence: 90
      }
    };
    
    for (const [category, data] of Object.entries(brandMappings)) {
      for (const brand of data.brands) {
        if (text.includes(brand)) {
          // Special case: T-Motor could be motor or prop, need additional checks
          if (brand === 't-motor' || brand === 'tmotor') {
            if (text.includes('prop') || text.includes('propeller')) {
              return {
                category: 'prop',
                confidence: 95,
                reasons: [`T-Motor propeller product detected`]
              };
            }
            if (text.includes('esc') || text.includes('electronic speed controller')) {
              return {
                category: 'stack',
                confidence: 95,
                reasons: [`T-Motor ESC product detected`]
              };
            }
            // Default T-Motor to motor unless otherwise specified
            return {
              category: 'motor',
              confidence: 90,
              reasons: [`T-Motor brand detected (motor default)`]
            };
          }
          
          return {
            category: category as ComponentCategory,
            confidence: data.confidence,
            reasons: [`Brand '${brand}' detected`]
          };
        }
      }
    }
    
    return { category: 'unknown', confidence: 0, reasons: ['No definitive brand detected'] };
  }
  
  /**
   * Definitive keyword-based classification
   */
  private static classifyByDefinitiveKeywords(text: string, specs: ComponentSpecifications): ClassificationResult {
    
    // Battery detection (highest priority - most definitive)
    if (this.isDefinitelyBattery(text, specs)) {
      return {
        category: 'battery',
        confidence: 95,
        reasons: ['Definitive battery indicators detected']
      };
    }
    
    // ESC/Stack detection (before motor, as ESCs can mention motors)
    const escResult = this.classifyESCAndStack(text, specs);
    if (escResult.confidence >= 85) {
      return escResult;
    }
    
    // Motor detection (after ESC check)
    if (this.isDefinitelyMotor(text, specs)) {
      return {
        category: 'motor',
        confidence: 90,
        reasons: ['Definitive motor indicators detected']
      };
    }
    
    // Propeller detection
    if (this.isDefinitelyProp(text, specs)) {
      return {
        category: 'prop',
        confidence: 92,
        reasons: ['Definitive propeller indicators detected']
      };
    }
    
    // Frame detection
    if (this.isDefinitelyFrame(text, specs)) {
      return {
        category: 'frame',
        confidence: 88,
        reasons: ['Definitive frame indicators detected']
      };
    }
    
    // Camera detection
    if (this.isDefinitelyCamera(text, specs)) {
      return {
        category: 'camera',
        confidence: 90,
        reasons: ['Definitive camera indicators detected']
      };
    }
    
    return { category: 'unknown', confidence: 0, reasons: ['No definitive keywords detected'] };
  }
  
  /**
   * Enhanced ESC and Stack classification
   */
  private static classifyESCAndStack(text: string, specs: ComponentSpecifications): ClassificationResult {
    const reasons: string[] = [];
    let confidence = 0;
    
    // 4-in-1 ESCs (definitive stack)
    if (text.includes('4in1') || text.includes('4-in-1') || text.includes('four in one')) {
      return {
        category: 'stack',
        confidence: 98,
        reasons: ['4-in-1 ESC detected']
      };
    }
    
    // All-in-one systems
    if (text.includes('aio') || text.includes('all in one') || text.includes('all-in-one')) {
      return {
        category: 'stack',
        confidence: 95,
        reasons: ['All-in-one system detected']
      };
    }
    
    // ESC with current rating patterns
    const escCurrentMatch = text.match(/(\d+)a?\s*(?:amp|esc|electronic speed controller)/i);
    if (escCurrentMatch || (text.includes('esc') && /\d+a\b/.test(text))) {
      confidence += 40;
      reasons.push('ESC with current rating detected');
      
      // Individual ESCs vs integrated systems
      if (text.includes('individual') || text.includes('single') || !text.includes('stack')) {
        confidence += 30;
        reasons.push('Individual ESC indicators');
      } else {
        confidence += 20;
        reasons.push('ESC stack indicators');
      }
    }
    
    // Flight controller patterns
    if (text.includes('flight controller') || text.includes('fc')) {
      confidence += 35;
      reasons.push('Flight controller detected');
      
      // FC processor indicators
      if (/f4|f7|h7|stm32|at32/.test(text)) {
        confidence += 25;
        reasons.push('Flight controller processor detected');
      }
    }
    
    // Stack mounting patterns
    if (/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm.*mount/i.test(text) || 
        text.includes('20x20') || text.includes('30.5x30.5')) {
      confidence += 20;
      reasons.push('Stack mounting pattern detected');
    }
    
    // Electronic speed controller full term
    if (text.includes('electronic speed controller')) {
      confidence += 30;
      reasons.push('Full ESC term detected');
    }
    
    // Exclude motor-specific ESCs that are part of motor systems
    if (text.includes('motor') && text.includes('integrated') && !text.includes('separate')) {
      confidence -= 20;
      reasons.push('Integrated motor ESC (reduced confidence)');
    }
    
    if (confidence >= 85) {
      return {
        category: 'stack',
        confidence: Math.min(confidence, 98),
        reasons
      };
    }
    
    return { category: 'unknown', confidence, reasons };
  }
  
  /**
   * Battery detection
   */
  private static isDefinitelyBattery(text: string, specs: ComponentSpecifications): boolean {
    // mAh capacity is highly indicative
    if (text.includes('mah') || specs.capacity) {
      return true;
    }
    
    // LiPo with cell count
    if ((text.includes('lipo') || text.includes('lithium polymer')) && 
        (/\d+s/.test(text) || specs.cells)) {
      return true;
    }
    
    // Battery with voltage
    if (text.includes('battery') && (/\d+\.\d+v/.test(text) || specs.voltage)) {
      return true;
    }
    
    // Cell count patterns
    if (/\d+s.*(?:lipo|battery|pack)|(?:lipo|battery|pack).*\d+s/.test(text)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Motor detection (excluding ESCs)
   */
  private static isDefinitelyMotor(text: string, specs: ComponentSpecifications): boolean {
    // Brushless motor (not ESC)
    if ((text.includes('brushless motor') || text.includes('bldc motor')) && 
        !text.includes('esc') && !text.includes('controller')) {
      return true;
    }
    
    // Motor with KV rating (definitive motor spec)
    if ((text.includes('motor') && /\d+kv/.test(text)) || specs.kv) {
      return true;
    }
    
    // Stator size (motor-specific)
    if (/\d{4}.*stator/.test(text) || text.includes('stator size') || specs.statorSize) {
      return true;
    }
    
    // Motor with thrust specifications
    if (text.includes('motor') && (text.includes('thrust') || text.includes('rpm'))) {
      return true;
    }
    
    // Exclude if it's clearly an ESC
    if (text.includes('electronic speed controller') || 
        text.includes('4in1') || 
        /\d+a.*esc/.test(text)) {
      return false;
    }
    
    return false;
  }
  
  /**
   * Propeller detection
   */
  private static isDefinitelyProp(text: string, specs: ComponentSpecifications): boolean {
    // Propeller keywords
    if (text.includes('propeller') || text.includes('propellers')) {
      return true;
    }
    
    // Prop size patterns (e.g., "5x4.3x3", "6045")
    if (/\d+x\d+(?:x\d+)?.*(?:prop|blade)|\d{4}.*(?:prop|blade)/.test(text)) {
      return true;
    }
    
    // Blade count
    if (text.includes('blade') && /\d+.*blade/.test(text)) {
      return true;
    }
    
    // Prop-specific specs
    if (specs.blades || specs.pitch || specs.hubDiameter) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Frame detection
   */
  private static isDefinitelyFrame(text: string, specs: ComponentSpecifications): boolean {
    // Frame keyword without electronics
    if (text.includes('frame') && 
        !text.includes('flight controller') && 
        !text.includes('esc') && 
        !text.includes('stack')) {
      return true;
    }
    
    // Wheelbase (frame-specific measurement)
    if (text.includes('wheelbase') || specs.wheelbase) {
      return true;
    }
    
    // Frame size patterns
    if (/\d+["'].*frame|\d+inch.*frame/.test(text)) {
      return true;
    }
    
    // Frame materials
    if ((text.includes('carbon fiber') || text.includes('carbon fibre')) && 
        text.includes('frame')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Camera detection
   */
  private static isDefinitelyCamera(text: string, specs: ComponentSpecifications): boolean {
    // FPV camera indicators
    if (text.includes('fpv camera') || (text.includes('camera') && text.includes('tvl'))) {
      return true;
    }
    
    // Digital FPV systems
    if (text.includes('air unit') || 
        text.includes('vtx') || 
        text.includes('video transmitter')) {
      return true;
    }
    
    // Camera specs
    if (specs.resolution || specs.sensor || specs.lens) {
      return true;
    }
    
    // Exclude action cameras (not drone-specific)
    if (text.includes('gopro') || text.includes('action camera')) {
      return false;
    }
    
    return false;
  }
  
  /**
   * Pattern-based classification
   */
  private static classifyByPatterns(text: string, specs: ComponentSpecifications): ClassificationResult {
    const patterns = {
      motor: [
        /\d+kv.*motor/,
        /motor.*\d+kv/,
        /brushless.*motor/,
        /\d{4}.*motor/,
        /motor.*stator/
      ],
      stack: [
        /\d+a.*esc/,
        /esc.*\d+a/,
        /f[4-7].*flight.*controller/,
        /flight.*controller.*f[4-7]/,
        /\d+x\d+mm.*(?:mount|stack)/
      ],
      prop: [
        /\d+x\d+(?:x\d+)?/,
        /\d{4}.*(?:prop|propeller)/,
        /\d+.*blade.*prop/
      ],
      battery: [
        /\d+mah.*\d+s/,
        /\d+s.*\d+mah/,
        /\d+\.\d+v.*lipo/,
        /lipo.*\d+\.\d+v/
      ],
      frame: [
        /\d+["'].*frame/,
        /wheelbase.*\d+mm/,
        /carbon.*fiber.*frame/
      ],
      camera: [
        /\d+tvl/,
        /camera.*\d+mm.*lens/,
        /fpv.*camera/
      ]
    };
    
    for (const [category, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        if (pattern.test(text)) {
          return {
            category: category as ComponentCategory,
            confidence: 80,
            reasons: [`Pattern match: ${pattern.source}`]
          };
        }
      }
    }
    
    return { category: 'unknown', confidence: 0, reasons: ['No pattern matches'] };
  }
  
  /**
   * Scoring-based classification (fallback)
   */
  private static classifyByScoring(text: string, specs: ComponentSpecifications): ClassificationResult {
    const scores = {
      motor: 0,
      stack: 0,
      prop: 0,
      battery: 0,
      frame: 0,
      camera: 0
    };
    
    const reasons: string[] = [];
    
    // Motor scoring
    if (text.includes('motor')) { scores.motor += 3; reasons.push('motor keyword'); }
    if (text.includes('kv')) { scores.motor += 2; reasons.push('KV rating'); }
    if (text.includes('brushless')) { scores.motor += 1; reasons.push('brushless'); }
    if (text.includes('stator')) { scores.motor += 2; reasons.push('stator'); }
    if (specs.kv) { scores.motor += 3; reasons.push('KV in specs'); }
    
    // Stack scoring
    if (text.includes('esc')) { scores.stack += 3; reasons.push('ESC keyword'); }
    if (text.includes('flight controller') || text.includes('fc')) { scores.stack += 3; reasons.push('FC keyword'); }
    if (/f[4-7]/.test(text)) { scores.stack += 2; reasons.push('FC processor'); }
    if (/\d+a/.test(text)) { scores.stack += 1; reasons.push('current rating'); }
    
    // Prop scoring
    if (text.includes('prop')) { scores.prop += 3; reasons.push('prop keyword'); }
    if (text.includes('blade')) { scores.prop += 2; reasons.push('blade keyword'); }
    if (/\d+x\d+/.test(text)) { scores.prop += 2; reasons.push('size pattern'); }
    if (specs.blades) { scores.prop += 3; reasons.push('blades in specs'); }
    
    // Battery scoring
    if (text.includes('battery')) { scores.battery += 3; reasons.push('battery keyword'); }
    if (text.includes('mah')) { scores.battery += 3; reasons.push('mAh capacity'); }
    if (text.includes('lipo')) { scores.battery += 2; reasons.push('LiPo type'); }
    if (/\d+s/.test(text)) { scores.battery += 2; reasons.push('cell count'); }
    if (specs.capacity) { scores.battery += 3; reasons.push('capacity in specs'); }
    
    // Frame scoring
    if (text.includes('frame')) { scores.frame += 3; reasons.push('frame keyword'); }
    if (text.includes('carbon')) { scores.frame += 1; reasons.push('carbon material'); }
    if (text.includes('wheelbase')) { scores.frame += 3; reasons.push('wheelbase'); }
    if (specs.wheelbase) { scores.frame += 3; reasons.push('wheelbase in specs'); }
    
    // Camera scoring
    if (text.includes('camera')) { scores.camera += 3; reasons.push('camera keyword'); }
    if (text.includes('tvl')) { scores.camera += 3; reasons.push('TVL resolution'); }
    if (text.includes('lens')) { scores.camera += 2; reasons.push('lens'); }
    if (specs.resolution) { scores.camera += 3; reasons.push('resolution in specs'); }
    
    const maxScore = Math.max(...Object.values(scores));
    const bestCategory = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'motor';
    
    const confidence = Math.min((maxScore / 10) * 100, 95); // Convert to percentage, cap at 95%
    
    return {
      category: bestCategory as ComponentCategory,
      confidence,
      reasons: [`Scoring-based: ${JSON.stringify(scores)}`]
    };
  }
}