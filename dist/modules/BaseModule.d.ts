/**
 * Base Module class for Linear Toolkit
 * Provides common functionality for all modules
 */
import { Module, ModuleConfig, Operation, ParameterInfo } from '@types/linear.types';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare abstract class BaseModule implements Module {
    name: string;
    config: ModuleConfig;
    operations: Map<string, Operation>;
    protected graphqlClient: GraphQLClient;
    protected session: SessionManager;
    protected logger: import("@utils/logger").Logger;
    protected initialized: boolean;
    constructor(name: string, config: ModuleConfig, graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Register an operation in this module
     */
    protected registerOperation(operation: Operation): void;
    /**
     * Initialize the module
     * Override in subclasses to perform setup
     */
    initialize(): Promise<void>;
    /**
     * Setup operations for this module
     * Must be implemented by subclasses
     */
    protected abstract setupOperations(): void;
    /**
     * Execute an operation
     */
    execute(operationName: string, params: Record<string, unknown>): Promise<unknown>;
    /**
     * Get operation metadata
     */
    getOperation(operationName: string): Operation | undefined;
    /**
     * List all operations in this module
     */
    listOperations(): string[];
    /**
     * Dispose of module resources
     */
    dispose(): Promise<void>;
    /**
     * Get module status
     */
    getStatus(): {
        name: string;
        initialized: boolean;
        operationCount: number;
        operations: string[];
    };
    /**
     * Create an operation definition
     */
    protected createOperation(name: string, description: string, params: Record<string, ParameterInfo>, execute: (params: Record<string, unknown>) => Promise<unknown>, example?: string): Operation;
}
//# sourceMappingURL=BaseModule.d.ts.map