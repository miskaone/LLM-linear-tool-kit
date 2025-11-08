/**
 * Module Loader for Linear Toolkit
 * Handles dynamic loading, initialization, and management of modules
 */
import { Module } from '@types/linear.types';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class ModuleLoader {
    private loadedModules;
    private moduleFactories;
    private graphqlClient;
    private session;
    private logger;
    private dependencyGraph;
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Register a module factory
     * The factory function creates module instances on demand
     */
    registerModuleFactory(moduleName: string, factory: (graphql: GraphQLClient, session: SessionManager) => Module, dependencies?: string[]): void;
    /**
     * Load a module by name
     * Returns cached instance if already loaded
     */
    loadModule(moduleName: string): Promise<Module>;
    /**
     * Load multiple modules
     */
    loadModules(moduleNames: string[]): Promise<Map<string, Module>>;
    /**
     * Get a loaded module
     */
    getModule(moduleName: string): Module | undefined;
    /**
     * Check if a module is loaded
     */
    isModuleLoaded(moduleName: string): boolean;
    /**
     * Get all loaded modules
     */
    getLoadedModules(): Map<string, Module>;
    /**
     * Execute an operation across modules
     * Searches through loaded modules for the operation
     */
    executeOperation(operationName: string, params: Record<string, unknown>): Promise<unknown>;
    /**
     * Find operations matching a pattern
     */
    findOperations(pattern: RegExp): Array<{
        module: string;
        operations: string[];
    }>;
    /**
     * Unload a module
     */
    unloadModule(moduleName: string): Promise<void>;
    /**
     * Unload all modules
     */
    unloadAll(): Promise<void>;
    /**
     * Get module loader status
     */
    getStatus(): {
        loadedModules: string[];
        registeredModules: string[];
        moduleStatuses: any[];
    };
    /**
     * Get module dependencies graph
     */
    getDependencyGraph(): Map<string, string[]>;
    /**
     * Validate module dependencies
     * Checks for circular dependencies
     */
    validateDependencies(): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=ModuleLoader.d.ts.map