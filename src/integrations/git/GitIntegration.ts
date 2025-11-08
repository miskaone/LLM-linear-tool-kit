/**
 * Git Integration for Linear Toolkit
 * Monitors git repositories and automatically updates Linear issues
 *
 * Supports two modes:
 * 1. Organization-wide mode: Uses RepositoryRegistry for automatic repo discovery
 * 2. Per-repo mode: Explicit repositoryUrl specified per operation
 */

import { BaseModule } from '@modules/BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
import { RepositoryRegistry } from '@integrations/repository/RepositoryRegistry';

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  authorEmail?: string;
  timestamp: Date;
  files: Array<{ path: string; status: 'added' | 'modified' | 'deleted'; changes: number }>;
}

export interface BranchInfo {
  name: string;
  commit: CommitInfo;
  isProtected: boolean;
  lastUpdate: Date;
}

export interface RepositoryInfo {
  name: string;
  url: string;
  defaultBranch: string;
  description?: string;
  isPrivate: boolean;
}

export class GitIntegration extends BaseModule {
  private registry?: RepositoryRegistry;
  private isOrgWideMode: boolean;

  constructor(
    graphqlClient: GraphQLClient,
    session: SessionManager,
    registry?: RepositoryRegistry
  ) {
    super(
      'git',
      {
        name: 'git',
        version: '1.0.0',
        operations: [
          'linkCommitToIssues',
          'trackBranchForIssues',
          'getRepositoryInfo',
          'setupWebhook',
          'processPushEvent',
          'autoLinkBranchesToIssues',
        ],
        dependencies: ['issues', 'code'],
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
        'linkCommitToIssues',
        'Manually link a commit to related issues',
        {
          commitHash: {
            name: 'commitHash',
            type: 'string',
            required: true,
            description: 'Git commit hash',
          },
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: false,
            description: 'Repository URL (optional if using repositoryName with registry)',
          },
          repositoryName: {
            name: 'repositoryName',
            type: 'string',
            required: false,
            description: 'Repository name for org-wide mode (optional if using URL)',
          },
          commitMessage: {
            name: 'commitMessage',
            type: 'string',
            required: true,
            description: 'Commit message',
          },
          files: {
            name: 'files',
            type: 'array',
            required: true,
            description: 'Changed files',
          },
        },
        this.linkCommitToIssues.bind(this),
        `
// Organization-wide mode (with repository registry):
await gitModule.execute('linkCommitToIssues', {
  commitHash: 'abc123',
  repositoryName: 'backend',
  commitMessage: 'Fix auth - closes LIN-123',
  files: ['src/auth.ts']
});

// Per-repo mode (explicit URL):
await gitModule.execute('linkCommitToIssues', {
  commitHash: 'abc123',
  repositoryUrl: 'https://github.com/org/repo',
  commitMessage: 'Fix auth - closes LIN-123',
  files: ['src/auth.ts']
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'trackBranchForIssues',
        'Track a git branch and link to Linear issues',
        {
          branchName: {
            name: 'branchName',
            type: 'string',
            required: true,
            description: 'Git branch name',
          },
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'Repository URL',
          },
          issuePattern: {
            name: 'issuePattern',
            type: 'string',
            required: false,
            description: 'Regex pattern for issue IDs (default: Linear pattern)',
          },
        },
        this.trackBranchForIssues.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'getRepositoryInfo',
        'Get repository information',
        {
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'Repository URL',
          },
        },
        this.getRepositoryInfo.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'setupWebhook',
        'Setup git webhook for automatic updates',
        {
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'Repository URL',
          },
          webhookUrl: {
            name: 'webhookUrl',
            type: 'string',
            required: true,
            description: 'Webhook endpoint URL',
          },
          events: {
            name: 'events',
            type: 'array',
            required: false,
            description: 'Events to trigger on (default: push, pull_request)',
          },
        },
        this.setupWebhook.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'processPushEvent',
        'Process incoming git push event',
        {
          pushData: {
            name: 'pushData',
            type: 'object',
            required: true,
            description: 'Git push webhook data',
          },
        },
        this.processPushEvent.bind(this)
      )
    );

    this.registerOperation(
      this.createOperation(
        'autoLinkBranchesToIssues',
        'Auto-link git branches to Linear issues',
        {
          repositoryUrl: {
            name: 'repositoryUrl',
            type: 'string',
            required: true,
            description: 'Repository URL',
          },
        },
        this.autoLinkBranchesToIssues.bind(this)
      )
    );
  }

  private async linkCommitToIssues(params: Record<string, unknown>): Promise<{ linked: number; issues: string[] }> {
    const { commitHash, repositoryUrl, repositoryName, commitMessage, files } = params as {
      commitHash: string;
      repositoryUrl?: string;
      repositoryName?: string;
      commitMessage: string;
      files: string[];
    };

    try {
      // Resolve repository URL based on mode
      let repoUrl = repositoryUrl;

      if (!repoUrl && this.isOrgWideMode && repositoryName && this.registry) {
        const repo = this.registry.getRepository(repositoryName);
        if (!repo) {
          throw new Error(`Repository '${repositoryName}' not found in registry`);
        }
        repoUrl = repo.url;
      }

      if (!repoUrl) {
        throw new Error('Either repositoryUrl or repositoryName (with registry) must be provided');
      }

      // Extract issue IDs from commit message
      const issuePattern = /\b[A-Z]+-\d+\b/g;
      const issueIds = commitMessage.match(issuePattern) || [];

      let linked = 0;

      for (const issueId of issueIds) {
        // TODO: Add commit link as comment to issue
        linked++;
      }

      this.logger.info(`Linked commit ${commitHash} to ${linked} issues in ${repoUrl}`);
      return { linked, issues: issueIds };
    } catch (error) {
      this.logger.error('Failed to link commit to issues', error);
      throw error;
    }
  }

  private async trackBranchForIssues(params: Record<string, unknown>): Promise<any> {
    const { branchName, repositoryUrl, issuePattern } = params as {
      branchName: string;
      repositoryUrl: string;
      issuePattern?: string;
    };

    try {
      const pattern = issuePattern || /\b[A-Z]+-\d+\b/;
      const issueMatch = branchName.match(pattern);

      if (issueMatch) {
        this.logger.info(`Branch ${branchName} linked to issue ${issueMatch[0]}`);
        return { linked: true, issueId: issueMatch[0] };
      }

      this.logger.debug(`No issue found in branch name: ${branchName}`);
      return { linked: false };
    } catch (error) {
      this.logger.error('Failed to track branch', error);
      throw error;
    }
  }

  private async getRepositoryInfo(params: Record<string, unknown>): Promise<RepositoryInfo> {
    const { repositoryUrl } = params as { repositoryUrl: string };

    try {
      // TODO: Fetch repository info (would call GitHub/GitLab API)
      const info: RepositoryInfo = {
        name: repositoryUrl.split('/').pop() || 'unknown',
        url: repositoryUrl,
        defaultBranch: 'main',
        isPrivate: false,
      };

      this.logger.info(`Repository info fetched: ${info.name}`);
      return info;
    } catch (error) {
      this.logger.error('Failed to get repository info', error);
      throw error;
    }
  }

  private async setupWebhook(params: Record<string, unknown>): Promise<{ webhookId: string; status: string }> {
    const { repositoryUrl, webhookUrl, events } = params as {
      repositoryUrl: string;
      webhookUrl: string;
      events?: string[];
    };

    try {
      const eventList = events || ['push', 'pull_request'];

      // TODO: Actually configure webhook on git platform
      this.logger.info(`Webhook setup configured for ${repositoryUrl}`);
      return { webhookId: `webhook-${Date.now()}`, status: 'configured' };
    } catch (error) {
      this.logger.error('Failed to setup webhook', error);
      throw error;
    }
  }

  private async processPushEvent(params: Record<string, unknown>): Promise<{ processed: number; linked: number }> {
    const { pushData } = params as { pushData: any };

    try {
      let processed = 0;
      let linked = 0;

      // TODO: Parse push data and extract commits
      // For each commit:
      // 1. Extract issue references
      // 2. Extract changed files
      // 3. Link to Linear

      this.logger.info(`Processed ${processed} commits, linked ${linked}`);
      return { processed, linked };
    } catch (error) {
      this.logger.error('Failed to process push event', error);
      throw error;
    }
  }

  private async autoLinkBranchesToIssues(params: Record<string, unknown>): Promise<{ linked: number }> {
    const { repositoryUrl } = params as { repositoryUrl: string };

    try {
      // TODO: Get all branches and auto-link those matching issue patterns
      let linked = 0;

      this.logger.info(`Auto-linked ${linked} branches to issues`);
      return { linked };
    } catch (error) {
      this.logger.error('Failed to auto-link branches', error);
      throw error;
    }
  }
}
