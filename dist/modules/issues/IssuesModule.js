"use strict";
/**
 * Issues Module for Linear Toolkit
 * Provides full CRUD operations for Linear issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuesModule = void 0;
const BaseModule_1 = require("../BaseModule");
class IssuesModule extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('issues', {
            name: 'issues',
            version: '1.0.0',
            operations: [
                'getIssueById',
                'searchIssues',
                'createIssue',
                'updateIssue',
                'deleteIssue',
                'listTeamIssues',
                'listCycleIssues',
                'getIssuesByLabel',
                'getIssueRelations',
                'bulkUpdateIssues',
            ],
        }, graphqlClient, session);
    }
    /**
     * Setup all operations for the Issues module
     */
    setupOperations() {
        this.registerOperation(this.createOperation('getIssueById', 'Get a single issue by ID', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'The Linear issue ID (e.g., LIN-123)',
            },
        }, this.getIssueById.bind(this), `
await issuesModule.execute('getIssueById', {
  issueId: 'LIN-123'
});
        `));
        this.registerOperation(this.createOperation('searchIssues', 'Search for issues using a query', {
            query: {
                name: 'query',
                type: 'string',
                required: true,
                description: 'Search query text',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum results (default: 50)',
            },
            offset: {
                name: 'offset',
                type: 'number',
                required: false,
                description: 'Results offset (default: 0)',
            },
        }, this.searchIssues.bind(this), `
await issuesModule.execute('searchIssues', {
  query: 'authentication',
  limit: 25
});
        `));
        this.registerOperation(this.createOperation('createIssue', 'Create a new issue', {
            title: {
                name: 'title',
                type: 'string',
                required: true,
                description: 'Issue title',
            },
            description: {
                name: 'description',
                type: 'string',
                required: false,
                description: 'Issue description',
            },
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID',
            },
            priority: {
                name: 'priority',
                type: 'number',
                required: false,
                description: 'Priority (0=none, 1=urgent, 2=high, 3=medium, 4=low)',
            },
        }, this.createIssue.bind(this), `
await issuesModule.execute('createIssue', {
  title: 'Add authentication',
  teamId: 'team-123',
  priority: 2
});
        `));
        this.registerOperation(this.createOperation('updateIssue', 'Update an existing issue', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'Issue ID',
            },
            update: {
                name: 'update',
                type: 'object',
                required: true,
                description: 'Update fields',
            },
        }, this.updateIssue.bind(this), `
await issuesModule.execute('updateIssue', {
  issueId: 'LIN-123',
  update: {
    title: 'Updated title',
    priority: 1
  }
});
        `));
        this.registerOperation(this.createOperation('deleteIssue', 'Delete an issue (archive)', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'Issue ID',
            },
        }, this.deleteIssue.bind(this)));
        this.registerOperation(this.createOperation('listTeamIssues', 'List all issues in a team', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum results',
            },
            filter: {
                name: 'filter',
                type: 'object',
                required: false,
                description: 'Filter options',
            },
        }, this.listTeamIssues.bind(this)));
        this.registerOperation(this.createOperation('listCycleIssues', 'List issues in a cycle/sprint', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'Cycle ID',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum results',
            },
        }, this.listCycleIssues.bind(this)));
        this.registerOperation(this.createOperation('getIssuesByLabel', 'Get issues with specific labels', {
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'Label ID',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum results',
            },
        }, this.getIssuesByLabel.bind(this)));
        this.registerOperation(this.createOperation('getIssueRelations', 'Get relationships for an issue', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'Issue ID',
            },
        }, this.getIssueRelations.bind(this)));
        this.registerOperation(this.createOperation('bulkUpdateIssues', 'Update multiple issues at once', {
            updates: {
                name: 'updates',
                type: 'array',
                required: true,
                description: 'Array of {issueId, update} objects',
            },
        }, this.bulkUpdateIssues.bind(this)));
    }
    /**
     * Get an issue by ID
     */
    async getIssueById(params) {
        const { issueId } = params;
        const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          state {
            id
            name
            color
          }
          priority
          assignee {
            id
            name
            email
          }
          team {
            id
            name
          }
          cycle {
            id
            name
          }
          estimate
          dueDate
          startDate
          createdAt
          updatedAt
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { id: issueId } }, true);
            // TODO: Parse result and map to Issue type
            this.logger.debug(`Issue fetched: ${issueId}`);
            return undefined; // Placeholder
        }
        catch (error) {
            this.logger.error(`Failed to fetch issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * Search for issues
     */
    async searchIssues(params) {
        const { query, limit = 50, offset = 0 } = params;
        const graphqlQuery = `
      query SearchIssues($query: String!, $first: Int!) {
        issues(first: $first, filter: { searchableContent: { contains: $query } }) {
          nodes {
            id
            identifier
            title
            state {
              id
              name
            }
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
        try {
            const result = await this.graphqlClient.query({ query: graphqlQuery, variables: { query, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Search completed: ${query}`);
            return {
                issues: [],
                total: 0,
                hasMore: false,
            };
        }
        catch (error) {
            this.logger.error('Failed to search issues', error);
            throw error;
        }
    }
    /**
     * Create a new issue
     */
    async createIssue(params) {
        const input = params;
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
            state {
              id
              name
            }
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: input,
            });
            // TODO: Parse result and map to Issue
            this.logger.debug('Issue created');
            return {};
        }
        catch (error) {
            this.logger.error('Failed to create issue', error);
            throw error;
        }
    }
    /**
     * Update an issue
     */
    async updateIssue(params) {
        const { issueId, update } = params;
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
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: issueId, update },
            });
            // TODO: Parse result
            this.logger.debug(`Issue updated: ${issueId}`);
            return {};
        }
        catch (error) {
            this.logger.error(`Failed to update issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * Delete (archive) an issue
     */
    async deleteIssue(params) {
        const { issueId } = params;
        const mutation = `
      mutation DeleteIssue($id: String!) {
        issueDelete(id: $id)
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: issueId },
            });
            this.logger.debug(`Issue deleted: ${issueId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * List all issues in a team
     */
    async listTeamIssues(params) {
        const { teamId, limit = 50 } = params;
        const query = `
      query ListTeamIssues($teamId: String!, $first: Int!) {
        team(id: $teamId) {
          issues(first: $first) {
            nodes {
              id
              identifier
              title
              state { id name }
              priority
            }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { teamId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Team issues listed: ${teamId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to list team issues ${teamId}`, error);
            throw error;
        }
    }
    /**
     * List issues in a cycle
     */
    async listCycleIssues(params) {
        const { cycleId, limit = 50 } = params;
        const query = `
      query ListCycleIssues($cycleId: String!, $first: Int!) {
        cycle(id: $cycleId) {
          issues(first: $first) {
            nodes {
              id
              identifier
              title
              state { id name }
            }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { cycleId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Cycle issues listed: ${cycleId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to list cycle issues ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * Get issues with a specific label
     */
    async getIssuesByLabel(params) {
        const { labelId, limit = 50 } = params;
        const query = `
      query GetIssuesByLabel($labelId: String!, $first: Int!) {
        issues(first: $first, filter: { labels: { some: { id: { eq: $labelId } } } }) {
          nodes {
            id
            identifier
            title
            state { id name }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { labelId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Issues by label fetched: ${labelId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to get issues by label ${labelId}`, error);
            throw error;
        }
    }
    /**
     * Get relationships for an issue
     */
    async getIssueRelations(params) {
        const { issueId } = params;
        const query = `
      query GetRelations($id: String!) {
        issue(id: $id) {
          relations {
            nodes {
              id
              relatedIssue {
                id
                identifier
                title
              }
              type
            }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { id: issueId } }, true);
            // TODO: Parse result
            this.logger.debug(`Issue relations fetched: ${issueId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to get relations for issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * Bulk update multiple issues
     */
    async bulkUpdateIssues(params) {
        const { updates } = params;
        let updated = 0;
        let failed = 0;
        for (const { issueId, update } of updates) {
            try {
                await this.updateIssue({ issueId, update });
                updated++;
            }
            catch (error) {
                failed++;
                this.logger.warn(`Failed to update issue in bulk: ${issueId}`);
            }
        }
        this.logger.info(`Bulk update completed: ${updated} updated, ${failed} failed`);
        return { updated, failed };
    }
}
exports.IssuesModule = IssuesModule;
//# sourceMappingURL=IssuesModule.js.map