# Linear Toolkit for AI Agents

A programmatic API toolkit for AI agents (Claude Code and similar) to autonomously manage Linear project management workflows. Built specifically for automated issue tracking, context-aware operations, and intelligent project coordination.

## Overview

The Linear Toolkit provides a high-level, agent-optimized interface to the Linear API, designed to enable AI agents to:

- Autonomously manage Linear issues based on code changes
- Understand context and relationships between code and project management
- Perform efficient batch operations for agent workflows
- Maintain session state across multi-step operations
- Integrate seamlessly with development tools and CI/CD pipelines

## Project Status

🚧 **Phase 1: Core Foundation** - In Development

### Completed in Phase 1
- ✅ Project structure and configuration
- ✅ Core types and interfaces (TypeScript)
- ✅ `SessionManager` for context preservation
- ✅ `CacheManager` for efficient caching
- ✅ `GraphQLClient` with retry logic and error handling
- ✅ `LinearAgentClient` core class
- ✅ Configuration management with Zod validation
- ✅ Logger utility
- ✅ Unit tests for core components

### Upcoming in Phase 2-4
- Module system and Claude skill integration
- Batch operations and analytics
- Code-aware operations and intelligent features
- External integrations (Git, GitHub, tests, security)

## Installation

```bash
npm install @linear-toolkit/agent
```

## Quick Start

```typescript
import { initializeLinearToolkit } from '@linear-toolkit/agent';

// Initialize with environment configuration
const linear = await initializeLinearToolkit();

// Get active work assigned to user
const work = await linear.getActiveWork();
console.log(`Found ${work.activeIssues.length} active issues`);

// Find a specific issue
const issue = await linear.findIssueById('issue-id');

// Add a comment with progress update
await linear.addComment({
  issueId: 'issue-id',
  body: '## Progress Update\n- Tests passing\n- Ready for review',
});

// Transition issue to new state
await linear.transitionState('issue-id', 'done-state-id');
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Required
LINEAR_API_KEY=your_linear_api_key_here

# Optional
REQUEST_TIMEOUT=30000
RETRY_ATTEMPTS=3
RETRY_DELAY=1000
CACHE_ENABLED=true
CACHE_TTL=300
LOG_LEVEL=info
```

### Programmatic Configuration

```typescript
import { initializeLinearToolkit } from '@linear-toolkit/agent';

const linear = await initializeLinearToolkit({
  apiKey: 'your-api-key',
  timeout: 30000,
  retryAttempts: 3,
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 1000,
  },
  logging: {
    level: 'info',
    format: 'text',
  },
});
```

## Core Features (Phase 1)

### Session Management
```typescript
const linear = await initializeLinearToolkit();
const session = linear.getSession();

// Store context across operations
session.setContext('currentTeamId', 'team-123');
const teamId = session.getContext('currentTeamId');

// Track operations
const stats = session.getOperationStats();
console.log(`Success rate: ${stats.successRate}%`);
```

### Caching
```typescript
import { getCache } from '@linear-toolkit/agent';

const cache = getCache();

// Automatic caching for queries
const issue = await linear.findIssueById('issue-id'); // Cached on first call

// View cache statistics
const stats = cache.getStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### Logging
```typescript
import { getLogger, configureLogger } from '@linear-toolkit/agent';

// Configure global logger
configureLogger('debug', 'json');

// Get logger instance
const logger = getLogger('MyModule');
logger.info('Starting operation');
```

## Core Operations

### Get Active Work
```typescript
const work = await linear.getActiveWork();
// Returns: assigned issues, current sprint, blocked items, etc.
```

### Find Issues
```typescript
// By ID
const issue = await linear.findIssueById('LIN-123');

// By code context
const relevantIssues = await linear.findRelevantIssues({
  files: ['src/auth.ts'],
  functions: ['validateToken'],
});

// By search query
const results = await linear.searchIssues({
  query: 'authentication',
  limit: 50,
});
```

### Create Issue
```typescript
const issue = await linear.createIssue({
  title: 'Add two-factor authentication',
  description: 'Implement 2FA for user accounts',
  teamId: 'team-id',
  priority: 2,
  estimate: 8,
  dueDate: new Date('2024-12-31'),
});
```

### Update Issue
```typescript
await linear.updateIssueProgress({
  issueId: 'LIN-123',
  progress: {
    filesModified: ['src/auth.ts'],
    testsAdded: true,
    testsPass: true,
    linesAdded: 150,
    linesRemoved: 20,
    readyForReview: true,
  },
  comment: 'Implementation complete',
});
```

### Add Comments
```typescript
await linear.addComment({
  issueId: 'LIN-123',
  body: 'Fixed in commit abc123. Tests passing.',
});
```

### Manage Issue State
```typescript
// Transition to a new state
await linear.transitionState('LIN-123', 'state-id');

// Link issues (dependencies)
await linear.linkIssues('LIN-123', 'LIN-124', 'blocks');
```

### Get Sprint Information
```typescript
const currentSprint = await linear.getCurrentSprint();
console.log(`Sprint: ${currentSprint?.name}`);
```

## Testing

Run tests with:

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## Architecture

```
src/
├── core/
│   ├── client/
│   │   ├── LinearAgentClient.ts     (Main API)
│   │   ├── SessionManager.ts        (State management)
│   │   └── GraphQLClient.ts         (API communication)
│   └── types/
├── types/
│   └── linear.types.ts              (Core types)
├── utils/
│   ├── config.ts                    (Configuration)
│   ├── cache.ts                     (Caching)
│   └── logger.ts                    (Logging)
└── index.ts                         (Public API)
```

## Monitoring & Debugging

```typescript
// Get client statistics
const stats = linear.getStats();
console.log(stats);
// {
//   session: { sessionId, contextSize, ... },
//   operations: { total, successful, failed, successRate, avgDuration },
//   cache: { size, hits, misses, hitRate, ... }
// }

// View cache hot entries
const cache = getCache();
const hot = cache.getHotEntries(10);
console.log('Most accessed entries:', hot);

// Get recent operations
const operations = linear.getSession().getRecentOperations(10);
console.log('Recent operations:', operations);
```

## Error Handling

```typescript
import { LinearError, RateLimitError, ValidationError } from '@linear-toolkit/agent';

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

## Next Steps

- **Phase 2**: Module system, Claude skill integration, batch operations
- **Phase 3**: Code-aware operations, intelligent features, analytics
- **Phase 4**: External integrations (Git, GitHub, tests, security)

## Contributing

See `docs/prd.md` for detailed product requirements and architecture specifications.

## License

MIT

## Documentation

- [Product Requirements](docs/prd.md)
- [API Reference](docs/API.md) (coming in Phase 2)
- [Integration Guides](docs/INTEGRATION.md) (coming in Phase 4)

---

**Version**: 1.0.0 (Phase 1)
**Status**: Development
**Last Updated**: November 8, 2025
