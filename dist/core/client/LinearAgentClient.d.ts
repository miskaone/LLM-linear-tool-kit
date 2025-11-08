/**
 * Linear Agent Client - Core entry point for the Linear Toolkit
 * Provides high-level API for AI agents to interact with Linear project management
 */
import { ToolkitConfig, Issue, WorkContext, CodeContext, Comment, Cycle, CreateIssueInput, AddCommentInput, UpdateProgressInput, SearchQuery, SearchResult, IssueRelation } from '@types/linear.types';
import { SessionManager } from './SessionManager';
import { ModuleLoader } from '@modules/ModuleLoader';
export declare class LinearAgentClient {
    private config;
    private session;
    private graphqlClient;
    private moduleLoader;
    private logger;
    private cache;
    private constructor();
    /**
     * Create a new LinearAgentClient instance
     * Loads configuration from environment or accepts explicit config
     */
    static create(configOverride?: Partial<ToolkitConfig>): Promise<LinearAgentClient>;
    /**
     * Get the current session manager
     */
    getSession(): SessionManager;
    /**
     * Get the module loader
     */
    getModuleLoader(): ModuleLoader;
    /**
     * Load a module by name
     * @param moduleName - Name of the module to load (e.g., 'issues', 'comments', 'labels', 'cycles')
     */
    loadModule(moduleName: string): Promise<import("@types/linear.types").Module>;
    /**
     * Load multiple modules at once
     */
    loadModules(moduleNames: string[]): Promise<Map<string, any>>;
    /**
     * Check if a module is loaded
     */
    isModuleLoaded(moduleName: string): boolean;
    /**
     * Get all loaded modules
     */
    getLoadedModules(): Map<string, any>;
    /**
     * Execute an operation in a loaded module
     * @param operationName - Name of the operation to execute
     * @param params - Parameters for the operation
     */
    executeModuleOperation(operationName: string, params: Record<string, unknown>): Promise<unknown>;
    /**
     * Get work context for the current user
     * Returns assigned issues, current sprint, blocked items, etc.
     */
    getActiveWork(): Promise<WorkContext>;
    /**
     * Find an issue by ID
     */
    findIssueById(issueId: string): Promise<Issue | undefined>;
    /**
     * Find issues related to code files/functions
     * Uses issue descriptions and labels to match code context
     */
    findRelevantIssues(context: CodeContext): Promise<Issue[]>;
    /**
     * Search for issues using a query string
     */
    searchIssues(query: SearchQuery): Promise<SearchResult>;
    /**
     * Create a new issue
     */
    createIssue(input: CreateIssueInput): Promise<Issue>;
    /**
     * Update issue progress with code change information
     */
    updateIssueProgress(input: UpdateProgressInput): Promise<Issue>;
    /**
     * Add a comment to an issue
     */
    addComment(input: AddCommentInput): Promise<Comment>;
    /**
     * Transition an issue to a new state
     */
    transitionState(issueId: string, stateId: string): Promise<Issue>;
    /**
     * Get current sprint/cycle
     */
    getCurrentSprint(teamId?: string): Promise<Cycle | undefined>;
    /**
     * Link two issues (create dependency relationship)
     */
    linkIssues(fromIssueId: string, toIssueId: string, type: 'blocks' | 'relates_to'): Promise<IssueRelation>;
    /**
     * Get client statistics for monitoring
     */
    getStats(): {
        session: Omit<import("@types/linear.types").SessionState, "context"> & {
            contextSize: number;
        };
        operations: {
            total: number;
            successful: number;
            failed: number;
            successRate: number;
            avgDuration: number;
        };
        cache: {
            size: number;
            maxSize: number;
            hits: number;
            misses: number;
            total: number;
            hitRate: number;
            utilizationPercent: number;
        };
    };
    /**
     * Dispose of client resources
     */
    dispose(): void;
    /**
     * Format progress information as a comment string
     */
    private formatProgressComment;
}
//# sourceMappingURL=LinearAgentClient.d.ts.map