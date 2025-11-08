# Linear Toolkit Integration Guides

Complete guides for integrating Linear Toolkit with external systems and CI/CD pipelines.

## Table of Contents

1. [Git Integration](#git-integration)
2. [GitHub Integration](#github-integration)
3. [GitLab Integration](#gitlab-integration)
4. [CI/CD Integration](#cicd-integration)
5. [Test Runner Integration](#test-runner-integration)
6. [Security Scanner Integration](#security-scanner-integration)
7. [Webhook Configuration](#webhook-configuration)

---

## Git Integration

### Overview

The Git integration module automatically links commits to Linear issues based on commit messages and branch names.

### Setup

#### 1. Basic Configuration

```typescript
import { LinearAgentClient } from '@linear-toolkit/agent';

const linear = await LinearAgentClient.create({
  apiKey: process.env.LINEAR_API_KEY,
  cache: { enabled: true, ttl: 300 },
});

await linear.loadModule('git');
```

#### 2. Link Commit to Issues

```typescript
const result = await linear.executeModuleOperation('linkCommitToIssues', {
  commitHash: 'abc123def456',
  repositoryUrl: 'https://github.com/org/repo',
  commitMessage: 'Fix authentication flow - closes LIN-123',
  files: ['src/auth.ts', 'src/user.ts'],
});

// Result: { linked: 1, issues: ['LIN-123'] }
```

#### 3. Track Branch for Issues

```typescript
const tracking = await linear.executeModuleOperation('trackBranchForIssues', {
  branchName: 'feature/LIN-456-auth-improvements',
  repositoryUrl: 'https://github.com/org/repo',
});

// Automatically extracts 'LIN-456' from branch name
```

#### 4. Git Hooks Setup

**Post-commit hook** (`.git/hooks/post-commit`):

```bash
#!/bin/bash

# Get commit message
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse HEAD)
REPO_URL=$(git config --get remote.origin.url)

# Get changed files
FILES=$(git diff-tree --no-commit-id --name-only -r $COMMIT_HASH)

# Link commit to Linear issues
npx linear-toolkit link-commit \
  --hash "$COMMIT_HASH" \
  --repo "$REPO_URL" \
  --message "$COMMIT_MSG" \
  --files "$FILES"
```

**Pre-push hook** (`.git/hooks/pre-push`):

```bash
#!/bin/bash

# Validate that commit messages reference Linear issues
COMMITS=$(git log @{u}.. --format=%B)

if ! echo "$COMMITS" | grep -E '\bLIN-[0-9]+\b' > /dev/null; then
  echo "Error: Commit message must reference a Linear issue (e.g., LIN-123)"
  exit 1
fi

exit 0
```

#### 5. Automatic Linking

```typescript
// Setup webhook to auto-link commits
const webhookManager = new WebhookManager();

webhookManager.registerHandler('push', async (payload) => {
  for (const commit of payload.commits) {
    await linear.executeModuleOperation('linkCommitToIssues', {
      commitHash: commit.hash,
      repositoryUrl: payload.repository,
      commitMessage: commit.message,
      files: commit.files,
    });
  }
});
```

---

## GitHub Integration

### Overview

The GitHub integration module syncs pull requests with Linear issues, auto-transitions issues based on PR status, and creates issues from PR discussions.

### Setup

#### 1. GitHub App Installation

Create a GitHub App with the following permissions:

**Repository Permissions:**
- `pull_requests`: Read & Write
- `issues`: Read & Write
- `commit_statuses`: Read & Write
- `contents`: Read

**Webhook Events:**
- `pull_request`
- `pull_request_review`
- `issue_comment`

#### 2. Basic Configuration

```typescript
const linear = await LinearAgentClient.create({
  apiKey: process.env.LINEAR_API_KEY,
});

await linear.loadModule('github');

// Set GitHub credentials
process.env.GITHUB_TOKEN = 'ghp_xxxxxxxxxxxx';
process.env.GITHUB_APP_ID = '123456';
process.env.GITHUB_WEBHOOK_SECRET = 'whsec_xxxxxxxxxx';
```

#### 3. Link PR to Issue

```typescript
const result = await linear.executeModuleOperation('linkPullRequestToIssue', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456',
  autoTransition: true, // Auto-move to "In Review" state
});

// Result: { linked: true, transitioned: true, newState: 'In Review' }
```

#### 4. Sync PR Status to Linear

```typescript
// Auto-sync when PR status changes
const syncResult = await linear.executeModuleOperation('syncPullRequestStatus', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456',
});

// Maps PR states to Linear states:
// draft -> Backlog
// open -> In Review
// merged -> Done
// closed -> Cancelled
```

#### 5. GitHub Workflow Integration

**`.github/workflows/linear-sync.yml`:**

```yaml
name: Linear Sync

on:
  pull_request:
    types: [opened, reopened, synchronize, closed, merged]
  pull_request_review:
    types: [submitted, dismissed]

jobs:
  sync-with-linear:
    runs-on: ubuntu-latest
    steps:
      - name: Sync PR with Linear
        uses: linear-toolkit/github-action@v1
        with:
          linear_api_key: ${{ secrets.LINEAR_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          auto_transition: true
```

#### 6. Webhook Handler

```typescript
app.post('/github/webhook', async (req, res) => {
  const payload = req.body;

  if (payload.action === 'opened' || payload.action === 'reopened') {
    // Link PR to Linear issue
    const issueMatch = payload.pull_request.body.match(/\b(LIN-\d+)\b/);
    if (issueMatch) {
      await linear.executeModuleOperation('linkPullRequestToIssue', {
        prUrl: payload.pull_request.html_url,
        issueId: issueMatch[1],
        autoTransition: true,
      });
    }
  }

  if (payload.action === 'closed') {
    // Transition issue based on merge status
    const isMerged = payload.pull_request.merged;
    if (isMerged) {
      // Transition to Done
      await linear.transitionState(issueId, 'state-done');
    }
  }

  res.json({ ok: true });
});
```

---

## GitLab Integration

### Overview

Similar to GitHub integration, supports GitLab merge requests and auto-linking.

### Setup

#### 1. GitLab Project Integration

```typescript
const linear = await LinearAgentClient.create({
  apiKey: process.env.LINEAR_API_KEY,
});

process.env.GITLAB_TOKEN = 'glpat-xxxxxxxxxxxx';
process.env.GITLAB_URL = 'https://gitlab.com';
```

#### 2. Link Merge Request

```typescript
const result = await linear.executeModuleOperation('linkMergeRequestToIssue', {
  mrUrl: 'https://gitlab.com/org/repo/-/merge_requests/456',
  issueId: 'LIN-789',
  autoTransition: true,
});
```

#### 3. GitLab Webhook

**GitLab Project Settings → Webhooks:**

```
URL: https://your-api.com/gitlab/webhook
Trigger: Push events, Merge request events, Issue events
```

---

## CI/CD Integration

### GitHub Actions

**`.github/workflows/linear-ci.yml`:**

```yaml
name: Linear CI Integration

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Report to Linear
        if: always()
        uses: linear-toolkit/ci-action@v1
        with:
          linear_api_key: ${{ secrets.LINEAR_API_KEY }}
          issue_id: ${{ github.event.pull_request.body }}
          status: ${{ job.status }}
          build_url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### GitLab CI

**`.gitlab-ci.yml`:**

```yaml
stages:
  - build
  - test
  - report

variables:
  LINEAR_API_KEY: $LINEAR_API_KEY

build:
  stage: build
  script:
    - npm run build

test:
  stage: test
  script:
    - npm test

report_to_linear:
  stage: report
  script:
    - npx linear-toolkit report-build
      --issue-id ${CI_MERGE_REQUEST_DESCRIPTION}
      --status ${CI_JOB_STATUS}
      --url ${CI_PIPELINE_URL}
  when: always
```

### Jenkins

**Jenkinsfile:**

```groovy
pipeline {
  agent any

  environment {
    LINEAR_API_KEY = credentials('linear-api-key')
  }

  stages {
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Report to Linear') {
      steps {
        sh '''
          npx linear-toolkit report-build \
            --issue-id ${ISSUE_ID} \
            --status ${currentBuild.result} \
            --url ${BUILD_URL}
        '''
      }
    }
  }

  post {
    always {
      junit 'test-results/*.xml'
    }
  }
}
```

---

## Test Runner Integration

### Setup

```typescript
const linear = await LinearAgentClient.create({
  apiKey: process.env.LINEAR_API_KEY,
});

await linear.loadModule('testing');
```

### Report Test Results

```typescript
const testResults = {
  suite: 'unit-tests',
  total: 150,
  passed: 145,
  failed: 5,
  skipped: 0,
  duration: 12500, // ms
  tests: [
    {
      name: 'should authenticate user',
      status: 'passed',
      duration: 250,
    },
    {
      name: 'should handle invalid tokens',
      status: 'failed',
      error: 'AssertionError: expected 401 but got 200',
      duration: 500,
    },
  ],
};

const result = await linear.executeModuleOperation('reportTestResults', {
  testSuite: testResults,
  commitHash: 'abc123',
  branchName: 'feature/auth',
});

// Result: { created: 1, updated: 2 }
// Creates issues for failed tests, updates existing ones
```

### Jest Integration

**`jest.config.js`:**

```javascript
module.exports = {
  // ... other config
  reporters: [
    'default',
    [
      '<rootDir>/reporters/linear-reporter.js',
      {
        apiKey: process.env.LINEAR_API_KEY,
        issueIdPattern: /\b(LIN-\d+)\b/,
      },
    ],
  ],
};
```

**`reporters/linear-reporter.js`:**

```javascript
const { LinearAgentClient } = require('@linear-toolkit/agent');

class LinearReporter {
  constructor(globalConfig, options) {
    this.apiKey = options.apiKey;
    this.issueIdPattern = options.issueIdPattern;
  }

  async onTestResult(test, testResult) {
    if (!testResult.success && testResult.testResults) {
      const linear = await LinearAgentClient.create({
        apiKey: this.apiKey,
      });

      await linear.loadModule('testing');

      const failedTests = testResult.testResults.filter(
        (t) => t.status === 'failed'
      );

      for (const test of failedTests) {
        await linear.executeModuleOperation('createIssueFromFailure', {
          testName: test.title,
          error: test.failureMessages[0],
          file: testResult.testFilePath,
          commitHash: process.env.GIT_COMMIT,
        });
      }
    }
  }
}

module.exports = LinearReporter;
```

---

## Security Scanner Integration

### Snyk Integration

```typescript
const linear = await LinearAgentClient.create({
  apiKey: process.env.LINEAR_API_KEY,
});

await linear.loadModule('security');

// Report Snyk scan results
const snykResults = {
  scanner: 'snyk',
  vulnerabilities: [
    {
      id: 'SNYK-JS-LODASH-567890',
      title: 'Prototype Pollution',
      severity: 'high',
      description: 'Lodash versions < 4.17.17 are vulnerable...',
      cve: 'CVE-2019-10744',
      packageName: 'lodash',
      packageVersion: '4.17.15',
      fixedVersion: '4.17.17',
    },
  ],
};

const result = await linear.executeModuleOperation('reportSecurityScan', {
  report: snykResults,
  teamId: 'team-123',
  autoCreate: true, // Auto-create issues for new vulnerabilities
  minSeverity: 'high', // Only create issues for high/critical
});
```

### SAST Integration (e.g., Sonarqube)

```typescript
// Report SAST findings
await linear.executeModuleOperation('reportSecurityScan', {
  report: {
    scanner: 'sonarqube',
    vulnerabilities: [
      {
        id: 'js:S1234',
        title: 'SQL Injection Risk',
        severity: 'critical',
        location: {
          file: 'src/db.js',
          line: 45,
        },
      },
    ],
  },
  teamId: 'team-123',
  autoCreate: true,
});
```

### Dependency Check Integration

```typescript
// Report dependency vulnerabilities
await linear.executeModuleOperation('linkDependencyIssues', {
  vulnerabilities: [
    {
      component: 'mysql2@2.1.0',
      vulnerabilityId: 'CVE-2020-12345',
      severity: 'medium',
      description: 'XSS vulnerability in connection string handling',
    },
  ],
  teamId: 'team-123',
  createPRs: true, // Create PRs for dependency updates
});
```

---

## Webhook Configuration

### Webhook Manager Setup

```typescript
import { WebhookManager } from '@linear-toolkit/webhooks';

const webhooks = new WebhookManager();

// Register handlers for different events
webhooks.registerHandler('push', async (payload) => {
  console.log('Processing push event:', payload);
  // Link commits to issues
});

webhooks.registerHandler('pull_request', async (payload) => {
  console.log('Processing PR event:', payload);
  // Link PR to issue, auto-transition
});

webhooks.registerHandler('test_results', async (payload) => {
  console.log('Processing test results:', payload);
  // Create/update issues from test failures
});

webhooks.registerHandler('security_scan', async (payload) => {
  console.log('Processing security scan:', payload);
  // Create security issues
});
```

### Express Server Setup

```typescript
import express from 'express';
import { WebhookManager } from '@linear-toolkit/webhooks';

const app = express();
const webhooks = new WebhookManager();

app.use(express.json());

// Verify webhook signature
app.use((req, res, next) => {
  const signature = req.headers['x-linear-signature'] as string;
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifySignature(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

// Handle webhooks
app.post('/webhooks/linear', async (req, res) => {
  const payload = req.body;

  try {
    await webhooks.handleWebhook(payload);
    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Webhook Signature Verification

```typescript
import crypto from 'crypto';

function verifySignature(
  payload: Record<string, unknown>,
  signature: string,
  secret: string
): boolean {
  const payloadString = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');

  return signature === hash;
}
```

---

## Troubleshooting

### Common Issues

**Issue: Commits not linking to Linear issues**

```typescript
// Check issue pattern matching
const testMessage = 'Fix auth flow - closes LIN-123';
const pattern = /\b(LIN-\d+)\b/;
const matches = testMessage.match(pattern);
console.log('Extracted issues:', matches); // ['LIN-123']
```

**Issue: PR sync not working**

```typescript
// Verify GitHub token and permissions
const result = await linear.executeModuleOperation('syncPullRequestStatus', {
  prUrl: 'https://github.com/org/repo/pull/123',
  issueId: 'LIN-456',
});

console.log('Sync result:', result);
// Check for 403 (auth) or 404 (not found) errors
```

**Issue: Webhook not receiving events**

1. Verify webhook URL is publicly accessible
2. Check webhook secret matches configuration
3. Review webhook logs in GitHub/GitLab settings
4. Test with webhook.site temporarily for debugging

---

## Next Steps

- Configure your chosen integration (Git, GitHub, CI/CD, Tests, Security)
- Set up webhooks for auto-linking and auto-transitions
- Test the workflow with a sample commit/PR
- Monitor Linear issues for auto-created entries
- Adjust auto-linking rules as needed

For more details, see [API.md](./API.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
