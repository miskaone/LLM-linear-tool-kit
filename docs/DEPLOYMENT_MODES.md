# Linear Toolkit - Deployment Modes Guide

The Linear Toolkit supports two deployment architectures:
1. **Organization-Wide Mode** - Single toolkit instance serving your entire org with auto-discovered repositories
2. **Per-Repo Mode** - Individual toolkit instances for specific repositories with explicit configuration

Choose the mode that best fits your organization's structure and workflow.

---

## Mode Comparison Matrix

| Feature | Org-Wide | Per-Repo |
|---------|----------|----------|
| **Setup Complexity** | Medium | Low |
| **Single Source of Truth** | ✅ Yes | ❌ No |
| **Auto-Discovery** | ✅ Yes | ❌ No |
| **Repo Count Support** | 50-1000+ | 1-10 |
| **Configuration Locations** | 1 | Multiple |
| **Maintenance Burden** | Low | Medium-High |
| **Cross-Repo Queries** | ✅ Yes | ❌ No |
| **Agent Context Awareness** | ✅ Yes | ❌ No |
| **Cost** | Lower | Higher |
| **Learning Curve** | Moderate | Easy |

---

## Organization-Wide Mode

### Overview

In **organization-wide mode**, you deploy a single Linear Toolkit instance that:
- Auto-discovers repositories from your GitHub organization
- Maintains a registry of all repos with metadata (language, stars, forks, etc.)
- Allows agents/Claude to query across all repositories
- Minimizes configuration and maintenance burden

### When to Use

✅ **Use org-wide mode when:**
- You have 5+ repositories in your organization
- Multiple teams work across different repositories
- You want a single source of truth for repository information
- You want agents to discover and work with any repository
- You want to minimize configuration overhead
- You have dedicated DevOps/platform teams managing the deployment

❌ **Don't use org-wide mode if:**
- You have only 1-2 repositories
- Each repository is independently maintained with different teams
- You want the simplest possible setup
- You need air-gapped deployments with no GitHub API access

### Architecture

```
┌────────────────────────────────────────┐
│  Single Linear Toolkit Instance        │
│  (Organization-Wide Deployment)        │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ RepositoryRegistry               │  │
│ │ - Auto-discovers repos from GH   │  │
│ │ - Caches metadata (1hr default)   │  │
│ │ - Provides search/filter APIs     │  │
│ └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ Git Integration                  │  │
│ │ - Uses registry for repo lookup   │  │
│ │ - Or explicit URL (backward compat)│ │
│ └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ GitHub Integration               │  │
│ │ - Uses registry for repo lookup   │  │
│ │ - Or explicit URL (backward compat)│ │
│ └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│ Claude Skill + Hooks                   │
│ - listRepositories, searchRepositories │
│ - getRepository, getRepositoryStats    │
│ - getLanguages, etc.                   │
└────────────────────────────────────────┘
        ↓↓↓ All Operations
┌────────────────────────────────────────┐
│ All 50+ Linear Issues/Projects Ops     │
│ + Git/GitHub/Test/Security Integration │
└────────────────────────────────────────┘
```

### Setup Steps

#### Step 1: Create GitHub Personal Access Token

```bash
# Go to: https://github.com/settings/tokens
# Create new token with scopes:
# - repo (full control of private repositories)
# - read:org (read organization data)

# Or use GitHub CLI:
gh auth token
```

#### Step 2: Configure Environment

Create `.env` file in your deployment directory:

```bash
# Linear Configuration
LINEAR_API_KEY=lin_api_xxx_yyy_zzz

# GitHub Organization Configuration
GITHUB_ORG=your-org-name
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Deployment Mode
DEPLOYMENT_MODE=org-wide

# Optional: Repository Cache TTL (default 1 hour = 3600000ms)
REPO_CACHE_TTL=3600000

# Optional: Logging
LOG_LEVEL=info
```

#### Step 3: Deploy Toolkit

```bash
# Install dependencies
npm install

# Start toolkit server (adjust for your deployment platform)
npm start

# Or with TypeScript compilation
npm run build
npm run start:prod
```

#### Step 4: Initialize Repository Registry

The registry automatically initializes on startup. To verify:

```bash
# Check logs for: "Registry initialized with X repositories"

# Or query via API:
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "listRepositories",
    "params": { "filter": "active" }
  }'
```

#### Step 5: Configure Claude Skill

Copy `skills/linear-toolkit.json` to your Claude Code environment:

```bash
# In Claude Code settings
# Point to: skills/linear-toolkit.json

# Skill will automatically expose:
# - list_repositories
# - search_repositories
# - get_repository_info
# - get_repository_stats
# - get_languages
# (+ all 11 Linear operations)
```

### Usage Examples

#### Discover Organization Repositories

```typescript
// Via Claude Skill
await skill.list_repositories({
  filter: 'active',
  limit: 20
});

// Returns:
// {
//   repos: [
//     {
//       name: 'backend',
//       url: 'https://github.com/my-org/backend',
//       language: 'typescript',
//       private: true,
//       lastUpdated: '2024-11-08T...',
//       defaultBranch: 'main',
//       stars: 42,
//       forks: 5,
//       openIssuesCount: 3
//     },
//     ...
//   ],
//   total: 15,
//   cached: true,
//   cacheAge: '3m'
// }
```

#### Search Repositories by Language

```typescript
await skill.search_repositories({
  language: 'typescript',
  limit: 10
});

// Returns all TypeScript repositories
```

#### Link Commit Using Repository Name

```typescript
// Org-wide mode: Use repository name
await skill.link_commit_to_issues({
  commitHash: 'abc123def456',
  repositoryName: 'backend',  // ← Uses registry lookup
  commitMessage: 'Fix auth - closes LIN-123',
  files: ['src/auth.ts']
});
```

#### Link PR Using Repository Name

```typescript
await skill.link_pull_request({
  prUrl: 'https://github.com/my-org/backend/pull/456',
  repositoryName: 'backend',  // ← Uses registry lookup
  issueId: 'LIN-789',
  autoTransition: true
});
```

### Configuration Options

#### Repository Cache TTL

```bash
# Cache repos for 30 minutes (in milliseconds)
REPO_CACHE_TTL=1800000

# Cache repos for 6 hours
REPO_CACHE_TTL=21600000

# Never cache (always fresh, slower)
REPO_CACHE_TTL=0
```

#### GitHub Token Scopes

Required scopes for organization-wide mode:

```
repo              - Full control of private repositories
read:org          - Read organization data
read:user         - Read user profile data (optional)
workflow          - Manage workflows (optional, for CI/CD integration)
```

### Monitoring & Maintenance

#### Check Registry Status

```bash
# Via API
curl http://localhost:3000/health/registry

# Returns:
// {
//   status: 'healthy',
//   reposCount: 23,
//   lastRefresh: '2024-11-08T12:34:56Z',
//   cacheAge: '15m',
//   nextRefresh: '2024-11-08T13:34:56Z'
// }
```

#### Manual Registry Refresh

```typescript
// Force refresh from GitHub (bypasses cache)
await skill.refresh_registry({
  force: true
});
```

#### Monitor API Rate Limits

```bash
# Check GitHub API rate limit
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit

# Org-wide mode includes rate limit awareness:
# - Pauses if <10 requests remaining
# - Exponential backoff on 429 responses
# - Respects X-RateLimit headers
```

### Troubleshooting

#### Registry Not Initializing

```bash
# Check credentials
grep -i github .env

# Verify token is valid
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user

# Check logs for errors
tail -f logs/toolkit.log | grep -i registry
```

#### Repository Not Found

```bash
# List cached repositories
curl http://localhost:3000/api/repositories

# Search for repository
curl http://localhost:3000/api/search?q=backend

# Force registry refresh
curl -X POST http://localhost:3000/api/registry/refresh
```

#### Slow Repository Lookups

```bash
# Increase cache TTL
REPO_CACHE_TTL=7200000  # 2 hours

# Add repository search index
npm install meilisearch  # or similar

# Implement caching layer
CACHE_BACKEND=redis
```

---

## Per-Repo Mode

### Overview

In **per-repo mode**, you deploy Linear Toolkit instances per repository with:
- Explicit repository URL configuration
- No auto-discovery or registry
- Simple, straightforward setup
- Self-contained per-repo deployment

### When to Use

✅ **Use per-repo mode when:**
- You have 1-2 repositories
- Each repository is independently maintained
- You want the simplest setup possible
- You want complete isolation between repos
- You're testing/prototyping the toolkit
- Teams are fully siloed by repository

❌ **Don't use per-repo mode if:**
- You have many repositories (5+)
- You want agents to work across repositories
- You want a central management point
- You want to minimize configuration overhead

### Architecture

```
┌──────────────────────────────────┐
│ Repository: backend              │
├──────────────────────────────────┤
│ LINEAR_TOOLKIT (backend instance) │
│ ├─ Linear Ops (Issues, etc.)     │
│ ├─ Git Integration               │
│ │  └─ repositoryUrl (hardcoded)  │
│ └─ GitHub Integration            │
│    └─ repositoryUrl (hardcoded)  │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Repository: frontend             │
├──────────────────────────────────┤
│ LINEAR_TOOLKIT (frontend instance)│
│ ├─ Linear Ops (Issues, etc.)     │
│ ├─ Git Integration               │
│ │  └─ repositoryUrl (hardcoded)  │
│ └─ GitHub Integration            │
│    └─ repositoryUrl (hardcoded)  │
└──────────────────────────────────┘

...multiple independent instances...
```

### Setup Steps

#### Step 1: Configure per Repository

In `backend/.env`:
```bash
LINEAR_API_KEY=lin_api_xxx
DEPLOYMENT_MODE=per-repo
REPO_URL=https://github.com/my-org/backend
```

In `frontend/.env`:
```bash
LINEAR_API_KEY=lin_api_xxx
DEPLOYMENT_MODE=per-repo
REPO_URL=https://github.com/my-org/frontend
```

#### Step 2: Deploy Each Instance

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in separate deployment/container)
cd ../frontend
npm install
npm start
```

#### Step 3: Configure Claude Skill per Repo

Each repository gets its own Claude Skill configuration:

```bash
# In backend/.claude/
skills/linear-toolkit-backend.json

# In frontend/.claude/
skills/linear-toolkit-frontend.json
```

### Usage Examples

#### Explicit Repository URL

```typescript
// Per-repo mode: Always explicit
await skill.link_commit_to_issues({
  commitHash: 'abc123',
  repositoryUrl: 'https://github.com/my-org/backend',
  commitMessage: 'Fix auth - closes LIN-123',
  files: ['src/auth.ts']
});
```

#### Repository Url in All Operations

```typescript
// Every operation requires explicit URL
await skill.link_pull_request({
  prUrl: 'https://github.com/my-org/backend/pull/456',
  repositoryUrl: 'https://github.com/my-org/backend',
  issueId: 'LIN-789'
});
```

### Scaling Per-Repo

As you grow, consider:

```
1. 1-3 repos: Per-repo mode is fine
2. 4-10 repos: Consider hybrid approach
3. 10+ repos: Migrate to org-wide mode
```

### Hybrid Approach

You can mix modes:

```bash
# Centralized deployments
DEPLOYMENT_MODE=org-wide   # Production toolkit

# Repository-specific instances
DEPLOYMENT_MODE=per-repo   # Internal tooling, testing
```

---

## Migration Guide

### From Per-Repo to Org-Wide

```bash
# Step 1: Set up GitHub credentials
GITHUB_ORG=my-org
GITHUB_TOKEN=ghp_xxx

# Step 2: Change deployment mode
DEPLOYMENT_MODE=org-wide

# Step 3: Update operations (remove repositoryUrl, use repositoryName)
# Before:
await skill.link_commit({
  repositoryUrl: 'https://github.com/my-org/backend',
  ...
});

# After:
await skill.link_commit({
  repositoryName: 'backend',
  ...
});

# Step 4: Update Claude Skill
# Replace skills/linear-toolkit.json with org-wide version
# Now includes: listRepositories, searchRepositories, etc.

# Step 5: Test registry
await skill.list_repositories({ filter: 'active' });
```

### From Org-Wide to Per-Repo

```bash
# Step 1: Remove GitHub credentials
unset GITHUB_ORG
unset GITHUB_TOKEN

# Step 2: Change deployment mode
DEPLOYMENT_MODE=per-repo

# Step 3: Add repository URL to each operation
# Before:
await skill.link_commit({
  repositoryName: 'backend',
  ...
});

# After:
await skill.link_commit({
  repositoryUrl: 'https://github.com/my-org/backend',
  ...
});

# Step 4: Update Claude Skill
# Remove repository discovery tools
# Keep core Linear operations
```

---

## Decision Tree

```
Do you have multiple repositories?
│
├─ YES: Do you want a single toolkit instance?
│       │
│       ├─ YES: Organization-Wide Mode
│       │
│       └─ NO: Per-Repo Mode
│
└─ NO: Per-Repo Mode
```

---

## Summary

| Scenario | Recommended Mode |
|----------|------------------|
| Single repo, testing | Per-Repo |
| 1-2 repos, independent teams | Per-Repo |
| 3-5 repos, some cross-team work | Per-Repo or Hybrid |
| 5-20 repos, multiple teams | Org-Wide |
| 20+ repos, large organization | Org-Wide |
| Enterprise with 50+ repos | Org-Wide + Multi-Region |

Choose the mode that fits your organization's scale and structure. You can always migrate later!
