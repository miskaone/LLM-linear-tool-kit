/**
 * Configuration management with Zod validation
 * Handles environment variables and toolkit configuration
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Zod schema for validating toolkit configuration
 */
const ToolkitConfigSchema = z.object({
  // Required
  apiKey: z
    .string()
    .min(1, 'LINEAR_API_KEY is required')
    .describe('Linear API key'),

  // Optional with defaults
  endpoint: z
    .string()
    .url('Invalid endpoint URL')
    .default('https://api.linear.app/graphql')
    .describe('Linear GraphQL API endpoint'),

  timeout: z
    .number()
    .positive('Timeout must be positive')
    .default(30000)
    .describe('Request timeout in milliseconds'),

  retryAttempts: z
    .number()
    .int()
    .min(0)
    .default(3)
    .describe('Number of retry attempts for failed requests'),

  retryDelay: z
    .number()
    .positive()
    .default(1000)
    .describe('Initial retry delay in milliseconds'),

  // Cache configuration
  cache: z
    .object({
      enabled: z.boolean().default(true),
      ttl: z.number().positive('Cache TTL must be positive').default(300),
      maxSize: z.number().int().positive().default(1000).optional(),
    })
    .default({ enabled: true, ttl: 300 }),

  // Logging configuration
  logging: z
    .object({
      level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
      format: z.enum(['json', 'text']).default('text').optional(),
    })
    .default({ level: 'info' }),

  // Feature flags
  features: z
    .object({
      autoTransition: z.boolean().default(false).optional(),
      autoAssign: z.boolean().default(false).optional(),
      autoLabel: z.boolean().default(false).optional(),
    })
    .default({}),

  // Session configuration
  sessionPersistence: z
    .enum(['memory', 'disk', 'redis'])
    .default('memory')
    .describe('Type of session persistence'),

  sessionCacheTTL: z
    .number()
    .positive()
    .default(3600)
    .describe('Session cache TTL in seconds'),

  // GitHub integration configuration for organization-wide mode
  github: z
    .object({
      org: z
        .string()
        .min(1, 'GitHub organization name is required for org-wide mode')
        .optional()
        .describe('GitHub organization name for auto-discovery'),
      token: z
        .string()
        .min(1, 'GitHub personal access token is required for org-wide mode')
        .optional()
        .describe('GitHub personal access token for API access'),
      cacheTTL: z
        .number()
        .positive()
        .default(3600000)
        .describe('Repository cache TTL in milliseconds (default: 1 hour)'),
    })
    .optional()
    .describe('GitHub integration configuration'),

  // Deployment mode configuration
  deploymentMode: z
    .enum(['org-wide', 'per-repo'])
    .default('per-repo')
    .describe('Deployment mode: org-wide (auto-discover repos) or per-repo (explicit URLs)'),
});

export type ToolkitConfig = z.infer<typeof ToolkitConfigSchema>;

/**
 * Parse and validate configuration from environment variables
 * @returns Validated ToolkitConfig object
 * @throws {z.ZodError} If configuration validation fails
 */
export function loadConfig(): ToolkitConfig {
  const config = {
    apiKey: process.env.LINEAR_API_KEY,
    endpoint: process.env.LINEAR_API_ENDPOINT,
    timeout: process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT) : undefined,
    retryAttempts: process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS) : undefined,
    retryDelay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : undefined,
    cache: process.env.CACHE_ENABLED
      ? {
          enabled: process.env.CACHE_ENABLED === 'true',
          ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : undefined,
          maxSize: process.env.CACHE_MAX_SIZE ? parseInt(process.env.CACHE_MAX_SIZE) : undefined,
        }
      : undefined,
    logging: process.env.LOG_LEVEL
      ? {
          level: process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error',
          format: process.env.LOG_FORMAT as 'json' | 'text' | undefined,
        }
      : undefined,
    features: {
      autoTransition: process.env.AUTO_TRANSITION === 'true',
      autoAssign: process.env.AUTO_ASSIGN === 'true',
      autoLabel: process.env.AUTO_LABEL === 'true',
    },
    sessionPersistence: (process.env.SESSION_PERSISTENCE as 'memory' | 'disk' | 'redis') || 'memory',
    sessionCacheTTL: process.env.SESSION_CACHE_TTL ? parseInt(process.env.SESSION_CACHE_TTL) : undefined,
    // GitHub integration configuration
    github:
      process.env.GITHUB_ORG && process.env.GITHUB_TOKEN
        ? {
            org: process.env.GITHUB_ORG,
            token: process.env.GITHUB_TOKEN,
            cacheTTL: process.env.REPO_CACHE_TTL ? parseInt(process.env.REPO_CACHE_TTL) : undefined,
          }
        : undefined,
    deploymentMode: (process.env.DEPLOYMENT_MODE as 'org-wide' | 'per-repo') || undefined,
  };

  // Remove undefined values to allow schema defaults
  Object.keys(config).forEach((key) => config[key as keyof typeof config] === undefined && delete config[key as keyof typeof config]);

  const result = ToolkitConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Create configuration from explicit parameters
 * Useful for testing and programmatic usage
 * @param partialConfig - Partial configuration to merge with defaults
 * @returns Validated ToolkitConfig object
 */
export function createConfig(partialConfig: Partial<ToolkitConfig>): ToolkitConfig {
  const result = ToolkitConfigSchema.safeParse(partialConfig);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Validate a partial configuration object without creating a full config
 * @param partial - Partial configuration to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(partial: Partial<ToolkitConfig>) {
  return ToolkitConfigSchema.partial().safeParse(partial);
}

/**
 * Get configuration schema for documentation/introspection
 */
export function getConfigSchema() {
  return ToolkitConfigSchema;
}
