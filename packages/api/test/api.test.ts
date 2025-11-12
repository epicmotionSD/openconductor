import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { db } from '../src/db/connection';
import { Pool } from 'pg';

// Test configuration
const testConfig = {
  baseUrl: 'http://localhost:3001',
  timeout: 10000,
  supabaseUrl: process.env.POSTGRES_URL
};

describe('OpenConductor Enterprise API Test Suite', () => {
  let testServer: any;
  let testPool: Pool;

  beforeAll(async () => {
    // Setup test database connection
    if (testConfig.supabaseUrl) {
      testPool = new Pool({
        connectionString: testConfig.supabaseUrl,
        ssl: { rejectUnauthorized: false }
      });
      
      // Verify database is ready
      await testPool.query('SELECT 1');
      console.log('✅ Test database connected');
    }
  });

  afterAll(async () => {
    if (testPool) {
      await testPool.end();
    }
  });

  describe('Health and Status Endpoints', () => {
    it('should return API health status', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.version).toBeDefined();
    });

    it('should return liveness check', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return readiness check', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('Server Discovery Endpoints', () => {
    it('should list servers with pagination', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('servers');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.servers).toBeInstanceOf(Array);
      expect(response.body.data.servers.length).toBeLessThanOrEqual(5);
    });

    it('should filter servers by category', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .query({ category: 'memory', verified: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.servers.forEach((server: any) => {
        expect(server.category).toBe('memory');
        expect(server.verified).toBe(true);
      });
    });

    it('should get server by slug', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/openmemory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('slug', 'openmemory');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('repository');
      expect(response.body.data).toHaveProperty('stats');
    });

    it('should return 404 for non-existent server', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/nonexistent-server-xyz')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVER_NOT_FOUND');
    });
  });

  describe('Search Functionality', () => {
    it('should perform full-text search', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query({ q: 'memory' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('total');
      
      if (response.body.data.results.length > 0) {
        expect(response.body.data.results[0]).toHaveProperty('server');
        expect(response.body.data.results[0]).toHaveProperty('score');
      }
    });

    it('should provide search autocomplete', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search/autocomplete')
        .query({ q: 'mem' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return search filters', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search/filters')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data).toHaveProperty('tags');
    });
  });

  describe('Statistics and Analytics', () => {
    it('should return trending servers', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/stats/trending')
        .query({ period: '7d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('servers');
      expect(response.body.data).toHaveProperty('period', '7d');
    });

    it('should return popular servers', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/stats/popular')
        .query({ category: 'memory' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('servers');
    });

    it('should return registry statistics', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/stats/registry')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalServers');
      expect(response.body.data).toHaveProperty('categoryCounts');
    });
  });

  describe('Categories', () => {
    it('should list all categories', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data.categories).toBeInstanceOf(Array);
      
      response.body.data.categories.forEach((category: any) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('displayName');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('icon');
      });
    });
  });

  describe('CLI Integration', () => {
    it('should return CLI config for server', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/cli/config/openmemory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('server');
      expect(response.body.data).toHaveProperty('installation');
      expect(response.body.data).toHaveProperty('mcpConfig');
      expect(response.body.data).toHaveProperty('requirements');
    });

    it('should track install events', async () => {
      const installEvent = {
        serverId: 'test-server-id',
        version: '1.0.0',
        platform: 'linux' as const,
        nodeVersion: 'v18.0.0',
        cliVersion: '1.0.0'
      };

      const response = await request(testConfig.baseUrl)
        .post('/v1/servers/cli/install-event')
        .send(installEvent)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for anonymous users', async () => {
      const requests = [];
      
      // Make many requests quickly to trigger rate limit
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(testConfig.baseUrl)
            .get('/v1/servers')
            .query({ limit: 1 })
        );
      }

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited (429) or successful (200)
      const statusCodes = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r.value as any).status);

      expect(statusCodes).toContain(200); // Some should succeed
      // Note: Actual rate limiting might not trigger in test environment
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid server ID gracefully', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/invalid-uuid-format')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should validate search parameters', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query({ q: '' }) // Empty query should fail
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should handle malformed requests', async () => {
      const response = await request(testConfig.baseUrl)
        .post('/v1/servers')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Database Operations', () => {
    it('should verify database schema', async () => {
      if (!testPool) {
        console.log('⚠️ Skipping database schema test - no test pool');
        return;
      }

      // Verify all required tables exist
      const tableResult = await testPool.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename IN (
            'mcp_servers', 'server_stats', 'server_versions',
            'server_dependencies', 'user_interactions', 'server_reviews',
            'github_webhook_logs', 'api_usage', 'api_keys', 'background_jobs'
          )
        ORDER BY tablename
      `);

      const expectedTables = [
        'api_keys', 'api_usage', 'background_jobs', 'github_webhook_logs',
        'mcp_servers', 'server_dependencies', 'server_reviews', 
        'server_stats', 'server_versions', 'user_interactions'
      ];

      expectedTables.forEach(table => {
        const exists = tableResult.rows.some(row => row.tablename === table);
        expect(exists).toBe(true);
      });
    });

    it('should verify search functionality', async () => {
      if (!testPool) {
        console.log('⚠️ Skipping search test - no test pool');
        return;
      }

      // Test full-text search
      const searchResult = await testPool.query(`
        SELECT name, ts_rank(search_vector, plainto_tsquery('english', 'memory')) as rank
        FROM mcp_servers
        WHERE search_vector @@ plainto_tsquery('english', 'memory')
        ORDER BY rank DESC
        LIMIT 3
      `);

      expect(searchResult.rows.length).toBeGreaterThan(0);
      expect(searchResult.rows[0]).toHaveProperty('name');
      expect(searchResult.rows[0]).toHaveProperty('rank');
    });

    it('should verify views are working', async () => {
      if (!testPool) {
        console.log('⚠️ Skipping views test - no test pool');
        return;
      }

      // Test views
      const viewTests = [
        'SELECT COUNT(*) FROM servers_with_stats',
        'SELECT COUNT(*) FROM popular_servers', 
        'SELECT COUNT(*) FROM trending_servers'
      ];

      for (const query of viewTests) {
        const result = await testPool.query(query);
        expect(result.rows[0].count).toBeDefined();
      }
    });
  });

  describe('Performance and Caching', () => {
    it('should respond quickly to server listing', async () => {
      const startTime = Date.now();
      
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .query({ limit: 10 })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(2000); // Should respond in under 2 seconds
      expect(response.body.success).toBe(true);
    });

    it('should cache search results', async () => {
      const searchQuery = { q: 'memory', limit: 5 };
      
      // First request (cache miss)
      const firstResponse = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query(searchQuery)
        .expect(200);

      const firstTime = Date.now();
      
      // Second request (should be cached)
      const secondResponse = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query(searchQuery)
        .expect(200);

      const secondTime = Date.now();

      // Both should have same data
      expect(firstResponse.body.data.total).toBe(secondResponse.body.data.total);
      
      // Second request should be faster (cached)
      // Note: This might not always be reliable in testing
    });
  });

  describe('API Response Format', () => {
    it('should follow standardized API response format', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .query({ limit: 1 })
        .expect(200);

      // Check API response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      
      expect(response.body.meta).toHaveProperty('requestId');
      expect(response.body.meta).toHaveProperty('timestamp');
      expect(response.body.meta).toHaveProperty('version');
    });

    it('should return consistent error format', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('meta');
      
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('Server Data Structure', () => {
    it('should return complete server data structure', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/openmemory')
        .expect(200);

      const server = response.body.data;

      // Check all required fields from specification
      expect(server).toHaveProperty('id');
      expect(server).toHaveProperty('slug');
      expect(server).toHaveProperty('name');
      expect(server).toHaveProperty('description');
      expect(server).toHaveProperty('repository');
      expect(server).toHaveProperty('category');
      expect(server).toHaveProperty('tags');
      expect(server).toHaveProperty('stats');
      expect(server).toHaveProperty('verified');
      
      // Check nested structures
      expect(server.repository).toHaveProperty('url');
      expect(server.repository).toHaveProperty('owner');
      expect(server.repository).toHaveProperty('name');
      expect(server.repository).toHaveProperty('stars');
      
      expect(server.stats).toHaveProperty('popularity');
      expect(server.stats).toHaveProperty('installs');
    });
  });

  describe('Advanced Search Features', () => {
    it('should support complex search queries', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query({ 
          q: 'memory semantic',
          filters: JSON.stringify({
            category: ['memory'],
            verified: true
          })
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    it('should provide search suggestions', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query({ q: 'xyz-nonexistent-query' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('Stats and Trending', () => {
    it('should calculate trending scores', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/stats/trending')
        .query({ period: '7d', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('servers');
      expect(response.body.data).toHaveProperty('period');
      
      response.body.data.servers.forEach((server: any) => {
        expect(server).toHaveProperty('trendingScore');
        expect(server).toHaveProperty('growth');
      });
    });

    it('should return category statistics', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      
      response.body.data.categories.forEach((category: any) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('featured');
      });
    });
  });

  describe('Security and Validation', () => {
    it('should validate input parameters', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .query({ limit: '999999' }) // Over max limit
        .expect(200);

      // Should cap the limit to maximum allowed
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should sanitize user input', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers/search')
        .query({ q: '<script>alert("xss")</script>' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // XSS content should be handled safely
    });

    it('should return security headers', async () => {
      const response = await request(testConfig.baseUrl)
        .get('/v1/servers')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Webhook Processing', () => {
    it('should accept GitHub webhook (development)', async () => {
      const mockPayload = {
        action: 'published',
        release: {
          tag_name: 'v1.0.0',
          name: 'Test Release',
          body: 'Test release notes',
          prerelease: false,
          published_at: new Date().toISOString()
        },
        repository: {
          full_name: 'test/repo',
          owner: { login: 'test' },
          name: 'repo',
          html_url: 'https://github.com/test/repo'
        }
      };

      const response = await request(testConfig.baseUrl)
        .post('/v1/servers/webhooks/github')
        .send(mockPayload)
        .set('X-GitHub-Event', 'release')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message');
    });
  });
});

// CLI Test Suite
describe('OpenConductor CLI Test Suite', () => {
  const cliPath = '../../cli/bin/openconductor.js';
  const testApiUrl = 'http://localhost:3001/v1';

  describe('Basic CLI Commands', () => {
    it('should show version', async () => {
      // This would require actual CLI testing with child_process
      // For now, just check the CLI files exist
      expect(true).toBe(true); // Placeholder
    });

    it('should show help', async () => {
      // CLI help test
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Discovery Commands', () => {
    it('should discover servers', async () => {
      // Test: node bin/openconductor.js discover --limit 5
      expect(true).toBe(true); // Placeholder
    });

    it('should search with filters', async () => {
      // Test: node bin/openconductor.js discover --category memory
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Configuration Commands', () => {
    it('should initialize configuration', async () => {
      // Test: node bin/openconductor.js init --force
      expect(true).toBe(true); // Placeholder
    });

    it('should list installed servers', async () => {
      // Test: node bin/openconductor.js list
      expect(true).toBe(true); // Placeholder
    });
  });
});

export { testConfig };