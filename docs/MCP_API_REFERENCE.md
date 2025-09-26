# OpenConductor MCP API Reference

**"The npm for MCP Servers" - Complete API Documentation**

> Transform your OpenConductor instance into the definitive platform for MCP server discovery, workflow orchestration, and community collaboration.

---

## 🎯 **Overview**

The OpenConductor MCP integration extends the platform with:
- **🔍 Server Discovery**: AI-powered semantic search across MCP servers
- **⚡ Workflow Orchestration**: Visual workflow builder with MCP integration
- **👥 Community Features**: Stars, reviews, sharing, and collaboration
- **💰 Subscription Management**: Freemium model with usage-based billing
- **📊 Analytics**: Comprehensive usage tracking and insights
- **🔒 Enterprise Security**: RBAC, audit logging, and compliance controls

---

## 🚀 **Quick Start**

### 1. Database Setup
```sql
-- Run the MCP schema
\i src/mcp/database-schema.sql

-- Verify pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. Environment Configuration
```bash
# Add to your .env file
OPENAI_API_KEY=your_openai_key_here
STRIPE_SECRET_KEY=your_stripe_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret_here

# Database with pgvector support
DATABASE_URL=postgresql://user:pass@localhost:5432/openconductor
```

### 3. Initialize MCP Integration
```typescript
import { createMCPIntegration } from './src/mcp/mcp-integration';

const mcpIntegration = createMCPIntegration(
  {
    database: { /* your db config */ },
    openai: { apiKey: process.env.OPENAI_API_KEY },
    features: {
      semanticSearch: true,
      communityFeatures: true,
      analytics: true,
      billing: true
    }
  },
  logger,
  errorManager,
  eventBus
);

await mcpIntegration.initialize();
await mcpIntegration.start();
```

---

## 📖 **API Endpoints**

### Base URL
```
/api/v1/mcp
```

All MCP endpoints follow the existing OpenConductor API patterns with consistent response formats.

---

## 🔍 **Server Discovery & Management**

### List/Search MCP Servers
```http
GET /mcp/servers?search=database&semantic_search=postgres&use_semantic=true&categories=database&is_featured=true&page=1&limit=20
```

**Query Parameters:**
- `search` - Text search query
- `semantic_search` - Semantic search query (requires OpenAI API key)
- `use_semantic` - Enable semantic search (boolean)
- `categories` - Filter by categories (comma-separated)
- `tags` - Filter by tags (comma-separated)
- `performance_tier` - Filter by performance tier
- `is_featured` - Show only featured servers (boolean)
- `is_verified` - Show only verified servers (boolean)
- `min_rating` - Minimum rating filter
- `sort` - Sort by: `popularity`, `rating`, `downloads`, `updated`, `created`
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server_uuid",
        "name": "filesystem-server",
        "display_name": "File System Server",
        "description": "Provides access to local file system operations",
        "author_name": "ModelContext Protocol",
        "categories": ["filesystem", "utilities"],
        "tags": ["files", "directory", "io"],
        "star_count": 156,
        "download_count": 2340,
        "rating_average": 4.8,
        "is_featured": true,
        "is_verified": true,
        "performance_tier": "standard",
        "tool_count": 8,
        "created_at": "2024-01-15T00:00:00Z"
      }
    ],
    "facets": {
      "categories": { "filesystem": 45, "database": 32 },
      "tags": { "files": 67, "sql": 43 },
      "performance_tiers": { "standard": 89, "premium": 23 }
    },
    "semantic_matches": [
      {
        "server_id": "server_uuid",
        "similarity_score": 0.89,
        "matched_field": "description"
      }
    ],
    "recommendations": [
      {
        "server_id": "rec_server_uuid",
        "reason": "Popular in the community",
        "confidence": 0.8
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Get Specific Server
```http
GET /mcp/servers/{serverId}?include_tools=true&include_similar=true
```

### Create MCP Server
```http
POST /mcp/servers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "my-custom-server",
  "display_name": "My Custom Server",
  "description": "Custom MCP server for specific business needs",
  "transport_type": "stdio",
  "categories": ["custom", "business"],
  "tags": ["custom", "enterprise", "business"],
  "use_cases": ["business automation", "custom workflows"],
  "npm_package": "@mycompany/mcp-server",
  "installation_command": "npm install -g @mycompany/mcp-server",
  "configuration_schema": {
    "type": "object",
    "properties": {
      "api_key": { "type": "string", "required": true },
      "endpoint": { "type": "string", "default": "https://api.mycompany.com" }
    }
  }
}
```

### Install MCP Server
```http
POST /mcp/servers/{serverId}/install
Authorization: Bearer {token}
Content-Type: application/json

{
  "installation_method": "npm",
  "configuration": {
    "api_key": "your-api-key",
    "endpoint": "https://custom-endpoint.com"
  }
}
```

### Star/Unstar Server
```http
POST /mcp/servers/{serverId}/star
Authorization: Bearer {token}
Content-Type: application/json

{
  "starred": true
}
```

### Rate Server
```http
POST /mcp/servers/{serverId}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "review_title": "Excellent server!",
  "review_text": "This server has everything I need for file operations. Highly recommended!"
}
```

---

## ⚡ **Workflow Management**

### List Workflows
```http
GET /mcp/workflows?page=1&limit=20&is_public=true&is_template=true&tags=data-processing
```

### Create Workflow
```http
POST /mcp/workflows
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Data Processing Pipeline",
  "description": "Extract, transform, and load data using multiple MCP servers",
  "definition": {
    "nodes": [
      {
        "id": "read-file",
        "type": "mcp_server",
        "server": "filesystem-server",
        "tool": "read_file",
        "position": { "x": 100, "y": 100 },
        "config": {
          "input_mapping": { "path": "$.input.file_path" }
        }
      },
      {
        "id": "transform-data",
        "type": "transform",
        "script": "data => data.map(row => ({ ...row, processed: true }))",
        "position": { "x": 300, "y": 100 }
      },
      {
        "id": "save-results",
        "type": "mcp_server",
        "server": "filesystem-server", 
        "tool": "write_file",
        "position": { "x": 500, "y": 100 },
        "config": {
          "input_mapping": { 
            "path": "$.input.output_path",
            "content": "$.transform-data.output"
          }
        }
      }
    ],
    "edges": [
      { "from": "read-file", "to": "transform-data" },
      { "from": "transform-data", "to": "save-results" }
    ]
  },
  "is_public": false,
  "is_template": false,
  "tags": ["data-processing", "etl", "files"],
  "timeout_seconds": 300,
  "retry_policy": {
    "max_retries": 3,
    "backoff": "exponential"
  }
}
```

### Execute Workflow
```http
POST /mcp/workflows/{workflowId}/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "input_data": {
    "file_path": "/path/to/input.csv",
    "output_path": "/path/to/output.json"
  },
  "trigger_type": "manual"
}
```

### List Workflow Executions
```http
GET /mcp/workflows/executions?workflow_id={workflowId}&status=running&page=1&limit=20
```

### Get Execution Details
```http
GET /mcp/workflows/executions/{executionId}
```

---

## 💳 **Subscription & Billing**

### Get Subscription Plans
```http
GET /mcp/billing/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "tier": "free",
      "name": "Community",
      "price_monthly": 0,
      "price_yearly": 0,
      "limits": {
        "workflow_executions": 50,
        "concurrent_workflows": 2,
        "servers_per_workflow": 3,
        "api_calls_per_month": 1000
      },
      "features": [
        "Public workflow templates",
        "Community server registry",
        "Basic analytics"
      ]
    },
    {
      "id": "professional",
      "tier": "professional", 
      "name": "Professional",
      "price_monthly": 29,
      "price_yearly": 290,
      "limits": {
        "workflow_executions": 1000,
        "concurrent_workflows": 10,
        "servers_per_workflow": 10,
        "api_calls_per_month": 25000
      },
      "features": [
        "Private workflows",
        "Advanced analytics",
        "Priority server access",
        "Email support"
      ]
    }
  ]
}
```

### Get Current Subscription
```http
GET /mcp/billing/subscription
Authorization: Bearer {token}
```

### Create/Update Subscription
```http
POST /mcp/billing/subscription
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan_id": "professional",
  "billing_cycle": "monthly",
  "payment_method_id": "pm_stripe_payment_method_id"
}
```

### Get Usage Statistics
```http
GET /mcp/billing/usage?period=2025-01
Authorization: Bearer {token}
```

---

## 📊 **Analytics & Insights**

### User Analytics
```http
GET /mcp/analytics/user?period=last_30_days
Authorization: Bearer {token}
```

### Platform Analytics (Admin)
```http
GET /mcp/analytics/platform?period=last_30_days
Authorization: Bearer {admin_token}
```

### Server Performance Analytics
```http
GET /mcp/analytics/server/{serverId}/performance
```

### Real-time Analytics
```http
GET /mcp/analytics/realtime
Authorization: Bearer {token}
```

---

## 👥 **Community Features**

### Get Community Profile
```http
GET /mcp/community/profile/{userId}
```

### Get Trending Items
```http
GET /mcp/community/trending?type=server&period=7d&limit=10
```

### Get Leaderboard
```http
GET /mcp/community/leaderboard?type=contributors&period=all_time&limit=20
```

### Fork Workflow
```http
POST /mcp/community/workflows/{workflowId}/fork
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_name": "My Custom Data Pipeline"
}
```

---

## 🔒 **Enterprise Security**

### Check Permission
```http
POST /mcp/security/check-permission
Authorization: Bearer {token}
Content-Type: application/json

{
  "resource_type": "server",
  "resource_id": "server_uuid",
  "access_level": "execute"
}
```

### Get Compliance Report
```http
GET /mcp/security/compliance?framework=SOC2&from=2025-01-01&to=2025-01-31
Authorization: Bearer {admin_token}
```

### Security Dashboard
```http
GET /mcp/security/dashboard
Authorization: Bearer {admin_token}
```

---

## 🌐 **WebSocket Real-time Monitoring**

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8080');

// Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  data: { token: 'your-jwt-token' }
}));

// Subscribe to execution updates
ws.send(JSON.stringify({
  type: 'subscribe',
  data: {
    execution_id: 'exec_uuid', // Optional: specific execution
    workflow_id: 'workflow_uuid', // Optional: all executions for workflow
    filters: {
      status: ['running', 'completed'],
      servers: ['filesystem-server']
    }
  }
}));
```

### WebSocket Events
- `execution_update` - Workflow execution progress
- `system_metrics` - Real-time system metrics  
- `server_health_update` - Server health changes
- `system_alert` - Critical system alerts

**Execution Update Event:**
```json
{
  "type": "execution_update",
  "data": {
    "execution_id": "exec_uuid",
    "workflow_id": "workflow_uuid", 
    "status": "running",
    "current_step": 2,
    "total_steps": 5,
    "progress_percentage": 40,
    "step_updates": [
      {
        "step_id": "read-file",
        "status": "completed",
        "duration_ms": 1500,
        "server_used": "filesystem-server"
      },
      {
        "step_id": "transform-data",
        "status": "running",
        "start_time": "2025-01-15T10:30:00Z"
      }
    ],
    "performance_metrics": {
      "execution_time_ms": 5000,
      "tokens_consumed": 150,
      "api_calls_made": 3
    },
    "logs": [
      {
        "level": "info",
        "message": "Step completed successfully",
        "step_id": "read-file",
        "timestamp": "2025-01-15T10:29:58Z"
      }
    ]
  }
}
```

---

## 🏗️ **Integration Guide**

### Adding MCP Routes to Your Server

```typescript
import express from 'express';
import { createMCPServerRoutes } from './src/api/routes/mcp-servers';
import { createMCPWorkflowRoutes } from './src/api/routes/mcp-workflows';
import { createMCPBillingRoutes } from './src/api/routes/mcp-billing';

const app = express();

// Initialize MCP routes
app.use('/api/v1/mcp/servers', createMCPServerRoutes(pool, logger, errorManager, eventBus));
app.use('/api/v1/mcp/workflows', createMCPWorkflowRoutes(pool, logger, errorManager, eventBus));
app.use('/api/v1/mcp/billing', createMCPBillingRoutes(pool, logger, errorManager, eventBus));
```

### Frontend Integration

```typescript
import { MCPDashboard } from './components/mcp/MCPDashboard';

function App() {
  return (
    <div>
      {/* Your existing OpenConductor UI */}
      <TrinityAIDashboard /> {/* Enterprise features */}
      
      {/* New MCP Dashboard */}
      <MCPDashboard />
    </div>
  );
}
```

### Event System Integration

```typescript
// Listen for MCP events in your existing system
conductor.events.on('mcp.server.created', (event) => {
  console.log('New MCP server created:', event.data.name);
});

conductor.events.on('mcp.workflow.execution.completed', (event) => {
  console.log('Workflow completed:', event.data.executionId);
});
```

---

## 📋 **Error Handling**

All endpoints follow the standard OpenConductor error format:

```json
{
  "success": false,
  "error": {
    "code": "MCP_SERVER_NOT_FOUND",
    "message": "The specified MCP server was not found",
    "details": {
      "server_id": "invalid_uuid",
      "suggestion": "Check the server ID or search for available servers"
    }
  },
  "metadata": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `MCP_SERVER_NOT_FOUND` - Server not found
- `MCP_WORKFLOW_NOT_FOUND` - Workflow not found  
- `MCP_INSTALLATION_FAILED` - Server installation failed
- `MCP_EXECUTION_FAILED` - Workflow execution failed
- `MCP_PERMISSION_DENIED` - Insufficient permissions
- `MCP_QUOTA_EXCEEDED` - Usage limit exceeded
- `MCP_SEMANTIC_SEARCH_UNAVAILABLE` - OpenAI API not configured

---

## 🎯 **Usage Examples**

### Complete Server Discovery Flow

```javascript
// 1. Search for servers
const searchResponse = await fetch('/api/v1/mcp/servers?search=database&use_semantic=true', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const { data: searchResults } = await searchResponse.json();

// 2. Get detailed server info
const serverId = searchResults.servers[0].id;
const serverResponse = await fetch(`/api/v1/mcp/servers/${serverId}?include_tools=true`);
const { data: serverDetails } = await serverResponse.json();

// 3. Install server
const installResponse = await fetch(`/api/v1/mcp/servers/${serverId}/install`, {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    installation_method: 'npm',
    configuration: { /* server-specific config */ }
  })
});

// 4. Create workflow using installed server
const workflowResponse = await fetch('/api/v1/mcp/workflows', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Database Workflow',
    definition: {
      nodes: [
        {
          id: 'query-data',
          type: 'mcp_server',
          server: serverDetails.server.name,
          tool: 'execute_query'
        }
      ]
    }
  })
});
```

### Real-time Monitoring Setup

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'authenticate',
    data: { token: authToken }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'authenticated':
      // Subscribe to workflow execution updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: {
          workflow_id: workflowId,
          filters: { status: ['running', 'completed', 'failed'] }
        }
      }));
      break;
      
    case 'execution_update':
      updateWorkflowProgress(message.data);
      break;
      
    case 'system_metrics':
      updateSystemDashboard(message.data);
      break;
  }
};

function updateWorkflowProgress(executionData) {
  const progressBar = document.getElementById('progress');
  progressBar.style.width = `${executionData.progress_percentage}%`;
  
  const statusElement = document.getElementById('status');
  statusElement.textContent = `Step ${executionData.current_step}/${executionData.total_steps}: ${executionData.status}`;
}
```

---

## 🔧 **Configuration**

### Environment Variables

```bash
# Core MCP Configuration
MCP_ENABLED=true
MCP_SEMANTIC_SEARCH_ENABLED=true
MCP_COMMUNITY_FEATURES_ENABLED=true
MCP_ANALYTICS_ENABLED=true
MCP_BILLING_ENABLED=true

# AI Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=text-embedding-ada-002

# Billing Integration  
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLIC_KEY=pk_live_...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/openconductor
ENABLE_PGVECTOR=true

# WebSocket Monitoring
WEBSOCKET_PORT=8080
WEBSOCKET_ENABLED=true

# Enterprise Features
ENTERPRISE_SECURITY_ENABLED=true
AUDIT_LOGGING_ENABLED=true
COMPLIANCE_MODE=SOC2
```

### Feature Flags

```typescript
const mcpConfig = {
  features: {
    semanticSearch: process.env.OPENAI_API_KEY ? true : false,
    communityFeatures: true,
    analytics: true,
    billing: process.env.STRIPE_SECRET_KEY ? true : false,
    enterpriseSecurity: process.env.ENTERPRISE_LICENSE ? true : false,
    realtimeMonitoring: true
  }
};
```

---

## 🎯 **Best Practices**

### Performance Optimization

1. **Use Semantic Search Wisely**
   ```typescript
   // Enable semantic search for complex queries
   const complexQuery = "find servers for real-time data processing with ML capabilities";
   
   // Use traditional search for simple queries
   const simpleQuery = "filesystem";
   ```

2. **Implement Caching**
   ```typescript
   // Cache frequent searches
   const cacheKey = `search:${query}:${filters}`;
   const cachedResult = await redis.get(cacheKey);
   ```

3. **Monitor Usage Limits**
   ```typescript
   // Check limits before expensive operations
   const limitsCheck = await billingSystem.checkUsageLimits(userId, 'workflow_execution');
   if (!limitsCheck.withinLimits) {
     throw new Error('Usage limit exceeded');
   }
   ```

### Security Best Practices

1. **Always Check Permissions**
   ```typescript
   const permissionCheck = await enterpriseSecurity.checkPermission(
     userId, 'server', serverId, 'execute'
   );
   if (!permissionCheck.granted) {
     throw new UnauthorizedError(permissionCheck.reason);
   }
   ```

2. **Classify Sensitive Data**
   ```typescript
   await enterpriseSecurity.classifyResource(
     'workflow', workflowId, 'confidential', 
     ['customer-data'], userId, ['GDPR']
   );
   ```

3. **Audit All Actions**
   ```typescript
   // Automatic audit logging is built-in
   // Manual logging for custom events:
   await enterpriseSecurity.logSecurityEvent(
     userId, 'custom_action', 'resource', resourceId, metadata
   );
   ```

---

## 🚀 **Deployment**

### Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  openconductor:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - MCP_ENABLED=true
    ports:
      - "3000:3000"
      - "8080:8080"  # WebSocket monitoring
```

### Health Checks

```http
GET /api/v1/mcp/health
```

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": { "connected": true, "vectorSupport": true },
    "serverRegistry": { "status": "healthy", "metrics": { "total_servers": 156 }},
    "semanticSearch": { "total_searches": 1000, "avg_response_time": 150 }
  },
  "metrics": {
    "totalServers": 156,
    "totalWorkflows": 834,
    "totalExecutions": 12500
  }
}
```

---

## 📚 **Additional Resources**

- **[Architecture Overview](./MCP_ARCHITECTURE.md)** - Detailed system design
- **[Migration Guide](./MCP_MIGRATION.md)** - Upgrading from Trinity AI only
- **[Enterprise Features](./MCP_ENTERPRISE.md)** - Security and compliance
- **[Community Guidelines](./MCP_COMMUNITY.md)** - Contributing and sharing
- **[Troubleshooting](./MCP_TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🆘 **Support**

- **Discord**: [OpenConductor Community](https://discord.gg/openconductor)
- **GitHub**: [Issues & Feature Requests](https://github.com/openconductor/core/issues)
- **Email**: [support@openconductor.ai](mailto:support@openconductor.ai)
- **Documentation**: [Full Docs](https://docs.openconductor.ai/mcp)

---

*OpenConductor MCP Integration - "The npm for MCP Servers"*  
*Version 2.0.0 | Last Updated: January 2025*