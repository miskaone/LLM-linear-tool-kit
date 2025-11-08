/**
 * Linear Toolkit - Main entry point
 * Exports the public API for using the Linear toolkit
 */
export { LinearAgentClient } from '@core/client/LinearAgentClient';
export { SessionManager } from '@core/client/SessionManager';
export { GraphQLClient } from '@core/client/GraphQLClient';
export * from '@types/linear.types';
export { loadConfig, createConfig, validateConfig, getConfigSchema } from '@utils/config';
export { getLogger, configureLogger } from '@utils/logger';
export { getCache, initializeCache, CacheManager } from '@utils/cache';
/**
 * Initialize the Linear Toolkit with configuration
 * Convenient function for quick setup
 */
export declare function initializeLinearToolkit(config?: Partial<import('@types/linear.types').ToolkitConfig>): Promise<import("@core/client/LinearAgentClient").LinearAgentClient>;
//# sourceMappingURL=index.d.ts.map