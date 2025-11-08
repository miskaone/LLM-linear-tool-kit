# Repository Registry - Comprehensive Guide

The **Repository Registry** is a core component of the Linear Toolkit's organization-wide mode that provides:
- 🔍 **Auto-Discovery**: Automatically discovers repositories from your GitHub organization
- 📊 **Smart Caching**: Efficient caching with TTL-based refresh
- 🎯 **Rich Metadata**: Captures language, stars, forks, recent activity
- 🔗 **Agent Integration**: Claude agents can query and discover repositories
- ⚡ **Context-Aware**: Integration with Git and GitHub modules

---

## Architecture

### How It Works

```
┌─────────────────────────────────────────┐
│  Startup / Manual Refresh               │
└──────────────────┬──────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │ GitHub API Request          │
    │ GET /orgs/{org}/repos       │
    │ (with pagination)           │
    └──────────────┬──────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │ Parse & Extract Metadata        │
    │ - Name, URL, language          │
    │ - Archived status, privacy     │
    │ - Stars, forks, issues count   │
    │ - Last update time             │
    └──────────────┬──────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │ Store in Registry Cache         │
    │ (in-memory Map)                 │
    └──────────────┬──────────────────┘
                   │
    ┌──────────────▼──────────────────────┐
    │ Available for:                      │
    │ - Agent queries                     │
    │ - Git integration lookups           │
    │ - GitHub integration lookups        │
    │ - Repository discovery tools        │
    └─────────────────────────────────────┘
```

### Discovery Process

```
STARTUP
  ↓
Initialize RepositoryRegistry(org, token, cacheTTL)
  ↓
Call registry.initialize()
  ↓
Fetch from GitHub API /orgs/{org}/repos
  ↓
Parse response:
  ├─ Extract repo metadata
  ├─ Handle pagination
  └─ Respect rate limits
  ↓
Store in in-memory cache:
  Map<repoName, RepositoryMetadata>
  ↓
Ready for queries
  ↓
PERIODIC REFRESH (after TTL expires)
  ↓
Automatic cache refresh
  ├─ On next query (if cache expired)
  └─ Manual refresh via refreshRegistry()
```

---

## API Reference

### Core Methods

#### `initialize()`

Initialize the registry by discovering repositories from GitHub.

```typescript
const registry = new RepositoryRegistry('my-org', githubToken, 3600000);
await registry.initialize();
// Logs: "Registry initialized with 23 repositories"
```

#### `listRepositories(options?)`

List repositories with optional filtering.

```typescript
const repos = registry.listRepositories({
  filter: 'active',      // 'active' | 'archived' | 'all'
  language: 'typescript', // Filter by language
  search: 'auth',        // Search in name/description
  limit: 10              // Max results
});

// Returns: RepositoryMetadata[]
```

**Example Response:**
```typescript
[
  {
    name: 'backend',
    url: 'https://github.com/my-org/backend',
    owner: 'my-org',
    description: 'Main backend service',
    language: 'typescript',
    private: true,
    archived: false,
    lastUpdated: new Date('2024-11-08T12:34:56Z'),
    defaultBranch: 'main',
    stars: 42,
    forks: 5,
    openIssuesCount: 3
  },
  ...
]
```

#### `getRepository(name)`

Get specific repository by name.

```typescript
const repo = registry.getRepository('backend');

if (repo) {
  console.log(`${repo.name} uses ${repo.language}`);
  console.log(`Last updated: ${repo.lastUpdated}`);
}
```

#### `getRepositoryByUrl(url)`

Get repository by GitHub URL.

```typescript
const repo = registry.getRepositoryByUrl(
  'https://github.com/my-org/backend'
);

const repo2 = registry.getRepositoryByUrl(
  'https://github.com/my-org/backend.git' // Also works
);
```

#### `search(query, options?)`

Search repositories by name or description.

```typescript
const results = registry.search('payment', {
  language: 'go',
  limit: 5
});

// Searches in:
// - Repository names (case-insensitive)
// - Descriptions
```

#### `getByLanguage(language)`

Get all repositories using specific language.

```typescript
const tsRepos = registry.getByLanguage('typescript');
const pythonRepos = registry.getByLanguage('python');

console.log(`${tsRepos.length} TypeScript repositories`);
```

#### `getLanguages()`

Get list of all languages used.

```typescript
const languages = registry.getLanguages();
// Returns: ['typescript', 'python', 'go', 'rust', ...]
```

#### `getStats()`

Get organization-wide statistics.

```typescript
const stats = registry.getStats();

console.log(`Total repos: ${stats.totalRepos}`);
console.log(`Active: ${stats.activeRepos}`);
console.log(`Archived: ${stats.archivedRepos}`);
console.log(`Languages: ${Object.keys(stats.languages).join(', ')}`);
console.log(`Cache age: ${stats.cacheAge}`);

// Returns:
// {
//   totalRepos: 23,
//   activeRepos: 21,
//   archivedRepos: 2,
//   languages: {
//     typescript: 12,
//     python: 6,
//     go: 3,
//     rust: 2
//   },
//   cachedAt: Date,
//   cacheAge: '15m'
// }
```

#### `refreshRegistry(force?)`

Manually refresh repository cache.

```typescript
// Refresh only if cache expired (default)
await registry.refreshRegistry();

// Force immediate refresh (bypasses TTL)
await registry.refreshRegistry(true);
```

#### `hasRepository(name)`

Check if repository exists.

```typescript
if (registry.hasRepository('backend')) {
  // Use backend repo
}
```

#### `getCount()`

Get total number of repositories.

```typescript
const count = registry.getCount();
console.log(`Managing ${count} repositories`);
```

#### `getOrg()`

Get organization name.

```typescript
const org = registry.getOrg();
console.log(`Organization: ${org}`);
```

---

## Integration with Operations

### Git Integration

In organization-wide mode, Git operations can use repository names:

```typescript
// Before (per-repo mode):
await gitModule.execute('linkCommitToIssues', {
  commitHash: 'abc123',
  repositoryUrl: 'https://github.com/my-org/backend',
  commitMessage: 'Fix auth - closes LIN-123'
});

// After (org-wide mode with registry):
await gitModule.execute('linkCommitToIssues', {
  commitHash: 'abc123',
  repositoryName: 'backend',  // Registry looks up URL
  commitMessage: 'Fix auth - closes LIN-123'
});
```

### GitHub Integration

GitHub operations resolve repository URLs from registry:

```typescript
// Before:
await githubModule.execute('linkPullRequestToIssue', {
  prUrl: 'https://github.com/my-org/backend/pull/456',
  issueId: 'LIN-789'
});

// After (with automatic registry lookup):
await githubModule.execute('linkPullRequestToIssue', {
  prUrl: 'https://github.com/my-org/backend/pull/456',
  repositoryName: 'backend',  // Optional, auto-extracted if not provided
  issueId: 'LIN-789'
});
```

---

## Claude Skill Integration

### Available Operations

When registry is enabled, agents have access to:

#### `list_repositories`
List all repositories in organization.

```typescript
const result = await skill.list_repositories({
  filter: 'active',
  limit: 20
});

// Result:
// {
//   repos: [...],
//   total: 23,
//   cached: true,
//   cacheAge: '12m'
// }
```

#### `search_repositories`
Search repositories by name or description.

```typescript
const result = await skill.search_repositories({
  query: 'auth',
  language: 'typescript',
  limit: 10
});

// Returns matching repos with TypeScript
```

#### `get_repository_info`
Get detailed info about specific repository.

```typescript
const result = await skill.get_repository_info({
  repo_name: 'backend'
});

// Returns full RepositoryMetadata including:
// - Language, stars, forks
// - Last update time
// - Default branch
// - Open issues count
```

#### `get_repository_stats`
Get organization-wide statistics.

```typescript
const result = await skill.get_repository_stats();

// Returns aggregate stats across all repos
```

#### `get_languages`
List all languages used in organization.

```typescript
const result = await skill.get_languages();

// Returns: ['typescript', 'python', 'go', ...]
```

---

## Caching Strategy

### Default Configuration

```
Cache TTL: 1 hour (3600000 ms)
Cache Type: In-Memory Map
Max Size: Unlimited (typical 50-1000 repos)
Invalidation: TTL-based
```

### Configuration

```bash
# .env
REPO_CACHE_TTL=3600000  # 1 hour
```

### TTL Scenarios

```typescript
// Fast caching (5 minutes - dev)
REPO_CACHE_TTL=300000

// Standard caching (1 hour - recommended)
REPO_CACHE_TTL=3600000

// Long caching (6 hours - low activity orgs)
REPO_CACHE_TTL=21600000

// No caching (always fresh, slower)
REPO_CACHE_TTL=0  // Refresh on every query
```

### Cache Refresh Logic

```
On Query:
├─ Is cache valid (age < TTL)?
│  ├─ YES → Return cached results
│  └─ NO → Fetch from GitHub
│
Manual Refresh:
├─ refreshRegistry() → Respects TTL
└─ refreshRegistry(true) → Force immediate
```

---

## GitHub API Rate Limiting

### Rate Limit Awareness

Registry respects GitHub API rate limits:

```
Standard Limit: 60 requests/hour (unauthenticated)
Token Limit: 5000 requests/hour (authenticated)

Registry includes:
✅ Rate limit checking
✅ Respects X-RateLimit headers
✅ Pauses on <10 requests remaining
✅ Exponential backoff on 429 responses
```

### Example: Rate Limit Check

```typescript
// GitHub returns rate limit info in response headers
const response = await fetch('https://api.github.com/orgs/my-org/repos', {
  headers: { 'Authorization': `token ${token}` }
});

console.log(response.headers.get('x-ratelimit-limit'));      // 5000
console.log(response.headers.get('x-ratelimit-remaining'));  // 4998
console.log(response.headers.get('x-ratelimit-reset'));      // Unix timestamp
```

---

## Practical Examples

### Example 1: Find TypeScript Microservices

```typescript
// User request: "Show me all TypeScript microservices"
const repos = registry.search('service', {
  language: 'typescript'
});

repos.forEach(repo => {
  console.log(`${repo.name}: ${repo.description}`);
});
```

### Example 2: Identify High-Activity Repositories

```typescript
// Get all repos, sorted by recent activity
const allRepos = registry.listRepositories({ filter: 'active' });

const active = allRepos
  .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
  .slice(0, 10);

console.log('Most recently updated repos:', active.map(r => r.name));
```

### Example 3: Build Language Statistics

```typescript
const stats = registry.getStats();

console.log('Language breakdown:');
Object.entries(stats.languages)
  .sort((a, b) => b[1] - a[1])
  .forEach(([lang, count]) => {
    console.log(`  ${lang}: ${count} repos`);
  });
```

### Example 4: Agent Workflow - Smart Repository Discovery

```typescript
// Agent task: "Link commits across all auth-related repos"

// Step 1: Find relevant repos
const authRepos = registry.search('auth');

// Step 2: Get their details
const details = authRepos.map(r => ({
  name: r.name,
  language: r.language,
  lastCommit: r.lastUpdated,
  url: r.url
}));

// Step 3: For each repo, link commits
for (const repo of authRepos) {
  const commits = await fetchRecentCommits(repo.url);
  for (const commit of commits) {
    if (commit.message.includes('LIN-')) {
      await gitModule.execute('linkCommitToIssues', {
        repositoryName: repo.name,
        commitHash: commit.hash,
        commitMessage: commit.message
      });
    }
  }
}
```

### Example 5: Generate Org Report

```typescript
async function generateOrgReport() {
  const stats = registry.getStats();
  const languages = registry.getLanguages();

  return {
    organization: registry.getOrg(),
    summary: {
      total: stats.totalRepos,
      active: stats.activeRepos,
      archived: stats.archivedRepos
    },
    languages: stats.languages,
    cacheAge: stats.cacheAge,
    topLanguages: Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => ({ language: lang, count }))
  };
}
```

---

## Troubleshooting

### Registry Not Populating

```bash
# Check credentials in .env
grep GITHUB_ORG .env
grep GITHUB_TOKEN .env

# Verify token is valid
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Check token scopes
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user \
  -i | grep x-oauth-scopes
```

### Repository Not Found

```typescript
// Check if repo exists
console.log(registry.hasRepository('backend'));

// List all repos
const all = registry.listRepositories({ filter: 'all' });
console.log(all.map(r => r.name));

// Search instead of direct lookup
const found = registry.search('backend');
```

### Cache Stale

```typescript
// Force refresh
await registry.refreshRegistry(true);

// Check cache age
const stats = registry.getStats();
console.log(`Cache age: ${stats.cacheAge}`);

// Reduce TTL
REPO_CACHE_TTL=600000  // 10 minutes
```

### Rate Limit Hit

```bash
# Check current rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit | jq .

# Wait for reset (check reset timestamp)
# Or increase cache TTL to reduce API calls

REPO_CACHE_TTL=7200000  # 2 hours
```

---

## Performance Characteristics

```
Operation              Time      Depends On
───────────────────────────────────────────────
initialize()           500ms-2s  Repo count, network
listRepositories()     1ms       Cache hit
search()               10-50ms   Search complexity
getRepository()        1ms       Cache hit
getRepositoryByUrl()   5-20ms    URL parsing
getLanguages()         10ms      Cache hit
getStats()             5ms       Aggregation
refreshRegistry()      500ms-2s  Repo count, network
```

### Optimization Tips

1. **Increase Cache TTL**: Reduce API calls (but stale data risk)
2. **Use Search**: Faster than filtering all repos
3. **Cache Results**: Store query results in application cache
4. **Batch Operations**: Group repository lookups
5. **Lazy Load**: Only refresh when needed

---

## Summary

The Repository Registry provides:
- ✅ Automatic discovery of organization repositories
- ✅ Efficient caching with configurable TTL
- ✅ Rich metadata (language, activity, stats)
- ✅ Multiple query methods (search, filter, lookup)
- ✅ Integration with Git/GitHub modules
- ✅ Agent-accessible discovery tools
- ✅ Rate limit awareness and handling

Use it to enable intelligent, context-aware repository operations across your organization!
