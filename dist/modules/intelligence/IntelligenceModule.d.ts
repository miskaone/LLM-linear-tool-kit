/**
 * Intelligence Module for Linear Toolkit
 * Provides AI-powered suggestions and intelligent features
 */
import { Issue, Label } from '@types/linear.types';
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';
export interface IssueComparison {
    issue1Id: string;
    issue2Id: string;
    similarity: number;
    commonWords: string[];
}
export interface TaskSuggestion {
    issue: Issue;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedEffort?: number;
}
export interface LabelSuggestion {
    label: Label;
    confidence: number;
    matches: string[];
}
export declare class IntelligenceModule extends BaseModule {
    private issueCache;
    private labelCache;
    constructor(graphqlClient: GraphQLClient, session: SessionManager);
    /**
     * Setup all operations for the Intelligence module
     */
    protected setupOperations(): void;
    /**
     * Suggest the next task to work on
     */
    private suggestNextTask;
    /**
     * Suggest labels for an issue
     */
    private suggestLabels;
    /**
     * Detect duplicate issues
     */
    private detectDuplicates;
    /**
     * Analyze team workload
     */
    private analyzeWorkload;
    /**
     * Extract keywords from text
     */
    private extractKeywords;
    /**
     * Calculate label confidence score
     */
    private calculateLabelConfidence;
    /**
     * Calculate text similarity (Jaccard index)
     */
    private calculateSimilarity;
}
//# sourceMappingURL=IntelligenceModule.d.ts.map