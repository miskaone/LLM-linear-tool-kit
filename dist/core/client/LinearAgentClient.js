"use strict";
/**
 * Linear Agent Client - Core entry point for the Linear Toolkit
 * Provides high-level API for AI agents to interact with Linear project management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearAgentClient = void 0;
const SessionManager_1 = require("./SessionManager");
const GraphQLClient_1 = require("./GraphQLClient");
const ModuleLoader_1 = require("@modules/ModuleLoader");
const logger_1 = require("@utils/logger");
const config_1 = require("@utils/config");
const cache_1 = require("@utils/cache");
class LinearAgentClient {
    constructor(config, session, graphqlClient, moduleLoader) {
        this.logger = (0, logger_1.getLogger)('LinearAgentClient');
        this.cache = (0, cache_1.getCache)();
        this.config = config;
        this.session = session;
        this.graphqlClient = graphqlClient;
        this.moduleLoader = moduleLoader;
        this.logger.debug('LinearAgentClient initialized');
    }
    /**
     * Create a new LinearAgentClient instance
     * Loads configuration from environment or accepts explicit config
     */
    static async create(configOverride) {
        const logger = (0, logger_1.getLogger)('LinearAgentClient');
        // Load base configuration from environment
        let config;
        try {
            config = (0, config_1.loadConfig)();
        }
        catch (error) {
            logger.error('Failed to load configuration from environment', error);
            throw error;
        }
        // Override with explicit config if provided
        if (configOverride) {
            config = { ...config, ...configOverride };
        }
        // Create session manager
        const session = new SessionManager_1.SessionManager({
            apiKey: config.apiKey,
            persistenceType: config.sessionPersistence || 'memory',
            cacheTTL: config.sessionCacheTTL || 3600,
        });
        // Initialize cache if configured
        if (config.cache?.enabled) {
            const { ttl, maxSize } = config.cache;
            // Cache is already initialized globally, just configure it
        }
        // Create GraphQL client
        const graphqlConfig = {
            apiKey: config.apiKey,
            endpoint: config.endpoint || 'https://api.linear.app/graphql',
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
        };
        const graphqlClient = new GraphQLClient_1.GraphQLClient(graphqlConfig);
        // Create module loader and register module factories
        const moduleLoader = new ModuleLoader_1.ModuleLoader(graphqlClient, session);
        // Register module factories
        moduleLoader.registerModuleFactory('issues', (gql, sess) => {
            const { IssuesModule } = require('@modules/issues/IssuesModule');
            return new IssuesModule(gql, sess);
        });
        moduleLoader.registerModuleFactory('comments', (gql, sess) => {
            const { CommentsModule } = require('@modules/comments/CommentsModule');
            return new CommentsModule(gql, sess);
        }, ['issues']);
        moduleLoader.registerModuleFactory('labels', (gql, sess) => {
            const { LabelsModule } = require('@modules/labels/LabelsModule');
            return new LabelsModule(gql, sess);
        }, ['issues']);
        moduleLoader.registerModuleFactory('cycles', (gql, sess) => {
            const { CyclesModule } = require('@modules/cycles/CyclesModule');
            return new CyclesModule(gql, sess);
        }, ['issues']);
        // Phase 3: Code Integration and Intelligent Features
        moduleLoader.registerModuleFactory('code', (gql, sess) => {
            const { CodeIntegrationModule } = require('@modules/code/CodeIntegrationModule');
            return new CodeIntegrationModule(gql, sess);
        }, ['issues']);
        moduleLoader.registerModuleFactory('intelligence', (gql, sess) => {
            const { IntelligenceModule } = require('@modules/intelligence/IntelligenceModule');
            return new IntelligenceModule(gql, sess);
        }, ['issues', 'labels']);
        moduleLoader.registerModuleFactory('batch', (gql, sess) => {
            const { BatchOperationsModule } = require('@modules/batch/BatchOperationsModule');
            return new BatchOperationsModule(gql, sess);
        }, ['issues']);
        moduleLoader.registerModuleFactory('analytics', (gql, sess) => {
            const { AnalyticsModule } = require('@modules/analytics/AnalyticsModule');
            return new AnalyticsModule(gql, sess);
        }, ['issues']);
        // Validate dependencies
        const validation = moduleLoader.validateDependencies();
        if (!validation.valid) {
            logger.error('Module dependency validation failed', validation.errors);
            throw new Error(`Module dependency validation failed: ${validation.errors.join('; ')}`);
        }
        logger.info('LinearAgentClient created successfully');
        return new LinearAgentClient(config, session, graphqlClient, moduleLoader);
    }
    /**
     * Get the current session manager
     */
    getSession() {
        return this.session;
    }
    /**
     * Get the module loader
     */
    getModuleLoader() {
        return this.moduleLoader;
    }
    /**
     * Load a module by name
     * @param moduleName - Name of the module to load (e.g., 'issues', 'comments', 'labels', 'cycles')
     */
    async loadModule(moduleName) {
        return this.moduleLoader.loadModule(moduleName);
    }
    /**
     * Load multiple modules at once
     */
    async loadModules(moduleNames) {
        return this.moduleLoader.loadModules(moduleNames);
    }
    /**
     * Check if a module is loaded
     */
    isModuleLoaded(moduleName) {
        return this.moduleLoader.isModuleLoaded(moduleName);
    }
    /**
     * Get all loaded modules
     */
    getLoadedModules() {
        return this.moduleLoader.getLoadedModules();
    }
    /**
     * Execute an operation in a loaded module
     * @param operationName - Name of the operation to execute
     * @param params - Parameters for the operation
     */
    async executeModuleOperation(operationName, params) {
        return this.moduleLoader.executeOperation(operationName, params);
    }
    /**
     * Get work context for the current user
     * Returns assigned issues, current sprint, blocked items, etc.
     */
    async getActiveWork() {
        const startTime = Date.now();
        try {
            const query = `
        query {
          viewer {
            assignedIssues(first: 50) {
              nodes {
                id
                identifier
                title
                state { id name }
                priority
                assignee { id name email }
              }
            }
            teams {
              nodes {
                id
                name
                cycles(first: 1, filter: { isActive: true }) {
                  nodes {
                    id
                    name
                    startsAt
                    endsAt
                  }
                }
              }
            }
          }
        }
      `;
            const result = await this.graphqlClient.query({ query }, this.config.cache?.enabled);
            // TODO: Parse result and create WorkContext object
            const workContext = {
                activeIssues: [],
                blockedIssues: [],
                upcomingDeadlines: [],
                teamMembers: [],
                userTeams: [],
                assignedToCurrentUser: [],
            };
            const duration = Date.now() - startTime;
            this.session.recordOperation('getActiveWork', true, duration);
            this.logger.info(`getActiveWork completed in ${duration}ms`);
            return workContext;
        }
        catch (error) {
            this.session.recordOperation('getActiveWork', false, Date.now() - startTime);
            this.logger.error('Failed to get active work', error);
            throw error;
        }
    }
    /**
     * Find an issue by ID
     */
    async findIssueById(issueId) {
        const startTime = Date.now();
        try {
            const cacheKey = `issue:${issueId}`;
            // Check cache first
            if (this.config.cache?.enabled) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    this.logger.debug(`Issue ${issueId} found in cache`);
                    return cached;
                }
            }
            const query = `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            description
            state { id name }
            priority
            assignee { id name email }
            team { id name }
            cycle { id name }
            estimate
            createdAt
            updatedAt
          }
        }
      `;
            const result = await this.graphqlClient.query({ query, variables: { id: issueId } }, this.config.cache?.enabled);
            // TODO: Parse result and create Issue object
            const issue = undefined;
            if (issue && this.config.cache?.enabled) {
                this.cache.set(cacheKey, issue, this.config.cache.ttl);
            }
            const duration = Date.now() - startTime;
            this.session.recordOperation('findIssueById', !!issue, duration);
            return issue;
        }
        catch (error) {
            this.session.recordOperation('findIssueById', false, Date.now() - startTime);
            this.logger.error(`Failed to find issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * Find issues related to code files/functions
     * Uses issue descriptions and labels to match code context
     */
    async findRelevantIssues(context) {
        const startTime = Date.now();
        try {
            const files = context.files.join(' OR ');
            const query = `
        query SearchIssues($query: String!) {
          issues(first: 50, filter: { searchableContent: { containsAll: [$query] } }) {
            nodes {
              id
              identifier
              title
              state { id name }
              priority
            }
          }
        }
      `;
            const result = await this.graphqlClient.query({ query, variables: { query: files } }, this.config.cache?.enabled);
            // TODO: Parse result and create Issue[] array
            const issues = [];
            const duration = Date.now() - startTime;
            this.session.recordOperation('findRelevantIssues', true, duration);
            this.logger.info(`Found ${issues.length} relevant issues in ${duration}ms`);
            return issues;
        }
        catch (error) {
            this.session.recordOperation('findRelevantIssues', false, Date.now() - startTime);
            this.logger.error('Failed to find relevant issues', error);
            throw error;
        }
    }
    /**
     * Search for issues using a query string
     */
    async searchIssues(query) {
        const startTime = Date.now();
        try {
            const graphqlQuery = `
        query SearchIssues($query: String!, $first: Int) {
          issues(first: $first, filter: { searchableContent: { contains: $query } }) {
            nodes {
              id
              identifier
              title
              state { id name }
              priority
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }
      `;
            const result = await this.graphqlClient.query({
                query: graphqlQuery,
                variables: {
                    query: query.query,
                    first: query.limit || 50,
                },
            }, this.config.cache?.enabled);
            // TODO: Parse result
            const searchResult = {
                issues: [],
                total: 0,
                hasMore: false,
            };
            const duration = Date.now() - startTime;
            this.session.recordOperation('searchIssues', true, duration);
            return searchResult;
        }
        catch (error) {
            this.session.recordOperation('searchIssues', false, Date.now() - startTime);
            this.logger.error('Failed to search issues', error);
            throw error;
        }
    }
    /**
     * Create a new issue
     */
    async createIssue(input) {
        const startTime = Date.now();
        try {
            const mutation = `
        mutation CreateIssue(
          $title: String!
          $description: String
          $teamId: String!
          $priority: Int
          $assigneeId: String
          $cycleId: String
          $estimate: Int
        ) {
          issueCreate(
            input: {
              title: $title
              description: $description
              teamId: $teamId
              priority: $priority
              assigneeId: $assigneeId
              cycleId: $cycleId
              estimate: $estimate
            }
          ) {
            issue {
              id
              identifier
              title
              state { id name }
              priority
            }
            success
          }
        }
      `;
            const result = await this.graphqlClient.mutate({ query: mutation, variables: input });
            // TODO: Parse result and create Issue object
            const issue = {};
            // Invalidate related caches
            this.cache.invalidatePattern(/^issues:/);
            const duration = Date.now() - startTime;
            this.session.recordOperation('createIssue', true, duration);
            this.logger.info(`Issue created: ${issue.identifier}`);
            return issue;
        }
        catch (error) {
            this.session.recordOperation('createIssue', false, Date.now() - startTime);
            this.logger.error('Failed to create issue', error);
            throw error;
        }
    }
    /**
     * Update issue progress with code change information
     */
    async updateIssueProgress(input) {
        const startTime = Date.now();
        try {
            const { issueId, progress, comment } = input;
            // Update issue
            const mutation = `
        mutation UpdateIssue($id: String!, $update: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $update) {
            issue {
              id
              identifier
              title
            }
            success
          }
        }
      `;
            const progressNote = this.formatProgressComment(progress);
            const fullComment = comment ? `${comment}\n\n${progressNote}` : progressNote;
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: {
                    id: issueId,
                    update: {
                    // Progress information would be stored in custom fields or comments
                    },
                },
            });
            // TODO: Parse result
            const issue = {};
            // Add comment with progress details
            if (fullComment) {
                await this.addComment({ issueId, body: fullComment });
            }
            // Invalidate cache
            this.cache.delete(`issue:${issueId}`);
            const duration = Date.now() - startTime;
            this.session.recordOperation('updateIssueProgress', true, duration);
            return issue;
        }
        catch (error) {
            this.session.recordOperation('updateIssueProgress', false, Date.now() - startTime);
            this.logger.error(`Failed to update progress for issue ${input.issueId}`, error);
            throw error;
        }
    }
    /**
     * Add a comment to an issue
     */
    async addComment(input) {
        const startTime = Date.now();
        try {
            const mutation = `
        mutation CreateComment($issueId: String!, $body: String!) {
          commentCreate(input: { issueId: $issueId, body: $body }) {
            comment {
              id
              body
              createdAt
            }
            success
          }
        }
      `;
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: input,
            });
            // TODO: Parse result
            const comment = {};
            // Invalidate issue cache
            this.cache.delete(`issue:${input.issueId}`);
            const duration = Date.now() - startTime;
            this.session.recordOperation('addComment', true, duration);
            return comment;
        }
        catch (error) {
            this.session.recordOperation('addComment', false, Date.now() - startTime);
            this.logger.error(`Failed to add comment to issue ${input.issueId}`, error);
            throw error;
        }
    }
    /**
     * Transition an issue to a new state
     */
    async transitionState(issueId, stateId) {
        const startTime = Date.now();
        try {
            const mutation = `
        mutation UpdateIssueState($id: String!, $stateId: String!) {
          issueUpdate(id: $id, input: { stateId: $stateId }) {
            issue {
              id
              identifier
              state { id name }
            }
            success
          }
        }
      `;
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: issueId, stateId },
            });
            // TODO: Parse result
            const issue = {};
            // Invalidate cache
            this.cache.delete(`issue:${issueId}`);
            const duration = Date.now() - startTime;
            this.session.recordOperation('transitionState', true, duration);
            return issue;
        }
        catch (error) {
            this.session.recordOperation('transitionState', false, Date.now() - startTime);
            this.logger.error(`Failed to transition issue ${issueId} to state ${stateId}`, error);
            throw error;
        }
    }
    /**
     * Get current sprint/cycle
     */
    async getCurrentSprint(teamId) {
        const startTime = Date.now();
        try {
            const query = `
        query GetCurrentCycle($teamId: String) {
          cycles(first: 1, filter: { isActive: true, teamId: $teamId }) {
            nodes {
              id
              name
              number
              startsAt
              endsAt
              completionPercentage
              issues { nodes { id } }
            }
          }
        }
      `;
            const result = await this.graphqlClient.query({ query, variables: { teamId } }, this.config.cache?.enabled);
            // TODO: Parse result
            const cycle = undefined;
            const duration = Date.now() - startTime;
            this.session.recordOperation('getCurrentSprint', !!cycle, duration);
            return cycle;
        }
        catch (error) {
            this.session.recordOperation('getCurrentSprint', false, Date.now() - startTime);
            this.logger.error('Failed to get current sprint', error);
            throw error;
        }
    }
    /**
     * Link two issues (create dependency relationship)
     */
    async linkIssues(fromIssueId, toIssueId, type) {
        const startTime = Date.now();
        try {
            const mutation = `
        mutation CreateIssueRelation(
          $fromId: String!
          $toId: String!
          $type: IssueRelationType!
        ) {
          issueRelationCreate(
            input: { fromIssueId: $fromId, toIssueId: $toId, type: $type }
          ) {
            issueRelation {
              id
              type
              createdAt
            }
            success
          }
        }
      `;
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { fromId: fromIssueId, toId: toIssueId, type },
            });
            // TODO: Parse result
            const relation = {};
            // Invalidate caches
            this.cache.delete(`issue:${fromIssueId}`);
            this.cache.delete(`issue:${toIssueId}`);
            const duration = Date.now() - startTime;
            this.session.recordOperation('linkIssues', true, duration);
            return relation;
        }
        catch (error) {
            this.session.recordOperation('linkIssues', false, Date.now() - startTime);
            this.logger.error(`Failed to link issues ${fromIssueId} and ${toIssueId}`, error);
            throw error;
        }
    }
    /**
     * Get client statistics for monitoring
     */
    getStats() {
        const operationStats = this.session.getOperationStats();
        const cacheStats = this.cache.getStats();
        return {
            session: this.session.getSummary(),
            operations: operationStats,
            cache: cacheStats,
        };
    }
    /**
     * Dispose of client resources
     */
    dispose() {
        this.session.dispose();
        this.logger.info('LinearAgentClient disposed');
    }
    /**
     * Format progress information as a comment string
     */
    formatProgressComment(progress) {
        const lines = ['## Progress Update'];
        if (progress.filesModified.length > 0) {
            lines.push(`- **Files Modified**: ${progress.filesModified.join(', ')}`);
        }
        lines.push(`- **Tests Added**: ${progress.testsAdded ? 'Yes' : 'No'}`);
        lines.push(`- **Tests Passing**: ${progress.testsPass ? 'Yes' : 'No'}`);
        if (progress.linesAdded > 0 || progress.linesRemoved > 0) {
            lines.push(`- **Lines Changed**: +${progress.linesAdded} / -${progress.linesRemoved}`);
        }
        lines.push(`- **Ready for Review**: ${progress.readyForReview ? 'Yes' : 'No'}`);
        return lines.join('\n');
    }
}
exports.LinearAgentClient = LinearAgentClient;
//# sourceMappingURL=LinearAgentClient.js.map