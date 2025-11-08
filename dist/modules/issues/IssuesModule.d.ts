/**
 * Issues Module for Linear Toolkit
 * Provides full CRUD operations for Linear issues
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class IssuesModule extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Issues module
     */
    protected setupOperations(): void;
    /**
     * Get an issue by ID
     */
    private getIssueById;
    /**
     * Search for issues
     */
    private searchIssues;
    /**
     * Create a new issue
     */
    private createIssue;
    /**
     * Update an issue
     */
    private updateIssue;
    /**
     * Delete (archive) an issue
     */
    private deleteIssue;
    /**
     * List all issues in a team
     */
    private listTeamIssues;
    /**
     * List issues in a cycle
     */
    private listCycleIssues;
    /**
     * Get issues with a specific label
     */
    private getIssuesByLabel;
    /**
     * Get relationships for an issue
     */
    private getIssueRelations;
    /**
     * Bulk update multiple issues
     */
    private bulkUpdateIssues;
}
//# sourceMappingURL=IssuesModule.d.ts.map