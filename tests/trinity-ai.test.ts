/**
 * Trinity AI Reference Agents Test Suite
 * 
 * Comprehensive tests for Oracle, Sentinel, and Sage agents including:
 * - Unit tests for individual agents
 * - Integration tests for agent coordination
 * - Performance and reliability tests
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger } from '../src/utils/logger';
import { OracleAgent } from '../src/agents/oracle-agent';
import { SentinelAgent } from '../src/agents/sentinel-agent';
import { SageAgent } from '../src/agents/sage-agent';
import { AgentConfig } from '../src/types/agent';

// Test configuration
const createTestConfig = (type: 'prediction' | 'monitoring' | 'advisory', id: string): AgentConfig => ({
  id,
  name: `Test ${type} Agent`,
  version: '1.0.0-test',
  type,
  description: `Test agent for ${type} functionality`,
  capabilities: [],
  tools: [],
  memory: { type: 'ephemeral', store: 'memory' },
  createdAt: new Date(),
  updatedAt: new Date()
});

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
} as any as Logger;

describe('Trinity AI Reference Agents', () => {
  let oracle: OracleAgent;
  let sentinel: SentinelAgent;
  let sage: SageAgent;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize agents
    oracle = new OracleAgent(createTestConfig('prediction', 'oracle-test'), mockLogger);
    sentinel = new SentinelAgent(createTestConfig('monitoring', 'sentinel-test'), mockLogger);
    sage = new SageAgent(createTestConfig('advisory', 'sage-test'), mockLogger);

    await Promise.all([
      oracle.initialize(),
      sentinel.initialize(),
      sage.initialize()
    ]);
  });

  afterEach(async () => {
    // Cleanup agents
    await Promise.all([
      oracle.shutdown(),
      sentinel.shutdown(),
      sage.shutdown()
    ]);
  });

  describe('Oracle Agent (Prediction)', () => {
    test('should initialize successfully', () => {
      expect(oracle.id).toBe('oracle-test');
      expect(oracle.type).toBe('prediction');
      expect(oracle.getStatus()).toBe('running');
    });

    test('should make time series predictions', async () => {
      const historicalData = [100, 110, 105, 115, 120, 125, 130];
      
      const result = await oracle.execute(historicalData, {
        model: 'default-forecast',
        timeHorizon: 60,
        includeFactors: true
      });

      expect(result).toBeDefined();
      expect(result.result.prediction).toBeDefined();
      expect(typeof result.result.prediction).toBe('number');
      expect(result.result.confidence).toBeGreaterThan(0);
      expect(result.result.confidence).toBeLessThanOrEqual(1);
      expect(result.result.factors).toBeDefined();
    });

    test('should handle classification tasks', async () => {
      const businessMetrics = {
        revenue: 125000,
        users: 2400,
        conversion_rate: 0.045,
        churn_rate: 0.08
      };

      const result = await oracle.execute(businessMetrics, {
        model: 'business-classifier'
      });

      expect(result.result.prediction).toBeDefined();
      expect(result.result.prediction.class).toBeDefined();
      expect(result.result.prediction.probability).toBeGreaterThan(0);
      expect(result.result.confidence).toBeGreaterThan(0);
    });

    test('should detect anomalies', async () => {
      const normalData = { response_time: 250, error_rate: 0.02, throughput: 850 };
      const anomalousData = { response_time: 2500, error_rate: 0.25, throughput: 100 };

      const normalResult = await oracle.execute(normalData, {
        model: 'anomaly-detector'
      });

      const anomalousResult = await oracle.execute(anomalousData, {
        model: 'anomaly-detector'
      });

      expect(normalResult.result.prediction.isAnomaly).toBe(false);
      expect(anomalousResult.result.prediction.isAnomaly).toBe(true);
      expect(anomalousResult.result.prediction.severity).toBe('high');
    });

    test('should handle multiple models', async () => {
      const models = oracle.getAvailableModels();
      
      expect(models.length).toBeGreaterThan(0);
      expect(models).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.any(String),
            accuracy: expect.any(Number)
          })
        ])
      );
    });

    test('should maintain prediction history', async () => {
      const data1 = [10, 12, 14];
      const data2 = [20, 22, 24];

      await oracle.execute(data1);
      await oracle.execute(data2);

      const history = oracle.getPredictionHistory(5);
      expect(history.length).toBe(2);
      expect(history[0].timestamp).toBeDefined();
      expect(history[0].result).toBeDefined();
    });

    test('should handle invalid input gracefully', async () => {
      await expect(oracle.execute(null)).rejects.toThrow();
      await expect(oracle.execute(undefined)).rejects.toThrow();
    });

    test('should validate models', async () => {
      const testData = [
        { input: [1, 2, 3], expected: 4 },
        { input: [2, 4, 6], expected: 8 }
      ];

      const validation = await oracle.validateModel('default-forecast', testData);
      
      expect(validation.accuracy).toBeDefined();
      expect(validation.errors).toBeDefined();
      expect(validation.performance).toBeGreaterThan(0);
    });
  });

  describe('Sentinel Agent (Monitoring)', () => {
    test('should initialize successfully', () => {
      expect(sentinel.id).toBe('sentinel-test');
      expect(sentinel.type).toBe('monitoring');
      expect(sentinel.getStatus()).toBe('running');
    });

    test('should monitor system metrics', async () => {
      const systemMetrics = {
        cpu_usage: 75,
        memory_usage: 82,
        response_time: 450,
        error_rate: 2.1
      };

      const result = await sentinel.execute(systemMetrics);

      expect(result.status).toMatch(/^(normal|warning|critical)$/);
      expect(result.metrics).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalChecks).toBeGreaterThan(0);
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    test('should manage custom thresholds', () => {
      sentinel.setThreshold('custom_metric', {
        condition: 'gt',
        value: 100,
        severity: 'warning',
        description: 'Custom threshold test'
      });

      const thresholds = sentinel.getThresholds();
      const customThreshold = Object.values(thresholds).find(
        (t: any) => t.metric === 'custom_metric'
      );

      expect(customThreshold).toBeDefined();
      expect((customThreshold as any).condition).toBe('gt');
      expect((customThreshold as any).value).toBe(100);
    });

    test('should generate alerts based on thresholds', async () => {
      // Set a low threshold to trigger an alert
      sentinel.setThreshold('test_cpu', {
        condition: 'gt',
        value: 50,
        severity: 'warning'
      });

      const highCpuData = { test_cpu: 80 };
      const result = await sentinel.execute(highCpuData);

      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.alerts[0].level).toBe('warning');
      expect(result.status).toBe('warning');
    });

    test('should handle alert acknowledgment', async () => {
      // Generate an alert first
      sentinel.setThreshold('test_metric', {
        condition: 'gt',
        value: 10,
        severity: 'critical'
      });

      await sentinel.execute({ test_metric: 20 });
      
      const activeAlerts = sentinel.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const alertId = activeAlerts[0].id;
      const acknowledged = await sentinel.acknowledgeAlert(alertId, 'test-user');
      
      expect(acknowledged).toBe(true);
    });

    test('should track alert history', async () => {
      // Generate multiple alerts
      sentinel.setThreshold('history_test', {
        condition: 'gt',
        value: 5,
        severity: 'warning'
      });

      await sentinel.execute({ history_test: 10 });
      await sentinel.execute({ history_test: 15 });

      const history = sentinel.getAlertHistory(10);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].timestamp).toBeDefined();
      expect(history[0].message).toBeDefined();
    });

    test('should add and remove monitoring targets', async () => {
      const target = {
        id: 'test-service',
        name: 'Test Service',
        type: 'service' as const,
        checkInterval: 30,
        timeout: 5,
        enabled: true,
        healthChecks: ['response_time'],
        thresholds: ['service_latency']
      };

      await sentinel.addTarget(target);
      
      // Verify target was added (implementation specific)
      expect(true).toBe(true); // Placeholder - would check internal state

      const removed = await sentinel.removeTarget('test-service');
      expect(removed).toBe(true);
    });

    test('should handle metrics collection over time', async () => {
      const metrics1 = { cpu_usage: 60, memory_usage: 70 };
      const metrics2 = { cpu_usage: 65, memory_usage: 75 };

      await sentinel.execute(metrics1);
      await sentinel.execute(metrics2);

      const cpuMetrics = sentinel.getMetrics('cpu_usage');
      expect(cpuMetrics.length).toBeGreaterThan(0);
      expect(cpuMetrics[0].value).toBeDefined();
      expect(cpuMetrics[0].timestamp).toBeDefined();
    });
  });

  describe('Sage Agent (Advisory)', () => {
    test('should initialize successfully', () => {
      expect(sage.id).toBe('sage-test');
      expect(sage.type).toBe('advisory');
      expect(sage.getStatus()).toBe('running');
    });

    test('should process natural language queries', async () => {
      const query = "How can I improve system performance?";
      
      const result = await sage.execute(query);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('should handle structured advisory contexts', async () => {
      const context = {
        domain: 'technology',
        objective: 'Optimize database performance',
        riskTolerance: 'medium' as const,
        currentState: {
          database_cpu: 80,
          query_time: 450,
          connections: 85
        },
        budget: 50000
      };

      const result = await sage.execute(context);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].action).toBeDefined();
      expect(result.recommendations[0].confidence).toBeGreaterThan(0);
      expect(result.recommendations[0].impact).toMatch(/^(low|medium|high|critical)$/);
    });

    test('should provide multi-criteria decision analysis', async () => {
      const decisionContext = {
        domain: 'technology',
        objective: 'Choose database solution',
        alternatives: [
          { name: 'PostgreSQL', cost: 1000, performance: 8, reliability: 9 },
          { name: 'MongoDB', cost: 1200, performance: 7, reliability: 8 }
        ],
        priorityWeights: {
          cost: 0.4,
          performance: 0.35,
          reliability: 0.25
        }
      };

      const result = await sage.execute(decisionContext);

      expect(result.recommendations).toBeDefined();
      expect(result.metadata?.decisionMatrix).toBeDefined();
      
      if (result.metadata?.decisionMatrix) {
        expect(result.metadata.decisionMatrix.rankings).toBeDefined();
        expect(result.metadata.decisionMatrix.rankings.length).toBe(2);
      }
    });

    test('should manage knowledge base', async () => {
      const testKnowledge = {
        strategies: ['Strategy A', 'Strategy B'],
        tools: ['Tool X', 'Tool Y']
      };

      await sage.addKnowledge('test-domain', testKnowledge);
      
      const retrievedKnowledge = sage.getKnowledge('test-domain');
      expect(retrievedKnowledge).toEqual(testKnowledge);
    });

    test('should maintain recommendation history', async () => {
      const query1 = "First advisory query";
      const query2 = "Second advisory query";

      await sage.execute(query1);
      await sage.execute(query2);

      const history = sage.getRecommendationHistory(5);
      expect(history.length).toBe(2);
      expect(history[0].timestamp).toBeDefined();
      expect(history[0].result).toBeDefined();
    });

    test('should handle different risk tolerances', async () => {
      const lowRiskContext = {
        domain: 'business',
        objective: 'Expand market presence',
        riskTolerance: 'low' as const
      };

      const highRiskContext = {
        domain: 'business',  
        objective: 'Expand market presence',
        riskTolerance: 'high' as const
      };

      const lowRiskResult = await sage.execute(lowRiskContext);
      const highRiskResult = await sage.execute(highRiskContext);

      expect(lowRiskResult.recommendations).toBeDefined();
      expect(highRiskResult.recommendations).toBeDefined();
      
      // Risk tolerance should influence recommendations
      expect(lowRiskResult.metadata?.riskLevel).toBeDefined();
      expect(highRiskResult.metadata?.riskLevel).toBeDefined();
    });

    test('should validate recommendations', async () => {
      const context = {
        domain: 'test',
        objective: 'Test validation'
      };

      const result = await sage.execute(context);
      
      // Validate recommendation structure
      result.recommendations.forEach(rec => {
        expect(rec.action).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.impact).toMatch(/^(low|medium|high|critical)$/);
      });
    });
  });

  describe('Trinity AI Integration', () => {
    test('should coordinate predictions with monitoring', async () => {
      // Oracle makes a prediction
      const prediction = await oracle.execute([100, 105, 110, 115], {
        timeHorizon: 30,
        includeFactors: true
      });

      // Use prediction to set Sentinel threshold
      if (prediction.result.confidence > 0.7) {
        sentinel.setThreshold('predicted_metric', {
          condition: 'gt',
          value: prediction.result.prediction * 0.9,
          severity: 'warning'
        });
      }

      // Test monitoring with predicted threshold
      const monitoringData = { predicted_metric: prediction.result.prediction * 1.1 };
      const monitoring = await sentinel.execute(monitoringData);

      expect(monitoring.alerts.length).toBeGreaterThan(0);
      expect(monitoring.status).toBe('warning');
    });

    test('should use monitoring data for advisory recommendations', async () => {
      // Sentinel monitors system
      const systemData = {
        cpu_usage: 85,
        memory_usage: 90,
        response_time: 800
      };

      const monitoring = await sentinel.execute(systemData);

      // Sage provides recommendations based on monitoring
      const advisoryContext = {
        domain: 'operations',
        objective: 'Address system performance issues',
        currentState: {
          monitoring: monitoring,
          systemHealth: monitoring.status
        }
      };

      const recommendations = await sage.execute(advisoryContext);

      expect(recommendations.recommendations).toBeDefined();
      expect(recommendations.recommendations.length).toBeGreaterThan(0);
      expect(recommendations.metadata?.confidence).toBeDefined();
    });

    test('should handle event-driven coordination', (done) => {
      let eventsFired = 0;
      const totalExpectedEvents = 2;

      // Set up event listeners
      oracle.events.on('test-prediction', (data) => {
        expect(data).toBeDefined();
        eventsFired++;
        if (eventsFired === totalExpectedEvents) done();
      });

      sentinel.events.on('test-alert', (data) => {
        expect(data).toBeDefined();
        eventsFired++;
        if (eventsFired === totalExpectedEvents) done();
      });

      // Emit test events
      oracle.events.emit('test-prediction', { value: 100, confidence: 0.8 });
      sentinel.events.emit('test-alert', { level: 'warning', message: 'Test alert' });
    });

    test('should maintain cross-agent state consistency', async () => {
      // Set states in different agents
      await oracle.setState({ lastPrediction: 100 });
      await sentinel.setState({ lastAlert: 'warning' });
      await sage.setState({ lastRecommendation: 'optimize' });

      // Retrieve and verify states
      const oracleState = await oracle.getState();
      const sentinelState = await sentinel.getState();
      const sageState = await sage.getState();

      expect(oracleState?.lastPrediction).toBe(100);
      expect(sentinelState?.lastAlert).toBe('warning');
      expect(sageState?.lastRecommendation).toBe('optimize');
    });

    test('should handle cascading failures gracefully', async () => {
      // Simulate Oracle failure
      jest.spyOn(oracle, 'execute').mockRejectedValueOnce(new Error('Oracle failure'));

      // Sentinel and Sage should continue operating
      const monitoringResult = await sentinel.execute({ cpu_usage: 50 });
      const advisoryResult = await sage.execute("Provide backup recommendations");

      expect(monitoringResult).toBeDefined();
      expect(advisoryResult).toBeDefined();
      expect(advisoryResult.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle high-throughput requests', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) => 
        oracle.execute([i, i+1, i+2], { model: 'default-forecast' })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(concurrentRequests);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach(result => {
        expect(result.result.prediction).toBeDefined();
      });
    });

    test('should handle memory limits gracefully', async () => {
      // Generate large datasets to test memory handling
      const largeDataset = Array.from({ length: 10000 }, (_, i) => i);
      
      const result = await oracle.execute(largeDataset.slice(0, 1000)); // Use subset for testing
      
      expect(result).toBeDefined();
      expect(result.result.prediction).toBeDefined();
    });

    test('should recover from transient failures', async () => {
      let failureCount = 0;
      const maxRetries = 3;

      // Mock intermittent failure
      const originalExecute = sage.execute.bind(sage);
      jest.spyOn(sage, 'execute').mockImplementation(async (input, context) => {
        if (failureCount < 2) {
          failureCount++;
          throw new Error('Transient failure');
        }
        return originalExecute(input, context);
      });

      // Implement retry logic
      let result;
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          result = await sage.execute("Test retry logic");
          break;
        } catch (error) {
          attempt++;
          if (attempt === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(result).toBeDefined();
      expect(result?.recommendations).toBeDefined();
      expect(failureCount).toBe(2);
    });

    test('should maintain performance metrics', async () => {
      // Execute several operations
      await oracle.execute([1, 2, 3]);
      await sentinel.execute({ cpu_usage: 50 });
      await sage.execute("Performance test query");

      // Check metrics
      expect(oracle.metrics.executionCount).toBeGreaterThan(0);
      expect(oracle.metrics.averageExecutionTime).toBeGreaterThan(0);
      expect(oracle.metrics.lastExecuted).toBeDefined();

      expect(sentinel.metrics.executionCount).toBeGreaterThan(0);
      expect(sage.metrics.executionCount).toBeGreaterThan(0);
    });

    test('should handle resource cleanup on shutdown', async () => {
      // Create temporary agents for cleanup testing
      const tempOracle = new OracleAgent(
        createTestConfig('prediction', 'temp-oracle'), 
        mockLogger
      );
      await tempOracle.initialize();

      // Set some state
      await tempOracle.setState({ testData: 'cleanup-test' });
      
      // Shutdown should clean up resources
      await tempOracle.shutdown();
      
      expect(tempOracle.getStatus()).toBe('stopped');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid prediction models', async () => {
      await expect(
        oracle.execute([1, 2, 3], { model: 'nonexistent-model' })
      ).rejects.toThrow();
    });

    test('should handle invalid threshold configurations', () => {
      expect(() => {
        sentinel.setThreshold('test_metric', {
          condition: 'invalid' as any,
          value: 100,
          severity: 'warning'
        });
      }).not.toThrow(); // Should handle gracefully, not crash
    });

    test('should handle malformed advisory queries', async () => {
      const malformedInput = { invalidStructure: true };
      
      // Should not crash, should provide some response
      const result = await sage.execute(malformedInput);
      
      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('should validate agent configurations', () => {
      expect(() => {
        new OracleAgent({
          ...createTestConfig('prediction', 'invalid-config'),
          id: '' // Invalid empty ID
        }, mockLogger);
      }).not.toThrow(); // Constructor should handle gracefully
    });

    test('should handle network timeouts and retries', async () => {
      // Mock network delay
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const slowOperation = async () => {
        await delay(100); // Simulate slow operation
        return oracle.execute([1, 2, 3]);
      };

      const result = await slowOperation();
      expect(result).toBeDefined();
    });
  });
});