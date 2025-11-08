/**
 * Labels Module for Linear Toolkit
 * Provides operations for managing issue labels
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class LabelsModule extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Labels module
     */
    protected setupOperations(): void;
    /**
     * Get a label by ID
     */
    private getLabel;
    /**
     * List all labels in a team
     */
    private listTeamLabels;
    /**
     * Create a new label
     */
    private createLabel;
    /**
     * Update a label
     */
    private updateLabel;
    /**
     * Delete a label
     */
    private deleteLabel;
    /**
     * Add a label to an issue
     */
    private addLabelToIssue;
    /**
     * Remove a label from an issue
     */
    private removeLabelFromIssue;
}
//# sourceMappingURL=LabelsModule.d.ts.map