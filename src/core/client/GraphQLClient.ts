/**
 * GraphQL Client for Linear API
 * Handles HTTP requests to Linear's GraphQL endpoint with retry logic and error handling
 */

import { GraphQLRequest, GraphQLResponse, GraphQLError, LinearError, RateLimitError } from '@types/linear.types';
import { getLogger } from '@utils/logger';
import { getCache } from '@utils/cache';

export interface GraphQLClientConfig {
  apiKey: string;
  endpoint: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class GraphQLClient {
  private config: GraphQLClientConfig;
  private logger = getLogger('GraphQLClient');
  private cache = getCache();

  constructor(config: GraphQLClientConfig) {
    this.config = config;
    this.logger.debug(`GraphQL client initialized for endpoint: ${config.endpoint}`);
  }

  /**
   * Execute a GraphQL query with automatic retry and error handling
   */
  async query<T = unknown>(request: GraphQLRequest, useCache: boolean = false): Promise<T> {
    const startTime = Date.now();

    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for query: ${this.getQueryName(request.query)}`);
        return cached;
      }
    }

    // Attempt query with retries
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(request);
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
        return response.data as T;
      } catch (error) {
        lastError = error as Error;

        // Check if error is rate limit
        if (error instanceof RateLimitError) {
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

    throw new LinearError('UNKNOWN_ERROR', 'Unknown error occurred during GraphQL query');
  }

  /**
   * Execute a GraphQL mutation
   * Mutations are not cached by default
   */
  async mutate<T = unknown>(request: GraphQLRequest): Promise<T> {
    const startTime = Date.now();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(request);
        const duration = Date.now() - startTime;

        if (response.errors && response.errors.length > 0) {
          throw this.createGraphQLError(response.errors);
        }

        this.logger.debug(`Mutation completed in ${duration}ms`);
        return response.data as T;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof RateLimitError) {
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

    throw new LinearError('UNKNOWN_ERROR', 'Unknown error occurred during GraphQL mutation');
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
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
        throw new RateLimitError(retryAfter);
      }

      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid API key');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new LinearError('HTTP_ERROR', `HTTP ${response.status}: ${errorText}`, response.status);
      }

      const data = await response.json();
      return data as GraphQLResponse<T>;
    } catch (error) {
      if (error instanceof TypeError && (error as any).message.includes('Failed to fetch')) {
        throw new LinearError('NETWORK_ERROR', 'Network error: unable to reach Linear API');
      }

      if (error instanceof DOMException && (error as any).name === 'AbortError') {
        throw new LinearError('TIMEOUT_ERROR', `Request timeout after ${this.config.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Create a LinearError from GraphQL errors
   */
  private createGraphQLError(errors: GraphQLError[]): LinearError {
    const messages = errors.map((e) => e.message).join('; ');
    return new LinearError('GRAPHQL_ERROR', `GraphQL Error: ${messages}`, undefined, { errors });
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof LinearError) {
      // Retry on network and timeout errors
      return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR';
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound')
      );
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * exponentialDelay * 0.1;
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Sleep for a given duration
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate cache key for a query
   */
  private getCacheKey(request: GraphQLRequest): string {
    const queryName = this.getQueryName(request.query);
    const variables = request.variables ? JSON.stringify(request.variables) : '';
    return `graphql:${queryName}:${variables}`;
  }

  /**
   * Extract query/mutation name from GraphQL string
   */
  private getQueryName(query: string): string {
    const match = query.match(/(?:query|mutation)\s+(\w+)/);
    return match ? match[1] : 'Anonymous';
  }
}
