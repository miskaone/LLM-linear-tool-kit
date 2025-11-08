"use strict";
/**
 * Base Module class for Linear Toolkit
 * Provides common functionality for all modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModule = void 0;
const logger_1 = require("@utils/logger");
class BaseModule {
    constructor(name, config, graphqlClient, session) {
        this.logger = (0, logger_1.getLogger)(this.constructor.name);
        this.initialized = false;
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
    registerOperation(operation) {
        this.operations.set(operation.name, operation);
        this.logger.debug(`Operation registered: ${operation.name}`);
    }
    /**
     * Initialize the module
     * Override in subclasses to perform setup
     */
    async initialize() {
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
     * Execute an operation
     */
    async execute(operationName, params) {
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.session.recordOperation(`${this.name}.${operationName}`, false, duration);
            this.logger.error(`Operation failed: ${operationName}`, error);
            throw error;
        }
    }
    /**
     * Get operation metadata
     */
    getOperation(operationName) {
        return this.operations.get(operationName);
    }
    /**
     * List all operations in this module
     */
    listOperations() {
        return Array.from(this.operations.keys());
    }
    /**
     * Dispose of module resources
     */
    async dispose() {
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
    createOperation(name, description, params, execute, example) {
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
exports.BaseModule = BaseModule;
//# sourceMappingURL=BaseModule.js.map