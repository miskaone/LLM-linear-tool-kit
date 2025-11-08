/**
 * Module Loader for Linear Toolkit
 * Handles dynamic loading, initialization, and management of modules
 */

import { Module, ModuleConfig } from '@types/linear.types';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
import { getLogger } from '@utils/logger';

export class ModuleLoader {
  private loadedModules: Map<string, Module> = new Map();
  private moduleFactories: Map<string, (graphql: GraphQLClient, session: SessionManager) => Module> = new Map();
  private graphqlClient: GraphQLClient;
  private session: SessionManager;
  private logger = getLogger('ModuleLoader');
  private dependencyGraph: Map<string, string[]> = new Map();

  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    this.graphqlClient = graphqlClient;
    this.session = session;
    this.logger.debug('ModuleLoader initialized');
  }

  /**
   * Register a module factory
   * The factory function creates module instances on demand
   */
  registerModuleFactory(
    moduleName: string,
    factory: (graphql: GraphQLClient, session: SessionManager) => Module,
    dependencies?: string[]
  ): void {
    this.moduleFactories.set(moduleName, factory);

    if (dependencies) {
      this.dependencyGraph.set(moduleName, dependencies);
    }

    this.logger.debug(`Module factory registered: ${moduleName}`);
  }

  /**
   * Load a module by name
   * Returns cached instance if already loaded
   */
  async loadModule(moduleName: string): Promise<Module> {
    // Return cached module if already loaded
    if (this.loadedModules.has(moduleName)) {
      this.logger.debug(`Module already loaded: ${moduleName}`);
      return this.loadedModules.get(moduleName)!;
    }

    // Check if factory exists
    const factory = this.moduleFactories.get(moduleName);
    if (!factory) {
      throw new Error(`Module factory not found: ${moduleName}`);
    }

    this.logger.info(`Loading module: ${moduleName}`);

    // Load dependencies first
    const dependencies = this.dependencyGraph.get(moduleName) || [];
    for (const dep of dependencies) {
      await this.loadModule(dep);
    }

    // Create module instance
    const module = factory(this.graphqlClient, this.session);

    // Initialize module
    await module.initialize();

    // Cache the module
    this.loadedModules.set(moduleName, module);

    this.logger.info(`Module loaded: ${moduleName}`);
    return module;
  }

  /**
   * Load multiple modules
   */
  async loadModules(moduleNames: string[]): Promise<Map<string, Module>> {
    const modules = new Map<string, Module>();

    for (const name of moduleNames) {
      const module = await this.loadModule(name);
      modules.set(name, module);
    }

    return modules;
  }

  /**
   * Get a loaded module
   */
  getModule(moduleName: string): Module | undefined {
    return this.loadedModules.get(moduleName);
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Get all loaded modules
   */
  getLoadedModules(): Map<string, Module> {
    return new Map(this.loadedModules);
  }

  /**
   * Execute an operation across modules
   * Searches through loaded modules for the operation
   */
  async executeOperation(
    operationName: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    // Search through loaded modules for the operation
    for (const [moduleName, module] of this.loadedModules) {
      if (module.operations.has(operationName)) {
        this.logger.debug(`Executing operation: ${moduleName}.${operationName}`);
        return module.execute(operationName, params);
      }
    }

    throw new Error(`Operation not found in any loaded module: ${operationName}`);
  }

  /**
   * Find operations matching a pattern
   */
  findOperations(pattern: RegExp): Array<{ module: string; operations: string[] }> {
    const results: Array<{ module: string; operations: string[] }> = [];

    for (const [moduleName, module] of this.loadedModules) {
      const matchingOps = Array.from(module.operations.keys()).filter((op) => pattern.test(op));

      if (matchingOps.length > 0) {
        results.push({
          module: moduleName,
          operations: matchingOps,
        });
      }
    }

    return results;
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleName: string): Promise<void> {
    const module = this.loadedModules.get(moduleName);

    if (!module) {
      this.logger.warn(`Module not loaded: ${moduleName}`);
      return;
    }

    // Check for dependents
    const dependents = Array.from(this.dependencyGraph.entries())
      .filter(([_, deps]) => deps.includes(moduleName))
      .map(([name]) => name);

    if (dependents.length > 0) {
      throw new Error(
        `Cannot unload module "${moduleName}" because it is a dependency of: ${dependents.join(', ')}`
      );
    }

    await module.dispose();
    this.loadedModules.delete(moduleName);

    this.logger.info(`Module unloaded: ${moduleName}`);
  }

  /**
   * Unload all modules
   */
  async unloadAll(): Promise<void> {
    const moduleNames = Array.from(this.loadedModules.keys());

    // Unload in reverse order of dependencies
    for (let i = moduleNames.length - 1; i >= 0; i--) {
      const name = moduleNames[i];
      const module = this.loadedModules.get(name);

      if (module) {
        await module.dispose();
      }
    }

    this.loadedModules.clear();
    this.logger.info('All modules unloaded');
  }

  /**
   * Get module loader status
   */
  getStatus() {
    return {
      loadedModules: Array.from(this.loadedModules.keys()),
      registeredModules: Array.from(this.moduleFactories.keys()),
      moduleStatuses: Array.from(this.loadedModules.values()).map((m) => m.getStatus?.() || { name: m.name }),
    };
  }

  /**
   * Get module dependencies graph
   */
  getDependencyGraph() {
    return new Map(this.dependencyGraph);
  }

  /**
   * Validate module dependencies
   * Checks for circular dependencies
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (module: string, visited: Set<string>, stack: Set<string>): boolean => {
      visited.add(module);
      stack.add(module);

      const deps = this.dependencyGraph.get(module) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep, visited, stack)) {
            return true;
          }
        } else if (stack.has(dep)) {
          return true;
        }
      }

      stack.delete(module);
      return false;
    };

    // Check each module for circular dependencies
    for (const module of this.dependencyGraph.keys()) {
      const visited = new Set<string>();
      const stack = new Set<string>();

      if (hasCycle(module, visited, stack)) {
        errors.push(`Circular dependency detected involving module: ${module}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
