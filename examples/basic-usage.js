/**
 * Linear Toolkit - Basic Usage Example
 *
 * This example shows how to:
 * - Initialize the Linear Toolkit client
 * - Query issues
 * - Search for issues
 * - Get issue details
 */

const { LinearAgentClient } = require('../dist/core/client/LinearAgentClient');
const { loadConfig } = require('../dist/utils/config');

async function main() {
  try {
    console.log('🚀 Linear Toolkit - Basic Usage Example\n');

    // Load configuration from .env
    console.log('📋 Loading configuration...');
    const config = loadConfig();
    console.log('✅ Configuration loaded\n');

    // Initialize the client
    console.log('🔌 Initializing Linear client...');
    const client = await LinearAgentClient.initialize(config);
    console.log('✅ Client initialized\n');

    // Example 1: Get active work (issues assigned to current user)
    console.log('📝 Example 1: Get your active work');
    console.log('-----------------------------------');
    try {
      const active = await client.getActiveWork();
      console.log(`Found ${active.length} active issues:`);
      active.slice(0, 3).forEach(issue => {
        console.log(`  - ${issue.identifier}: ${issue.title}`);
        console.log(`    Status: ${issue.state}`);
      });
    } catch (error) {
      console.log('⚠️  Could not fetch active work (check team ID)');
    }

    console.log('\n');

    // Example 2: Search for issues
    console.log('🔍 Example 2: Search for issues');
    console.log('--------------------------------');
    try {
      const searchResults = await client.searchIssues({
        query: 'bug',
        limit: 5
      });
      console.log(`Found ${searchResults.length} issues matching "bug":`);
      searchResults.forEach(issue => {
        console.log(`  - ${issue.identifier}: ${issue.title}`);
      });
    } catch (error) {
      console.log('⚠️  Could not search issues:', error.message);
    }

    console.log('\n');

    // Example 3: Get specific issue
    console.log('📌 Example 3: Get specific issue details');
    console.log('---------------------------------------');
    // You'll need to replace 'LIN-1' with an actual issue ID from your workspace
    try {
      const issue = await client.getIssue('LIN-1');
      console.log(`Issue: ${issue.identifier} - ${issue.title}`);
      console.log(`Description: ${issue.description?.substring(0, 100) || 'None'}...`);
      console.log(`State: ${issue.state}`);
      console.log(`Priority: ${issue.priority}`);
      console.log(`Assignee: ${issue.assignee?.name || 'Unassigned'}`);
    } catch (error) {
      console.log('⚠️  Issue not found or error occurred');
      console.log('💡 Tip: Replace "LIN-1" with a valid issue ID from your workspace');
    }

    console.log('\n');

    // Example 4: Create an issue
    console.log('✏️  Example 4: Create a new issue');
    console.log('--------------------------------');
    try {
      // You'll need to replace 'team-xyz' with your actual team ID
      const newIssue = await client.createIssue({
        title: 'Test Issue from Linear Toolkit',
        description: 'This is a test issue created via the Linear Toolkit example script',
        teamId: 'team-1',  // Replace with your team ID
        priority: 3,
        state: 'Backlog'
      });
      console.log(`✅ Created issue: ${newIssue.identifier}`);
      console.log(`   Title: ${newIssue.title}`);
      console.log(`   URL: ${newIssue.url}`);
    } catch (error) {
      console.log('⚠️  Could not create issue');
      console.log('💡 Tip: Make sure to replace "team-1" with your actual team ID');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n');

    // Example 5: List teams (to help you find team IDs)
    console.log('👥 Example 5: List available teams');
    console.log('---------------------------------');
    try {
      const teams = await client.getTeams();
      console.log(`Found ${teams.length} teams:`);
      teams.forEach(team => {
        console.log(`  - ${team.key}: ${team.name} (ID: ${team.id})`);
      });
    } catch (error) {
      console.log('⚠️  Could not fetch teams:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();
