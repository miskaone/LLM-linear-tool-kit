# Linear Toolkit - Example Scripts

This directory contains practical examples showing how to use the Linear Toolkit in various scenarios.

---

## Overview

All examples assume you have:
- ✅ Run `npm install`
- ✅ Run `npm run build`
- ✅ Created `.env` with your credentials

---

## Examples

### 1. **basic-usage.js** - Getting Started

Shows the fundamentals of using the Linear Toolkit:

```bash
node examples/basic-usage.js
```

**What it demonstrates:**
- Initialize the LinearAgentClient
- Query active work (issues assigned to you)
- Search for issues
- Get specific issue details
- Create a new issue
- List your teams

**Good for:** Understanding basic operations

---

### 2. **repository-registry.js** - Organization-Wide Mode

Explore the repository registry for discovering repositories in your organization:

```bash
node examples/repository-registry.js
```

**Prerequisites:**
- `GITHUB_ORG` set in `.env`
- `GITHUB_TOKEN` set in `.env`
- `DEPLOYMENT_MODE=org-wide` in `.env`

**What it demonstrates:**
- Initialize the RepositoryRegistry
- List all repositories
- Search repositories
- Get repositories by programming language
- View organization statistics
- Refresh the repository cache
- Use the registry with Git/GitHub operations

**Good for:** Setting up organization-wide integration

---

### 3. **git-operations.js** - Git & GitHub Integration

Learn how to link commits and PRs to Linear issues:

```bash
node examples/git-operations.js
```

**What it demonstrates:**
- Link commits to issues (by parsing commit messages)
- Track branches for issues (by extracting from branch names)
- Get repository information
- Link pull requests to issues
- GitHub webhook setup instructions
- Issue ID pattern matching
- Branch naming conventions

**Good for:** Setting up automated commit/PR linking

---

## Quick Start

### Option A: Use the Setup Script

```bash
# Interactive setup (guided)
./setup.sh
```

Then run examples:
```bash
node examples/basic-usage.js
```

### Option B: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Create .env with your credentials
cat > .env <<'EOF'
LINEAR_API_KEY=lin_api_xxx
GITHUB_ORG=your-org
GITHUB_TOKEN=ghp_xxx
DEPLOYMENT_MODE=org-wide
EOF

# 4. Run an example
node examples/basic-usage.js
```

---

## Common Issues

### "Cannot find module 'linear-toolkit'"

```bash
# Make sure you built the project
npm run build

# Verify dist/ exists
ls dist/
```

### "LINEAR_API_KEY not found"

```bash
# Check .env exists and has your key
cat .env | grep LINEAR_API_KEY

# If empty, get a new key from:
# https://linear.app/settings/api
```

### "GITHUB_ORG not set"

Only needed for `repository-registry.js`. Other examples work without it.

```bash
# Get your org name from:
# https://github.com/settings/organizations
# or https://github.com/YOUR-ORG

# Add to .env:
GITHUB_ORG=your-org-name
GITHUB_TOKEN=ghp_xxx
```

### TypeScript compilation errors

```bash
# Clear and rebuild
rm -rf dist/
npm run build

# If still errors, check tsconfig.json
cat tsconfig.json
```

---

## Testing Your Setup

### Quick validation

```bash
node -e "
const { loadConfig } = require('./dist/utils/config');
const config = loadConfig();
console.log('✅ Config loaded!');
console.log('Deployment mode:', config.deploymentMode);
"
```

### Run all tests

```bash
npm test
```

### Run specific example

```bash
# Verbose output
node --trace-warnings examples/basic-usage.js

# With logging
DEBUG=* node examples/basic-usage.js
```

---

## Creating Your Own Examples

All examples follow this pattern:

```javascript
// 1. Import required modules
const { LinearAgentClient } = require('../dist/core/client/LinearAgentClient');
const { loadConfig } = require('../dist/utils/config');

// 2. Load config
const config = loadConfig();

// 3. Initialize client
const client = await LinearAgentClient.initialize(config);

// 4. Use the toolkit
const issue = await client.getIssue('LIN-123');
```

See any example file for the full template.

---

## Next Steps

After running the examples:

1. **Read the Guides:**
   - `docs/QUICK_START_LOCAL.md` - Local setup details
   - `docs/GITHUB_ORG_INTEGRATION_GUIDE.md` - Organization setup
   - `docs/DEPLOYMENT_MODES.md` - Deployment strategies

2. **Explore the Code:**
   - `src/core/client/LinearAgentClient.ts` - Main client
   - `src/modules/` - Feature modules
   - `src/integrations/` - Git, GitHub, etc.

3. **Create Your Integration:**
   - Build a custom script for your workflow
   - Set up Git/GitHub webhooks (see `INTEGRATION_GUIDES.md`)
   - Deploy to production (see `DEPLOYMENT.md`)

4. **Integrate with Claude Code:**
   - Copy `skills/linear-toolkit.json` to Claude
   - Use `@skill linear-toolkit` in Claude Code
   - Set up task completion hooks

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Cannot find module` | Run `npm run build` |
| `LINEAR_API_KEY` not set | Add to `.env` and reload |
| `GITHUB_ORG` not set | Only needed for registry example |
| Tests fail | Run `npm test -- --verbose` |
| TypeScript errors | Run `npm run build` to see details |

---

## Support

For help with:
- **Setup:** See `docs/QUICK_START_LOCAL.md`
- **Configuration:** See `.env.example`
- **Deployment:** See `docs/DEPLOYMENT.md`
- **GitHub integration:** See `docs/GITHUB_ORG_INTEGRATION_GUIDE.md`
- **Detailed reference:** See `docs/REPOSITORY_REGISTRY.md`

---

## Example Workflow

Here's a typical workflow:

```bash
# 1. Clone and setup
git clone https://github.com/miskaone/LLM-linear-tool-kit.git
cd LLM-linear-tool-kit
npm install

# 2. Run setup script (interactive)
./setup.sh

# 3. Try basic example
node examples/basic-usage.js

# 4. Try repository registry (if using org-wide mode)
node examples/repository-registry.js

# 5. Try git operations
node examples/git-operations.js

# 6. Create your own script based on examples
cp examples/basic-usage.js my-custom-script.js
# Edit my-custom-script.js...
node my-custom-script.js
```

---

## Questions?

- 📚 Read the docs in `docs/`
- 🔍 Check example files
- 💬 See inline comments in code
- 🐛 Run with verbose logging: `DEBUG=* node examples/basic-usage.js`

Happy coding! 🚀
