/**
 * Linear Toolkit - Repository Registry Example
 *
 * This example shows how to use the organization-wide repository registry:
 * - List all repositories
 * - Search repositories
 * - Get repository details
 * - Get organization statistics
 * - Refresh the cache
 *
 * Prerequisites:
 * - GITHUB_ORG environment variable set
 * - GITHUB_TOKEN environment variable set
 * - DEPLOYMENT_MODE=org-wide in .env
 */

const { RepositoryRegistry } = require('../dist/integrations/repository/RepositoryRegistry');
const { loadConfig } = require('../dist/utils/config');

async function main() {
  try {
    console.log('🚀 Linear Toolkit - Repository Registry Example\n');

    // Load configuration
    const config = loadConfig();

    // Check if org-wide mode is enabled
    if (!config.github || !config.github.org) {
      console.log('⚠️  Organization-wide mode not configured');
      console.log('\nTo enable, set in your .env:');
      console.log('  GITHUB_ORG=your-org-name');
      console.log('  GITHUB_TOKEN=ghp_your_token');
      console.log('  DEPLOYMENT_MODE=org-wide');
      process.exit(1);
    }

    console.log(`📝 Using GitHub Organization: ${config.github.org}\n`);

    // Initialize registry
    console.log('🔌 Initializing Repository Registry...');
    const registry = new RepositoryRegistry(
      config.github.org,
      config.github.token,
      config.github.cacheTTL || 3600000
    );

    // Initialize (discover repos from GitHub)
    console.log('🔍 Discovering repositories from GitHub...');
    console.log('(This may take a moment on first run)\n');
    await registry.initialize();
    console.log('✅ Registry initialized\n');

    // Example 1: List repositories
    console.log('📚 Example 1: List all repositories');
    console.log('----------------------------------');
    const repos = registry.listRepositories({ filter: 'active', limit: 10 });
    console.log(`Found ${repos.length} active repositories:\n`);
    repos.forEach((repo, i) => {
      console.log(`${i + 1}. ${repo.name}`);
      console.log(`   Language: ${repo.language || 'Unknown'}`);
      console.log(`   ⭐ Stars: ${repo.stars} | 🍴 Forks: ${repo.forks}`);
      console.log(`   Last updated: ${repo.lastUpdated.toLocaleDateString()}\n`);
    });

    // Example 2: Search repositories
    console.log('🔍 Example 2: Search for repositories');
    console.log('------------------------------------');
    const searchQuery = 'api';  // Change this to search for different terms
    const searchResults = registry.search(searchQuery, { limit: 5 });
    if (searchResults.length > 0) {
      console.log(`Found ${searchResults.length} repositories matching "${searchQuery}":\n`);
      searchResults.forEach(repo => {
        console.log(`- ${repo.name}`);
        console.log(`  ${repo.description || 'No description'}\n`);
      });
    } else {
      console.log(`No repositories found matching "${searchQuery}"\n`);
    }

    // Example 3: Get repositories by language
    console.log('🔍 Example 3: Find TypeScript repositories');
    console.log('----------------------------------------');
    const tsRepos = registry.getByLanguage('typescript');
    console.log(`Found ${tsRepos.length} TypeScript repositories:\n`);
    tsRepos.forEach(repo => {
      console.log(`- ${repo.name}`);
      console.log(`  URL: ${repo.url}\n`);
    });

    // Example 4: Get organization statistics
    console.log('📊 Example 4: Organization Statistics');
    console.log('-----------------------------------');
    const stats = registry.getStats();
    console.log(`Total repositories: ${stats.totalRepos}`);
    console.log(`Active repositories: ${stats.activeRepos}`);
    console.log(`Archived repositories: ${stats.archivedRepos}`);
    console.log(`Cache age: ${stats.cacheAge}\n`);

    console.log('Languages used in organization:');
    Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([lang, count]) => {
        const bar = '█'.repeat(Math.ceil(count / 2));
        console.log(`  ${lang.padEnd(15)} ${bar} ${count}`);
      });
    console.log('');

    // Example 5: Get specific repository details
    console.log('📌 Example 5: Get specific repository details');
    console.log('------------------------------------------');
    // Use the first repo from the list, or specify one
    const repoName = repos[0]?.name || 'backend';
    const repo = registry.getRepository(repoName);

    if (repo) {
      console.log(`Repository: ${repo.name}`);
      console.log(`URL: ${repo.url}`);
      console.log(`Language: ${repo.language}`);
      console.log(`Private: ${repo.private}`);
      console.log(`Default branch: ${repo.defaultBranch}`);
      console.log(`⭐ Stars: ${repo.stars}`);
      console.log(`🍴 Forks: ${repo.forks}`);
      console.log(`📝 Open issues: ${repo.openIssuesCount}`);
      console.log(`Last updated: ${repo.lastUpdated.toLocaleString()}\n`);
    } else {
      console.log(`Repository "${repoName}" not found\n`);
    }

    // Example 6: List all languages
    console.log('🗣️  Example 6: All languages in organization');
    console.log('-----------------------------------------');
    const languages = registry.getLanguages();
    console.log(`${languages.length} unique languages:`);
    console.log(languages.join(', ') + '\n');

    // Example 7: Refresh registry (optional)
    console.log('🔄 Example 7: Refresh repository cache');
    console.log('------------------------------------');
    console.log('Cache status:');
    const statsBefore = registry.getStats();
    console.log(`  Current cache age: ${statsBefore.cacheAge}`);
    console.log('  To force refresh, uncomment the code below and re-run\n');

    // Uncomment to force refresh:
    // console.log('  Refreshing from GitHub...');
    // await registry.refreshRegistry(true);
    // const statsAfter = registry.getStats();
    // console.log(`  Updated cache age: ${statsAfter.cacheAge}\n`);

    // Example 8: Use registry with operations
    console.log('⚙️  Example 8: Using registry with operations');
    console.log('------------------------------------------');
    console.log('With the registry, you can use repository names instead of URLs:');
    console.log('');
    console.log('Instead of:');
    console.log('  gitModule.linkCommitToIssues({');
    console.log('    repositoryUrl: "https://github.com/org/backend",');
    console.log('    commitHash: "abc123",');
    console.log('    commitMessage: "Fix LIN-123"');
    console.log('  })');
    console.log('');
    console.log('You can now use:');
    console.log('  gitModule.linkCommitToIssues({');
    console.log('    repositoryName: "backend",  // Auto-resolved from registry');
    console.log('    commitHash: "abc123",');
    console.log('    commitMessage: "Fix LIN-123"');
    console.log('  })');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your GitHub credentials in .env');
    console.error('2. Verify the GitHub organization name is correct');
    console.error('3. Ensure your GitHub token has "repo" and "read:org" scopes');
    console.error('4. Check your internet connection');
    process.exit(1);
  }
}

// Run the example
main();
