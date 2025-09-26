#!/usr/bin/env ts-node

/**
 * Oracle Agent Examples
 * 
 * Demonstrates various prediction and forecasting capabilities:
 * - Time series forecasting
 * - Business metrics prediction  
 * - Anomaly detection
 * - Multi-model inference
 */

import { Logger } from '../src/utils/logger';
import { OracleAgent } from '../src/agents/oracle-agent';
import { AgentConfig } from '../src/types/agent';

const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: ['console']
});

async function runOracleExamples() {
  console.log('🔮 Oracle Agent Examples');
  console.log('========================\n');

  const oracle = await initializeOracle();

  // Example 1: Sales Forecasting
  await salesForecastingExample(oracle);

  // Example 2: System Performance Prediction
  await performancePredictionExample(oracle);

  // Example 3: User Behavior Classification
  await userBehaviorExample(oracle);

  // Example 4: Anomaly Detection
  await anomalyDetectionExample(oracle);

  // Example 5: Multi-Model Comparison
  await multiModelComparisonExample(oracle);

  console.log('✅ All Oracle examples completed successfully');
}

async function initializeOracle(): Promise<OracleAgent> {
  const config: AgentConfig = {
    id: 'oracle-examples',
    name: 'Oracle Examples Agent',
    version: '1.0.0',
    type: 'prediction',
    description: 'Oracle agent for demonstration examples',
    capabilities: [],
    tools: [],
    memory: { type: 'ephemeral', store: 'memory' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const oracle = new OracleAgent(config, logger);
  await oracle.initialize();
  
  console.log('🔮 Oracle Agent initialized with prediction models:\n');
  const models = oracle.getAvailableModels();
  models.forEach(model => {
    console.log(`   • ${model.name} (${model.type}) - Accuracy: ${Math.round(model.accuracy * 100)}%`);
  });
  console.log('');

  return oracle;
}

async function salesForecastingExample(oracle: OracleAgent) {
  console.log('📈 Example 1: Sales Forecasting');
  console.log('--------------------------------');

  // Historical sales data (last 30 days)
  const historicalSales = generateHistoricalSales();
  
  console.log('Historical sales data (last 7 days):');
  historicalSales.slice(-7).forEach((sale, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    console.log(`   ${date.toLocaleDateString()}: $${sale.toLocaleString()}`);
  });

  // Predict next week's sales
  const prediction = await oracle.execute(historicalSales, {
    model: 'default-forecast',
    timeHorizon: 7 * 24 * 60, // 7 days in minutes
    includeFactors: true
  });

  console.log('\nForecast Results:');
  console.log(`   Next Week Prediction: $${prediction.result.prediction.toLocaleString()}`);
  console.log(`   Confidence: ${Math.round(prediction.result.confidence * 100)}%`);
  
  if (prediction.result.factors) {
    console.log(`   Key Factors: ${prediction.result.factors.map(f => f.name).join(', ')}`);
  }

  console.log('');
}

async function performancePredictionExample(oracle: OracleAgent) {
  console.log('⚡ Example 2: System Performance Prediction');
  console.log('------------------------------------------');

  // Current system metrics
  const systemMetrics = {
    cpu_usage: 65,
    memory_usage: 72,
    disk_io: 450,
    network_io: 280,
    active_connections: 1250
  };

  console.log('Current System Metrics:');
  Object.entries(systemMetrics).forEach(([metric, value]) => {
    console.log(`   ${metric.replace('_', ' ')}: ${value}${getMetricUnit(metric)}`);
  });

  // Predict system performance for next hour
  const prediction = await oracle.execute(systemMetrics, {
    model: 'performance-regressor',
    timeHorizon: 60, // 1 hour
    includeFactors: true
  });

  console.log('\nPerformance Prediction:');
  console.log(`   Predicted Load Score: ${Math.round(prediction.result.prediction)}/100`);
  console.log(`   Confidence: ${Math.round(prediction.result.confidence * 100)}%`);
  console.log(`   Risk Level: ${prediction.result.prediction > 80 ? 'HIGH' : prediction.result.prediction > 60 ? 'MEDIUM' : 'LOW'}`);

  console.log('');
}

async function userBehaviorExample(oracle: OracleAgent) {
  console.log('👥 Example 3: User Behavior Classification');
  console.log('------------------------------------------');

  // User session data
  const userSessions = [
    { pageViews: 12, sessionDuration: 480, bounceRate: 0.2, conversionRate: 0.08 },
    { pageViews: 3, sessionDuration: 45, bounceRate: 0.9, conversionRate: 0.0 },
    { pageViews: 25, sessionDuration: 920, bounceRate: 0.1, conversionRate: 0.15 }
  ];

  console.log('Analyzing User Behavior Patterns:');

  for (let i = 0; i < userSessions.length; i++) {
    const session = userSessions[i];
    console.log(`\n   Session ${i + 1}: ${session.pageViews} pages, ${session.sessionDuration}s duration`);

    const prediction = await oracle.execute(session, {
      model: 'business-classifier'
    });

    const result = prediction.result.prediction;
    console.log(`   Classification: ${result.class} (${Math.round(result.probability * 100)}% confidence)`);
    
    if (result.allClasses) {
      console.log('   All Classifications:');
      result.allClasses.forEach((cls: any) => {
        console.log(`      ${cls.class}: ${Math.round(cls.score * 100)}%`);
      });
    }
  }

  console.log('');
}

async function anomalyDetectionExample(oracle: OracleAgent) {
  console.log('🚨 Example 4: Anomaly Detection');
  console.log('-------------------------------');

  // Generate normal and anomalous data
  const datasets = [
    { name: 'Normal Traffic', data: { response_time: 250, error_rate: 0.02, throughput: 850 }},
    { name: 'Suspicious Spike', data: { response_time: 1200, error_rate: 0.08, throughput: 450 }},
    { name: 'Normal Peak', data: { response_time: 320, error_rate: 0.015, throughput: 1200 }},
    { name: 'System Issue', data: { response_time: 2500, error_rate: 0.25, throughput: 100 }}
  ];

  console.log('Analyzing Traffic Patterns for Anomalies:\n');

  for (const dataset of datasets) {
    console.log(`   Dataset: ${dataset.name}`);
    console.log(`   Metrics: ${JSON.stringify(dataset.data)}`);

    const prediction = await oracle.execute(dataset.data, {
      model: 'anomaly-detector'
    });

    const result = prediction.result.prediction;
    console.log(`   Anomaly Status: ${result.isAnomaly ? '🚨 ANOMALY DETECTED' : '✅ Normal'}`);
    console.log(`   Anomaly Score: ${Math.round(result.anomalyScore * 100)}%`);
    console.log(`   Severity: ${result.severity.toUpperCase()}`);
    console.log('');
  }
}

async function multiModelComparisonExample(oracle: OracleAgent) {
  console.log('🔬 Example 5: Multi-Model Comparison');
  console.log('------------------------------------');

  const testData = {
    revenue: 125000,
    users: 2400,
    conversion_rate: 0.045,
    churn_rate: 0.08
  };

  console.log('Test Data:', JSON.stringify(testData, null, 2));
  console.log('\nComparing Predictions Across Models:\n');

  const models = oracle.getAvailableModels();
  
  for (const model of models) {
    try {
      console.log(`   Model: ${model.name} (${model.type})`);
      
      const prediction = await oracle.execute(testData, {
        model: model.id,
        includeFactors: true
      });

      console.log(`   Result: ${JSON.stringify(prediction.result.prediction)}`);
      console.log(`   Confidence: ${Math.round(prediction.result.confidence * 100)}%`);
      console.log(`   Execution Time: ${prediction.result.metadata.executionTime}ms`);
      console.log('');

    } catch (error) {
      console.log(`   ❌ Model incompatible with test data: ${error}`);
      console.log('');
    }
  }
}

// Helper functions
function generateHistoricalSales(): number[] {
  const sales = [];
  let baseSales = 50000;
  
  for (let i = 0; i < 30; i++) {
    // Add trend, seasonality, and noise
    const trend = i * 500; // Growing trend
    const seasonality = Math.sin(i * Math.PI / 7) * 5000; // Weekly pattern
    const noise = (Math.random() - 0.5) * 8000; // Random variation
    
    sales.push(Math.max(0, baseSales + trend + seasonality + noise));
  }
  
  return sales;
}

function getMetricUnit(metric: string): string {
  if (metric.includes('usage')) return '%';
  if (metric.includes('io')) return ' MB/s';
  if (metric.includes('connections')) return '';
  return '';
}

// Run examples
if (require.main === module) {
  runOracleExamples()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Oracle examples failed:', error);
      process.exit(1);
    });
}

export { runOracleExamples };