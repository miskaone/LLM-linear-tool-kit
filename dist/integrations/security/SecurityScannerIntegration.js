"use strict";
/**
 * Security Scanner Integration for Linear Toolkit
 * Integrates security scanning tools and creates issues for vulnerabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityScannerIntegration = void 0;
const BaseModule_1 = require("@modules/BaseModule");
class SecurityScannerIntegration extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('security', {
            name: 'security',
            version: '1.0.0',
            operations: [
                'reportSecurityScan',
                'createSecurityIssues',
                'trackVulnerabilityStatus',
                'getSecuritySummary',
                'linkDependencyIssues',
            ],
            dependencies: ['issues', 'code'],
        }, graphqlClient, session);
    }
    setupOperations() {
        this.registerOperation(this.createOperation('reportSecurityScan', 'Report results from security scanning', {
            report: {
                name: 'report',
                type: 'object',
                required: true,
                description: 'Security scan report',
            },
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team to create issues in',
            },
            autoCreate: {
                name: 'autoCreate',
                type: 'boolean',
                required: false,
                description: 'Auto-create issues (default: true)',
            },
        }, this.reportSecurityScan.bind(this), `
await securityModule.execute('reportSecurityScan', {
  report: {
    scanner: 'snyk',
    vulnerabilities: [...],
    totalIssues: 5,
    criticalCount: 1
  },
  teamId: 'team-123',
  autoCreate: true
});
        `));
        this.registerOperation(this.createOperation('createSecurityIssues', 'Create Linear issues for vulnerabilities', {
            vulnerabilities: {
                name: 'vulnerabilities',
                type: 'array',
                required: true,
                description: 'Array of vulnerabilities',
            },
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID',
            },
            minSeverity: {
                name: 'minSeverity',
                type: 'string',
                required: false,
                description: 'Minimum severity to create issues for (default: medium)',
            },
        }, this.createSecurityIssues.bind(this)));
        this.registerOperation(this.createOperation('trackVulnerabilityStatus', 'Track vulnerability remediation status', {
            issueId: {
                name: 'issueId',
                type: 'string',
                required: true,
                description: 'Linear issue ID',
            },
            vulnerabilityId: {
                name: 'vulnerabilityId',
                type: 'string',
                required: true,
                description: 'Vulnerability ID',
            },
        }, this.trackVulnerabilityStatus.bind(this)));
        this.registerOperation(this.createOperation('getSecuritySummary', 'Get security issues summary', {
            teamId: {
                name: 'teamId',
                type: 'string',
                required: false,
                description: 'Team ID (if not set, workspace summary)',
            },
        }, this.getSecuritySummary.bind(this)));
        this.registerOperation(this.createOperation('linkDependencyIssues', 'Link dependency vulnerability to issues', {
            packageName: {
                name: 'packageName',
                type: 'string',
                required: true,
                description: 'Package/dependency name',
            },
            teamId: {
                name: 'teamId',
                type: 'string',
                required: true,
                description: 'Team ID',
            },
        }, this.linkDependencyIssues.bind(this)));
    }
    async reportSecurityScan(params) {
        const { report, teamId, autoCreate = true } = params;
        try {
            let created = 0;
            let updated = 0;
            if (autoCreate) {
                // TODO: Create issues for each vulnerability
                created = report.vulnerabilities.length;
            }
            this.logger.info(`Security scan reported: ${created} created, ${updated} updated`);
            return { created, updated };
        }
        catch (error) {
            this.logger.error('Failed to report security scan', error);
            throw error;
        }
    }
    async createSecurityIssues(params) {
        const { vulnerabilities, teamId, minSeverity = 'medium' } = params;
        try {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const minLevel = severityOrder[minSeverity] || 2;
            const filtered = vulnerabilities.filter((v) => severityOrder[v.severity] <= minLevel);
            let created = 0;
            for (const vuln of filtered) {
                // TODO: Create Linear issue for vulnerability
                created++;
            }
            this.logger.info(`Created ${created} security issues`);
            return { created };
        }
        catch (error) {
            this.logger.error('Failed to create security issues', error);
            throw error;
        }
    }
    async trackVulnerabilityStatus(params) {
        const { issueId, vulnerabilityId } = params;
        try {
            // TODO: Track vulnerability remediation status
            this.logger.info(`Tracking vulnerability ${vulnerabilityId} on issue ${issueId}`);
            return { tracked: true };
        }
        catch (error) {
            this.logger.error('Failed to track vulnerability status', error);
            throw error;
        }
    }
    async getSecuritySummary(params) {
        const { teamId } = params;
        try {
            // TODO: Aggregate security issues
            const summary = {
                totalVulnerabilities: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                openIssues: 0,
                resolvedIssues: 0,
                averageResolutionTime: 0,
            };
            this.logger.info(`Security summary generated`);
            return summary;
        }
        catch (error) {
            this.logger.error('Failed to get security summary', error);
            throw error;
        }
    }
    async linkDependencyIssues(params) {
        const { packageName, teamId } = params;
        try {
            // TODO: Find all issues using vulnerable dependency
            // TODO: Link to dependency vulnerability issue
            let linked = 0;
            this.logger.info(`Linked ${linked} issues for dependency ${packageName}`);
            return { linked };
        }
        catch (error) {
            this.logger.error('Failed to link dependency issues', error);
            throw error;
        }
    }
}
exports.SecurityScannerIntegration = SecurityScannerIntegration;
//# sourceMappingURL=SecurityScannerIntegration.js.map