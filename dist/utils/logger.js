"use strict";
/**
 * Simple logging utility for Linear Toolkit
 * Supports debug, info, warn, and error levels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.getLogger = getLogger;
exports.configureLogger = configureLogger;
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
class Logger {
    constructor(context = 'LinearToolkit', level = 'info', format = 'text') {
        this.context = context;
        this.level = level;
        this.format = format;
    }
    /**
     * Set the log level
     */
    setLevel(level) {
        this.level = level;
    }
    /**
     * Log a debug message
     */
    debug(message, data) {
        this.log('debug', message, data);
    }
    /**
     * Log an info message
     */
    info(message, data) {
        this.log('info', message, data);
    }
    /**
     * Log a warning message
     */
    warn(message, data) {
        this.log('warn', message, data);
    }
    /**
     * Log an error message
     */
    error(message, error) {
        const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
        this.log('error', message, errorData);
    }
    /**
     * Internal logging method
     */
    log(level, message, data) {
        if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
            return;
        }
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            context: this.context,
            message,
            ...(data && { data }),
        };
        const output = this.format === 'json' ? JSON.stringify(logEntry) : this.formatText(logEntry);
        // Use appropriate console method
        switch (level) {
            case 'debug':
                console.debug(output);
                break;
            case 'info':
                console.log(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'error':
                console.error(output);
                break;
        }
    }
    /**
     * Format log entry as text
     */
    formatText(entry) {
        const { timestamp, level, context, message, data } = entry;
        let output = `[${timestamp}] ${level} [${context}] ${message}`;
        if (data) {
            output += `\n${JSON.stringify(data, null, 2)}`;
        }
        return output;
    }
    /**
     * Create a child logger with a new context
     */
    createChild(childContext) {
        return new Logger(`${this.context}:${childContext}`, this.level, this.format);
    }
}
exports.Logger = Logger;
// Global logger instance
let globalLogger = new Logger('LinearToolkit', 'info', 'text');
/**
 * Get the global logger instance
 */
function getLogger(context) {
    if (context) {
        return globalLogger.createChild(context);
    }
    return globalLogger;
}
/**
 * Configure the global logger
 */
function configureLogger(level, format = 'text') {
    globalLogger = new Logger('LinearToolkit', level, format);
}
//# sourceMappingURL=logger.js.map