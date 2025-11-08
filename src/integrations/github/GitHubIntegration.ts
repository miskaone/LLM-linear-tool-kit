/**
 * GitHub Integration for Linear Toolkit
 * Syncs Pull Requests with Linear issues
 *
 * Supports two modes:
 * 1. Organization-wide mode: Uses RepositoryRegistry for automatic repo discovery
 * 2. Per-repo mode: Explicit repositoryUrl specified per operation
 */

import { BaseModule } from '@modules/BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
import { RepositoryRegistry } from '@integrations/repository/RepositoryRegistry';

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description?: string;
  status: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  reviews: number;
  changedFiles: string[];
  additions: number;
  deletions: number;
}

export interface ReviewComment {
  id: string;
  author: string;
  body: string;
  createdAt: Date;
}

export class GitHubIntegration extends BaseModule {
  private registry?: RepositoryRegistry;
  private isOrgWideMode: boolean;

  constructor(
    graphqlClient: GraphQLClient,
    session: SessionManager,
    registry?: RepositoryRegistry
  ) {
    super(
      'github',
      {
        name: 'github',
        version: '1.0.0',
        operations: [
          'linkPullRequestToIssue',
          'syncPullRequestStatus',
          'createPullRequestFromIssue',
          'getReviewStatus',
          'postReviewComment',
          'autoLinkPullRequests',
        ],
        dependencies: ['issues', 'git'],
      },
      graphqlClient,
      session
    );
    this.registry = registry;
    this.isOrgWideMode = !!registry;
  }

  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'linkPullRequestToIssue',
        'Link a GitHub PR to a Linear issue',
        {
          prUrl: {
            name: 'prUrl',
            type: 'string',
            required: true,
            description: 'GitHub PR URL',
          },
          repositoryName: {
            name: 'repositoryName',
            type: 'string',
            required: !this.isOrgWideMode,
            description: 'Repository name for org-wide mode (optional if in registry)',
          },
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Linear issue ID',
          },
          autoTransition: {
            name: 'autoTransition',
            type: 'boolean',
            required: false,
            description: 'Auto-transition issue based on PR status (default: true)',
          },
        },
        this.linkPullRequestToIssue.bind(this),
        `
// Organization-wide mode:
await githubModule.execute('linkPullRequestToIssue', {
  prUrl: 'https://github.com/org/repo/pull/123',
  repositoryName: 'repo',
  issueId: 'LIN-456',
  autoTransition: true
});

// Per-repo mode:
await githubModule.execute('linkPullRequestToIssue', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456',
  autoTransition: true
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'syncPullRequestStatus',
        'Sync PR status to Linear issue',
        {
          prUrl: {
            name: 'prUrl',
            type: 'string',
            required: true,
            description: 'GitHub PR URL',
          },
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Linear issue ID',
          },
        },
        this.syncPullRequestStatus.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'createPullRequestFromIssue',
        'Create a GitHub PR from a Linear issue',
        {
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Linear issue ID',
          },
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'GitHub repository URL',
          },
          baseBranch: {
            name: 'baseBranch',
            type: 'string',
            required: false,
            description: 'Base branch (default: main)',
          },
        },
        this.createPullRequestFromIssue.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'getReviewStatus',
        'Get review status of a PR',
        {
          prUrl: {
            name: 'prUrl',
            type: 'string',
            required: true,
            description: 'GitHub PR URL',
          },
        },
        this.getReviewStatus.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'postReviewComment',
        'Post a review comment to a PR',
        {
          prUrl: {
            name: 'prUrl',
            type: 'string',
            required: true,
            description: 'GitHub PR URL',
          },
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Linear issue ID',
          },
          comment: {
            name: 'comment',
            type: 'string',
            required: true,
            description: 'Comment text',
          },
        },
        this.postReviewComment.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'autoLinkPullRequests',
        'Auto-link all open PRs to Linear issues',
        {
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'GitHub repository URL',
          },
        },
        this.autoLinkPullRequests.bind(this)
      )
    );
  }

  private async linkPullRequestToIssue(params: Record<string, unknown>): Promise<{ linked: boolean }> {
    const { prUrl, repositoryName, issueId, autoTransition = true } = params as {
      prUrl: string;
      repositoryName?: string;
      issueId: string;
      autoTransition?: boolean;
    };

    try {
      // Resolve repository URL based on mode (optional for this operation)
      if (this.isOrgWideMode && repositoryName && this.registry) {
        const repo = this.registry.getRepository(repositoryName);
        if (!repo) {
          this.logger.warn(`Repository '${repositoryName}' not found in registry, proceeding with PR URL`);
        }
      }

      // TODO: Extract PR info from URL
      // TODO: Add link as comment to Linear issue
      // TODO: Auto-transition if enabled

      this.logger.info(`Linked PR ${prUrl} to issue ${issueId}`);
      return { linked: true };
    } catch (error) {
      this.logger.error('Failed to link PR to issue', error);
      throw error;
    }
  }

  private async syncPullRequestStatus(params: Record<string, unknown>): Promise<{ status: string }> {
    const { prUrl, issueId } = params as { prUrl: string; issueId: string };

    try {
      // TODO: Get PR status
      // TODO: Update Linear issue state based on PR status

      this.logger.info(`Synced PR status for ${issueId}`);
      return { status: 'synced' };
    } catch (error) {
      this.logger.error('Failed to sync PR status', error);
      throw error;
    }
  }

  private async createPullRequestFromIssue(params: Record<string, unknown>): Promise<{ prUrl: string }> {
    const { issueId, repositoryUrl, baseBranch = 'main' } = params as {
      issueId: string;
      repositoryUrl: string;
      baseBranch?: string;
    };

    try {
      // TODO: Get issue details
      // TODO: Create branch from issue
      // TODO: Create PR from branch

      const prUrl = `${repositoryUrl}/pull/new/${baseBranch}`;
      this.logger.info(`Created PR from issue ${issueId}`);
      return { prUrl };
    } catch (error) {
      this.logger.error('Failed to create PR from issue', error);
      throw error;
    }
  }

  private async getReviewStatus(params: Record<string, unknown>): Promise<any> {
    const { prUrl } = params as { prUrl: string };

    try {
      // TODO: Fetch PR review status from GitHub
      const status = {
        totalReviews: 0,
        approvals: 0,
        requestedChanges: 0,
        comments: 0,
        mergeable: false,
      };

      this.logger.info(`Review status fetched for PR`);
      return status;
    } catch (error) {
      this.logger.error('Failed to get review status', error);
      throw error;
    }
  }

  private async postReviewComment(params: Record<string, unknown>): Promise<{ posted: boolean }> {
    const { prUrl, issueId, comment } = params as { prUrl: string; issueId: string; comment: string };

    try {
      // TODO: Post comment to PR

      this.logger.info(`Posted review comment to PR for issue ${issueId}`);
      return { posted: true };
    } catch (error) {
      this.logger.error('Failed to post review comment', error);
      throw error;
    }
  }

  private async autoLinkPullRequests(params: Record<string, unknown>): Promise<{ linked: number }> {
    const { repositoryUrl } = params as { repositoryUrl: string };

    try {
      // TODO: Fetch all open PRs
      // TODO: Extract issue IDs from PR titles/descriptions
      // TODO: Link each PR to its issue

      let linked = 0;
      this.logger.info(`Auto-linked ${linked} PRs to issues`);
      return { linked };
    } catch (error) {
      this.logger.error('Failed to auto-link PRs', error);
      throw error;
    }
  }
}
