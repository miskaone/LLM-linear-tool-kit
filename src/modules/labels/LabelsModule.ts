/**
 * Labels Module for Linear Toolkit
 * Provides operations for managing issue labels
 */

import { Label } from '@types/linear.types';
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';

export class LabelsModule extends BaseModule {
  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    super(
      'labels',
      {
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
      },
      graphqlClient,
      session
    );
  }

  /**
   * Setup all operations for the Labels module
   */
  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'getLabel',
        'Get label by ID',
        {
          labelId: {
            name: 'labelId',
            type: 'string',
            required: true,
            description: 'The label ID',
          },
        },
        this.getLabel.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'listTeamLabels',
        'List all labels in a team',
        {
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
        },
        this.listTeamLabels.bind(this),
        `
await labelsModule.execute('listTeamLabels', {
  teamId: 'team-123',
  limit: 100
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'createLabel',
        'Create a new label',
        {
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
        },
        this.createLabel.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'updateLabel',
        'Update a label',
        {
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
        },
        this.updateLabel.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'deleteLabel',
        'Delete a label',
        {
          labelId: {
            name: 'labelId',
            type: 'string',
            required: true,
            description: 'The label ID',
          },
        },
        this.deleteLabel.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'addLabelToIssue',
        'Add a label to an issue',
        {
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
        },
        this.addLabelToIssue.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'removeLabelFromIssue',
        'Remove a label from an issue',
        {
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
        },
        this.removeLabelFromIssue.bind(this)
      )
    );
  }

  /**
   * Get a label by ID
   */
  private async getLabel(params: Record<string, unknown>): Promise<Label | undefined> {
    const { labelId } = params as { labelId: string };

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
      const result = await this.graphqlClient.query(
        { query, variables: { id: labelId } },
        true
      );

      // TODO: Parse result
      this.logger.debug(`Label fetched: ${labelId}`);
      return undefined;
    } catch (error) {
      this.logger.error(`Failed to fetch label ${labelId}`, error);
      throw error;
    }
  }

  /**
   * List all labels in a team
   */
  private async listTeamLabels(params: Record<string, unknown>): Promise<Label[]> {
    const { teamId, limit = 50 } = params as { teamId: string; limit?: number };

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
      const result = await this.graphqlClient.query(
        { query, variables: { teamId, first: limit } },
        true
      );

      // TODO: Parse result
      this.logger.debug(`Team labels listed: ${teamId}`);
      return [];
    } catch (error) {
      this.logger.error(`Failed to list labels for team ${teamId}`, error);
      throw error;
    }
  }

  /**
   * Create a new label
   */
  private async createLabel(params: Record<string, unknown>): Promise<Label> {
    const { name, color, teamId, description } = params as {
      name: string;
      color: string;
      teamId: string;
      description?: string;
    };

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
      return {} as Label;
    } catch (error) {
      this.logger.error('Failed to create label', error);
      throw error;
    }
  }

  /**
   * Update a label
   */
  private async updateLabel(params: Record<string, unknown>): Promise<Label> {
    const { labelId, name, color, description } = params as {
      labelId: string;
      name?: string;
      color?: string;
      description?: string;
    };

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
      return {} as Label;
    } catch (error) {
      this.logger.error(`Failed to update label ${labelId}`, error);
      throw error;
    }
  }

  /**
   * Delete a label
   */
  private async deleteLabel(params: Record<string, unknown>): Promise<boolean> {
    const { labelId } = params as { labelId: string };

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
    } catch (error) {
      this.logger.error(`Failed to delete label ${labelId}`, error);
      throw error;
    }
  }

  /**
   * Add a label to an issue
   */
  private async addLabelToIssue(params: Record<string, unknown>): Promise<void> {
    const { issueId, labelId } = params as { issueId: string; labelId: string };

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
    } catch (error) {
      this.logger.error(`Failed to add label to issue ${issueId}`, error);
      throw error;
    }
  }

  /**
   * Remove a label from an issue
   */
  private async removeLabelFromIssue(params: Record<string, unknown>): Promise<void> {
    const { issueId, labelId } = params as { issueId: string; labelId: string };

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
    } catch (error) {
      this.logger.error(`Failed to remove label from issue ${issueId}`, error);
      throw error;
    }
  }
}
