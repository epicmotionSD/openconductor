/**
 * OpenConductor MCP Service
 * Handles MCP server registry and workflow management API calls
 */

import apiClient, { APIResponse } from './apiClient';

export interface MCPServer {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  author_id: string;
  transport_type: 'stdio' | 'http_sse' | 'websocket';
  repository_url?: string;
  documentation_url?: string;
  npm_package?: string;
  docker_image?: string;
  categories: string[];
  tags: string[];
  use_cases: string[];
  performance_tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  compatibility_score: number;
  avg_response_time_ms: number;
  success_rate: number;
  download_count: number;
  star_count: number;
  fork_count: number;
  last_updated?: Date;
  status: 'pending' | 'active' | 'deprecated' | 'archived';
  is_verified: boolean;
  is_featured: boolean;
  weekly_downloads: number;
  monthly_active_users: number;
  created_at: Date;
  updated_at: Date;
}

export interface MCPWorkflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  definition: any;
  version: number;
  is_template: boolean;
  is_public: boolean;
  timeout_seconds: number;
  retry_policy: any;
  execution_count: number;
  success_count: number;
  avg_execution_time_ms: number;
  last_executed?: Date;
  star_count: number;
  fork_count: number;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface MCPWorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  trigger_type: 'manual' | 'scheduled' | 'webhook' | 'api';
  input_data?: any;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  current_step: number;
  total_steps: number;
  output_data?: any;
  error_message?: string;
  execution_log: any[];
  started_at: Date;
  completed_at?: Date;
  execution_time_ms?: number;
  tokens_consumed: number;
  api_calls_made: number;
  cost_usd: number;
}

export interface ServerSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  semantic_search?: string;
  categories?: string;
  tags?: string;
  use_cases?: string;
  performance_tier?: string;
  is_featured?: boolean;
  is_verified?: boolean;
  min_rating?: number;
  use_semantic?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface WorkflowSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  is_public?: boolean;
  is_template?: boolean;
  tags?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

class MCPService {
  /**
   * MCP Server Registry Methods
   */

  // List and search MCP servers
  async searchServers(params: ServerSearchParams = {}): Promise<APIResponse<{ servers: MCPServer[]; facets: any; }>> {
    return apiClient.get('/api/v1/mcp/servers', params);
  }

  // Get specific MCP server
  async getServer(id: string, includeTools = false, includeSimilar = false): Promise<APIResponse<{ server: MCPServer; similar_servers?: MCPServer[] }>> {
    return apiClient.get(`/api/v1/mcp/servers/${id}`, {
      include_tools: includeTools.toString(),
      include_similar: includeSimilar.toString()
    });
  }

  // Create new MCP server
  async createServer(serverData: Partial<MCPServer>): Promise<APIResponse<MCPServer>> {
    return apiClient.post('/api/v1/mcp/servers', serverData);
  }

  // Update MCP server
  async updateServer(id: string, updates: Partial<MCPServer>): Promise<APIResponse<MCPServer>> {
    return apiClient.put(`/api/v1/mcp/servers/${id}`, updates);
  }

  // Delete MCP server
  async deleteServer(id: string): Promise<APIResponse<void>> {
    return apiClient.delete(`/api/v1/mcp/servers/${id}`);
  }

  // Install MCP server
  async installServer(id: string, method = 'npm', configuration?: any): Promise<APIResponse<any>> {
    return apiClient.post(`/api/v1/mcp/servers/${id}/install`, {
      installation_method: method,
      configuration
    });
  }

  // Star/unstar MCP server
  async starServer(id: string, starred = true): Promise<APIResponse<{ starred: boolean; star_count: number }>> {
    return apiClient.post(`/api/v1/mcp/servers/${id}/star`, { starred });
  }

  // Rate MCP server
  async rateServer(id: string, rating: number, reviewTitle?: string, reviewText?: string): Promise<APIResponse<any>> {
    return apiClient.post(`/api/v1/mcp/servers/${id}/rate`, {
      rating,
      review_title: reviewTitle,
      review_text: reviewText
    });
  }

  // Get server tools
  async getServerTools(id: string): Promise<APIResponse<{ tools: any[]; tool_count: number }>> {
    return apiClient.get(`/api/v1/mcp/servers/${id}/tools`);
  }

  // Add tool to server
  async addTool(serverId: string, toolData: any): Promise<APIResponse<any>> {
    return apiClient.post(`/api/v1/mcp/servers/${serverId}/tools`, toolData);
  }

  /**
   * MCP Workflow Management Methods
   */

  // List workflows
  async getWorkflows(params: WorkflowSearchParams = {}): Promise<APIResponse<MCPWorkflow[]>> {
    return apiClient.get('/api/v1/mcp/workflows', params);
  }

  // Get specific workflow
  async getWorkflow(id: string): Promise<APIResponse<MCPWorkflow>> {
    return apiClient.get(`/api/v1/mcp/workflows/${id}`);
  }

  // Create workflow
  async createWorkflow(workflowData: Partial<MCPWorkflow>): Promise<APIResponse<MCPWorkflow>> {
    return apiClient.post('/api/v1/mcp/workflows', workflowData);
  }

  // Update workflow
  async updateWorkflow(id: string, updates: Partial<MCPWorkflow>): Promise<APIResponse<MCPWorkflow>> {
    return apiClient.put(`/api/v1/mcp/workflows/${id}`, updates);
  }

  // Delete workflow
  async deleteWorkflow(id: string): Promise<APIResponse<void>> {
    return apiClient.delete(`/api/v1/mcp/workflows/${id}`);
  }

  // Execute workflow
  async executeWorkflow(id: string, inputData?: any, triggerType = 'manual'): Promise<APIResponse<MCPWorkflowExecution>> {
    return apiClient.post(`/api/v1/mcp/workflows/${id}/execute`, {
      input_data: inputData,
      trigger_type: triggerType
    });
  }

  // Star/unstar workflow
  async starWorkflow(id: string, starred = true): Promise<APIResponse<{ starred: boolean; star_count: number }>> {
    return apiClient.post(`/api/v1/mcp/workflows/${id}/star`, { starred });
  }

  // Get workflow executions
  async getExecutions(params: { page?: number; limit?: number; workflow_id?: string; status?: string } = {}): Promise<APIResponse<MCPWorkflowExecution[]>> {
    return apiClient.get('/api/v1/mcp/workflows/executions', params);
  }

  // Get specific execution
  async getExecution(executionId: string): Promise<APIResponse<MCPWorkflowExecution>> {
    return apiClient.get(`/api/v1/mcp/workflows/executions/${executionId}`);
  }

  /**
   * Registry Analytics
   */

  // Get registry analytics
  async getRegistryAnalytics(): Promise<APIResponse<any>> {
    return apiClient.get('/api/v1/mcp/servers/analytics/overview');
  }

  /**
   * Utility Methods
   */

  // Search with semantic search
  async semanticSearch(query: string, filters?: Partial<ServerSearchParams>): Promise<APIResponse<{ servers: MCPServer[]; semantic_matches: any[]; recommendations: any[] }>> {
    return apiClient.get('/api/v1/mcp/servers', {
      semantic_search: query,
      use_semantic: 'true',
      ...filters
    });
  }

  // Get trending servers
  async getTrendingServers(): Promise<APIResponse<MCPServer[]>> {
    return apiClient.get('/api/v1/mcp/servers', {
      sort: 'weekly_downloads',
      order: 'desc',
      limit: 10
    });
  }

  // Get featured servers
  async getFeaturedServers(): Promise<APIResponse<MCPServer[]>> {
    return apiClient.get('/api/v1/mcp/servers', {
      is_featured: true,
      limit: 20
    });
  }

  // Get user's installed servers
  async getInstalledServers(): Promise<APIResponse<MCPServer[]>> {
    return apiClient.get('/api/v1/user/installed-servers');
  }

  // Get workflow templates
  async getWorkflowTemplates(): Promise<APIResponse<MCPWorkflow[]>> {
    return apiClient.get('/api/v1/mcp/workflows', {
      is_template: true,
      is_public: true
    });
  }
}

export const mcpService = new MCPService();
export default mcpService;