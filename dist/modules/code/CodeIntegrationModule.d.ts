/**
 * Code Integration Module for Linear Toolkit
 * Provides code-aware operations that understand relationships between code and issues
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class CodeIntegrationModule extends BaseModule {
    private codeToIssueCache;
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Code Integration module
     */
    protected setupOperations(): void;
    /**
     * Map files to related issues
     */
    private mapFileToIssues;
    /**
     * Create issues from code analysis
     */
    private createFromCodeAnalysis;
    /**
     * Update issues based on commit information
     */
    private updateFromCommit;
    /**
     * Find issues by code pattern or error message
     */
    private findIssuesByCodePattern;
    /**
     * Create an issue for a code finding
     */
    private createIssueForFinding;
    /**
     * Extract issue IDs from commit message (e.g., LIN-123)
     */
    private extractIssueReferences;
    /**
     * Get parent directory paths (for includeChildren)
     */
    private getParentPaths;
    /**
     * Get priority level from severity
     */
    private getSeverityPriority;
    /**
     * Format security issue for description
     */
    private formatSecurityIssue;
    /**
     * Format bug issue for description
     */
    private formatBugIssue;
    /**
     * Format refactoring suggestion for description
     */
    private formatRefactoringIssue;
    /**
     * Format commit comment
     */
    private formatCommitComment;
}
//# sourceMappingURL=CodeIntegrationModule.d.ts.map