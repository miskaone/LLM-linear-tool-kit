"use strict";
/**
 * Cycles Module for Linear Toolkit
 * Provides operations for managing sprints/cycles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyclesModule = void 0;
const BaseModule_1 = require("../BaseModule");
class CyclesModule extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('cycles', {
            name: 'cycles',
            version: '1.0.0',
            operations: [
                'getCurrentCycle',
                'getCycleById',
                'listTeamCycles',
                'createCycle',
                'updateCycle',
                'getCycleIssues',
                'addIssueToCycle',
                'removeIssueFromCycle',
                'closeCycle',
            ],
            dependencies: ['issues'],
        }, graphqlClient, session);
    }
    /**
     * Setup all operations for the Cycles module
     */
    setupOperations() {
        this.registerOperation(this.createOperation('getCurrentCycle', 'Get the currently active cycle for a team', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: false,
                description: 'Team ID (if not provided, uses current user context)',
            },
        }, this.getCurrentCycle.bind(this), `
await cyclesModule.execute('getCurrentCycle', {
  teamId: 'team-123'
});
        `));
        this.registerOperation(this.createOperation('getCycleById', 'Get a cycle by ID', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'The cycle ID',
            },
        }, this.getCycleById.bind(this)));
        this.registerOperation(this.createOperation('listTeamCycles', 'List all cycles in a team', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'The team ID',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum cycles to return (default: 50)',
            },
            includeCompleted: {
                name: 'includeCompleted',
                type: 'boolean',
                required: false,
                description: 'Include completed cycles (default: true)',
            },
        }, this.listTeamCycles.bind(this)));
        this.registerOperation(this.createOperation('createCycle', 'Create a new cycle', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'The team ID',
            },
            name: {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Cycle name',
            },
            startsAt: {
                name: 'startsAt',
                type: 'string',
                required: true,
                description: 'Start date (ISO 8601)',
            },
            endsAt: {
                name: 'endsAt',
                type: 'string',
                required: true,
                description: 'End date (ISO 8601)',
            },
            description: {
                name: 'description',
                type: 'string',
                required: false,
                description: 'Cycle description',
            },
        }, this.createCycle.bind(this)));
        this.registerOperation(this.createOperation('updateCycle', 'Update a cycle', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'The cycle ID',
            },
            name: {
                name: 'name',
                type: 'string',
                required: false,
                description: 'New cycle name',
            },
            description: {
                name: 'description',
                type: 'string',
                required: false,
                description: 'New description',
            },
            startsAt: {
                name: 'startsAt',
                type: 'string',
                required: false,
                description: 'New start date',
            },
            endsAt: {
                name: 'endsAt',
                type: 'string',
                required: false,
                description: 'New end date',
            },
        }, this.updateCycle.bind(this)));
        this.registerOperation(this.createOperation('getCycleIssues', 'Get all issues in a cycle', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'The cycle ID',
            },
            limit: {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum issues to return (default: 50)',
            },
        }, this.getCycleIssues.bind(this)));
        this.registerOperation(this.createOperation('addIssueToCycle', 'Add an issue to a cycle', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'The issue ID',
            },
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'The cycle ID',
            },
        }, this.addIssueToCycle.bind(this)));
        this.registerOperation(this.createOperation('removeIssueFromCycle', 'Remove an issue from a cycle', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'The issue ID',
            },
        }, this.removeIssueFromCycle.bind(this)));
        this.registerOperation(this.createOperation('closeCycle', 'Close/complete a cycle', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'The cycle ID',
            },
        }, this.closeCycle.bind(this)));
    }
    /**
     * Get the current active cycle for a team
     */
    async getCurrentCycle(params) {
        const { teamId } = params;
        const query = `
      query GetCurrentCycle($teamId: String) {
        cycles(first: 1, filter: { isActive: true, teamId: $teamId }) {
          nodes {
            id
            name
            number
            description
            startsAt
            endsAt
            completionPercentage
            completedIssueCount
            issueCount
            team {
              id
              name
            }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { teamId } }, true);
            // TODO: Parse result
            this.logger.debug('Current cycle fetched');
            return undefined;
        }
        catch (error) {
            this.logger.error('Failed to get current cycle', error);
            throw error;
        }
    }
    /**
     * Get a cycle by ID
     */
    async getCycleById(params) {
        const { cycleId } = params;
        const query = `
      query GetCycle($id: String!) {
        cycle(id: $id) {
          id
          name
          number
          description
          startsAt
          endsAt
          completedAt
          completionPercentage
          completedIssueCount
          issueCount
          team {
            id
            name
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { id: cycleId } }, true);
            // TODO: Parse result
            this.logger.debug(`Cycle fetched: ${cycleId}`);
            return undefined;
        }
        catch (error) {
            this.logger.error(`Failed to fetch cycle ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * List all cycles in a team
     */
    async listTeamCycles(params) {
        const { teamId, limit = 50, includeCompleted = true } = params;
        const query = `
      query ListCycles($teamId: String!, $first: Int!) {
        cycles(first: $first, filter: { teamId: $teamId }) {
          nodes {
            id
            name
            number
            startsAt
            endsAt
            completedAt
            completionPercentage
            issueCount
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { teamId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Cycles listed for team: ${teamId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to list cycles for team ${teamId}`, error);
            throw error;
        }
    }
    /**
     * Create a new cycle
     */
    async createCycle(params) {
        const { teamId, name, startsAt, endsAt, description } = params;
        const mutation = `
      mutation CreateCycle(
        $teamId: String!
        $name: String!
        $startsAt: DateTime!
        $endsAt: DateTime!
        $description: String
      ) {
        cycleCreate(
          input: {
            teamId: $teamId
            name: $name
            startsAt: $startsAt
            endsAt: $endsAt
            description: $description
          }
        ) {
          cycle {
            id
            name
            number
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { teamId, name, startsAt, endsAt, description },
            });
            // TODO: Parse result
            this.logger.debug(`Cycle created: ${name}`);
            return {};
        }
        catch (error) {
            this.logger.error('Failed to create cycle', error);
            throw error;
        }
    }
    /**
     * Update a cycle
     */
    async updateCycle(params) {
        const { cycleId, name, description, startsAt, endsAt } = params;
        const mutation = `
      mutation UpdateCycle(
        $id: String!
        $name: String
        $description: String
        $startsAt: DateTime
        $endsAt: DateTime
      ) {
        cycleUpdate(
          id: $id
          input: {
            name: $name
            description: $description
            startsAt: $startsAt
            endsAt: $endsAt
          }
        ) {
          cycle {
            id
            name
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: cycleId, name, description, startsAt, endsAt },
            });
            // TODO: Parse result
            this.logger.debug(`Cycle updated: ${cycleId}`);
            return {};
        }
        catch (error) {
            this.logger.error(`Failed to update cycle ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * Get all issues in a cycle
     */
    async getCycleIssues(params) {
        const { cycleId, limit = 50 } = params;
        const query = `
      query GetCycleIssues($cycleId: String!, $first: Int!) {
        cycle(id: $cycleId) {
          issues(first: $first) {
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
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { cycleId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Cycle issues fetched: ${cycleId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to get issues for cycle ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * Add an issue to a cycle
     */
    async addIssueToCycle(params) {
        const { issueId, cycleId } = params;
        const mutation = `
      mutation AddIssueToCycle($issueId: String!, $cycleId: String!) {
        issueUpdate(id: $issueId, input: { cycleId: $cycleId }) {
          issue {
            id
          }
          success
        }
      }
    `;
        try {
            await this.graphqlClient.mutate({
                query: mutation,
                variables: { issueId, cycleId },
            });
            this.logger.debug(`Issue added to cycle: ${issueId}`);
        }
        catch (error) {
            this.logger.error(`Failed to add issue ${issueId} to cycle ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * Remove an issue from a cycle
     */
    async removeIssueFromCycle(params) {
        const { issueId } = params;
        const mutation = `
      mutation RemoveIssueFromCycle($issueId: String!) {
        issueUpdate(id: $issueId, input: { cycleId: null }) {
          issue {
            id
          }
          success
        }
      }
    `;
        try {
            await this.graphqlClient.mutate({
                query: mutation,
                variables: { issueId },
            });
            this.logger.debug(`Issue removed from cycle: ${issueId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove issue ${issueId} from cycle`, error);
            throw error;
        }
    }
    /**
     * Close/complete a cycle
     */
    async closeCycle(params) {
        const { cycleId } = params;
        const mutation = `
      mutation CloseCycle($id: String!) {
        cycleUpdate(id: $id, input: { completedAt: "now" }) {
          cycle {
            id
            completedAt
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: cycleId },
            });
            this.logger.debug(`Cycle closed: ${cycleId}`);
            return {};
        }
        catch (error) {
            this.logger.error(`Failed to close cycle ${cycleId}`, error);
            throw error;
        }
    }
}
exports.CyclesModule = CyclesModule;
//# sourceMappingURL=CyclesModule.js.map