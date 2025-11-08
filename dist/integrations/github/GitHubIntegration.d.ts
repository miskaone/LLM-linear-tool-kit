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
export declare class GitHubIntegration extends BaseModule {
    private registry?;
    private isOrgWideMode;
    constructor(graphqlClient: GraphQLClient, session: SessionManager, registry?: RepositoryRegistry);
    protected setupOperations(): void;
    private linkPullRequestToIssue;
    private syncPullRequestStatus;
    private createPullRequestFromIssue;
    private getReviewStatus;
    private postReviewComment;
    private autoLinkPullRequests;
}
//# sourceMappingURL=GitHubIntegration.d.ts.map