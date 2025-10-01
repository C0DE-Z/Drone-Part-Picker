// Simple in-memory cache implementation for the drone part picker
type CacheValue = unknown;

interface CachedItem<T = CacheValue> {
  data: T;
  expiry: number;
}

class SimpleCacheService {
  private cache = new Map<string, CachedItem>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes (server-side only)
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  private generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `drone-picker:${prefix}:${parts.join(':')}`;
  }

  set<T = CacheValue>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiry });
  }

  get<T = CacheValue>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Performance calculation caching
  cachePerformanceCalculation(
    componentsHash: string, 
    performance: Record<string, unknown>, 
    ttlSeconds: number = 3600
  ): void {
    const key = this.generateKey('performance', componentsHash);
    this.set(key, performance, ttlSeconds);
  }

  getCachedPerformanceCalculation(componentsHash: string): Record<string, unknown> | null {
    const key = this.generateKey('performance', componentsHash);
    return this.get(key);
  }

  // Component data caching
  cacheComponentData(
    type: string, 
    data: Record<string, unknown>[], 
    ttlSeconds: number = 1800
  ): void {
    const key = this.generateKey('components', type);
    this.set(key, data, ttlSeconds);
  }

  getCachedComponentData(type: string): Record<string, unknown>[] | null {
    const key = this.generateKey('components', type);
    return this.get(key);
  }

  // Product price caching
  cacheProductPrices(
    productId: string, 
    prices: Record<string, unknown>[], 
    ttlSeconds: number = 600
  ): void {
    const key = this.generateKey('prices', productId);
    this.set(key, prices, ttlSeconds);
  }

  getCachedProductPrices(productId: string): Record<string, unknown>[] | null {
    const key = this.generateKey('prices', productId);
    return this.get(key);
  }

  // User builds caching
  cacheUserBuilds(
    userId: string, 
    builds: Record<string, unknown>[], 
    ttlSeconds: number = 300
  ): void {
    const key = this.generateKey('user-builds', userId);
    this.set(key, builds, ttlSeconds);
  }

  getCachedUserBuilds(userId: string): Record<string, unknown>[] | null {
    const key = this.generateKey('user-builds', userId);
    return this.get(key);
  }

  // Public builds caching
  cachePublicBuilds(
    page: number,
    limit: number,
    builds: Record<string, unknown>[],
    ttlSeconds: number = 180
  ): void {
    const key = this.generateKey('public-builds', page, limit);
    this.set(key, builds, ttlSeconds);
  }

  getCachedPublicBuilds(page: number, limit: number): Record<string, unknown>[] | null {
    const key = this.generateKey('public-builds', page, limit);
    return this.get(key);
  }

  // Search results caching
  cacheSearchResults(
    query: string,
    category: string,
    results: Record<string, unknown>[],
    ttlSeconds: number = 900
  ): void {
    const key = this.generateKey('search', encodeURIComponent(query), category);
    this.set(key, results, ttlSeconds);
  }

  getCachedSearchResults(query: string, category: string): Record<string, unknown>[] | null {
    const key = this.generateKey('search', encodeURIComponent(query), category);
    return this.get(key);
  }

  // Aggregate data caching
  cacheAggregateData(
    type: 'stats' | 'analytics' | 'leaderboard',
    data: Record<string, unknown>,
    ttlSeconds: number = 1800
  ): void {
    const key = this.generateKey('aggregate', type);
    this.set(key, data, ttlSeconds);
  }

  getCachedAggregateData(
    type: 'stats' | 'analytics' | 'leaderboard'
  ): Record<string, unknown> | null {
    const key = this.generateKey('aggregate', type);
    return this.get(key);
  }

  // Cache invalidation methods
  invalidateUserCache(userId: string): void {
    const patterns = [
      this.generateKey('user-builds', userId),
      this.generateKey('user-stats', userId)
    ];

    for (const pattern of patterns) {
      this.delete(pattern);
    }
  }

  invalidateComponentCache(type?: string): void {
    if (type) {
      this.delete(this.generateKey('components', type));
    } else {
      // Clear all component caches
      const types = ['motors', 'frames', 'stacks', 'cameras', 'props', 'batteries'];
      for (const componentType of types) {
        this.delete(this.generateKey('components', componentType));
      }
    }
  }

  invalidateProductCache(productId?: string): void {
    if (productId) {
      this.delete(this.generateKey('prices', productId));
    }
  }

  // Cache statistics
  getCacheStats(): {
    entries: number;
    size: string;
  } {
    const entries = this.cache.size;
    const sizeInBytes = JSON.stringify(Array.from(this.cache.entries())).length;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    return {
      entries,
      size: `${sizeInMB} MB`
    };
  }

  // Cleanup method to be called on app shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Create a single instance to be used across the application
export const cacheService = new SimpleCacheService();

// Utility function to create cache keys for performance calculations
export function createPerformanceHash(components: Record<string, unknown>): string {
  // Create a consistent hash from component selection
  const sortedKeys = Object.keys(components).sort();
  const hashData = sortedKeys.map(key => `${key}:${JSON.stringify(components[key])}`).join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Cache decorator for automatic caching of method results
export function cached(ttlSeconds: number = 300) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = `method:${(target as { constructor: { name: string } }).constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      let result = cacheService.get(cacheKey);
      if (result !== null) {
        return result;
      }

      // Execute method and cache result
      result = await method.apply(this, args);
      cacheService.set(cacheKey, result, ttlSeconds);
      
      return result;
    };
  };
}

export default cacheService;