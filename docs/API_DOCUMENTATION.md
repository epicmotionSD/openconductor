# OpenConductor API Documentation

**The Universal Conductor for Your AI Agents**

## Overview

OpenConductor provides comprehensive REST/WebSocket APIs for remote agent communication, real-time orchestration, and distributed AI agent coordination. This production-ready API server enables seamless integration with any application or service.

## Table of Contents

- [Authentication](#authentication)
- [Base URL & Versioning](#base-url--versioning)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [WebSocket Connection](#websocket-connection)
- [API Endpoints](#api-endpoints)
  - [Agents](#agents)
  - [Workflows](#workflows)
  - [Tools](#tools)
  - [Plugins](#plugins)
  - [Events](#events)
  - [Registry](#registry)
  - [System](#system)
- [WebSocket Events](#websocket-events)
- [Examples](#examples)

## Authentication

OpenConductor supports multiple authentication strategies:

### API Key Authentication (Default)
```http
GET /api/v1/agents
X-API-Key: your-api-key-here
```

### JWT Bearer Token
```http
GET /api/v1/agents
Authorization: Bearer your-jwt-token-here
```

### Basic Authentication
```http
GET /api/v1/agents
Authorization: Basic base64(username:password)
```

## Base URL & Versioning

- **Base URL**: `http://localhost:3000/api/v1`
- **API Version**: Current version is `v1`
- **Versioning**: Specify version via `X-API-Version` header or default to `v1`

## Rate Limiting

- **Default Limit**: 100 requests per 15-minute window
- **Headers**: Rate limit information included in response headers
- **Exceeded**: Returns `429 Too Many Requests` with retry information

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { /* Response data */ },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "v1",
    "requestId": "req_1234567890_abc123",
    "executionTime": 150
  },
  "pagination": { /* For paginated responses */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* Additional error details */ },
    "field": "fieldName" /* For validation errors */
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_1234567890_abc123",
    "version": "v1"
  }
}
```

## Error Handling

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Unprocessable Entity (execution error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## WebSocket Connection

Connect to WebSocket for real-time events:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// Authentication (if required)
ws.send(JSON.stringify({
  type: 'authenticate',
  data: { token: 'your-jwt-token' }
}));

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  data: {
    type: 'events',
    filter: { types: ['agent.*', 'workflow.*'] }
  }
}));
```

## API Endpoints

### Agents

Manage AI agents - create, execute, monitor, and coordinate distributed agents.

#### List Agents
```http
GET /api/v1/agents?page=1&limit=20&search=data&filter={"type":"oracle"}
```

#### Get Agent
```http
GET /api/v1/agents/{agentId}
```

#### Create Agent
```http
POST /api/v1/agents
Content-Type: application/json

{
  "name": "Data Analysis Agent",
  "type": "oracle",
  "version": "1.0.0",
  "description": "Analyzes data patterns and generates insights",
  "config": {
    "capabilities": ["data-analysis", "pattern-recognition"],
    "tools": ["pandas-tool", "sklearn-tool"],
    "memory": {
      "type": "persistent",
      "store": "redis",
      "ttl": 3600
    },
    "resources": {
      "cpu": "500m",
      "memory": "512Mi",
      "storage": "1Gi"
    }
  }
}
```

#### Update Agent
```http
PUT /api/v1/agents/{agentId}
Content-Type: application/json

{
  "description": "Updated description",
  "config": {
    "capabilities": ["data-analysis", "pattern-recognition", "reporting"]
  }
}
```

#### Execute Agent
```http
POST /api/v1/agents/{agentId}/execute
Content-Type: application/json

{
  "input": {
    "dataset": "sales_data.csv",
    "analysis_type": "trend_analysis"
  },
  "options": {
    "timeout": 60000,
    "priority": "high"
  }
}
```

#### Agent Health Check
```http
GET /api/v1/agents/{agentId}/health
```

#### Agent Metrics
```http
GET /api/v1/agents/{agentId}/metrics
```

#### Delete Agent
```http
DELETE /api/v1/agents/{agentId}
```

### Workflows

Orchestrate complex multi-step processes with agents and tools.

#### List Workflows
```http
GET /api/v1/workflows?page=1&limit=20&sort=createdAt&order=desc
```

#### Get Workflow
```http
GET /api/v1/workflows/{workflowId}
```

#### Create Workflow
```http
POST /api/v1/workflows
Content-Type: application/json

{
  "name": "Data Processing Pipeline",
  "description": "End-to-end data processing workflow",
  "version": "1.0.0",
  "strategy": "sequential",
  "steps": [
    {
      "id": "data-collection",
      "name": "Collect Data",
      "type": "agent",
      "config": {
        "agentId": "data-collector-agent",
        "input": { "source": "database" }
      },
      "dependencies": [],
      "timeout": 30000
    },
    {
      "id": "data-processing",
      "name": "Process Data",
      "type": "agent",
      "config": {
        "agentId": "data-processor-agent"
      },
      "dependencies": ["data-collection"],
      "timeout": 60000
    }
  ],
  "triggers": [
    {
      "type": "schedule",
      "config": {
        "cron": "0 9 * * *",
        "timezone": "UTC"
      }
    }
  ]
}
```

#### Execute Workflow
```http
POST /api/v1/workflows/{workflowId}/execute
Content-Type: application/json

{
  "input": {
    "parameters": {
      "environment": "production",
      "notification_email": "admin@company.com"
    }
  },
  "options": {
    "timeout": 300000,
    "priority": "normal"
  }
}
```

#### List Workflow Executions
```http
GET /api/v1/workflows/executions?workflowId={workflowId}&status=running
```

#### Get Workflow Execution
```http
GET /api/v1/workflows/executions/{executionId}
```

#### Control Workflow Execution
```http
POST /api/v1/workflows/executions/{executionId}/pause
POST /api/v1/workflows/executions/{executionId}/resume
POST /api/v1/workflows/executions/{executionId}/cancel
```

### Tools

Register and execute tools for agents to use.

#### List Tools
```http
GET /api/v1/tools?type=api&search=slack
```

#### Get Tool
```http
GET /api/v1/tools/{toolId}
```

#### Register Tool
```http
POST /api/v1/tools
Content-Type: application/json

{
  "name": "Slack Integration Tool",
  "type": "api",
  "version": "1.0.0",
  "description": "Send messages and manage Slack channels",
  "config": {
    "operations": [
      {
        "name": "send_message",
        "description": "Send a message to a Slack channel",
        "parameters": {
          "channel": { "type": "string", "required": true },
          "message": { "type": "string", "required": true },
          "username": { "type": "string", "required": false }
        },
        "returns": {
          "success": { "type": "boolean" },
          "message_id": { "type": "string" }
        }
      }
    ],
    "authentication": {
      "type": "bearer",
      "config": {
        "token_env": "SLACK_BOT_TOKEN"
      }
    }
  }
}
```

#### Execute Tool
```http
POST /api/v1/tools/{toolId}/execute
Content-Type: application/json

{
  "operation": "send_message",
  "parameters": {
    "channel": "#general",
    "message": "Hello from OpenConductor!",
    "username": "OpenConductor Bot"
  },
  "options": {
    "timeout": 10000
  }
}
```

#### Tool Health Check
```http
GET /api/v1/tools/{toolId}/health
```

#### Test Tool Connection
```http
POST /api/v1/tools/{toolId}/test
```

### Plugins

Extend OpenConductor functionality with plugins.

#### List Plugins
```http
GET /api/v1/plugins?active=true
```

#### Get Plugin
```http
GET /api/v1/plugins/{pluginId}
```

#### Install Plugin
```http
POST /api/v1/plugins
Content-Type: application/json

{
  "source": {
    "type": "registry",
    "location": "openconductor-slack-plugin",
    "version": "latest"
  }
}
```

#### Activate/Deactivate Plugin
```http
POST /api/v1/plugins/{pluginId}/activate
POST /api/v1/plugins/{pluginId}/deactivate
```

### Events

Monitor system events and set up subscriptions.

#### Get Events
```http
GET /api/v1/events?types=agent.started,workflow.completed&since=2024-01-01T00:00:00Z
```

#### Publish Event
```http
POST /api/v1/events
Content-Type: application/json

{
  "type": "custom.notification",
  "source": "my-application",
  "data": {
    "message": "Important system update",
    "severity": "info"
  },
  "priority": "normal",
  "target": "slack-channel"
}
```

#### Create Event Subscription
```http
POST /api/v1/events/subscriptions
Content-Type: application/json

{
  "filter": {
    "types": ["agent.*", "workflow.failed"],
    "priority": ["high", "critical"]
  },
  "endpoint": "https://my-app.com/webhooks/openconductor",
  "active": true
}
```

### Registry

Discover and share agents through the registry.

#### Search Agents
```http
GET /api/v1/registry/agents?q=data analysis&category=data-analysis&minRating=4.0
```

#### Get Agent from Registry
```http
GET /api/v1/registry/agents/{registryId}
```

#### Publish Agent to Registry
```http
POST /api/v1/registry/agents
Content-Type: application/json

{
  "name": "Advanced Data Analyzer",
  "description": "AI-powered data analysis with ML capabilities",
  "type": "oracle",
  "version": "2.0.0",
  "author": "Your Company",
  "category": "data-analysis",
  "tags": ["data", "ml", "analytics"],
  "capabilities": ["data-analysis", "machine-learning"],
  "documentation": "https://docs.yourcompany.com/analyzer",
  "repository": "https://github.com/yourcompany/analyzer",
  "license": "MIT"
}
```

#### Download Agent
```http
POST /api/v1/registry/agents/{registryId}/download
```

### System

Monitor system health and manage maintenance.

#### System Health
```http
GET /api/v1/system/health
```

#### System Metrics
```http
GET /api/v1/system/metrics
```

#### System Information
```http
GET /api/v1/system/info
```

#### System Status
```http
GET /api/v1/system/status
```

#### Performance Metrics
```http
GET /api/v1/system/performance
```

#### Enable Maintenance Mode
```http
POST /api/v1/system/maintenance
Content-Type: application/json

{
  "message": "Scheduled maintenance in progress"
}
```

## WebSocket Events

Subscribe to real-time events via WebSocket:

### Connection Events
- `connection.established` - WebSocket connected
- `connection.closed` - WebSocket disconnected
- `subscription.created` - New subscription created
- `subscription.removed` - Subscription removed

### Agent Events
- `agent.registered` - Agent registered
- `agent.unregistered` - Agent removed
- `agent.started` - Agent execution started
- `agent.completed` - Agent execution completed
- `agent.failed` - Agent execution failed
- `agent.status.changed` - Agent status changed

### Workflow Events
- `workflow.created` - Workflow created
- `workflow.started` - Workflow execution started
- `workflow.step.completed` - Workflow step completed
- `workflow.completed` - Workflow execution completed
- `workflow.failed` - Workflow execution failed
- `workflow.paused` - Workflow paused
- `workflow.resumed` - Workflow resumed
- `workflow.cancelled` - Workflow cancelled

### System Events
- `system.initialized` - System initialized
- `system.started` - System started
- `system.stopping` - System stopping
- `system.health.changed` - System health status changed
- `system.maintenance.enabled` - Maintenance mode enabled
- `system.maintenance.disabled` - Maintenance mode disabled

## Examples

### Complete Agent Lifecycle

```javascript
// 1. Create an agent
const agent = await fetch('/api/v1/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'Email Processor',
    type: 'sage',
    version: '1.0.0',
    config: {
      capabilities: ['email-processing', 'text-analysis'],
      memory: { type: 'persistent', store: 'redis' }
    }
  })
});

const { data: newAgent } = await agent.json();

// 2. Execute the agent
const execution = await fetch(`/api/v1/agents/${newAgent.id}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    input: {
      emails: ['email1@example.com', 'email2@example.com'],
      action: 'categorize'
    }
  })
});

const { data: result } = await execution.json();
console.log('Agent execution result:', result);

// 3. Monitor agent health
const health = await fetch(`/api/v1/agents/${newAgent.id}/health`, {
  headers: { 'X-API-Key': 'your-api-key' }
});

const { data: healthStatus } = await health.json();
console.log('Agent health:', healthStatus);
```

### WebSocket Real-time Monitoring

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Subscribe to all agent events
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: {
      type: 'agent-status',
      filter: { agentId: 'specific-agent-id' }
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'event') {
    console.log('Real-time event:', message.data);
    
    // Handle different event types
    switch (message.data.type) {
      case 'agent.started':
        console.log(`Agent ${message.data.agentId} started execution`);
        break;
      case 'agent.completed':
        console.log(`Agent ${message.data.agentId} completed successfully`);
        break;
      case 'agent.failed':
        console.log(`Agent ${message.data.agentId} failed:`, message.data.error);
        break;
    }
  }
};
```

### Workflow Orchestration

```javascript
// Create a multi-step workflow
const workflow = await fetch('/api/v1/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    name: 'Customer Onboarding',
    version: '1.0.0',
    strategy: 'sequential',
    steps: [
      {
        id: 'validate-data',
        name: 'Validate Customer Data',
        type: 'agent',
        config: { agentId: 'data-validator' }
      },
      {
        id: 'create-account',
        name: 'Create Account',
        type: 'agent',
        config: { agentId: 'account-creator' },
        dependencies: ['validate-data']
      },
      {
        id: 'send-welcome',
        name: 'Send Welcome Email',
        type: 'tool',
        config: { toolId: 'email-sender' },
        dependencies: ['create-account']
      }
    ]
  })
});

// Execute the workflow
const execution = await fetch(`/api/v1/workflows/${workflow.data.id}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    input: {
      customerData: {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      }
    }
  })
});

console.log('Workflow execution started:', execution.data);
```

## Best Practices

1. **Authentication**: Always use API keys or JWT tokens for production
2. **Error Handling**: Implement proper retry logic with exponential backoff
3. **Rate Limiting**: Respect rate limits and implement request queuing
4. **WebSocket Reconnection**: Implement automatic reconnection for WebSocket connections
5. **Monitoring**: Use system health and metrics endpoints for monitoring
6. **Logging**: Log all API interactions for debugging and audit purposes
7. **Validation**: Always validate inputs before sending to the API
8. **Timeout Handling**: Set appropriate timeouts for long-running operations

## Support

- **Documentation**: [https://docs.openconductor.ai](https://docs.openconductor.ai)
- **GitHub**: [https://github.com/openconductor/core](https://github.com/openconductor/core)
- **Discord**: [https://discord.gg/openconductor](https://discord.gg/openconductor)
- **Email**: [support@openconductor.ai](mailto:support@openconductor.ai)

---

*OpenConductor - The Universal Conductor for Your AI Agents*