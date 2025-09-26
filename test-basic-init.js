/**
 * Basic OpenConductor Platform Initialization Test
 * 
 * This test verifies that the core OpenConductor platform can be instantiated
 * and initialized successfully after our systematic TypeScript error resolution.
 */

const path = require('path');

async function testBasicInitialization() {
  try {
    console.log('🚀 Testing OpenConductor Basic Initialization...\n');
    
    // Import the main OpenConductor class
    const { OpenConductor } = require('./dist/index.js');
    
    console.log('✅ Successfully imported OpenConductor class');
    
    // Create a new instance with minimal configuration
    const conductor = new OpenConductor({
      core: {
        instanceId: 'test-instance-001',
        version: '1.0.0-beta'
      },
      logging: {
        level: 'info',
        enabled: true
      }
    });
    
    console.log('✅ Successfully created OpenConductor instance');
    console.log(`   Instance ID: ${conductor.instanceId}`);
    console.log(`   Version: ${conductor.version}`);
    
    // Test health check before initialization
    console.log(`   Health Status: ${conductor.isHealthy ? 'Healthy' : 'Not Ready'}`);
    
    // Initialize the platform
    console.log('\n🔧 Initializing OpenConductor platform...');
    await conductor.initialize();
    console.log('✅ Successfully initialized OpenConductor platform');
    
    // Start the platform
    console.log('\n▶️  Starting OpenConductor platform...');
    await conductor.start();
    console.log('✅ Successfully started OpenConductor platform');
    console.log(`   Uptime: ${conductor.uptime}ms`);
    
    // Test health status
    const health = await conductor.getHealth();
    console.log('\n🏥 Platform Health Status:');
    console.log(`   Overall Status: ${health.status}`);
    console.log(`   Components: ${Object.keys(health.components).length} components`);
    console.log(`   Active Agents: ${health.metrics.activeAgents}`);
    console.log(`   Active Workflows: ${health.metrics.activeWorkflows}`);
    
    // Test metrics
    const metrics = await conductor.getMetrics();
    console.log('\n📊 Platform Metrics:');
    console.log(`   Total Agents: ${metrics.agents.total}`);
    console.log(`   Total Workflows: ${metrics.workflows.total}`);
    console.log(`   System Memory: ${Math.round(metrics.system.memory / 1024 / 1024)}MB`);
    
    // Clean shutdown
    console.log('\n🛑 Shutting down OpenConductor platform...');
    await conductor.shutdown();
    console.log('✅ Successfully shutdown OpenConductor platform');
    
    console.log('\n🎉 SUCCESS: OpenConductor platform initialization test completed successfully!');
    console.log('   All core systems are functional and ready for agent orchestration.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ FAILED: OpenConductor initialization test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testBasicInitialization()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testBasicInitialization };