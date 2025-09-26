#!/usr/bin/env ts-node

/**
 * Sentinel Agent Examples
 * 
 * Demonstrates monitoring, alerting, and health checking capabilities:
 * - Real-time system monitoring
 * - Custom threshold management
 * - Health check automation
 * - Alert management
 * - Performance tracking
 */

import { Logger } from '../src/utils/logger';
import { SentinelAgent } from '../src/agents/sentinel-agent';
import { AgentConfig } from '../src/types/agent';

const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: ['console']
});

async function runSentinelExamples() {
  console.log('🛡️  Sentinel Agent Examples');
  console.log('===========================\n');

  const sentinel = await initializeSentinel();

  // Example 1: System Health Monitoring
  await systemHealthExample(sentinel);

  // Example 2: Custom Threshold Management
  await thresholdManagementExample(sentinel);

  // Example 3: Real-time Alert Handling
  await alertHandlingExample(sentinel);

  // Example 4: Performance Metrics Tracking
  await performanceTrackingExample(sentinel);

  // Example 5: Multi-Service Monitoring
  await multiServiceExample(sentinel);

  console.log('✅ All Sentinel examples completed successfully');
}

async function initializeSentinel(): Promise<SentinelAgent> {
  const config: AgentConfig = {
    id: 'sentinel-examples',
    name: 'Sentinel Examples Agent',
    version: '1.0.0',
    type: 'monitoring',
    description: 'Sentinel agent for demonstration examples',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sentinel = new SentinelAgent(config, logger);
  await sentinel.initialize();
  
  console.log('🛡️  Sentinel Agent initialized and monitoring active\n');
  return sentinel;
}

async function systemHealthExample(sentinel: SentinelAgent) {
  console.log('📊 Example 1: System Health Monitoring');
  console.log('--------------------------------------');

  // Simulate different system states
  const systemStates = [
    {
      name: 'Healthy System',
      metrics: {
        cpu_usage: 45,
        memory_usage: 60,
        disk_usage: 35,
        response_time: 220,
        error_rate: 0.5,
        throughput: 850
      }
    },
    {
      name: 'Under Load',
      metrics: {
        cpu_usage: 78,
        memory_usage: 82,
        disk_usage: 40,
        response_time: 450,
        error_rate: 2.1,
        throughput: 650
      }
    },
    {
      name: 'Critical State',
      metrics: {
        cpu_usage: 95,
        memory_usage: 97,
        disk_usage: 88,
        response_time: 1200,
        error_rate: 8.5,
        throughput: 200
      }
    }
  ];

  for (const state of systemStates) {
    console.log(`\n   Monitoring: ${state.name}`);
    console.log(`   Metrics: CPU ${state.metrics.cpu_usage}%, Memory ${state.metrics.memory_usage}%, Response ${state.metrics.response_time}ms`);

    const result = await sentinel.execute(state.metrics);

    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Health Summary: ${result.summary.healthyChecks}/${result.summary.totalChecks} checks passing`);
    
    if (result.alerts.length > 0) {
      console.log('   🚨 Active Alerts:');
      result.alerts.forEach(alert => {
        console.log(`      ${alert.level.toUpperCase()}: ${alert.message}`);
      });
    } else {
      console.log('   ✅ No alerts triggered');
    }
  }

  console.log('');
}

async function thresholdManagementExample(sentinel: SentinelAgent) {
  console.log('⚙️  Example 2: Custom Threshold Management');
  console.log('-----------------------------------------');

  // Set up custom thresholds for different scenarios
  const customThresholds = [
    { metric: 'api_latency', condition: 'gt', value: 500, severity: 'warning', description: 'API response too slow' },
    { metric: 'database_connections', condition: 'gt', value: 80, severity: 'critical', description: 'Database connection pool exhausted' },
    { metric: 'queue_size', condition: 'gt', value: 1000, severity: 'warning', description: 'Message queue backing up' },
    { metric: 'cache_hit_ratio', condition: 'lt', value: 0.85, severity: 'warning', description: 'Cache performance degraded' }
  ];

  console.log('Setting up custom thresholds:');
  customThresholds.forEach(threshold => {
    sentinel.setThreshold(threshold.metric, threshold);
    console.log(`   • ${threshold.metric}: ${threshold.condition} ${threshold.value} (${threshold.severity})`);
  });

  // Display all configured thresholds
  console.log('\nAll configured thresholds:');
  const allThresholds = sentinel.getThresholds();
  Object.entries(allThresholds).forEach(([id, threshold]) => {
    console.log(`   ${id}: ${threshold.metric} ${threshold.condition} ${threshold.value} [${threshold.severity}]`);
  });

  // Test threshold violations
  console.log('\nTesting threshold violations:');
  const testData = {
    api_latency: 750,        // Will trigger warning
    database_connections: 85, // Will trigger critical
    queue_size: 500,         // No alert
    cache_hit_ratio: 0.78    // Will trigger warning
  };

  const result = await sentinel.execute(testData);
  
  console.log(`   Test data: ${JSON.stringify(testData)}`);
  console.log(`   Triggered alerts: ${result.alerts.length}`);
  
  result.alerts.forEach(alert => {
    console.log(`   🚨 ${alert.level.toUpperCase()}: ${alert.message}`);
  });

  console.log('');
}

async function alertHandlingExample(sentinel: SentinelAgent) {
  console.log('🚨 Example 3: Real-time Alert Handling');
  console.log('-------------------------------------');

  // Generate some alerts
  console.log('Generating sample alerts...');

  const alertScenarios = [
    { cpu_usage: 88, memory_usage: 92, response_time: 800 },  // Multiple warnings
    { cpu_usage: 95, memory_usage: 98, response_time: 1500 }, // Critical alerts
    { cpu_usage: 70, memory_usage: 75, response_time: 300 },  // Back to normal
  ];

  for (let i = 0; i < alertScenarios.length; i++) {
    console.log(`\n   Scenario ${i + 1}: ${JSON.stringify(alertScenarios[i])}`);
    
    const result = await sentinel.execute(alertScenarios[i]);
    
    if (result.alerts.length > 0) {
      console.log(`   Generated ${result.alerts.length} alert(s):`);
      result.alerts.forEach(alert => {
        console.log(`      ID: ${alert.id}, Level: ${alert.level}, Message: ${alert.message}`);
      });
    } else {
      console.log('   No new alerts generated');
    }

    // Wait a bit between scenarios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show active alerts
  console.log('\nActive Alerts Summary:');
  const activeAlerts = sentinel.getActiveAlerts();
  console.log(`   Total active alerts: ${activeAlerts.length}`);
  
  if (activeAlerts.length > 0) {
    activeAlerts.forEach(alert => {
      console.log(`   • [${alert.level.toUpperCase()}] ${alert.message} (${alert.timestamp.toLocaleTimeString()})`);
    });

    // Acknowledge some alerts
    console.log('\nAcknowledging first alert...');
    const firstAlert = activeAlerts[0];
    await sentinel.acknowledgeAlert(firstAlert.id, 'system-admin');
    console.log(`   ✅ Alert ${firstAlert.id} acknowledged`);
  }

  // Show alert history
  console.log('\nRecent Alert History:');
  const history = sentinel.getAlertHistory(5);
  history.forEach(alert => {
    const status = alert.acknowledgedBy ? '(Acknowledged)' : alert.status === 'resolved' ? '(Resolved)' : '(Active)';
    console.log(`   ${alert.timestamp.toLocaleTimeString()}: ${alert.message} ${status}`);
  });

  console.log('');
}

async function performanceTrackingExample(sentinel: SentinelAgent) {
  console.log('📈 Example 4: Performance Metrics Tracking');
  console.log('------------------------------------------');

  // Simulate a performance degradation scenario
  const performanceScenario = [
    { phase: 'Baseline', cpu: 35, memory: 45, latency: 180, throughput: 950 },
    { phase: 'Light Load', cpu: 55, memory: 62, latency: 220, throughput: 850 },
    { phase: 'Heavy Load', cpu: 78, memory: 84, latency: 450, throughput: 650 },
    { phase: 'Peak Load', cpu: 92, memory: 95, latency: 800, throughput: 400 },
    { phase: 'Recovery', cpu: 65, memory: 70, latency: 280, throughput: 750 }
  ];

  console.log('Tracking performance degradation and recovery:\n');

  for (const phase of performanceScenario) {
    console.log(`   Phase: ${phase.phase}`);
    console.log(`   Metrics: CPU ${phase.cpu}%, Memory ${phase.memory}%, Latency ${phase.latency}ms, Throughput ${phase.throughput}/s`);

    const metrics = {
      timestamp: new Date(),
      cpu_usage: phase.cpu,
      memory_usage: phase.memory,
      response_time: phase.latency,
      throughput: phase.throughput
    };

    const result = await sentinel.execute(metrics);

    // Performance analysis
    const performanceScore = calculatePerformanceScore(phase);
    console.log(`   Performance Score: ${performanceScore}/100`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    
    if (result.alerts.length > 0) {
      console.log(`   Alerts: ${result.alerts.map(a => a.level).join(', ')}`);
    }

    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get metrics history
  console.log('Recent Metrics History:');
  const metricsHistory = sentinel.getMetrics('cpu_usage');
  if (metricsHistory.length > 0) {
    console.log('   CPU Usage Timeline:');
    metricsHistory.slice(-5).forEach(metric => {
      console.log(`      ${metric.timestamp.toLocaleTimeString()}: ${metric.value}%`);
    });
  }

  console.log('');
}

async function multiServiceExample(sentinel: SentinelAgent) {
  console.log('🔧 Example 5: Multi-Service Monitoring');
  console.log('-------------------------------------');

  // Add monitoring targets for different services
  const services = [
    {
      id: 'web-server',
      name: 'Web Server',
      type: 'service' as const,
      checkInterval: 30,
      timeout: 5,
      enabled: true,
      healthChecks: ['response_time', 'error_rate'],
      thresholds: ['web_latency']
    },
    {
      id: 'database',
      name: 'Primary Database',
      type: 'database' as const,
      checkInterval: 60,
      timeout: 10,
      enabled: true,
      healthChecks: ['connection_pool', 'query_time'],
      thresholds: ['db_connections']
    },
    {
      id: 'cache-layer',
      name: 'Redis Cache',
      type: 'cache' as const,
      checkInterval: 45,
      timeout: 3,
      enabled: true,
      healthChecks: ['hit_ratio', 'memory_usage'],
      thresholds: ['cache_performance']
    }
  ];

  console.log('Adding monitoring targets:');
  for (const service of services) {
    await sentinel.addTarget(service);
    console.log(`   ✅ Added: ${service.name} (${service.type})`);
  }

  console.log('\nSimulating multi-service health checks...');

  // Simulate service states
  const serviceStates = {
    'web-server': { status: 'healthy', response_time: 240, error_rate: 0.8 },
    'database': { status: 'degraded', connection_pool_usage: 85, query_time: 450 },
    'cache-layer': { status: 'healthy', hit_ratio: 0.92, memory_usage: 65 }
  };

  for (const [serviceId, state] of Object.entries(serviceStates)) {
    console.log(`\n   Service: ${serviceId}`);
    console.log(`   State: ${JSON.stringify(state, null, 2)}`);

    const result = await sentinel.execute({
      service_id: serviceId,
      ...state
    });

    console.log(`   Overall Status: ${result.status.toUpperCase()}`);
    
    if (result.alerts.length > 0) {
      result.alerts.forEach(alert => {
        console.log(`   🚨 ${alert.level.toUpperCase()}: ${alert.message}`);
      });
    }
  }

  // Show monitoring summary
  console.log('\nMonitoring Summary:');
  console.log(`   Active Targets: ${services.length}`);
  console.log(`   Total Alerts: ${sentinel.getActiveAlerts().length}`);
  console.log(`   Agent Status: ${sentinel.getStatus()}`);

  console.log('');
}

// Helper functions
function calculatePerformanceScore(phase: any): number {
  // Simple performance scoring algorithm
  const cpuScore = Math.max(0, 100 - phase.cpu);
  const memoryScore = Math.max(0, 100 - phase.memory);
  const latencyScore = Math.max(0, 100 - (phase.latency / 10));
  const throughputScore = Math.min(100, phase.throughput / 10);

  return Math.round((cpuScore + memoryScore + latencyScore + throughputScore) / 4);
}

// Run examples
if (require.main === module) {
  runSentinelExamples()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Sentinel examples failed:', error);
      process.exit(1);
    });
}

export { runSentinelExamples };