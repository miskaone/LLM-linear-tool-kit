/**
 * Base Module class for Linear Toolkit
 * Provides common functionality for all modules
 */

import { Module, ModuleConfig, Operation, ParameterInfo } from '@types/linear.types';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
import { getLogger } from '@utils/logger';

export abstract class BaseModule implements Module {
  name: string;
  config: ModuleConfig;
  operations: Map<string, Operation>;
  protected graphqlClient: GraphQLClient;
  protected session: SessionManager;
  protected logger = getLogger(this.constructor.name);
  protected initialized: boolean = false;

  constructor(
    name: string,
    config: ModuleConfig,
    graphqlClient: GraphQLClient,
    session: SessionManager
  ) {
    this.name = name;
    this.config = config;
    this.operations = new Map();
    this.graphqlClient = graphqlClient;
    this.session = session;

    this.logger.debug(`Module created: ${name}`);
  }

  /**
   * Register an operation in this module
   */
  protected registerOperation(operation: Operation): void {
    this.operations.set(operation.name, operation);
    this.logger.debug(`Operation registered: ${operation.name}`);
  }

  /**
   * Initialize the module
   * Override in subclasses to perform setup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug(`Module already initialized: ${this.name}`);
      return;
    }

    this.logger.info(`Initializing module: ${this.name}`);

    // Set up module-specific operations
    this.setupOperations();

    this.initialized = true;
    this.logger.info(`Module initialized: ${this.name}`);
  }

  /**
   * Setup operations for this module
   * Must be implemented by subclasses
   */
  protected abstract setupOperations(): void;

  /**
   * Execute an operation
   */
  async execute(operationName: string, params: Record<string, unknown>): Promise<unknown> {
    const operation = this.operations.get(operationName);

    if (!operation) {
      throw new Error(`Operation not found: ${operationName}`);
    }

    const startTime = Date.now();

    try {
      const result = await operation.execute(params);
      const duration = Date.now() - startTime;

      this.session.recordOperation(`${this.name}.${operationName}`, true, duration);
      this.logger.debug(`Operation completed: ${operationName} (${duration}ms)`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.session.recordOperation(`${this.name}.${operationName}`, false, duration);
      this.logger.error(`Operation failed: ${operationName}`, error);
      throw error;
    }
  }

  /**
   * Get operation metadata
   */
  getOperation(operationName: string): Operation | undefined {
    return this.operations.get(operationName);
  }

  /**
   * List all operations in this module
   */
  listOperations(): string[] {
    return Array.from(this.operations.keys());
  }

  /**
   * Dispose of module resources
   */
  async dispose(): Promise<void> {
    this.operations.clear();
    this.initialized = false;
    this.logger.info(`Module disposed: ${this.name}`);
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.initialized,
      operationCount: this.operations.size,
      operations: this.listOperations(),
    };
  }

  /**
   * Create an operation definition
   */
  protected createOperation(
    name: string,
    description: string,
    params: Record<string, ParameterInfo>,
    execute: (params: Record<string, unknown>) => Promise<unknown>,
    example?: string
  ): Operation {
    return {
      name,
      description,
      params,
      returns: 'any',
      example,
      execute,
    };
  }
}
