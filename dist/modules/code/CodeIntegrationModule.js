"use strict";
/**
 * Code Integration Module for Linear Toolkit
 * Provides code-aware operations that understand relationships between code and issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeIntegrationModule = void 0;
const BaseModule_1 = require("../BaseModule");
class CodeIntegrationModule extends BaseModule_1.BaseModule {
    constructor(graphqlClient, session) {
        super('code', {
            name: 'code',
            version: '1.0.0',
            operations: ['mapFileToIssues', 'createFromCodeAnalysis', 'updateFromCommit', 'findIssuesByCodePattern'],
            dependencies: ['issues'],
        }, graphqlClient, session);
        this.codeToIssueCache = new Map();
    }
    /**
     * Setup all operations for the Code Integration module
     */
    setupOperations() {
        this.registerOperation(this.createOperation('mapFileToIssues', 'Find issues related to specific code files', {
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
        }, this.mapFileToIssues.bind(this), `
await codeModule.execute('mapFileToIssues', {
  files: ['src/auth.ts', 'src/utils/validation.ts']
});
        `));
        this.registerOperation(this.createOperation('createFromCodeAnalysis', 'Create issues from code analysis results', {
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
        }, this.createFromCodeAnalysis.bind(this), `
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
        `));
        this.registerOperation(this.createOperation('updateFromCommit', 'Update issues based on commit changes', {
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
        }, this.updateFromCommit.bind(this), `
await codeModule.execute('updateFromCommit', {
  commitMessage: 'Fix authentication flow for OAuth',
  commitHash: 'abc123def456',
  changedFiles: ['src/auth.ts', 'tests/auth.test.ts']
});
        `));
        this.registerOperation(this.createOperation('findIssuesByCodePattern', 'Find issues matching code patterns or error messages', {
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
        }, this.findIssuesByCodePattern.bind(this)));
    }
    /**
     * Map files to related issues
     */
    async mapFileToIssues(params) {
        const { files, includeChildren = true } = params;
        const result = new Map();
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
                const issueResponse = await this.graphqlClient.query({ query, variables: { query: searchQuery } }, true);
                // TODO: Parse response and map to Issue[]
                result.set(file, []);
                // Cache the result
                this.codeToIssueCache.set(file, []);
            }
            this.logger.info(`Mapped ${files.length} files to issues`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to map files to issues', error);
            throw error;
        }
    }
    /**
     * Create issues from code analysis
     */
    async createFromCodeAnalysis(params) {
        const { analysis, teamId, createSecurityIssues = true, createBugIssues = true, createRefactoringIssues = false, } = params;
        const createdIssues = [];
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
        }
        catch (error) {
            this.logger.error('Failed to create issues from code analysis', error);
            throw error;
        }
    }
    /**
     * Update issues based on commit information
     */
    async updateFromCommit(params) {
        const { commitMessage, commitHash, changedFiles, author } = params;
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
                }
                catch (error) {
                    this.logger.warn(`Failed to update issue ${issueId}`, error);
                }
            }
            this.logger.info(`Updated ${updated} issues from commit, linked ${linked}`);
            return { updated, linked };
        }
        catch (error) {
            this.logger.error('Failed to update issues from commit', error);
            throw error;
        }
    }
    /**
     * Find issues by code pattern or error message
     */
    async findIssuesByCodePattern(params) {
        const { pattern, fuzzyMatch = true } = params;
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
            const result = await this.graphqlClient.query({ query, variables: { query: pattern } }, true);
            // TODO: Parse result
            this.logger.debug(`Found issues matching pattern: ${pattern}`);
            return [];
        }
        catch (error) {
            this.logger.error(`Failed to find issues by pattern ${pattern}`, error);
            throw error;
        }
    }
    /**
     * Create an issue for a code finding
     */
    async createIssueForFinding(input) {
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
            return {};
        }
        catch (error) {
            this.logger.error('Failed to create issue from finding', error);
            throw error;
        }
    }
    /**
     * Extract issue IDs from commit message (e.g., LIN-123)
     */
    extractIssueReferences(message) {
        const issuePattern = /\b[A-Z]+-\d+\b/g;
        const matches = message.match(issuePattern);
        return matches ? [...new Set(matches)] : [];
    }
    /**
     * Get parent directory paths (for includeChildren)
     */
    getParentPaths(filePath) {
        const parts = filePath.split('/');
        const paths = [];
        for (let i = 1; i < parts.length; i++) {
            paths.push(parts.slice(0, i).join('/'));
        }
        return paths;
    }
    /**
     * Get priority level from severity
     */
    getSeverityPriority(severity) {
        const severityMap = {
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
    formatSecurityIssue(issue) {
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
    formatBugIssue(bug) {
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
    formatRefactoringIssue(refactor) {
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
    formatCommitComment(message, hash, files, author) {
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
exports.CodeIntegrationModule = CodeIntegrationModule;
//# sourceMappingURL=CodeIntegrationModule.js.map