/**
 * Session Manager for Linear Toolkit
 * Handles session state, context preservation, and operation tracking
 */
import { SessionState, SessionConfig } from '@types/linear.types';
export declare class SessionManager {
    private sessionId;
    private context;
    private recentOperations;
    private config;
    private lastActivity;
    private persistencePath?;
    private logger;
    constructor(config: SessionConfig, sessionId?: string);
    /**
     * Get the session ID
     */
    getSessionId(): string;
    /**
     * Get a context value
     */
    getContext<T = unknown>(key: string): T | undefined;
    /**
     * Set a context value
     */
    setContext<T>(key: string, value: T): void;
    /**
     * Update multiple context values at once
     */
    updateContext(updates: Record<string, unknown>): void;
    /**
     * Delete a context value
     */
    deleteContext(key: string): void;
    /**
     * Clear all context
     */
    clearContext(): void;
    /**
     * Get all context as an object
     */
    getAllContext(): Record<string, unknown>;
    /**
     * Record an operation for tracking
     */
    recordOperation(name: string, success: boolean, duration: number): void;
    /**
     * Get recent operations
     */
    getRecentOperations(limit?: number): {
        name: string;
        timestamp: Date;
        success: boolean;
        duration: number;
    }[];
    /**
     * Get operation statistics
     */
    getOperationStats(): {
        total: number;
        successful: number;
        failed: number;
        successRate: number;
        avgDuration: number;
    };
    /**
     * Save session state to disk
     */
    saveState(): Promise<void>;
    /**
     * Restore session state from disk
     */
    restoreState(sessionId: string): Promise<void>;
    /**
     * Get session summary
     */
    getSummary(): Omit<SessionState, 'context'> & {
        contextSize: number;
    };
    /**
     * Check if session has expired
     */
    isExpired(maxAge: number): boolean;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Update last activity timestamp
     */
    private updateActivity;
    /**
     * Clear all session data (for cleanup)
     */
    dispose(): void;
}
//# sourceMappingURL=SessionManager.d.ts.map