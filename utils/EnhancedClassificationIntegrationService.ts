/**
 * Enhanced Classification Integration Service
 * 
 * This service provides a bridge between the new Enhanced Classification Engine
 * and the existing system, allowing for gradual migration while maintaining
 * backward compatibility.
 */

import { EnhancedClassificationEngine, ClassificationResult as EnhancedResult, ProductContext } from './EnhancedClassificationEngine';
import { ComponentClassificationService, ClassificationResult as LegacyResult } from './ComponentClassificationService';
import { ClassificationCacheService } from './ClassificationCacheService';
import { ClassificationAnalyticsService } from './ClassificationAnalyticsService';

export interface IntegratedClassificationResult {
  // Primary result from enhanced engine
  enhanced: EnhancedResult;
  
  // Legacy result for comparison
  legacy?: LegacyResult;
  
  // Comparison analysis
  analysis: {
    agreement: boolean;
    confidenceDifference: number;
    recommendedResult: EnhancedResult;
    warnings: string[];
  };
  
  // Performance metrics
  performance: {
    processingTimeMs: number;
    methodUsed: string;
    accuracyScore: number;
  };
}

export class EnhancedClassificationIntegrationService {
  private static instance: EnhancedClassificationIntegrationService;
  private enhancedEngine: EnhancedClassificationEngine;
  private cacheService: ClassificationCacheService;
  private analyticsService: ClassificationAnalyticsService;
  
  // Known test cases for validation
  private static readonly TEST_CASES = [
    {
      name: "SpeedyBee Mario 5 Frame Kit - DC O4",
      description: "experience agile freestyle and smooth cinematic flight with the speedybee mario 5 dc o4 frame kit. built for dji o4, this 5-inch dc frame offers strong carbon fiber construction, clean cable routing, and pro-level compatibility—perfect for pilots who push limits. propeller compatibility: up to 5.1\"",
      expected: "frame" as const
    },
    {
      name: "T-Motor F60 Pro III 2207 2450KV Motor",
      description: "brushless motor with 2450kv rating and 2207 stator size for freestyle drones",
      expected: "motor" as const
    },
    {
      name: "Tattu 1550mAh 4S 75C LiPo Battery",
      description: "high performance 4s lipo battery with 1550mah capacity and xt60 connector",
      expected: "battery" as const
    },
    {
      name: "Gemfan 5152 3-Blade Propellers",
      description: "5152 three blade propellers for 5 inch freestyle drones",
      expected: "prop" as const
    },
    {
      name: "Matek F722-SE Flight Controller",
      description: "f722 flight controller with built-in pdb and betaflight osd",
      expected: "stack" as const
    }
  ];

  private constructor() {
    this.enhancedEngine = EnhancedClassificationEngine.getInstance();
    this.cacheService = ClassificationCacheService.getInstance();
    this.analyticsService = ClassificationAnalyticsService.getInstance();
  }

  public static getInstance(): EnhancedClassificationIntegrationService {
    if (!EnhancedClassificationIntegrationService.instance) {
      EnhancedClassificationIntegrationService.instance = new EnhancedClassificationIntegrationService();
    }
    return EnhancedClassificationIntegrationService.instance;
  }

  /**
   * Main classification method that uses enhanced engine with legacy comparison
   */
  public classifyProduct(
    name: string, 
    description: string = '', 
    additionalContext?: Partial<ProductContext>
  ): IntegratedClassificationResult {
    const startTime = Date.now();
    
    // Check cache first
    const cachedResult = this.cacheService.get(name, description, additionalContext);
    if (cachedResult) {
      // Return cached result wrapped in IntegratedClassificationResult format
      return {
        enhanced: cachedResult,
        legacy: undefined,
        analysis: {
          agreement: true,
          confidenceDifference: 0,
          recommendedResult: cachedResult,
          warnings: ['Using cached result']
        },
        performance: {
          processingTimeMs: Date.now() - startTime,
          methodUsed: 'cache',
          accuracyScore: cachedResult.confidence
        }
      };
    }
    
    // Create context for enhanced engine
    const context: ProductContext = {
      name,
      description,
      ...additionalContext
    };

    console.log(`🔬 Integrated Classification Service`);
    console.log(`📦 Product: "${name}"`);

    // Get enhanced classification
    const enhancedResult = this.enhancedEngine.classifyProduct(context);
    
    // Cache the result if confidence is high enough
    if (enhancedResult.confidence >= 70) {
      this.cacheService.set(name, enhancedResult, enhancedResult.confidence, description, additionalContext);
    }
    
    // Get legacy classification for comparison
    let legacyResult: LegacyResult | undefined;
    try {
      legacyResult = ComponentClassificationService.classifyComponent(name, description);
    } catch (error) {
      console.warn('Legacy classification failed:', error);
    }

    const processingTime = Date.now() - startTime;
    
    // Analyze results
    const analysis = this.analyzeResults(enhancedResult, legacyResult);
    
    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(
      enhancedResult, 
      processingTime
    );

    const result: IntegratedClassificationResult = {
      enhanced: enhancedResult,
      legacy: legacyResult,
      analysis,
      performance
    };

    this.logComparisonResults(result);
    
    // Log analytics event
    this.analyticsService.logClassification({
      productName: name,
      description,
      predictedCategory: enhancedResult.category,
      confidence: enhancedResult.confidence,
      method: enhancedResult.method,
      processingTimeMs: processingTime,
      cacheHit: false, // We already handled cache hits earlier
      source: 'api' // Default source, can be overridden by caller
    });
    
    return result;
  }

  private analyzeResults(
    enhanced: EnhancedResult, 
    legacy?: LegacyResult
  ): IntegratedClassificationResult['analysis'] {
    const warnings: string[] = [];
    
    if (!legacy) {
      warnings.push('Legacy classification unavailable');
      return {
        agreement: true, // Assume agreement if no legacy result
        confidenceDifference: 0,
        recommendedResult: enhanced,
        warnings
      };
    }

    const agreement = enhanced.category === legacy.category;
    const confidenceDifference = enhanced.confidence - legacy.confidence;

    // Analyze disagreements
    if (!agreement) {
      warnings.push(`Classification disagreement: Enhanced(${enhanced.category}) vs Legacy(${legacy.category})`);
      
      // Enhanced engine takes precedence for high confidence results
      if (enhanced.confidence >= 85) {
        warnings.push('Using enhanced result due to high confidence');
      } else if (legacy.confidence >= 85) {
        warnings.push('Consider legacy result due to high confidence');
      }
    }

    // Check for confidence discrepancies
    if (Math.abs(confidenceDifference) > 30) {
      warnings.push(`Large confidence difference: ${confidenceDifference.toFixed(1)}%`);
    }

    return {
      agreement,
      confidenceDifference,
      recommendedResult: enhanced, // Enhanced engine is always recommended
      warnings
    };
  }

  private calculatePerformanceMetrics(
    result: EnhancedResult,
    processingTime: number
  ): IntegratedClassificationResult['performance'] {
    // Calculate accuracy score based on confidence and method used
    let accuracyScore = result.confidence;
    
    // Boost score for more reliable methods
    switch (result.method) {
      case 'brand-definitive':
        accuracyScore = Math.min(99, accuracyScore + 5);
        break;
      case 'pattern-definitive':
        accuracyScore = Math.min(95, accuracyScore + 3);
        break;
      case 'semantic-name':
        accuracyScore = Math.min(90, accuracyScore + 2);
        break;
    }

    // Reduce score for fallback methods
    if (result.method.includes('weighted-combination')) {
      accuracyScore = Math.max(0, accuracyScore - 5);
    }

    return {
      processingTimeMs: processingTime,
      methodUsed: result.method,
      accuracyScore
    };
  }

  private logComparisonResults(result: IntegratedClassificationResult): void {
    console.log(`📊 === Classification Results ===`);
    console.log(`🎯 Enhanced: ${result.enhanced.category} (${result.enhanced.confidence}% via ${result.enhanced.method})`);
    
    if (result.legacy) {
      console.log(`🏛️ Legacy: ${result.legacy.category} (${result.legacy.confidence}%)`);
      console.log(`🤝 Agreement: ${result.analysis.agreement ? '✅ YES' : '❌ NO'}`);
      
      if (!result.analysis.agreement) {
        console.log(`⚖️ Confidence Difference: ${result.analysis.confidenceDifference.toFixed(1)}%`);
      }
    }
    
    console.log(`⚡ Performance: ${result.performance.processingTimeMs}ms, Score: ${result.performance.accuracyScore.toFixed(1)}%`);
    
    if (result.analysis.warnings.length > 0) {
      console.log(`⚠️ Warnings: ${result.analysis.warnings.join(', ')}`);
    }
    
    if (Object.keys(result.enhanced.specifications).length > 0) {
      console.log(`📋 Specs: ${JSON.stringify(result.enhanced.specifications)}`);
    }
  }

  /**
   * Run validation tests against known correct answers
   */
  public runValidationTests(): {
    totalTests: number;
    passedTests: number;
    failedTests: Array<{ test: typeof EnhancedClassificationIntegrationService.TEST_CASES[0], result: IntegratedClassificationResult }>;
    accuracyPercentage: number;
  } {
    console.log(`🧪 Running Enhanced Classification Validation Tests`);
    console.log(`📝 Test Cases: ${EnhancedClassificationIntegrationService.TEST_CASES.length}`);
    
    const results = {
      totalTests: EnhancedClassificationIntegrationService.TEST_CASES.length,
      passedTests: 0,
      failedTests: [] as Array<{ test: typeof EnhancedClassificationIntegrationService.TEST_CASES[0], result: IntegratedClassificationResult }>,
      accuracyPercentage: 0
    };

    for (const testCase of EnhancedClassificationIntegrationService.TEST_CASES) {
      console.log(`\n🔍 Testing: "${testCase.name}"`);
      
      const result = this.classifyProduct(testCase.name, testCase.description);
      const isCorrect = result.enhanced.category === testCase.expected;
      
      if (isCorrect) {
        results.passedTests++;
        console.log(`✅ PASSED: ${testCase.expected} (${result.enhanced.confidence}%)`);
      } else {
        results.failedTests.push({ test: testCase, result });
        console.log(`❌ FAILED: Expected ${testCase.expected}, got ${result.enhanced.category} (${result.enhanced.confidence}%)`);
      }
    }

    results.accuracyPercentage = (results.passedTests / results.totalTests) * 100;
    
    console.log(`\n📊 === Validation Summary ===`);
    console.log(`✅ Passed: ${results.passedTests}/${results.totalTests}`);
    console.log(`❌ Failed: ${results.failedTests.length}/${results.totalTests}`);
    console.log(`🎯 Accuracy: ${results.accuracyPercentage.toFixed(1)}%`);
    
    if (results.failedTests.length > 0) {
      console.log(`\n🔍 Failed Test Analysis:`);
      for (const failure of results.failedTests) {
        console.log(`   • "${failure.test.name}"`);
        console.log(`     Expected: ${failure.test.expected}, Got: ${failure.result.enhanced.category}`);
        console.log(`     Method: ${failure.result.enhanced.method}, Confidence: ${failure.result.enhanced.confidence}%`);
        console.log(`     Reasoning: ${failure.result.enhanced.reasoning.join(', ')}`);
      }
    }

    return results;
  }

  /**
   * Get classification with confidence threshold
   * Returns null if confidence is below threshold
   */
  public classifyWithThreshold(
    name: string,
    description: string = '',
    minConfidence: number = 80,
    additionalContext?: Partial<ProductContext>
  ): IntegratedClassificationResult | null {
    const result = this.classifyProduct(name, description, additionalContext);
    
    if (result.enhanced.confidence >= minConfidence) {
      return result;
    }
    
    console.log(`⚠️ Classification below threshold: ${result.enhanced.confidence}% < ${minConfidence}%`);
    return null;
  }

  /**
   * Batch classification for multiple products
   */
  public classifyBatch(
    products: Array<{ name: string; description?: string; context?: Partial<ProductContext> }>
  ): Array<IntegratedClassificationResult> {
    console.log(`📦 Batch classifying ${products.length} products`);
    const startTime = Date.now();
    
    const results = products.map((product, index) => {
      console.log(`\n[${index + 1}/${products.length}]`);
      return this.classifyProduct(
        product.name, 
        product.description || '', 
        product.context
      );
    });

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / products.length;
    
    console.log(`\n📊 Batch Classification Summary:`);
    console.log(`⚡ Total Time: ${totalTime}ms`);
    console.log(`⚡ Average Time: ${avgTime.toFixed(1)}ms per product`);
    
    const categories = results.reduce((acc, result) => {
      acc[result.enhanced.category] = (acc[result.enhanced.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📊 Category Distribution:`);
    for (const [category, count] of Object.entries(categories)) {
      console.log(`   ${category}: ${count} products`);
    }

    return results;
  }

  /**
   * Get cache performance statistics
   */
  public getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Get cache performance metrics
   */
  public getCacheMetrics() {
    return this.cacheService.getPerformanceMetrics();
  }

  /**
   * Clear classification cache
   */
  public clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Get analytics report
   */
  public getAnalyticsReport(timeRangeHours: number = 24) {
    return this.analyticsService.generateReport(timeRangeHours);
  }

  /**
   * Record user feedback for classification accuracy
   */
  public recordFeedback(productName: string, predictedCategory: string, actualCategory: string, feedback: 'correct' | 'incorrect' | 'improved'): void {
    this.analyticsService.recordFeedback(productName, predictedCategory, actualCategory, feedback);
  }

  /**
   * Get recent classification events
   */
  public getRecentEvents(limit: number = 100) {
    return this.analyticsService.getRecentEvents(limit);
  }

  /**
   * Legacy compatibility method - returns result in old format
   */
  public classifyLegacyFormat(name: string, description: string = ''): {
    category: string;
    confidence: number;
    reasons: string[];
  } {
    const result = this.classifyProduct(name, description);
    
    return {
      category: result.enhanced.category,
      confidence: result.enhanced.confidence,
      reasons: result.enhanced.reasoning
    };
  }
}

// Export singleton instance for easy use
export const enhancedClassificationService = EnhancedClassificationIntegrationService.getInstance();