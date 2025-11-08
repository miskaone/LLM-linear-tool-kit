"use strict";
/**
 * Core TypeScript types and interfaces for Linear Toolkit
 * Comprehensive type definitions for Linear API integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.AuthenticationError = exports.ValidationError = exports.LinearError = void 0;
// ============================================================================
// Error Types
// ============================================================================
class LinearError extends Error {
    constructor(code, message, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'LinearError';
    }
}
exports.LinearError = LinearError;
class ValidationError extends LinearError {
    constructor(message, details) {
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends LinearError {
    constructor(message = 'Invalid or missing authentication credentials') {
        super('AUTHENTICATION_ERROR', message, 401);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class RateLimitError extends LinearError {
    constructor(retryAfter = 60) {
        super('RATE_LIMIT_ERROR', `Rate limit exceeded. Retry after ${retryAfter} seconds`, 429);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
//# sourceMappingURL=linear.types.js.map