/**
 * Webhook Manager for Linear Toolkit
 * Handles incoming webhooks from external services and routes them to appropriate handlers
 */
export type WebhookEventType = 'push' | 'pull_request' | 'pull_request_review' | 'test_results' | 'security_scan' | 'issue_comment' | 'issue_state_change';
export interface WebhookPayload {
    event: WebhookEventType;
    source: string;
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
export declare class WebhookManager {
    private handlers;
    private config;
    private logger;
    private eventQueue;
    private processing;
    constructor(config?: WebhookConfig);
    /**
     * Register a webhook handler
     */
    registerHandler(event: WebhookEventType, handler: (payload: WebhookPayload) => Promise<void>): void;
    /**
     * Handle incoming webhook
     */
    handleWebhook(payload: WebhookPayload): Promise<void>;
    /**
     * Process queued webhooks
     */
    private processQueue;
    /**
     * Process a single webhook payload
     */
    private processPayload;
    /**
     * Verify webhook signature
     */
    verifySignature(payload: string, signature: string, algorithm?: string): boolean;
    /**
     * Initialize default webhook handlers
     */
    private initializeDefaultHandlers;
    /**
     * Handle push events
     */
    private handlePushEvent;
    /**
     * Handle pull request events
     */
    private handlePullRequestEvent;
    /**
     * Handle test results events
     */
    private handleTestResultsEvent;
    /**
     * Handle security scan events
     */
    private handleSecurityScanEvent;
    /**
     * Get webhook statistics
     */
    getStats(): {
        handlers: number;
        queueSize: number;
        processing: boolean;
    };
    /**
     * Get registered event types
     */
    getRegisteredEvents(): WebhookEventType[];
}
//# sourceMappingURL=WebhookManager.d.ts.map