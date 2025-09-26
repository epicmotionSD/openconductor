# Trinity AI Quick Start Guide

Get up and running with Trinity AI reference agents in minutes.

## Prerequisites

- Node.js 18.0.0 or higher
- TypeScript 5.0 or higher
- Basic understanding of AI agents and orchestration

## Installation

```bash
# Install OpenConductor core
npm install @openconductor/core

# Clone the repository for examples
git clone https://github.com/openconductor/core.git
cd core
npm install
```

## Quick Demo

Run the complete Trinity AI demo to see all agents working together:

```bash
npm run examples trinity
```

This demo simulates an e-commerce platform using:
- **Oracle**: Predicts sales trends and user behavior
- **Sentinel**: Monitors system performance and generates alerts  
- **Sage**: Provides strategic business recommendations

## Your First Trinity AI Agent

### 1. Choose Your Agent Type

Pick the agent type that matches your use case:

| Agent Type | When to Use | Examples |
|------------|-------------|----------|
| **Oracle** (Prediction) | Forecasting, ML inference, pattern detection | Sales forecasting, load prediction, anomaly detection |
| **Sentinel** (Monitoring) | System monitoring, alerting, health checks | Performance monitoring, SLA tracking, error detection |
| **Sage** (Advisory) | Recommendations, decision support, strategy | Business advice, optimization suggestions, risk assessment |

### 2. Basic Agent Setup

```typescript
import { OracleAgent, SentinelAgent, SageAgent } from '@openconductor/core';
import { Logger } from '@openconductor/core';

// Initialize logger
const logger = new Logger({
  level: 'info',
  format: 'json',
  transports: ['console']
});

// Create agent configuration
const config = {
  id: 'my-first-agent',
  name: 'My First Trinity Agent',
  version: '1.0.0',
  type: 'prediction', // or 'monitoring', 'advisory'
  capabilities: [],
  tools: [],
  memory: { type: 'ephemeral', store: 'memory' },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Initialize your chosen agent
const agent = new OracleAgent(config, logger); // or SentinelAgent, SageAgent
await agent.initialize();
```

### 3. Using Your Agent

```typescript
// Oracle Example: Sales Prediction
const salesData = [45000, 48000, 52000, 49000, 55000]; // Last 5 days
const prediction = await oracle.execute(salesData, {
  timeHorizon: 24 * 60, // 24 hours
  model: 'default-forecast'
});

console.log(`Predicted sales: $${prediction.result.prediction}`);
console.log(`Confidence: ${Math.round(prediction.result.confidence * 100)}%`);

// Sentinel Example: System Monitoring
const systemMetrics = {
  cpu_usage: 75,
  memory_usage: 82,
  response_time: 450,
  error_rate: 2.1
};

const monitoring = await sentinel.execute(systemMetrics);
console.log(`System status: ${monitoring.status}`);
monitoring.alerts.forEach(alert => {
  console.log(`Alert: ${alert.level} - ${alert.message}`);
});

// Sage Example: Business Advisory
const advice = await sage.execute(
  "How can I reduce customer churn in my SaaS business?"
);

advice.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.action} (${rec.impact} impact)`);
});
```

## Common Patterns

### Pattern 1: Predictive Monitoring

Combine Oracle predictions with Sentinel monitoring for proactive alerting:

```typescript
// Predict server load
const loadPrediction = await oracle.execute(historicalLoad, {
  timeHorizon: 30, // 30 minutes
  model: 'performance-regressor'
});

// Set dynamic thresholds based on prediction
if (loadPrediction.result.confidence > 0.8) {
  sentinel.setThreshold('cpu_usage', {
    condition: 'gt',
    value: loadPrediction.result.prediction * 0.9,
    severity: 'warning'
  });
}
```

### Pattern 2: Intelligent Recommendations

Use monitoring data to inform strategic recommendations:

```typescript
// Get current system state from Sentinel
const systemHealth = await sentinel.execute(currentMetrics);

// Get strategic advice based on system state
const recommendations = await sage.execute({
  domain: 'technology',
  objective: 'Optimize system performance',
  currentState: {
    systemHealth: systemHealth.status,
    alerts: systemHealth.alerts,
    metrics: systemHealth.metrics
  }
});
```

### Pattern 3: Event-Driven Coordination

Set up agents to respond to each other's events:

```typescript
// Oracle informs Sentinel of predictions
oracle.events.on('prediction', (prediction) => {
  if (prediction.confidence > 0.9 && prediction.trend === 'increasing') {
    sentinel.setThreshold('resource_usage', {
      condition: 'gt', 
      value: prediction.value * 0.8,
      severity: 'warning'
    });
  }
});

// Sentinel alerts trigger Sage recommendations
sentinel.events.on('alert', async (alert) => {
  if (alert.level === 'critical') {
    const advice = await sage.execute({
      domain: 'operations',
      objective: `Address critical issue: ${alert.message}`,
      riskTolerance: 'low',
      timeline: 'immediate'
    });
    
    console.log('Emergency recommendations:', advice.recommendations);
  }
});
```

## Configuration Options

### Memory Configurations

```typescript
// Development: In-memory (ephemeral)
memory: { type: 'ephemeral', store: 'memory' }

// Production: Redis with encryption
memory: { 
  type: 'persistent',
  store: 'redis',
  ttl: 86400, // 24 hours
  encryption: true
}

// Hybrid: PostgreSQL with size limits
memory: {
  type: 'hybrid',
  store: 'postgresql', 
  maxSize: 1048576, // 1MB
  ttl: 3600 // 1 hour
}
```

### Agent Capabilities

```typescript
capabilities: [
  {
    type: 'prediction',
    name: 'Time Series Forecasting',
    description: 'Predicts future values from historical data',
    version: '1.0.0',
    parameters: {
      maxTimeHorizon: 1440, // 24 hours in minutes
      supportedModels: ['arima', 'linear-regression']
    }
  }
]
```

## Testing Your Agents

### Unit Testing

```typescript
import { describe, test, expect } from 'jest';

describe('Oracle Agent', () => {
  test('should make predictions with reasonable confidence', async () => {
    const oracle = new OracleAgent(testConfig, logger);
    await oracle.initialize();
    
    const prediction = await oracle.execute([10, 12, 14, 16, 18]);
    
    expect(prediction.result.prediction).toBeGreaterThan(0);
    expect(prediction.result.confidence).toBeGreaterThan(0.5);
  });
});
```

### Integration Testing

```typescript
test('Trinity AI coordination', async () => {
  const oracle = new OracleAgent(oracleConfig, logger);
  const sentinel = new SentinelAgent(sentinelConfig, logger);
  const sage = new SageAgent(sageConfig, logger);
  
  await Promise.all([
    oracle.initialize(),
    sentinel.initialize(), 
    sage.initialize()
  ]);
  
  // Test prediction -> monitoring -> advice flow
  const prediction = await oracle.execute(testData);
  const monitoring = await sentinel.execute(testMetrics);
  const advice = await sage.execute({
    domain: 'test',
    objective: 'Test coordination',
    currentState: { prediction, monitoring }
  });
  
  expect(advice.recommendations.length).toBeGreaterThan(0);
});
```

## Deployment

### Local Development

```typescript
// Development configuration
const devConfig = {
  agents: {
    oracle: { memory: { type: 'ephemeral' } },
    sentinel: { memory: { type: 'ephemeral' } },
    sage: { memory: { type: 'ephemeral' } }
  },
  logging: { level: 'debug' }
};
```

### Production

```typescript
// Production configuration
const prodConfig = {
  agents: {
    oracle: { 
      memory: { 
        type: 'persistent',
        store: 'redis',
        encryption: true
      }
    },
    sentinel: {
      memory: { type: 'persistent', store: 'redis' }
    },
    sage: {
      memory: { type: 'persistent', store: 'postgresql' }
    }
  },
  logging: { level: 'info' },
  monitoring: { enabled: true },
  security: { 
    encryption: true,
    auditLevel: 'comprehensive'
  }
};
```

## Next Steps

1. **Run Examples**: Try all the examples to understand each agent type
   ```bash
   npm run examples all
   ```

2. **Read Documentation**: Review the detailed documentation
   - [Trinity AI Agents Guide](./trinity-ai-agents.md)
   - [OpenConductor Core Documentation](../README.md)

3. **Create Custom Agents**: Use the provided template
   - [Trinity Agent Template](../templates/trinity-agent-template.ts)

4. **Join the Community**: 
   - GitHub: [github.com/openconductor/core](https://github.com/openconductor/core)
   - Discord: [OpenConductor Community](https://discord.gg/openconductor)

## Common Issues

### Q: Agent execution is slow
**A:** Check memory configuration and consider using persistent storage for production workloads.

### Q: Predictions have low confidence
**A:** Ensure sufficient historical data and consider using domain-specific models.

### Q: Too many false alerts
**A:** Adjust threshold sensitivity and implement alert suppression rules.

### Q: Recommendations seem generic
**A:** Add domain-specific knowledge to the Sage agent and provide more context in queries.

## Support

- **Documentation**: [docs.openconductor.ai](https://docs.openconductor.ai)
- **GitHub Issues**: [github.com/openconductor/core/issues](https://github.com/openconductor/core/issues)
- **Community**: [discord.gg/openconductor](https://discord.gg/openconductor)
- **Email**: hello@openconductor.ai

Happy orchestrating! 🚀