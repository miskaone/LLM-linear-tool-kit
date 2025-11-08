/**
 * Simple logging utility for Linear Toolkit
 * Supports debug, info, warn, and error levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private level: LogLevel;
  private format: 'json' | 'text';
  private context: string;

  constructor(context: string = 'LinearToolkit', level: LogLevel = 'info', format: 'json' | 'text' = 'text') {
    this.context = context;
    this.level = level;
    this.format = format;
  }

  /**
   * Set the log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    this.log('error', message, errorData);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
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
  private formatText(entry: Record<string, unknown>): string {
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
  createChild(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`, this.level, this.format);
  }
}

// Global logger instance
let globalLogger = new Logger('LinearToolkit', 'info', 'text');

/**
 * Get the global logger instance
 */
export function getLogger(context?: string): Logger {
  if (context) {
    return globalLogger.createChild(context);
  }
  return globalLogger;
}

/**
 * Configure the global logger
 */
export function configureLogger(level: LogLevel, format: 'json' | 'text' = 'text'): void {
  globalLogger = new Logger('LinearToolkit', level, format);
}
