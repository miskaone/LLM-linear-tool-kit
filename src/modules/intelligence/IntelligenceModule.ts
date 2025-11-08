/**
 * Intelligence Module for Linear Toolkit
 * Provides AI-powered suggestions and intelligent features
 */

import { Issue, Label, Cycle, WorkContext } from '@types/linear.types';
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

export class IntelligenceModule extends BaseModule {
  private issueCache: Map<string, Issue> = new Map();
  private labelCache: Map<string, Label> = new Map();

  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    super(
      'intelligence',
      {
        name: 'intelligence',
        version: '1.0.0',
        operations: ['suggestNextTask', 'suggestLabels', 'detectDuplicates', 'analyzeWorkload'],
        dependencies: ['issues', 'labels'],
      },
      graphqlClient,
      session
    );
  }

  /**
   * Setup all operations for the Intelligence module
   */
  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'suggestNextTask',
        'Suggest the most important task to work on next',
        {
          context: {
            name: 'context',
            type: 'object',
            required: false,
            description: 'Current work context (optional)',
          },
          limit: {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of suggestions (default: 5)',
          },
          considerDependencies: {
            name: 'considerDependencies',
            type: 'boolean',
            required: false,
            description: 'Factor in blocking dependencies (default: true)',
          },
        },
        this.suggestNextTask.bind(this),
        `
await intelligenceModule.execute('suggestNextTask', {
  limit: 3,
  considerDependencies: true
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'suggestLabels',
        'Suggest labels for an issue based on content',
        {
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Issue ID to analyze',
          },
          availableLabels: {
            name: 'availableLabels',
            type: 'array',
            required: false,
            description: 'Array of available label IDs to suggest from',
          },
          confidenceThreshold: {
            name: 'confidenceThreshold',
            type: 'number',
            required: false,
            description: 'Minimum confidence (0-1, default: 0.5)',
          },
        },
        this.suggestLabels.bind(this),
        `
await intelligenceModule.execute('suggestLabels', {
  issueId: 'LIN-123',
  confidenceThreshold: 0.6
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'detectDuplicates',
        'Find potential duplicate issues',
        {
          issueId: {
            name: 'issueId',
            type: 'string',
            required: true,
            description: 'Issue ID to check for duplicates',
          },
          threshold: {
            name: 'threshold',
            type: 'number',
            required: false,
            description: 'Similarity threshold (0-1, default: 0.7)',
          },
          limit: {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum duplicates to return (default: 10)',
          },
        },
        this.detectDuplicates.bind(this),
        `
await intelligenceModule.execute('detectDuplicates', {
  issueId: 'LIN-123',
  threshold: 0.75
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'analyzeWorkload',
        'Analyze workload and resource allocation',
        {
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
            description: 'Optional cycle ID to focus on',
          },
        },
        this.analyzeWorkload.bind(this)
      )
    );
  }

  /**
   * Suggest the next task to work on
   */
  private async suggestNextTask(params: Record<string, unknown>): Promise<TaskSuggestion[]> {
    const { limit = 5, considerDependencies = true } = params as {
      context?: WorkContext;
      limit?: number;
      considerDependencies?: boolean;
    };

    try {
      const query = `
        query GetUnstartedIssues($first: Int!) {
          issues(
            first: $first
            filter: { state: { type: { nin: ["completed"] } }, assignee: null }
            orderBy: PRIORITY
          ) {
            nodes {
              id
              identifier
              title
              description
              priority
              estimate
              state { id name type }
              team { id name }
              relations {
                nodes {
                  type
                  relatedIssue { id identifier title }
                }
              }
            }
          }
        }
      `;

      const result = await this.graphqlClient.query(
        { query, variables: { first: limit * 3 } }, // Get more to filter
        true
      );

      // TODO: Parse result and score issues based on:
      // - Priority
      // - Dependencies (if enabled)
      // - Effort estimate
      // - Team velocity
      // - Recent activity

      const suggestions: TaskSuggestion[] = [];

      this.logger.info(`Generated ${suggestions.length} task suggestions`);
      return suggestions;
    } catch (error) {
      this.logger.error('Failed to suggest next task', error);
      throw error;
    }
  }

  /**
   * Suggest labels for an issue
   */
  private async suggestLabels(params: Record<string, unknown>): Promise<LabelSuggestion[]> {
    const { issueId, availableLabels, confidenceThreshold = 0.5 } = params as {
      issueId: string;
      availableLabels?: string[];
      confidenceThreshold?: number;
    };

    try {
      // Get issue details
      const issueQuery = `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            title
            description
            labels { nodes { id name } }
          }
        }
      `;

      const issueResult = await this.graphqlClient.query(
        { query: issueQuery, variables: { id: issueId } },
        true
      );

      // TODO: Parse issue result

      // Get available labels if not provided
      let labels: Label[] = [];
      if (availableLabels && availableLabels.length > 0) {
        // Use provided labels
      } else {
        // Fetch all team labels
      }

      // Analyze issue content and suggest matching labels
      const suggestions: LabelSuggestion[] = [];

      // Keywords to score labels
      const keywords = this.extractKeywords(''); // From issue title + description

      for (const label of labels) {
        const confidence = this.calculateLabelConfidence(label, keywords);

        if (confidence >= confidenceThreshold) {
          suggestions.push({
            label,
            confidence,
            matches: keywords.filter((k) => label.name.toLowerCase().includes(k.toLowerCase())),
          });
        }
      }

      // Sort by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);

      this.logger.info(`Suggested ${suggestions.length} labels for issue ${issueId}`);
      return suggestions;
    } catch (error) {
      this.logger.error(`Failed to suggest labels for issue ${issueId}`, error);
      throw error;
    }
  }

  /**
   * Detect duplicate issues
   */
  private async detectDuplicates(params: Record<string, unknown>): Promise<IssueComparison[]> {
    const { issueId, threshold = 0.7, limit = 10 } = params as {
      issueId: string;
      threshold?: number;
      limit?: number;
    };

    try {
      // Get the target issue
      const issueQuery = `
        query GetIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            description
            state { name }
          }
        }
      `;

      const issueResult = await this.graphqlClient.query(
        { query: issueQuery, variables: { id: issueId } },
        true
      );

      // TODO: Parse issue result

      // Get all open issues (could be large, consider pagination)
      const allIssuesQuery = `
        query GetIssues($first: Int!) {
          issues(first: $first, filter: { state: { type: { nin: ["completed"] } } }) {
            nodes {
              id
              identifier
              title
              description
            }
          }
        }
      `;

      const allIssuesResult = await this.graphqlClient.query(
        { query: allIssuesQuery, variables: { first: 100 } },
        true
      );

      // TODO: Parse all issues

      // Compare with all other issues using similarity metrics
      const comparisons: IssueComparison[] = [];

      // Simple similarity: check common words in title/description
      // Real implementation would use more sophisticated NLP

      // Filter by threshold and limit
      const filtered = comparisons
        .filter((c) => c.similarity >= threshold && c.issue1Id !== issueId)
        .slice(0, limit);

      this.logger.info(`Found ${filtered.length} potential duplicates for ${issueId}`);
      return filtered;
    } catch (error) {
      this.logger.error(`Failed to detect duplicates for ${issueId}`, error);
      throw error;
    }
  }

  /**
   * Analyze team workload
   */
  private async analyzeWorkload(params: Record<string, unknown>): Promise<any> {
    const { teamId, cycleId } = params as { teamId: string; cycleId?: string };

    try {
      let query = `
        query AnalyzeWorkload($teamId: String!) {
          team(id: $teamId) {
            id
            name
            members { nodes { id name } }
            cycles(first: 5, filter: { isActive: true }) {
              nodes {
                id
                name
                issues(first: 100) {
                  nodes {
                    id
                    assignee { id name }
                    estimate
                    state { name }
                  }
                }
              }
            }
          }
        }
      `;

      if (cycleId) {
        query = `
          query AnalyzeCycleWorkload($cycleId: String!) {
            cycle(id: $cycleId) {
              id
              name
              team { id name members { nodes { id name } } }
              issues(first: 100) {
                nodes {
                  id
                  assignee { id name }
                  estimate
                  state { name }
                }
              }
            }
          }
        `;
      }

      const result = await this.graphqlClient.query(
        { query, variables: { teamId, cycleId } },
        true
      );

      // TODO: Parse result and analyze:
      // - Issues per team member
      // - Total estimates vs actual velocity
      // - Bottlenecks and overload
      // - Risk assessment

      const analysis = {
        teamId,
        cycleId,
        totalIssues: 0,
        totalEstimate: 0,
        issuesByAssignee: {} as Record<string, { count: number; estimate: number }>,
        workloadBalance: 0,
        riskFactors: [] as string[],
      };

      this.logger.info(`Analyzed workload for team ${teamId}`);
      return analysis;
    } catch (error) {
      this.logger.error(`Failed to analyze workload for team ${teamId}`, error);
      throw error;
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - split by common delimiters
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
    ]);

    return text
      .toLowerCase()
      .split(/[\s\-_.,;:!?]+/)
      .filter((word) => word.length > 2 && !commonWords.has(word));
  }

  /**
   * Calculate label confidence score
   */
  private calculateLabelConfidence(label: Label, keywords: string[]): number {
    const labelWords = label.name.toLowerCase().split(/[\s\-_]+/);
    const matches = labelWords.filter((w) => keywords.includes(w));

    return matches.length > 0 ? Math.min(1, matches.length / Math.max(labelWords.length, 1)) : 0;
  }

  /**
   * Calculate text similarity (Jaccard index)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(this.extractKeywords(text1));
    const words2 = new Set(this.extractKeywords(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}
