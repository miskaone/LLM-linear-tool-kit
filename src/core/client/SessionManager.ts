/**
 * Session Manager for Linear Toolkit
 * Handles session state, context preservation, and operation tracking
 */

import { SessionState, SessionConfig } from '@types/linear.types';
import { getLogger } from '@utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class SessionManager {
  private sessionId: string;
  private context: Map<string, unknown>;
  private recentOperations: Array<{ name: string; timestamp: Date; success: boolean; duration: number }>;
  private config: SessionConfig;
  private lastActivity: Date;
  private persistencePath?: string;
  private logger = getLogger('SessionManager');

  constructor(config: SessionConfig, sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.context = new Map();
    this.recentOperations = [];
    this.config = config;
    this.lastActivity = new Date();

    // Set up persistence path if using disk persistence
    if (config.persistenceType === 'disk') {
      this.persistencePath = path.join(process.cwd(), '.linear', `session-${this.sessionId}.json`);
    }

    this.logger.debug(`Session created: ${this.sessionId}`);
  }

  /**
   * Get the session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get a context value
   */
  getContext<T = unknown>(key: string): T | undefined {
    return this.context.get(key) as T | undefined;
  }

  /**
   * Set a context value
   */
  setContext<T>(key: string, value: T): void {
    this.context.set(key, value);
    this.updateActivity();
    this.logger.debug(`Context set: ${key}`);
  }

  /**
   * Update multiple context values at once
   */
  updateContext(updates: Record<string, unknown>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.context.set(key, value);
    });
    this.updateActivity();
    this.logger.debug(`Context updated with ${Object.keys(updates).length} entries`);
  }

  /**
   * Delete a context value
   */
  deleteContext(key: string): void {
    this.context.delete(key);
    this.updateActivity();
    this.logger.debug(`Context deleted: ${key}`);
  }

  /**
   * Clear all context
   */
  clearContext(): void {
    this.context.clear();
    this.updateActivity();
    this.logger.info('All context cleared');
  }

  /**
   * Get all context as an object
   */
  getAllContext(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.context.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Record an operation for tracking
   */
  recordOperation(name: string, success: boolean, duration: number): void {
    this.recentOperations.push({
      name,
      timestamp: new Date(),
      success,
      duration,
    });

    // Keep only last 100 operations
    if (this.recentOperations.length > 100) {
      this.recentOperations = this.recentOperations.slice(-100);
    }

    this.updateActivity();
    this.logger.debug(`Operation recorded: ${name} (${success ? 'success' : 'failed'}, ${duration}ms)`);
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit: number = 10) {
    return this.recentOperations.slice(-limit);
  }

  /**
   * Get operation statistics
   */
  getOperationStats() {
    const total = this.recentOperations.length;
    const successful = this.recentOperations.filter((op) => op.success).length;
    const failed = total - successful;
    const avgDuration = total > 0 ? this.recentOperations.reduce((sum, op) => sum + op.duration, 0) / total : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration,
    };
  }

  /**
   * Save session state to disk
   */
  async saveState(): Promise<void> {
    if (!this.persistencePath) {
      this.logger.debug('Session persistence disabled, skipping save');
      return;
    }

    try {
      const state: SessionState = {
        sessionId: this.sessionId,
        context: this.context,
        lastActivity: this.lastActivity,
        createdAt: new Date(),
      };

      // Ensure directory exists
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Serialize context Map to JSON
      const stateJSON = {
        ...state,
        context: Object.fromEntries(this.context),
      };

      fs.writeFileSync(this.persistencePath, JSON.stringify(stateJSON, null, 2));
      this.logger.debug(`Session state saved to ${this.persistencePath}`);
    } catch (error) {
      this.logger.error('Failed to save session state', error);
      throw error;
    }
  }

  /**
   * Restore session state from disk
   */
  async restoreState(sessionId: string): Promise<void> {
    const persistencePath = path.join(process.cwd(), '.linear', `session-${sessionId}.json`);

    if (!fs.existsSync(persistencePath)) {
      this.logger.warn(`Session file not found: ${persistencePath}`);
      return;
    }

    try {
      const stateJSON = JSON.parse(fs.readFileSync(persistencePath, 'utf-8'));
      this.sessionId = stateJSON.sessionId;
      this.context = new Map(Object.entries(stateJSON.context));
      this.lastActivity = new Date(stateJSON.lastActivity);
      this.persistencePath = persistencePath;
      this.logger.debug(`Session state restored from ${persistencePath}`);
    } catch (error) {
      this.logger.error('Failed to restore session state', error);
      throw error;
    }
  }

  /**
   * Get session summary
   */
  getSummary(): Omit<SessionState, 'context'> & { contextSize: number } {
    return {
      sessionId: this.sessionId,
      lastActivity: this.lastActivity,
      createdAt: new Date(),
      contextSize: this.context.size,
    };
  }

  /**
   * Check if session has expired
   */
  isExpired(maxAge: number): boolean {
    const age = Date.now() - this.lastActivity.getTime();
    return age > maxAge;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Clear all session data (for cleanup)
   */
  dispose(): void {
    this.context.clear();
    this.recentOperations = [];
    this.logger.info(`Session disposed: ${this.sessionId}`);
  }
}
