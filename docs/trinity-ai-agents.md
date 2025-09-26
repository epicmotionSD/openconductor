# Trinity AI Reference Agents

## Overview

The Trinity AI pattern provides a comprehensive framework for enterprise AI orchestration through three specialized agent types:

- **Oracle** (Prediction): "The wisdom to see what's coming"
- **Sentinel** (Monitoring): "The vigilance to know what's happening"  
- **Sage** (Advisory): "The intelligence to know what to do"

## Architecture

The Trinity AI agents are built on the OpenConductor platform and follow these design principles:

### 1. Universal Interface Compatibility
All Trinity AI agents implement the standard OpenConductor `Agent` interface, ensuring seamless orchestration and interoperability.

### 2. Specialized Capabilities
Each agent type provides domain-specific capabilities while maintaining consistent patterns:

```typescript
interface TrinityAgent extends Agent {
  type: 'prediction' | 'monitoring' | 'advisory';
  execute(input: any, context?: Record<string, any>): Promise<AgentOutput>;
}
```

### 3. Event-Driven Communication
Agents communicate through the OpenConductor event system, enabling real-time coordination and data sharing.

## Oracle Agent (Prediction)

The Oracle agent provides advanced prediction and forecasting capabilities.

### Key Features

- **Time Series Forecasting**: Predict future values based on historical data
- **Machine Learning Inference**: Run predictions using trained ML models
- **Pattern Recognition**: Identify patterns and trends in data
- **Anomaly Detection**: Detect unusual patterns and outliers
- **Multi-Model Support**: Compare predictions across different models

### Supported Models

| Model Type | Description | Use Cases |
|------------|-------------|-----------|
| Time Series | ARIMA, Linear Regression, LSTM | Sales forecasting, resource planning |
| Classification | Business metrics classification | User behavior, risk assessment |
| Regression | Performance prediction | System load, resource usage |
| Anomaly Detection | Statistical outlier detection | Security, quality monitoring |

### Usage Example

```typescript
import { OracleAgent } from '@openconductor/core';

// Initialize Oracle agent
const oracle = new OracleAgent(config, logger);
await oracle.initialize();

// Predict sales for next week
const prediction = await oracle.execute(historicalSalesData, {
  model: 'default-forecast',
  timeHorizon: 7 * 24 * 60, // 7 days in minutes
  includeFactors: true
});

console.log(`Prediction: $${prediction.result.prediction}`);
console.log(`Confidence: ${Math.round(prediction.result.confidence * 100)}%`);
```

### Available Methods

- `execute(input, context)`: Run prediction on input data
- `predict(input, options)`: Direct prediction interface
- `addModel(model)`: Add custom prediction model
- `getAvailableModels()`: List available models
- `getPredictionHistory(limit)`: Get recent predictions

## Sentinel Agent (Monitoring)

The Sentinel agent provides comprehensive monitoring, alerting, and health checking.

### Key Features

- **Real-time Monitoring**: Continuous system and application monitoring
- **Custom Thresholds**: Configurable alerting thresholds and conditions
- **Health Checks**: Automated health assessments for services and systems
- **Alert Management**: Intelligent alert generation, escalation, and resolution
- **Performance Tracking**: Long-term performance metrics collection

### Monitoring Capabilities

| Capability | Description | Metrics |
|------------|-------------|---------|
| System Monitoring | OS-level metrics | CPU, Memory, Disk, Network |
| Application Monitoring | Application performance | Response time, error rate, throughput |
| Service Health | Service availability | Uptime, connectivity, functionality |
| Custom Metrics | User-defined monitoring | Business KPIs, domain-specific metrics |

### Usage Example

```typescript
import { SentinelAgent } from '@openconductor/core';

// Initialize Sentinel agent
const sentinel = new SentinelAgent(config, logger);
await sentinel.initialize();

// Set up custom thresholds
sentinel.setThreshold('response_time', {
  condition: 'gt',
  value: 1000,
  severity: 'warning'
});

// Monitor system metrics
const result = await sentinel.execute({
  cpu_usage: 75,
  memory_usage: 82,
  response_time: 450
});

console.log(`Status: ${result.status}`);
result.alerts.forEach(alert => {
  console.log(`Alert: ${alert.level} - ${alert.message}`);
});
```

### Available Methods

- `execute(input, context)`: Monitor input data and generate alerts
- `monitor(data, thresholds)`: Direct monitoring interface
- `setThreshold(metric, threshold)`: Configure alerting thresholds
- `addTarget(target)`: Add monitoring target
- `getActiveAlerts()`: Get current active alerts
- `acknowledgeAlert(alertId, user)`: Acknowledge an alert

## Sage Agent (Advisory)

The Sage agent provides intelligent advisory and decision support capabilities.

### Key Features

- **Strategic Recommendations**: Business and technical strategy advice
- **Multi-Criteria Decision Analysis**: Systematic decision-making support
- **Risk Assessment**: Comprehensive risk analysis and mitigation strategies
- **Natural Language Processing**: Process advisory requests in natural language
- **Knowledge-Based Systems**: Leverage domain expertise for recommendations

### Advisory Domains

| Domain | Capabilities | Example Use Cases |
|--------|-------------|------------------|
| Business Strategy | Market analysis, growth planning | Expansion decisions, product strategy |
| Technology | Architecture, performance optimization | System scaling, tech stack decisions |
| Operations | Process improvement, resource optimization | Workflow enhancement, cost reduction |
| Risk Management | Risk assessment, mitigation planning | Compliance, security, operational risk |

### Usage Example

```typescript
import { SageAgent } from '@openconductor/core';

// Initialize Sage agent
const sage = new SageAgent(config, logger);
await sage.initialize();

// Natural language advisory query
const recommendations = await sage.execute(
  "How can I improve my e-commerce conversion rates?"
);

console.log('Recommendations:');
recommendations.recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec.action} (${rec.impact} impact)`);
});

// Structured advisory context
const businessContext = {
  domain: 'technology',
  objective: 'Scale our platform to handle 10x users',
  riskTolerance: 'medium',
  budget: 500000,
  currentState: { users: 50000, revenue: 2000000 }
};

const strategicAdvice = await sage.execute(businessContext);
```

### Available Methods

- `execute(input, context)`: Process advisory request
- `advise(context, options)`: Direct advisory interface  
- `addKnowledge(domain, knowledge)`: Add domain knowledge
- `addExpertRule(domain, rule)`: Add expert system rules
- `getRecommendationHistory(limit)`: Get recent recommendations

## Trinity AI Orchestration

The power of Trinity AI lies in the orchestration of all three agent types working together:

### Coordinated Intelligence Pattern

```typescript
// 1. Oracle predicts future state
const prediction = await oracle.execute(currentData, {
  timeHorizon: 60,
  includeFactors: true
});

// 2. Sentinel monitors current health
const monitoring = await sentinel.execute(systemMetrics);

// 3. Sage provides strategic recommendations
const recommendations = await sage.execute({
  domain: 'business',
  objective: 'Optimize operations based on predictions and monitoring',
  currentState: {
    predictions: prediction.result,
    monitoring: monitoring,
    systemHealth: monitoring.status
  }
});

// 4. Take action based on Trinity AI insights
if (monitoring.status === 'critical') {
  // Immediate action required
} else if (prediction.result.confidence > 0.8) {
  // Plan based on high-confidence prediction
} else {
  // Follow Sage recommendations
}
```

### Event-Driven Coordination

```typescript
// Set up event handlers for coordinated responses
oracle.events.on('prediction', (prediction) => {
  if (prediction.confidence > 0.9) {
    sentinel.setThreshold('resource_usage', {
      condition: 'gt',
      value: prediction.value * 0.8,
      severity: 'warning'
    });
  }
});

sentinel.events.on('alert', async (alert) => {
  if (alert.level === 'critical') {
    const advice = await sage.execute({
      domain: 'operations',
      objective: `Address critical alert: ${alert.message}`,
      riskTolerance: 'low',
      urgency: 'immediate'
    });
    
    console.log('Emergency recommendations:', advice.recommendations);
  }
});
```

## Configuration

### Agent Configuration

```typescript
const trinityConfig = {
  oracle: {
    id: 'oracle-production',
    name: 'Production Oracle Agent',
    version: '1.0.0',
    type: 'prediction',
    capabilities: [
      { type: 'prediction', name: 'Time Series Forecasting' },
      { type: 'ml-inference', name: 'ML Model Inference' }
    ],
    tools: [],
    memory: { type: 'persistent', store: 'redis' }
  },
  sentinel: {
    id: 'sentinel-production',
    name: 'Production Sentinel Agent',
    type: 'monitoring',
    // ... similar configuration
  },
  sage: {
    id: 'sage-production', 
    name: 'Production Sage Agent',
    type: 'advisory',
    // ... similar configuration
  }
};
```

### Memory Configuration

```typescript
// Ephemeral memory (development)
memory: { type: 'ephemeral', store: 'memory' }

// Persistent memory (production)
memory: { 
  type: 'persistent', 
  store: 'redis',
  ttl: 86400, // 24 hours
  encryption: true 
}

// Hybrid memory (mixed workloads)
memory: {
  type: 'hybrid',
  store: 'postgresql',
  maxSize: 1048576, // 1MB
  ttl: 3600
}
```

## Best Practices

### 1. Agent Specialization
- Use Oracle for all prediction and forecasting needs
- Use Sentinel for monitoring and alerting
- Use Sage for decision support and strategic planning

### 2. Data Flow Design
- Feed Oracle predictions into Sentinel thresholds
- Use Sentinel alerts to trigger Sage recommendations
- Create feedback loops for continuous improvement

### 3. Performance Optimization
- Cache frequently used predictions
- Batch monitoring data collection
- Index historical data for fast retrieval

### 4. Error Handling
```typescript
try {
  const result = await agent.execute(input, context);
  return result;
} catch (error) {
  logger.error(`Agent execution failed: ${error.message}`);
  
  // Implement fallback logic
  if (error.code === 'MODEL_NOT_FOUND') {
    return await agent.execute(input, { model: 'default' });
  }
  
  throw error;
}
```

### 5. Monitoring Agent Health
```typescript
// Implement health checks for agents
setInterval(async () => {
  const agents = [oracle, sentinel, sage];
  
  for (const agent of agents) {
    const health = await agent.healthCheck();
    if (!health) {
      logger.warn(`Agent ${agent.id} health check failed`);
      // Implement recovery logic
    }
  }
}, 30000); // Every 30 seconds
```

## Examples

See the `examples/` directory for complete working examples:

- `trinity-ai-demo.ts` - Complete Trinity AI orchestration demo
- `oracle-examples.ts` - Oracle agent prediction examples
- `sentinel-examples.ts` - Sentinel agent monitoring examples  
- `sage-examples.ts` - Sage agent advisory examples

Run examples with:
```bash
npm run examples trinity    # Full Trinity AI demo
npm run examples oracle     # Oracle examples only
npm run examples sentinel   # Sentinel examples only
npm run examples sage       # Sage examples only
```

## Contributing

When extending Trinity AI agents:

1. Follow the established patterns and interfaces
2. Add comprehensive tests for new functionality
3. Update documentation for any API changes
4. Ensure backward compatibility
5. Follow the OpenConductor coding standards

## License

Trinity AI Reference Agents are part of the OpenConductor platform and follow the same MIT license.