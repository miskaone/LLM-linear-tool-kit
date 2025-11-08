/**
 * Batch Operations Module for Linear Toolkit
 * Provides efficient bulk operations for multiple issues
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export interface BatchUpdateProgress {
    total: number;
    completed: number;
    successful: number;
    failed: number;
    inProgress: boolean;
}
export declare class BatchOperationsModule extends BaseModule {
    private readonly BATCH_SIZE;
    private activeBatches;
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Batch Operations module
     */
    protected setupOperations(): void;
    /**
     * Update multiple issues efficiently
     */
    private batchUpdate;
    /**
     * Transition multiple issues to new states
     */
    private batchTransition;
    /**
     * Create multiple issues efficiently
     */
    private bulkCreate;
    /**
     * Delete/archive multiple issues
     */
    private bulkDelete;
    /**
     * Add labels to multiple issues
     */
    private batchAddLabels;
    /**
     * Remove labels from multiple issues
     */
    private batchRemoveLabels;
    /**
     * Assign multiple issues to users
     */
    private batchAssign;
    /**
     * Get progress of a batch operation
     */
    private getBatchProgress;
    /**
     * Update a single issue
     */
    private updateSingleIssue;
    /**
     * Generate unique batch ID
     */
    private generateBatchId;
}
//# sourceMappingURL=BatchOperationsModule.d.ts.map