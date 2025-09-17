import { PrismaClient } from '@prisma/client';

interface ProductSpecifications {
  [key: string]: string | number;
}

export class ProductResortService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async resortAllProducts(): Promise<{
    totalProcessed: number;
    reclassified: number;
    changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }>;
  }> {
    console.log('🔄 Starting product resort process...');
    
    const products = await this.prisma.product.findMany();
    const changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }> = [];

    console.log(`📦 Found ${products.length} products to analyze`);

    for (const product of products) {
      const newCategory = this.determineCategory(product.name, product.description || '');
      
      if (newCategory !== product.category) {
        const reason = this.getClassificationReason(product.name, product.description || '', newCategory);
        
        changes.push({
          id: product.id,
          name: product.name,
          oldCategory: product.category,
          newCategory: newCategory,
          reason: reason
        });

        // Update the product in the database
        await this.prisma.product.update({
          where: { id: product.id },
          data: { 
            category: newCategory,
            // Optionally re-extract specifications based on new category
            specifications: this.extractSpecifications(product.description || '', newCategory)
          }
        });

        console.log(`🔄 Reclassified: ${product.name}`);
        console.log(`   ${product.category} → ${newCategory} (${reason})`);
      }
    }

    console.log(`✅ Resort complete: ${changes.length} products reclassified out of ${products.length}`);
    
    return {
      totalProcessed: products.length,
      reclassified: changes.length,
      changes: changes
    };
  }

  async resortByBrand(brandName: string): Promise<{
    totalProcessed: number;
    reclassified: number;
    changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }>;
  }> {
    console.log(`🔄 Starting resort for brand: ${brandName}`);
    
    const products = await this.prisma.product.findMany({
      where: {
        brand: brandName
      }
    });

    const changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }> = [];

    for (const product of products) {
      const newCategory = this.determineCategory(product.name, product.description || '');
      
      if (newCategory !== product.category) {
        const reason = this.getClassificationReason(product.name, product.description || '', newCategory);
        
        changes.push({
          id: product.id,
          name: product.name,
          oldCategory: product.category,
          newCategory: newCategory,
          reason: reason
        });

        await this.prisma.product.update({
          where: { id: product.id },
          data: { 
            category: newCategory,
            specifications: this.extractSpecifications(product.description || '', newCategory)
          }
        });
      }
    }

    return {
      totalProcessed: products.length,
      reclassified: changes.length,
      changes: changes
    };
  }

  async resortByCurrentCategory(currentCategory: string): Promise<{
    totalProcessed: number;
    reclassified: number;
    changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }>;
  }> {
    console.log(`🔄 Starting resort for category: ${currentCategory}`);
    
    const products = await this.prisma.product.findMany({
      where: {
        category: currentCategory
      }
    });

    const changes: Array<{
      id: string;
      name: string;
      oldCategory: string;
      newCategory: string;
      reason: string;
    }> = [];

    for (const product of products) {
      const newCategory = this.determineCategory(product.name, product.description || '');
      
      if (newCategory !== product.category) {
        const reason = this.getClassificationReason(product.name, product.description || '', newCategory);
        
        changes.push({
          id: product.id,
          name: product.name,
          oldCategory: product.category,
          newCategory: newCategory,
          reason: reason
        });

        await this.prisma.product.update({
          where: { id: product.id },
          data: { 
            category: newCategory,
            specifications: this.extractSpecifications(product.description || '', newCategory)
          }
        });
      }
    }

    return {
      totalProcessed: products.length,
      reclassified: changes.length,
      changes: changes
    };
  }

  private determineCategory(productName: string, description: string): string {
    const textToAnalyze = `${productName} ${description}`.toLowerCase();
    
    // DEFINITIVE EXCLUSIONS FIRST - These override everything else
    
    // 1. DEFINITIVE BATTERY DETECTION (highest priority)
    if (this.isDefinitivelyBattery(textToAnalyze)) {
      return 'battery';
    }
    
    // 2. DEFINITIVE MOTOR DETECTION 
    if (this.isDefinitivelyMotor(textToAnalyze)) {
      return 'motor';
    }
    
    // 3. DEFINITIVE FRAME DETECTION
    if (this.isDefinitivelyFrame(textToAnalyze)) {
      return 'frame';
    }
    
    // 4. DEFINITIVE STACK DETECTION
    if (this.isDefinitivelyStack(textToAnalyze)) {
      return 'stack';
    }
    
    // 5. DEFINITIVE CAMERA DETECTION
    if (this.isDefinitivelyCamera(textToAnalyze)) {
      return 'camera';
    }
    
    // 6. DEFINITIVE PROP DETECTION (lowest priority - can be fooled by cross-references)
    if (this.isDefinitivelyProp(textToAnalyze)) {
      return 'prop';
    }
    
    // Fallback to scoring system for edge cases
    return this.scoringBasedClassification(textToAnalyze);
  }

  private isDefinitivelyBattery(text: string): boolean {
    // Battery brands are definitive
    const batteryBrands = ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy'];
    if (batteryBrands.some(brand => text.includes(brand))) {
      return true;
    }
    
    // Strong battery indicators with capacity
    if ((text.includes('lipo') || text.includes('battery') || text.includes('lithium')) && text.includes('mah')) {
      return true;
    }
    
    // Cell count with battery context
    if (/\d+s.*(?:lipo|battery)|(?:lipo|battery).*\d+s/.test(text)) {
      return true;
    }
    
    // Button/coin batteries are definitely batteries
    if (text.includes('button battery') || text.includes('coin battery') || text.includes('lithium button')) {
      return true;
    }
    
    return false;
  }

  private isDefinitivelyMotor(text: string): boolean {
    // Motor brands (excluding flight controllers)
    const motorBrands = ['emax motor', 'brotherhobby', 'racerstar', 'sunnysky'];
    if (motorBrands.some(brand => text.includes(brand))) {
      return true;
    }
    
    // T-Motor products (unless they're FCs)
    if (text.includes('t-motor') && !text.includes('flight controller') && !text.includes('aio')) {
      return true;
    }
    
    // Motor with KV rating
    if (text.includes('motor') && /\d+kv/.test(text)) {
      return true;
    }
    
    // Brushless motor
    if (text.includes('brushless motor') || (text.includes('brushless') && text.includes('motor') && !text.includes('frame'))) {
      return true;
    }
    
    return false;
  }

  private isDefinitivelyFrame(text: string): boolean {
    // Frame is usually very clear
    if (text.includes('frame') && !text.includes('flight controller') && !text.includes('esc') && !text.includes('motor')) {
      return true;
    }
    
    // Wheelbase is definitive for frames
    if (text.includes('wheelbase') || /\d+mm.*frame/.test(text)) {
      return true;
    }
    
    // Frame kit
    if (text.includes('frame kit') || text.includes('chassis kit')) {
      return true;
    }
    
    return false;
  }

  private isDefinitivelyStack(text: string): boolean {
    // Flight controller terms
    if (text.includes('flight controller') || text.includes('aio') || text.includes('all in one') || text.includes('all-in-one')) {
      return true;
    }
    
    // 4-in-1 ESCs are always stack
    if (text.includes('4in1') || text.includes('4-in-1') || text.includes('four in one')) {
      return true;
    }
    
    // Processor indicators
    if (/\b(f411|f722|f405|f745|h7)\b/.test(text) && (text.includes('fc') || text.includes('controller'))) {
      return true;
    }
    
    return false;
  }

  private isDefinitivelyCamera(text: string): boolean {
    // Camera brands
    const cameraBrands = ['runcam', 'foxeer', 'caddx'];
    if (cameraBrands.some(brand => text.includes(brand)) && text.includes('camera')) {
      return true;
    }
    
    // Digital FPV systems
    if (text.includes('dji air unit') || text.includes('walksnail avatar') || text.includes('hdzero')) {
      return true;
    }
    
    // FPV camera with TVL
    if (text.includes('fpv camera') || (text.includes('camera') && text.includes('tvl'))) {
      return true;
    }
    
    return false;
  }

  private isDefinitivelyProp(text: string): boolean {
    // Prop brands are definitive ONLY if no contradictory evidence
    const propBrands = ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal', 'ethix'];
    const hasPropBrand = propBrands.some(brand => text.includes(brand));
    
    // If it has battery indicators, don't classify as prop even with brand mention
    if (hasPropBrand && (text.includes('battery') || text.includes('lithium') || text.includes('mah'))) {
      return false;
    }
    
    if (hasPropBrand) {
      return true;
    }
    
    // Definitive prop indicators
    if (text.includes('propeller') || text.includes('propellers')) {
      return true;
    }
    
    // Prop size patterns with blade count
    if (/\d+x\d+x\d+|\d+x\d+\.\d+.*blade|\d{4}.*(?:prop|blade)/.test(text)) {
      return true;
    }
    
    return false;
  }

  private scoringBasedClassification(textToAnalyze: string): string {
    // Define scoring weights for each category
    const categoryScores = {
      motor: 0,
      prop: 0,
      battery: 0,
      stack: 0,
      frame: 0,
      camera: 0
    };

    // MOTOR SCORING
    const motorKeywords = {
      // Brand indicators (very high confidence)
      brands: { weight: 50, keywords: ['emax', 'brotherhobby', 'iflight motor', 'racerstar', 'sunnysky'] },
      // Strong motor indicators
      strong: { weight: 40, keywords: ['motor', 'brushless motor', 'outrunner', 'inrunner'] },
      // Motor specifications
      specs: { weight: 35, keywords: ['kv', 'stator', 'rpm', 'thrust', 'prop size'] },
      // Supporting terms
      support: { weight: 20, keywords: ['brushless', 'magnets', 'windings', 'bell', 'shaft'] },
      // Context clues
      context: { weight: 15, keywords: ['cw', 'ccw', 'mounting', 'screw', 'prop adapter'] }
    };

    // PROPELLER SCORING
    const propKeywords = {
      // Brand indicators (reduced confidence to avoid cross-contamination)
      brands: { weight: 35, keywords: ['gemfan', 'hqprop', 'hq prop', 'dal', 'dalprop', 'ethix', 'azure'] },
      // Strong prop indicators
      strong: { weight: 45, keywords: ['propeller', 'propellers', 'props'] },
      // Prop specifications
      specs: { weight: 40, keywords: ['tri-blade', 'quad-blade', 'bi-blade', 'pitch', 'diameter'] },
      // Supporting terms
      support: { weight: 25, keywords: ['blade', 'blades', 'hub', 'tip'] },
      // Material/design
      material: { weight: 20, keywords: ['polycarbonate', 'carbon prop', 'pc prop'] }
    };

    // BATTERY SCORING
    const batteryKeywords = {
      // Brand indicators
      brands: { weight: 50, keywords: ['tattu', 'gnb', 'cnhl', 'turnigy', 'zippy'] },
      // Strong battery indicators
      strong: { weight: 45, keywords: ['battery', 'batteries', 'lipo', 'lipolymer'] },
      // Battery specifications
      specs: { weight: 40, keywords: ['mah', 'cell pack', 'voltage', 'lihv'] },
      // Supporting terms
      support: { weight: 25, keywords: ['pack', 'cells', 'discharge', 'charge'] },
      // Context clues
      context: { weight: 15, keywords: ['xt60', 'xt30', 'ph2.0', 'balance'] }
    };

    // FLIGHT CONTROLLER/STACK SCORING
    const stackKeywords = {
      // Brand indicators
      brands: { weight: 50, keywords: ['betaflight', 'speedybee', 'matek', 'holybro'] },
      // Strong FC indicators
      strong: { weight: 50, keywords: ['flight controller', 'aio', 'all in one'] },
      // Processor indicators
      processor: { weight: 45, keywords: ['f411', 'f722', 'f405', 'f745', 'h7'] },
      // Supporting terms
      support: { weight: 30, keywords: ['fc', 'esc', 'gyro', 'accelerometer'] },
      // Context clues
      context: { weight: 20, keywords: ['mounting', 'stack', 'betaflight', 'cleanflight'] }
    };

    // FRAME SCORING
    const frameKeywords = {
      // Strong frame indicators
      strong: { weight: 50, keywords: ['frame', 'chassis', 'kit'] },
      // Frame specifications
      specs: { weight: 40, keywords: ['wheelbase', 'arm length', 'stack mounting'] },
      // Supporting terms
      support: { weight: 30, keywords: ['carbon fiber', 'carbon fibre', 'cf', 'arms'] },
      // Context clues
      context: { weight: 20, keywords: ['freestyle', 'racing', 'unibody', 'armor'] }
    };

    // CAMERA SCORING
    const cameraKeywords = {
      // Brand indicators
      brands: { weight: 50, keywords: ['runcam', 'foxeer', 'caddx', 'walksnail', 'hdzero'] },
      // Strong camera indicators
      strong: { weight: 45, keywords: ['camera', 'cam', 'fpv camera'] },
      // Camera specifications
      specs: { weight: 40, keywords: ['tvl', 'cmos', 'ccd', 'lens', 'fov'] },
      // Supporting terms
      support: { weight: 25, keywords: ['sensor', 'recording', 'video'] },
      // Context clues
      context: { weight: 15, keywords: ['micro', 'nano', 'mini', 'mount'] }
    };

    // Calculate scores for each category
    this.calculateCategoryScore(textToAnalyze, motorKeywords, categoryScores, 'motor');
    this.calculateCategoryScore(textToAnalyze, propKeywords, categoryScores, 'prop');
    this.calculateCategoryScore(textToAnalyze, batteryKeywords, categoryScores, 'battery');
    this.calculateCategoryScore(textToAnalyze, stackKeywords, categoryScores, 'stack');
    this.calculateCategoryScore(textToAnalyze, frameKeywords, categoryScores, 'frame');
    this.calculateCategoryScore(textToAnalyze, cameraKeywords, categoryScores, 'camera');

    // Apply negative scoring (conflicting indicators)
    this.applyNegativeScoring(textToAnalyze, categoryScores);

    // Find the category with the highest score
    const maxScore = Math.max(...Object.values(categoryScores));
    const bestCategory = Object.entries(categoryScores).find(([, score]) => score === maxScore)?.[0];

    // Fallback to 'motor' if no clear winner or all scores are 0
    return bestCategory && maxScore > 0 ? bestCategory : 'motor';
  }

  private calculateCategoryScore(
    text: string, 
    keywordGroups: Record<string, { weight: number; keywords: string[] }>, 
    scores: Record<string, number>, 
    category: string
  ): void {
    let totalScore = 0;

    for (const [, { weight, keywords }] of Object.entries(keywordGroups)) {
      let groupScore = 0;
      
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          // Give higher weight to exact matches vs partial matches
          const isExactMatch = new RegExp(`\\b${keyword}\\b`, 'i').test(text);
          const multiplier = isExactMatch ? 1.0 : 0.7;
          groupScore += weight * multiplier;
          
          // Bonus for multiple occurrences (diminishing returns)
          const occurrences = (text.match(new RegExp(keyword, 'gi')) || []).length;
          if (occurrences > 1) {
            groupScore += weight * 0.2 * Math.min(occurrences - 1, 3);
          }
        }
      }
      
      // Don't let any single group dominate (cap at 2x weight)
      totalScore += Math.min(groupScore, weight * 2);
    }

    scores[category] = totalScore;
  }

  private applyNegativeScoring(text: string, scores: Record<string, number>): void {
    // T-Motor brand context: Motors vs Flight Controllers
    if (text.includes('t-motor')) {
      if (text.includes('f411') || text.includes('f722') || text.includes('aio') || text.includes('flight controller')) {
        scores.motor -= 30; // Reduce motor score for T-Motor FCs
        scores.stack += 20; // Boost FC score
      }
    }

    // Flight controller context: Don't classify as motor even with "brushless"
    if ((text.includes('flight controller') || text.includes('aio')) && text.includes('brushless')) {
      scores.motor -= 25;
    }

    // Frame context: Frames with "carbon fiber" shouldn't be classified as other categories
    if (text.includes('frame') && text.includes('carbon fiber') && !text.includes('flight controller')) {
      scores.motor -= 20;
      scores.prop -= 20;
      scores.stack -= 20;
    }

    // Propeller context: If strong prop indicators, reduce motor score
    if ((text.includes('gemfan') || text.includes('hqprop') || text.includes('propeller')) && text.includes('blade')) {
      scores.motor -= 30;
    }

    // Battery context: Strong battery indicators shouldn't be motors
    if ((text.includes('lipo') || text.includes('battery')) && text.includes('mah')) {
      scores.motor -= 25;
      scores.stack -= 15;
    }
  }

  private getClassificationReason(productName: string, description: string, category: string): string {
    const textToAnalyze = `${productName} ${description}`.toLowerCase();
    
    switch (category) {
      case 'prop':
        if (textToAnalyze.includes('gemfan')) return 'Gemfan brand indicator';
        if (textToAnalyze.includes('hqprop')) return 'HQProp brand indicator';
        if (textToAnalyze.includes('propeller')) return 'Contains "propeller"';
        if (textToAnalyze.includes('blade')) return 'Contains "blade"';
        return 'Propeller keywords detected';
        
      case 'frame':
        if (textToAnalyze.includes('frame')) return 'Contains "frame"';
        if (textToAnalyze.includes('wheelbase')) return 'Contains "wheelbase"';
        if (textToAnalyze.includes('carbon fiber')) return 'Contains "carbon fiber"';
        return 'Frame keywords detected';
        
      case 'stack':
        if (textToAnalyze.includes('flight controller')) return 'Contains "flight controller"';
        if (textToAnalyze.includes('aio')) return 'Contains "AIO"';
        if (textToAnalyze.includes('f411')) return 'Contains "F411" processor';
        if (textToAnalyze.includes('f722')) return 'Contains "F722" processor';
        if (textToAnalyze.includes('4in1 esc')) return 'Contains "4in1 ESC"';
        return 'Flight controller/stack keywords detected';
        
      case 'motor':
        if (textToAnalyze.includes('motor')) return 'Contains "motor"';
        if (textToAnalyze.includes('kv')) return 'Contains "KV"';
        if (textToAnalyze.includes('brushless')) return 'Contains "brushless"';
        if (textToAnalyze.includes('stator')) return 'Contains "stator"';
        return 'Motor keywords detected';
        
      case 'battery':
        if (textToAnalyze.includes('battery')) return 'Contains "battery"';
        if (textToAnalyze.includes('lipo')) return 'Contains "LiPo"';
        if (textToAnalyze.includes('mah')) return 'Contains "mAh"';
        if (textToAnalyze.includes('lihv')) return 'Contains "LiHV"';
        return 'Battery keywords detected';
        
      case 'camera':
        if (textToAnalyze.includes('camera')) return 'Contains "camera"';
        if (textToAnalyze.includes('fpv cam')) return 'Contains "FPV cam"';
        if (textToAnalyze.includes('lens')) return 'Contains "lens"';
        if (textToAnalyze.includes('tvl')) return 'Contains "TVL"';
        return 'Camera keywords detected';
        
      default:
        return 'Default classification';
    }
  }

  private extractSpecifications(description: string, category: string): ProductSpecifications {
    const specs: ProductSpecifications = {};
    const text = description.toLowerCase();
    
    switch (category) {
      case 'motor':
        const kvMatch = text.match(/(\d+)\s*kv/i);
        if (kvMatch) specs.kv = kvMatch[1];
        
        const statorMatch = text.match(/stator:\s*(\d+)/i);
        if (statorMatch) specs.stator = statorMatch[1];
        
        const thrustMatch = text.match(/thrust.*?(\d+(?:\.\d+)?)\s*kg/i);
        if (thrustMatch) specs.thrust = `${thrustMatch[1]}kg`;
        break;
        
      case 'battery':
        const capacityMatch = text.match(/(\d+)\s*mah/i);
        if (capacityMatch) specs.capacity = `${capacityMatch[1]}mAh`;
        
        const cellMatch = text.match(/(\d+)s/i);
        if (cellMatch) specs.cellCount = `${cellMatch[1]}S`;
        
        const cRatingMatch = text.match(/(\d+)c/i);
        if (cRatingMatch) specs.cRating = `${cRatingMatch[1]}C`;
        break;
        
      // Add more category-specific extraction as needed
    }
    
    return specs;
  }

  async generateResortReport(): Promise<{
    categoryDistribution: Record<string, number>;
    brandBreakdown: Record<string, Record<string, number>>;
    potentialMisclassifications: Array<{
      id: string;
      name: string;
      category: string;
      reason: string;
    }>;
  }> {
    const products = await this.prisma.product.findMany();
    
    const categoryDistribution: Record<string, number> = {};
    const brandBreakdown: Record<string, Record<string, number>> = {};
    const potentialMisclassifications: Array<{
      id: string;
      name: string;
      category: string;
      reason: string;
    }> = [];

    for (const product of products) {
      // Category distribution
      categoryDistribution[product.category] = (categoryDistribution[product.category] || 0) + 1;
      
      // Brand breakdown
      const brand = product.brand || 'Unknown';
      if (!brandBreakdown[brand]) {
        brandBreakdown[brand] = {};
      }
      brandBreakdown[brand][product.category] = (brandBreakdown[brand][product.category] || 0) + 1;
      
      // Check for potential misclassifications
      const expectedCategory = this.determineCategory(product.name, product.description || '');
      if (expectedCategory !== product.category) {
        potentialMisclassifications.push({
          id: product.id,
          name: product.name,
          category: product.category,
          reason: `Should be ${expectedCategory} based on current logic`
        });
      }
    }

    return {
      categoryDistribution,
      brandBreakdown,
      potentialMisclassifications
    };
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}