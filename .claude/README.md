# Claude Code Integration - Linear Toolkit

This directory contains Claude Code hooks and configurations that enable seamless Linear issue management automation.

## Overview

The Linear Toolkit integrates with Claude Code through:

1. **Claude Skill** (`../skills/linear-toolkit.json`) - Main interface for querying and updating Linear
2. **Task Completion Hook** (`./hooks/task-completion.md`) - Auto-updates Linear when agent completes work
3. **Operation Index** (`../linear-operations-index.json`) - Lazy-loaded operation definitions

## Architecture

```
Claude Agent Working on Linear Task
  ↓
  ├─ Query Linear? → Uses Skill (via query_issue, search_issues, etc.)
  │
  └─ Task Complete? → Hook Detects Completion
      ↓
      ├─ Validates Linear context (has issueId)
      ├─ Extracts summary from agent response
      ├─ Adds comment to Linear issue
      ├─ Marks issue as Done
      └─ Provides feedback to agent
```

## Files

### `hooks/`

#### `task-completion.md`
Documentation and configuration for the task completion hook. Describes:
- How completion is detected
- What patterns trigger the hook
- How summary is extracted
- How Linear is updated
- Examples and troubleshooting

#### `task-completion-config.json`
Configuration file for hook behavior:
- Enable/disable hook
- Customize completion patterns
- Configure error handling
- Set up extensions for future features

#### `task-completion-handler.ts`
TypeScript implementation of the hook handler:
- `detectCompletion()` - Identifies completion signals
- `extractSummary()` - Extracts work summary from response
- `handleTaskCompletion()` - Main hook logic
- Integrates with LinearAgentClient for Linear API calls

## Workflow Examples

### Example 1: User Asks About Issue Status

**User:** "What's the status of MIS-598?"

**Claude:**
1. Uses `query_issue` tool from Linear Skill
2. Queries Linear API for MIS-598
3. Returns: "MIS-598 is currently In Progress, assigned to Mike Lydick"

**Hook Status:** Not triggered (just querying)

### Example 2: Agent Completes Linear Task

**Initial Setup:**
- User: "Work on MIS-598: Add Clerk Authentication"
- Task context includes: `{ linearIssue: { identifier: 'MIS-598', ... } }`

**Agent Works:**
```
I'll implement Clerk authentication with Apple Sign In, Google OAuth, and Facebook login...
[agent does work]

✅ Complete! I've successfully implemented:
- ClerkProvider wrapper in main.tsx
- SignIn component with all 4 auth methods
- Protected routes for authenticated users
- Comprehensive testing

Ready for deployment! 🚀
```

**Hook Triggers:**
1. Detects `✅ Complete` pattern in response
2. Validates Linear context exists (MIS-598)
3. Extracts summary from bullet points
4. Calls Linear API:
   - `addComment(MIS-598, "## ✅ Task Completed\n- ClerkProvider...")`
   - `transitionState(MIS-598, 'Done')`
5. Provides feedback:
   ```
   ✅ Linear Issue MIS-598 Updated
   📝 Completion summary added as comment
   🎉 Status marked as Done
   🔗 Add Clerk Authentication to React App
   ```

### Example 3: Multiple Issues (Hook Only Triggers for Linear Tasks)

**Agent Works:**
```
I've fixed the caching system (that was a bug I noticed).
✅ That's done too!

Now for the Linear task:
I've implemented the authentication feature.
✅ Complete!
```

**Hook Behavior:**
- First completion (`caching system`) - No Linear context → Skipped
- Second completion (`authentication feature`) - Has Linear context → Triggered
- Only MIS-598 is updated in Linear
- User is informed that caching fix should be manually tracked

## Configuration

### Enable/Disable Hook

Edit `hooks/task-completion-config.json`:

```json
{
  "enabled": false  // Set to true to enable
}
```

### Customize Completion Patterns

Edit `hooks/task-completion-config.json`:

```json
{
  "completion_patterns": {
    "direct_signals": [
      "✅ Done",
      "✅ Complete",
      "🎉 Finished",  // Add custom pattern
      "task complete"
    ]
  }
}
```

### Custom Comment Format

In `task-completion-handler.ts`, modify `formatCompletionComment()`:

```typescript
function formatCompletionComment(summary: string | null): string {
  return `
  ## Custom Header

  ${summary}

  Last updated: ${new Date().toISOString()}
  `;
}
```

## Integration with Linear Skill

### Query Operations (User/Agent Initiated)

```
User: "What's MIS-598's status?"

Claude uses Skill:
  query_issue(issue_id: "MIS-598")
    ↓
  LinearAgentClient.findIssueById("MIS-598")
    ↓
  Returns full issue object
```

### Update Operations (User/Agent Initiated)

```
User: "Create a new issue for testing"

Claude uses Skill:
  create_issue(
    title: "Add tests",
    description: "...",
    team_id: "team-123"
  )
    ↓
  LinearAgentClient.createIssue(...)
    ↓
  Returns new issue
```

### Automatic Operations (Hook Initiated)

```
Agent: "✅ Done!"

Hook detects completion:
  handleTaskCompletion()
    ↓
  linearClient.addComment(...)
  linearClient.transitionState(..., 'Done')
    ↓
  Provides feedback
```

## Context Structure

When working on a Linear task, context includes:

```typescript
{
  // Task metadata
  taskId: "task-abc123",
  status: "in_progress",

  // Full Linear issue object
  linearIssue: {
    id: "48e54c86-1dd3-46da-a2eb-5aac7409ed30",
    identifier: "MIS-598",
    title: "Add Clerk Authentication to React App",
    description: "Implement professional authentication using Clerk...",
    status: "In Progress",
    priority: { value: 2, name: "High" },
    assignee: "Mike Lydick",
    assigneeId: "26e7e250-ec40-445c-96d5-f9ee42e2c7a1",
    createdAt: "2025-11-07T12:38:58.430Z",
    updatedAt: "2025-11-08T06:30:27.376Z",
    url: "https://linear.app/miskaone/issue/MIS-598/...",
    // ... additional fields
  }
}
```

## Operation Index

The `../linear-operations-index.json` file contains:

- **4 Categories**: Query, Create, Update, Transition
- **93 Operations**: All available toolkit operations
- **Lazy Loading**: Operations loaded on-demand, not all in context
- **Metadata**: Description, parameters, return types for each operation

Used by:
- Claude Skill for operation discovery
- Hooks for available operations
- Documentation for reference

## Error Handling

### Hook Triggers But Fails

**Scenario:** Hook detects completion but Linear API call fails

**Behavior:**
1. Catches error and logs it
2. Returns feedback with error message
3. User can manually update Linear or retry

**Example:**
```
⚠️ Failed to update Linear: API Rate Limit Exceeded
Try again in a few moments
```

### No Linear Context

**Scenario:** Agent completes task but context doesn't have linearIssue

**Behavior:**
1. Hook detects completion pattern
2. Validates context - no linearIssue found
3. Skips hook
4. Returns feedback to user:
```
⚠️ This task is not associated with a Linear issue. Not updating Linear.
To update manually, use: linear.markIssue('ISSUE-ID', 'Done')
```

### Missing Summary

**Scenario:** Agent signals completion with no work summary

**Behavior:**
1. Hook detects completion
2. Tries to extract summary - none found
3. If required, would prompt agent for summary
4. Creates default summary if optional

**Example:**
```
Agent: "✅ Done!"
Hook: "No summary provided. Please describe what was completed:"
Agent: "Added authentication flow, wrote tests, updated docs"
Hook: Proceeds with update
```

## Testing Hook Locally

### Manual Test

```typescript
import { handleTaskCompletion } from './hooks/task-completion-handler';

const result = await handleTaskCompletion({
  agentResponse: '✅ Complete! I\'ve implemented authentication.',
  context: {
    linearIssue: {
      identifier: 'MIS-598',
      title: 'Add Clerk Authentication',
      status: 'In Progress'
    }
  },
  timestamp: new Date()
});

console.log(result);
// Output:
// {
//   triggered: true,
//   issueId: 'MIS-598',
//   commentAdded: true,
//   markedDone: true,
//   feedback: "✅ Linear Issue MIS-598 Updated..."
// }
```

### Test Pattern Detection

```typescript
import { detectCompletion } from './hooks/task-completion-handler';

console.log(detectCompletion('✅ Done!')); // true
console.log(detectCompletion('✅ Complete')); // true
console.log(detectCompletion('Task finished')); // true
console.log(detectCompletion('Still working...')); // false
```

## Troubleshooting

### Hook Not Triggering

**Check:**
1. Is hook enabled in `task-completion-config.json`?
2. Is context including `linearIssue`?
3. Does agent response match completion pattern?
4. Is LINEAR_API_KEY set?

**Debug:**
```bash
# Check API key is set
echo $LINEAR_API_KEY

# Check hook config
cat .claude/hooks/task-completion-config.json | grep enabled

# Manually test handler
npx ts-node .claude/hooks/task-completion-handler.ts
```

### Comment Not Posting

**Check:**
1. Is API key valid?
2. Does issue exist in Linear?
3. Is issue not archived?
4. Do you have comment permission?

**Solution:**
```bash
# Test API connection
curl https://api.linear.app/graphql \
  -H "Authorization: Bearer $LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"query{viewer{id}}"}'
```

## Future Extensions

Hook system is designed to expand for:

1. **PR Auto-Linking**
   ```
   Agent: "🚀 PR #123 is ready to merge"
   Hook: Auto-link PR, transition to "Review", add PR link
   ```

2. **Subtask Completion**
   ```
   Agent: "✅ Subtask done: Add unit tests"
   Hook: Mark subtask done, update parent progress
   ```

3. **Bulk Updates**
   ```
   Agent: "✅ Completed: MIS-598, MIS-599, MIS-600"
   Hook: Batch update all issues to Done
   ```

## Key Files

| File | Purpose |
|------|---------|
| `task-completion.md` | Hook documentation and examples |
| `task-completion-config.json` | Hook configuration |
| `task-completion-handler.ts` | Hook implementation |
| `../skills/linear-toolkit.json` | Main Claude Skill |
| `../linear-operations-index.json` | Operation definitions |
| `../docs/API.md` | Full API reference |

## Related Documentation

- [Linear Skill Documentation](../skills/linear-toolkit.json)
- [Operation Index](../linear-operations-index.json)
- [Full API Reference](../docs/API.md)
- [Integration Guides](../docs/INTEGRATION_GUIDES.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)

## Support

For issues or questions:
1. Check [task-completion.md](./hooks/task-completion.md) for examples
2. Review [task-completion-config.json](./hooks/task-completion-config.json) for configuration
3. Check logs from `task-completion-handler.ts` execution
4. Refer to main [API.md](../docs/API.md) for operation details
