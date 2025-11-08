"use strict";
/**
 * Configuration management with Zod validation
 * Handles environment variables and toolkit configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.createConfig = createConfig;
exports.validateConfig = validateConfig;
exports.getConfigSchema = getConfigSchema;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
/**
 * Zod schema for validating toolkit configuration
 */
const ToolkitConfigSchema = zod_1.z.object({
    // Required
    apiKey: zod_1.z
        .string()
        .min(1, 'LINEAR_API_KEY is required')
        .describe('Linear API key'),
    // Optional with defaults
    endpoint: zod_1.z
        .string()
        .url('Invalid endpoint URL')
        .default('https://api.linear.app/graphql')
        .describe('Linear GraphQL API endpoint'),
    timeout: zod_1.z
        .number()
        .positive('Timeout must be positive')
        .default(30000)
        .describe('Request timeout in milliseconds'),
    retryAttempts: zod_1.z
        .number()
        .int()
        .min(0)
        .default(3)
        .describe('Number of retry attempts for failed requests'),
    retryDelay: zod_1.z
        .number()
        .positive()
        .default(1000)
        .describe('Initial retry delay in milliseconds'),
    // Cache configuration
    cache: zod_1.z
        .object({
        enabled: zod_1.z.boolean().default(true),
        ttl: zod_1.z.number().positive('Cache TTL must be positive').default(300),
        maxSize: zod_1.z.number().int().positive().default(1000).optional(),
    })
        .default({ enabled: true, ttl: 300 }),
    // Logging configuration
    logging: zod_1.z
        .object({
        level: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        format: zod_1.z.enum(['json', 'text']).default('text').optional(),
    })
        .default({ level: 'info' }),
    // Feature flags
    features: zod_1.z
        .object({
        autoTransition: zod_1.z.boolean().default(false).optional(),
        autoAssign: zod_1.z.boolean().default(false).optional(),
        autoLabel: zod_1.z.boolean().default(false).optional(),
    })
        .default({}),
    // Session configuration
    sessionPersistence: zod_1.z
        .enum(['memory', 'disk', 'redis'])
        .default('memory')
        .describe('Type of session persistence'),
    sessionCacheTTL: zod_1.z
        .number()
        .positive()
        .default(3600)
        .describe('Session cache TTL in seconds'),
    // GitHub integration configuration for organization-wide mode
    github: zod_1.z
        .object({
        org: zod_1.z
            .string()
            .min(1, 'GitHub organization name is required for org-wide mode')
            .optional()
            .describe('GitHub organization name for auto-discovery'),
        token: zod_1.z
            .string()
            .min(1, 'GitHub personal access token is required for org-wide mode')
            .optional()
            .describe('GitHub personal access token for API access'),
        cacheTTL: zod_1.z
            .number()
            .positive()
            .default(3600000)
            .describe('Repository cache TTL in milliseconds (default: 1 hour)'),
    })
        .optional()
        .describe('GitHub integration configuration'),
    // Deployment mode configuration
    deploymentMode: zod_1.z
        .enum(['org-wide', 'per-repo'])
        .default('per-repo')
        .describe('Deployment mode: org-wide (auto-discover repos) or per-repo (explicit URLs)'),
});
/**
 * Parse and validate configuration from environment variables
 * @returns Validated ToolkitConfig object
 * @throws {z.ZodError} If configuration validation fails
 */
function loadConfig() {
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
                level: process.env.LOG_LEVEL,
                format: process.env.LOG_FORMAT,
            }
            : undefined,
        features: {
            autoTransition: process.env.AUTO_TRANSITION === 'true',
            autoAssign: process.env.AUTO_ASSIGN === 'true',
            autoLabel: process.env.AUTO_LABEL === 'true',
        },
        sessionPersistence: process.env.SESSION_PERSISTENCE || 'memory',
        sessionCacheTTL: process.env.SESSION_CACHE_TTL ? parseInt(process.env.SESSION_CACHE_TTL) : undefined,
        // GitHub integration configuration
        github: process.env.GITHUB_ORG && process.env.GITHUB_TOKEN
            ? {
                org: process.env.GITHUB_ORG,
                token: process.env.GITHUB_TOKEN,
                cacheTTL: process.env.REPO_CACHE_TTL ? parseInt(process.env.REPO_CACHE_TTL) : undefined,
            }
            : undefined,
        deploymentMode: process.env.DEPLOYMENT_MODE || undefined,
    };
    // Remove undefined values to allow schema defaults
    Object.keys(config).forEach((key) => config[key] === undefined && delete config[key]);
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
function createConfig(partialConfig) {
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
function validateConfig(partial) {
    return ToolkitConfigSchema.partial().safeParse(partial);
}
/**
 * Get configuration schema for documentation/introspection
 */
function getConfigSchema() {
    return ToolkitConfigSchema;
}
//# sourceMappingURL=config.js.map