/**
 * Linear Toolkit - Git Operations Example
 *
 * This example shows how to:
 * - Link commits to Linear issues
 * - Track branches for issues
 * - Get repository information
 * - Set up webhook handlers
 *
 * Prerequisites:
 * - For org-wide mode: GITHUB_ORG and GITHUB_TOKEN in .env
 * - For per-repo mode: Explicit repository URL
 */

const { LinearAgentClient } = require('../dist/core/client/LinearAgentClient');
const { loadConfig } = require('../dist/utils/config');

async function main() {
  try {
    console.log('🚀 Linear Toolkit - Git Operations Example\n');

    // Load configuration
    const config = loadConfig();

    // Initialize the client
    console.log('🔌 Initializing Linear client...');
    const client = await LinearAgentClient.initialize(config);
    console.log('✅ Client initialized\n');

    // Determine mode
    const isOrgWide = config.deploymentMode === 'org-wide' && config.github;
    console.log(`📋 Deployment mode: ${isOrgWide ? 'Organization-wide' : 'Per-repo'}\n`);

    // Example 1: Link a commit to issues
    console.log('📝 Example 1: Link commit to Linear issues');
    console.log('---------------------------------------');
    try {
      if (isOrgWide) {
        // Org-wide mode: use repository name
        const result = await client.executeModuleOperation('git', 'linkCommitToIssues', {
          repositoryName: 'backend',  // Use repo name from registry
          commitHash: 'abc123def456',
          commitMessage: 'Fix authentication flow - closes LIN-123, relates to LIN-124',
          files: ['src/auth.ts', 'src/user.ts']
        });
        console.log(`✅ Linked commit to ${result.linked} issues: ${result.issues.join(', ')}\n`);
      } else {
        // Per-repo mode: use explicit URL
        const result = await client.executeModuleOperation('git', 'linkCommitToIssues', {
          repositoryUrl: 'https://github.com/your-org/backend',
          commitHash: 'abc123def456',
          commitMessage: 'Fix authentication flow - closes LIN-123, relates to LIN-124',
          files: ['src/auth.ts', 'src/user.ts']
        });
        console.log(`✅ Linked commit to ${result.linked} issues: ${result.issues.join(', ')}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not link commit:', error.message);
      console.log('💡 Make sure the commit message contains issue IDs like "LIN-123"\n');
    }

    // Example 2: Track a branch for issues
    console.log('📝 Example 2: Track branch for Linear issues');
    console.log('----------------------------------------');
    try {
      if (isOrgWide) {
        const result = await client.executeModuleOperation('git', 'trackBranchForIssues', {
          repositoryName: 'backend',
          branchName: 'feature/LIN-456-auth-improvements'
        });
        console.log(`✅ Branch tracked for issue: ${result.issueId}\n`);
      } else {
        const result = await client.executeModuleOperation('git', 'trackBranchForIssues', {
          repositoryUrl: 'https://github.com/your-org/backend',
          branchName: 'feature/LIN-456-auth-improvements'
        });
        console.log(`✅ Branch tracked for issue: ${result.issueId}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not track branch:', error.message);
      console.log('💡 Branch name should contain an issue ID like "LIN-456"\n');
    }

    // Example 3: Get repository information
    console.log('📝 Example 3: Get repository information');
    console.log('------------------------------------');
    try {
      if (isOrgWide) {
        const result = await client.executeModuleOperation('git', 'getRepositoryInfo', {
          repositoryName: 'backend'
        });
        console.log(`Repository: ${result.name}`);
        console.log(`URL: ${result.url}`);
        console.log(`Default branch: ${result.defaultBranch}`);
        console.log(`Private: ${result.isPrivate}\n`);
      } else {
        const result = await client.executeModuleOperation('git', 'getRepositoryInfo', {
          repositoryUrl: 'https://github.com/your-org/backend'
        });
        console.log(`Repository: ${result.name}`);
        console.log(`URL: ${result.url}`);
        console.log(`Default branch: ${result.defaultBranch}`);
        console.log(`Private: ${result.isPrivate}\n`);
      }
    } catch (error) {
      console.log('⚠️  Could not get repository info:', error.message + '\n');
    }

    // Example 4: GitHub operations (if org-wide mode)
    if (isOrgWide) {
      console.log('📝 Example 4: GitHub operations (org-wide mode)');
      console.log('----------------------------------------');
      try {
        const result = await client.executeModuleOperation('github', 'linkPullRequestToIssue', {
          prUrl: 'https://github.com/your-org/backend/pull/123',
          repositoryName: 'backend',
          issueId: 'LIN-789',
          autoTransition: true
        });
        console.log(`✅ Linked PR #123 to issue LIN-789`);
        console.log(`Auto-transition: ${result.transitioned ? 'enabled' : 'disabled'}\n`);
      } catch (error) {
        console.log('⚠️  Could not link PR:', error.message);
        console.log('💡 Make sure the repository and issue IDs are correct\n');
      }
    }

    // Example 5: Show webhook setup instructions
    console.log('📝 Example 5: Webhook setup for automation');
    console.log('-----------------------------------------');
    console.log('To automatically link commits and PRs:');
    console.log('');
    console.log('1. Set up GitHub webhook:');
    console.log('   - Go to: https://github.com/your-org/backend/settings/hooks');
    console.log('   - Click "Add webhook"');
    console.log('   - Payload URL: https://your-domain/webhooks/github');
    console.log('   - Events: Push, Pull Request');
    console.log('');
    console.log('2. Set up Git hooks locally:');
    console.log('   - Copy hook scripts to .git/hooks/');
    console.log('   - Make executable: chmod +x .git/hooks/post-commit');
    console.log('');
    console.log('3. Read more:');
    console.log('   - docs/INTEGRATION_GUIDES.md');
    console.log('');

    // Example 6: Issue pattern matching
    console.log('📝 Example 6: Issue ID patterns');
    console.log('----------------------------');
    console.log('Commit messages can reference issues in these formats:');
    console.log('');
    console.log('✅ Supported patterns:');
    console.log('  - LIN-123 (Linear issue)');
    console.log('  - closes LIN-123');
    console.log('  - fixes LIN-123');
    console.log('  - relates to LIN-123');
    console.log('  - Multiple: LIN-123, LIN-124, LIN-125');
    console.log('');
    console.log('Examples:');
    console.log('  "Fix auth bug - closes LIN-456"');
    console.log('  "Refactor code - relates to LIN-789, LIN-790"');
    console.log('');

    // Example 7: Branch naming conventions
    console.log('📝 Example 7: Branch naming conventions');
    console.log('-------------------------------------');
    console.log('For automatic issue detection, use these branch name patterns:');
    console.log('');
    console.log('Recommended:');
    console.log('  feature/LIN-123-auth-improvements');
    console.log('  bugfix/LIN-456-fix-login');
    console.log('  hotfix/LIN-789-critical-bug');
    console.log('');
    console.log('The system extracts the issue ID automatically!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();
