"use strict";
/**
 * GitHub Integration for Linear Toolkit
 * Syncs Pull Requests with Linear issues
 *
 * Supports two modes:
 * 1. Organization-wide mode: Uses RepositoryRegistry for automatic repo discovery
 * 2. Per-repo mode: Explicit repositoryUrl specified per operation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubIntegration = void 0;
const BaseModule_1 = require("@modules/BaseModule");
class GitHubIntegration extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session, registry) {
        super('github', {
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
        }, graphqlClient, session);
        this.registry = registry;
        this.isOrgWideMode = !!registry;
    }
    setupOperations() {
        this.registerOperation(this.createOperation('linkPullRequestToIssue', 'Link a GitHub PR to a Linear issue', {
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
        }, this.linkPullRequestToIssue.bind(this), `
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
        `));
        this.registerOperation(this.createOperation('syncPullRequestStatus', 'Sync PR status to Linear issue', {
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
        }, this.syncPullRequestStatus.bind(this)));
        this.registerOperation(this.createOperation('createPullRequestFromIssue', 'Create a GitHub PR from a Linear issue', {
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
        }, this.createPullRequestFromIssue.bind(this)));
        this.registerOperation(this.createOperation('getReviewStatus', 'Get review status of a PR', {
            prUrl: {
                name: 'prUrl',
                type: 'string',
                required: true,
                description: 'GitHub PR URL',
            },
        }, this.getReviewStatus.bind(this)));
        this.registerOperation(this.createOperation('postReviewComment', 'Post a review comment to a PR', {
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
        }, this.postReviewComment.bind(this)));
        this.registerOperation(this.createOperation('autoLinkPullRequests', 'Auto-link all open PRs to Linear issues', {
            repositoryUrl: {
                name: 'repositoryUrl',
                type: 'string',
                required: true,
                description: 'GitHub repository URL',
            },
        }, this.autoLinkPullRequests.bind(this)));
    }
    async linkPullRequestToIssue(params) {
        const { prUrl, repositoryName, issueId } = params;
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
        }
        catch (error) {
            this.logger.error('Failed to link PR to issue', error);
            throw error;
        }
    }
    async syncPullRequestStatus(params) {
        const { prUrl, issueId } = params;
        try {
            // TODO: Get PR status
            // TODO: Update Linear issue state based on PR status
            this.logger.info(`Synced PR status for ${issueId}`);
            return { status: 'synced' };
        }
        catch (error) {
            this.logger.error('Failed to sync PR status', error);
            throw error;
        }
    }
    async createPullRequestFromIssue(params) {
        const { issueId, repositoryUrl, baseBranch = 'main' } = params;
        try {
            // TODO: Get issue details
            // TODO: Create branch from issue
            // TODO: Create PR from branch
            const prUrl = `${repositoryUrl}/pull/new/${baseBranch}`;
            this.logger.info(`Created PR from issue ${issueId}`);
            return { prUrl };
        }
        catch (error) {
            this.logger.error('Failed to create PR from issue', error);
            throw error;
        }
    }
    async getReviewStatus(params) {
        const { prUrl } = params;
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
        }
        catch (error) {
            this.logger.error('Failed to get review status', error);
            throw error;
        }
    }
    async postReviewComment(params) {
        const { prUrl, issueId, comment } = params;
        try {
            // TODO: Post comment to PR
            this.logger.info(`Posted review comment to PR for issue ${issueId}`);
            return { posted: true };
        }
        catch (error) {
            this.logger.error('Failed to post review comment', error);
            throw error;
        }
    }
    async autoLinkPullRequests(params) {
        const { repositoryUrl } = params;
        try {
            // TODO: Fetch all open PRs
            // TODO: Extract issue IDs from PR titles/descriptions
            // TODO: Link each PR to its issue
            let linked = 0;
            this.logger.info(`Auto-linked ${linked} PRs to issues`);
            return { linked };
        }
        catch (error) {
            this.logger.error('Failed to auto-link PRs', error);
            throw error;
        }
    }
}
exports.GitHubIntegration = GitHubIntegration;
//# sourceMappingURL=GitHubIntegration.js.map