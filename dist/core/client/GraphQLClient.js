"use strict";
/**
 * GraphQL Client for Linear API
 * Handles HTTP requests to Linear's GraphQL endpoint with retry logic and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLClient = void 0;
const linear_types_1 = require("@types/linear.types");
const logger_1 = require("@utils/logger");
const cache_1 = require("@utils/cache");
class GraphQLClient {
    constructor(config) {
        this.logger = (0, logger_1.getLogger)('GraphQLClient');
        this.cache = (0, cache_1.getCache)();
        this.config = config;
        this.logger.debug(`GraphQL client initialized for endpoint: ${config.endpoint}`);
    }
    /**
     * Execute a GraphQL query with automatic retry and error handling
     */
    async query(request, useCache = false) {
        const startTime = Date.now();
        // Check cache first
        if (useCache) {
            const cacheKey = this.getCacheKey(request);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for query: ${this.getQueryName(request.query)}`);
                return cached;
            }
        }
        // Attempt query with retries
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await this.executeRequest(request);
                const duration = Date.now() - startTime;
                // Handle GraphQL errors
                if (response.errors && response.errors.length > 0) {
                    throw this.createGraphQLError(response.errors);
                }
                // Cache successful response
                if (useCache && response.data) {
                    const cacheKey = this.getCacheKey(request);
                    this.cache.set(cacheKey, response.data);
                }
                this.logger.debug(`Query completed: ${this.getQueryName(request.query)} (${duration}ms)`);
                return response.data;
            }
            catch (error) {
                lastError = error;
                // Check if error is rate limit
                if (error instanceof linear_types_1.RateLimitError) {
                    await this.delay(error.retryAfter * 1000);
                    continue;
                }
                // Check if we should retry
                if (attempt < this.config.retryAttempts && this.isRetryableError(error)) {
                    const delay = this.getRetryDelay(attempt);
                    this.logger.warn(`Query failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`);
                    await this.delay(delay);
                    continue;
                }
                // No more retries or non-retryable error
                break;
            }
        }
        // All retries exhausted
        if (lastError) {
            this.logger.error(`Query failed after ${this.config.retryAttempts} retries`, lastError);
            throw lastError;
        }
        throw new linear_types_1.LinearError('UNKNOWN_ERROR', 'Unknown error occurred during GraphQL query');
    }
    /**
     * Execute a GraphQL mutation
     * Mutations are not cached by default
     */
    async mutate(request) {
        const startTime = Date.now();
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await this.executeRequest(request);
                const duration = Date.now() - startTime;
                if (response.errors && response.errors.length > 0) {
                    throw this.createGraphQLError(response.errors);
                }
                this.logger.debug(`Mutation completed in ${duration}ms`);
                return response.data;
            }
            catch (error) {
                lastError = error;
                if (error instanceof linear_types_1.RateLimitError) {
                    await this.delay(error.retryAfter * 1000);
                    continue;
                }
                if (attempt < this.config.retryAttempts && this.isRetryableError(error)) {
                    const delay = this.getRetryDelay(attempt);
                    this.logger.warn(`Mutation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`);
                    await this.delay(delay);
                    continue;
                }
                break;
            }
        }
        if (lastError) {
            this.logger.error(`Mutation failed after ${this.config.retryAttempts} retries`, lastError);
            throw lastError;
        }
        throw new linear_types_1.LinearError('UNKNOWN_ERROR', 'Unknown error occurred during GraphQL mutation');
    }
    /**
     * Execute the actual HTTP request
     */
    async executeRequest(request) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'User-Agent': 'LinearToolkit/1.0',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                throw new linear_types_1.RateLimitError(retryAfter);
            }
            // Handle authentication errors
            if (response.status === 401) {
                throw new Error('Unauthorized: Invalid API key');
            }
            // Handle other HTTP errors
            if (!response.ok) {
                const errorText = await response.text();
                throw new linear_types_1.LinearError('HTTP_ERROR', `HTTP ${response.status}: ${errorText}`, response.status);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                throw new linear_types_1.LinearError('NETWORK_ERROR', 'Network error: unable to reach Linear API');
            }
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new linear_types_1.LinearError('TIMEOUT_ERROR', `Request timeout after ${this.config.timeout}ms`);
            }
            throw error;
        }
    }
    /**
     * Create a LinearError from GraphQL errors
     */
    createGraphQLError(errors) {
        const messages = errors.map((e) => e.message).join('; ');
        return new linear_types_1.LinearError('GRAPHQL_ERROR', `GraphQL Error: ${messages}`, undefined, { errors });
    }
    /**
     * Check if an error is retryable
     */
    isRetryableError(error) {
        if (error instanceof linear_types_1.LinearError) {
            // Retry on network and timeout errors
            return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
        }
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return (message.includes('network') ||
                message.includes('timeout') ||
                message.includes('econnrefused') ||
                message.includes('enotfound'));
        }
        return false;
    }
    /**
     * Calculate exponential backoff delay
     */
    getRetryDelay(attempt) {
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * exponentialDelay * 0.1;
        return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    }
    /**
     * Sleep for a given duration
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Generate cache key for a query
     */
    getCacheKey(request) {
        const queryName = this.getQueryName(request.query);
        const variables = request.variables ? JSON.stringify(request.variables) : '';
        return `graphql:${queryName}:${variables}`;
    }
    /**
     * Extract query/mutation name from GraphQL string
     */
    getQueryName(query) {
        const match = query.match(/(?:query|mutation)\s+(\w+)/);
        return match ? match[1] : 'Anonymous';
    }
}
exports.GraphQLClient = GraphQLClient;
//# sourceMappingURL=GraphQLClient.js.map