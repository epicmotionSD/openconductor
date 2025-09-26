/**
 * OpenConductor End-to-End Production Tests
 * Comprehensive testing suite for production environment validation
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

// Test configuration
const config = {
  frontend: {
    url: process.env.FRONTEND_URL || 'https://app.openconductor.ai',
    timeout: 10000
  },
  backend: {
    url: process.env.BACKEND_URL || 'https://api.openconductor.ai',
    websocket: process.env.WEBSOCKET_URL || 'wss://api.openconductor.ai/ws',
    timeout: 15000
  },
  database: {
    healthEndpoint: '/api/v1/system/health'
  },
  auth: {
    testToken: process.env.TEST_API_TOKEN,
    testUser: process.env.TEST_USER_ID
  }
};

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  performance: {},
  startTime: Date.now()
};

/**
 * Test utilities
 */
const utils = {
  async measure(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      testResults.performance[name] = duration;
      console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`❌ ${name}: Failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  },

  async test(name, fn) {
    try {
      console.log(`🧪 Running: ${name}`);
      await fn();
      testResults.passed++;
      console.log(`✅ Passed: ${name}`);
    } catch (error) {
      testResults.failed++;
      testResults.errors.push({ test: name, error: error.message });
      console.log(`❌ Failed: ${name} - ${error.message}`);
    }
  },

  async httpRequest(method, url, data = null, headers = {}) {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'User-Agent': 'OpenConductor-E2E-Tests/1.0',
        ...headers
      },
      timeout: config.backend.timeout,
      validateStatus: () => true // Don't throw on HTTP errors
    });
    return response;
  },

  async waitFor(condition, timeout = 5000, interval = 500) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return true;
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }
};

/**
 * Frontend Tests
 */
const frontendTests = {
  async accessibility() {
    const response = await utils.httpRequest('GET', config.frontend.url);
    
    if (response.status !== 200) {
      throw new Error(`Frontend not accessible: HTTP ${response.status}`);
    }
    
    // Check for essential HTML elements
    const html = response.data;
    if (!html.includes('<title>')) {
      throw new Error('Missing page title');
    }
    
    if (!html.includes('OpenConductor') && !html.includes('Trinity AI')) {
      throw new Error('Missing OpenConductor branding');
    }
  },

  async staticAssets() {
    // Test critical static assets
    const assets = [
      '/assets/index.css',
      '/assets/index.js',
      '/favicon.ico'
    ];
    
    for (const asset of assets) {
      const response = await utils.httpRequest('GET', `${config.frontend.url}${asset}`);
      if (response.status >= 400) {
        throw new Error(`Asset ${asset} not found: HTTP ${response.status}`);
      }
    }
  },

  async performanceBaseline() {
    const start = performance.now();
    const response = await utils.httpRequest('GET', config.frontend.url);
    const loadTime = performance.now() - start;
    
    if (response.status !== 200) {
      throw new Error(`Performance test failed: HTTP ${response.status}`);
    }
    
    // Performance thresholds
    if (loadTime > 3000) {
      throw new Error(`Frontend load time too slow: ${loadTime.toFixed(2)}ms`);
    }
    
    console.log(`📊 Frontend load time: ${loadTime.toFixed(2)}ms`);
  }
};

/**
 * Backend API Tests
 */
const backendTests = {
  async healthCheck() {
    const response = await utils.httpRequest('GET', `${config.backend.url}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }
    
    const health = response.data;
    if (!health.success) {
      throw new Error('Health check returned unsuccessful status');
    }
  },

  async systemHealth() {
    const response = await utils.httpRequest('GET', `${config.backend.url}${config.database.healthEndpoint}`);
    
    if (response.status !== 200) {
      throw new Error(`System health check failed: HTTP ${response.status}`);
    }
    
    const systemHealth = response.data;
    if (!systemHealth.success || !systemHealth.data) {
      throw new Error('System health check failed');
    }
    
    // Verify database connectivity
    if (systemHealth.data.database?.status !== 'healthy') {
      throw new Error('Database connectivity issues detected');
    }
    
    console.log(`📊 Database status: ${systemHealth.data.database?.status}`);
  },

  async mcpServerRegistry() {
    const response = await utils.httpRequest('GET', `${config.backend.url}/api/v1/mcp/servers?limit=5`);
    
    if (response.status !== 200) {
      throw new Error(`MCP server registry failed: HTTP ${response.status}`);
    }
    
    const registry = response.data;
    if (!registry.success || !Array.isArray(registry.data?.servers)) {
      throw new Error('Invalid MCP server registry response');
    }
    
    console.log(`📊 MCP servers available: ${registry.data.servers.length}`);
  },

  async semanticSearch() {
    const query = 'file system operations';
    const response = await utils.httpRequest('GET', `${config.backend.url}/api/v1/mcp/servers?semantic_search=${encodeURIComponent(query)}&use_semantic=true&limit=3`);
    
    if (response.status !== 200) {
      throw new Error(`Semantic search failed: HTTP ${response.status}`);
    }
    
    const results = response.data;
    if (!results.success || !Array.isArray(results.data?.servers)) {
      throw new Error('Invalid semantic search response');
    }
    
    console.log(`📊 Semantic search results: ${results.data.servers.length} servers found`);
  },

  async workflowManagement() {
    // Test workflow listing (requires auth)
    const headers = config.auth.testToken ? {
      'Authorization': `Bearer ${config.auth.testToken}`
    } : {};
    
    const response = await utils.httpRequest('GET', `${config.backend.url}/api/v1/mcp/workflows?limit=5`, null, headers);
    
    // Allow both 200 (success) and 401 (unauthorized) as valid responses
    if (response.status !== 200 && response.status !== 401) {
      throw new Error(`Workflow management endpoint failed: HTTP ${response.status}`);
    }
    
    if (response.status === 200) {
      const workflows = response.data;
      if (!workflows.success) {
        throw new Error('Invalid workflow response');
      }
      console.log(`📊 Workflows accessible: ${workflows.data?.length || 0}`);
    } else {
      console.log('📊 Workflow endpoint requires authentication (expected)');
    }
  },

  async billingSystem() {
    const response = await utils.httpRequest('GET', `${config.backend.url}/api/v1/mcp/billing/plans`);
    
    if (response.status !== 200) {
      throw new Error(`Billing system failed: HTTP ${response.status}`);
    }
    
    const plans = response.data;
    if (!plans.success || !Array.isArray(plans.data)) {
      throw new Error('Invalid billing plans response');
    }
    
    const planCount = plans.data.length;
    if (planCount < 3) {
      throw new Error(`Insufficient billing plans: ${planCount} (expected at least 3)`);
    }
    
    console.log(`📊 Billing plans available: ${planCount}`);
  }
};

/**
 * WebSocket Tests
 */
const websocketTests = {
  async connectivity() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.backend.websocket);
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket connection timeout'));
      }, 10000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });
    });
  },

  async pingPong() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(config.backend.websocket);
      const timeout = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket ping timeout'));
      }, 10000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'pong') {
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        } catch (error) {
          // Ignore parsing errors
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket ping failed: ${error.message}`));
      });
    });
  }
};

/**
 * Integration Tests
 */
const integrationTests = {
  async frontendBackendIntegration() {
    // Test that frontend can reach backend
    const frontendResponse = await utils.httpRequest('GET', config.frontend.url);
    if (frontendResponse.status !== 200) {
      throw new Error('Frontend not accessible');
    }
    
    const backendResponse = await utils.httpRequest('GET', `${config.backend.url}/health`);
    if (backendResponse.status !== 200) {
      throw new Error('Backend not accessible from integration test');
    }
    
    console.log('📊 Frontend-Backend integration verified');
  },

  async trinityAgentSystem() {
    // Test Trinity AI system endpoints
    const endpoints = [
      '/api/v1/mcp/servers/analytics/overview',
      '/api/v1/system/health'
    ];
    
    for (const endpoint of endpoints) {
      const response = await utils.httpRequest('GET', `${config.backend.url}${endpoint}`);
      if (response.status >= 500) {
        throw new Error(`Trinity system endpoint ${endpoint} failed: HTTP ${response.status}`);
      }
    }
    
    console.log('📊 Trinity AI system endpoints accessible');
  }
};

/**
 * Performance Tests
 */
const performanceTests = {
  async apiResponseTimes() {
    const endpoints = [
      { path: '/health', threshold: 500 },
      { path: '/api/v1/mcp/servers?limit=10', threshold: 2000 },
      { path: '/api/v1/mcp/billing/plans', threshold: 1000 }
    ];
    
    for (const endpoint of endpoints) {
      await utils.measure(`API ${endpoint.path}`, async () => {
        const response = await utils.httpRequest('GET', `${config.backend.url}${endpoint.path}`);
        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const responseTime = testResults.performance[`API ${endpoint.path}`];
        if (responseTime > endpoint.threshold) {
          throw new Error(`Response time ${responseTime.toFixed(2)}ms exceeds threshold ${endpoint.threshold}ms`);
        }
      });
    }
  },

  async concurrentRequests() {
    const concurrentCount = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentCount; i++) {
      promises.push(
        utils.httpRequest('GET', `${config.backend.url}/health`)
      );
    }
    
    const responses = await Promise.all(promises);
    const successfulResponses = responses.filter(r => r.status === 200);
    
    if (successfulResponses.length < concurrentCount * 0.8) {
      throw new Error(`Concurrent requests failed: ${successfulResponses.length}/${concurrentCount} successful`);
    }
    
    console.log(`📊 Concurrent requests: ${successfulResponses.length}/${concurrentCount} successful`);
  }
};

/**
 * Main test runner
 */
async function runProductionTests() {
  console.log('🚀 Starting OpenConductor Production Tests');
  console.log('============================================');
  console.log(`Frontend: ${config.frontend.url}`);
  console.log(`Backend: ${config.backend.url}`);
  console.log(`WebSocket: ${config.backend.websocket}`);
  console.log('');
  
  // Run test suites
  const testSuites = [
    { name: 'Frontend Tests', tests: frontendTests },
    { name: 'Backend API Tests', tests: backendTests },
    { name: 'WebSocket Tests', tests: websocketTests },
    { name: 'Integration Tests', tests: integrationTests },
    { name: 'Performance Tests', tests: performanceTests }
  ];
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}:`);
    console.log('─'.repeat(40));
    
    for (const [testName, testFn] of Object.entries(suite.tests)) {
      await utils.test(`${suite.name}: ${testName}`, testFn);
    }
  }
  
  // Print results summary
  console.log('\n🏁 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Total time: ${((Date.now() - testResults.startTime) / 1000).toFixed(2)}s`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   • ${test}: ${error}`);
    });
  }
  
  console.log('\n📊 Performance Metrics:');
  Object.entries(testResults.performance).forEach(([test, time]) => {
    console.log(`   • ${test}: ${time.toFixed(2)}ms`);
  });
  
  // Exit with appropriate code
  const exitCode = testResults.failed === 0 ? 0 : 1;
  console.log(`\n${exitCode === 0 ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  
  process.exit(exitCode);
}

// Run tests if called directly
if (require.main === module) {
  runProductionTests().catch(error => {
    console.error('🚨 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runProductionTests,
  testResults,
  config
};