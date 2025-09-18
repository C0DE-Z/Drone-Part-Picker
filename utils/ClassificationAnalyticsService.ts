/**
 * Classification Analytics Service
 * 
 * Provides comprehensive monitoring, analytics, and performance tracking
 * for the enhanced classification system. Tracks accuracy, performance,
 * usage patterns, and provides insights for continuous improvement.
 */

import { createHash } from 'crypto';

export interface ClassificationEvent {
  id: string;
  timestamp: number;
  productName: string;
  description?: string;
  predictedCategory: string;
  actualCategory?: string;
  confidence: number;
  method: string;
  processingTimeMs: number;
  cacheHit: boolean;
  isCorrect?: boolean;
  userFeedback?: 'correct' | 'incorrect' | 'improved';
  source: 'scraping' | 'manual' | 'game' | 'api';
}

export interface AccuracyMetrics {
  totalClassifications: number;
  correctClassifications: number;
  accuracyPercentage: number;
  confidenceDistribution: Record<string, number>;
  categoryAccuracy: Record<string, number>;
  methodAccuracy: Record<string, number>;
  timeRange: {
    start: number;
    end: number;
  };
}

export interface PerformanceMetrics {
  averageProcessingTime: number;
  cacheHitRate: number;
  throughputPerHour: number;
  errorRate: number;
  slowestCategories: Array<{category: string, avgTime: number}>;
  fastestCategories: Array<{category: string, avgTime: number}>;
}

export interface UsagePatterns {
  categoriesDistribution: Record<string, number>;
  sourcesDistribution: Record<string, number>;
  hourlyUsage: Record<string, number>;
  topProducts: Array<{name: string, count: number, accuracy: number}>;
  commonErrors: Array<{predicted: string, actual: string, count: number}>;
}

export interface AnalyticsReport {
  accuracy: AccuracyMetrics;
  performance: PerformanceMetrics;
  usage: UsagePatterns;
  insights: string[];
  recommendations: string[];
  generateTime: number;
}

export class ClassificationAnalyticsService {
  private static instance: ClassificationAnalyticsService;
  private events: ClassificationEvent[] = [];
  private maxEvents = 50000; // Keep last 50k events in memory
  
  // Performance tracking
  private performanceCounters = {
    totalRequests: 0,
    totalProcessingTime: 0,
    cacheHits: 0,
    errors: 0
  };

  private constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  public static getInstance(): ClassificationAnalyticsService {
    if (!ClassificationAnalyticsService.instance) {
      ClassificationAnalyticsService.instance = new ClassificationAnalyticsService();
    }
    return ClassificationAnalyticsService.instance;
  }

  /**
   * Log a classification event
   */
  public logClassification(event: Omit<ClassificationEvent, 'id' | 'timestamp'>): void {
    const classificationEvent: ClassificationEvent = {
      ...event,
      id: this.generateEventId(event.productName, event.predictedCategory),
      timestamp: Date.now()
    };

    this.events.push(classificationEvent);
    this.updatePerformanceCounters(classificationEvent);

    // Maintain event limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log significant events
    if (event.confidence < 70) {
      console.log(`⚠️ Low confidence classification: "${event.productName}" -> ${event.predictedCategory} (${event.confidence}%)`);
    }

    if (event.isCorrect === false) {
      console.log(`❌ Incorrect classification: "${event.productName}" predicted as ${event.predictedCategory}, actually ${event.actualCategory}`);
    }
  }

  /**
   * Record user feedback for a classification
   */
  public recordFeedback(
    productName: string, 
    predictedCategory: string, 
    actualCategory: string, 
    feedback: 'correct' | 'incorrect' | 'improved'
  ): void {
    // Find the corresponding event
    const eventIndex = this.events.findIndex(event => 
      event.productName === productName && event.predictedCategory === predictedCategory
    );

    if (eventIndex !== -1) {
      this.events[eventIndex].actualCategory = actualCategory;
      this.events[eventIndex].userFeedback = feedback;
      this.events[eventIndex].isCorrect = feedback === 'correct' || 
        (feedback === 'improved' && predictedCategory === actualCategory);
      
      console.log(`📝 User feedback recorded: "${productName}" ${feedback}`);
    } else {
      // Create a new feedback event
      this.logClassification({
        productName,
        predictedCategory,
        actualCategory,
        confidence: 0, // Unknown for feedback-only events
        method: 'user_feedback',
        processingTimeMs: 0,
        cacheHit: false,
        isCorrect: feedback === 'correct',
        userFeedback: feedback,
        source: 'manual'
      });
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  public generateReport(timeRangeHours: number = 24): AnalyticsReport {
    const startTime = Date.now();
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    const relevantEvents = this.events.filter(event => event.timestamp >= cutoffTime);

    console.log(`📊 Generating analytics report for ${relevantEvents.length} events in last ${timeRangeHours}h`);

    const accuracy = this.calculateAccuracyMetrics(relevantEvents);
    const performance = this.calculatePerformanceMetrics(relevantEvents);
    const usage = this.calculateUsagePatterns(relevantEvents);
    const insights = this.generateInsights(accuracy, performance, usage);
    const recommendations = this.generateRecommendations(accuracy, performance, usage);

    return {
      accuracy,
      performance,
      usage,
      insights,
      recommendations,
      generateTime: Date.now() - startTime
    };
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(events: ClassificationEvent[]): AccuracyMetrics {
    const eventsWithFeedback = events.filter(event => event.isCorrect !== undefined);
    const correctClassifications = eventsWithFeedback.filter(event => event.isCorrect).length;
    
    const accuracyPercentage = eventsWithFeedback.length > 0 
      ? (correctClassifications / eventsWithFeedback.length) * 100 
      : 0;

    // Confidence distribution
    const confidenceRanges = ['0-50', '50-70', '70-85', '85-95', '95-100'];
    const confidenceDistribution = confidenceRanges.reduce((acc, range) => {
      acc[range] = 0;
      return acc;
    }, {} as Record<string, number>);

    events.forEach(event => {
      const confidence = event.confidence;
      if (confidence < 50) confidenceDistribution['0-50']++;
      else if (confidence < 70) confidenceDistribution['50-70']++;
      else if (confidence < 85) confidenceDistribution['70-85']++;
      else if (confidence < 95) confidenceDistribution['85-95']++;
      else confidenceDistribution['95-100']++;
    });

    // Category accuracy
    const categoryAccuracy: Record<string, number> = {};
    const categoryStats: Record<string, {correct: number, total: number}> = {};

    eventsWithFeedback.forEach(event => {
      if (!categoryStats[event.predictedCategory]) {
        categoryStats[event.predictedCategory] = {correct: 0, total: 0};
      }
      categoryStats[event.predictedCategory].total++;
      if (event.isCorrect) {
        categoryStats[event.predictedCategory].correct++;
      }
    });

    Object.entries(categoryStats).forEach(([category, stats]) => {
      categoryAccuracy[category] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    // Method accuracy
    const methodAccuracy: Record<string, number> = {};
    const methodStats: Record<string, {correct: number, total: number}> = {};

    eventsWithFeedback.forEach(event => {
      if (!methodStats[event.method]) {
        methodStats[event.method] = {correct: 0, total: 0};
      }
      methodStats[event.method].total++;
      if (event.isCorrect) {
        methodStats[event.method].correct++;
      }
    });

    Object.entries(methodStats).forEach(([method, stats]) => {
      methodAccuracy[method] = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    return {
      totalClassifications: events.length,
      correctClassifications,
      accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
      confidenceDistribution,
      categoryAccuracy,
      methodAccuracy,
      timeRange: {
        start: events.length > 0 ? Math.min(...events.map(e => e.timestamp)) : Date.now(),
        end: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : Date.now()
      }
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(events: ClassificationEvent[]): PerformanceMetrics {
    const processingTimes = events.map(event => event.processingTimeMs);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const cacheHits = events.filter(event => event.cacheHit).length;
    const cacheHitRate = events.length > 0 ? (cacheHits / events.length) * 100 : 0;

    const timeSpanHours = events.length > 1 
      ? (Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp))) / (1000 * 60 * 60)
      : 1;
    const throughputPerHour = timeSpanHours > 0 ? events.length / timeSpanHours : 0;

    const errors = events.filter(event => event.isCorrect === false).length;
    const errorRate = events.length > 0 ? (errors / events.length) * 100 : 0;

    // Category performance analysis
    const categoryTimes: Record<string, number[]> = {};
    events.forEach(event => {
      if (!categoryTimes[event.predictedCategory]) {
        categoryTimes[event.predictedCategory] = [];
      }
      categoryTimes[event.predictedCategory].push(event.processingTimeMs);
    });

    const categoryAvgTimes = Object.entries(categoryTimes).map(([category, times]) => ({
      category,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }));

    const slowestCategories = categoryAvgTimes
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 3);

    const fastestCategories = categoryAvgTimes
      .sort((a, b) => a.avgTime - b.avgTime)
      .slice(0, 3);

    return {
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      throughputPerHour: Math.round(throughputPerHour * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowestCategories,
      fastestCategories
    };
  }

  /**
   * Calculate usage patterns
   */
  private calculateUsagePatterns(events: ClassificationEvent[]): UsagePatterns {
    // Categories distribution
    const categoriesDistribution: Record<string, number> = {};
    events.forEach(event => {
      categoriesDistribution[event.predictedCategory] = (categoriesDistribution[event.predictedCategory] || 0) + 1;
    });

    // Sources distribution
    const sourcesDistribution: Record<string, number> = {};
    events.forEach(event => {
      sourcesDistribution[event.source] = (sourcesDistribution[event.source] || 0) + 1;
    });

    // Hourly usage
    const hourlyUsage: Record<string, number> = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours().toString();
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
    });

    // Top products by frequency
    const productCounts: Record<string, {count: number, correctCount: number}> = {};
    events.forEach(event => {
      if (!productCounts[event.productName]) {
        productCounts[event.productName] = {count: 0, correctCount: 0};
      }
      productCounts[event.productName].count++;
      if (event.isCorrect === true) {
        productCounts[event.productName].correctCount++;
      }
    });

    const topProducts = Object.entries(productCounts)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        accuracy: stats.count > 0 ? (stats.correctCount / stats.count) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Common classification errors
    const errorCounts: Record<string, number> = {};
    events.forEach(event => {
      if (event.isCorrect === false && event.actualCategory) {
        const errorKey = `${event.predictedCategory}->${event.actualCategory}`;
        errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
      }
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([errorKey, count]) => {
        const [predicted, actual] = errorKey.split('->');
        return {predicted, actual, count};
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      categoriesDistribution,
      sourcesDistribution,
      hourlyUsage,
      topProducts,
      commonErrors
    };
  }

  /**
   * Generate insights from analytics data
   */
  private generateInsights(accuracy: AccuracyMetrics, performance: PerformanceMetrics, usage: UsagePatterns): string[] {
    const insights: string[] = [];

    // Accuracy insights
    if (accuracy.accuracyPercentage >= 95) {
      insights.push(`🎯 Exceptional accuracy achieved: ${accuracy.accuracyPercentage}%`);
    } else if (accuracy.accuracyPercentage >= 90) {
      insights.push(`✅ Good accuracy: ${accuracy.accuracyPercentage}%`);
    } else {
      insights.push(`⚠️ Accuracy needs improvement: ${accuracy.accuracyPercentage}%`);
    }

    // Performance insights
    if (performance.cacheHitRate >= 60) {
      insights.push(`⚡ Excellent cache performance: ${performance.cacheHitRate}% hit rate`);
    } else if (performance.cacheHitRate >= 30) {
      insights.push(`📊 Moderate cache utilization: ${performance.cacheHitRate}% hit rate`);
    } else {
      insights.push(`💾 Low cache utilization: ${performance.cacheHitRate}% hit rate`);
    }

    // Processing time insights
    if (performance.averageProcessingTime < 100) {
      insights.push(`🚀 Fast processing: ${performance.averageProcessingTime}ms average`);
    } else if (performance.averageProcessingTime < 500) {
      insights.push(`⏱️ Moderate processing speed: ${performance.averageProcessingTime}ms average`);
    } else {
      insights.push(`🐌 Slow processing detected: ${performance.averageProcessingTime}ms average`);
    }

    // Usage pattern insights
    const topCategory = Object.entries(usage.categoriesDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    if (topCategory) {
      insights.push(`📈 Most classified category: ${topCategory[0]} (${topCategory[1]} classifications)`);
    }

    // Error pattern insights
    if (usage.commonErrors.length > 0) {
      const topError = usage.commonErrors[0];
      insights.push(`❗ Most common error: ${topError.predicted} → ${topError.actual} (${topError.count} occurrences)`);
    }

    return insights;
  }

  /**
   * Generate recommendations based on analytics
   */
  private generateRecommendations(accuracy: AccuracyMetrics, performance: PerformanceMetrics, usage: UsagePatterns): string[] {
    const recommendations: string[] = [];

    // Accuracy recommendations
    if (accuracy.accuracyPercentage < 95) {
      recommendations.push('Consider retraining classification patterns for categories with low accuracy');
    }

    // Performance recommendations
    if (performance.cacheHitRate < 40) {
      recommendations.push('Increase cache TTL or improve cache key strategy to boost hit rate');
    }

    if (performance.averageProcessingTime > 200) {
      recommendations.push('Optimize classification algorithms or add more aggressive caching');
    }

    // Category-specific recommendations
    const poorAccuracyCategories = Object.entries(accuracy.categoryAccuracy)
      .filter(([, acc]) => acc < 90)
      .map(([cat]) => cat);

    if (poorAccuracyCategories.length > 0) {
      recommendations.push(`Focus improvement efforts on: ${poorAccuracyCategories.join(', ')}`);
    }

    // Error pattern recommendations
    if (usage.commonErrors.length > 0) {
      recommendations.push('Review and improve classification rules for common error patterns');
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private generateEventId(productName: string, category: string): string {
    return createHash('sha256')
      .update(`${productName}-${category}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
  }

  private updatePerformanceCounters(event: ClassificationEvent): void {
    this.performanceCounters.totalRequests++;
    this.performanceCounters.totalProcessingTime += event.processingTimeMs;
    
    if (event.cacheHit) {
      this.performanceCounters.cacheHits++;
    }
    
    if (event.isCorrect === false) {
      this.performanceCounters.errors++;
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up old events every hour
    setInterval(() => {
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Keep 7 days
      const initialLength = this.events.length;
      this.events = this.events.filter(event => event.timestamp >= cutoffTime);
      
      if (this.events.length < initialLength) {
        console.log(`🧹 Cleaned up ${initialLength - this.events.length} old analytics events`);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * Public methods for external access
   */
  public getRecentEvents(limit: number = 100): ClassificationEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getEventsByCategory(category: string): ClassificationEvent[] {
    return this.events.filter(event => event.predictedCategory === category);
  }

  public getEventsByAccuracy(minAccuracy: number): ClassificationEvent[] {
    return this.events.filter(event => 
      event.isCorrect !== undefined && 
      (event.isCorrect ? 100 : 0) >= minAccuracy
    );
  }

  public exportData(): ClassificationEvent[] {
    return [...this.events];
  }

  public importData(events: ClassificationEvent[]): void {
    this.events = [...events];
    console.log(`📊 Imported ${events.length} analytics events`);
  }

  public clearData(): void {
    this.events = [];
    this.performanceCounters = {
      totalRequests: 0,
      totalProcessingTime: 0,
      cacheHits: 0,
      errors: 0
    };
    console.log('🧽 Analytics data cleared');
  }
}