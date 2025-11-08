"use strict";
/**
 * Cache Manager for Linear Toolkit
 * Provides in-memory caching with TTL support and hit/miss tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.getCache = getCache;
exports.initializeCache = initializeCache;
const logger_1 = require("@utils/logger");
class CacheManager {
    constructor(ttl = 300000, maxSize = 1000) {
        this.hits = 0;
        this.misses = 0;
        this.logger = (0, logger_1.getLogger)('CacheManager');
        this.cache = new Map();
        this.ttl = ttl;
        this.maxSize = maxSize;
        this.logger.debug(`Cache initialized with TTL=${ttl}ms, maxSize=${maxSize}`);
    }
    /**
     * Get a value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return undefined;
        }
        // Check if entry has expired
        if (entry.expiresAt < new Date()) {
            this.cache.delete(key);
            this.misses++;
            this.logger.debug(`Cache miss (expired): ${key}`);
            return undefined;
        }
        // Update hit count
        entry.hits++;
        this.hits++;
        this.logger.debug(`Cache hit: ${key} (hits: ${entry.hits})`);
        return entry.value;
    }
    /**
     * Set a value in cache
     */
    set(key, value, ttl) {
        // Enforce max size by removing oldest entry
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            const oldestKey = this.getOldestKey();
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.logger.debug(`Cache evicted (size limit): ${oldestKey}`);
            }
        }
        const expiresAt = new Date(Date.now() + (ttl || this.ttl));
        const entry = {
            key,
            value,
            expiresAt,
            hits: 0,
            createdAt: new Date(),
        };
        this.cache.set(key, entry);
        this.logger.debug(`Cache set: ${key} (expires in ${ttl || this.ttl}ms)`);
    }
    /**
     * Check if a key exists in cache and is not expired
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (entry.expiresAt < new Date()) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Delete a key from cache
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.logger.debug(`Cache deleted: ${key}`);
        }
        return deleted;
    }
    /**
     * Clear all cache
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        this.logger.info(`Cache cleared (${size} entries removed)`);
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            total,
            hitRate,
            utilizationPercent: (this.cache.size / this.maxSize) * 100,
        };
    }
    /**
     * Get cache entries sorted by hit count (for monitoring)
     */
    getHotEntries(limit = 10) {
        const entries = Array.from(this.cache.values())
            .filter((entry) => entry.expiresAt >= new Date())
            .map((entry) => ({
            key: entry.key,
            hits: entry.hits,
            age: Date.now() - entry.createdAt.getTime(),
        }))
            .sort((a, b) => b.hits - a.hits)
            .slice(0, limit);
        return entries;
    }
    /**
     * Invalidate all entries matching a pattern
     */
    invalidatePattern(pattern) {
        let count = 0;
        const keysToDelete = [];
        this.cache.forEach((_, key) => {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach((key) => {
            this.cache.delete(key);
            count++;
        });
        this.logger.debug(`Cache invalidated by pattern: ${pattern} (${count} entries removed)`);
        return count;
    }
    /**
     * Get the oldest cache entry key
     */
    getOldestKey() {
        let oldestKey;
        let oldestTime = Date.now();
        this.cache.forEach((entry, key) => {
            if (entry.createdAt.getTime() < oldestTime) {
                oldestTime = entry.createdAt.getTime();
                oldestKey = key;
            }
        });
        return oldestKey;
    }
}
exports.CacheManager = CacheManager;
// Global cache instance
let globalCache = new CacheManager();
/**
 * Get the global cache instance
 */
function getCache() {
    return globalCache;
}
/**
 * Initialize the global cache with specific settings
 */
function initializeCache(ttl, maxSize) {
    globalCache = new CacheManager(ttl, maxSize);
}
//# sourceMappingURL=cache.js.map