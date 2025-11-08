/**
 * Cache Manager for Linear Toolkit
 * Provides in-memory caching with TTL support and hit/miss tracking
 */
export interface CacheEntry<T> {
    key: string;
    value: T;
    expiresAt: Date;
    hits: number;
    createdAt: Date;
}
export declare class CacheManager {
    private cache;
    private ttl;
    private maxSize;
    private hits;
    private misses;
    private logger;
    constructor(ttl?: number, maxSize?: number);
    /**
     * Get a value from cache
     */
    get<T>(key: string): T | undefined;
    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttl?: number): void;
    /**
     * Check if a key exists in cache and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete a key from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hits: number;
        misses: number;
        total: number;
        hitRate: number;
        utilizationPercent: number;
    };
    /**
     * Get cache entries sorted by hit count (for monitoring)
     */
    getHotEntries(limit?: number): Array<{
        key: string;
        hits: number;
        age: number;
    }>;
    /**
     * Invalidate all entries matching a pattern
     */
    invalidatePattern(pattern: RegExp): number;
    /**
     * Get the oldest cache entry key
     */
    private getOldestKey;
}
/**
 * Get the global cache instance
 */
export declare function getCache(): CacheManager;
/**
 * Initialize the global cache with specific settings
 */
export declare function initializeCache(ttl: number, maxSize: number): void;
//# sourceMappingURL=cache.d.ts.map