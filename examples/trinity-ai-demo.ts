#!/usr/bin/env ts-node

/**
 * Trinity AI Reference Agents Demo
 * 
 * Complete working example showcasing Oracle, Sentinel, and Sage agents
 * working together to provide comprehensive AI orchestration.
 * 
 * This demo simulates a real-world scenario where:
 * - Oracle predicts system performance and user behavior
 * - Sentinel monitors system health and detects anomalies
 * - Sage provides strategic recommendations based on predictions and monitoring
 */

import { Logger } from '../src/utils/logger';
import { OracleAgent } from '../src/agents/oracle-agent';
import { SentinelAgent } from '../src/agents/sentinel-agent';
import { SageAgent } from '../src/agents/sage-agent';
import { AgentConfig } from '../src/types/agent';

// Demo configuration
const demoConfig = {
  duration: 60000, // 1 minute demo
  dataInterval: 5000, // Generate data every 5 seconds
  scenario: 'e-commerce-platform' // Demo scenario type
};

// Initialize logger
const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: ['console']
});

/**
 * Demo: E-commerce Platform Intelligence
 * 
 * Scenario: An e-commerce platform using Trinity AI agents to:
 * 1. Predict sales trends and user behavior (Oracle)
 * 2. Monitor system performance and detect issues (Sentinel)
 * 3. Provide strategic business recommendations (Sage)
 */
async function runTrinityAIDemo() {
  console.log('🚀 Starting Trinity AI Reference Agents Demo');
  console.log('==================================================\n');

  // Initialize agents
  const oracle = await initializeOracleAgent();
  const sentinel = await initializeSentinelAgent();
  const sage = await initializeSageAgent();

  console.log('✅ All Trinity AI agents initialized successfully\n');

  // Demo data streams
  const businessMetrics = new BusinessMetricsSimulator();
  const systemMetrics = new SystemMetricsSimulator();
  
  // Start monitoring loops
  const oracleInterval = startOraclePredictions(oracle, businessMetrics);
  const sentinelInterval = startSentinelMonitoring(sentinel, systemMetrics);
  const sageInterval = startSageAnalysis(sage, oracle, sentinel);

  // Run demo for specified duration
  await new Promise(resolve => setTimeout(resolve, demoConfig.duration));

  // Cleanup
  clearInterval(oracleInterval);
  clearInterval(sentinelInterval);
  clearInterval(sageInterval);

  // Generate final report
  await generateFinalReport(oracle, sentinel, sage);

  console.log('\n✅ Trinity AI Demo completed successfully');
  console.log('Check the generated reports and logs above for insights.');
}

async function initializeOracleAgent(): Promise<OracleAgent> {
  const config: AgentConfig = {
    id: 'oracle-demo',
    name: 'Oracle Prediction Agent',
    version: '1.0.0',
    type: 'prediction',
    description: 'Demo Oracle agent for e-commerce predictions',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const oracle = new OracleAgent(config, logger);
  await oracle.initialize();
  
  console.log('🔮 Oracle Agent: Ready to predict the future');
  return oracle;
}

async function initializeSentinelAgent(): Promise<SentinelAgent> {
  const config: AgentConfig = {
    id: 'sentinel-demo',
    name: 'Sentinel Monitoring Agent',
    version: '1.0.0',
    type: 'monitoring',
    description: 'Demo Sentinel agent for system monitoring',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sentinel = new SentinelAgent(config, logger);
  await sentinel.initialize();
  
  // Set up custom thresholds for demo
  sentinel.setThreshold('response_time', { condition: 'gt', value: 800, severity: 'warning' });
  sentinel.setThreshold('error_rate', { condition: 'gt', value: 3, severity: 'critical' });
  sentinel.setThreshold('cpu_usage', { condition: 'gt', value: 75, severity: 'warning' });
  
  console.log('🛡️  Sentinel Agent: Standing guard over your systems');
  return sentinel;
}

async function initializeSageAgent(): Promise<SageAgent> {
  const config: AgentConfig = {
    id: 'sage-demo',
    name: 'Sage Advisory Agent',
    version: '1.0.0',
    type: 'advisory',
    description: 'Demo Sage agent for strategic recommendations',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const sage = new SageAgent(config, logger);
  await sage.initialize();
  
  // Add e-commerce domain knowledge
  await sage.addKnowledge('ecommerce', {
    conversionOptimization: ['A/B testing', 'Personalization', 'Cart abandonment recovery'],
    performanceOptimization: ['CDN implementation', 'Image optimization', 'Database indexing'],
    growthStrategies: ['SEO optimization', 'Social media marketing', 'Influencer partnerships']
  });
  
  console.log('🧠 Sage Agent: Wisdom and guidance at your service');
  return sage;
}

function startOraclePredictions(oracle: OracleAgent, simulator: BusinessMetricsSimulator): NodeJS.Timeout {
  console.log('\n📊 Starting Oracle predictions...\n');
  
  return setInterval(async () => {
    try {
      const currentData = simulator.generateMetrics();
      
      // Predict sales for next hour
      const salesPrediction = await oracle.execute(currentData.sales, {
        model: 'default-forecast',
        timeHorizon: 60, // 1 hour
        includeFactors: true
      });
      
      // Predict user behavior
      const behaviorPrediction = await oracle.execute(currentData.users, {
        model: 'business-classifier',
        includeAlternatives: true
      });
      
      console.log('🔮 Oracle Predictions:');
      console.log(`   Sales Forecast: $${salesPrediction.result.prediction.toLocaleString()} (confidence: ${Math.round(salesPrediction.result.confidence * 100)}%)`);
      console.log(`   User Behavior: ${behaviorPrediction.result.prediction.class} (${Math.round(behaviorPrediction.result.prediction.probability * 100)}%)`);
      
      if (salesPrediction.result.factors && salesPrediction.result.factors.length > 0) {
        console.log(`   Key Factors: ${salesPrediction.result.factors.map(f => f.name).join(', ')}`);
      }
      console.log('');
      
    } catch (error) {
      console.error('❌ Oracle prediction failed:', error);
    }
  }, demoConfig.dataInterval);
}

function startSentinelMonitoring(sentinel: SentinelAgent, simulator: SystemMetricsSimulator): NodeJS.Timeout {
  console.log('🛡️  Starting Sentinel monitoring...\n');
  
  return setInterval(async () => {
    try {
      const systemData = simulator.generateMetrics();
      
      const monitoringResult = await sentinel.execute(systemData);
      
      console.log('🛡️  Sentinel Report:');
      console.log(`   System Status: ${monitoringResult.status.toUpperCase()}`);
      console.log(`   CPU: ${systemData.cpu_usage}%, Memory: ${systemData.memory_usage}%, Response Time: ${systemData.response_time}ms`);
      
      if (monitoringResult.alerts && monitoringResult.alerts.length > 0) {
        console.log('   🚨 ALERTS:');
        monitoringResult.alerts.forEach(alert => {
          console.log(`      ${alert.level.toUpperCase()}: ${alert.message}`);
        });
      } else {
        console.log('   ✅ No alerts - all systems normal');
      }
      
      console.log('');
      
    } catch (error) {
      console.error('❌ Sentinel monitoring failed:', error);
    }
  }, demoConfig.dataInterval);
}

function startSageAnalysis(sage: SageAgent, oracle: OracleAgent, sentinel: SentinelAgent): NodeJS.Timeout {
  console.log('🧠 Starting Sage strategic analysis...\n');
  
  let analysisCount = 0;
  
  return setInterval(async () => {
    try {
      analysisCount++;
      
      // Get current state from Oracle and Sentinel
      const oracleState = await oracle.getState();
      const sentinelState = await sentinel.getState();
      
      // Create advisory context
      const context = {
        domain: 'ecommerce',
        objective: analysisCount === 1 
          ? 'Optimize conversion rates and system performance' 
          : analysisCount === 2
          ? 'Develop growth strategy based on current trends'
          : 'Improve operational efficiency and reduce costs',
        riskTolerance: 'medium' as const,
        timeline: 'medium-term',
        currentState: {
          predictions: oracleState,
          monitoring: sentinelState,
          businessPhase: 'growth'
        }
      };
      
      const recommendations = await sage.execute(context);
      
      console.log('🧠 Sage Recommendations:');
      console.log(`   Analysis: ${context.objective}`);
      console.log(`   Confidence: ${Math.round((recommendations.metadata?.confidence || 0) * 100)}%`);
      console.log('   Top Recommendations:');
      
      recommendations.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`      ${index + 1}. ${rec.action} (Impact: ${rec.impact}, Confidence: ${Math.round(rec.confidence * 100)}%)`);
      });
      
      if (recommendations.reasoning) {
        console.log(`   Reasoning: ${recommendations.reasoning.substring(0, 100)}...`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error('❌ Sage analysis failed:', error);
    }
  }, demoConfig.dataInterval * 2); // Run every 10 seconds
}

async function generateFinalReport(oracle: OracleAgent, sentinel: SentinelAgent, sage: SageAgent) {
  console.log('\n📋 FINAL TRINITY AI REPORT');
  console.log('==========================\n');
  
  // Oracle Summary
  console.log('🔮 ORACLE AGENT SUMMARY:');
  console.log(`   Total Predictions: ${oracle.metrics.executionCount}`);
  console.log(`   Success Rate: ${Math.round(oracle.metrics.successRate * 100)}%`);
  console.log(`   Average Execution Time: ${Math.round(oracle.metrics.averageExecutionTime)}ms`);
  
  const predictionHistory = oracle.getPredictionHistory(5);
  if (predictionHistory.length > 0) {
    console.log('   Recent Predictions:');
    predictionHistory.forEach(pred => {
      console.log(`      ${pred.timestamp.toLocaleTimeString()}: Confidence ${Math.round(pred.result.confidence * 100)}%`);
    });
  }
  
  console.log('');
  
  // Sentinel Summary
  console.log('🛡️  SENTINEL AGENT SUMMARY:');
  console.log(`   Total Monitoring Cycles: ${sentinel.metrics.executionCount}`);
  console.log(`   System Status: ${sentinel.getStatus()}`);
  
  const activeAlerts = sentinel.getActiveAlerts();
  console.log(`   Active Alerts: ${activeAlerts.length}`);
  if (activeAlerts.length > 0) {
    console.log('   Alert Details:');
    activeAlerts.forEach(alert => {
      console.log(`      ${alert.level.toUpperCase()}: ${alert.message}`);
    });
  }
  
  console.log('');
  
  // Sage Summary
  console.log('🧠 SAGE AGENT SUMMARY:');
  console.log(`   Total Analyses: ${sage.metrics.executionCount}`);
  console.log(`   Recommendations Generated: ${sage.metrics.executionCount * 3}`); // Approximate
  
  const recommendationHistory = sage.getRecommendationHistory(3);
  if (recommendationHistory.length > 0) {
    console.log('   Recent Strategic Insights:');
    recommendationHistory.forEach(rec => {
      const topRec = rec.result.recommendations[0];
      if (topRec) {
        console.log(`      ${rec.timestamp.toLocaleTimeString()}: ${topRec.action} (${topRec.impact} impact)`);
      }
    });
  }
  
  console.log('\n💡 KEY INSIGHTS:');
  console.log('   • Trinity AI agents work synergistically to provide comprehensive intelligence');
  console.log('   • Oracle predictions inform strategic planning and resource allocation');
  console.log('   • Sentinel monitoring ensures system reliability and performance');
  console.log('   • Sage recommendations integrate predictive and monitoring insights');
  console.log('   • Real-time orchestration enables proactive decision-making');
}

// Simulator classes for demo data
class BusinessMetricsSimulator {
  private baselineData = {
    sales: 50000,
    users: 1200,
    conversions: 150,
    avgOrderValue: 85
  };
  
  generateMetrics() {
    const timeOfDay = new Date().getHours();
    const peakHours = timeOfDay >= 10 && timeOfDay <= 22;
    const weekendBoost = [0, 6].includes(new Date().getDay()) ? 1.2 : 1;
    
    return {
      timestamp: new Date(),
      sales: this.addVariation(this.baselineData.sales * (peakHours ? 1.3 : 0.7) * weekendBoost, 0.15),
      users: this.addVariation(this.baselineData.users * (peakHours ? 1.5 : 0.5) * weekendBoost, 0.2),
      conversions: this.addVariation(this.baselineData.conversions * (peakHours ? 1.2 : 0.8), 0.25),
      avgOrderValue: this.addVariation(this.baselineData.avgOrderValue, 0.1)
    };
  }
  
  private addVariation(value: number, variationPercent: number): number {
    const variation = (Math.random() - 0.5) * 2 * variationPercent;
    return Math.round(value * (1 + variation));
  }
}

class SystemMetricsSimulator {
  generateMetrics() {
    // Simulate realistic system metrics with some correlation
    const baseLoad = 0.3 + Math.random() * 0.4; // 30-70% base load
    
    const cpuUsage = Math.round((baseLoad + Math.random() * 0.2) * 100);
    const memoryUsage = Math.round((baseLoad * 0.8 + Math.random() * 0.3) * 100);
    const responseTime = Math.round(200 + baseLoad * 300 + Math.random() * 200); // 200-700ms
    const errorRate = baseLoad > 0.6 ? Math.random() * 5 : Math.random() * 1; // Higher error rate under load
    const throughput = Math.round(1000 - baseLoad * 400); // Lower throughput under high load
    
    return {
      timestamp: new Date(),
      cpu_usage: Math.min(100, cpuUsage),
      memory_usage: Math.min(100, memoryUsage),
      response_time: responseTime,
      error_rate: Math.round(errorRate * 100) / 100,
      throughput,
      disk_usage: Math.round(40 + Math.random() * 20), // 40-60%
      network_io: Math.round(baseLoad * 1000 + Math.random() * 500)
    };
  }
}

// Run the demo
if (require.main === module) {
  runTrinityAIDemo()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

export { runTrinityAIDemo };