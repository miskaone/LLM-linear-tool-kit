/**
 * Tests for configuration module
 */

import { createConfig, validateConfig } from '../config';

describe('Configuration', () => {
  describe('createConfig', () => {
    it('should create config with required fields', () => {
      const config = createConfig({
        apiKey: 'test-key-123',
      });

      expect(config.apiKey).toBe('test-key-123');
      expect(config.endpoint).toBe('https://api.linear.app/graphql');
      expect(config.timeout).toBe(30000);
      expect(config.retryAttempts).toBe(3);
    });

    it('should override defaults with provided values', () => {
      const config = createConfig({
        apiKey: 'test-key',
        timeout: 60000,
        retryAttempts: 5,
      });

      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
    });

    it('should throw if apiKey is missing', () => {
      expect(() => {
        createConfig({ apiKey: '' });
      }).toThrow();
    });

    it('should validate cache configuration', () => {
      const config = createConfig({
        apiKey: 'test-key',
        cache: {
          enabled: true,
          ttl: 600,
          maxSize: 500,
        },
      });

      expect(config.cache.enabled).toBe(true);
      expect(config.cache.ttl).toBe(600);
      expect(config.cache.maxSize).toBe(500);
    });

    it('should validate logging configuration', () => {
      const config = createConfig({
        apiKey: 'test-key',
        logging: {
          level: 'debug',
          format: 'json',
        },
      });

      expect(config.logging.level).toBe('debug');
      expect(config.logging.format).toBe('json');
    });
  });

  describe('validateConfig', () => {
    it('should validate partial configuration', () => {
      const result = validateConfig({ timeout: 30000 });
      expect(result.success).toBe(true);
    });

    it('should reject invalid timeout', () => {
      const result = validateConfig({ timeout: -1000 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid log level', () => {
      const result = validateConfig({
        logging: { level: 'invalid' as any },
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid cache TTL', () => {
      const result = validateConfig({
        cache: { enabled: true, ttl: 300 },
      });
      expect(result.success).toBe(true);
    });
  });
});
