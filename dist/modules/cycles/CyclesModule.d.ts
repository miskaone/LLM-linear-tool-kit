/**
 * Cycles Module for Linear Toolkit
 * Provides operations for managing sprints/cycles
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export declare class CyclesModule extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Cycles module
     */
    protected setupOperations(): void;
    /**
     * Get the current active cycle for a team
     */
    private getCurrentCycle;
    /**
     * Get a cycle by ID
     */
    private getCycleById;
    /**
     * List all cycles in a team
     */
    private listTeamCycles;
    /**
     * Create a new cycle
     */
    private createCycle;
    /**
     * Update a cycle
     */
    private updateCycle;
    /**
     * Get all issues in a cycle
     */
    private getCycleIssues;
    /**
     * Add an issue to a cycle
     */
    private addIssueToCycle;
    /**
     * Remove an issue from a cycle
     */
    private removeIssueFromCycle;
    /**
     * Close/complete a cycle
     */
    private closeCycle;
}
//# sourceMappingURL=CyclesModule.d.ts.map