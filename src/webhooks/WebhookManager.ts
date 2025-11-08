/**
 * Webhook Manager for Linear Toolkit
 * Handles incoming webhooks from external services and routes them to appropriate handlers
 */

import { getLogger } from '@utils/logger';

export type WebhookEventType =
  | 'push'
  | 'pull_request'
  | 'pull_request_review'
  | 'test_results'
  | 'security_scan'
  | 'issue_comment'
  | 'issue_state_change';

export interface WebhookPayload {
  event: WebhookEventType;
  source: string; // github, gitlab, circleci, snyk, etc.
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface WebhookHandler {
  event: WebhookEventType;
  handler: (payload: WebhookPayload) => Promise<void>;
}

export interface WebhookConfig {
  secret?: string;
  retryAttempts?: number;
  timeout?: number;
  validateSignature?: boolean;
}

export class WebhookManager {
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private config: WebhookConfig;
  private logger = getLogger('WebhookManager');
  private eventQueue: WebhookPayload[] = [];
  private processing = false;

  constructor(config: WebhookConfig = {}) {
    this.config = {
      retryAttempts: 3,
      timeout: 30000,
      validateSignature: true,
      ...config,
    };

    this.initializeDefaultHandlers();
  }

  /**
   * Register a webhook handler
   */
  registerHandler(event: WebhookEventType, handler: (payload: WebhookPayload) => Promise<void>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    this.handlers.get(event)!.push({ event, handler });
    this.logger.debug(`Handler registered for event: ${event}`);
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Validate payload
      if (!payload.event || !payload.source) {
        throw new Error('Invalid webhook payload: missing event or source');
      }

      this.logger.info(`Webhook received: ${payload.event} from ${payload.source}`);

      // Queue for processing
      this.eventQueue.push(payload);
      await this.processQueue();
    } catch (error) {
      this.logger.error('Failed to handle webhook', error);
      throw error;
    }
  }

  /**
   * Process queued webhooks
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.eventQueue.length > 0) {
        const payload = this.eventQueue.shift()!;
        await this.processPayload(payload);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single webhook payload
   */
  private async processPayload(payload: WebhookPayload): Promise<void> {
    const handlers = this.handlers.get(payload.event) || [];

    if (handlers.length === 0) {
      this.logger.warn(`No handlers registered for event: ${payload.event}`);
      return;
    }

    for (const { handler } of handlers) {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Handler timeout')), this.config.timeout)
        );

        await Promise.race([handler(payload), timeout]);
        this.logger.debug(`Handler completed for event: ${payload.event}`);
      } catch (error) {
        this.logger.error(`Handler failed for event: ${payload.event}`, error);
        // Continue with next handler
      }
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(
    payload: string,
    signature: string,
    algorithm: string = 'sha256'
  ): boolean {
    if (!this.config.secret || !this.config.validateSignature) {
      return true;
    }

    // TODO: Implement HMAC signature verification
    // const crypto = require('crypto');
    // const hash = crypto.createHmac(algorithm, this.config.secret).update(payload).digest('hex');
    // return hash === signature;

    return true;
  }

  /**
   * Initialize default webhook handlers
   */
  private initializeDefaultHandlers(): void {
    // Push event handler
    this.registerHandler('push', this.handlePushEvent.bind(this));

    // Pull request event handler
    this.registerHandler('pull_request', this.handlePullRequestEvent.bind(this));

    // Test results handler
    this.registerHandler('test_results', this.handleTestResultsEvent.bind(this));

    // Security scan handler
    this.registerHandler('security_scan', this.handleSecurityScanEvent.bind(this));

    this.logger.info('Default webhook handlers initialized');
  }

  /**
   * Handle push events
   */
  private async handlePushEvent(payload: WebhookPayload): Promise<void> {
    this.logger.info('Processing push event', {
      source: payload.source,
      timestamp: payload.timestamp,
    });

    // TODO: Extract commit info and route to code integration
    // TODO: Auto-link commits to Linear issues
  }

  /**
   * Handle pull request events
   */
  private async handlePullRequestEvent(payload: WebhookPayload): Promise<void> {
    this.logger.info('Processing pull request event', {
      source: payload.source,
      action: (payload.data as any).action,
    });

    // TODO: Link PR to Linear issues
    // TODO: Auto-transition issues based on PR state
  }

  /**
   * Handle test results events
   */
  private async handleTestResultsEvent(payload: WebhookPayload): Promise<void> {
    this.logger.info('Processing test results event', {
      source: payload.source,
    });

    // TODO: Report test results to Linear
    // TODO: Update issue with test status
  }

  /**
   * Handle security scan events
   */
  private async handleSecurityScanEvent(payload: WebhookPayload): Promise<void> {
    this.logger.info('Processing security scan event', {
      source: payload.source,
    });

    // TODO: Process security scan results
    // TODO: Create issues for vulnerabilities
  }

  /**
   * Get webhook statistics
   */
  getStats(): {
    handlers: number;
    queueSize: number;
    processing: boolean;
  } {
    return {
      handlers: this.handlers.size,
      queueSize: this.eventQueue.length,
      processing: this.processing,
    };
  }

  /**
   * Get registered event types
   */
  getRegisteredEvents(): WebhookEventType[] {
    return Array.from(this.handlers.keys()) as WebhookEventType[];
  }
}
