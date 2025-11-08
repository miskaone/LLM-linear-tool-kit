/**
 * GraphQL Client for Linear API
 * Handles HTTP requests to Linear's GraphQL endpoint with retry logic and error handling
 */
import { GraphQLRequest } from '@types/linear.types';
export interface GraphQLClientConfig {
    apiKey: string;
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}
export declare class GraphQLClient {
    private config;
    private logger;
    private cache;
    constructor(config: GraphQLClientConfig);
    /**
     * Execute a GraphQL query with automatic retry and error handling
     */
    query<T = unknown>(request: GraphQLRequest, useCache?: boolean): Promise<T>;
    /**
     * Execute a GraphQL mutation
     * Mutations are not cached by default
     */
    mutate<T = unknown>(request: GraphQLRequest): Promise<T>;
    /**
     * Execute the actual HTTP request
     */
    private executeRequest;
    /**
     * Create a LinearError from GraphQL errors
     */
    private createGraphQLError;
    /**
     * Check if an error is retryable
     */
    private isRetryableError;
    /**
     * Calculate exponential backoff delay
     */
    private getRetryDelay;
    /**
     * Sleep for a given duration
     */
    private delay;
    /**
     * Generate cache key for a query
     */
    private getCacheKey;
    /**
     * Extract query/mutation name from GraphQL string
     */
    private getQueryName;
}
//# sourceMappingURL=GraphQLClient.d.ts.map