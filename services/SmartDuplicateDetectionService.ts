
interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  price?: number;
  images?: string[];
  specifications?: Record<string, string | number | boolean>;
  vendorPrices?: Array<{
    vendor: string;
    price: number;
    url: string;
    inStock: boolean;
  }>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface DuplicateMatch {
  product1: Product;
  product2: Product;
  similarity: number;
  matchReason: string[];
  matchType: 'exact' | 'similar' | 'potential';
  confidence: number;
  mergeRecommendation: MergeRecommendation;
}

interface MergeRecommendation {
  primaryProduct: string; // ID of product to keep
  fieldsToMerge: string[];
  priceComparison: {
    keepLowest: boolean;
    mergePrices: boolean;
  };
  conflictResolution: ConflictResolution[];
}

interface ConflictResolution {
  field: string;
  conflict: 'different_values' | 'missing_data' | 'format_mismatch';
  resolution: 'keep_primary' | 'combine' | 'manual_review';
  reasoning: string;
}

interface DeduplicationResult {
  duplicatesFound: number;
  autoMerged: number;
  requiresReview: number;
  duplicateGroups: DuplicateGroup[];
  summary: DeduplicationSummary;
}

interface DuplicateGroup {
  id: string;
  products: Product[];
  primaryProduct: Product;
  similarity: number;
  status: 'auto_merged' | 'needs_review' | 'conflicted';
  mergeActions: MergeAction[];
}

interface MergeAction {
  type: 'merge_products' | 'update_field' | 'combine_prices' | 'resolve_conflict';
  description: string;
  automated: boolean;
}

interface DeduplicationSummary {
  totalProducts: number;
  duplicatesDetected: number;
  autoMergeRate: number;
  manualReviewRequired: number;
  confidenceDistribution: { [key: string]: number };
  categoryBreakdown: { [key: string]: number };
}

export class SmartDuplicateDetectionService {
  private static instance: SmartDuplicateDetectionService;
  
  // Similarity thresholds for different match types
  private readonly similarityThresholds = {
    exact: 0.95,      // Almost identical products
    similar: 0.80,    // Very similar products
    potential: 0.65   // Potentially similar products
  };

  // Weight factors for different matching criteria
  private readonly matchWeights = {
    name: 0.35,
    brand: 0.20,
    model: 0.15,
    category: 0.10,
    specifications: 0.15,
    price: 0.05
  };

  private constructor() {
    // Initialize without external dependencies
  }

  public static getInstance(): SmartDuplicateDetectionService {
    if (!SmartDuplicateDetectionService.instance) {
      SmartDuplicateDetectionService.instance = new SmartDuplicateDetectionService();
    }
    return SmartDuplicateDetectionService.instance;
  }

  /**
   * Detect duplicates in a product catalog
   */
  public async detectDuplicates(products: Product[]): Promise<DeduplicationResult> {
    console.log(`Starting duplicate detection for ${products.length} products...`);
    
    const duplicateGroups: DuplicateGroup[] = [];
    const processedProducts = new Set<string>();
    let autoMerged = 0;
    let requiresReview = 0;

    // Group products by category for more efficient comparison
    const productsByCategory = this.groupProductsByCategory(products);

    for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
      console.log(`Processing ${categoryProducts.length} products in category: ${category}`);
      
      const categoryDuplicates = await this.findDuplicatesInCategory(categoryProducts, processedProducts);
      duplicateGroups.push(...categoryDuplicates);
    }

    // Process merge recommendations
    for (const group of duplicateGroups) {
      if (group.status === 'auto_merged') {
        autoMerged++;
      } else {
        requiresReview++;
      }
    }

    const summary = this.generateSummary(products, duplicateGroups);

    return {
      duplicatesFound: duplicateGroups.length,
      autoMerged,
      requiresReview,
      duplicateGroups,
      summary
    };
  }

  /**
   * Find duplicates within a specific category
   */
  private async findDuplicatesInCategory(
    products: Product[], 
    processedProducts: Set<string>
  ): Promise<DuplicateGroup[]> {
    const duplicateGroups: DuplicateGroup[] = [];

    for (let i = 0; i < products.length; i++) {
      const product1 = products[i];
      
      if (processedProducts.has(product1.id)) {
        continue;
      }

      const duplicates: Product[] = [product1];
      const matches: DuplicateMatch[] = [];

      for (let j = i + 1; j < products.length; j++) {
        const product2 = products[j];
        
        if (processedProducts.has(product2.id)) {
          continue;
        }

        const match = await this.compareProducts(product1, product2);
        
        if (match.similarity >= this.similarityThresholds.potential) {
          matches.push(match);
          duplicates.push(product2);
        }
      }

      if (duplicates.length > 1) {
        const group = await this.createDuplicateGroup(duplicates, matches);
        duplicateGroups.push(group);
        
        // Mark all products in this group as processed
        duplicates.forEach(product => processedProducts.add(product.id));
      }
    }

    return duplicateGroups;
  }

  /**
   * Compare two products for similarity
   */
  private async compareProducts(product1: Product, product2: Product): Promise<DuplicateMatch> {
    let totalSimilarity = 0;
    const matchReasons: string[] = [];

    // Name similarity
    const nameSimilarity = this.calculateTextSimilarity(product1.name, product2.name);
    totalSimilarity += nameSimilarity * this.matchWeights.name;
    if (nameSimilarity > 0.7) {
      matchReasons.push(`Names are ${(nameSimilarity * 100).toFixed(1)}% similar`);
    }

    // Brand similarity
    if (product1.brand && product2.brand) {
      const brandSimilarity = this.calculateTextSimilarity(product1.brand, product2.brand);
      totalSimilarity += brandSimilarity * this.matchWeights.brand;
      if (brandSimilarity > 0.8) {
        matchReasons.push(`Same brand: ${product1.brand}`);
      }
    }

    // Model similarity
    if (product1.model && product2.model) {
      const modelSimilarity = this.calculateTextSimilarity(product1.model, product2.model);
      totalSimilarity += modelSimilarity * this.matchWeights.model;
      if (modelSimilarity > 0.8) {
        matchReasons.push(`Similar model numbers`);
      }
    }

    // Category similarity (should be same category already)
    if (product1.category === product2.category) {
      totalSimilarity += this.matchWeights.category;
      matchReasons.push(`Same category: ${product1.category}`);
    }

    // Specifications similarity
    const specSimilarity = this.compareSpecifications(product1.specifications, product2.specifications);
    totalSimilarity += specSimilarity * this.matchWeights.specifications;
    if (specSimilarity > 0.7) {
      matchReasons.push(`Specifications are ${(specSimilarity * 100).toFixed(1)}% similar`);
    }

    // Price similarity
    if (product1.price && product2.price) {
      const priceSimilarity = this.calculatePriceSimilarity(product1.price, product2.price);
      totalSimilarity += priceSimilarity * this.matchWeights.price;
      if (priceSimilarity > 0.8) {
        matchReasons.push(`Similar price range`);
      }
    }

    // Determine match type
    let matchType: 'exact' | 'similar' | 'potential';
    if (totalSimilarity >= this.similarityThresholds.exact) {
      matchType = 'exact';
    } else if (totalSimilarity >= this.similarityThresholds.similar) {
      matchType = 'similar';
    } else {
      matchType = 'potential';
    }

    // Generate merge recommendation
    const mergeRecommendation = this.generateMergeRecommendation(product1, product2);

    return {
      product1,
      product2,
      similarity: totalSimilarity,
      matchReason: matchReasons,
      matchType,
      confidence: this.calculateConfidence(totalSimilarity, matchReasons.length),
      mergeRecommendation
    };
  }

  /**
   * Calculate text similarity using Levenshtein distance
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Normalize texts
    const norm1 = text1.toLowerCase().trim();
    const norm2 = text2.toLowerCase().trim();
    
    if (norm1 === norm2) return 1;
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Compare product specifications
   */
  private compareSpecifications(spec1?: Record<string, string | number | boolean>, spec2?: Record<string, string | number | boolean>): number {
    if (!spec1 || !spec2) return 0;
    
    const keys1 = Object.keys(spec1);
    const keys2 = Object.keys(spec2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    if (allKeys.size === 0) return 0;
    
    let matches = 0;
    for (const key of allKeys) {
      if (spec1[key] && spec2[key]) {
        if (typeof spec1[key] === 'string' && typeof spec2[key] === 'string') {
          const similarity = this.calculateTextSimilarity(spec1[key], spec2[key]);
          if (similarity > 0.8) matches++;
        } else if (spec1[key] === spec2[key]) {
          matches++;
        }
      }
    }
    
    return matches / allKeys.size;
  }

  /**
   * Calculate price similarity
   */
  private calculatePriceSimilarity(price1: number, price2: number): number {
    const difference = Math.abs(price1 - price2);
    const average = (price1 + price2) / 2;
    const percentageDifference = difference / average;
    
    // Return similarity (inverse of percentage difference)
    return Math.max(0, 1 - percentageDifference);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(similarity: number, reasonsCount: number): number {
    // Base confidence on similarity
    let confidence = similarity;
    
    // Boost confidence if multiple reasons support the match
    if (reasonsCount >= 3) confidence += 0.1;
    if (reasonsCount >= 5) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate merge recommendation
   */
  private generateMergeRecommendation(product1: Product, product2: Product): MergeRecommendation {
    // Choose primary product (more complete data, newer, etc.)
    const primaryProduct = this.choosePrimaryProduct(product1, product2);
    const secondaryProduct = primaryProduct.id === product1.id ? product2 : product1;
    
    const fieldsToMerge: string[] = [];
    const conflictResolution: ConflictResolution[] = [];
    
    // Determine fields to merge
    if (!primaryProduct.description && secondaryProduct.description) {
      fieldsToMerge.push('description');
    }
    
    if (!primaryProduct.brand && secondaryProduct.brand) {
      fieldsToMerge.push('brand');
    }
    
    if (!primaryProduct.model && secondaryProduct.model) {
      fieldsToMerge.push('model');
    }
    
    // Handle conflicts
    if (primaryProduct.description && secondaryProduct.description && 
        primaryProduct.description !== secondaryProduct.description) {
      conflictResolution.push({
        field: 'description',
        conflict: 'different_values',
        resolution: 'combine',
        reasoning: 'Combine descriptions for more complete product information'
      });
    }
    
    // Price handling
    const priceComparison = {
      keepLowest: true,
      mergePrices: !!primaryProduct.vendorPrices && !!secondaryProduct.vendorPrices
    };
    
    return {
      primaryProduct: primaryProduct.id,
      fieldsToMerge,
      priceComparison,
      conflictResolution
    };
  }

  /**
   * Choose which product should be the primary (kept) product
   */
  private choosePrimaryProduct(product1: Product, product2: Product): Product {
    let score1 = 0;
    let score2 = 0;
    
    // Prefer product with more complete data
    if (product1.description) score1 += 1;
    if (product2.description) score2 += 1;
    
    if (product1.brand) score1 += 1;
    if (product2.brand) score2 += 1;
    
    if (product1.model) score1 += 1;
    if (product2.model) score2 += 1;
    
    if (product1.specifications && Object.keys(product1.specifications).length > 0) score1 += 2;
    if (product2.specifications && Object.keys(product2.specifications).length > 0) score2 += 2;
    
    if (product1.images && product1.images.length > 0) score1 += 1;
    if (product2.images && product2.images.length > 0) score2 += 1;
    
    // Prefer newer product if scores are tied
    if (score1 === score2) {
      return product1.createdAt > product2.createdAt ? product1 : product2;
    }
    
    return score1 > score2 ? product1 : product2;
  }

  /**
   * Create a duplicate group from found duplicates
   */
  private async createDuplicateGroup(products: Product[], matches: DuplicateMatch[]): Promise<DuplicateGroup> {
    // Calculate average similarity
    const avgSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length;
    
    // Choose primary product (most complete/newest)
    const primaryProduct = products.reduce((primary, current) => 
      this.choosePrimaryProduct(primary, current) === current ? current : primary
    );
    
    // Determine if this group can be auto-merged
    const highConfidenceMatches = matches.filter(match => match.confidence >= 0.9).length;
    const canAutoMerge = avgSimilarity >= this.similarityThresholds.exact && 
                         highConfidenceMatches >= matches.length * 0.8;
    
    const status = canAutoMerge ? 'auto_merged' : 'needs_review';
    
    // Generate merge actions
    const mergeActions: MergeAction[] = [
      {
        type: 'merge_products',
        description: `Merge ${products.length} duplicate products into ${primaryProduct.name}`,
        automated: canAutoMerge
      }
    ];
    
    if (canAutoMerge) {
      mergeActions.push({
        type: 'combine_prices',
        description: 'Combine vendor prices from all duplicate products',
        automated: true
      });
    }
    
    return {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      products,
      primaryProduct,
      similarity: avgSimilarity,
      status,
      mergeActions
    };
  }

  /**
   * Group products by category for efficient processing
   */
  private groupProductsByCategory(products: Product[]): Record<string, Product[]> {
    const grouped: Record<string, Product[]> = {};
    
    for (const product of products) {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    }
    
    return grouped;
  }

  /**
   * Generate deduplication summary
   */
  private generateSummary(products: Product[], duplicateGroups: DuplicateGroup[]): DeduplicationSummary {
    const totalProducts = products.length;
    const duplicatesDetected = duplicateGroups.reduce((sum, group) => sum + group.products.length, 0);
    const autoMerged = duplicateGroups.filter(group => group.status === 'auto_merged').length;
    const manualReviewRequired = duplicateGroups.filter(group => group.status === 'needs_review').length;
    
    const confidenceDistribution: { [key: string]: number } = {
      'high': 0,
      'medium': 0,
      'low': 0
    };
    
    duplicateGroups.forEach(group => {
      if (group.similarity >= 0.9) confidenceDistribution.high++;
      else if (group.similarity >= 0.7) confidenceDistribution.medium++;
      else confidenceDistribution.low++;
    });
    
    const categoryBreakdown: { [key: string]: number } = {};
    duplicateGroups.forEach(group => {
      const category = group.primaryProduct.category;
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
    
    return {
      totalProducts,
      duplicatesDetected,
      autoMergeRate: totalProducts > 0 ? autoMerged / totalProducts : 0,
      manualReviewRequired,
      confidenceDistribution,
      categoryBreakdown
    };
  }

  /**
   * Execute automatic merging for high-confidence duplicates
   */
  public async executeAutoMerge(duplicateGroups: DuplicateGroup[]): Promise<{
    merged: number;
    failed: number;
    errors: string[];
  }> {
    let merged = 0;
    let failed = 0;
    const errors: string[] = [];
    
    const autoMergeGroups = duplicateGroups.filter(group => group.status === 'auto_merged');
    
    for (const group of autoMergeGroups) {
      try {
        await this.mergeProductGroup(group);
        merged++;
      } catch (error) {
        failed++;
        errors.push(`Failed to merge group ${group.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return { merged, failed, errors };
  }

  /**
   * Merge a group of duplicate products
   */
  private async mergeProductGroup(group: DuplicateGroup): Promise<void> {
    // This would integrate with your database layer
    // For now, we'll just log the merge operation
    console.log(`Merging product group: ${group.id}`);
    console.log(`Primary product: ${group.primaryProduct.name}`);
    console.log(`Secondary products: ${group.products.filter(p => p.id !== group.primaryProduct.id).map(p => p.name).join(', ')}`);
    
    // In a real implementation, this would:
    // 1. Update the primary product with merged data
    // 2. Migrate vendor prices from secondary products
    // 3. Update any references to secondary products
    // 4. Mark secondary products as merged/deleted
    // 5. Log the merge operation for audit purposes
  }
}