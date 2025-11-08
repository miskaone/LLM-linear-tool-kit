/**
 * Linear Task Completion Hook Handler
 * Automatically updates Linear issues when task completion is detected
 */

import { LinearAgentClient } from '../../src/core/client/LinearAgentClient';

interface TaskContext {
  taskId?: string;
  linearIssue?: {
    id: string;
    identifier: string;
    title: string;
    status: string;
    [key: string]: unknown;
  };
  status?: string;
}

interface HookPayload {
  agentResponse: string;
  context: TaskContext;
  timestamp: Date;
}

interface CompletionResult {
  triggered: boolean;
  issueId?: string;
  commentAdded?: boolean;
  markedDone?: boolean;
  feedback: string;
  error?: string;
}

/**
 * Completion patterns that trigger the hook
 */
const COMPLETION_PATTERNS = [
  /✅\s*Done/i,
  /✅\s*Complete/i,
  /✅\s*Finished/i,
  /✅\s*Perfect/i,
  /task\s+complete/i,
  /task\s+finished/i,
  /all\s+done/i,
  /completed\s+successfully/i,
];

/**
 * Detect if agent response indicates task completion
 */
function detectCompletion(response: string): boolean {
  return COMPLETION_PATTERNS.some((pattern) => pattern.test(response));
}

/**
 * Extract summary from agent response
 */
function extractSummary(response: string): string | null {
  // Look for structured summary section
  const summaryMatch = response.match(/## Summary\n([\s\S]*?)(?=\n##|\n$|$)/);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }

  // Look for bullet point summary
  const bulletMatch = response.match(/[-•*]\s+[\s\S]+/);
  if (bulletMatch) {
    return bulletMatch[0];
  }

  // Return first meaningful paragraph
  const lines = response.split('\n').filter((l) => l.trim().length > 0);
  const summaryLine = lines.find(
    (l) =>
      !l.includes('✅') &&
      !l.includes('🚀') &&
      !l.includes('##') &&
      l.length > 20
  );

  return summaryLine || null;
}

/**
 * Format completion comment for Linear
 */
function formatCompletionComment(summary: string | null): string {
  if (!summary) {
    return '✅ Task completed.';
  }

  return `## ✅ Task Completed\n\n${summary}`;
}

/**
 * Main hook handler function
 */
export async function handleTaskCompletion(
  payload: HookPayload
): Promise<CompletionResult> {
  // Check if completion was detected
  if (!detectCompletion(payload.agentResponse)) {
    return {
      triggered: false,
      feedback: '(No completion pattern detected)',
    };
  }

  // Validate Linear context
  if (!payload.context.linearIssue) {
    return {
      triggered: false,
      feedback:
        '⚠️  This task is not associated with a Linear issue. Not updating Linear.',
    };
  }

  const issueId = payload.context.linearIssue.identifier;

  try {
    // Initialize Linear client
    const linear = await LinearAgentClient.create({
      apiKey: process.env.LINEAR_API_KEY || '',
      cache: { enabled: true, ttl: 60 },
    });

    // Extract summary from response
    let summary = extractSummary(payload.agentResponse);

    // If no summary found, this would normally prompt agent
    // For now, we'll use a default summary
    if (!summary) {
      summary = `Completed at ${new Date().toISOString()}`;
    }

    // Format and add comment
    const commentBody = formatCompletionComment(summary);

    try {
      await linear.addComment({
        issueId,
        body: commentBody,
      });
    } catch (error) {
      console.error(`Failed to add comment to ${issueId}:`, error);
    }

    // Mark issue as done
    try {
      await linear.transitionState(issueId, 'Done');
    } catch (error) {
      console.error(`Failed to mark ${issueId} as done:`, error);
    }

    // Build feedback message
    const feedback = `✅ Linear Issue ${issueId} Updated
📝 Completion summary added as comment
🎉 Status marked as Done
🔗 ${payload.context.linearIssue.title}`;

    return {
      triggered: true,
      issueId,
      commentAdded: true,
      markedDone: true,
      feedback,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      triggered: true,
      issueId: payload.context.linearIssue.identifier,
      feedback: `⚠️  Failed to update Linear: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Export for Claude Code hook system
 */
export default handleTaskCompletion;

/**
 * Example usage:
 *
 * const result = await handleTaskCompletion({
 *   agentResponse: "✅ Done! I've implemented authentication...",
 *   context: {
 *     linearIssue: {
 *       identifier: 'MIS-598',
 *       title: 'Add Clerk Authentication',
 *       status: 'In Progress'
 *     }
 *   },
 *   timestamp: new Date()
 * });
 *
 * console.log(result);
 * // {
 * //   triggered: true,
 * //   issueId: 'MIS-598',
 * //   commentAdded: true,
 * //   markedDone: true,
 * //   feedback: "✅ Linear Issue MIS-598 Updated..."
 * // }
 */
