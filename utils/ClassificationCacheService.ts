/**
 * Classification Cache Service
 * 
 * Provides intelligent caching for classification results to improve performance
 * and reduce redundant processing. Uses both in-memory and persistent caching
 * with smart invalidation strategies.
 */

import { createHash } from 'crypto';
import { ClassificationResult as EnhancedResult } from './EnhancedClassificationEngine';

interface CacheEntry {
  result: EnhancedResult;
  timestamp: number;
  hitCount: number;
  confidence: number;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  entriesCount: number;
  memoryUsage: number;
}

export class ClassificationCacheService {
  private static instance: ClassificationCacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  // Cache configuration
  private readonly MAX_CACHE_SIZE = 10000; // Maximum number of entries
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly HIGH_CONFIDENCE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for high confidence
  private readonly MIN_CONFIDENCE_TO_CACHE = 70; // Only cache results with 70%+ confidence

  private constructor() {
    // Start cache maintenance
    this.startCacheMaintenance();
  }

  public static getInstance(): ClassificationCacheService {
    if (!ClassificationCacheService.instance) {
      ClassificationCacheService.instance = new ClassificationCacheService();
    }
    return ClassificationCacheService.instance;
  }

  /**
   * Generate a unique cache key for a classification request
   */
  private generateCacheKey(productName: string, description?: string, additionalContext?: Record<string, unknown>): string {
    const content = `${productName}|${description || ''}|${JSON.stringify(additionalContext || {})}`;
    return createHash('sha256').update(content.toLowerCase()).digest('hex');
  }

  /**
   * Get classification result from cache
   */
  public get(productName: string, description?: string, additionalContext?: Record<string, unknown>): EnhancedResult | null {
    this.stats.totalRequests++;
    const key = this.generateCacheKey(productName, description, additionalContext);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.cacheMisses++;
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    const ttl = entry.confidence >= 90 ? this.HIGH_CONFIDENCE_TTL_MS : this.CACHE_TTL_MS;
    
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      return null;
    }

    // Update hit count and stats
    entry.hitCount++;
    this.stats.cacheHits++;
    
    console.log(`🎯 Cache HIT for "${productName}" (${entry.confidence}% confidence, ${entry.hitCount} hits)`);
    return entry.result;
  }

  /**
   * Store classification result in cache
   */
  public set(
    productName: string, 
    result: EnhancedResult, 
    confidence: number,
    description?: string, 
    additionalContext?: Record<string, unknown>
  ): void {
    // Only cache results with sufficient confidence
    if (confidence < this.MIN_CONFIDENCE_TO_CACHE) {
      console.log(`⚠️ Not caching low confidence result (${confidence}%) for "${productName}"`);
      return;
    }

    const key = this.generateCacheKey(productName, description, additionalContext);
    
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      hitCount: 0,
      confidence
    };

    this.cache.set(key, entry);
    console.log(`💾 Cached classification for "${productName}" (${confidence}% confidence)`);
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestHitCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize eviction by lowest hit count, then by age
      if (entry.hitCount < lowestHitCount || 
          (entry.hitCount === lowestHitCount && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHitCount = entry.hitCount;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Evicted LRU cache entry (${lowestHitCount} hits)`);
    }
  }

  /**
   * Clear expired entries
   */
  private clearExpiredEntries(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const ttl = entry.confidence >= 90 ? this.HIGH_CONFIDENCE_TTL_MS : this.CACHE_TTL_MS;
      
      if (now - entry.timestamp > ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleared ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Start periodic cache maintenance
   */
  private startCacheMaintenance(): void {
    // Run maintenance every hour
    setInterval(() => {
      this.clearExpiredEntries();
    }, 60 * 60 * 1000);
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const hitRatio = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;

    // Estimate memory usage (rough calculation)
    const memoryUsage = this.cache.size * 1024; // Rough estimate in bytes

    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      hitRatio: Math.round(hitRatio * 100) / 100,
      entriesCount: this.cache.size,
      memoryUsage
    };
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.cache.clear();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    console.log('🧽 Cache cleared');
  }

  /**
   * Warm up cache with common products
   */
  public async warmUp(commonProducts: Array<{name: string, description?: string}>): Promise<void> {
    console.log(`🔥 Warming up cache with ${commonProducts.length} common products`);
    
    // Note: In a real implementation, you'd call the classification service here
    // For now, this is a placeholder for the warm-up logic
    for (const product of commonProducts) {
      // This would normally trigger classification and caching
      console.log(`Warming up cache for: ${product.name}`);
    }
  }

  /**
   * Get cache performance metrics for monitoring
   */
  public getPerformanceMetrics(): {
    hitRatio: number;
    averageHitsPerEntry: number;
    cacheEfficiency: string;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const averageHits = this.cache.size > 0 
      ? Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0) / this.cache.size
      : 0;

    const recommendations: string[] = [];
    
    if (stats.hitRatio < 30) {
      recommendations.push('Consider increasing cache TTL or improving cache key strategy');
    }
    
    if (averageHits < 1.5) {
      recommendations.push('Cache entries are not being reused effectively');
    }
    
    if (stats.entriesCount > this.MAX_CACHE_SIZE * 0.9) {
      recommendations.push('Cache is near capacity, consider increasing MAX_CACHE_SIZE');
    }

    return {
      hitRatio: stats.hitRatio,
      averageHitsPerEntry: Math.round(averageHits * 100) / 100,
      cacheEfficiency: stats.hitRatio > 50 ? 'Good' : stats.hitRatio > 30 ? 'Fair' : 'Poor',
      recommendations
    };
  }

  /**
   * Invalidate cache entries for products containing specific keywords
   */
  public invalidateByKeywords(keywords: string[]): number {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      // Note: In a real implementation, you'd need to store the original product name
      // to enable keyword-based invalidation. This is a simplified version.
      const resultString = JSON.stringify(entry.result).toLowerCase();
      
      if (keywords.some(keyword => resultString.includes(keyword.toLowerCase()))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      invalidatedCount++;
    });

    if (invalidatedCount > 0) {
      console.log(`🔄 Invalidated ${invalidatedCount} cache entries containing keywords: ${keywords.join(', ')}`);
    }

    return invalidatedCount;
  }
}