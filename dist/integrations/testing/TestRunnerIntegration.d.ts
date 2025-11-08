/**
 * Test Runner Integration for Linear Toolkit
 * Tracks test results and updates Linear issues
 */
import { BaseModule } from '@modules/BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export interface TestResult {
    testName: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    file: string;
}
export interface TestSuite {
    name: string;
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    results: TestResult[];
}
export declare class TestRunnerIntegration extends BaseModule {
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    protected setupOperations(): void;
    private reportTestResults;
    private linkTestsToIssue;
    private trackTestCoverage;
    private createIssueFromFailure;
    private updateIssueWithResults;
}
//# sourceMappingURL=TestRunnerIntegration.d.ts.map