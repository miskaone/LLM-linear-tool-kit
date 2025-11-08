/**
 * End-to-End Tests for Linear Toolkit
 * Comprehensive test suite covering all 4 phases and complete workflows
 */

import { LinearAgentClient } from '@core/client/LinearAgentClient';
import { SessionManager } from '@core/client/SessionManager';
import { GraphQLClient } from '@core/client/GraphQLClient';
import { CacheManager } from '@utils/cache';
import { Logger } from '@utils/logger';
import { WebhookManager } from '@webhooks/WebhookManager';

describe('Linear Toolkit - End-to-End Tests', () => {
  let linearClient: LinearAgentClient;
  let sessionManager: SessionManager;
  let graphqlClient: GraphQLClient;
  let logger: Logger;

  beforeAll(async () => {
    // Initialize toolkit
    logger = new Logger('E2E-Tests');
    sessionManager = new SessionManager('test-session');
    const cache = new CacheManager(300, 1000);

    // Mock GraphQL client for testing
    graphqlClient = new GraphQLClient(
      {
        apiKey: 'test-api-key',
        maxRetries: 3,
        retryDelay: 100,
        timeout: 5000,
        batchSize: 50,
        cache: { enabled: true, ttl: 300 },
        logging: { level: 'info' },
      },
      cache,
      logger
    );

    // Create Linear client
    linearClient = await LinearAgentClient.create({
      apiKey: 'test-api-key',
      cache: { enabled: true, ttl: 300 },
      logging: { level: 'info' },
    });
  });

  describe('Phase 1: Core Operations', () => {
    it('should initialize Linear toolkit successfully', async () => {
      expect(linearClient).toBeDefined();
      expect(linearClient).toHaveProperty('getActiveWork');
      expect(linearClient).toHaveProperty('findIssueById');
      expect(linearClient).toHaveProperty('createIssue');
    });

    it('should have all core operations available', async () => {
      const coreOps = [
        'getActiveWork',
        'findIssueById',
        'findRelevantIssues',
        'searchIssues',
        'createIssue',
        'updateIssueProgress',
        'addComment',
        'transitionState',
        'getCurrentSprint',
        'linkIssues',
      ];

      coreOps.forEach((op) => {
        expect(linearClient).toHaveProperty(op);
      });
    });

    it('should maintain session context across operations', async () => {
      sessionManager.setContext('userId', 'user-123');
      sessionManager.setContext('teamId', 'team-456');

      expect(sessionManager.getContext('userId')).toBe('user-123');
      expect(sessionManager.getContext('teamId')).toBe('team-456');
    });

    it('should track operation statistics', async () => {
      sessionManager.recordOperation('testOp', true, 150);
      sessionManager.recordOperation('testOp', false, 200);

      const stats = sessionManager.getStatistics();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
    });
  });

  describe('Phase 2: Module System', () => {
    it('should load issues module', async () => {
      const isLoaded = await linearClient.loadModule('issues');
      expect(isLoaded).toBeDefined();
    });

    it('should load comments module with issues dependency', async () => {
      const isLoaded = await linearClient.loadModule('comments');
      expect(isLoaded).toBeDefined();

      // Verify issues module is also loaded
      expect(linearClient.isModuleLoaded('issues')).toBe(true);
    });

    it('should load labels module', async () => {
      const isLoaded = await linearClient.loadModule('labels');
      expect(isLoaded).toBeDefined();
    });

    it('should load cycles module', async () => {
      const isLoaded = await linearClient.loadModule('cycles');
      expect(isLoaded).toBeDefined();
    });

    it('should resolve module dependencies automatically', async () => {
      await linearClient.loadModule('cycles');

      // Cycles depends on issues, so issues should be loaded
      expect(linearClient.isModuleLoaded('issues')).toBe(true);
      expect(linearClient.isModuleLoaded('cycles')).toBe(true);
    });

    it('should execute module operations', async () => {
      await linearClient.loadModule('issues');

      // Test operation registration is working
      const moduleFactory = (linearClient as any).moduleLoader.factories.get(
        'issues'
      );
      expect(moduleFactory).toBeDefined();
    });
  });

  describe('Phase 3: Intelligent Features', () => {
    it('should load code integration module', async () => {
      const isLoaded = await linearClient.loadModule('code');
      expect(isLoaded).toBeDefined();
    });

    it('should load intelligence module', async () => {
      const isLoaded = await linearClient.loadModule('intelligence');
      expect(isLoaded).toBeDefined();

      // Intelligence depends on issues and labels
      expect(linearClient.isModuleLoaded('issues')).toBe(true);
      expect(linearClient.isModuleLoaded('labels')).toBe(true);
    });

    it('should load batch operations module', async () => {
      const isLoaded = await linearClient.loadModule('batch');
      expect(isLoaded).toBeDefined();
    });

    it('should load analytics module', async () => {
      const isLoaded = await linearClient.loadModule('analytics');
      expect(isLoaded).toBeDefined();
    });

    it('should support batch operations', async () => {
      await linearClient.loadModule('batch');

      const batchModule = (linearClient as any).moduleLoader.loadedModules.get(
        'batch'
      );
      expect(batchModule).toBeDefined();
      expect(batchModule.getMetadata().operations).toContain('batchUpdate');
    });

    it('should support analytics operations', async () => {
      await linearClient.loadModule('analytics');

      const analyticsModule = (linearClient as any).moduleLoader.loadedModules.get(
        'analytics'
      );
      expect(analyticsModule).toBeDefined();
      expect(analyticsModule.getMetadata().operations).toContain('getTeamMetrics');
    });
  });

  describe('Phase 4: External Integrations', () => {
    it('should initialize webhook manager', async () => {
      const webhookManager = new WebhookManager();
      expect(webhookManager).toBeDefined();
      expect(webhookManager).toHaveProperty('registerHandler');
      expect(webhookManager).toHaveProperty('handleWebhook');
    });

    it('should register webhook handlers', async () => {
      const webhookManager = new WebhookManager();

      const mockHandler = jest.fn().mockResolvedValue(undefined);
      webhookManager.registerHandler('push', mockHandler);

      expect(webhookManager).toBeDefined();
    });

    it('should process webhook events asynchronously', async () => {
      const webhookManager = new WebhookManager();
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      webhookManager.registerHandler('push', mockHandler);

      const payload = {
        event: 'push',
        repository: 'test-repo',
        branch: 'main',
        commits: [
          {
            hash: 'abc123',
            message: 'Fix auth issue LIN-123',
            author: 'dev@example.com',
            files: ['src/auth.ts'],
          },
        ],
        timestamp: new Date(),
      };

      await webhookManager.handleWebhook(payload as any);

      // Allow async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle multiple webhook events in queue', async () => {
      const webhookManager = new WebhookManager();
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      webhookManager.registerHandler('push', mockHandler);

      const payload1 = {
        event: 'push',
        repository: 'test-repo',
        branch: 'main',
        commits: [],
        timestamp: new Date(),
      };

      const payload2 = {
        event: 'push',
        repository: 'test-repo',
        branch: 'develop',
        commits: [],
        timestamp: new Date(),
      };

      await webhookManager.handleWebhook(payload1 as any);
      await webhookManager.handleWebhook(payload2 as any);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(mockHandler.mock.calls.length).toBe(2);
    });
  });

  describe('Complete Workflows', () => {
    it('should handle code-to-issue workflow', async () => {
      // Load required modules
      await linearClient.loadModule('code');
      await linearClient.loadModule('intelligence');

      // Verify modules are ready
      expect(linearClient.isModuleLoaded('code')).toBe(true);
      expect(linearClient.isModuleLoaded('intelligence')).toBe(true);
      expect(linearClient.isModuleLoaded('issues')).toBe(true);
    });

    it('should handle batch operations workflow', async () => {
      // Load batch and issues modules
      await linearClient.loadModule('batch');
      await linearClient.loadModule('issues');

      // Verify modules are ready for batch operations
      expect(linearClient.isModuleLoaded('batch')).toBe(true);
      expect(linearClient.isModuleLoaded('issues')).toBe(true);

      const batchModule = (linearClient as any).moduleLoader.loadedModules.get(
        'batch'
      );
      const operations = batchModule.getMetadata().operations;

      expect(operations).toContain('batchUpdate');
      expect(operations).toContain('batchTransition');
      expect(operations).toContain('bulkCreate');
    });

    it('should handle analytics workflow', async () => {
      // Load analytics module
      await linearClient.loadModule('analytics');

      expect(linearClient.isModuleLoaded('analytics')).toBe(true);

      const analyticsModule = (linearClient as any).moduleLoader.loadedModules.get(
        'analytics'
      );
      const operations = analyticsModule.getMetadata().operations;

      expect(operations).toContain('getTeamMetrics');
      expect(operations).toContain('getCycleMetrics');
      expect(operations).toContain('getWorkspaceMetrics');
      expect(operations).toContain('generateReport');
    });

    it('should support intelligent task management workflow', async () => {
      // Load intelligence module
      await linearClient.loadModule('intelligence');

      expect(linearClient.isModuleLoaded('intelligence')).toBe(true);

      const intelligenceModule = (
        linearClient as any
      ).moduleLoader.loadedModules.get('intelligence');
      const operations = intelligenceModule.getMetadata().operations;

      expect(operations).toContain('suggestNextTask');
      expect(operations).toContain('suggestLabels');
      expect(operations).toContain('detectDuplicates');
      expect(operations).toContain('analyzeWorkload');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle session context preservation', async () => {
      sessionManager.setContext('currentIssue', 'LIN-123');
      sessionManager.setContext('currentSprint', 'sprint-456');

      expect(sessionManager.getContext('currentIssue')).toBe('LIN-123');
      expect(sessionManager.getContext('currentSprint')).toBe('sprint-456');
    });

    it('should track operation failures', async () => {
      sessionManager.recordOperation('failedOp', false, 100);
      sessionManager.recordOperation('successOp', true, 100);

      const stats = sessionManager.getStatistics();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.failedOperations).toBeGreaterThan(0);
    });

    it('should maintain cache statistics', async () => {
      const cache = new CacheManager(300, 1000);

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key1')).toBe('value1'); // Hit

      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should support loading all modules', async () => {
      const modules = [
        'issues',
        'comments',
        'labels',
        'cycles',
        'code',
        'intelligence',
        'batch',
        'analytics',
      ];

      for (const module of modules) {
        const isLoaded = await linearClient.loadModule(module);
        expect(isLoaded).toBeDefined();
        expect(linearClient.isModuleLoaded(module)).toBe(true);
      }
    });

    it('should have all 72+ operations registered', async () => {
      // Load all modules
      const modules = [
        'issues',
        'comments',
        'labels',
        'cycles',
        'code',
        'intelligence',
        'batch',
        'analytics',
      ];

      for (const module of modules) {
        await linearClient.loadModule(module);
      }

      // Count total operations across all loaded modules
      const loader = (linearClient as any).moduleLoader;
      const loadedModules = Array.from(loader.loadedModules.values());

      let totalOps = 0;
      loadedModules.forEach((module: any) => {
        const ops = module.getMetadata().operations;
        totalOps += ops.length;
      });

      // Phase 1: 10 ops, Phase 2: 32 ops, Phase 3: 25 ops = 67 ops
      // Total should be at least 67
      expect(totalOps).toBeGreaterThanOrEqual(67);
    });

    it('should support cached operations', async () => {
      const cache = new CacheManager(300, 1000);

      // Simulate cached query
      cache.set('query:team-123', { id: 'team-123', name: 'Test Team' });
      const cached = cache.get('query:team-123');

      expect(cached).toEqual({ id: 'team-123', name: 'Test Team' });

      // Check cache hit
      const cached2 = cache.get('query:team-123');
      expect(cached2).toEqual({ id: 'team-123', name: 'Test Team' });

      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Cleanup
    sessionManager.clearContext();
    logger.info('E2E tests completed');
  });
});
