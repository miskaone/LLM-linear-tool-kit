/**
 * Comments Module for Linear Toolkit
 * Provides operations for managing issue comments
 */

import { Comment, AddCommentInput } from '@types/linear.types';
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';

export class CommentsModule extends BaseModule {
  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    super(
      'comments',
      {
        name: 'comments',
        version: '1.0.0',
        operations: ['addComment', 'updateComment', 'deleteComment', 'getIssueComments'],
        dependencies: ['issues'],
      },
      graphqlClient,
      session
    );
  }

  /**
   * Setup all operations for the Comments module
   */
  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'addComment',
        'Add a comment to an issue',
        {
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'The issue ID',
          },
          body: {
            name: 'body',
            type: 'string',
            required: true,
            description: 'Comment text (supports Markdown)',
          },
        },
        this.addComment.bind(this),
        `
await commentsModule.execute('addComment', {
  issueId: 'LIN-123',
  body: 'Great progress! Ready for review.'
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'updateComment',
        'Update an existing comment',
        {
          commentId: {
            name: 'commentId',
            type: 'string',
            required: true,
            description: 'The comment ID',
          },
          body: {
            name: 'body',
            type: 'string',
            required: true,
            description: 'Updated comment text',
          },
        },
        this.updateComment.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'deleteComment',
        'Delete a comment',
        {
          commentId: {
            name: 'commentId',
            type: 'string',
            required: true,
            description: 'The comment ID',
          },
        },
        this.deleteComment.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'getIssueComments',
        'Get all comments for an issue',
        {
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'The issue ID',
          },
          limit: {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum comments to return (default: 50)',
          },
        },
        this.getIssueComments.bind(this)
      )
    );
  }

  /**
   * Add a comment to an issue
   */
  private async addComment(params: Record<string, unknown>): Promise<Comment> {
    const { issueId, body } = params as AddCommentInput;

    const mutation = `
      mutation CreateComment($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          comment {
            id
            body
            createdAt
            author {
              id
              name
              email
            }
          }
          success
        }
      }
    `;

    try {
      const result = await this.graphqlClient.mutate({
        query: mutation,
        variables: { issueId, body },
      });

      // TODO: Parse result and map to Comment
      this.logger.debug(`Comment added to issue: ${issueId}`);
      return {} as Comment;
    } catch (error) {
      this.logger.error(`Failed to add comment to issue ${issueId}`, error);
      throw error;
    }
  }

  /**
   * Update an existing comment
   */
  private async updateComment(params: Record<string, unknown>): Promise<Comment> {
    const { commentId, body } = params as { commentId: string; body: string };

    const mutation = `
      mutation UpdateComment($id: String!, $body: String!) {
        commentUpdate(id: $id, input: { body: $body }) {
          comment {
            id
            body
            updatedAt
          }
          success
        }
      }
    `;

    try {
      const result = await this.graphqlClient.mutate({
        query: mutation,
        variables: { id: commentId, body },
      });

      // TODO: Parse result
      this.logger.debug(`Comment updated: ${commentId}`);
      return {} as Comment;
    } catch (error) {
      this.logger.error(`Failed to update comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  private async deleteComment(params: Record<string, unknown>): Promise<boolean> {
    const { commentId } = params as { commentId: string };

    const mutation = `
      mutation DeleteComment($id: String!) {
        commentDelete(id: $id)
      }
    `;

    try {
      const result = await this.graphqlClient.mutate({
        query: mutation,
        variables: { id: commentId },
      });

      this.logger.debug(`Comment deleted: ${commentId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Get all comments for an issue
   */
  private async getIssueComments(params: Record<string, unknown>): Promise<Comment[]> {
    const { issueId, limit = 50 } = params as { issueId: string; limit?: number };

    const query = `
      query GetComments($issueId: String!, $first: Int!) {
        issue(id: $issueId) {
          comments(first: $first, orderBy: CREATED_AT) {
            nodes {
              id
              body
              createdAt
              updatedAt
              author {
                id
                name
                email
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.graphqlClient.query(
        { query, variables: { issueId, first: limit } },
        true
      );

      // TODO: Parse result
      this.logger.debug(`Comments fetched for issue: ${issueId}`);
      return [];
    } catch (error) {
      this.logger.error(`Failed to get comments for issue ${issueId}`, error);
      throw error;
    }
  }
}
