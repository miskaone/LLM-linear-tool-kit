# Phase 3: Intelligent Features & Code Integration

## Overview

Phase 3 introduces AI-powered intelligent features, code-aware operations, and efficient batch processing. These modules enable AI agents to autonomously understand code-issue relationships, make smart suggestions, and perform bulk operations at scale.

## What's New in Phase 3

### 1. Code Integration Module

Bridges the gap between code and project management by understanding code-issue relationships.

#### Operations

**mapFileToIssues(files)**
- Find issues related to specific code files
- Supports parent directory matching
- Uses caching for performance
- Returns map of file → issues

```typescript
const issues = await linear.executeModuleOperation('mapFileToIssues', {
  files: ['src/auth.ts', 'src/utils/validation.ts'],
  includeChildren: true
});
// Returns: { 'src/auth.ts': [...issues], 'src/utils/validation.ts': [...issues] }
```

**createFromCodeAnalysis(analysis, teamId)**
- Automatically create issues from code analysis
- Supports security issues, bugs, and refactoring suggestions
- Configurable severity-based prioritization
- Auto-tags issues with appropriate labels

```typescript
const createdIssues = await linear.executeModuleOperation('createFromCodeAnalysis', {
  analysis: {
    security: [{ severity: 'critical', description: 'SQL injection', ... }],
    bugs: [{ severity: 'high', description: 'Null pointer', ... }],
    todos: [],
    refactoring: []
  },
  teamId: 'team-123',
  createSecurityIssues: true,
  createBugIssues: true,
  createRefactoringIssues: false
});
```

**updateFromCommit(commitMessage, changedFiles)**
- Link commits to related issues
- Extracts issue references from commit messages (e.g., LIN-123)
- Adds commit details as comments
- Tracks file changes

```typescript
const result = await linear.executeModuleOperation('updateFromCommit', {
  commitMessage: 'Fix authentication flow for OAuth - fixes LIN-123, LIN-124',
  commitHash: 'abc123def456',
  changedFiles: ['src/auth.ts', 'tests/auth.test.ts'],
  author: 'john.doe'
});
// Returns: { updated: 2, linked: 2 }
```

**findIssuesByCodePattern(pattern)**
- Find issues matching code patterns or error messages
- Fuzzy matching support
- Useful for linking errors to issues

```typescript
const issues = await linear.executeModuleOperation('findIssuesByCodePattern', {
  pattern: 'NullPointerException',
  fuzzyMatch: true
});
```

### 2. Intelligence Module

AI-powered suggestions and intelligent analysis for smarter project management.

#### Operations

**suggestNextTask(context, limit)**
- Recommend the most important task to work on next
- Considers priority, dependencies, effort estimates, team velocity
- Returns ranked suggestions with reasoning

```typescript
const suggestions = await linear.executeModuleOperation('suggestNextTask', {
  limit: 5,
  considerDependencies: true
});
// Returns:
// [
//   {
//     issue: { id, identifier, title, ... },
//     reason: 'High priority with no blocking dependencies',
//     priority: 'high',
//     estimatedEffort: 8
//   },
//   ...
// ]
```

**suggestLabels(issueId, availableLabels)**
- Intelligently recommend labels for an issue
- Analyzes title and description for keyword matches
- Provides confidence scores
- Configurable threshold

```typescript
const suggestions = await linear.executeModuleOperation('suggestLabels', {
  issueId: 'LIN-123',
  confidenceThreshold: 0.6
});
// Returns:
// [
//   { label: { id, name }, confidence: 0.95, matches: ['auth', 'security'] },
//   { label: { id, name }, confidence: 0.75, matches: ['critical'] }
// ]
```

**detectDuplicates(issueId, threshold)**
- Find potential duplicate issues
- Uses similarity metrics (Jaccard index for text)
- Prevents duplicate work
- Returns ranked similarities

```typescript
const duplicates = await linear.executeModuleOperation('detectDuplicates', {
  issueId: 'LIN-123',
  threshold: 0.7,
  limit: 10
});
// Returns:
// [
//   { issue1Id: 'LIN-123', issue2Id: 'LIN-456', similarity: 0.85, commonWords: [...] },
//   ...
// ]
```

**analyzeWorkload(teamId, cycleId)**
- Analyze team workload and resource allocation
- Identifies bottlenecks and overload
- Provides risk assessment
- Suggests workload balancing

```typescript
const analysis = await linear.executeModuleOperation('analyzeWorkload', {
  teamId: 'team-123',
  cycleId: 'cycle-456'
});
// Returns: { totalIssues, issuesByAssignee, workloadBalance, riskFactors }
```

### 3. Batch Operations Module

Efficient bulk operations for high-volume updates.

#### Operations

**batchUpdate(updates, parallel, continueOnError)**
- Update multiple issues efficiently
- Batch size: 50 (configurable)
- Optional parallel execution
- Error handling with continue-on-error flag

```typescript
const result = await linear.executeModuleOperation('batchUpdate', {
  updates: [
    { issueId: 'LIN-1', update: { priority: 1 } },
    { issueId: 'LIN-2', update: { priority: 2 } },
    { issueId: 'LIN-3', update: { assigneeId: 'user-123' } }
  ],
  parallel: true,
  continueOnError: true
});
// Returns: { total: 3, successful: 3, failed: 0, results: [...] }
```

**batchTransition(transitions, comment)**
- Change state for multiple issues
- Optional comment on all issues
- Efficient API usage

```typescript
const result = await linear.executeModuleOperation('batchTransition', {
  transitions: [
    { issueId: 'LIN-1', stateId: 'state-done' },
    { issueId: 'LIN-2', stateId: 'state-done' }
  ],
  comment: 'Sprint completed - Q4 2024'
});
```

**bulkCreate(issues, assignBatch)**
- Create multiple issues efficiently
- Optional batch assignment to cycle
- Returns newly created issue IDs

```typescript
const result = await linear.executeModuleOperation('bulkCreate', {
  issues: [
    { title: 'Feature: Dark mode', teamId: 'team-1', priority: 2 },
    { title: 'Bug: Login timeout', teamId: 'team-1', priority: 1 },
    { title: 'Refactor: API client', teamId: 'team-1', priority: 3 }
  ],
  assignBatch: false
});
```

**batchAddLabels(issueIds, labelIds)**
- Add labels to multiple issues
- Efficient bulk update

```typescript
await linear.executeModuleOperation('batchAddLabels', {
  issueIds: ['LIN-1', 'LIN-2', 'LIN-3'],
  labelIds: ['label-bug', 'label-critical']
});
```

**batchRemoveLabels(issueIds, labelIds)**
- Remove labels from multiple issues

**batchAssign(assignments)**
- Assign multiple issues to team members
- Useful for sprint planning

```typescript
await linear.executeModuleOperation('batchAssign', {
  assignments: [
    { issueId: 'LIN-1', assigneeId: 'user-1' },
    { issueId: 'LIN-2', assigneeId: 'user-2' }
  ]
});
```

### 4. Analytics Module

Comprehensive workspace and project analytics.

#### Operations

**getTeamMetrics(teamId, cycleId)**
- Comprehensive team performance metrics
- Includes cycle time, velocity, contributors
- Optional cycle focus

```typescript
const metrics = await linear.executeModuleOperation('getTeamMetrics', {
  teamId: 'team-123'
});
// Returns:
// {
//   teamId, teamName, totalIssues, completedIssues, activeIssues,
//   averageCycleTime, averageEstimate, teamMembers, topContributors
// }
```

**getCycleMetrics(cycleId, includeBurndown)**
- Sprint/cycle performance metrics
- Optional burndown chart data
- Health assessment

```typescript
const metrics = await linear.executeModuleOperation('getCycleMetrics', {
  cycleId: 'cycle-456',
  includeBurndown: true
});
// Returns:
// {
//   cycleId, cycleName, plannedIssues, completedIssues,
//   completionPercentage, velocity, daysElapsed, daysRemaining, burndown
// }
```

**getWorkspaceMetrics(timeframe)**
- High-level workspace health metrics
- Aggregated across all teams
- Configurable timeframe (week, month, quarter, year)

```typescript
const metrics = await linear.executeModuleOperation('getWorkspaceMetrics', {
  timeframe: 'month'
});
// Returns:
// {
//   totalTeams, totalIssues, completedIssues, overallCompletionRate,
//   averageResolutionTime, topIssueTypes, topLabels, healthScore
// }
```

**generateReport(teamId, format)**
- Generate comprehensive analytics report
- Formats: json, markdown, html
- Team-specific or workspace-wide

```typescript
const report = await linear.executeModuleOperation('generateReport', {
  teamId: 'team-123',
  format: 'markdown'
});
// Returns formatted report as string
```

## Module Dependencies

```
Code Integration Module
└── depends on: Issues

Intelligence Module
├── depends on: Issues
└── depends on: Labels

Batch Operations Module
└── depends on: Issues

Analytics Module
└── depends on: Issues
```

## Usage Patterns

### Pattern 1: Code-Aware Development Workflow
```typescript
// Load code integration module
await linear.loadModule('code');

// When pushing code
const issues = await linear.executeModuleOperation('mapFileToIssues', {
  files: ['src/auth.ts', 'src/user.ts']
});

// Create issues from code analysis
const newIssues = await linear.executeModuleOperation('createFromCodeAnalysis', {
  analysis: codeAnalysisResults,
  teamId: 'team-123'
});

// Link commit to issues
await linear.executeModuleOperation('updateFromCommit', {
  commitMessage: 'Fix auth flow - closes LIN-123',
  changedFiles: ['src/auth.ts']
});
```

### Pattern 2: Intelligent Task Planning
```typescript
// Load intelligence module
await linear.loadModules(['intelligence', 'batch']);

// Get suggested next task
const suggestions = await linear.executeModuleOperation('suggestNextTask', {
  limit: 3
});

// Analyze workload
const workload = await linear.executeModuleOperation('analyzeWorkload', {
  teamId: 'team-123'
});

// Batch assign suggestions
await linear.executeModuleOperation('batchAssign', {
  assignments: suggestedAssignments
});
```

### Pattern 3: Sprint Closing
```typescript
// Load batch and analytics modules
await linear.loadModules(['batch', 'analytics']);

// Get sprint metrics
const metrics = await linear.executeModuleOperation('getCycleMetrics', {
  cycleId: 'current-sprint'
});

// Move completed issues to done
await linear.executeModuleOperation('batchTransition', {
  transitions: completedIssues.map(i => ({
    issueId: i.id,
    stateId: 'state-done'
  })),
  comment: 'Sprint completed'
});

// Generate report
const report = await linear.executeModuleOperation('generateReport', {
  cycleId: 'current-sprint',
  format: 'markdown'
});
```

## Performance Characteristics

- **Batch Size**: 50 items per batch (configurable)
- **Parallel Execution**: Optional for batch operations
- **API Efficiency**: Reduces N+1 queries through batching
- **Memory**: ~10-15MB per module in memory
- **Caching**: Reduces repeated queries, improves responsiveness
- **Rate Limiting**: Automatic backoff with exponential retry

## Error Handling

All Phase 3 modules include robust error handling:
- Graceful degradation with `continueOnError`
- Detailed error reporting in batch results
- Operation tracking for debugging
- Automatic retry with backoff

```typescript
try {
  const result = await linear.executeModuleOperation('batchUpdate', {
    updates,
    continueOnError: true // Continue even if some fail
  });

  console.log(`Success: ${result.successful}/${result.total}`);

  // Check individual failures
  result.results.forEach(r => {
    if (!r.success) {
      console.error(`Failed: ${r.error}`);
    }
  });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

## Advanced Features

### Intelligent Task Ranking
Task suggestions consider:
- Issue priority
- Blocking dependencies
- Estimated effort
- Team velocity trends
- Recent activity
- Assignee availability

### Smart Duplicate Detection
Uses multiple similarity metrics:
- Keyword matching (Jaccard index)
- Description similarity
- Label overlap
- State matching

### Workload Intelligence
Analyzes:
- Issues per team member
- Estimated capacity vs assigned
- Completion velocity
- Bottleneck identification
- Risk factors

## Next Steps (Phase 4)

- External integrations (Git, GitHub, tests)
- Webhook support for real-time updates
- Enhanced security features
- Production deployment

## Configuration

### Environment Variables
```env
LINEAR_API_KEY=your-key
BATCH_SIZE=50
PARALLEL_BATCH_OPS=true
CACHE_ANALYTICS=true
ANALYTICS_CACHE_TTL=3600
```

### Programmatic Configuration
```typescript
const linear = await initializeLinearToolkit({
  modules: {
    batchSize: 100,
    parallelEnabled: true,
    analyticsCaching: true
  }
});
```

---

**Phase 3 Deliverables:**
- ✅ Code Integration Module (4 operations)
- ✅ Intelligence Module (4 operations)
- ✅ Batch Operations Module (8 operations)
- ✅ Analytics Module (4 operations)
- ✅ Advanced Claude skill configuration
- ✅ LinearAgentClient integration
- ✅ Comprehensive documentation

**Status:** Phase 3 complete and ready for Phase 4 (External Integrations)
