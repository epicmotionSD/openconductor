/**
 * OpenConductor MCP Integration Test Suite
 * 
 * Comprehensive tests for all MCP functionality including server registry,
 * semantic search, workflows, billing, community features, and security.
 */

import { Pool } from 'pg';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { EventBusImpl } from '../../core/event-bus';
import { 
  MCPServerRegistry,
  createMCPServerRegistry,
  MCPServer 
} from '../server-registry';
import { 
  MCPSemanticSearchEngine,
  OpenAIEmbeddingProvider,
  createSemanticSearchEngine 
} from '../semantic-search-engine';
import { 
  MCPBillingSystem,
  createMCPBillingSystem,
  SUBSCRIPTION_PLANS 
} from '../billing-system';
import { 
  MCPAnalyticsEngine,
  createMCPAnalyticsEngine 
} from '../analytics-engine';
import { 
  MCPCommunityFeatures,
  createMCPCommunityFeatures 
} from '../community-features';
import { 
  MCPEnterpriseSecurity,
  createMCPEnterpriseSecurity 
} from '../enterprise-security';

// Mock implementations for testing
class MockLogger implements Logger {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  critical = jest.fn();
}

class MockErrorManager extends ErrorManager {
  constructor() {
    super(new MockLogger());
  }
}

class MockEmbeddingProvider {
  async generateEmbedding(text: string): Promise<number[]> {
    // Return mock embedding (1536 dimensions)
    return new Array(1536).fill(0).map(() => Math.random());
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map(() => this.generateEmbedding(''));
  }
}

describe('MCP Integration Test Suite', () => {
  let pool: Pool;
  let logger: Logger;
  let errorManager: ErrorManager;
  let eventBus: EventBusImpl;
  let serverRegistry: MCPServerRegistry;
  let semanticSearch: MCPSemanticSearchEngine;
  let billingSystem: MCPBillingSystem;
  let analyticsEngine: MCPAnalyticsEngine;
  let communityFeatures: MCPCommunityFeatures;
  let enterpriseSecurity: MCPEnterpriseSecurity;

  beforeAll(async () => {
    // Setup test database connection
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'openconductor_test',
      user: process.env.TEST_DB_USER || 'test',
      password: process.env.TEST_DB_PASSWORD || 'test'
    });

    logger = new MockLogger();
    errorManager = new MockErrorManager();
    eventBus = new EventBusImpl(logger, errorManager);

    // Initialize MCP components
    serverRegistry = createMCPServerRegistry(pool, logger, errorManager, eventBus);
    
    const mockEmbedding = new MockEmbeddingProvider();
    semanticSearch = createSemanticSearchEngine(pool, logger, errorManager, mockEmbedding as any);
    
    if (process.env.STRIPE_SECRET_KEY) {
      billingSystem = createMCPBillingSystem(
        process.env.STRIPE_SECRET_KEY,
        pool, logger, errorManager, eventBus
      );
    }
    
    analyticsEngine = createMCPAnalyticsEngine(pool, logger, errorManager, eventBus);
    communityFeatures = createMCPCommunityFeatures(pool, logger, errorManager, eventBus);
    enterpriseSecurity = createMCPEnterpriseSecurity(pool, logger, errorManager, eventBus);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean test data before each test
    await cleanTestData();
  });

  describe('MCP Server Registry', () => {
    const mockServer = {
      name: 'test-server',
      display_name: 'Test Server',
      description: 'A test MCP server for unit testing',
      transport_type: 'stdio' as const,
      categories: ['testing', 'utilities'],
      tags: ['test', 'mock', 'development'],
      use_cases: ['unit testing', 'development', 'mocking'],
      npm_package: '@test/mcp-server',
      version: '1.0.0'
    };

    test('should create server successfully', async () => {
      const server = await serverRegistry.createServer(mockServer, 'test-user-1');
      
      expect(server).toBeDefined();
      expect(server.id).toBeDefined();
      expect(server.name).toBe(mockServer.name);
      expect(server.display_name).toBe(mockServer.display_name);
      expect(server.status).toBe('pending');
      expect(server.download_count).toBe(0);
      expect(server.star_count).toBe(0);
    });

    test('should prevent duplicate server names', async () => {
      await serverRegistry.createServer(mockServer, 'test-user-1');
      
      await expect(
        serverRegistry.createServer(mockServer, 'test-user-2')
      ).rejects.toThrow('already exists');
    });

    test('should retrieve server by id', async () => {
      const created = await serverRegistry.createServer(mockServer, 'test-user-1');
      const retrieved = await serverRegistry.getServer(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe(mockServer.name);
    });

    test('should update server successfully', async () => {
      const created = await serverRegistry.createServer(mockServer, 'test-user-1');
      const updates = {
        description: 'Updated description',
        tags: ['updated', 'test']
      };
      
      const updated = await serverRegistry.updateServer(created.id, updates, 'test-user-1');
      
      expect(updated.description).toBe(updates.description);
      expect(updated.tags).toEqual(updates.tags);
    });

    test('should search servers with filters', async () => {
      await serverRegistry.createServer(mockServer, 'test-user-1');
      await serverRegistry.createServer({
        ...mockServer,
        name: 'another-test-server',
        categories: ['database', 'sql']
      }, 'test-user-1');

      const searchResult = await serverRegistry.searchServers({
        categories: ['testing'],
        limit: 10
      });

      expect(searchResult.servers.length).toBeGreaterThan(0);
      expect(searchResult.servers[0].categories).toContain('testing');
    });
  });

  describe('Semantic Search Engine', () => {
    test('should perform semantic search', async () => {
      // Create test server with description
      const server = await serverRegistry.createServer({
        ...mockServer,
        description: 'Database connection and query execution server'
      }, 'test-user-1');

      // Update embeddings
      await semanticSearch.updateServerEmbeddings(
        server.id,
        server.description,
        server.use_cases
      );

      // Perform semantic search
      const searchResult = await semanticSearch.semanticSearch({
        semantic_query: 'database operations',
        use_semantic_search: true,
        limit: 5
      });

      expect(searchResult.servers).toBeDefined();
      expect(searchResult.query_info.semantic_search_used).toBe(true);
    });

    test('should get similar servers', async () => {
      const server1 = await serverRegistry.createServer(mockServer, 'test-user-1');
      const server2 = await serverRegistry.createServer({
        ...mockServer,
        name: 'similar-server',
        description: 'Another test server with similar functionality'
      }, 'test-user-1');

      await semanticSearch.updateServerEmbeddings(server1.id, server1.description);
      await semanticSearch.updateServerEmbeddings(server2.id, server2.description);

      const similarServers = await semanticSearch.getSimilarServers(server1.id, 3);
      
      expect(Array.isArray(similarServers)).toBe(true);
    });

    test('should batch update embeddings', async () => {
      // Create multiple servers
      for (let i = 0; i < 5; i++) {
        await serverRegistry.createServer({
          ...mockServer,
          name: `test-server-${i}`,
          description: `Test server number ${i} for batch processing`
        }, 'test-user-1');
      }

      const processed = await semanticSearch.batchUpdateEmbeddings(10);
      expect(processed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Billing System', () => {
    const mockUserId = 'test-user-billing';

    test('should create free subscription', async () => {
      if (!billingSystem) {
        return; // Skip if Stripe not configured
      }

      const subscription = await billingSystem.createSubscription(
        mockUserId,
        'free'
      );

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe('free');
      expect(subscription.status).toBe('active');
    });

    test('should track usage events', async () => {
      if (!billingSystem) {
        return;
      }

      const usageEvent = {
        user_id: mockUserId,
        event_type: 'workflow_execution' as const,
        resource_type: 'workflow' as const,
        resource_id: 'test-workflow-1',
        quantity: 1,
        cost_usd: 0.01,
        billing_period: '2025-01'
      };

      await billingSystem.trackUsage(usageEvent);

      const limitsCheck = await billingSystem.checkUsageLimits(mockUserId, 'workflow_execution');
      expect(limitsCheck.currentUsage).toBeGreaterThan(0);
    });

    test('should calculate usage costs', async () => {
      if (!billingSystem) {
        return;
      }

      const usageCost = await billingSystem.calculateUsageCost(mockUserId);
      
      expect(usageCost).toBeDefined();
      expect(usageCost.base_cost).toBeGreaterThanOrEqual(0);
      expect(usageCost.total_cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analytics Engine', () => {
    const mockUserId = 'test-user-analytics';

    test('should track analytics events', async () => {
      const event = {
        user_id: mockUserId,
        event_type: 'view' as const,
        resource_type: 'server' as const,
        resource_id: 'test-server-1',
        outcome: 'success' as const,
        timestamp: new Date()
      };

      await analyticsEngine.trackEvent(event);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    test('should get user analytics', async () => {
      // Track some events first
      const events = [
        { event_type: 'view', resource_type: 'server' },
        { event_type: 'install', resource_type: 'server' },
        { event_type: 'execute', resource_type: 'workflow' }
      ];

      for (const event of events) {
        await analyticsEngine.trackEvent({
          user_id: mockUserId,
          event_type: event.event_type as any,
          resource_type: event.resource_type as any,
          resource_id: 'test-resource',
          outcome: 'success',
          timestamp: new Date()
        });
      }

      const analytics = await analyticsEngine.getUserAnalytics(mockUserId);
      
      expect(analytics).toBeDefined();
      expect(analytics.user_id).toBe(mockUserId);
      expect(analytics.metrics).toBeDefined();
    });

    test('should get platform analytics', async () => {
      const platformAnalytics = await analyticsEngine.getPlatformAnalytics();
      
      expect(platformAnalytics).toBeDefined();
      expect(platformAnalytics.user_metrics).toBeDefined();
      expect(platformAnalytics.server_metrics).toBeDefined();
      expect(platformAnalytics.workflow_metrics).toBeDefined();
    });

    test('should get real-time analytics', async () => {
      const realtimeAnalytics = await analyticsEngine.getRealTimeAnalytics();
      
      expect(realtimeAnalytics).toBeDefined();
      expect(realtimeAnalytics.active_users).toBeGreaterThanOrEqual(0);
      expect(realtimeAnalytics.system_health).toBeDefined();
    });
  });

  describe('Community Features', () => {
    const mockUserId = 'test-user-community';
    let testServerId: string;

    beforeEach(async () => {
      const server = await serverRegistry.createServer(mockServer, mockUserId);
      testServerId = server.id;
    });

    test('should get community profile', async () => {
      const profile = await communityFeatures.getCommunityProfile(mockUserId);
      
      expect(profile).toBeDefined();
      expect(profile!.user_id).toBe(mockUserId);
      expect(profile!.servers_published).toBeGreaterThanOrEqual(1);
    });

    test('should submit server review', async () => {
      const review = await communityFeatures.submitServerReview(
        'test-reviewer',
        testServerId,
        5,
        'Great server!',
        'This server works perfectly for my use case.'
      );

      expect(review).toBeDefined();
      expect(review.rating).toBe(5);
      expect(review.review_title).toBe('Great server!');
    });

    test('should get server reviews', async () => {
      // Submit a review first
      await communityFeatures.submitServerReview(
        'test-reviewer',
        testServerId,
        4,
        'Good server',
        'Works well but could be improved.'
      );

      const reviewsResult = await communityFeatures.getServerReviews(testServerId);
      
      expect(reviewsResult.reviews).toBeDefined();
      expect(reviewsResult.total_count).toBeGreaterThanOrEqual(1);
      expect(reviewsResult.rating_summary).toBeDefined();
    });

    test('should get trending items', async () => {
      const trending = await communityFeatures.getTrendingItems('server', '7d', 5);
      
      expect(Array.isArray(trending)).toBe(true);
    });

    test('should get leaderboard', async () => {
      const leaderboard = await communityFeatures.getLeaderboard('contributors', 'all_time', 10);
      
      expect(Array.isArray(leaderboard)).toBe(true);
    });
  });

  describe('Enterprise Security', () => {
    const mockUserId = 'test-user-security';
    let testServerId: string;

    beforeEach(async () => {
      const server = await serverRegistry.createServer(mockServer, mockUserId);
      testServerId = server.id;
    });

    test('should check user permissions', async () => {
      // Grant permission first
      await enterpriseSecurity.grantPermission(
        mockUserId,
        'server',
        testServerId,
        'read',
        'test-admin'
      );

      const permissionCheck = await enterpriseSecurity.checkPermission(
        mockUserId,
        'server',
        testServerId,
        'read'
      );

      expect(permissionCheck.granted).toBe(true);
      expect(permissionCheck.policy_violations.length).toBe(0);
    });

    test('should deny access without permission', async () => {
      const permissionCheck = await enterpriseSecurity.checkPermission(
        'unauthorized-user',
        'server',
        testServerId,
        'admin'
      );

      expect(permissionCheck.granted).toBe(false);
      expect(permissionCheck.reason).toContain('Insufficient permissions');
    });

    test('should classify resources', async () => {
      const classification = await enterpriseSecurity.classifyResource(
        'server',
        testServerId,
        'confidential',
        ['sensitive', 'customer-data'],
        mockUserId,
        ['GDPR', 'SOC2']
      );

      expect(classification).toBeDefined();
      expect(classification.classification).toBe('confidential');
      expect(classification.encryption_required).toBe(true);
    });

    test('should detect security anomalies', async () => {
      const anomalies = await enterpriseSecurity.detectSecurityAnomalies(mockUserId);
      
      expect(anomalies).toBeDefined();
      expect(anomalies.anomalies_detected).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(anomalies.high_risk_events)).toBe(true);
    });

    test('should get security dashboard', async () => {
      const dashboard = await enterpriseSecurity.getSecurityDashboard();
      
      expect(dashboard).toBeDefined();
      expect(dashboard.security_score).toBeGreaterThanOrEqual(0);
      expect(dashboard.security_score).toBeLessThanOrEqual(100);
      expect(dashboard.user_activity).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end server lifecycle', async () => {
      const userId = 'test-integration-user';
      
      // 1. Create server
      const server = await serverRegistry.createServer({
        name: 'integration-test-server',
        display_name: 'Integration Test Server',
        description: 'Server for integration testing',
        transport_type: 'stdio',
        categories: ['testing'],
        tags: ['integration', 'test'],
        use_cases: ['integration testing'],
        npm_package: '@test/integration-server'
      }, userId);

      expect(server.id).toBeDefined();

      // 2. Update embeddings
      await semanticSearch.updateServerEmbeddings(
        server.id,
        server.description,
        server.use_cases
      );

      // 3. Search for server
      const searchResult = await semanticSearch.semanticSearch({
        semantic_query: 'integration testing',
        use_semantic_search: true,
        limit: 5
      });

      expect(searchResult.servers.length).toBeGreaterThan(0);

      // 4. Add to community (star)
      // This would be done via API in real usage

      // 5. Track analytics
      await analyticsEngine.trackEvent({
        user_id: userId,
        event_type: 'view',
        resource_type: 'server',
        resource_id: server.id,
        outcome: 'success',
        timestamp: new Date()
      });

      // 6. Get analytics
      const userAnalytics = await analyticsEngine.getUserAnalytics(userId);
      expect(userAnalytics.metrics.servers_discovered).toBeGreaterThan(0);

      // 7. Clean up
      await serverRegistry.deleteServer(server.id, userId);
    });

    test('should handle workflow creation and execution tracking', async () => {
      const userId = 'test-workflow-user';
      
      // This test would create a workflow and track its execution
      // For now, just test that analytics can track workflow events
      await analyticsEngine.trackEvent({
        user_id: userId,
        event_type: 'execute',
        resource_type: 'workflow', 
        resource_id: 'test-workflow-1',
        outcome: 'success',
        duration_ms: 5000,
        timestamp: new Date()
      });

      const analytics = await analyticsEngine.getUserAnalytics(userId);
      expect(analytics.metrics.workflows_executed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent server creation', async () => {
      const concurrentPromises = [];
      
      for (let i = 0; i < 10; i++) {
        concurrentPromises.push(
          serverRegistry.createServer({
            ...mockServer,
            name: `concurrent-server-${i}`,
            display_name: `Concurrent Server ${i}`
          }, 'test-user-1')
        );
      }

      const results = await Promise.all(concurrentPromises);
      expect(results.length).toBe(10);
      
      // Verify all servers were created with unique IDs
      const ids = results.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    test('should handle large search queries efficiently', async () => {
      // Create multiple servers for search testing
      for (let i = 0; i < 50; i++) {
        await serverRegistry.createServer({
          ...mockServer,
          name: `search-test-server-${i}`,
          description: `Search test server ${i} with various capabilities`,
          categories: i % 2 === 0 ? ['testing'] : ['utilities'],
          tags: [`test-${i}`, 'performance']
        }, 'test-user-1');
      }

      const startTime = Date.now();
      const searchResult = await serverRegistry.searchServers({
        query: 'test',
        limit: 20
      });
      const searchTime = Date.now() - startTime;

      expect(searchResult.servers.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

/**
 * Helper function to clean test data
 */
async function cleanTestData(): Promise<void> {
  const pool = new Pool({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'openconductor_test',
    user: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test'
  });

  try {
    // Clean in dependency order
    await pool.query('DELETE FROM server_ratings WHERE server_id IN (SELECT id FROM mcp_servers WHERE name LIKE $1)', ['%test%']);
    await pool.query('DELETE FROM server_stars WHERE server_id IN (SELECT id FROM mcp_servers WHERE name LIKE $1)', ['%test%']);
    await pool.query('DELETE FROM mcp_tools WHERE server_id IN (SELECT id FROM mcp_servers WHERE name LIKE $1)', ['%test%']);
    await pool.query('DELETE FROM user_interactions WHERE resource_id IN (SELECT id FROM mcp_servers WHERE name LIKE $1)', ['%test%']);
    await pool.query('DELETE FROM mcp_servers WHERE name LIKE $1', ['%test%']);
    await pool.query('DELETE FROM mcp_workflows WHERE name LIKE $1', ['%test%']);
    await pool.query('DELETE FROM subscriptions WHERE user_id LIKE $1', ['%test%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
  } catch (error) {
    console.error('Failed to clean test data:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Test configuration and setup
 */
export const testConfig = {
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'openconductor_test',
    username: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test'
  },
  features: {
    semanticSearch: true,
    communityFeatures: true,
    analytics: true,
    billing: !!process.env.STRIPE_SECRET_KEY
  }
};

/**
 * Mock data generators for testing
 */
export const mockData = {
  server: mockServer,
  
  workflow: {
    name: 'Test Workflow',
    description: 'A test workflow for unit testing',
    definition: {
      nodes: [
        {
          id: 'step-1',
          type: 'mcp_server',
          server: 'test-server',
          tool: 'test_tool'
        }
      ],
      edges: []
    },
    tags: ['test', 'workflow']
  },

  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'free'
  }
};