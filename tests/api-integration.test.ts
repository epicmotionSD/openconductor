/**
 * OpenConductor API Integration Tests
 * 
 * Comprehensive tests for REST/WebSocket APIs
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import WebSocket from 'ws';
import { OpenConductorServer, createServer } from '../src/server';
import { OpenConductor } from '../src/core/conductor';

describe('OpenConductor API Integration Tests', () => {
  let server: OpenConductorServer;
  let baseURL: string;
  let apiKey: string;

  beforeAll(async () => {
    // Start test server
    server = await createServer({
      core: {
        instanceId: 'test-instance',
        name: 'OpenConductor Test',
        version: '1.0.0-test'
      },
      api: {
        server: {
          host: '127.0.0.1',
          port: 3001
        }
      },
      auth: {
        strategy: 'api-key',
        apiKey: {
          headerName: 'X-API-Key'
        }
      },
      logging: {
        level: 'error' // Reduce noise in tests
      }
    });

    baseURL = 'http://127.0.0.1:3001';
    apiKey = 'test-api-key';

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Health Check', () => {
    test('should return system health', async () => {
      const response = await request(baseURL)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('components');
    });
  });

  describe('Authentication', () => {
    test('should reject requests without API key', async () => {
      const response = await request(baseURL)
        .get('/api/v1/agents')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });

    test('should accept requests with valid API key', async () => {
      const response = await request(baseURL)
        .get('/api/v1/agents')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Agents API', () => {
    let createdAgentId: string;

    test('should list agents with pagination', async () => {
      const response = await request(baseURL)
        .get('/api/v1/agents?page=1&limit=10')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('should create a new agent', async () => {
      const agentData = {
        name: 'Test Agent',
        type: 'oracle',
        version: '1.0.0',
        description: 'A test agent for integration testing',
        config: {
          capabilities: ['data-analysis', 'reporting'],
          tools: ['test-tool'],
          memory: {
            type: 'persistent',
            store: 'redis',
            ttl: 3600
          },
          resources: {
            cpu: '500m',
            memory: '512Mi',
            storage: '1Gi'
          }
        }
      };

      const response = await request(baseURL)
        .post('/api/v1/agents')
        .set('X-API-Key', apiKey)
        .send(agentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(agentData.name);
      expect(response.body.data.type).toBe(agentData.type);
      expect(response.body.data.id).toBeDefined();

      createdAgentId = response.body.data.id;
    });

    test('should get specific agent', async () => {
      const response = await request(baseURL)
        .get(`/api/v1/agents/${createdAgentId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdAgentId);
      expect(response.body.data.name).toBe('Test Agent');
    });

    test('should update agent', async () => {
      const updates = {
        description: 'Updated test agent description',
        config: {
          capabilities: ['data-analysis', 'reporting', 'visualization']
        }
      };

      const response = await request(baseURL)
        .put(`/api/v1/agents/${createdAgentId}`)
        .set('X-API-Key', apiKey)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updates.description);
    });

    test('should execute agent', async () => {
      const executionData = {
        input: {
          data: 'test data for processing',
          format: 'json'
        },
        options: {
          timeout: 30000,
          priority: 'normal'
        }
      };

      const response = await request(baseURL)
        .post(`/api/v1/agents/${createdAgentId}/execute`)
        .set('X-API-Key', apiKey)
        .send(executionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.execution).toBeDefined();
      expect(response.body.data.execution.agentId).toBe(createdAgentId);
    });

    test('should get agent health', async () => {
      const response = await request(baseURL)
        .get(`/api/v1/agents/${createdAgentId}/health`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    test('should get agent metrics', async () => {
      const response = await request(baseURL)
        .get(`/api/v1/agents/${createdAgentId}/metrics`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionCount).toBeDefined();
      expect(response.body.data.successRate).toBeDefined();
    });

    test('should handle agent not found', async () => {
      const response = await request(baseURL)
        .get('/api/v1/agents/non-existent-agent')
        .set('X-API-Key', apiKey)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    test('should delete agent', async () => {
      const response = await request(baseURL)
        .delete(`/api/v1/agents/${createdAgentId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify agent is deleted
      await request(baseURL)
        .get(`/api/v1/agents/${createdAgentId}`)
        .set('X-API-Key', apiKey)
        .expect(404);
    });
  });

  describe('Workflows API', () => {
    test('should list workflows', async () => {
      const response = await request(baseURL)
        .get('/api/v1/workflows')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    test('should create workflow', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'A test workflow',
        version: '1.0.0',
        strategy: 'sequential',
        steps: [
          {
            id: 'step-1',
            name: 'Test Step',
            type: 'agent',
            config: {
              agentId: 'test-agent'
            },
            dependencies: []
          }
        ],
        triggers: [
          {
            type: 'manual',
            config: {}
          }
        ]
      };

      const response = await request(baseURL)
        .post('/api/v1/workflows')
        .set('X-API-Key', apiKey)
        .send(workflowData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(workflowData.name);
    });
  });

  describe('Tools API', () => {
    test('should list tools', async () => {
      const response = await request(baseURL)
        .get('/api/v1/tools')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should register tool', async () => {
      const toolData = {
        name: 'Test Tool',
        type: 'function',
        version: '1.0.0',
        description: 'A test tool for integration testing',
        config: {
          operations: [
            {
              name: 'test_operation',
              description: 'Test operation',
              parameters: {
                input: { type: 'string', required: true }
              },
              returns: {
                output: { type: 'string' }
              }
            }
          ],
          authentication: {
            type: 'none'
          }
        }
      };

      const response = await request(baseURL)
        .post('/api/v1/tools')
        .set('X-API-Key', apiKey)
        .send(toolData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(toolData.name);
    });
  });

  describe('Events API', () => {
    test('should get events with filtering', async () => {
      const response = await request(baseURL)
        .get('/api/v1/events?limit=10')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should publish event', async () => {
      const eventData = {
        type: 'test.event',
        source: 'integration-test',
        data: {
          message: 'Test event from integration test',
          timestamp: new Date().toISOString()
        },
        priority: 'normal'
      };

      const response = await request(baseURL)
        .post('/api/v1/events')
        .set('X-API-Key', apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(eventData.type);
      expect(response.body.data.id).toBeDefined();
    });

    test('should create event subscription', async () => {
      const subscriptionData = {
        filter: {
          types: ['test.*'],
          priority: ['normal', 'high']
        },
        endpoint: 'https://example.com/webhook',
        active: true
      };

      const response = await request(baseURL)
        .post('/api/v1/events/subscriptions')
        .set('X-API-Key', apiKey)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.endpoint).toBe(subscriptionData.endpoint);
    });
  });

  describe('System API', () => {
    test('should get system health', async () => {
      const response = await request(baseURL)
        .get('/api/v1/system/health')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.components).toBeDefined();
    });

    test('should get system metrics', async () => {
      const response = await request(baseURL)
        .get('/api/v1/system/metrics')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.agents).toBeDefined();
      expect(response.body.data.workflows).toBeDefined();
      expect(response.body.data.system).toBeDefined();
    });

    test('should get system info', async () => {
      const response = await request(baseURL)
        .get('/api/v1/system/info')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('OpenConductor');
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.features).toBeDefined();
    });

    test('should get performance metrics', async () => {
      const response = await request(baseURL)
        .get('/api/v1/system/performance')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.cpu).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('Registry API', () => {
    test('should search registry agents', async () => {
      const response = await request(baseURL)
        .get('/api/v1/registry/agents?q=data&limit=5')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should get registry categories', async () => {
      const response = await request(baseURL)
        .get('/api/v1/registry/categories')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should get registry tags', async () => {
      const response = await request(baseURL)
        .get('/api/v1/registry/tags?limit=10')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      const invalidAgentData = {
        name: '', // Invalid: empty name
        type: 'invalid-type', // Invalid: not a valid type
        version: 'not-semver' // Invalid: not semantic version
      };

      const response = await request(baseURL)
        .post('/api/v1/agents')
        .set('X-API-Key', apiKey)
        .send(invalidAgentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    test('should handle rate limiting', async () => {
      // This test would need to be implemented based on actual rate limiting configuration
      // For now, we'll test that the endpoint exists and responds correctly
      const response = await request(baseURL)
        .get('/api/v1/agents')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle 404 for non-existent endpoints', async () => {
      const response = await request(baseURL)
        .get('/api/v1/non-existent-endpoint')
        .set('X-API-Key', apiKey)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENDPOINT_NOT_FOUND');
    });
  });

  describe('WebSocket Integration', () => {
    test('should establish WebSocket connection', (done) => {
      const ws = new WebSocket(`ws://127.0.0.1:3001/ws`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          done(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });

    test('should handle WebSocket messages', (done) => {
      const ws = new WebSocket(`ws://127.0.0.1:3001/ws`);
      
      ws.on('open', () => {
        // Send ping message
        ws.send(JSON.stringify({
          type: 'ping',
          id: 'test-ping',
          timestamp: new Date().toISOString()
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'pong') {
          expect(message.id).toBe('test-ping');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          done(new Error('WebSocket message timeout'));
        }
      }, 5000);
    });
  });

  describe('Response Format Consistency', () => {
    test('should have consistent response format across endpoints', async () => {
      const endpoints = [
        '/api/v1/agents',
        '/api/v1/workflows',
        '/api/v1/tools',
        '/api/v1/events',
        '/api/v1/system/health'
      ];

      for (const endpoint of endpoints) {
        const response = await request(baseURL)
          .get(endpoint)
          .set('X-API-Key', apiKey);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('metadata');
        expect(response.body.metadata).toHaveProperty('timestamp');
        expect(response.body.metadata).toHaveProperty('version');
        expect(response.body.metadata).toHaveProperty('requestId');

        if (response.body.success) {
          expect(response.body).toHaveProperty('data');
        } else {
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toHaveProperty('code');
          expect(response.body.error).toHaveProperty('message');
        }
      }
    });

    test('should include pagination for list endpoints', async () => {
      const listEndpoints = [
        '/api/v1/agents',
        '/api/v1/workflows',
        '/api/v1/tools',
        '/api/v1/events'
      ];

      for (const endpoint of listEndpoints) {
        const response = await request(baseURL)
          .get(endpoint)
          .set('X-API-Key', apiKey)
          .expect(200);

        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('totalPages');
        expect(response.body.pagination).toHaveProperty('hasNext');
        expect(response.body.pagination).toHaveProperty('hasPrevious');
      }
    });
  });
});

describe('Performance Tests', () => {
  let server: OpenConductorServer;
  let baseURL: string;
  let apiKey: string;

  beforeAll(async () => {
    server = await createServer({
      api: { server: { port: 3002 } },
      auth: { strategy: 'none' }
    });
    baseURL = 'http://127.0.0.1:3002';
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
  });

  test('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(baseURL)
          .get('/api/v1/system/health')
          .expect(200)
      );
    }

    const results = await Promise.all(promises);
    
    results.forEach(response => {
      expect(response.body.success).toBe(true);
    });
  });

  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    await request(baseURL)
      .get('/api/v1/system/metrics')
      .expect(200);
    
    const responseTime = Date.now() - startTime;
    
    // Expect response within 1 second
    expect(responseTime).toBeLessThan(1000);
  });
});