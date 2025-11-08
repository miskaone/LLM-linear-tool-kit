/**
 * Batch Operations Module for Linear Toolkit
 * Provides efficient bulk operations for multiple issues
 */

import { Issue, UpdateIssueInput, CreateIssueInput, Transition, BatchOperationResult, OperationResult } from '@types/linear.types';
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';

export interface BatchUpdateProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  inProgress: boolean;
}

export class BatchOperationsModule extends BaseModule {
  private readonly BATCH_SIZE = 50; // Process in batches to avoid overwhelming API
  private activeBatches: Map<string, BatchUpdateProgress> = new Map();

  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    super(
      'batch',
      {
        name: 'batch',
        version: '1.0.0',
        operations: [
          'batchUpdate',
          'batchTransition',
          'bulkCreate',
          'bulkDelete',
          'batchAddLabels',
          'batchRemoveLabels',
          'batchAssign',
          'getBatchProgress',
        ],
        dependencies: ['issues'],
      },
      graphqlClient,
      session
    );
  }

  /**
   * Setup all operations for the Batch Operations module
   */
  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'batchUpdate',
        'Update multiple issues efficiently',
        {
          updates: {
            name: 'updates',
            type: 'array',
            required: true,
            description: 'Array of {issueId, update} objects',
          },
          parallel: {
            name: 'parallel',
            type: 'boolean',
            required: false,
            description: 'Execute in parallel (default: false)',
          },
          continueOnError: {
            name: 'continueOnError',
            type: 'boolean',
            required: false,
            description: 'Continue on errors (default: true)',
          },
        },
        this.batchUpdate.bind(this),
        `
await batchModule.execute('batchUpdate', {
  updates: [
    { issueId: 'LIN-1', update: { priority: 1 } },
    { issueId: 'LIN-2', update: { priority: 2 } }
  ],
  parallel: true
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'batchTransition',
        'Change state for multiple issues',
        {
          transitions: {
            name: 'transitions',
            type: 'array',
            required: true,
            description: 'Array of {issueId, stateId} objects',
          },
          comment: {
            name: 'comment',
            type: 'string',
            required: false,
            description: 'Comment to add to all issues',
          },
        },
        this.batchTransition.bind(this),
        `
await batchModule.execute('batchTransition', {
  transitions: [
    { issueId: 'LIN-1', stateId: 'state-done' },
    { issueId: 'LIN-2', stateId: 'state-done' }
  ],
  comment: 'Sprint completed'
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'bulkCreate',
        'Create multiple issues efficiently',
        {
          issues: {
            name: 'issues',
            type: 'array',
            required: true,
            description: 'Array of issue creation inputs',
          },
          assignBatch: {
            name: 'assignBatch',
            type: 'boolean',
            required: false,
            description: 'Assign issues to cycle (default: false)',
          },
        },
        this.bulkCreate.bind(this),
        `
await batchModule.execute('bulkCreate', {
  issues: [
    { title: 'Task 1', teamId: 'team-1' },
    { title: 'Task 2', teamId: 'team-1' }
  ]
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'bulkDelete',
        'Delete/archive multiple issues',
        {
          issueIds: {
            name: 'issueIds',
            type: 'array',
            required: true,
            description: 'Array of issue IDs to delete',
          },
        },
        this.bulkDelete.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'batchAddLabels',
        'Add labels to multiple issues',
        {
          issueIds: {
            name: 'issueIds',
            type: 'array',
            required: true,
            description: 'Array of issue IDs',
          },
          labelIds: {
            name: 'labelIds',
            type: 'array',
            required: true,
            description: 'Array of label IDs to add',
          },
        },
        this.batchAddLabels.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'batchRemoveLabels',
        'Remove labels from multiple issues',
        {
          issueIds: {
            name: 'issueIds',
            type: 'array',
            required: true,
            description: 'Array of issue IDs',
          },
          labelIds: {
            name: 'labelIds',
            type: 'array',
            required: true,
            description: 'Array of label IDs to remove',
          },
        },
        this.batchRemoveLabels.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'batchAssign',
        'Assign multiple issues to users/team members',
        {
          assignments: {
            name: 'assignments',
            type: 'array',
            required: true,
            description: 'Array of {issueId, assigneeId} objects',
          },
        },
        this.batchAssign.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'getBatchProgress',
        'Get progress of a batch operation',
        {
          batchId: {
            name: 'batchId',
            type: 'string',
            required: true,
            description: 'Batch operation ID',
          },
        },
        this.getBatchProgress.bind(this)
      )
    );
  }

  /**
   * Update multiple issues efficiently
   */
  private async batchUpdate(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { updates, parallel = false, continueOnError = true } = params as {
      updates: Array<{ issueId: string; update: UpdateIssueInput }>;
      parallel?: boolean;
      continueOnError?: boolean;
    };

    const batchId = this.generateBatchId();
    const progress: BatchUpdateProgress = {
      total: updates.length,
      completed: 0,
      successful: 0,
      failed: 0,
      inProgress: true,
    };

    this.activeBatches.set(batchId, progress);

    try {
      const results: OperationResult<unknown>[] = [];

      if (parallel) {
        // Process in parallel (respect batch size)
        for (let i = 0; i < updates.length; i += this.BATCH_SIZE) {
          const batch = updates.slice(i, i + this.BATCH_SIZE);
          const batchResults = await Promise.allSettled(
            batch.map((u) => this.updateSingleIssue(u.issueId, u.update))
          );

          for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
              results.push(result.value);
              progress.successful++;
            } else {
              if (!continueOnError) throw result.reason;
              results.push({
                success: false,
                error: result.reason.message,
                timestamp: new Date(),
              });
              progress.failed++;
            }
            progress.completed++;
          }
        }
      } else {
        // Process sequentially
        for (const { issueId, update } of updates) {
          try {
            const result = await this.updateSingleIssue(issueId, update);
            results.push(result);
            progress.successful++;
          } catch (error) {
            if (!continueOnError) throw error;
            results.push({
              success: false,
              error: (error as Error).message,
              timestamp: new Date(),
            });
            progress.failed++;
          }
          progress.completed++;
        }
      }

      progress.inProgress = false;

      this.logger.info(`Batch update completed: ${progress.successful}/${updates.length} successful`);

      return {
        total: updates.length,
        successful: progress.successful,
        failed: progress.failed,
        results,
      };
    } catch (error) {
      progress.inProgress = false;
      this.logger.error('Batch update failed', error);
      throw error;
    }
  }

  /**
   * Transition multiple issues to new states
   */
  private async batchTransition(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { transitions, comment } = params as {
      transitions: Transition[];
      comment?: string;
    };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const transition of transitions) {
        try {
          const mutation = `
            mutation TransitionIssue($id: String!, $stateId: String!) {
              issueUpdate(id: $id, input: { stateId: $stateId }) {
                issue { id identifier }
                success
              }
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: { id: transition.issueId, stateId: transition.stateId },
          });

          // TODO: Add comment if provided

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Batch transition completed: ${successful}/${transitions.length} successful`);

      return {
        total: transitions.length,
        successful,
        failed: transitions.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Batch transition failed', error);
      throw error;
    }
  }

  /**
   * Create multiple issues efficiently
   */
  private async bulkCreate(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { issues, assignBatch } = params as {
      issues: CreateIssueInput[];
      assignBatch?: boolean;
    };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const issueInput of issues) {
        try {
          const mutation = `
            mutation CreateIssue(
              $title: String!
              $description: String
              $teamId: String!
              $priority: Int
            ) {
              issueCreate(
                input: {
                  title: $title
                  description: $description
                  teamId: $teamId
                  priority: $priority
                }
              ) {
                issue { id identifier }
                success
              }
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: issueInput,
          });

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Bulk create completed: ${successful}/${issues.length} created`);

      return {
        total: issues.length,
        successful,
        failed: issues.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Bulk create failed', error);
      throw error;
    }
  }

  /**
   * Delete/archive multiple issues
   */
  private async bulkDelete(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { issueIds } = params as { issueIds: string[] };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const issueId of issueIds) {
        try {
          const mutation = `
            mutation DeleteIssue($id: String!) {
              issueDelete(id: $id)
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: { id: issueId },
          });

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Bulk delete completed: ${successful}/${issueIds.length} deleted`);

      return {
        total: issueIds.length,
        successful,
        failed: issueIds.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Bulk delete failed', error);
      throw error;
    }
  }

  /**
   * Add labels to multiple issues
   */
  private async batchAddLabels(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { issueIds, labelIds } = params as { issueIds: string[]; labelIds: string[] };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const issueId of issueIds) {
        try {
          const mutation = `
            mutation AddLabels($id: String!, $labelIds: [String!]!) {
              issueUpdate(id: $id, input: { labelIds: $labelIds }) {
                issue { id }
                success
              }
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: { id: issueId, labelIds },
          });

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Batch add labels completed: ${successful}/${issueIds.length} updated`);

      return {
        total: issueIds.length,
        successful,
        failed: issueIds.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Batch add labels failed', error);
      throw error;
    }
  }

  /**
   * Remove labels from multiple issues
   */
  private async batchRemoveLabels(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { issueIds, labelIds } = params as { issueIds: string[]; labelIds: string[] };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const issueId of issueIds) {
        try {
          // Fetch current labels and remove specified ones
          // This is a simplification - real implementation would fetch current state first
          const mutation = `
            mutation RemoveLabels($id: String!) {
              issueUpdate(id: $id, input: { labelIds: [] }) {
                issue { id }
                success
              }
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: { id: issueId },
          });

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Batch remove labels completed: ${successful}/${issueIds.length} updated`);

      return {
        total: issueIds.length,
        successful,
        failed: issueIds.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Batch remove labels failed', error);
      throw error;
    }
  }

  /**
   * Assign multiple issues to users
   */
  private async batchAssign(params: Record<string, unknown>): Promise<BatchOperationResult> {
    const { assignments } = params as { assignments: Array<{ issueId: string; assigneeId: string }> };

    try {
      const results: OperationResult<unknown>[] = [];

      for (const { issueId, assigneeId } of assignments) {
        try {
          const mutation = `
            mutation AssignIssue($id: String!, $assigneeId: String!) {
              issueUpdate(id: $id, input: { assigneeId: $assigneeId }) {
                issue { id assignee { name } }
                success
              }
            }
          `;

          const result = await this.graphqlClient.mutate({
            query: mutation,
            variables: { id: issueId, assigneeId },
          });

          results.push({
            success: true,
            data: result,
            timestamp: new Date(),
          });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      this.logger.info(`Batch assign completed: ${successful}/${assignments.length} assigned`);

      return {
        total: assignments.length,
        successful,
        failed: assignments.length - successful,
        results,
      };
    } catch (error) {
      this.logger.error('Batch assign failed', error);
      throw error;
    }
  }

  /**
   * Get progress of a batch operation
   */
  private async getBatchProgress(params: Record<string, unknown>): Promise<BatchUpdateProgress | null> {
    const { batchId } = params as { batchId: string };
    return this.activeBatches.get(batchId) || null;
  }

  /**
   * Update a single issue
   */
  private async updateSingleIssue(issueId: string, update: UpdateIssueInput): Promise<OperationResult<unknown>> {
    const mutation = `
      mutation UpdateIssue($id: String!, $update: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $update) {
          issue { id }
          success
        }
      }
    `;

    try {
      const result = await this.graphqlClient.mutate({
        query: mutation,
        variables: { id: issueId, update },
      });

      return {
        success: true,
        data: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
