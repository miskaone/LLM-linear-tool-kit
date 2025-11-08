"use strict";
/**
 * Labels Module for Linear Toolkit
 * Provides operations for managing issue labels
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelsModule = void 0;
const BaseModule_1 = require("../BaseModule");
class LabelsModule extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('labels', {
            name: 'labels',
            version: '1.0.0',
            operations: [
                'getLabel',
                'listTeamLabels',
                'createLabel',
                'updateLabel',
                'deleteLabel',
                'addLabelToIssue',
                'removeLabelFromIssue',
            ],
            dependencies: ['issues'],
        }, graphqlClient, session);
    }
    /**
     * Setup all operations for the Labels module
     */
    setupOperations() {
        this.registerOperation(this.createOperation('getLabel', 'Get label by ID', {
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'The label ID',
            },
        }, this.getLabel.bind(this)));
        this.registerOperation(this.createOperation('listTeamLabels', 'List all labels in a team', {
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
                description: 'Maximum labels to return (default: 50)',
            },
        }, this.listTeamLabels.bind(this), `
await labelsModule.execute('listTeamLabels', {
  teamId: 'team-123',
  limit: 100
});
        `));
        this.registerOperation(this.createOperation('createLabel', 'Create a new label', {
            name: {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Label name',
            },
            color: {
                name: 'color',
                type: 'string',
                required: true,
                description: 'Label color (hex code)',
            },
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID',
            },
            description: {
                name: 'description',
                type: 'string',
                required: false,
                description: 'Label description',
            },
        }, this.createLabel.bind(this)));
        this.registerOperation(this.createOperation('updateLabel', 'Update a label', {
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'The label ID',
            },
            name: {
                name: 'name',
                type: 'string',
                required: false,
                description: 'New label name',
            },
            color: {
                name: 'color',
                type: 'string',
                required: false,
                description: 'New label color',
            },
            description: {
                name: 'description',
                type: 'string',
                required: false,
                description: 'New description',
            },
        }, this.updateLabel.bind(this)));
        this.registerOperation(this.createOperation('deleteLabel', 'Delete a label', {
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'The label ID',
            },
        }, this.deleteLabel.bind(this)));
        this.registerOperation(this.createOperation('addLabelToIssue', 'Add a label to an issue', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'The issue ID',
            },
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'The label ID',
            },
        }, this.addLabelToIssue.bind(this)));
        this.registerOperation(this.createOperation('removeLabelFromIssue', 'Remove a label from an issue', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'The issue ID',
            },
            labelId: {
                name: 'labelId',
                type: 'string',
                required: true,
                description: 'The label ID',
            },
        }, this.removeLabelFromIssue.bind(this)));
    }
    /**
     * Get a label by ID
     */
    async getLabel(params) {
        const { labelId } = params;
        const query = `
      query GetLabel($id: String!) {
        label(id: $id) {
          id
          name
          color
          description
          team {
            id
            name
          }
          createdAt
          updatedAt
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { id: labelId } }, true);
            // TODO: Parse result
            this.logger.debug(`Label fetched: ${labelId}`);
            return undefined;
        }
        catch (error) {
            this.logger.error(`Failed to fetch label ${labelId}`, error);
            throw error;
        }
    }
    /**
     * List all labels in a team
     */
    async listTeamLabels(params) {
        const { teamId, limit = 50 } = params;
        const query = `
      query ListLabels($teamId: String!, $first: Int!) {
        team(id: $teamId) {
          labels(first: $first) {
            nodes {
              id
              name
              color
              description
            }
          }
        }
      }
    `;
        try {
            const result = await this.graphqlClient.query({ query, variables: { teamId, first: limit } }, true);
            // TODO: Parse result
            this.logger.debug(`Team labels listed: ${teamId}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to list labels for team ${teamId}`, error);
            throw error;
        }
    }
    /**
     * Create a new label
     */
    async createLabel(params) {
        const { name, color, teamId, description } = params;
        const mutation = `
      mutation CreateLabel(
        $name: String!
        $color: String!
        $teamId: String!
        $description: String
      ) {
        labelCreate(
          input: {
            name: $name
            color: $color
            teamId: $teamId
            description: $description
          }
        ) {
          label {
            id
            name
            color
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { name, color, teamId, description },
            });
            // TODO: Parse result
            this.logger.debug(`Label created: ${name}`);
            return {};
        }
        catch (error) {
            this.logger.error('Failed to create label', error);
            throw error;
        }
    }
    /**
     * Update a label
     */
    async updateLabel(params) {
        const { labelId, name, color, description } = params;
        const mutation = `
      mutation UpdateLabel(
        $id: String!
        $name: String
        $color: String
        $description: String
      ) {
        labelUpdate(
          id: $id
          input: {
            name: $name
            color: $color
            description: $description
          }
        ) {
          label {
            id
            name
            color
          }
          success
        }
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: labelId, name, color, description },
            });
            // TODO: Parse result
            this.logger.debug(`Label updated: ${labelId}`);
            return {};
        }
        catch (error) {
            this.logger.error(`Failed to update label ${labelId}`, error);
            throw error;
        }
    }
    /**
     * Delete a label
     */
    async deleteLabel(params) {
        const { labelId } = params;
        const mutation = `
      mutation DeleteLabel($id: String!) {
        labelDelete(id: $id)
      }
    `;
        try {
            const result = await this.graphqlClient.mutate({
                query: mutation,
                variables: { id: labelId },
            });
            this.logger.debug(`Label deleted: ${labelId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete label ${labelId}`, error);
            throw error;
        }
    }
    /**
     * Add a label to an issue
     */
    async addLabelToIssue(params) {
        const { issueId, labelId } = params;
        const mutation = `
      mutation AddLabelToIssue($issueId: String!, $labelIds: [String!]!) {
        issueUpdate(id: $issueId, input: { labelIds: $labelIds }) {
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
                variables: { issueId, labelIds: [labelId] },
            });
            this.logger.debug(`Label added to issue: ${issueId}`);
        }
        catch (error) {
            this.logger.error(`Failed to add label to issue ${issueId}`, error);
            throw error;
        }
    }
    /**
     * Remove a label from an issue
     */
    async removeLabelFromIssue(params) {
        const { issueId, labelId } = params;
        const mutation = `
      mutation RemoveLabelFromIssue($issueId: String!, $labelId: String!) {
        issueUpdate(id: $issueId, input: { labelIds: [$labelId] }) {
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
                variables: { issueId, labelId },
            });
            this.logger.debug(`Label removed from issue: ${issueId}`);
        }
        catch (error) {
            this.logger.error(`Failed to remove label from issue ${issueId}`, error);
            throw error;
        }
    }
}
exports.LabelsModule = LabelsModule;
//# sourceMappingURL=LabelsModule.js.map