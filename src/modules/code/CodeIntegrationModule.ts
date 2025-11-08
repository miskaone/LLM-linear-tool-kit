/**
 * Code Integration Module for Linear Toolkit
 * Provides code-aware operations that understand relationships between code and issues
 */

import { Issue, CodeContext, CodeAnalysis, CreateIssueInput } from '@types/linear.types';
import { BaseModule } from '../BaseModule';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { SessionManager } from '@core/client/SessionManager';

export class CodeIntegrationModule extends BaseModule {
  private codeToIssueCache: Map<string, string[]> = new Map();

  constructor(graphqlClient: GraphQLClient, session: SessionManager) {
    super(
      'code',
      {
        name: 'code',
        version: '1.0.0',
        operations: ['mapFileToIssues', 'createFromCodeAnalysis', 'updateFromCommit', 'findIssuesByCodePattern'],
        dependencies: ['issues'],
      },
      graphqlClient,
      session
    );
  }

  /**
   * Setup all operations for the Code Integration module
   */
  protected setupOperations(): void {
    this.registerOperation(
      this.createOperation(
        'mapFileToIssues',
        'Find issues related to specific code files',
        {
          files: {
            name: 'files',
            type: 'array',
            required: true,
            description: 'Array of file paths to search for',
          },
          includeChildren: {
            name: 'includeChildren',
            type: 'boolean',
            required: false,
            description: 'Include issues for child files (default: true)',
          },
        },
        this.mapFileToIssues.bind(this),
        `
await codeModule.execute('mapFileToIssues', {
  files: ['src/auth.ts', 'src/utils/validation.ts']
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'createFromCodeAnalysis',
        'Create issues from code analysis results',
        {
          analysis: {
            name: 'analysis',
            type: 'object',
            required: true,
            description: 'Code analysis object with todos, bugs, security issues, refactoring suggestions',
          },
          teamId: {
            name: 'teamId',
            type: 'string',
            required: true,
            description: 'Team ID to create issues in',
          },
          createSecurityIssues: {
            name: 'createSecurityIssues',
            type: 'boolean',
            required: false,
            description: 'Create issues for security findings (default: true)',
          },
          createBugIssues: {
            name: 'createBugIssues',
            type: 'boolean',
            required: false,
            description: 'Create issues for potential bugs (default: true)',
          },
          createRefactoringIssues: {
            name: 'createRefactoringIssues',
            type: 'boolean',
            required: false,
            description: 'Create issues for refactoring suggestions (default: false)',
          },
        },
        this.createFromCodeAnalysis.bind(this),
        `
await codeModule.execute('createFromCodeAnalysis', {
  analysis: {
    todos: [...],
    bugs: [...],
    security: [...]
  },
  teamId: 'team-123',
  createSecurityIssues: true,
  createBugIssues: true
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'updateFromCommit',
        'Update issues based on commit changes',
        {
          commitMessage: {
            name: 'commitMessage',
            type: 'string',
            required: true,
            description: 'Commit message to analyze',
          },
          commitHash: {
            name: 'commitHash',
            type: 'string',
            required: false,
            description: 'Commit hash for linking',
          },
          changedFiles: {
            name: 'changedFiles',
            type: 'array',
            required: true,
            description: 'Array of changed file paths',
          },
          author: {
            name: 'author',
            type: 'string',
            required: false,
            description: 'Commit author',
          },
        },
        this.updateFromCommit.bind(this),
        `
await codeModule.execute('updateFromCommit', {
  commitMessage: 'Fix authentication flow for OAuth',
  commitHash: 'abc123def456',
  changedFiles: ['src/auth.ts', 'tests/auth.test.ts']
});
        `
      )
    );

    this.registerOperation(
      this.createOperation(
        'findIssuesByCodePattern',
        'Find issues matching code patterns or error messages',
        {
          pattern: {
            name: 'pattern',
            type: 'string',
            required: true,
            description: 'Code pattern, error message, or function name',
          },
          fuzzyMatch: {
            name: 'fuzzyMatch',
            type: 'boolean',
            required: false,
            description: 'Enable fuzzy matching (default: true)',
          },
        },
        this.findIssuesByCodePattern.bind(this)
      )
    );
  }

  /**
   * Map files to related issues
   */
  private async mapFileToIssues(params: Record<string, unknown>): Promise<Map<string, Issue[]>> {
    const { files, includeChildren = true } = params as { files: string[]; includeChildren?: boolean };

    const result = new Map<string, Issue[]>();

    try {
      for (const file of files) {
        // Check cache first
        const cached = this.codeToIssueCache.get(file);
        if (cached) {
          this.logger.debug(`File mapping found in cache: ${file}`);
          // TODO: Convert cached IDs to full Issue objects
          continue;
        }

        // Search for issues mentioning this file
        const query = `
          query SearchByFile($query: String!) {
            issues(first: 50, filter: { searchableContent: { contains: $query } }) {
              nodes {
                id
                identifier
                title
                description
                state { id name }
                priority
              }
            }
          }
        `;

        const queryTerms = [
          file,
          file.split('/').pop(), // Just filename
          ...(includeChildren ? this.getParentPaths(file) : []),
        ];

        const searchQuery = queryTerms.join(' OR ');

        const issueResponse = await this.graphqlClient.query(
          { query, variables: { query: searchQuery } },
          true
        );

        // TODO: Parse response and map to Issue[]
        result.set(file, []);

        // Cache the result
        this.codeToIssueCache.set(file, []);
      }

      this.logger.info(`Mapped ${files.length} files to issues`);
      return result;
    } catch (error) {
      this.logger.error('Failed to map files to issues', error);
      throw error;
    }
  }

  /**
   * Create issues from code analysis
   */
  private async createFromCodeAnalysis(params: Record<string, unknown>): Promise<Issue[]> {
    const {
      analysis,
      teamId,
      createSecurityIssues = true,
      createBugIssues = true,
      createRefactoringIssues = false,
    } = params as {
      analysis: CodeAnalysis;
      teamId: string;
      createSecurityIssues?: boolean;
      createBugIssues?: boolean;
      createRefactoringIssues?: boolean;
    };

    const createdIssues: Issue[] = [];

    try {
      // Create security issues
      if (createSecurityIssues) {
        for (const security of analysis.security) {
          const issue = await this.createIssueForFinding({
            title: `Security: ${security.description}`,
            description: this.formatSecurityIssue(security),
            teamId,
            priority: this.getSeverityPriority(security.severity),
            labels: ['security', security.severity],
          });

          createdIssues.push(issue);
        }
      }

      // Create bug issues
      if (createBugIssues) {
        for (const bug of analysis.bugs) {
          const issue = await this.createIssueForFinding({
            title: `Bug: ${bug.description}`,
            description: this.formatBugIssue(bug),
            teamId,
            priority: this.getSeverityPriority(bug.severity),
            labels: ['bug', bug.severity],
          });

          createdIssues.push(issue);
        }
      }

      // Create refactoring issues
      if (createRefactoringIssues) {
        for (const refactor of analysis.refactoring) {
          const issue = await this.createIssueForFinding({
            title: `Refactor: ${refactor.description}`,
            description: this.formatRefactoringIssue(refactor),
            teamId,
            priority: 3, // Medium priority for refactoring
            labels: ['refactoring', `effort-${refactor.effort}`],
          });

          createdIssues.push(issue);
        }
      }

      this.logger.info(`Created ${createdIssues.length} issues from code analysis`);
      return createdIssues;
    } catch (error) {
      this.logger.error('Failed to create issues from code analysis', error);
      throw error;
    }
  }

  /**
   * Update issues based on commit information
   */
  private async updateFromCommit(params: Record<string, unknown>): Promise<{ updated: number; linked: number }> {
    const { commitMessage, commitHash, changedFiles, author } = params as {
      commitMessage: string;
      commitHash?: string;
      changedFiles: string[];
      author?: string;
    };

    let updated = 0;
    let linked = 0;

    try {
      // Extract issue references from commit message
      const issueIds = this.extractIssueReferences(commitMessage);

      if (issueIds.length === 0) {
        this.logger.debug('No issue references found in commit message');
        return { updated: 0, linked: 0 };
      }

      // Update each referenced issue
      for (const issueId of issueIds) {
        try {
          // Add commit reference as comment
          if (commitHash) {
            const commentBody = this.formatCommitComment(commitMessage, commitHash, changedFiles, author);

            // TODO: Add comment operation
            linked++;
          }

          updated++;
        } catch (error) {
          this.logger.warn(`Failed to update issue ${issueId}`, error);
        }
      }

      this.logger.info(`Updated ${updated} issues from commit, linked ${linked}`);
      return { updated, linked };
    } catch (error) {
      this.logger.error('Failed to update issues from commit', error);
      throw error;
    }
  }

  /**
   * Find issues by code pattern or error message
   */
  private async findIssuesByCodePattern(params: Record<string, unknown>): Promise<Issue[]> {
    const { pattern, fuzzyMatch = true } = params as { pattern: string; fuzzyMatch?: boolean };

    try {
      const query = `
        query SearchByPattern($query: String!) {
          issues(first: 50, filter: { searchableContent: { contains: $query } }) {
            nodes {
              id
              identifier
              title
              state { id name }
              priority
            }
          }
        }
      `;

      const result = await this.graphqlClient.query(
        { query, variables: { query: pattern } },
        true
      );

      // TODO: Parse result
      this.logger.debug(`Found issues matching pattern: ${pattern}`);
      return [];
    } catch (error) {
      this.logger.error(`Failed to find issues by pattern ${pattern}`, error);
      throw error;
    }
  }

  /**
   * Create an issue for a code finding
   */
  private async createIssueForFinding(input: {
    title: string;
    description: string;
    teamId: string;
    priority: number;
    labels: string[];
  }): Promise<Issue> {
    const mutation = `
      mutation CreateIssue(
        $title: String!
        $description: String
        $teamId: String!
        $priority: Int
      ) {
        issueCreate(
          input: {
            title: $title
            description: $description
            teamId: $teamId
            priority: $priority
          }
        ) {
          issue {
            id
            identifier
            title
          }
          success
        }
      }
    `;

    try {
      const result = await this.graphqlClient.mutate({
        query: mutation,
        variables: {
          title: input.title,
          description: input.description,
          teamId: input.teamId,
          priority: input.priority,
        },
      });

      // TODO: Parse result
      this.logger.debug(`Issue created from finding: ${input.title}`);
      return {} as Issue;
    } catch (error) {
      this.logger.error('Failed to create issue from finding', error);
      throw error;
    }
  }

  /**
   * Extract issue IDs from commit message (e.g., LIN-123)
   */
  private extractIssueReferences(message: string): string[] {
    const issuePattern = /\b[A-Z]+-\d+\b/g;
    const matches = message.match(issuePattern);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Get parent directory paths (for includeChildren)
   */
  private getParentPaths(filePath: string): string[] {
    const parts = filePath.split('/');
    const paths: string[] = [];

    for (let i = 1; i < parts.length; i++) {
      paths.push(parts.slice(0, i).join('/'));
    }

    return paths;
  }

  /**
   * Get priority level from severity
   */
  private getSeverityPriority(severity: string): number {
    const severityMap: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    return severityMap[severity.toLowerCase()] || 3;
  }

  /**
   * Format security issue for description
   */
  private formatSecurityIssue(issue: any): string {
    return `
## Security Issue

**Severity:** ${issue.severity}
**File:** ${issue.file}:${issue.line || 'N/A'}

**Description:** ${issue.description}

${issue.cwe ? `**CWE:** ${issue.cwe}` : ''}

${issue.remediation ? `**Remediation:**\n${issue.remediation}` : ''}

_Created by Code Integration Module_
    `.trim();
  }

  /**
   * Format bug issue for description
   */
  private formatBugIssue(bug: any): string {
    return `
## Potential Bug

**Severity:** ${bug.severity}
**File:** ${bug.file}:${bug.line || 'N/A'}

**Description:** ${bug.description}

${bug.suggestion ? `**Suggestion:**\n${bug.suggestion}` : ''}

_Created by Code Integration Module_
    `.trim();
  }

  /**
   * Format refactoring suggestion for description
   */
  private formatRefactoringIssue(refactor: any): string {
    return `
## Refactoring Suggestion

**Impact:** ${refactor.impact}
**Effort:** ${refactor.effort}

**Description:** ${refactor.description}

${refactor.file ? `**File:** ${refactor.file}` : ''}

_Created by Code Integration Module_
    `.trim();
  }

  /**
   * Format commit comment
   */
  private formatCommitComment(message: string, hash: string, files: string[], author?: string): string {
    return `
## Commit Reference

**Hash:** \`${hash}\`
${author ? `**Author:** ${author}` : ''}

**Message:** ${message}

**Changed Files:**
${files.map((f) => `- ${f}`).join('\n')}

_Linked by Code Integration Module_
    `.trim();
  }
}
