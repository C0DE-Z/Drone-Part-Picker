interface FeedbackEntry {
  id: string;
  timestamp: Date;
  productId: string;
  productName: string;
  originalClassification: string;
  correctedClassification: string;
  confidence: number;
  userId?: string;
  feedbackType: 'correction' | 'confirmation' | 'improvement';
  context: {
    source: 'manual' | 'automated' | 'user_report';
    userAgent?: string;
    sessionId?: string;
  };
  additionalData?: {
    userReason?: string;
    imageUrls?: string[];
    specifications?: Record<string, string | number | boolean>;
  };
}

interface LearningPattern {
  id: string;
  patternType: 'text_pattern' | 'image_pattern' | 'spec_pattern' | 'context_pattern';
  category: string;
  pattern: string;
  weight: number;
  confidence: number;
  supportingCases: number;
  lastUpdated: Date;
  effectiveness: number; // 0-1 score
}

interface ModelUpdate {
  id: string;
  timestamp: Date;
  updateType: 'pattern_addition' | 'weight_adjustment' | 'rule_modification' | 'threshold_update';
  description: string;
  affectedPatterns: string[];
  impactMetrics: {
    accuracyImprovement: number;
    categoriesAffected: string[];
    testCasesImproved: number;
  };
  rollbackData?: Record<string, unknown>;
}

interface LearningMetrics {
  totalFeedbackEntries: number;
  accuracyImprovement: number;
  categoriesImproved: { [category: string]: number };
  patternsLearned: number;
  userContributions: number;
  automatedImprovements: number;
  modelUpdates: number;
  lastLearningCycle: Date;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  supportingPatterns: string[];
  conflictingPatterns: string[];
  recommendation: 'accept' | 'reject' | 'review';
}

interface LearningConfiguration {
  minFeedbackForPattern: number;
  patternConfidenceThreshold: number;
  autoUpdateThreshold: number;
  maxPatternsPerCategory: number;
  learningRateDecay: number;
  validationSampleSize: number;
}

export class SelfImprovingAIService {
  private static instance: SelfImprovingAIService;
  private feedbackEntries: FeedbackEntry[] = [];
  private learningPatterns: LearningPattern[] = [];
  private modelUpdates: ModelUpdate[] = [];
  
  private readonly config: LearningConfiguration = {
    minFeedbackForPattern: 3,
    patternConfidenceThreshold: 0.7,
    autoUpdateThreshold: 0.85,
    maxPatternsPerCategory: 50,
    learningRateDecay: 0.95,
    validationSampleSize: 100
  };

  // Pattern extraction weights
  private readonly extractionWeights = {
    exactMatch: 1.0,
    partialMatch: 0.7,
    contextMatch: 0.5,
    negativeMatch: -0.3
  };

  private constructor() {
    this.initializeLearningSystem();
  }

  public static getInstance(): SelfImprovingAIService {
    if (!SelfImprovingAIService.instance) {
      SelfImprovingAIService.instance = new SelfImprovingAIService();
    }
    return SelfImprovingAIService.instance;
  }

  /**
   * Initialize the learning system with base patterns
   */
  private initializeLearningSystem(): void {
    // Initialize with some base learning patterns
    this.learningPatterns = [
      {
        id: 'text-frame-carbon',
        patternType: 'text_pattern',
        category: 'frame',
        pattern: 'carbon.*fiber|cf.*frame|carbon.*racing',
        weight: 0.8,
        confidence: 0.9,
        supportingCases: 50,
        lastUpdated: new Date(),
        effectiveness: 0.95
      },
      {
        id: 'text-motor-kv',
        patternType: 'text_pattern',
        category: 'motor',
        pattern: '\\d+kv|\\d+\\s*kv|kv\\s*\\d+',
        weight: 0.85,
        confidence: 0.92,
        supportingCases: 75,
        lastUpdated: new Date(),
        effectiveness: 0.98
      },
      {
        id: 'text-battery-mah',
        patternType: 'text_pattern',
        category: 'battery',
        pattern: '\\d+mah|\\d+\\s*mah|mah\\s*\\d+|\\d+s\\s*lipo',
        weight: 0.9,
        confidence: 0.95,
        supportingCases: 100,
        lastUpdated: new Date(),
        effectiveness: 0.97
      }
    ];

    console.log('Self-improving AI system initialized with base patterns');
  }

  /**
   * Submit feedback for classification improvement
   */
  public async submitFeedback(feedback: Omit<FeedbackEntry, 'id' | 'timestamp'>): Promise<{
    feedbackId: string;
    processed: boolean;
    patternsUpdated: number;
    immediateImprovements: string[];
  }> {
    const feedbackEntry: FeedbackEntry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...feedback
    };

    this.feedbackEntries.push(feedbackEntry);

    // Process feedback immediately for pattern extraction
    const processingResult = await this.processFeedback(feedbackEntry);

    // Trigger learning cycle if enough new feedback accumulated
    if (this.shouldTriggerLearningCycle()) {
      await this.executeLearningCycle();
    }

    return {
      feedbackId: feedbackEntry.id,
      processed: processingResult.processed,
      patternsUpdated: processingResult.patternsUpdated,
      immediateImprovements: processingResult.improvements
    };
  }

  /**
   * Process individual feedback entry
   */
  private async processFeedback(feedback: FeedbackEntry): Promise<{
    processed: boolean;
    patternsUpdated: number;
    improvements: string[];
  }> {
    console.log(`Processing feedback: ${feedback.originalClassification} -> ${feedback.correctedClassification}`);

    const improvements: string[] = [];
    let patternsUpdated = 0;

    try {
      // Extract potential patterns from the feedback
      const extractedPatterns = this.extractPatternsFromFeedback(feedback);

      // Validate and integrate new patterns
      for (const pattern of extractedPatterns) {
        const validation = await this.validatePattern(pattern);
        
        if (validation.recommendation === 'accept') {
          const existing = this.learningPatterns.find(p => 
            p.category === pattern.category && 
            p.pattern === pattern.pattern
          );

          if (existing) {
            // Update existing pattern
            existing.supportingCases++;
            existing.confidence = Math.min(0.99, existing.confidence + 0.01);
            existing.weight = Math.min(1.0, existing.weight + 0.05);
            existing.lastUpdated = new Date();
            patternsUpdated++;
            improvements.push(`Strengthened pattern: ${pattern.pattern}`);
          } else if (this.learningPatterns.filter(p => p.category === pattern.category).length < this.config.maxPatternsPerCategory) {
            // Add new pattern
            this.learningPatterns.push({
              ...pattern,
              id: `learned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              lastUpdated: new Date(),
              effectiveness: 0.7 // Start with moderate effectiveness
            });
            patternsUpdated++;
            improvements.push(`Learned new pattern: ${pattern.pattern}`);
          }
        }
      }

      // Update negative patterns (things that shouldn't be classified as certain categories)
      if (feedback.feedbackType === 'correction') {
        await this.updateNegativePatterns(feedback);
      }

      return {
        processed: true,
        patternsUpdated,
        improvements
      };
    } catch (error) {
      console.error('Error processing feedback:', error);
      return {
        processed: false,
        patternsUpdated: 0,
        improvements: []
      };
    }
  }

  /**
   * Extract learning patterns from feedback
   */
  private extractPatternsFromFeedback(feedback: FeedbackEntry): Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] {
    const patterns: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] = [];
    const productName = feedback.productName.toLowerCase();
    const correctedCategory = feedback.correctedClassification;

    // Extract text patterns from product name
    const textPatterns = this.extractTextPatterns(productName, correctedCategory);
    patterns.push(...textPatterns);

    // Extract specification patterns if available
    if (feedback.additionalData?.specifications) {
      const specPatterns = this.extractSpecificationPatterns(feedback.additionalData.specifications, correctedCategory);
      patterns.push(...specPatterns);
    }

    // Extract context patterns
    const contextPatterns = this.extractContextPatterns(feedback);
    patterns.push(...contextPatterns);

    return patterns;
  }

  /**
   * Extract text patterns from product names
   */
  private extractTextPatterns(productName: string, category: string): Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] {
    const patterns: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] = [];
    
    // Look for category-specific keywords
    const categoryKeywords = {
      frame: ['frame', 'chassis', 'kit', 'quadcopter', 'racing', 'freestyle'],
      motor: ['motor', 'brushless', 'kv', 'stator', 'rotor', 'bell'],
      propeller: ['prop', 'propeller', 'blade', 'tri', 'inch', 'pitch'],
      battery: ['battery', 'lipo', 'mah', 'cell', 'discharge', 'voltage'],
      camera: ['camera', 'fpv', 'lens', 'cmos', 'resolution', 'latency'],
      stack: ['stack', 'fc', 'esc', 'pdb', 'osd', 'gyro', 'flight controller']
    };

    const relevantKeywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
    
    for (const keyword of relevantKeywords) {
      if (productName.includes(keyword)) {
        patterns.push({
          patternType: 'text_pattern',
          category,
          pattern: keyword,
          weight: 0.6,
          confidence: 0.7,
          supportingCases: 1
        });
      }
    }

    // Extract numeric patterns (sizes, specifications)
    const numericMatches = productName.match(/\d+(\.\d+)?\s*(mm|inch|kv|mah|s|v|a|w)/gi);
    if (numericMatches) {
      for (const match of numericMatches) {
        patterns.push({
          patternType: 'text_pattern',
          category,
          pattern: match.toLowerCase().replace(/\s+/g, '\\s*'),
          weight: 0.7,
          confidence: 0.75,
          supportingCases: 1
        });
      }
    }

    // Extract brand patterns
    const brandMatch = productName.match(/^([a-z]+)\s+/i);
    if (brandMatch) {
      patterns.push({
        patternType: 'text_pattern',
        category,
        pattern: `^${brandMatch[1].toLowerCase()}`,
        weight: 0.5,
        confidence: 0.6,
        supportingCases: 1
      });
    }

    return patterns;
  }

  /**
   * Extract patterns from specifications
   */
  private extractSpecificationPatterns(
    specifications: Record<string, string | number | boolean>, 
    category: string
  ): Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] {
    const patterns: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] = [];

    Object.entries(specifications).forEach(([key, value]) => {
      // Create specification-based patterns
      patterns.push({
        patternType: 'spec_pattern',
        category,
        pattern: `${key}:${value}`,
        weight: 0.8,
        confidence: 0.85,
        supportingCases: 1
      });
    });

    return patterns;
  }

  /**
   * Extract context patterns from feedback
   */
  private extractContextPatterns(feedback: FeedbackEntry): Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] {
    const patterns: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] = [];

    // Source-based patterns
    if (feedback.context.source === 'automated' && feedback.feedbackType === 'correction') {
      patterns.push({
        patternType: 'context_pattern',
        category: feedback.correctedClassification,
        pattern: `source:${feedback.context.source}`,
        weight: 0.3,
        confidence: 0.5,
        supportingCases: 1
      });
    }

    return patterns;
  }

  /**
   * Validate a learning pattern before integration
   */
  private async validatePattern(pattern: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>): Promise<ValidationResult> {
    // Check for conflicting patterns
    const conflictingPatterns = this.learningPatterns.filter(existing => 
      existing.category !== pattern.category && 
      existing.pattern === pattern.pattern
    );

    // Check for supporting patterns
    const supportingPatterns = this.learningPatterns.filter(existing =>
      existing.category === pattern.category &&
      (existing.pattern.includes(pattern.pattern) || pattern.pattern.includes(existing.pattern))
    );

    // Calculate validation confidence
    let confidence = pattern.confidence;
    
    // Reduce confidence if there are conflicts
    if (conflictingPatterns.length > 0) {
      confidence *= 0.5;
    }

    // Increase confidence if there are supporting patterns
    if (supportingPatterns.length > 0) {
      confidence = Math.min(0.99, confidence + 0.1);
    }

    // Make recommendation
    let recommendation: 'accept' | 'reject' | 'review';
    if (confidence >= this.config.patternConfidenceThreshold && conflictingPatterns.length === 0) {
      recommendation = 'accept';
    } else if (confidence < 0.4 || conflictingPatterns.length > 2) {
      recommendation = 'reject';
    } else {
      recommendation = 'review';
    }

    return {
      isValid: recommendation === 'accept',
      confidence,
      supportingPatterns: supportingPatterns.map(p => p.id),
      conflictingPatterns: conflictingPatterns.map(p => p.id),
      recommendation
    };
  }

  /**
   * Update negative patterns to avoid future misclassifications
   */
  private async updateNegativePatterns(feedback: FeedbackEntry): Promise<void> {
    // Find patterns that led to the wrong classification
    const incorrectPatterns = this.learningPatterns.filter(pattern => 
      pattern.category === feedback.originalClassification &&
      this.patternMatches(pattern, feedback.productName)
    );

    // Reduce weight of incorrect patterns
    for (const pattern of incorrectPatterns) {
      pattern.weight = Math.max(0.1, pattern.weight * 0.9);
      pattern.effectiveness = Math.max(0.1, pattern.effectiveness * 0.95);
      pattern.lastUpdated = new Date();
    }
  }

  /**
   * Check if a pattern matches a product name
   */
  private patternMatches(pattern: LearningPattern, productName: string): boolean {
    try {
      if (pattern.patternType === 'text_pattern') {
        const regex = new RegExp(pattern.pattern, 'i');
        return regex.test(productName);
      }
      // Add other pattern type matching logic here
      return false;
    } catch (error) {
      console.error('Error matching pattern:', error);
      return false;
    }
  }

  /**
   * Determine if a learning cycle should be triggered
   */
  private shouldTriggerLearningCycle(): boolean {
    const recentFeedback = this.feedbackEntries.filter(f => 
      f.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    return recentFeedback.length >= 10; // Trigger if 10+ feedback entries in last 24h
  }

  /**
   * Execute a complete learning cycle
   */
  public async executeLearningCycle(): Promise<{
    patternsUpdated: number;
    accuracyImprovement: number;
    newPatterns: number;
    optimizedPatterns: number;
  }> {
    console.log('Starting learning cycle...');

    let patternsUpdated = 0;
    let newPatterns = 0;
    let optimizedPatterns = 0;

    // 1. Analyze all feedback for pattern improvements
    const patternAnalysis = await this.analyzePatternEffectiveness();
    
    // 2. Optimize existing patterns
    const optimizationResults = await this.optimizePatterns(patternAnalysis);
    optimizedPatterns = optimizationResults.optimizedCount;

    // 3. Generate new patterns from accumulated feedback
    const newPatternResults = await this.generateNewPatterns();
    newPatterns = newPatternResults.newPatternsCount;

    // 4. Prune ineffective patterns
    const prunedCount = await this.pruneIneffectivePatterns();

    // 5. Update model weights
    await this.updateModelWeights();

    patternsUpdated = optimizedPatterns + newPatterns;

    // 6. Calculate accuracy improvement estimate
    const accuracyImprovement = await this.estimateAccuracyImprovement();

    // 7. Record the model update
    await this.recordModelUpdate({
      updateType: 'pattern_addition',
      description: `Learning cycle: ${newPatterns} new patterns, ${optimizedPatterns} optimized, ${prunedCount} pruned`,
      affectedPatterns: this.learningPatterns.map(p => p.id),
      impactMetrics: {
        accuracyImprovement,
        categoriesAffected: [...new Set(this.learningPatterns.map(p => p.category))],
        testCasesImproved: this.feedbackEntries.length
      }
    });

    console.log(`Learning cycle completed: ${patternsUpdated} patterns updated, estimated ${(accuracyImprovement * 100).toFixed(2)}% accuracy improvement`);

    return {
      patternsUpdated,
      accuracyImprovement,
      newPatterns,
      optimizedPatterns
    };
  }

  /**
   * Analyze effectiveness of existing patterns
   */
  private async analyzePatternEffectiveness(): Promise<{ [patternId: string]: number }> {
    const effectiveness: { [patternId: string]: number } = {};

    for (const pattern of this.learningPatterns) {
      // Count correct classifications using this pattern
      const correctMatches = this.feedbackEntries.filter(feedback =>
        feedback.correctedClassification === pattern.category &&
        this.patternMatches(pattern, feedback.productName)
      ).length;

      // Count incorrect classifications using this pattern
      const incorrectMatches = this.feedbackEntries.filter(feedback =>
        feedback.originalClassification === pattern.category &&
        feedback.correctedClassification !== pattern.category &&
        this.patternMatches(pattern, feedback.productName)
      ).length;

      // Calculate effectiveness
      const totalMatches = correctMatches + incorrectMatches;
      effectiveness[pattern.id] = totalMatches > 0 ? correctMatches / totalMatches : pattern.effectiveness;
    }

    return effectiveness;
  }

  /**
   * Optimize existing patterns based on feedback
   */
  private async optimizePatterns(effectiveness: { [patternId: string]: number }): Promise<{ optimizedCount: number }> {
    let optimizedCount = 0;

    for (const pattern of this.learningPatterns) {
      const currentEffectiveness = effectiveness[pattern.id];
      
      if (currentEffectiveness !== undefined && currentEffectiveness !== pattern.effectiveness) {
        // Update effectiveness
        pattern.effectiveness = currentEffectiveness;
        
        // Adjust weight based on effectiveness
        pattern.weight = pattern.weight * (0.5 + currentEffectiveness * 0.5);
        
        // Adjust confidence
        pattern.confidence = Math.min(0.99, pattern.confidence * (0.8 + currentEffectiveness * 0.2));
        
        pattern.lastUpdated = new Date();
        optimizedCount++;
      }
    }

    return { optimizedCount };
  }

  /**
   * Generate new patterns from recent feedback
   */
  private async generateNewPatterns(): Promise<{ newPatternsCount: number }> {
    const recentFeedback = this.feedbackEntries.filter(f => 
      f.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Group feedback by corrected classification
    const feedbackByCategory: { [category: string]: FeedbackEntry[] } = {};
    recentFeedback.forEach(feedback => {
      if (!feedbackByCategory[feedback.correctedClassification]) {
        feedbackByCategory[feedback.correctedClassification] = [];
      }
      feedbackByCategory[feedback.correctedClassification].push(feedback);
    });

    let newPatternsCount = 0;

    // Look for common patterns in each category
    for (const [category, feedbackList] of Object.entries(feedbackByCategory)) {
      if (feedbackList.length >= this.config.minFeedbackForPattern) {
        const commonPatterns = this.findCommonPatterns(feedbackList, category);
        
        for (const pattern of commonPatterns) {
          // Check if pattern already exists
          const exists = this.learningPatterns.some(existing => 
            existing.category === pattern.category && 
            existing.pattern === pattern.pattern
          );

          if (!exists) {
            this.learningPatterns.push({
              ...pattern,
              id: `auto-generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              lastUpdated: new Date(),
              effectiveness: 0.8 // Start with good effectiveness for auto-generated patterns
            });
            newPatternsCount++;
          }
        }
      }
    }

    return { newPatternsCount };
  }

  /**
   * Find common patterns in feedback entries
   */
  private findCommonPatterns(
    feedbackList: FeedbackEntry[], 
    category: string
  ): Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] {
    const patterns: Omit<LearningPattern, 'id' | 'lastUpdated' | 'effectiveness'>[] = [];
    const productNames = feedbackList.map(f => f.productName.toLowerCase());

    // Find common words
    const wordFrequency: { [word: string]: number } = {};
    productNames.forEach(name => {
      const words = name.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Ignore very short words
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
    });

    // Create patterns from frequently occurring words
    Object.entries(wordFrequency).forEach(([word, frequency]) => {
      const minFrequency = Math.max(2, Math.floor(feedbackList.length * 0.3));
      if (frequency >= minFrequency) {
        patterns.push({
          patternType: 'text_pattern',
          category,
          pattern: word,
          weight: 0.6 + (frequency / feedbackList.length) * 0.3,
          confidence: 0.7 + (frequency / feedbackList.length) * 0.2,
          supportingCases: frequency
        });
      }
    });

    return patterns;
  }

  /**
   * Remove patterns that are consistently ineffective
   */
  private async pruneIneffectivePatterns(): Promise<number> {
    const initialCount = this.learningPatterns.length;
    
    this.learningPatterns = this.learningPatterns.filter(pattern => {
      // Keep patterns that are either effective or haven't been tested enough
      return pattern.effectiveness > 0.3 || pattern.supportingCases < 5;
    });

    return initialCount - this.learningPatterns.length;
  }

  /**
   * Update model weights based on learning
   */
  private async updateModelWeights(): Promise<void> {
    // Apply learning rate decay
    this.learningPatterns.forEach(pattern => {
      pattern.weight *= this.config.learningRateDecay;
    });

    // Normalize weights within each category
    const categoriesProcessed = new Set<string>();
    
    for (const pattern of this.learningPatterns) {
      if (!categoriesProcessed.has(pattern.category)) {
        const categoryPatterns = this.learningPatterns.filter(p => p.category === pattern.category);
        const totalWeight = categoryPatterns.reduce((sum, p) => sum + p.weight, 0);
        
        if (totalWeight > 0) {
          categoryPatterns.forEach(p => {
            p.weight = p.weight / totalWeight;
          });
        }
        
        categoriesProcessed.add(pattern.category);
      }
    }
  }

  /**
   * Estimate accuracy improvement from learning
   */
  private async estimateAccuracyImprovement(): Promise<number> {
    // This is a simplified estimation
    // In a real system, you'd run validation tests
    
    const recentCorrections = this.feedbackEntries.filter(f => 
      f.feedbackType === 'correction' &&
      f.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentCorrections.length === 0) return 0;

    // Estimate how many of these corrections would now be classified correctly
    let potentialImprovements = 0;
    
    for (const correction of recentCorrections) {
      const matchingPatterns = this.learningPatterns.filter(pattern =>
        pattern.category === correction.correctedClassification &&
        this.patternMatches(pattern, correction.productName)
      );

      if (matchingPatterns.length > 0) {
        const totalWeight = matchingPatterns.reduce((sum, p) => sum + p.weight, 0);
        if (totalWeight > 0.5) { // Threshold for successful classification
          potentialImprovements++;
        }
      }
    }

    return potentialImprovements / recentCorrections.length;
  }

  /**
   * Record a model update for audit purposes
   */
  private async recordModelUpdate(update: Omit<ModelUpdate, 'id' | 'timestamp'>): Promise<void> {
    const modelUpdate: ModelUpdate = {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...update
    };

    this.modelUpdates.push(modelUpdate);

    // Keep only recent updates (last 1000)
    if (this.modelUpdates.length > 1000) {
      this.modelUpdates = this.modelUpdates.slice(-1000);
    }
  }

  /**
   * Get learning metrics and statistics
   */
  public getLearningMetrics(): LearningMetrics {
    const totalFeedbackEntries = this.feedbackEntries.length;
    const recentUpdates = this.modelUpdates.filter(u => 
      u.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const accuracyImprovement = recentUpdates.reduce((sum, update) => 
      sum + update.impactMetrics.accuracyImprovement, 0
    ) / Math.max(1, recentUpdates.length);

    const categoriesImproved: { [category: string]: number } = {};
    this.learningPatterns.forEach(pattern => {
      categoriesImproved[pattern.category] = (categoriesImproved[pattern.category] || 0) + 1;
    });

    const userContributions = this.feedbackEntries.filter(f => 
      f.context.source === 'manual' && f.userId
    ).length;

    const automatedImprovements = this.feedbackEntries.filter(f => 
      f.context.source === 'automated'
    ).length;

    const lastLearningCycle = this.modelUpdates.length > 0 ? 
      this.modelUpdates[this.modelUpdates.length - 1].timestamp : 
      new Date(0);

    return {
      totalFeedbackEntries,
      accuracyImprovement,
      categoriesImproved,
      patternsLearned: this.learningPatterns.length,
      userContributions,
      automatedImprovements,
      modelUpdates: this.modelUpdates.length,
      lastLearningCycle
    };
  }

  /**
   * Get current learning patterns for inspection
   */
  public getLearningPatterns(category?: string): LearningPattern[] {
    return category ? 
      this.learningPatterns.filter(p => p.category === category) :
      this.learningPatterns;
  }

  /**
   * Apply learned patterns to classify a product
   */
  public async applyLearnedClassification(
    productName: string
  ): Promise<{
    suggestedCategory: string;
    confidence: number;
    matchingPatterns: string[];
    learningBased: boolean;
  }> {
    const categoryScores: { [category: string]: number } = {};
    const matchingPatterns: string[] = [];

    // Apply all learned patterns
    for (const pattern of this.learningPatterns) {
      if (this.patternMatches(pattern, productName)) {
        categoryScores[pattern.category] = (categoryScores[pattern.category] || 0) + 
          pattern.weight * pattern.confidence * pattern.effectiveness;
        matchingPatterns.push(pattern.id);
      }
    }

    // Find best category
    const sortedCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1]);

    const suggestedCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'unknown';
    const confidence = sortedCategories.length > 0 ? Math.min(0.99, sortedCategories[0][1]) : 0;
    const learningBased = matchingPatterns.length > 0;

    return {
      suggestedCategory,
      confidence,
      matchingPatterns,
      learningBased
    };
  }

  /**
   * Export learning data for backup or analysis
   */
  public exportLearningData(): {
    patterns: LearningPattern[];
    feedbackSummary: {
      totalEntries: number;
      categoryCounts: { [category: string]: number };
      recentEntries: number;
    };
    modelUpdates: ModelUpdate[];
  } {
    const categoryCounts: { [category: string]: number } = {};
    this.feedbackEntries.forEach(feedback => {
      categoryCounts[feedback.correctedClassification] = 
        (categoryCounts[feedback.correctedClassification] || 0) + 1;
    });

    const recentEntries = this.feedbackEntries.filter(f => 
      f.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      patterns: this.learningPatterns,
      feedbackSummary: {
        totalEntries: this.feedbackEntries.length,
        categoryCounts,
        recentEntries
      },
      modelUpdates: this.modelUpdates
    };
  }
}