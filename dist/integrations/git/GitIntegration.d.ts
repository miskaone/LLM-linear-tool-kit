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
    files: Array<{
        path: string;
        status: 'added' | 'modified' | 'deleted';
        changes: number;
    }>;
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
export declare class GitIntegration extends BaseModule {
    private registry?;
    private isOrgWideMode;
    constructor(graphqlClient: GraphQLClient, session: SessionManager, registry?: RepositoryRegistry);
    protected setupOperations(): void;
    private linkCommitToIssues;
    private trackBranchForIssues;
    private getRepositoryInfo;
    private setupWebhook;
    private processPushEvent;
    private autoLinkBranchesToIssues;
}
//# sourceMappingURL=GitIntegration.d.ts.map