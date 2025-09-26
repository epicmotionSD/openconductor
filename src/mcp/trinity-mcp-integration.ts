/**
 * Trinity MCP Integration
 * 
 * Simplified MCP integration focused on supporting Trinity Agent automation workflows.
 * Removes marketplace and community features, focuses on agent-driven automation.
 */

import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResult, ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../utils/logger';

export interface TrinityMCPServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  agentTypes: ('oracle' | 'sentinel' | 'sage')[]; // Which agents can use this server
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastHealthCheck?: Date;
}

export interface TrinityWorkflow {
  id: string;
  name: string;
  agentType: 'oracle' | 'sentinel' | 'sage';
  triggerType: 'prediction' | 'alert' | 'advisory' | 'scheduled';
  mcpServers: string[]; // Server IDs needed for this workflow
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'mcp_tool_call' | 'agent_decision' | 'data_transform' | 'notification';
  serverId?: string;
  toolName?: string;
  parameters?: Record<string, any>;
  condition?: string; // JavaScript expression for conditional execution
}

export class TrinityMCPIntegration {
  private clients: Map<string, MCPClient> = new Map();
  private servers: Map<string, TrinityMCPServer> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeEssentialServers();
  }

  /**
   * Initialize essential MCP servers for Trinity Agent automation
   */
  private initializeEssentialServers(): void {
    // PostgreSQL server for data operations
    this.servers.set('postgres', {
      id: 'postgres',
      name: 'PostgreSQL Integration',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      agentTypes: ['oracle', 'sentinel', 'sage'],
      capabilities: ['database_query', 'data_analysis'],
      status: 'active'
    });

    // Monitoring server for Sentinel agent
    this.servers.set('monitoring', {
      id: 'monitoring',
      name: 'System Monitoring',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-monitoring'],
      agentTypes: ['sentinel'],
      capabilities: ['system_metrics', 'health_checks', 'alerting'],
      status: 'active'
    });

    // Slack server for notifications
    this.servers.set('slack', {
      id: 'slack',
      name: 'Slack Notifications',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      agentTypes: ['oracle', 'sentinel', 'sage'],
      capabilities: ['send_message', 'create_channel', 'upload_file'],
      status: 'active'
    });
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) {
      this.logger.error(`Server ${serverId} not found`);
      return false;
    }

    try {
      const transport = new StdioServerTransport({
        command: server.command,
        args: server.args,
        env: process.env
      });

      const client = new MCPClient(
        { name: 'trinity-agent-platform', version: '1.0.0' },
        { capabilities: {} }
      );

      await client.connect(transport);
      this.clients.set(serverId, client);
      
      server.status = 'active';
      server.lastHealthCheck = new Date();
      
      this.logger.info(`Connected to MCP server: ${server.name}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to server ${serverId}:`, error);
      server.status = 'error';
      return false;
    }
  }

  /**
   * Execute a Trinity Agent workflow
   */
  async executeWorkflow(
    workflowId: string,
    triggerData: any,
    agentType: 'oracle' | 'sentinel' | 'sage'
  ): Promise<{
    success: boolean;
    results?: any[];
    error?: string;
    executionTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const workflow = this.getWorkflowById(workflowId);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      if (workflow.agentType !== agentType) {
        return { success: false, error: 'Workflow not authorized for this agent type' };
      }

      // Ensure required servers are connected
      for (const serverId of workflow.mcpServers) {
        if (!this.clients.has(serverId)) {
          await this.connectToServer(serverId);
        }
      }

      const results: any[] = [];
      
      // Execute workflow steps
      for (const step of workflow.steps) {
        const stepResult = await this.executeWorkflowStep(step, triggerData, results);
        results.push(stepResult);
        
        // If step failed and workflow requires all steps to succeed, stop execution
        if (!stepResult.success && workflow.steps.length > 1) {
          break;
        }
      }

      const executionTime = Date.now() - startTime;
      
      this.logger.info(`Workflow ${workflowId} completed in ${executionTime}ms`);
      
      return {
        success: results.every(r => r.success),
        results,
        executionTime
      };
    } catch (error) {
      this.logger.error(`Workflow execution failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    triggerData: any,
    previousResults: any[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check condition if specified
      if (step.condition) {
        const conditionMet = this.evaluateCondition(step.condition, triggerData, previousResults);
        if (!conditionMet) {
          return { success: true, data: { skipped: true, reason: 'condition not met' } };
        }
      }

      switch (step.type) {
        case 'mcp_tool_call':
          return await this.executeMCPToolCall(step, triggerData, previousResults);
        
        case 'agent_decision':
          return await this.executeAgentDecision(step, triggerData, previousResults);
        
        case 'data_transform':
          return await this.executeDataTransform(step, triggerData, previousResults);
        
        case 'notification':
          return await this.executeNotification(step, triggerData, previousResults);
        
        default:
          return { success: false, error: `Unknown step type: ${step.type}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute MCP tool call step
   */
  private async executeMCPToolCall(
    step: WorkflowStep,
    triggerData: any,
    previousResults: any[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!step.serverId || !step.toolName) {
      return { success: false, error: 'Missing serverId or toolName for MCP tool call' };
    }

    const client = this.clients.get(step.serverId);
    if (!client) {
      return { success: false, error: `MCP client not connected for server ${step.serverId}` };
    }

    try {
      // Prepare parameters by substituting values from trigger data and previous results
      const parameters = this.substituteParameters(
        step.parameters || {},
        triggerData,
        previousResults
      );

      const result = await client.callTool({
        name: step.toolName,
        arguments: parameters
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MCP tool call failed'
      };
    }
  }

  /**
   * Execute agent decision step (placeholder for agent-specific logic)
   */
  private async executeAgentDecision(
    step: WorkflowStep,
    triggerData: any,
    previousResults: any[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    // This would integrate with Trinity Agent decision logic
    // For now, return a simple decision based on parameters
    const decision = {
      action: step.parameters?.defaultAction || 'continue',
      confidence: step.parameters?.confidence || 0.8,
      reasoning: 'Agent decision executed successfully'
    };

    return { success: true, data: decision };
  }

  /**
   * Execute data transformation step
   */
  private async executeDataTransform(
    step: WorkflowStep,
    triggerData: any,
    previousResults: any[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Simple data transformation logic
      const transformType = step.parameters?.type || 'identity';
      let transformedData = triggerData;

      switch (transformType) {
        case 'extract':
          const field = step.parameters?.field;
          transformedData = field ? triggerData[field] : triggerData;
          break;
        
        case 'aggregate':
          if (Array.isArray(previousResults)) {
            transformedData = {
              count: previousResults.length,
              successful: previousResults.filter(r => r.success).length,
              summary: previousResults
            };
          }
          break;
        
        default:
          transformedData = triggerData;
      }

      return { success: true, data: transformedData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data transformation failed'
      };
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotification(
    step: WorkflowStep,
    triggerData: any,
    previousResults: any[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const notificationType = step.parameters?.type || 'slack';
    const message = this.substituteParameters(
      step.parameters?.message || 'Trinity Agent notification',
      triggerData,
      previousResults
    );

    if (notificationType === 'slack') {
      const client = this.clients.get('slack');
      if (!client) {
        return { success: false, error: 'Slack client not connected' };
      }

      try {
        const result = await client.callTool({
          name: 'send_message',
          arguments: {
            channel: step.parameters?.channel || '#general',
            text: message
          }
        });

        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Notification failed'
        };
      }
    }

    return { success: false, error: `Unsupported notification type: ${notificationType}` };
  }

  /**
   * Get available tools for a specific server
   */
  async getServerTools(serverId: string): Promise<ListToolsResult | null> {
    const client = this.clients.get(serverId);
    if (!client) {
      await this.connectToServer(serverId);
      const newClient = this.clients.get(serverId);
      if (!newClient) return null;
      return await newClient.listTools();
    }

    return await client.listTools();
  }

  /**
   * Health check for all connected servers
   */
  async performHealthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [serverId, server] of this.servers.entries()) {
      try {
        const client = this.clients.get(serverId);
        if (!client) {
          results[serverId] = await this.connectToServer(serverId);
        } else {
          // Try to list tools as a health check
          await client.listTools();
          results[serverId] = true;
          server.status = 'active';
        }
        server.lastHealthCheck = new Date();
      } catch (error) {
        results[serverId] = false;
        server.status = 'error';
        this.logger.error(`Health check failed for ${serverId}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get Trinity Agent workflows for a specific agent type
   */
  getWorkflowsForAgent(agentType: 'oracle' | 'sentinel' | 'sage'): TrinityWorkflow[] {
    // This would typically load from database
    return this.getDefaultWorkflows().filter(w => w.agentType === agentType);
  }

  private getWorkflowById(workflowId: string): TrinityWorkflow | null {
    const allWorkflows = this.getDefaultWorkflows();
    return allWorkflows.find(w => w.id === workflowId) || null;
  }

  private getDefaultWorkflows(): TrinityWorkflow[] {
    return [
      {
        id: 'oracle-prediction-alert',
        name: 'Oracle Prediction Alert Workflow',
        agentType: 'oracle',
        triggerType: 'prediction',
        mcpServers: ['postgres', 'slack'],
        isActive: true,
        steps: [
          {
            id: 'store-prediction',
            type: 'mcp_tool_call',
            serverId: 'postgres',
            toolName: 'query',
            parameters: {
              query: 'INSERT INTO predictions (agent_id, prediction, confidence) VALUES ($1, $2, $3)',
              params: ['${triggerData.agent_id}', '${triggerData.prediction}', '${triggerData.confidence}']
            }
          },
          {
            id: 'notify-high-confidence',
            type: 'notification',
            serverId: 'slack',
            parameters: {
              type: 'slack',
              channel: '#predictions',
              message: 'High-confidence prediction: ${triggerData.prediction} (${triggerData.confidence}% confidence)'
            },
            condition: 'triggerData.confidence > 0.9'
          }
        ]
      },
      {
        id: 'sentinel-alert-response',
        name: 'Sentinel Alert Response Workflow',
        agentType: 'sentinel',
        triggerType: 'alert',
        mcpServers: ['monitoring', 'slack'],
        isActive: true,
        steps: [
          {
            id: 'get-system-metrics',
            type: 'mcp_tool_call',
            serverId: 'monitoring',
            toolName: 'get_metrics',
            parameters: {}
          },
          {
            id: 'alert-team',
            type: 'notification',
            parameters: {
              type: 'slack',
              channel: '#alerts',
              message: 'Alert: ${triggerData.message} - Current metrics: ${previousResults[0].data}'
            }
          }
        ]
      }
    ];
  }

  private evaluateCondition(condition: string, triggerData: any, previousResults: any[]): boolean {
    try {
      // Simple condition evaluation - in production, use a safe expression evaluator
      const func = new Function('triggerData', 'previousResults', `return ${condition}`);
      return func(triggerData, previousResults);
    } catch (error) {
      this.logger.error(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  private substituteParameters(
    params: any,
    triggerData: any,
    previousResults: any[]
  ): any {
    if (typeof params === 'string') {
      return params.replace(/\${(\w+(?:\.\w+)*)}/g, (match, path) => {
        try {
          return this.getValueByPath({ triggerData, previousResults }, path);
        } catch {
          return match; // Return original if substitution fails
        }
      });
    }

    if (Array.isArray(params)) {
      return params.map(item => this.substituteParameters(item, triggerData, previousResults));
    }

    if (typeof params === 'object' && params !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(params)) {
        result[key] = this.substituteParameters(value, triggerData, previousResults);
      }
      return result;
    }

    return params;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Clean up connections
   */
  async disconnect(): Promise<void> {
    for (const [serverId, client] of this.clients.entries()) {
      try {
        await client.close();
        this.logger.info(`Disconnected from ${serverId}`);
      } catch (error) {
        this.logger.error(`Error disconnecting from ${serverId}:`, error);
      }
    }
    this.clients.clear();
  }
}