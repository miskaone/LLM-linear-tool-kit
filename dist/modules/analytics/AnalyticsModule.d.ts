/**
 * Analytics Module for Linear Toolkit
 * Provides insights and metrics about workspace and project performance
 */
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export interface TeamMetrics {
    teamId: string;
    teamName: string;
    totalIssues: number;
    completedIssues: number;
    activeIssues: number;
    averageCycleTime: number;
    averageEstimate: number;
    teamMembers: number;
    topContributors: Array<{
        memberId: string;
        issuesCompleted: number;
    }>;
}
export interface CycleMetrics {
    cycleId: string;
    cycleName: string;
    plannedIssues: number;
    completedIssues: number;
    completionPercentage: number;
    totalEstimate: number;
    actualVelocity: number;
    daysElapsed: number;
    daysRemaining: number;
    burndown: Array<{
        day: number;
        remaining: number;
    }>;
}
export interface WorkspaceMetrics {
    totalTeams: number;
    totalIssues: number;
    completedIssues: number;
    overallCompletionRate: number;
    averageResolutionTime: number;
    topIssueTypes: Array<{
        type: string;
        count: number;
    }>;
    topLabels: Array<{
        label: string;
        count: number;
    }>;
    healthScore: number;
}
export declare class AnalyticsModule extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Analytics module
     */
    protected setupOperations(): void;
    /**
     * Get comprehensive metrics for a team
     */
    private getTeamMetrics;
    /**
     * Get metrics for a specific cycle
     */
    private getCycleMetrics;
    /**
     * Get high-level workspace metrics
     */
    private getWorkspaceMetrics;
    /**
     * Generate comprehensive analytics report
     */
    private generateReport;
    /**
     * Format report as Markdown
     */
    private formatAsMarkdown;
    /**
     * Format report as HTML
     */
    private formatAsHTML;
}
//# sourceMappingURL=AnalyticsModule.d.ts.map