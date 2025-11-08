"use strict";
/**
 * Analytics Module for Linear Toolkit
 * Provides insights and metrics about workspace and project performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const BaseModule_1 = require("../BaseModule");
class AnalyticsModule extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('analytics', {
            name: 'analytics',
            version: '1.0.0',
            operations: ['getTeamMetrics', 'getCycleMetrics', 'getWorkspaceMetrics', 'generateReport'],
            dependencies: ['issues'],
        }, graphqlClient, session);
    }
    /**
     * Setup all operations for the Analytics module
     */
    setupOperations() {
        this.registerOperation(this.createOperation('getTeamMetrics', 'Get comprehensive metrics for a team', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID to analyze',
            },
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: false,
                description: 'Optional cycle to focus on',
            },
        }, this.getTeamMetrics.bind(this), `
await analyticsModule.execute('getTeamMetrics', {
  teamId: 'team-123'
});
        `));
        this.registerOperation(this.createOperation('getCycleMetrics', 'Get metrics for a specific cycle/sprint', {
            cycleId: {
                name: 'cycleId',
                type: 'string',
                required: true,
                description: 'Cycle ID to analyze',
            },
            includeBurndown: {
                name: 'includeBurndown',
                type: 'boolean',
                required: false,
                description: 'Include burndown chart data (default: true)',
            },
        }, this.getCycleMetrics.bind(this), `
await analyticsModule.execute('getCycleMetrics', {
  cycleId: 'cycle-123',
  includeBurndown: true
});
        `));
        this.registerOperation(this.createOperation('getWorkspaceMetrics', 'Get high-level workspace metrics', {
            timeframe: {
                name: 'timeframe',
                type: 'string',
                required: false,
                description: 'Timeframe: week, month, quarter, year (default: month)',
            },
        }, this.getWorkspaceMetrics.bind(this), `
await analyticsModule.execute('getWorkspaceMetrics', {
  timeframe: 'month'
});
        `));
        this.registerOperation(this.createOperation('generateReport', 'Generate comprehensive analytics report', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: false,
                description: 'Team ID for team report (if not set, generates workspace report)',
            },
            format: {
                name: 'format',
                type: 'string',
                required: false,
                description: 'Report format: json, markdown, html (default: json)',
            },
        }, this.generateReport.bind(this)));
    }
    /**
     * Get comprehensive metrics for a team
     */
    async getTeamMetrics(params) {
        const { teamId, cycleId } = params;
        try {
            let query = `
        query GetTeamMetrics($teamId: String!) {
          team(id: $teamId) {
            id
            name
            members { nodes { id name } }
            issues(first: 1000) {
              nodes {
                id
                state { name type }
                estimate
                completedAt
                createdAt
                assignee { id name }
              }
            }
          }
        }
      `;
            if (cycleId) {
                query = `
          query GetTeamCycleMetrics($teamId: String!, $cycleId: String!) {
            team(id: $teamId) {
              id
              name
              members { nodes { id name } }
            }
            cycle(id: $cycleId) {
              issues(first: 1000) {
                nodes {
                  id
                  state { name type }
                  estimate
                  completedAt
                  createdAt
                  assignee { id name }
                }
              }
            }
          }
        `;
            }
            const result = await this.graphqlClient.query({ query, variables: { teamId, cycleId } }, true);
            // TODO: Parse result and calculate metrics:
            // - Total/completed/active issues
            // - Average cycle time
            // - Average estimate
            // - Top contributors
            // - Velocity trends
            const metrics = {
                teamId,
                teamName: '', // From result
                totalIssues: 0,
                completedIssues: 0,
                activeIssues: 0,
                averageCycleTime: 0,
                averageEstimate: 0,
                teamMembers: 0,
                topContributors: [],
            };
            this.logger.info(`Team metrics calculated for ${teamId}`);
            return metrics;
        }
        catch (error) {
            this.logger.error(`Failed to get team metrics for ${teamId}`, error);
            throw error;
        }
    }
    /**
     * Get metrics for a specific cycle
     */
    async getCycleMetrics(params) {
        const { cycleId, includeBurndown = true } = params;
        try {
            const query = `
        query GetCycleMetrics($cycleId: String!) {
          cycle(id: $cycleId) {
            id
            name
            startsAt
            endsAt
            completedAt
            issues(first: 1000) {
              nodes {
                id
                state { name type }
                estimate
                completedAt
                updatedAt
              }
            }
          }
        }
      `;
            const result = await this.graphqlClient.query({ query, variables: { cycleId } }, true);
            // TODO: Parse result and calculate:
            // - Planned vs completed issues
            // - Velocity
            // - Burndown chart data (if enabled)
            // - Cycle health
            const metrics = {
                cycleId,
                cycleName: '', // From result
                plannedIssues: 0,
                completedIssues: 0,
                completionPercentage: 0,
                totalEstimate: 0,
                actualVelocity: 0,
                daysElapsed: 0,
                daysRemaining: 0,
                burndown: [],
            };
            this.logger.info(`Cycle metrics calculated for ${cycleId}`);
            return metrics;
        }
        catch (error) {
            this.logger.error(`Failed to get cycle metrics for ${cycleId}`, error);
            throw error;
        }
    }
    /**
     * Get high-level workspace metrics
     */
    async getWorkspaceMetrics(params) {
        const { timeframe = 'month' } = params;
        try {
            const query = `
        query GetWorkspaceMetrics($first: Int!) {
          teams(first: $first) {
            nodes {
              id
              name
              issues(first: 1000) {
                nodes {
                  id
                  identifier
                  title
                  state { type }
                  estimate
                  completedAt
                  createdAt
                  labels { nodes { name } }
                }
              }
            }
          }
        }
      `;
            const result = await this.graphqlClient.query({ query, variables: { first: 100 } }, true);
            // TODO: Parse result and aggregate metrics across workspace:
            // - Total issues and completion rate
            // - Average resolution time
            // - Top issue types/labels
            // - Health score
            const metrics = {
                totalTeams: 0,
                totalIssues: 0,
                completedIssues: 0,
                overallCompletionRate: 0,
                averageResolutionTime: 0,
                topIssueTypes: [],
                topLabels: [],
                healthScore: 0,
            };
            this.logger.info(`Workspace metrics calculated for timeframe: ${timeframe}`);
            return metrics;
        }
        catch (error) {
            this.logger.error('Failed to get workspace metrics', error);
            throw error;
        }
    }
    /**
     * Generate comprehensive analytics report
     */
    async generateReport(params) {
        const { teamId, format = 'json' } = params;
        try {
            let report;
            if (teamId) {
                // Generate team report
                report = await this.getTeamMetrics({ teamId });
            }
            else {
                // Generate workspace report
                report = await this.getWorkspaceMetrics({});
            }
            // Format report
            switch (format) {
                case 'markdown':
                    return this.formatAsMarkdown(report, teamId ? 'Team' : 'Workspace');
                case 'html':
                    return this.formatAsHTML(report, teamId ? 'Team' : 'Workspace');
                case 'json':
                default:
                    return report;
            }
        }
        catch (error) {
            this.logger.error('Failed to generate report', error);
            throw error;
        }
    }
    /**
     * Format report as Markdown
     */
    formatAsMarkdown(data, type) {
        return `
# ${type} Analytics Report

Generated: ${new Date().toISOString()}

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
    `.trim();
    }
    /**
     * Format report as HTML
     */
    formatAsHTML(data, type) {
        return `
<!DOCTYPE html>
<html>
  <head>
    <title>${type} Analytics Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #333; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>${type} Analytics Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  </body>
</html>
    `.trim();
    }
}
exports.AnalyticsModule = AnalyticsModule;
//# sourceMappingURL=AnalyticsModule.js.map