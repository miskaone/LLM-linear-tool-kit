# GitHub Organization Integration - Quick Start Guide

This guide walks you through setting up the Linear Toolkit with **organization-wide mode**, enabling automatic repository discovery and agent-powered repository management.

---

## What You'll Get

After following this guide, you'll have:
- ✅ Single Linear Toolkit instance managing your entire GitHub organization
- ✅ Automatic repository discovery from GitHub
- ✅ Repository registry with caching and smart querying
- ✅ Claude agents that can discover and work with any repository
- ✅ Seamless Git/GitHub issue linking across all repos
- ✅ Task completion hooks that auto-update Linear issues

---

## Prerequisites

- [ ] Linear account with API access
- [ ] GitHub organization with write access
- [ ] Node.js 18+ installed
- [ ] GitHub Personal Access Token (we'll create this)
- [ ] Linear Toolkit repository cloned locally
- [ ] Claude Code environment (for skill integration)

---

## Step-by-Step Setup

### Step 1: Create GitHub Personal Access Token (5 minutes)

**Option A: Using GitHub Web UI**

1. Go to https://github.com/settings/tokens/new
2. Give token a descriptive name: `Linear Toolkit`
3. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `read:org` (read organization data)
   - ✅ `workflow` (optional, for CI/CD integration)

4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again!)
6. Store securely: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Option B: Using GitHub CLI**

```bash
# If you have GitHub CLI installed
gh auth create-pat --scopes repo,read:org --title "Linear Toolkit"

# Or get your existing token
gh auth token
```

### Step 2: Configure Environment (5 minutes)

Create `.env` file in your toolkit root:

```bash
# Linear API Configuration
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub Organization Configuration (NEW!)
GITHUB_ORG=my-org-name
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deployment Mode
DEPLOYMENT_MODE=org-wide

# Optional: Cache settings (defaults shown)
REPO_CACHE_TTL=3600000        # 1 hour cache
LOG_LEVEL=info
```

**Important:** Never commit `.env` to git!

### Step 3: Install & Initialize (3 minutes)

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the toolkit (optional test)
npm start

# Check logs for initialization message:
# "Registry initialized with X repositories"
```

### Step 4: Verify Registry (2 minutes)

Test that repository discovery is working:

```bash
# Via Node REPL
node -e "
const { loadConfig } = require('./src/utils/config');
const { RepositoryRegistry } = require('./src/integrations/repository/RepositoryRegistry');

const config = loadConfig();
const registry = new RepositoryRegistry(
  config.github.org,
  config.github.token,
  config.github.cacheTTL
);

(async () => {
  await registry.initialize();
  const stats = registry.getStats();
  console.log('✅ Registry initialized!');
  console.log('Total repos:', stats.totalRepos);
  console.log('Active repos:', stats.activeRepos);
  console.log('Languages:', Object.keys(stats.languages));
})();
"
```

Expected output:
```
✅ Registry initialized!
Total repos: 23
Active repos: 21
Languages: [ 'typescript', 'python', 'go', 'rust' ]
```

### Step 5: Set Up Claude Skill (5 minutes)

In your Claude Code environment:

1. Copy `skills/linear-toolkit.json` to your Claude Code skills directory
2. Or create a symlink:
   ```bash
   ln -s /path/to/toolkit/skills/linear-toolkit.json \
     ~/.claude/skills/linear-toolkit.json
   ```

3. Verify the skill is loaded:
   - Open Claude Code
   - Type: `@skill linear-toolkit list_repositories`
   - Should show all repository discovery tools

### Step 6: Test Integration (5 minutes)

In Claude Code, try these commands:

```
@skill linear-toolkit list_repositories {"filter": "active"}
```

Expected response:
```
[
  {
    name: "backend",
    url: "https://github.com/my-org/backend",
    language: "typescript",
    private: true,
    lastUpdated: "2024-11-08T12:34:56Z",
    stars: 42,
    forks: 5,
    ...
  },
  ...
]
```

Try searching:
```
@skill linear-toolkit search_repositories {"query": "auth", "language": "typescript"}
```

Try getting stats:
```
@skill linear-toolkit get_repository_stats
```

---

## Common Tasks

### Task 1: Link Commit to Issue

**In per-repo mode (old):**
```typescript
await skill.link_commit({
  repositoryUrl: 'https://github.com/my-org/backend',
  commitHash: 'abc123',
  commitMessage: 'Fix auth - closes LIN-456'
});
```

**In org-wide mode (new):**
```typescript
await skill.link_commit({
  repositoryName: 'backend',  // ← Uses registry lookup
  commitHash: 'abc123',
  commitMessage: 'Fix auth - closes LIN-456'
});
```

### Task 2: Find All Python Repositories

```
@skill linear-toolkit search_repositories {
  "query": "python",
  "language": "python"
}
```

Or programmatically:
```typescript
const registry = await skill.get_repositories({
  language: 'python'
});
```

### Task 3: Get Org Statistics

```
@skill linear-toolkit get_repository_stats
```

Returns:
```json
{
  "totalRepos": 23,
  "activeRepos": 21,
  "archivedRepos": 2,
  "languages": {
    "typescript": 12,
    "python": 6,
    "go": 3,
    "rust": 2
  },
  "cacheAge": "2m"
}
```

### Task 4: Work with Specific Repository

```typescript
const repo = await skill.get_repository_info({
  repo_name: 'backend'
});

console.log(`Repository: ${repo.name}`);
console.log(`Language: ${repo.language}`);
console.log(`URL: ${repo.url}`);
console.log(`Last updated: ${repo.lastUpdated}`);
console.log(`Open issues: ${repo.openIssuesCount}`);
```

### Task 5: Agent Workflow - Auto-Link PRs Across Repos

```typescript
// User: "Link all open PRs to their Linear issues"

// Step 1: Get all repos
const repos = await skill.list_repositories({ filter: 'active' });

// Step 2: For each repo, find PRs
for (const repo of repos) {
  const prs = await fetchOpenPRs(repo.url);

  for (const pr of prs) {
    // Extract issue ID from PR title/body
    const issueMatch = pr.body.match(/LIN-\d+/);
    if (issueMatch) {
      await skill.link_pull_request({
        prUrl: pr.url,
        repositoryName: repo.name,
        issueId: issueMatch[0],
        autoTransition: true
      });
    }
  }
}
```

---

## Configuration Reference

### Environment Variables

```bash
# Required for org-wide mode
GITHUB_ORG=your-org-name
GITHUB_TOKEN=ghp_your_token

# Optional
DEPLOYMENT_MODE=org-wide              # Default: per-repo
REPO_CACHE_TTL=3600000                # Cache duration (ms)
LOG_LEVEL=info                        # debug|info|warn|error
LINEAR_API_ENDPOINT=https://api.linear.app/graphql
```

### Repository Cache TTL Options

```
# Recommend for different scenarios:

Development:
REPO_CACHE_TTL=300000        # 5 minutes (always fresh)

Production:
REPO_CACHE_TTL=3600000       # 1 hour (recommended default)

Large Organization (100+ repos):
REPO_CACHE_TTL=7200000       # 2 hours (reduce API calls)

No Cache (always fresh):
REPO_CACHE_TTL=0             # Refresh every query
```

---

## Operations Across Repositories

Once your registry is set up, operations become repository-agnostic:

### Before (Per-Repo Mode)

```typescript
// Had to specify URL every time
await skill.linkCommitToIssue({
  repositoryUrl: 'https://github.com/my-org/backend',
  commitHash: 'abc123',
  commitMessage: 'Fix LIN-456'
});

// Different code for different repos
// Couldn't easily work across repos
```

### After (Org-Wide Mode)

```typescript
// Automatic registry lookup
await skill.linkCommitToIssue({
  repositoryName: 'backend',
  commitHash: 'abc123',
  commitMessage: 'Fix LIN-456'
});

// Or even better - agents discover repos:
const repos = await skill.list_repositories();
for (const repo of repos) {
  // Agent automatically works with each repo
  await skill.linkCommitToIssue({
    repositoryName: repo.name,
    commitHash: commit.hash,
    commitMessage: commit.message
  });
}
```

---

## Advanced: Custom Workflows

### Workflow 1: Daily Repository Audit

```typescript
async function auditRepositories() {
  const stats = await skill.get_repository_stats();

  // Alert on repositories with:
  // - High open issue count
  // - Long time since update
  // - Missing CI/CD workflows

  for (const [lang, count] of Object.entries(stats.languages)) {
    console.log(`${count} repos use ${lang}`);
  }

  // Generate report for team
  return {
    totalRepos: stats.totalRepos,
    activeRepos: stats.activeRepos,
    lastAudit: new Date(),
    recommendations: [
      // ... analyze and recommend
    ]
  };
}
```

### Workflow 2: Intelligent Issue Routing

```typescript
async function routeIssueToRepo(issue) {
  // Agent analyzes issue and finds relevant repositories

  const keywords = extractKeywords(issue.description);
  const repos = await skill.search_repositories({
    query: keywords.join(' ')
  });

  if (repos.length > 0) {
    // Automatically link to most relevant repo
    const topRepo = repos[0];

    await skill.create_issue({
      title: issue.title,
      description: issue.description,
      repositoryName: topRepo.name,  // Org-wide mode
      priority: issue.priority
    });
  }
}
```

### Workflow 3: Cross-Repository Search

```typescript
async function findAuthRelatedWork() {
  // Find all auth-related repositories
  const authRepos = await skill.search_repositories({
    query: 'auth'
  });

  // Get related issues across all auth repos
  for (const repo of authRepos) {
    const issues = await skill.search_issues({
      query: 'authentication',
      context: { repository: repo.name }
    });

    console.log(`${repo.name}: ${issues.length} auth-related issues`);
  }
}
```

---

## Monitoring & Maintenance

### Health Check

```bash
# Verify registry is healthy
curl -X GET http://localhost:3000/health/registry

# Expected response:
{
  "status": "healthy",
  "reposCount": 23,
  "lastRefresh": "2024-11-08T12:34:56Z",
  "cacheAge": "15m"
}
```

### Manual Registry Refresh

```bash
# Force refresh all repositories (bypasses cache)
curl -X POST http://localhost:3000/api/registry/refresh

# Or via skill
await skill.refresh_registry({ force: true });
```

### Monitor Cache Age

```bash
# Check how long data has been cached
const stats = await skill.get_repository_stats();
console.log(`Cache age: ${stats.cacheAge}`);

// Auto-refresh if too old
if (parseInt(stats.cacheAge) > 55) {  // 55 minutes
  await skill.refresh_registry({ force: false });
}
```

---

## Troubleshooting

### Issue: Registry shows 0 repositories

```bash
# Check credentials
echo $GITHUB_ORG
echo $GITHUB_TOKEN

# Verify token is valid
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Check organization name
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/orgs/$GITHUB_ORG

# Check logs
tail -f logs/toolkit.log | grep -i registry
```

### Issue: "Repository not found" errors

```typescript
// Debug: List all cached repos
const stats = await skill.get_repository_stats();
console.log('Cached repos:', stats.totalRepos);

// Search for repo
const found = await skill.search_repositories({
  query: 'myrepo'
});
console.log('Search results:', found);

// Force registry refresh
await skill.refresh_registry({ force: true });
```

### Issue: Slow repository lookups

```bash
# Check GitHub API rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# If limited, increase cache TTL
REPO_CACHE_TTL=7200000  # 2 hours

# Check network latency
time curl https://api.github.com
```

---

## Migration from Per-Repo Mode

If you're upgrading from per-repo to org-wide:

```bash
# 1. Update .env
DEPLOYMENT_MODE=org-wide
GITHUB_ORG=my-org
GITHUB_TOKEN=ghp_xxx

# 2. Update operations
# Old:
repositoryUrl: 'https://github.com/my-org/backend'

# New:
repositoryName: 'backend'

# 3. Update Claude Skill
# Old skill version → New version with repository discovery

# 4. Test thoroughly
npm test
```

---

## Next Steps

1. **Read More:**
   - [`DEPLOYMENT_MODES.md`](./DEPLOYMENT_MODES.md) - Detailed comparison of modes
   - [`REPOSITORY_REGISTRY.md`](./REPOSITORY_REGISTRY.md) - Advanced registry usage
   - [`INTEGRATION_GUIDES.md`](./INTEGRATION_GUIDES.md) - Git/GitHub webhook setup

2. **Set Up Git Hooks:**
   - Automatic commit linking to issues
   - See: `docs/INTEGRATION_GUIDES.md#git-integration`

3. **Configure Webhooks:**
   - GitHub webhook integration
   - Auto-linking pull requests
   - See: `docs/INTEGRATION_GUIDES.md#github-webhooks`

4. **Test Task Completion Hooks:**
   - Auto-update Linear issues when agents finish tasks
   - See: `.claude/hooks/task-completion.md`

5. **Deploy to Production:**
   - Follow deployment guide: `docs/DEPLOYMENT.md`

---

## Summary

You now have:
- ✅ Organization-wide repository discovery
- ✅ Agent-accessible repository registry
- ✅ Automatic repo URL lookups
- ✅ Cross-repository issue linking
- ✅ Smart repository search and filtering
- ✅ Cache management with configurable TTL
- ✅ GitHub API rate limit awareness

**Start using it:**
```
@skill linear-toolkit list_repositories
@skill linear-toolkit search_repositories {"query": "auth"}
```

For questions or issues, refer to the comprehensive guides in `/docs`!
