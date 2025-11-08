/**
 * Linear Toolkit Bench Testing Runner
 * Orchestrates all bench tests and collects metrics
 */

import { LinearAgentClient } from '../src/core/client/LinearAgentClient';
import { RepositoryRegistry } from '../src/integrations/repository/RepositoryRegistry';
import { loadConfig } from '../src/utils/config';
import { BenchHarness } from './harness';
import { runAllScenarios } from './scenarios';

async function main() {
  console.clear();
  console.log('════════════════════════════════════════════');
  console.log('🚀 LINEAR TOOLKIT - BENCH TESTING SUITE');
  console.log('════════════════════════════════════════════\n');

  try {
    // Step 1: Load configuration
    console.log('📋 Loading configuration...');
    const config = loadConfig();
    console.log(`✅ Configuration loaded`);
    console.log(`   Deployment Mode: ${config.deploymentMode || 'per-repo'}`);
    if (config.github) {
      console.log(`   GitHub Org: ${config.github.org}`);
    }
    console.log('');

    // Step 2: Initialize Linear client
    console.log('🔌 Initializing Linear client...');
    const client = await LinearAgentClient.initialize(config);
    console.log('✅ Linear client initialized\n');

    // Step 3: Initialize Repository Registry (if org-wide mode)
    let registry: RepositoryRegistry | null = null;
    if (config.github && config.github.org) {
      console.log('🔍 Initializing Repository Registry...');
      registry = new RepositoryRegistry(
        config.github.org,
        config.github.token,
        config.github.cacheTTL
      );
      await registry.initialize();
      const stats = registry.getStats();
      console.log(`✅ Registry initialized`);
      console.log(`   Total Repositories: ${stats.totalRepos}`);
      console.log(`   Active Repositories: ${stats.activeRepos}`);
      console.log('');
    } else {
      console.log('⚠️  GitHub org not configured - skipping repository discovery tests\n');
    }

    // Step 4: Initialize bench harness
    console.log('📊 Setting up benchmarking harness...');
    const harness = new BenchHarness('./bench-results');
    console.log('✅ Harness ready\n');

    // Step 5: Run scenarios
    console.log('Starting scenarios in 2 seconds...\n');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await runAllScenarios(client, registry, harness);

    // Step 6: Comparison (if previous results exist)
    console.log('\n');
    try {
      harness.compareWithPrevious();
    } catch (error) {
      // Previous results don't exist, skip comparison
    }

    console.log('\n✅ Bench testing complete!');
  } catch (error) {
    console.error('\n❌ Error during bench testing:', error);
    process.exit(1);
  }
}

// Run
main();
