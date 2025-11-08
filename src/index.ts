/**
 * Linear Toolkit - Main entry point
 * Exports the public API for using the Linear toolkit
 */

// Core client
export { LinearAgentClient } from '@core/client/LinearAgentClient';
export { SessionManager } from '@core/client/SessionManager';
export { GraphQLClient } from '@core/client/GraphQLClient';

// Types
export * from '@types/linear.types';

// Configuration & Utilities
export { loadConfig, createConfig, validateConfig, getConfigSchema } from '@utils/config';
export { getLogger, configureLogger } from '@utils/logger';
export { getCache, initializeCache, CacheManager } from '@utils/cache';

/**
 * Initialize the Linear Toolkit with configuration
 * Convenient function for quick setup
 */
export async function initializeLinearToolkit(config?: Partial<import('@types/linear.types').ToolkitConfig>) {
  const { LinearAgentClient } = await import('@core/client/LinearAgentClient');
  return LinearAgentClient.create(config);
}
