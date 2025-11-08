/**
 * Tests for CacheManager
 */

import { CacheManager } from '../cache';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(1000, 100); // 1s TTL, max 100 items
  });

  describe('get/set', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should handle different data types', () => {
      const obj = { id: 1, name: 'test' };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);

      const arr = [1, 2, 3];
      cache.set('arr', arr);
      expect(cache.get('arr')).toEqual(arr);
    });

    it('should respect custom TTL', () => {
      cache.set('expiring', 'value', 100); // 100ms
      expect(cache.get('expiring')).toBe('value');

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(cache.get('expiring')).toBeUndefined();
          resolve(null);
        }, 150);
      });
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for missing keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should reset statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const statsBefore = cache.getStats();
      expect(statsBefore.hits).toBe(1);
      expect(statsBefore.misses).toBe(1);

      cache.clear();
      const statsAfter = cache.getStats();
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should track hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.total).toBe(3);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(100);
      expect(stats.utilizationPercent).toBeCloseTo(3, 0);
    });
  });

  describe('getHotEntries', () => {
    it('should return entries sorted by hit count', () => {
      cache.set('popular', 'value1');
      cache.set('less_popular', 'value2');

      // Access popular more times
      for (let i = 0; i < 5; i++) {
        cache.get('popular');
      }
      cache.get('less_popular');

      const hot = cache.getHotEntries(10);
      expect(hot[0].key).toBe('popular');
      expect(hot[0].hits).toBe(5);
      expect(hot[1].key).toBe('less_popular');
      expect(hot[1].hits).toBe(1);
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate matching keys', () => {
      cache.set('user:1', 'data1');
      cache.set('user:2', 'data2');
      cache.set('post:1', 'data3');

      const removed = cache.invalidatePattern(/^user:/);
      expect(removed).toBe(2);
      expect(cache.has('user:1')).toBe(false);
      expect(cache.has('user:2')).toBe(false);
      expect(cache.has('post:1')).toBe(true);
    });
  });

  describe('size limits', () => {
    it('should evict oldest entry when max size reached', () => {
      const smallCache = new CacheManager(10000, 3);

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Adding 4th item should evict oldest (key1)
      smallCache.set('key4', 'value4');

      expect(smallCache.has('key1')).toBe(false); // evicted
      expect(smallCache.has('key2')).toBe(true);
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });
  });
});
