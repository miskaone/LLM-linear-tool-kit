# Linear Task Completion Hook

Automatically updates Linear issues when agent or user signals task completion.

## Hook Configuration

```
Hook Name: task-completion
Trigger: Agent/user indicates task is complete
Scope: Linear tasks only (must have issueId in context)
Action: Update issue status to Done + add summary comment
```

## Completion Signals

The hook triggers when the agent's response contains any of these patterns:

### Direct Completion Signals
- `✅ Done`
- `✅ Complete`
- `✅ Finished`
- `✅ Perfect`
- `Task complete`
- `Task finished`
- `All done`
- `Completed successfully`

### Summary Section Pattern
When agent provides a structured summary like:

```
✅ Complete!

## Summary
- Implemented authentication flow
- Added unit tests (95% coverage)
- Updated documentation
- Ready for deployment
```

### Checklist Completion Pattern
```
✅ Feature implementation
✅ Testing complete
✅ Code review passed
✅ Documentation updated
```

## How It Works

### 1. Completion Detection
Watches agent response for completion patterns:
```
Agent: "✅ All authentication features implemented and tested!"
Hook: Detects ✅ pattern → Triggers
```

### 2. Validate Linear Context
Checks that agent is working on a Linear task:
```javascript
{
  task: {
    issueId: "MIS-598",
    issue: { /* full issue object */ }
  }
}
```

### 3. Collect Summary
If agent provided summary in response, use it.
If not provided, prompt agent:
```
No summary detected. Please provide a brief summary of work completed:
```

### 4. Update Linear
Once summary is available:

```typescript
// 1. Add comment with summary
await linear.addComment({
  issueId: 'MIS-598',
  body: '## Task Completed\n\n' + summary
});

// 2. Mark issue as done
await linear.markDone({
  issueId: 'MIS-598'
});
```

### 5. Feedback to Agent
```
✅ Issue MIS-598 marked as Done
📝 Added completion summary comment
🎉 Task updated in Linear successfully
```

## Configuration

### Customize Completion Patterns

Edit `.claude/hooks/task-completion-config.json`:

```json
{
  "enabled": true,
  "patterns": [
    "✅ Done",
    "✅ Complete",
    "task complete"
  ],
  "addCommentOnComplete": true,
  "autoMarkDone": true,
  "requireSummary": true,
  "summaryPrompt": "Please provide a summary of work completed"
}
```

### Disable Hook

Set `enabled: false` in config above.

## Task Context Structure

When a Linear task is engaged, context looks like:

```javascript
{
  taskId: "task-abc123",
  linearIssue: {
    id: "48e54c86-1dd3-46da-a2eb-5aac7409ed30",
    identifier: "MIS-598",
    title: "Add Clerk Authentication to React App",
    description: "... full description ...",
    status: "In Progress",
    priority: { value: 2, name: "High" },
    assignee: "Mike Lydick",
    assigneeId: "26e7e250-ec40-445c-96d5-f9ee42e2c7a1",
    createdAt: "2025-11-07T12:38:58.430Z",
    updatedAt: "2025-11-08T06:30:27.376Z",
    url: "https://linear.app/miskaone/issue/MIS-598/..."
  },
  status: "in_progress"
}
```

## Examples

### Example 1: Simple Completion

**Agent Response:**
```
✅ Done! I've successfully implemented all Clerk authentication features:
- Apple Sign In configured and tested
- Google OAuth working on all platforms
- Facebook Login integrated
- Email/password signup complete
```

**Hook Action:**
1. Detects `✅ Done` pattern
2. Extracts summary from response
3. Adds comment to MIS-598
4. Marks MIS-598 as Done
5. Confirms: "✅ Issue MIS-598 marked as Done"

### Example 2: With Structured Summary

**Agent Response:**
```
Perfect! ✅

## Summary of Work Completed

### Features Implemented
- ClerkProvider wrapper in main.tsx
- SignIn component with Apple/Google/Facebook/Email options
- Protected routes for authenticated users
- User session persistence

### Files Modified
- src/main.tsx - Added ClerkProvider
- src/components/Auth.tsx - New authentication component
- src/App.tsx - Protected routes
- .env.local - Clerk configuration

### Testing
- Local testing with all 4 auth methods ✅
- Session persistence verified ✅
- Logout clears credentials ✅

### Status
Ready for deployment to Cloudflare Pages
```

**Hook Action:**
1. Detects `✅` pattern
2. Extracts detailed summary
3. Adds as comment with formatting preserved
4. Marks done
5. Feedback: "✅ Issue MIS-598 marked as Done with detailed summary"

### Example 3: No Summary Provided

**Agent Response:**
```
✅ Complete!
```

**Hook Action:**
1. Detects `✅ Complete` pattern
2. **No summary found** → Prompts agent:
   ```
   I detected task completion! No summary was provided.
   Please provide a brief summary of what was accomplished.
   ```
3. Agent provides summary
4. Hook proceeds with update

### Example 4: Work Outside of Task (Hook Does NOT Trigger)

**Agent Response:**
```
I've also fixed some unrelated bugs in the caching system.
✅ That cleanup is done too!
```

**Hook Behavior:**
- Context doesn't have `linearIssue` for the cache fix
- Hook only triggers for Linear tasks
- User/Agent is responsible for manually updating
- Response: "To update cache fix status, use: `linear.markIssue('ISSUE-ID', 'Done')`"

## Extensibility

Future expansions of hook system:

### PR-Ready Signal
```
🚀 PR is ready to merge: #123
```
→ Triggers: Link PR to issue, auto-transition to "Review"

### Subtask Completion
```
✅ Subtask completed: "Add unit tests"
```
→ Triggers: Mark subtask done, update parent progress

### Bulk Updates
```
✅ Completed multiple tasks: MIS-598, MIS-599, MIS-600
```
→ Triggers: Batch update all to Done

## Troubleshooting

### Hook Not Triggering

**Problem:** Completion pattern recognized but hook didn't fire

**Diagnosis:**
1. Check that task context includes `linearIssue`
2. Verify LINEAR_API_KEY is set
3. Check hook is enabled in config
4. Review completion pattern matches

**Solution:**
```bash
# Manually trigger update
linear.markIssue('MIS-598', 'Done');
linear.addComment('MIS-598', 'Summary of work...');
```

### Comment Not Posted

**Problem:** Hook triggered but comment wasn't added

**Diagnosis:**
1. Check API key has comment permissions
2. Verify issue ID is correct
3. Check issue is not archived

**Solution:**
```bash
# Check API key
echo $LINEAR_API_KEY

# Test API connection
curl https://api.linear.app/graphql -H "Authorization: Bearer $LINEAR_API_KEY"
```

## Best Practices

1. **Always include summary** - Even brief summaries help track progress
2. **Use consistent patterns** - Stick to `✅` for completions
3. **One task per session** - Complete and move to next task
4. **Review updates** - Check Linear to confirm update was successful
5. **Manual override** - Can always manually update if hook fails

## Related Documentation

- [Linear Skill](../skills/linear-toolkit.json) - Main skill interface
- [Operation Index](../linear-operations-index.json) - All available operations
- [Integration Guides](../docs/INTEGRATION_GUIDES.md) - Webhook setup
- [API Reference](../docs/API.md) - Full operation details
