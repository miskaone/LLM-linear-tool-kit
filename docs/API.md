# Linear Toolkit API Reference

Complete API reference for all Linear Toolkit operations across all phases.

## Table of Contents

1. [Initialization](#initialization)
2. [Phase 1: Core Operations](#phase-1-core-operations)
3. [Phase 2: Module System](#phase-2-module-system)
4. [Phase 3: Intelligent Features](#phase-3-intelligent-features)
5. [Phase 4: Integrations](#phase-4-integrations)
6. [Error Handling](#error-handling)
7. [Type Definitions](#type-definitions)

## Initialization

### `initializeLinearToolkit(config?)`

Initialize the Linear Toolkit with optional configuration.

```typescript
const linear = await initializeLinearToolkit({
  apiKey: process.env.LINEAR_API_KEY,
  cache: { enabled: true, ttl: 300 },
  logging: { level: 'info' }
});
```

**Parameters:**
- `config` (optional): Partial toolkit configuration

**Returns:** Promise<LinearAgentClient>

**Throws:** Error if configuration invalid or LINEAR_API_KEY missing

## Phase 1: Core Operations

### Core API Methods

#### `getActiveWork(): Promise<WorkContext>`

Get active work assigned to current user context.

```typescript
const work = await linear.getActiveWork();
// Returns: { activeIssues, currentSprint, blockedIssues, teamMembers, ... }
```

#### `findIssueById(issueId: string): Promise<Issue | undefined>`

Find a specific issue by ID.

```typescript
const issue = await linear.findIssueById('LIN-123');
```

#### `findRelevantIssues(context: CodeContext): Promise<Issue[]>`

Find issues related to code context (files, functions).

```typescript
const issues = await linear.findRelevantIssues({
  files: ['src/auth.ts', 'src/user.ts'],
  functions: ['validateToken']
});
```

#### `searchIssues(query: SearchQuery): Promise<SearchResult>`

Search issues using query and filters.

```typescript
const results = await linear.searchIssues({
  query: 'authentication',
  filters: {
    status: ['backlog', 'todo'],
    priority: [1, 2],
    labelIds: ['label-bug']
  },
  limit: 50
});
```

#### `createIssue(input: CreateIssueInput): Promise<Issue>`

Create a new issue.

```typescript
const issue = await linear.createIssue({
  title: 'Add authentication',
  description: 'Implement OAuth2 flow',
  teamId: 'team-123',
  priority: 2,
  estimate: 8,
  dueDate: new Date('2024-12-31')
});
```

#### `updateIssueProgress(input: UpdateProgressInput): Promise<Issue>`

Update issue with progress information.

```typescript
await linear.updateIssueProgress({
  issueId: 'LIN-123',
  progress: {
    filesModified: ['src/auth.ts'],
    testsAdded: true,
    testsPass: true,
    linesAdded: 150,
    readyForReview: true
  },
  comment: 'Implementation complete'
});
```

#### `addComment(input: AddCommentInput): Promise<Comment>`

Add comment to an issue.

```typescript
await linear.addComment({
  issueId: 'LIN-123',
  body: 'Great progress! Tests are passing.'
});
```

#### `transitionState(issueId: string, stateId: string): Promise<Issue>`

Transition issue to new state.

```typescript
await linear.transitionState('LIN-123', 'state-in-review');
```

#### `getCurrentSprint(teamId?: string): Promise<Cycle | undefined>`

Get current active sprint/cycle.

```typescript
const sprint = await linear.getCurrentSprint('team-123');
```

#### `linkIssues(fromId: string, toId: string, type: 'blocks' | 'relates_to'): Promise<IssueRelation>`

Create issue dependency.

```typescript
await linear.linkIssues('LIN-123', 'LIN-124', 'blocks');
```

## Phase 2: Module System

### Module Management

#### `loadModule(moduleName: string): Promise<Module>`

Load a feature module on-demand.

```typescript
await linear.loadModule('comments');
```

#### `loadModules(moduleNames: string[]): Promise<Map<string, Module>>`

Load multiple modules.

```typescript
await linear.loadModules(['comments', 'labels', 'cycles']);
```

#### `isModuleLoaded(moduleName: string): boolean`

Check if module is loaded.

```typescript
if (linear.isModuleLoaded('comments')) {
  // Use comment operations
}
```

#### `executeModuleOperation(operationName: string, params: Record<string, unknown>): Promise<unknown>`

Execute an operation in a loaded module.

```typescript
const result = await linear.executeModuleOperation('addComment', {
  issueId: 'LIN-123',
  body: 'Comment text'
});
```

### Phase 2 Operations

**Issues Module** (32 operations)
- getIssueById, searchIssues, createIssue, updateIssue, deleteIssue
- listTeamIssues, listCycleIssues, getIssuesByLabel, getIssueRelations, bulkUpdateIssues

**Comments Module** (4 operations)
- addComment, updateComment, deleteComment, getIssueComments

**Labels Module** (7 operations)
- getLabel, listTeamLabels, createLabel, updateLabel, deleteLabel
- addLabelToIssue, removeLabelFromIssue

**Cycles Module** (9 operations)
- getCurrentCycle, getCycleById, listTeamCycles, createCycle, updateCycle
- getCycleIssues, addIssueToCycle, removeIssueFromCycle, closeCycle

## Phase 3: Intelligent Features

### Code Integration Module

```typescript
await linear.loadModule('code');

// Map files to issues
const issues = await linear.executeModuleOperation('mapFileToIssues', {
  files: ['src/auth.ts'],
  includeChildren: true
});

// Create issues from code analysis
const newIssues = await linear.executeModuleOperation('createFromCodeAnalysis', {
  analysis: { security: [...], bugs: [...] },
  teamId: 'team-123'
});

// Link commit to issues
await linear.executeModuleOperation('updateFromCommit', {
  commitMessage: 'Fix auth - closes LIN-123',
  changedFiles: ['src/auth.ts']
});
```

### Intelligence Module

```typescript
await linear.loadModule('intelligence');

// Get task suggestions
const suggestions = await linear.executeModuleOperation('suggestNextTask', {
  limit: 5,
  considerDependencies: true
});

// Suggest labels
const labels = await linear.executeModuleOperation('suggestLabels', {
  issueId: 'LIN-123',
  confidenceThreshold: 0.6
});

// Detect duplicates
const dups = await linear.executeModuleOperation('detectDuplicates', {
  issueId: 'LIN-123',
  threshold: 0.7
});

// Analyze workload
const workload = await linear.executeModuleOperation('analyzeWorkload', {
  teamId: 'team-123'
});
```

### Batch Operations Module

```typescript
await linear.loadModule('batch');

// Batch update
const result = await linear.executeModuleOperation('batchUpdate', {
  updates: [
    { issueId: 'LIN-1', update: { priority: 1 } },
    { issueId: 'LIN-2', update: { priority: 2 } }
  ],
  parallel: true
});

// Batch transition
await linear.executeModuleOperation('batchTransition', {
  transitions: [
    { issueId: 'LIN-1', stateId: 'state-done' },
    { issueId: 'LIN-2', stateId: 'state-done' }
  ],
  comment: 'Sprint completed'
});

// Bulk create
await linear.executeModuleOperation('bulkCreate', {
  issues: [
    { title: 'Task 1', teamId: 'team-1' },
    { title: 'Task 2', teamId: 'team-1' }
  ]
});
```

### Analytics Module

```typescript
await linear.loadModule('analytics');

// Get team metrics
const metrics = await linear.executeModuleOperation('getTeamMetrics', {
  teamId: 'team-123'
});

// Get sprint metrics
const cycleMetrics = await linear.executeModuleOperation('getCycleMetrics', {
  cycleId: 'cycle-456',
  includeBurndown: true
});

// Get workspace metrics
const workspace = await linear.executeModuleOperation('getWorkspaceMetrics', {
  timeframe: 'month'
});

// Generate report
const report = await linear.executeModuleOperation('generateReport', {
  teamId: 'team-123',
  format: 'markdown'
});
```

## Phase 4: Integrations

### Git Integration

```typescript
await linear.loadModule('git');

// Link commit
await linear.executeModuleOperation('linkCommitToIssues', {
  commitHash: 'abc123',
  repositoryUrl: 'https://github.com/org/repo',
  commitMessage: 'Fix auth - closes LIN-123',
  files: ['src/auth.ts']
});

// Track branch
await linear.executeModuleOperation('trackBranchForIssues', {
  branchName: 'feature/LIN-123-auth',
  repositoryUrl: 'https://github.com/org/repo'
});
```

### GitHub Integration

```typescript
await linear.loadModule('github');

// Link PR to issue
await linear.executeModuleOperation('linkPullRequestToIssue', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456',
  autoTransition: true
});

// Sync PR status
await linear.executeModuleOperation('syncPullRequestStatus', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456'
});
```

### Test Runner Integration

```typescript
await linear.loadModule('testing');

// Report test results
await linear.executeModuleOperation('reportTestResults', {
  testSuite: {
    name: 'unit-tests',
    total: 100,
    passed: 95,
    failed: 5,
    results: [...]
  },
  commitHash: 'abc123'
});
```

### Security Scanner Integration

```typescript
await linear.loadModule('security');

// Report security scan
await linear.executeModuleOperation('reportSecurityScan', {
  report: {
    scanner: 'snyk',
    vulnerabilities: [...],
    totalIssues: 5,
    criticalCount: 1
  },
  teamId: 'team-123',
  autoCreate: true
});
```

## Error Handling

### Error Types

```typescript
import { LinearError, RateLimitError, ValidationError, AuthenticationError } from '@linear-toolkit/agent';

try {
  await linear.createIssue(input);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof LinearError) {
    console.log(`Error [${error.code}]: ${error.message}`);
  }
}
```

### Batch Error Handling

```typescript
const result = await linear.executeModuleOperation('batchUpdate', {
  updates: [...],
  continueOnError: true
});

console.log(`Success: ${result.successful}/${result.total}`);

result.results.forEach(r => {
  if (!r.success) {
    console.error(`Failed: ${r.error}`);
  }
});
```

## Type Definitions

### Core Types

```typescript
interface WorkContext {
  activeIssues: Issue[];
  currentSprint?: Cycle;
  blockedIssues: Issue[];
  upcomingDeadlines: Issue[];
  teamMembers: User[];
  userTeams: Team[];
  assignedToCurrentUser: Issue[];
}

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  state: WorkflowState;
  priority: number;
  assignee?: User;
  team?: Team;
  cycle?: Cycle;
  labels?: Label[];
  estimate?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Progress {
  filesModified: string[];
  testsAdded: boolean;
  testsPass: boolean;
  linesAdded: number;
  linesRemoved: number;
  readyForReview: boolean;
}

interface CodeAnalysis {
  todos: TodoItem[];
  bugs: PotentialBug[];
  security: SecurityIssue[];
  refactoring: RefactoringSuggestion[];
}
```

---

**Complete API Reference**
Version: 1.0.0 (Phases 1-4)
Last Updated: November 8, 2025
