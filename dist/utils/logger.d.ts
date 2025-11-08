/**
 * Simple logging utility for Linear Toolkit
 * Supports debug, info, warn, and error levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private level;
    private format;
    private context;
    constructor(context?: string, level?: LogLevel, format?: 'json' | 'text');
    /**
     * Set the log level
     */
    setLevel(level: LogLevel): void;
    /**
     * Log a debug message
     */
    debug(message: string, data?: unknown): void;
    /**
     * Log an info message
     */
    info(message: string, data?: unknown): void;
    /**
     * Log a warning message
     */
    warn(message: string, data?: unknown): void;
    /**
     * Log an error message
     */
    error(message: string, error?: unknown): void;
    /**
     * Internal logging method
     */
    private log;
    /**
     * Format log entry as text
     */
    private formatText;
    /**
     * Create a child logger with a new context
     */
    createChild(childContext: string): Logger;
}
/**
 * Get the global logger instance
 */
export declare function getLogger(context?: string): Logger;
/**
 * Configure the global logger
 */
export declare function configureLogger(level: LogLevel, format?: 'json' | 'text'): void;
//# sourceMappingURL=logger.d.ts.map