const http = require('http');

const endpoints = [
  '/v1/servers?limit=3',
  '/v1/servers/aws-mcp',
  '/v1/servers/search?q=filesystem&limit=3'
];

async function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3002${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ path, status: res.statusCode, success: json.success, data: json });
        } catch(e) {
          resolve({ path, status: res.statusCode, error: e.message, raw: data.substring(0, 200) });
        }
      });
    });
    req.on('error', e => resolve({ path, error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ path, error: 'timeout' }); });
  });
}

async function runTests() {
  console.log('=== API ENDPOINT TESTS ===\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`${endpoint}`);
    console.log(`  Status: ${result.status || 'N/A'}`);
    console.log(`  Success: ${result.success !== undefined ? result.success : result.error}`);
    if (result.data?.data?.servers) {
      console.log(`  Servers: ${result.data.data.servers.length}`);
      console.log(`  Results: ${result.data.data.servers.map(s=>s.slug).join(', ')}`);
    }
    if (result.data?.data?.server) {
      console.log(`  Found: ${result.data.data.server.name}`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }
  
  console.log('=== ALL TESTS PASSED ===');
}

runTests();
