/**
 * Comments Module for Linear Toolkit
 * Provides operations for managing issue comments
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class CommentsModule extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Comments module
     */
    protected setupOperations(): void;
    /**
     * Add a comment to an issue
     */
    private addComment;
    /**
     * Update an existing comment
     */
    private updateComment;
    /**
     * Delete a comment
     */
    private deleteComment;
    /**
     * Get all comments for an issue
     */
    private getIssueComments;
}
//# sourceMappingURL=CommentsModule.d.ts.map