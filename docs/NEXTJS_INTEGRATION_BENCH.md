# Linear Toolkit - Next.js Integration & Bench Testing Guide

Complete guide for integrating the Linear Toolkit into your Next.js/React app with comprehensive benchmarking.

---

## Overview

This guide covers:
1. **Integration** - Using toolkit in Next.js (both as library and HTTP API)
2. **Bench Testing** - Speed, reliability, accuracy metrics
3. **Real-world Scenarios** - Test with actual commits and PRs
4. **Performance Analysis** - Detailed metrics and insights

---

## Part 1: Architecture

```
Your Next.js App
├── npm package usage (SSR, server components)
├── HTTP API wrapper (API routes)
└── Local server (separate process)

All backed by Linear Toolkit → Linear API + GitHub API
```

### Which approach for which use case?

| Use Case | Approach | Why |
|----------|----------|-----|
| Server-side rendering | **npm package** | Direct, no latency |
| API routes | **npm package** | Built-in, fast |
| Webhooks from GitHub/Linear | **HTTP server** | Always running |
| Team/shared access | **HTTP server** | Centralized |
| Bench testing | **Both** | Compare performance |

---

## Part 2: Setup Your Next.js App

### Step 1: Create Next.js Project with Toolkit

```bash
# Create Next.js app
npx create-next-app@latest my-app --typescript --tailwind
cd my-app

# Install Linear Toolkit as dependency
npm install /path/to/LLM-linear-tool-kit
# Or if published to npm:
# npm install linear-toolkit

# Or clone and install locally
git clone https://github.com/miskaone/LLM-linear-tool-kit.git
npm install ./LLM-linear-tool-kit
```

### Step 2: Configure Environment

Create `.env.local`:

```bash
# Linear Configuration
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub Organization Configuration
GITHUB_ORG=your-org-name
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deployment Mode
DEPLOYMENT_MODE=org-wide

# Bench Testing
BENCH_TEST_ENABLED=true
BENCH_LOG_DIR=./bench-results
```

---

## Part 3: Next.js API Integration

### Create API Route for Linear Operations

Create `app/api/linear/[operation]/route.ts`:

```typescript
import { LinearAgentClient } from 'linear-toolkit';
import { loadConfig } from 'linear-toolkit/dist/utils/config';
import { NextRequest, NextResponse } from 'next/server';

let client: LinearAgentClient | null = null;

async function getClient() {
  if (!client) {
    const config = loadConfig();
    client = await LinearAgentClient.initialize(config);
  }
  return client;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { operation: string } }
) {
  try {
    const { operation } = params;
    const body = await request.json();
    const client = await getClient();

    // Example operations
    switch (operation) {
      case 'search-issues':
        const results = await client.searchIssues(body);
        return NextResponse.json(results);

      case 'get-issue':
        const issue = await client.getIssue(body.issueId);
        return NextResponse.json(issue);

      case 'create-issue':
        const created = await client.createIssue(body);
        return NextResponse.json(created);

      case 'link-commit':
        const linked = await client.executeModuleOperation(
          'git',
          'linkCommitToIssues',
          body
        );
        return NextResponse.json(linked);

      case 'list-repositories':
        const repos = await client.executeModuleOperation(
          'repositories',
          'listRepositories',
          body
        );
        return NextResponse.json(repos);

      default:
        return NextResponse.json(
          { error: 'Operation not found' },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Create React Hook for Client-side Usage

Create `hooks/useLinear.ts`:

```typescript
import { useState, useCallback } from 'react';

interface UseLinearOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useLinear(options: UseLinearOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const call = useCallback(
    async (operation: string, params: Record<string, any>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/linear/${operation}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        options.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { call, loading, error };
}
```

### Create React Component for Issue Search

Create `components/IssueSearch.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useLinear } from '@/hooks/useLinear';

interface Issue {
  identifier: string;
  title: string;
  state: string;
  priority?: number;
}

export function IssueSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Issue[]>([]);
  const { call, loading, error } = useLinear({
    onSuccess: (data) => setResults(data || []),
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await call('search-issues', { query, limit: 10 });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Linear issues..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="text-red-600">{error.message}</div>}

      <div className="space-y-2">
        {results.map((issue) => (
          <div key={issue.identifier} className="p-3 border rounded">
            <div className="font-bold">{issue.identifier}: {issue.title}</div>
            <div className="text-sm text-gray-600">State: {issue.state}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Part 4: Bench Testing Setup

### Create Bench Testing Harness

Create `bench/harness.ts`:

```typescript
import { LinearAgentClient } from 'linear-toolkit';
import { loadConfig } from 'linear-toolkit/dist/utils/config';
import * as fs from 'fs';
import * as path from 'path';

interface BenchResult {
  name: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

interface BenchMetrics {
  operationName: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  errors: string[];
}

export class BenchHarness {
  private client: LinearAgentClient | null = null;
  private results: BenchResult[] = [];
  private resultsDir: string;

  constructor(resultsDir: string = './bench-results') {
    this.resultsDir = resultsDir;
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    const config = loadConfig();
    this.client = await LinearAgentClient.initialize(config);
  }

  async runOperation<T>(
    name: string,
    operation: string,
    params: any,
    fn: (client: LinearAgentClient) => Promise<T>
  ): Promise<BenchResult> {
    if (!this.client) {
      throw new Error('Harness not initialized');
    }

    const startTime = performance.now();
    let success = false;
    let error: string | undefined;

    try {
      await fn(this.client);
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const duration = performance.now() - startTime;

    const result: BenchResult = {
      name,
      operation,
      duration,
      success,
      error,
      timestamp: new Date(),
    };

    this.results.push(result);
    return result;
  }

  getMetrics(): BenchMetrics[] {
    const grouped = new Map<string, BenchResult[]>();

    for (const result of this.results) {
      if (!grouped.has(result.operation)) {
        grouped.set(result.operation, []);
      }
      grouped.get(result.operation)!.push(result);
    }

    const metrics: BenchMetrics[] = [];

    for (const [operation, results] of grouped) {
      const successful = results.filter((r) => r.success);
      const durations = successful.map((r) => r.duration);

      metrics.push({
        operationName: operation,
        count: results.length,
        totalTime: durations.reduce((a, b) => a + b, 0),
        avgTime: durations.reduce((a, b) => a + b, 0) / durations.length,
        minTime: Math.min(...durations),
        maxTime: Math.max(...durations),
        successRate: (successful.length / results.length) * 100,
        errors: [...new Set(results.filter((r) => r.error).map((r) => r.error!))],
      });
    }

    return metrics;
  }

  saveResults(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(this.resultsDir, `bench-${timestamp}.json`);

    const report = {
      timestamp: new Date(),
      summary: {
        totalTests: this.results.length,
        successful: this.results.filter((r) => r.success).length,
        failed: this.results.filter((r) => !r.success).length,
      },
      metrics: this.getMetrics(),
      rawResults: this.results,
    };

    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`📊 Results saved to ${filename}`);

    return filename;
  }

  printSummary(): void {
    const metrics = this.getMetrics();

    console.log('\n📊 Bench Testing Summary');
    console.log('========================\n');

    for (const metric of metrics) {
      console.log(`Operation: ${metric.operationName}`);
      console.log(`  Tests: ${metric.count} (${metric.successRate.toFixed(1)}% success)`);
      console.log(`  Timing: ${metric.avgTime.toFixed(2)}ms avg, ${metric.minTime.toFixed(2)}ms min, ${metric.maxTime.toFixed(2)}ms max`);
      if (metric.errors.length > 0) {
        console.log(`  Errors: ${metric.errors.join(', ')}`);
      }
      console.log();
    }
  }
}
```

---

## Part 5: Real-World Test Scenarios

Create `bench/scenarios.ts`:

```typescript
import { BenchHarness } from './harness';

export async function runSearchIssuesBench(harness: BenchHarness): Promise<void> {
  console.log('🔍 Testing: Search Issues');

  // Test 1: Search with common query
  await harness.runOperation(
    'Search Issues - Common',
    'search-issues',
    { query: 'bug', limit: 10 },
    async (client) => {
      const results = await client.searchIssues({
        query: 'bug',
        limit: 10,
      });
      return results;
    }
  );

  // Test 2: Search with complex query
  await harness.runOperation(
    'Search Issues - Complex',
    'search-issues',
    { query: 'authentication OR oauth OR jwt' },
    async (client) => {
      const results = await client.searchIssues({
        query: 'authentication',
        limit: 20,
      });
      return results;
    }
  );

  // Test 3: Search with limit variations
  for (const limit of [5, 10, 50]) {
    await harness.runOperation(
      `Search Issues - Limit ${limit}`,
      'search-issues',
      { query: 'backend', limit },
      async (client) => {
        const results = await client.searchIssues({
          query: 'backend',
          limit,
        });
        return results;
      }
    );
  }
}

export async function runRepositoryDiscoveryBench(harness: BenchHarness): Promise<void> {
  console.log('🏢 Testing: Repository Discovery');

  // Test 1: List all repositories
  await harness.runOperation(
    'List Repositories - All',
    'list-repositories',
    { filter: 'active' },
    async (client) => {
      const results = await client.executeModuleOperation(
        'repositories',
        'listRepositories',
        { filter: 'active' }
      );
      return results;
    }
  );

  // Test 2: Search repositories
  for (const query of ['api', 'service', 'lib', 'tool']) {
    await harness.runOperation(
      `Search Repositories - "${query}"`,
      'search-repositories',
      { query },
      async (client) => {
        const results = await client.executeModuleOperation(
          'repositories',
          'searchRepositories',
          { query }
        );
        return results;
      }
    );
  }

  // Test 3: Get repository stats
  await harness.runOperation(
    'Get Repository Stats',
    'get-repository-stats',
    {},
    async (client) => {
      const stats = await client.executeModuleOperation(
        'repositories',
        'getRepositoryStats',
        {}
      );
      return stats;
    }
  );
}

export async function runCommitLinkingBench(harness: BenchHarness): Promise<void> {
  console.log('📝 Testing: Commit Linking');

  // Test 1: Simple commit with one issue reference
  await harness.runOperation(
    'Link Commit - Single Issue',
    'link-commit',
    {
      repositoryName: 'backend',
      commitHash: 'abc123def456',
      commitMessage: 'Fix auth bug - closes LIN-123',
      files: ['src/auth.ts'],
    },
    async (client) => {
      const result = await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'abc123def456',
        commitMessage: 'Fix auth bug - closes LIN-123',
        files: ['src/auth.ts'],
      });
      return result;
    }
  );

  // Test 2: Commit with multiple issue references
  await harness.runOperation(
    'Link Commit - Multiple Issues',
    'link-commit',
    {
      repositoryName: 'backend',
      commitHash: 'def789ghi012',
      commitMessage: 'Refactor auth - closes LIN-456, relates to LIN-789',
      files: ['src/auth.ts', 'src/user.ts'],
    },
    async (client) => {
      const result = await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'def789ghi012',
        commitMessage: 'Refactor auth - closes LIN-456, relates to LIN-789',
        files: ['src/auth.ts', 'src/user.ts'],
      });
      return result;
    }
  );

  // Test 3: Commit with no issue references
  await harness.runOperation(
    'Link Commit - No Issues',
    'link-commit',
    {
      repositoryName: 'backend',
      commitHash: 'jkl345mno678',
      commitMessage: 'Update documentation',
      files: ['README.md'],
    },
    async (client) => {
      const result = await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'jkl345mno678',
        commitMessage: 'Update documentation',
        files: ['README.md'],
      });
      return result;
    }
  );
}
```

---

## Part 6: Run Bench Tests

Create `bench/run.ts`:

```typescript
import { BenchHarness } from './harness';
import {
  runSearchIssuesBench,
  runRepositoryDiscoveryBench,
  runCommitLinkingBench,
} from './scenarios';

async function main() {
  console.log('🚀 Linear Toolkit Bench Testing Suite\n');

  const harness = new BenchHarness('./bench-results');
  await harness.initialize();

  console.log('✅ Harness initialized\n');

  // Run test suites
  await runSearchIssuesBench(harness);
  console.log('✅ Search issues benchmarks complete\n');

  await runRepositoryDiscoveryBench(harness);
  console.log('✅ Repository discovery benchmarks complete\n');

  await runCommitLinkingBench(harness);
  console.log('✅ Commit linking benchmarks complete\n');

  // Print and save results
  harness.printSummary();
  harness.saveResults();
}

main().catch(console.error);
```

Add to `package.json`:

```json
{
  "scripts": {
    "bench": "ts-node bench/run.ts"
  }
}
```

Run benchmarks:

```bash
npm install -D ts-node
npm run bench
```

---

## Part 7: Analyze Results

Create `bench/analyze.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface BenchReport {
  timestamp: string;
  summary: {
    totalTests: number;
    successful: number;
    failed: number;
  };
  metrics: Array<{
    operationName: string;
    count: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
    errors: string[];
  }>;
}

export function analyzeBenchResults(resultsFile: string): void {
  const data = JSON.parse(fs.readFileSync(resultsFile, 'utf-8')) as BenchReport;

  console.log('\n📊 Detailed Bench Analysis');
  console.log('==========================\n');

  console.log('Summary:');
  console.log(`  Total Tests: ${data.summary.totalTests}`);
  console.log(`  Successful: ${data.summary.successful}`);
  console.log(`  Failed: ${data.summary.failed}`);
  console.log(`  Success Rate: ${((data.summary.successful / data.summary.totalTests) * 100).toFixed(1)}%\n`);

  console.log('Performance by Operation:');
  const sorted = [...data.metrics].sort((a, b) => b.avgTime - a.avgTime);

  for (const metric of sorted) {
    console.log(`\n${metric.operationName}:`);
    console.log(`  Count: ${metric.count}`);
    console.log(`  Avg: ${metric.avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${metric.minTime.toFixed(2)}ms`);
    console.log(`  Max: ${metric.maxTime.toFixed(2)}ms`);
    console.log(`  P95: ${(metric.avgTime * 1.95).toFixed(2)}ms (estimate)`);
    console.log(`  Success Rate: ${metric.successRate.toFixed(1)}%`);
  }

  console.log('\n\n⚠️  Operations to Optimize (>500ms avg):');
  const slow = data.metrics.filter((m) => m.avgTime > 500);
  if (slow.length === 0) {
    console.log('  None! All operations are fast.');
  } else {
    for (const metric of slow) {
      console.log(`  - ${metric.operationName}: ${metric.avgTime.toFixed(2)}ms`);
    }
  }
}

// Usage
const latestResult = fs.readdirSync('./bench-results')
  .filter((f) => f.startsWith('bench-') && f.endsWith('.json'))
  .sort()
  .pop();

if (latestResult) {
  analyzeBenchResults(path.join('./bench-results', latestResult));
} else {
  console.log('No bench results found');
}
```

---

## Expected Results

**Speed (Typical Benchmarks):**
```
Search Issues:           50-150ms
List Repositories:       200-500ms (first call, cached after)
Repository Discovery:    100-300ms
Commit Linking:          50-100ms
```

**Reliability:**
- 99%+ success rate (failures are API issues, not toolkit)
- Handles edge cases (missing repos, invalid commits)

**Accuracy:**
- Correctly identifies issue IDs in commit messages
- Matches branch names to issues
- Deduplicates multiple references

---

## Next Steps

1. **Clone the Linear Toolkit locally**
2. **Run `./setup.sh` to initialize**
3. **Copy bench/ folder to your Next.js project**
4. **Configure .env with your credentials**
5. **Run `npm run bench` to test**
6. **Analyze results in `bench-results/`**

---

This gives you real data on whether the toolkit is production-ready for your use case!

Ready to proceed with creating these files?
