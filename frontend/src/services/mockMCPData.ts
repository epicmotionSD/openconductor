/**
 * Mock MCP Data Service
 * 
 * Provides realistic mock data for MCP servers, workflows, and analytics
 * to demonstrate the platform capabilities without requiring backend services.
 */

export interface MockMCPServer {
  id: string;
  name: string;
  display_name: string;
  description: string;
  author_name: string;
  categories: string[];
  tags: string[];
  star_count: number;
  download_count: number;
  rating_average: number;
  is_verified: boolean;
  is_featured: boolean;
  performance_tier: string;
  tool_count: number;
  status: 'active' | 'pending' | 'deprecated';
  created_at: string;
  transport_type: 'stdio' | 'http_sse' | 'websocket';
}

export interface MockMCPWorkflow {
  id: string;
  name: string;
  description: string;
  author_name: string;
  tags: string[];
  star_count: number;
  execution_count: number;
  is_public: boolean;
  is_template: boolean;
  status: 'draft' | 'published' | 'archived';
  success_rate: number;
  avg_execution_time: number;
  created_at: string;
}

export interface MockMCPExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  progress: number;
  current_step: string;
  total_steps: number;
}

class MockMCPDataService {
  private servers: MockMCPServer[] = [];
  private workflows: MockMCPWorkflow[] = [];
  private executions: MockMCPExecution[] = [];
  private analytics = {
    total_servers: 2340,
    active_servers: 1987,
    total_workflows: 8934,
    total_executions: 45672,
    success_rate: 94.2,
    avg_response_time: 142
  };

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize mock MCP servers
    this.servers = [
      {
        id: 'fs-001',
        name: 'filesystem-server',
        display_name: 'File System Server',
        description: 'Comprehensive file system operations including read, write, directory management, and file watching capabilities.',
        author_name: 'ModelContext Protocol',
        categories: ['filesystem', 'utilities'],
        tags: ['files', 'directory', 'io', 'filesystem'],
        star_count: 342,
        download_count: 5678,
        rating_average: 4.8,
        is_verified: true,
        is_featured: true,
        performance_tier: 'premium',
        tool_count: 12,
        status: 'active',
        transport_type: 'stdio',
        created_at: '2024-01-15T00:00:00Z'
      },
      {
        id: 'pg-001',
        name: 'postgres-server',
        display_name: 'PostgreSQL Server',
        description: 'Full PostgreSQL database operations including queries, schema management, and transaction handling.',
        author_name: 'ModelContext Protocol',
        categories: ['database', 'sql'],
        tags: ['postgres', 'sql', 'database', 'queries'],
        star_count: 156,
        download_count: 3421,
        rating_average: 4.6,
        is_verified: true,
        is_featured: false,
        performance_tier: 'standard',
        tool_count: 8,
        status: 'active',
        transport_type: 'stdio',
        created_at: '2024-01-20T00:00:00Z'
      },
      {
        id: 'web-001',
        name: 'web-search-server',
        display_name: 'Web Search Server',
        description: 'Advanced web search capabilities with multiple search engines and content extraction.',
        author_name: 'ModelContext Protocol',
        categories: ['web', 'search', 'information'],
        tags: ['search', 'web', 'google', 'bing', 'scraping'],
        star_count: 89,
        download_count: 2103,
        rating_average: 4.3,
        is_verified: true,
        is_featured: false,
        performance_tier: 'standard',
        tool_count: 6,
        status: 'active',
        transport_type: 'http_sse',
        created_at: '2024-02-01T00:00:00Z'
      },
      {
        id: 'api-001',
        name: 'api-integration-server',
        display_name: 'API Integration Server',
        description: 'REST API integration with authentication, rate limiting, and response transformation.',
        author_name: 'Enterprise Solutions Inc',
        categories: ['api', 'integration', 'web'],
        tags: ['api', 'rest', 'integration', 'http'],
        star_count: 67,
        download_count: 1892,
        rating_average: 4.4,
        is_verified: true,
        is_featured: false,
        performance_tier: 'standard',
        tool_count: 5,
        status: 'active',
        transport_type: 'http_sse',
        created_at: '2024-02-10T00:00:00Z'
      },
      {
        id: 'slack-001',
        name: 'slack-integration-server',
        display_name: 'Slack Integration Server',
        description: 'Complete Slack integration for messaging, channels, and workflow notifications.',
        author_name: 'DevOps Tools Corp',
        categories: ['communication', 'notifications'],
        tags: ['slack', 'messaging', 'notifications', 'teams'],
        star_count: 234,
        download_count: 4567,
        rating_average: 4.7,
        is_verified: true,
        is_featured: true,
        performance_tier: 'premium',
        tool_count: 9,
        status: 'active',
        transport_type: 'websocket',
        created_at: '2024-01-25T00:00:00Z'
      }
    ];

    // Initialize mock workflows
    this.workflows = [
      {
        id: 'wf-001',
        name: 'Automated Data Pipeline',
        description: 'Complete ETL pipeline for processing CSV files and loading into PostgreSQL database.',
        author_name: 'DataOps Team',
        tags: ['data', 'etl', 'automation', 'database'],
        star_count: 45,
        execution_count: 1203,
        is_public: true,
        is_template: true,
        status: 'published',
        success_rate: 96.8,
        avg_execution_time: 45000,
        created_at: '2024-02-15T00:00:00Z'
      },
      {
        id: 'wf-002',
        name: 'Incident Response Automation',
        description: 'Automated incident response workflow with Slack notifications and ServiceNow integration.',
        author_name: 'SRE Team',
        tags: ['incident', 'automation', 'alerts', 'response'],
        star_count: 78,
        execution_count: 567,
        is_public: true,
        is_template: false,
        status: 'published',
        success_rate: 98.2,
        avg_execution_time: 12000,
        created_at: '2024-02-20T00:00:00Z'
      },
      {
        id: 'wf-003',
        name: 'File Processing Pipeline',
        description: 'Automated file processing with validation, transformation, and archiving.',
        author_name: 'Automation Team',
        tags: ['files', 'processing', 'validation', 'archive'],
        star_count: 23,
        execution_count: 892,
        is_public: false,
        is_template: false,
        status: 'draft',
        success_rate: 94.1,
        avg_execution_time: 28000,
        created_at: '2024-03-01T00:00:00Z'
      }
    ];

    // Initialize mock executions
    this.executions = [
      {
        id: 'ex-001',
        workflow_id: 'wf-001',
        workflow_name: 'Automated Data Pipeline',
        status: 'running',
        started_at: new Date(Date.now() - 45000).toISOString(),
        progress: 65,
        current_step: 'Data Transformation',
        total_steps: 4
      },
      {
        id: 'ex-002',
        workflow_id: 'wf-002',
        workflow_name: 'Incident Response Automation',
        status: 'completed',
        started_at: new Date(Date.now() - 120000).toISOString(),
        completed_at: new Date(Date.now() - 108000).toISOString(),
        execution_time_ms: 12000,
        progress: 100,
        current_step: 'Notification Sent',
        total_steps: 3
      },
      {
        id: 'ex-003',
        workflow_id: 'wf-001',
        workflow_name: 'Automated Data Pipeline',
        status: 'failed',
        started_at: new Date(Date.now() - 200000).toISOString(),
        completed_at: new Date(Date.now() - 195000).toISOString(),
        execution_time_ms: 5000,
        progress: 25,
        current_step: 'Database Connection',
        total_steps: 4
      },
      {
        id: 'ex-004',
        workflow_id: 'wf-003',
        workflow_name: 'File Processing Pipeline',
        status: 'queued',
        started_at: new Date().toISOString(),
        progress: 0,
        current_step: 'Waiting',
        total_steps: 5
      }
    ];
  }

  // Server operations
  async getServers(filters?: any): Promise<MockMCPServer[]> {
    await this.simulateDelay();
    
    let results = [...this.servers];
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(server => 
        server.name.toLowerCase().includes(search) ||
        server.description.toLowerCase().includes(search) ||
        server.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    if (filters?.category) {
      results = results.filter(server => 
        server.categories.includes(filters.category)
      );
    }
    
    if (filters?.featured) {
      results = results.filter(server => server.is_featured);
    }
    
    return results;
  }

  async getServerById(id: string): Promise<MockMCPServer | null> {
    await this.simulateDelay();
    return this.servers.find(server => server.id === id) || null;
  }

  async installServer(serverId: string): Promise<{ success: boolean; message: string }> {
    await this.simulateDelay(2000); // Simulate installation time
    return {
      success: Math.random() > 0.1, // 90% success rate
      message: 'Server installed successfully'
    };
  }

  // Workflow operations
  async getWorkflows(filters?: any): Promise<MockMCPWorkflow[]> {
    await this.simulateDelay();
    
    let results = [...this.workflows];
    
    if (filters?.public_only) {
      results = results.filter(workflow => workflow.is_public);
    }
    
    if (filters?.templates_only) {
      results = results.filter(workflow => workflow.is_template);
    }
    
    return results;
  }

  async getWorkflowExecutions(): Promise<MockMCPExecution[]> {
    await this.simulateDelay();
    return [...this.executions];
  }

  async executeWorkflow(workflowId: string): Promise<MockMCPExecution> {
    await this.simulateDelay();
    
    const workflow = this.workflows.find(w => w.id === workflowId);
    const execution: MockMCPExecution = {
      id: `ex-${Date.now()}`,
      workflow_id: workflowId,
      workflow_name: workflow?.name || 'Unknown Workflow',
      status: 'running',
      started_at: new Date().toISOString(),
      progress: 0,
      current_step: 'Initializing',
      total_steps: Math.floor(Math.random() * 5) + 3
    };
    
    this.executions.unshift(execution);
    return execution;
  }

  // Analytics operations
  async getAnalytics(): Promise<any> {
    await this.simulateDelay();
    
    return {
      ...this.analytics,
      servers_by_category: {
        'filesystem': 456,
        'database': 234,
        'web': 187,
        'api': 298,
        'communication': 167,
        'utilities': 387,
        'security': 145,
        'monitoring': 234
      },
      execution_trends: this.generateExecutionTrends(),
      server_popularity: this.generateServerPopularity(),
      workflow_performance: this.generateWorkflowPerformance()
    };
  }

  // Real-time data simulation
  startRealTimeUpdates(callback: (update: any) => void): () => void {
    const interval = setInterval(() => {
      // Simulate execution updates
      this.executions.forEach(execution => {
        if (execution.status === 'running') {
          execution.progress = Math.min(100, execution.progress + Math.random() * 10);
          if (execution.progress >= 100) {
            execution.status = Math.random() > 0.1 ? 'completed' : 'failed';
            execution.completed_at = new Date().toISOString();
            execution.execution_time_ms = Date.now() - new Date(execution.started_at).getTime();
          }
        }
      });

      // Simulate new executions
      if (Math.random() > 0.8) {
        const randomWorkflow = this.workflows[Math.floor(Math.random() * this.workflows.length)];
        const newExecution: MockMCPExecution = {
          id: `ex-${Date.now()}`,
          workflow_id: randomWorkflow.id,
          workflow_name: randomWorkflow.name,
          status: 'running',
          started_at: new Date().toISOString(),
          progress: 0,
          current_step: 'Starting',
          total_steps: Math.floor(Math.random() * 5) + 3
        };
        this.executions.unshift(newExecution);
        this.executions = this.executions.slice(0, 20); // Keep only recent executions
      }

      callback({
        type: 'execution_update',
        data: this.executions
      });
    }, 2000);

    return () => clearInterval(interval);
  }

  private generateExecutionTrends(): any[] {
    const trends = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      trends.push({
        time: hour.toISOString(),
        executions: Math.floor(Math.random() * 50) + 10,
        success_rate: Math.random() * 10 + 90,
        avg_time: Math.random() * 5000 + 1000
      });
    }
    
    return trends;
  }

  private generateServerPopularity(): any[] {
    return this.servers
      .sort((a, b) => b.download_count - a.download_count)
      .slice(0, 10)
      .map(server => ({
        name: server.display_name,
        downloads: server.download_count,
        stars: server.star_count,
        category: server.categories[0]
      }));
  }

  private generateWorkflowPerformance(): any[] {
    return this.workflows.map(workflow => ({
      name: workflow.name,
      executions: workflow.execution_count,
      success_rate: workflow.success_rate,
      avg_time: workflow.avg_execution_time,
      stars: workflow.star_count
    }));
  }

  private async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Trinity AI integration data
  getTrinityMCPIntegration() {
    return {
      oracle_workflows: [
        {
          name: 'Predictive Scaling Workflow',
          description: 'Oracle predicts load increase, automatically scales infrastructure',
          trigger: 'prediction_confidence > 0.85',
          servers: ['kubernetes-server', 'aws-server', 'slack-server'],
          last_triggered: '2 hours ago',
          success_rate: 94.2
        },
        {
          name: 'Capacity Planning Automation',
          description: 'Oracle forecasts resource needs, provisions infrastructure',
          trigger: 'forecast_horizon = 7_days',
          servers: ['terraform-server', 'monitoring-server', 'email-server'],
          last_triggered: '1 day ago',
          success_rate: 91.8
        }
      ],
      sentinel_workflows: [
        {
          name: 'Alert Response Automation',
          description: 'Sentinel detects anomaly, executes remediation workflow',
          trigger: 'anomaly_detected AND confidence > 0.9',
          servers: ['servicenow-server', 'kubernetes-server', 'datadog-server'],
          last_triggered: '15 minutes ago',
          success_rate: 98.7
        },
        {
          name: 'Security Incident Response',
          description: 'Sentinel identifies threat, initiates security protocol',
          trigger: 'security_score < 0.3',
          servers: ['security-server', 'vault-server', 'pagerduty-server'],
          last_triggered: '3 hours ago',
          success_rate: 99.1
        }
      ],
      sage_workflows: [
        {
          name: 'Optimization Recommendations',
          description: 'Sage analyzes performance, implements optimization strategies',
          trigger: 'recommendation_confidence > 0.8',
          servers: ['performance-server', 'database-server', 'monitoring-server'],
          last_triggered: '30 minutes ago',
          success_rate: 89.4
        },
        {
          name: 'Cost Optimization Automation',
          description: 'Sage identifies cost savings, executes resource optimization',
          trigger: 'cost_savings > 20_percent',
          servers: ['aws-server', 'billing-server', 'reporting-server'],
          last_triggered: '4 hours ago',
          success_rate: 92.3
        }
      ]
    };
  }

  // Alert simulation for Trinity AI integration
  generateAlertToWorkflowScenarios() {
    return [
      {
        id: 'alert-001',
        type: 'Database Performance',
        severity: 'high',
        description: 'PostgreSQL query response time > 2000ms',
        trinity_agent: 'sentinel',
        triggered_workflow: 'Database Optimization Workflow',
        servers_used: ['postgres-server', 'monitoring-server', 'slack-server'],
        status: 'automated_resolution_in_progress',
        estimated_resolution: '3 minutes',
        confidence: 0.94
      },
      {
        id: 'alert-002',
        type: 'High CPU Usage',
        severity: 'critical',
        description: 'CPU utilization > 85% for 5 minutes',
        trinity_agent: 'oracle',
        triggered_workflow: 'Predictive Scaling Workflow',
        servers_used: ['kubernetes-server', 'aws-server', 'monitoring-server'],
        status: 'automated_resolution_completed',
        estimated_resolution: 'Completed in 1.2 minutes',
        confidence: 0.89
      },
      {
        id: 'alert-003',
        type: 'Security Anomaly',
        severity: 'critical',
        description: 'Unusual authentication pattern detected',
        trinity_agent: 'sage',
        triggered_workflow: 'Security Response Protocol',
        servers_used: ['security-server', 'vault-server', 'pagerduty-server'],
        status: 'awaiting_manual_approval',
        estimated_resolution: 'Pending approval',
        confidence: 0.91
      }
    ];
  }
}

// Export singleton instance
export const mockMCPData = new MockMCPDataService();

// Types are exported above with interface declarations