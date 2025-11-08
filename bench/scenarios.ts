/**
 * Bench Test Scenarios for Linear Toolkit
 * Real-world test cases for GitHub integration
 */

import { LinearAgentClient } from '../src/core/client/LinearAgentClient';
import { RepositoryRegistry } from '../src/integrations/repository/RepositoryRegistry';
import { BenchHarness } from './harness';

/**
 * Scenario 1: Search Issues (Speed test)
 * Tests: Query performance with different complexity levels
 */
export async function scenarioSearchIssues(
  harness: BenchHarness,
  client: LinearAgentClient
): Promise<void> {
  console.log('\n🔍 Scenario 1: Search Issues');
  console.log('────────────────────────────────────────\n');

  // Test 1.1: Simple search
  await harness.runOperation(
    'Search Issues - Single Word',
    'search-issues',
    { query: 'bug', limit: 10 },
    async () => {
      return await client.searchIssues({
        query: 'bug',
        limit: 10,
      });
    }
  );

  // Test 1.2: Search with different limits
  for (const limit of [5, 10, 20, 50]) {
    const { duration } = await harness.runOperation(
      `Search Issues - Limit ${limit}`,
      'search-issues',
      { query: 'backend', limit },
      async () => {
        return await client.searchIssues({
          query: 'backend',
          limit,
        });
      }
    );
    console.log(`  Limit ${limit}: ${duration.toFixed(2)}ms`);
  }

  // Test 1.3: Search with various keywords
  const keywords = ['authentication', 'database', 'api', 'ui', 'performance'];
  for (const keyword of keywords) {
    const { duration } = await harness.runOperation(
      `Search Issues - "${keyword}"`,
      'search-issues',
      { query: keyword, limit: 10 },
      async () => {
        return await client.searchIssues({
          query: keyword,
          limit: 10,
        });
      }
    );
    console.log(`  Keyword "${keyword}": ${duration.toFixed(2)}ms`);
  }
}

/**
 * Scenario 2: Repository Discovery (Speed + Accuracy test)
 * Tests: Registry initialization and queries
 */
export async function scenarioRepositoryDiscovery(
  harness: BenchHarness,
  registry: RepositoryRegistry
): Promise<void> {
  console.log('\n🏢 Scenario 2: Repository Discovery');
  console.log('────────────────────────────────────────\n');

  // Test 2.1: List all repositories
  const { duration: listDuration } = await harness.runOperation(
    'List Repositories - All Active',
    'list-repositories',
    { filter: 'active' },
    async () => {
      return registry.listRepositories({ filter: 'active' });
    }
  );
  console.log(`  List all active repos: ${listDuration.toFixed(2)}ms`);

  // Test 2.2: Search repositories
  const searches = ['api', 'service', 'lib', 'tool', 'auth'];
  for (const query of searches) {
    const { duration: searchDuration } = await harness.runOperation(
      `Search Repositories - "${query}"`,
      'search-repositories',
      { query },
      async () => {
        return registry.search(query, { limit: 10 });
      }
    );
    console.log(`  Search for "${query}": ${searchDuration.toFixed(2)}ms`);
  }

  // Test 2.3: Filter by language
  const languages = ['typescript', 'python', 'go', 'rust'];
  for (const language of languages) {
    const { duration: langDuration } = await harness.runOperation(
      `Repositories by Language - ${language}`,
      'repositories-by-language',
      { language },
      async () => {
        return registry.getByLanguage(language);
      }
    );
    console.log(`  Filter by "${language}": ${langDuration.toFixed(2)}ms`);
  }

  // Test 2.4: Get statistics
  const { duration: statsDuration } = await harness.runOperation(
    'Get Repository Stats',
    'repository-stats',
    {},
    async () => {
      return registry.getStats();
    }
  );
  console.log(`  Get statistics: ${statsDuration.toFixed(2)}ms`);
}

/**
 * Scenario 3: Commit Linking (Accuracy + Reliability test)
 * Tests: Issue ID detection and linking
 */
export async function scenarioCommitLinking(
  harness: BenchHarness,
  client: LinearAgentClient
): Promise<void> {
  console.log('\n📝 Scenario 3: Commit Linking');
  console.log('────────────────────────────────────────\n');

  // Test 3.1: Simple commit message
  await harness.runOperation(
    'Link Commit - Single Issue Reference',
    'link-commit-single',
    {
      repositoryName: 'backend',
      commitHash: 'abc123def456',
      commitMessage: 'Fix authentication flow - closes LIN-123',
    },
    async () => {
      return await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'abc123def456',
        commitMessage: 'Fix authentication flow - closes LIN-123',
        files: ['src/auth.ts'],
      });
    }
  );

  // Test 3.2: Multiple issue references
  await harness.runOperation(
    'Link Commit - Multiple Issue References',
    'link-commit-multiple',
    {
      repositoryName: 'backend',
      commitHash: 'def789ghi012',
      commitMessage: 'Refactor auth - closes LIN-456, relates to LIN-789, LIN-790',
    },
    async () => {
      return await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'def789ghi012',
        commitMessage: 'Refactor auth - closes LIN-456, relates to LIN-789, LIN-790',
        files: ['src/auth.ts', 'src/user.ts'],
      });
    }
  );

  // Test 3.3: Commit with no issue references
  await harness.runOperation(
    'Link Commit - No Issue References',
    'link-commit-none',
    {
      repositoryName: 'backend',
      commitHash: 'jkl345mno678',
      commitMessage: 'Update documentation and comments',
    },
    async () => {
      return await client.executeModuleOperation('git', 'linkCommitToIssues', {
        repositoryName: 'backend',
        commitHash: 'jkl345mno678',
        commitMessage: 'Update documentation and comments',
        files: ['README.md', 'CONTRIBUTING.md'],
      });
    }
  );

  // Test 3.4: Edge cases
  const edgeCases = [
    {
      name: 'Lowercase issue ID',
      message: 'Fix bug - closes lin-999',
    },
    {
      name: 'Issue at start',
      message: 'LIN-888: Major refactoring work',
    },
    {
      name: 'Multiple formats',
      message: 'Work on LIN-777, fixes #456, closes LIN-666',
    },
  ];

  for (const testCase of edgeCases) {
    await harness.runOperation(
      `Link Commit - ${testCase.name}`,
      'link-commit-edge-case',
      {
        repositoryName: 'backend',
        commitHash: `test${Math.random().toString(36).slice(2)}`,
        commitMessage: testCase.message,
      },
      async () => {
        return await client.executeModuleOperation('git', 'linkCommitToIssues', {
          repositoryName: 'backend',
          commitHash: `test${Math.random().toString(36).slice(2)}`,
          commitMessage: testCase.message,
          files: ['src/index.ts'],
        });
      }
    );
  }
}

/**
 * Scenario 4: Cache Performance
 * Tests: First call vs cached calls
 */
export async function scenarioCachePerformance(
  harness: BenchHarness,
  client: LinearAgentClient
): Promise<void> {
  console.log('\n⚡ Scenario 4: Cache Performance');
  console.log('────────────────────────────────────────\n');

  const query = 'authentication';

  // First call (cache miss)
  const { duration: firstDuration } = await harness.runOperation(
    'Search Issues - Cache Miss (First Call)',
    'search-cache-miss',
    { query },
    async () => {
      return await client.searchIssues({
        query,
        limit: 10,
      });
    }
  );

  // Repeated calls (cache hit)
  for (let i = 0; i < 3; i++) {
    const { duration: cachedDuration } = await harness.runOperation(
      `Search Issues - Cache Hit (Call ${i + 2})`,
      'search-cache-hit',
      { query },
      async () => {
        return await client.searchIssues({
          query,
          limit: 10,
        });
      }
    );
    console.log(
      `  Cache hit ${i + 1}: ${cachedDuration.toFixed(2)}ms (${(
        ((firstDuration - cachedDuration) / firstDuration) *
        100
      ).toFixed(1)}% faster)`
    );
  }
}

/**
 * Scenario 5: Stress Test
 * Tests: High volume of requests
 */
export async function scenarioStressTest(
  harness: BenchHarness,
  client: LinearAgentClient,
  iterations: number = 10
): Promise<void> {
  console.log('\n🔥 Scenario 5: Stress Test');
  console.log(`────────────────────────────────────────\n`);

  console.log(`Running ${iterations} concurrent searches...`);

  const promises = [];
  for (let i = 0; i < iterations; i++) {
    promises.push(
      harness.runOperation(
        `Stress Test Search ${i + 1}`,
        'stress-test-search',
        { query: 'bug', limit: 5 },
        async () => {
          return await client.searchIssues({
            query: 'bug',
            limit: 5,
          });
        }
      )
    );
  }

  const results = await Promise.all(promises);
  const durations = results.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  console.log(`  Completed ${iterations} requests`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Range: ${minDuration.toFixed(2)}ms - ${maxDuration.toFixed(2)}ms`);
}

/**
 * Run all scenarios
 */
export async function runAllScenarios(
  client: LinearAgentClient,
  registry: RepositoryRegistry | null,
  harness: BenchHarness
): Promise<void> {
  console.log('════════════════════════════════════════════');
  console.log('🚀 BENCH TESTING - ALL SCENARIOS');
  console.log('════════════════════════════════════════════');

  try {
    await scenarioSearchIssues(harness, client);
    console.log('✅ Scenario 1 complete\n');

    if (registry) {
      await scenarioRepositoryDiscovery(harness, registry);
      console.log('✅ Scenario 2 complete\n');
    }

    await scenarioCommitLinking(harness, client);
    console.log('✅ Scenario 3 complete\n');

    await scenarioCachePerformance(harness, client);
    console.log('✅ Scenario 4 complete\n');

    await scenarioStressTest(harness, client, 10);
    console.log('✅ Scenario 5 complete\n');

    harness.printSummary();
    harness.saveResults();
    harness.exportAsCSV();
  } catch (error) {
    console.error('❌ Scenario failed:', error);
    throw error;
  }
}
