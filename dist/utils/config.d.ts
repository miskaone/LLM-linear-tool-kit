/**
 * Configuration management with Zod validation
 * Handles environment variables and toolkit configuration
 */
import { z } from 'zod';
/**
 * Zod schema for validating toolkit configuration
 */
declare const ToolkitConfigSchema: any;
export type ToolkitConfig = z.infer<typeof ToolkitConfigSchema>;
/**
 * Parse and validate configuration from environment variables
 * @returns Validated ToolkitConfig object
 * @throws {z.ZodError} If configuration validation fails
 */
export declare function loadConfig(): ToolkitConfig;
/**
 * Create configuration from explicit parameters
 * Useful for testing and programmatic usage
 * @param partialConfig - Partial configuration to merge with defaults
 * @returns Validated ToolkitConfig object
 */
export declare function createConfig(partialConfig: Partial<ToolkitConfig>): ToolkitConfig;
/**
 * Validate a partial configuration object without creating a full config
 * @param partial - Partial configuration to validate
 * @returns Validation result with errors if any
 */
export declare function validateConfig(partial: Partial<ToolkitConfig>): any;
/**
 * Get configuration schema for documentation/introspection
 */
export declare function getConfigSchema(): any;
export {};
//# sourceMappingURL=config.d.ts.map