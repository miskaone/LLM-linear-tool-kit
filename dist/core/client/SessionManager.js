"use strict";
/**
 * Session Manager for Linear Toolkit
 * Handles session state, context preservation, and operation tracking
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const logger_1 = require("@utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SessionManager {
    constructor(config, sessionId) {
        this.logger = (0, logger_1.getLogger)('SessionManager');
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
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Get a context value
     */
    getContext(key) {
        return this.context.get(key);
    }
    /**
     * Set a context value
     */
    setContext(key, value) {
        this.context.set(key, value);
        this.updateActivity();
        this.logger.debug(`Context set: ${key}`);
    }
    /**
     * Update multiple context values at once
     */
    updateContext(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.context.set(key, value);
        });
        this.updateActivity();
        this.logger.debug(`Context updated with ${Object.keys(updates).length} entries`);
    }
    /**
     * Delete a context value
     */
    deleteContext(key) {
        this.context.delete(key);
        this.updateActivity();
        this.logger.debug(`Context deleted: ${key}`);
    }
    /**
     * Clear all context
     */
    clearContext() {
        this.context.clear();
        this.updateActivity();
        this.logger.info('All context cleared');
    }
    /**
     * Get all context as an object
     */
    getAllContext() {
        const result = {};
        this.context.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    /**
     * Record an operation for tracking
     */
    recordOperation(name, success, duration) {
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
    getRecentOperations(limit = 10) {
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
    async saveState() {
        if (!this.persistencePath) {
            this.logger.debug('Session persistence disabled, skipping save');
            return;
        }
        try {
            const state = {
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
        }
        catch (error) {
            this.logger.error('Failed to save session state', error);
            throw error;
        }
    }
    /**
     * Restore session state from disk
     */
    async restoreState(sessionId) {
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
        }
        catch (error) {
            this.logger.error('Failed to restore session state', error);
            throw error;
        }
    }
    /**
     * Get session summary
     */
    getSummary() {
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
    isExpired(maxAge) {
        const age = Date.now() - this.lastActivity.getTime();
        return age > maxAge;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Update last activity timestamp
     */
    updateActivity() {
        this.lastActivity = new Date();
    }
    /**
     * Clear all session data (for cleanup)
     */
    dispose() {
        this.context.clear();
        this.recentOperations = [];
        this.logger.info(`Session disposed: ${this.sessionId}`);
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map