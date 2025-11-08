/**
 * Linear Agent Client - Core entry point for the Linear Toolkit
 * Provides high-level API for AI agents to interact with Linear project management
 */

import {
  ToolkitConfig,
  Issue,
  WorkContext,
  CodeContext,
  Comment,
  Cycle,
  CreateIssueInput,
  UpdateIssueInput,
  AddCommentInput,
  UpdateProgressInput,
  SearchQuery,
  SearchResult,
  Progress,
  Transition,
  UpdateResult,
  OperationError,
  IssueRelation,
} from '@types/linear.types';
import { SessionManager } from './SessionManager';
import { GraphQLClient, GraphQLClientConfig } from './GraphQLClient';
import { getLogger } from '@utils/logger';
import { loadConfig } from '@utils/config';
import { getCache } from '@utils/cache';

export class LinearAgentClient {
  private config: ToolkitConfig;
  private session: SessionManager;
  private graphqlClient: GraphQLClient;
  private logger = getLogger('LinearAgentClient');
  private cache = getCache();
  private moduleMap: Map<string, unknown> = new Map();

  private constructor(config: ToolkitConfig, session: SessionManager, graphqlClient: GraphQLClient) {
    this.config = config;
    this.session = session;
    this.graphqlClient = graphqlClient;
    this.logger.debug('LinearAgentClient initialized');
  }

  /**
   * Create a new LinearAgentClient instance
   * Loads configuration from environment or accepts explicit config
   */
  static async create(configOverride?: Partial<ToolkitConfig>): Promise<LinearAgentClient> {
    const logger = getLogger('LinearAgentClient');

    // Load base configuration from environment
    let config: ToolkitConfig;
    try {
      config = loadConfig();
    } catch (error) {
      logger.error('Failed to load configuration from environment', error);
      throw error;
    }

    // Override with explicit config if provided
    if (configOverride) {
      config = { ...config, ...configOverride };
    }

    // Create session manager
    const session = new SessionManager({
      apiKey: config.apiKey,
      persistenceType: (config as any).sessionPersistence || 'memory',
      cacheTTL: (config as any).sessionCacheTTL || 3600,
    });

    // Initialize cache if configured
    if (config.cache?.enabled) {
      const { ttl, maxSize } = config.cache;
      // Cache is already initialized globally, just configure it
    }

    // Create GraphQL client
    const graphqlConfig: GraphQLClientConfig = {
      apiKey: config.apiKey,
      endpoint: config.endpoint || 'https://api.linear.app/graphql',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };

    const graphqlClient = new GraphQLClient(graphqlConfig);

    logger.info('LinearAgentClient created successfully');
    return new LinearAgentClient(config, session, graphqlClient);
  }

  /**
   * Get the current session manager
   */
  getSession(): SessionManager {
    return this.session;
  }

  /**
   * Get work context for the current user
   * Returns assigned issues, current sprint, blocked items, etc.
   */
  async getActiveWork(): Promise<WorkContext> {
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

      const result = await this.graphqlClient.query(
        { query },
        this.config.cache?.enabled
      );

      // TODO: Parse result and create WorkContext object
      const workContext: WorkContext = {
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
    } catch (error) {
      this.session.recordOperation('getActiveWork', false, Date.now() - startTime);
      this.logger.error('Failed to get active work', error);
      throw error;
    }
  }

  /**
   * Find an issue by ID
   */
  async findIssueById(issueId: string): Promise<Issue | undefined> {
    const startTime = Date.now();

    try {
      const cacheKey = `issue:${issueId}`;

      // Check cache first
      if (this.config.cache?.enabled) {
        const cached = this.cache.get<Issue>(cacheKey);
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

      const result = await this.graphqlClient.query(
        { query, variables: { id: issueId } },
        this.config.cache?.enabled
      );

      // TODO: Parse result and create Issue object
      const issue: Issue | undefined = undefined;

      if (issue && this.config.cache?.enabled) {
        this.cache.set(cacheKey, issue, this.config.cache.ttl);
      }

      const duration = Date.now() - startTime;
      this.session.recordOperation('findIssueById', !!issue, duration);

      return issue;
    } catch (error) {
      this.session.recordOperation('findIssueById', false, Date.now() - startTime);
      this.logger.error(`Failed to find issue ${issueId}`, error);
      throw error;
    }
  }

  /**
   * Find issues related to code files/functions
   * Uses issue descriptions and labels to match code context
   */
  async findRelevantIssues(context: CodeContext): Promise<Issue[]> {
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

      const result = await this.graphqlClient.query(
        { query, variables: { query: files } },
        this.config.cache?.enabled
      );

      // TODO: Parse result and create Issue[] array
      const issues: Issue[] = [];

      const duration = Date.now() - startTime;
      this.session.recordOperation('findRelevantIssues', true, duration);
      this.logger.info(`Found ${issues.length} relevant issues in ${duration}ms`);

      return issues;
    } catch (error) {
      this.session.recordOperation('findRelevantIssues', false, Date.now() - startTime);
      this.logger.error('Failed to find relevant issues', error);
      throw error;
    }
  }

  /**
   * Search for issues using a query string
   */
  async searchIssues(query: SearchQuery): Promise<SearchResult> {
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

      const result = await this.graphqlClient.query(
        {
          query: graphqlQuery,
          variables: {
            query: query.query,
            first: query.limit || 50,
          },
        },
        this.config.cache?.enabled
      );

      // TODO: Parse result
      const searchResult: SearchResult = {
        issues: [],
        total: 0,
        hasMore: false,
      };

      const duration = Date.now() - startTime;
      this.session.recordOperation('searchIssues', true, duration);

      return searchResult;
    } catch (error) {
      this.session.recordOperation('searchIssues', false, Date.now() - startTime);
      this.logger.error('Failed to search issues', error);
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(input: CreateIssueInput): Promise<Issue> {
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
      const issue: Issue = {} as Issue;

      // Invalidate related caches
      this.cache.invalidatePattern(/^issues:/);

      const duration = Date.now() - startTime;
      this.session.recordOperation('createIssue', true, duration);
      this.logger.info(`Issue created: ${issue.identifier}`);

      return issue;
    } catch (error) {
      this.session.recordOperation('createIssue', false, Date.now() - startTime);
      this.logger.error('Failed to create issue', error);
      throw error;
    }
  }

  /**
   * Update issue progress with code change information
   */
  async updateIssueProgress(input: UpdateProgressInput): Promise<Issue> {
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
      const issue: Issue = {} as Issue;

      // Add comment with progress details
      if (fullComment) {
        await this.addComment({ issueId, body: fullComment });
      }

      // Invalidate cache
      this.cache.delete(`issue:${issueId}`);

      const duration = Date.now() - startTime;
      this.session.recordOperation('updateIssueProgress', true, duration);

      return issue;
    } catch (error) {
      this.session.recordOperation('updateIssueProgress', false, Date.now() - startTime);
      this.logger.error(`Failed to update progress for issue ${input.issueId}`, error);
      throw error;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(input: AddCommentInput): Promise<Comment> {
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
      const comment: Comment = {} as Comment;

      // Invalidate issue cache
      this.cache.delete(`issue:${input.issueId}`);

      const duration = Date.now() - startTime;
      this.session.recordOperation('addComment', true, duration);

      return comment;
    } catch (error) {
      this.session.recordOperation('addComment', false, Date.now() - startTime);
      this.logger.error(`Failed to add comment to issue ${input.issueId}`, error);
      throw error;
    }
  }

  /**
   * Transition an issue to a new state
   */
  async transitionState(issueId: string, stateId: string): Promise<Issue> {
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
      const issue: Issue = {} as Issue;

      // Invalidate cache
      this.cache.delete(`issue:${issueId}`);

      const duration = Date.now() - startTime;
      this.session.recordOperation('transitionState', true, duration);

      return issue;
    } catch (error) {
      this.session.recordOperation('transitionState', false, Date.now() - startTime);
      this.logger.error(`Failed to transition issue ${issueId} to state ${stateId}`, error);
      throw error;
    }
  }

  /**
   * Get current sprint/cycle
   */
  async getCurrentSprint(teamId?: string): Promise<Cycle | undefined> {
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

      const result = await this.graphqlClient.query(
        { query, variables: { teamId } },
        this.config.cache?.enabled
      );

      // TODO: Parse result
      const cycle: Cycle | undefined = undefined;

      const duration = Date.now() - startTime;
      this.session.recordOperation('getCurrentSprint', !!cycle, duration);

      return cycle;
    } catch (error) {
      this.session.recordOperation('getCurrentSprint', false, Date.now() - startTime);
      this.logger.error('Failed to get current sprint', error);
      throw error;
    }
  }

  /**
   * Link two issues (create dependency relationship)
   */
  async linkIssues(fromIssueId: string, toIssueId: string, type: 'blocks' | 'relates_to'): Promise<IssueRelation> {
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
      const relation: IssueRelation = {} as IssueRelation;

      // Invalidate caches
      this.cache.delete(`issue:${fromIssueId}`);
      this.cache.delete(`issue:${toIssueId}`);

      const duration = Date.now() - startTime;
      this.session.recordOperation('linkIssues', true, duration);

      return relation;
    } catch (error) {
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
  dispose(): void {
    this.session.dispose();
    this.logger.info('LinearAgentClient disposed');
  }

  /**
   * Format progress information as a comment string
   */
  private formatProgressComment(progress: Progress): string {
    const lines: string[] = ['## Progress Update'];

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
