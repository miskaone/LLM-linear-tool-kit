/**
 * Tests for SessionManager
 */

import { SessionManager } from '../SessionManager';
import { SessionConfig } from '@types/linear.types';

describe('SessionManager', () => {
  let session: SessionManager;
  const mockConfig: SessionConfig = {
    apiKey: 'test-key',
    persistenceType: 'memory',
  };

  beforeEach(() => {
    session = new SessionManager(mockConfig);
  });

  afterEach(() => {
    session.dispose();
  });

  describe('initialization', () => {
    it('should create a session with unique ID', () => {
      const id1 = session.getSessionId();
      const id2 = new SessionManager(mockConfig).getSessionId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should accept custom session ID', () => {
      const customId = 'custom-session-123';
      const customSession = new SessionManager(mockConfig, customId);
      expect(customSession.getSessionId()).toBe(customId);
    });
  });

  describe('context management', () => {
    it('should set and get context values', () => {
      session.setContext('key1', 'value1');
      expect(session.getContext('key1')).toBe('value1');
    });

    it('should handle different data types', () => {
      const obj = { id: 1, name: 'test' };
      session.setContext('obj', obj);
      expect(session.getContext('obj')).toEqual(obj);

      const arr = [1, 2, 3];
      session.setContext('arr', arr);
      expect(session.getContext('arr')).toEqual(arr);
    });

    it('should return undefined for missing keys', () => {
      expect(session.getContext('nonexistent')).toBeUndefined();
    });

    it('should update multiple context values', () => {
      session.updateContext({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });

      expect(session.getContext('key1')).toBe('value1');
      expect(session.getContext('key2')).toBe('value2');
      expect(session.getContext('key3')).toBe('value3');
    });

    it('should delete context values', () => {
      session.setContext('key1', 'value1');
      expect(session.getContext('key1')).toBe('value1');
      session.deleteContext('key1');
      expect(session.getContext('key1')).toBeUndefined();
    });

    it('should clear all context', () => {
      session.setContext('key1', 'value1');
      session.setContext('key2', 'value2');
      session.clearContext();

      expect(session.getContext('key1')).toBeUndefined();
      expect(session.getContext('key2')).toBeUndefined();
    });

    it('should get all context as object', () => {
      session.setContext('key1', 'value1');
      session.setContext('key2', 'value2');

      const all = session.getAllContext();
      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });

  describe('operation tracking', () => {
    it('should record successful operations', () => {
      session.recordOperation('testOp', true, 100);
      const recent = session.getRecentOperations(1);

      expect(recent).toHaveLength(1);
      expect(recent[0].name).toBe('testOp');
      expect(recent[0].success).toBe(true);
      expect(recent[0].duration).toBe(100);
    });

    it('should record failed operations', () => {
      session.recordOperation('failedOp', false, 50);
      const recent = session.getRecentOperations(1);

      expect(recent[0].success).toBe(false);
    });

    it('should get operation statistics', () => {
      session.recordOperation('op1', true, 100);
      session.recordOperation('op2', true, 200);
      session.recordOperation('op3', false, 50);

      const stats = session.getOperationStats();
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.avgDuration).toBe(116.67);
    });

    it('should limit recent operations to 100', () => {
      for (let i = 0; i < 150; i++) {
        session.recordOperation(`op${i}`, true, 10);
      }

      const recent = session.getRecentOperations(150);
      expect(recent).toHaveLength(100);
    });
  });

  describe('session summary', () => {
    it('should provide session summary', () => {
      session.setContext('key1', 'value1');
      session.setContext('key2', 'value2');

      const summary = session.getSummary();
      expect(summary.sessionId).toBe(session.getSessionId());
      expect(summary.contextSize).toBe(2);
      expect(summary.lastActivity).toBeDefined();
      expect(summary.createdAt).toBeDefined();
    });
  });

  describe('expiration', () => {
    it('should detect expired sessions', async () => {
      const session2 = new SessionManager(mockConfig);
      const twoSecondsAgo = Date.now() - 2000;

      // Manually set last activity to past
      (session2 as any).lastActivity = new Date(twoSecondsAgo);

      expect(session2.isExpired(1000)).toBe(true); // 1 second max age
      expect(session2.isExpired(3000)).toBe(false); // 3 seconds max age
    });
  });

  describe('dispose', () => {
    it('should clean up resources', () => {
      session.setContext('key1', 'value1');
      session.recordOperation('op1', true, 100);

      session.dispose();

      expect(session.getContext('key1')).toBeUndefined();
      expect(session.getRecentOperations()).toHaveLength(0);
    });
  });
});
