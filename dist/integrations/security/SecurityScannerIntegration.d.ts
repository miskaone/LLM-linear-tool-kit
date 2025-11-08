/**
 * Security Scanner Integration for Linear Toolkit
 * Integrates security scanning tools and creates issues for vulnerabilities
 */
import { BaseModule } from '@modules/BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export interface Vulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    file: string;
    line?: number;
    cwe?: string;
    cvss?: number;
    remediation?: string;
    references?: string[];
}
export interface SecurityReport {
    scanDate: Date;
    scanner: string;
    vulnerabilities: Vulnerability[];
    totalIssues: number;
    criticalCount: number;
    highCount: number;
}
export declare class SecurityScannerIntegration extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    protected setupOperations(): void;
    private reportSecurityScan;
    private createSecurityIssues;
    private trackVulnerabilityStatus;
    private getSecuritySummary;
    private linkDependencyIssues;
}
//# sourceMappingURL=SecurityScannerIntegration.d.ts.map