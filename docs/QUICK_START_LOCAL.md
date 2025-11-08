# Linear Toolkit - Quick Start Guide (Local Development)

Get the Linear Toolkit running on your local machine in under 15 minutes.

---

## Prerequisites (2 minutes)

- [ ] **Node.js 18+** - [Install](https://nodejs.org/)
  ```bash
  node --version  # Should be v18.0.0 or higher
  ```

- [ ] **Git** - [Install](https://git-scm.com/)
  ```bash
  git --version
  ```

- [ ] **Linear API Key** - [Get here](https://linear.app/settings/api)
  - Go to Settings → API
  - Copy your API key (starts with `lin_api_`)

- [ ] **GitHub Personal Access Token** (optional, for org-wide mode)
  - Go to [GitHub Settings → Tokens](https://github.com/settings/tokens/new)
  - Scopes: `repo`, `read:org`
  - Copy token (starts with `ghp_`)

---

## Step 1: Clone the Repository (2 minutes)

```bash
# Clone the toolkit
git clone https://github.com/miskaone/LLM-linear-tool-kit.git
cd LLM-linear-tool-kit

# Or if you forked it:
git clone https://github.com/YOUR-USERNAME/LLM-linear-tool-kit.git
cd LLM-linear-tool-kit
```

---

## Step 2: Install Dependencies (3 minutes)

```bash
# Install all dependencies
npm install

# This will:
# - Download 500+ packages
# - Install TypeScript, Jest, Zod, etc.
# - Set up build tools
# Takes 2-5 minutes depending on network
```

Verify installation:
```bash
npm list typescript zod jest
# Should show installed versions
```

---

## Step 3: Create Configuration (2 minutes)

Create `.env` file in the root directory:

```bash
cat > .env <<'EOF'
# Linear API Configuration
LINEAR_API_KEY=lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub Organization Configuration (optional, for org-wide mode)
# Leave blank for per-repo mode
GITHUB_ORG=your-org-name
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deployment Mode
DEPLOYMENT_MODE=org-wide

# Optional: Cache and Logging
REPO_CACHE_TTL=3600000
LOG_LEVEL=info
EOF
```

Replace with your actual credentials:
- `LINEAR_API_KEY`: Get from [Linear Settings](https://linear.app/settings/api)
- `GITHUB_ORG`: Your GitHub organization name (e.g., `mycompany`)
- `GITHUB_TOKEN`: Get from [GitHub Settings](https://github.com/settings/tokens/new)

**Important:** Never commit `.env` to git! It's in `.gitignore`.

---

## Step 4: Build TypeScript (2 minutes)

```bash
# Compile TypeScript to JavaScript
npm run build

# This creates a `dist/` directory with compiled code
# Should complete in 10-30 seconds with no errors
```

Verify build:
```bash
ls dist/
# Should show: core/, modules/, integrations/, utils/, index.js, etc.
```

---

## Step 5: Test the Setup (3 minutes)

### Option A: Run Tests
```bash
# Run the entire test suite
npm test

# Or run specific tests
npm test -- src/core/client/GraphQLClient.test.ts
npm test -- src/integrations/repository/RepositoryRegistry.test.ts
```

Expected output:
```
PASS  src/utils/__tests__/config.test.ts
PASS  src/core/client/__tests__/SessionManager.test.ts
PASS  src/integrations/repository/__tests__/RepositoryRegistry.test.ts

Tests:       XX passed, XX total
```

### Option B: Quick Validation Script
```bash
# Create and run a validation script
node -e "
const { loadConfig } = require('./dist/utils/config');
try {
  const config = loadConfig();
  console.log('✅ Configuration loaded successfully!');
  console.log('   - Linear API Key: ' + (config.apiKey ? 'SET' : 'MISSING'));
  console.log('   - Deployment Mode: ' + (config.deploymentMode || 'per-repo'));
  if (config.github) {
    console.log('   - GitHub Org: ' + config.github.org);
  }
} catch (error) {
  console.error('❌ Configuration error:', error.message);
}
"
```

Expected output:
```
✅ Configuration loaded successfully!
   - Linear API Key: SET
   - Deployment Mode: org-wide
   - GitHub Org: your-org-name
```

---

## Step 6: Start Using It Locally

### Option A: Use in Node.js Script

Create `example.js`:

```javascript
const { LinearAgentClient } = require('./dist/core/client/LinearAgentClient');
const { loadConfig } = require('./dist/utils/config');

async function main() {
  try {
    const config = loadConfig();
    const client = await LinearAgentClient.initialize(config);

    // Query a specific issue
    const issue = await client.getIssue('LIN-123');
    console.log('Issue:', issue.title, issue.state);

    // Search issues
    const results = await client.searchIssues('bug');
    console.log('Found', results.length, 'issues');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

Run it:
```bash
node example.js
```

### Option B: Interactive Node REPL

```bash
node

# In the REPL:
> const { LinearAgentClient } = require('./dist/core/client/LinearAgentClient');
> const { loadConfig } = require('./dist/utils/config');
> const config = loadConfig();
> const client = await LinearAgentClient.initialize(config);
> const issue = await client.getIssue('LIN-123');
> console.log(issue);
```

---

## Step 7: Use with Claude Code (3 minutes)

1. **Copy the Skill File:**
   ```bash
   # Copy to Claude Code directory
   cp skills/linear-toolkit.json ~/.claude/skills/

   # Or create a symlink
   ln -s $(pwd)/skills/linear-toolkit.json ~/.claude/skills/linear-toolkit.json
   ```

2. **Reload Claude Code:**
   - Restart Claude Code or run: `/reload-skills`

3. **Use the Skill:**
   ```
   @skill linear-toolkit list_repositories
   ```

   Or:
   ```
   @skill linear-toolkit search_issues {"query": "authentication"}
   ```

4. **Set Up Task Completion Hooks:**
   ```bash
   # Copy hook files
   cp -r .claude/ ~/.claude/

   # Or create symlinks
   ln -s $(pwd)/.claude/hooks/ ~/.claude/hooks/
   ```

---

## Common Tasks

### List Your Repositories
```javascript
const repos = await client.listRepositories({ filter: 'active' });
repos.forEach(r => console.log(r.name, r.language));
```

### Search Issues
```javascript
const issues = await client.searchIssues({
  query: 'authentication',
  limit: 10
});
issues.forEach(i => console.log(`${i.identifier}: ${i.title}`));
```

### Get Issue Details
```javascript
const issue = await client.getIssue('LIN-456');
console.log(`Status: ${issue.state}`);
console.log(`Assignee: ${issue.assignee?.name}`);
console.log(`Priority: ${issue.priority}`);
```

### Create an Issue
```javascript
const newIssue = await client.createIssue({
  title: 'Fix authentication flow',
  description: 'Users cannot login with OAuth',
  teamId: 'team-123',
  priority: 2
});
console.log(`Created: ${newIssue.identifier}`);
```

### Update an Issue
```javascript
const updated = await client.updateIssue({
  issueId: 'LIN-789',
  state: 'In Progress',
  assigneeId: 'user-123'
});
console.log(`Updated: ${updated.identifier}`);
```

### Add a Comment
```javascript
await client.addComment({
  issueId: 'LIN-456',
  body: 'Fixed in PR #123'
});
```

### Transition to Done
```javascript
const done = await client.transitionIssue({
  issueId: 'LIN-456',
  state: 'Done'
});
```

---

## Development Workflow

### Watch for Changes
```bash
# Automatically rebuild on file changes
npm run watch
```

In another terminal:
```bash
# Run your script/tests
node example.js
```

### Code in VSCode
```bash
# Open the project
code .

# The TypeScript integration will:
# - Show type hints
# - Catch errors before runtime
# - Provide autocomplete
```

### Debug with VSCode

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/example.js",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

Then:
- Set breakpoints in your code
- Press `F5` to start debugging
- Step through code with breakpoints

---

## Project Structure

```
LLM-linear-tool-kit/
├── src/                          # Source code
│   ├── core/                      # GraphQL client, session, caching
│   ├── modules/                   # Feature modules (Issues, Comments, etc.)
│   ├── integrations/              # External integrations
│   │   ├── git/                   # Git integration
│   │   ├── github/                # GitHub integration
│   │   ├── repository/            # NEW: Repository registry
│   │   ├── testing/               # Test runner integration
│   │   └── security/              # Security scanner integration
│   ├── types/                     # TypeScript interfaces
│   └── utils/                     # Config, logging, caching
│
├── dist/                          # Compiled JavaScript (generated by npm run build)
├── docs/                          # Documentation
│   ├── GITHUB_ORG_INTEGRATION_GUIDE.md
│   ├── DEPLOYMENT_MODES.md
│   ├── REPOSITORY_REGISTRY.md
│   └── ...more docs
│
├── skills/                        # Claude Code skills
│   └── linear-toolkit.json        # Main skill definition
│
├── .claude/                       # Claude Code configuration
│   ├── README.md
│   └── hooks/                     # Task completion hooks
│       ├── task-completion.md
│       ├── task-completion-config.json
│       └── task-completion-handler.ts
│
├── .env                           # YOUR config (created above)
├── .env.example                   # Template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

### Issue: "Cannot find module 'linear-toolkit'"

```bash
# Make sure you built the project
npm run build

# Verify dist/ exists
ls dist/

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "LINEAR_API_KEY not found"

```bash
# Verify .env exists
ls -la .env

# Verify it has your key
grep LINEAR_API_KEY .env

# Check it's not empty
echo $LINEAR_API_KEY
```

### Issue: TypeScript errors

```bash
# Check TypeScript configuration
npm run build

# If errors appear, they're usually:
# - Missing type definitions
# - Type mismatch in parameters
# - Missing imports

# Fix the error location shown in the message
```

### Issue: "GitHub API rate limit"

```bash
# This happens with many requests in short time
# Solutions:
# 1. Increase cache TTL in .env
REPO_CACHE_TTL=7200000  # 2 hours

# 2. Wait for rate limit reset (check GitHub API)
curl https://api.github.com/rate_limit \
  -H "Authorization: token $GITHUB_TOKEN"
```

### Issue: Tests failing

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- src/core/client/__tests__/GraphQLClient.test.ts

# Update snapshots if needed
npm test -- -u
```

---

## Next Steps

Once you have it running locally:

1. **Read the Comprehensive Guides:**
   - `docs/GITHUB_ORG_INTEGRATION_GUIDE.md` - Organization integration
   - `docs/DEPLOYMENT_MODES.md` - Deployment strategies
   - `docs/REPOSITORY_REGISTRY.md` - Advanced registry usage

2. **Explore the Code:**
   ```bash
   # Read the core client
   cat src/core/client/LinearAgentClient.ts

   # Check available operations
   cat linear-operations-index.json | jq .
   ```

3. **Create Your Own Integration:**
   ```bash
   # Example: Custom script that links commits
   cat > link-commits.js <<'EOF'
   const { LinearAgentClient } = require('./dist/core/client/LinearAgentClient');
   const { loadConfig } = require('./dist/utils/config');

   async function linkCommits() {
     const config = loadConfig();
     const client = await LinearAgentClient.initialize(config);

     // Your custom logic here
   }

   linkCommits().catch(console.error);
   EOF

   node link-commits.js
   ```

4. **Integrate with Your Workflows:**
   - Git hooks (auto-link commits)
   - GitHub webhooks (auto-link PRs)
   - CI/CD pipelines (auto-create issues)
   - Claude Code skills (query from Claude)

---

## Quick Reference

```bash
# Clone & setup (one command)
git clone https://github.com/miskaone/LLM-linear-tool-kit.git && \
cd LLM-linear-tool-kit && \
npm install && \
npm run build && \
echo "Setup complete!"

# Create .env with your credentials
cat > .env <<'EOF'
LINEAR_API_KEY=your_key_here
GITHUB_ORG=your_org
GITHUB_TOKEN=your_token_here
EOF

# Test it
npm test

# Start using it
node -e "const { LinearAgentClient } = require('./dist/core/client/LinearAgentClient'); console.log('Ready!');"

# Watch for changes while developing
npm run watch
```

---

## Getting Help

If you get stuck:

1. **Check logs for clues:**
   ```bash
   tail -f logs/toolkit.log
   ```

2. **Read error messages carefully** - they usually point to the issue

3. **Check your .env file:**
   ```bash
   cat .env | grep -v "^#" | grep -v "^$"
   ```

4. **Verify your API keys work:**
   ```bash
   # Test Linear API key
   curl https://api.linear.app/graphql \
     -H "Authorization: Bearer $LINEAR_API_KEY" \
     -d '{"query": "{ viewer { id } }"}'

   # Test GitHub token
   curl https://api.github.com/user \
     -H "Authorization: token $GITHUB_TOKEN"
   ```

5. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

---

## You're All Set! 🎉

You now have the Linear Toolkit running locally.

**Next: Pick what you want to do:**
- 📚 Read more docs (`docs/` folder)
- 🧪 Explore the code (`src/` folder)
- 🐍 Create scripts (`example.js`)
- 🎯 Integrate with Claude Code
- 🚀 Deploy to production (see `docs/DEPLOYMENT.md`)

Happy coding! 🚀
