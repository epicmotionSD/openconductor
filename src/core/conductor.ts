/**
 * OpenConductor Core Engine
 * 
 * The central orchestration engine that coordinates all AI agents,
 * workflows, and system components. This is the "conductor" that
 * brings harmony to complex AI agent ecosystems.
 * 
 * "The Universal Conductor for Your AI Agents"
 */

import { EventEmitter } from 'events';
import {
  OpenConductorConfig,
  Agent,
  WorkflowDefinition,
  WorkflowExecution,
  Tool,
  OrchestrationEngine,
  EventBus,
} from '../types';

import { ConfigManager } from '../utils/config-manager';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { AgentRuntime } from './agent-runtime';
import { EventBusImpl } from './event-bus';
import { ToolRegistry } from './tool-registry';
import { PluginManager } from './plugin-manager';
import { OrchestrationEngineImpl } from '../orchestration/engine';

/**
 * OpenConductor Main Class
 * 
 * The primary interface for the OpenConductor platform.
 * This class orchestrates all components and provides the main API.
 */
export class OpenConductor extends EventEmitter {
  private readonly config: ConfigManager;
  private readonly logger: Logger;
  private readonly errorManager: ErrorManager;
  
  // Core components
  private readonly agentRuntime: AgentRuntime;
  private readonly eventBus: EventBus;
  private readonly toolRegistry: ToolRegistry;
  private readonly pluginManager: PluginManager;
  private readonly orchestrationEngine: OrchestrationEngine;
  
  // State management
  private isInitialized = false;
  private isStarted = false;
  private startTime?: Date;
  
  // Registered components
  private readonly agents = new Map<string, Agent>();
  private readonly workflows = new Map<string, WorkflowDefinition>();
  private readonly executions = new Map<string, WorkflowExecution>();

  constructor(userConfig?: Partial<OpenConductorConfig>) {
    super();
    
    // Initialize configuration
    this.config = new ConfigManager(userConfig);
    
    // Initialize core services
    this.logger = new Logger(this.config.get('logging'));
    this.errorManager = new ErrorManager(this.logger);
    
    // Initialize components
    this.eventBus = new EventBusImpl(this.logger, this.errorManager);
    this.agentRuntime = new AgentRuntime(this.logger, this.errorManager, this.eventBus);
    this.toolRegistry = new ToolRegistry(this.logger, this.errorManager, this.eventBus);
    this.pluginManager = new PluginManager(this.logger, this.errorManager, this.eventBus);
    this.orchestrationEngine = new OrchestrationEngineImpl(
      this.logger,
      this.errorManager,
      this.eventBus
    );
    
    this.logger.info('OpenConductor instance created', {
      instanceId: this.config.get('core.instanceId'),
      version: this.config.get('core.version'),
    });
  }

  /**
   * Initialize the OpenConductor platform
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('OpenConductor is already initialized');
    }

    this.logger.info('Initializing OpenConductor platform...');

    try {
      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      
      // Emit initialization event
      await this.eventBus.emit({
        type: 'system.initialized',
        timestamp: new Date(),
        data: {
          instanceId: this.config.get('core.instanceId'),
          version: this.config.get('core.version'),
        },
      });

      this.logger.info('OpenConductor platform initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenConductor platform', error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'initialization',
        instanceId: this.config.get('core.instanceId')
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Start the OpenConductor platform
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isStarted) {
      throw new Error('OpenConductor is already started');
    }

    this.logger.info('Starting OpenConductor platform...');

    try {
      this.isStarted = true;
      this.startTime = new Date();

      // Emit start event
      await this.eventBus.emit({
        type: 'system.started',
        timestamp: new Date(),
        data: {
          instanceId: this.config.get('core.instanceId'),
          startTime: this.startTime,
        },
      });

      this.logger.info('OpenConductor platform started successfully');
      this.emit('started');
    } catch (error) {
      this.logger.error('Failed to start OpenConductor platform', error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'startup',
        instanceId: this.config.get('core.instanceId')
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Stop the OpenConductor platform
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.logger.info('Stopping OpenConductor platform...');

    try {
      // Emit stop event
      await this.eventBus.emit({
        type: 'system.stopping',
        timestamp: new Date(),
        data: {
          instanceId: this.config.get('core.instanceId'),
          uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
        },
      });

      this.isStarted = false;
      this.startTime = undefined;

      this.logger.info('OpenConductor platform stopped successfully');
      this.emit('stopped');
    } catch (error) {
      this.logger.error('Failed to stop OpenConductor platform', error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'shutdown',
        instanceId: this.config.get('core.instanceId')
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Gracefully shutdown the OpenConductor platform
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down OpenConductor platform...');

    try {
      // Stop the platform
      await this.stop();

      // Cleanup resources
      await this.cleanup();

      this.logger.info('OpenConductor platform shutdown complete');
      this.emit('shutdown');
    } catch (error) {
      this.logger.error('Error during shutdown', error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'shutdown'
      });
      await this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Register an agent with the platform
   */
  async registerAgent(agent: Agent): Promise<void> {
    this.ensureStarted();

    if (this.agents.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`);
    }

    try {
      // Register with agent runtime
      await this.agentRuntime.registerAgent(agent);

      // Store agent reference
      this.agents.set(agent.id, agent);

      // Emit registration event
      await this.eventBus.emit({
        type: 'agent.registered',
        agentId: agent.id,
        timestamp: new Date(),
        data: {
          agentId: agent.id,
          name: agent.name,
          type: agent.type,
          version: agent.version,
        },
      });

      this.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
    } catch (error) {
      this.logger.error(`Failed to register agent: ${agent.id}`, error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'agent-registration',
        agentId: agent.id
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Unregister an agent from the platform
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.ensureStarted();

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    try {
      // Unregister from agent runtime
      await this.agentRuntime.unregisterAgent(agentId);

      // Remove agent reference
      this.agents.delete(agentId);

      // Emit unregistration event
      await this.eventBus.emit({
        type: 'agent.unregistered',
        agentId,
        timestamp: new Date(),
        data: {
          agentId,
          name: agent.name,
        },
      });

      this.logger.info(`Agent unregistered: ${agent.name} (${agentId})`);
    } catch (error) {
      this.logger.error(`Failed to unregister agent: ${agentId}`, error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'agent-unregistration',
        agentId
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): Agent | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * List all registered agents
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Execute an agent
   */
  async executeAgent(agentId: string, input: any): Promise<any> {
    this.ensureStarted();

    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return this.agentRuntime.executeTask(agentId, input);
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(definition: WorkflowDefinition): Promise<void> {
    this.ensureStarted();

    if (this.workflows.has(definition.id)) {
      throw new Error(`Workflow already exists: ${definition.id}`);
    }

    try {
      // Create workflow in orchestration engine
      await this.orchestrationEngine.createWorkflow(definition);

      // Store workflow reference
      this.workflows.set(definition.id, definition);

      this.logger.info(`Workflow created: ${definition.name} (${definition.id})`);
    } catch (error) {
      this.logger.error(`Failed to create workflow: ${definition.id}`, error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'workflow-creation',
        workflowId: definition.id
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, input?: any): Promise<WorkflowExecution> {
    this.ensureStarted();

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    try {
      const execution = await this.orchestrationEngine.startWorkflow(workflowId, input);
      this.executions.set(execution.id, execution);
      return execution;
    } catch (error) {
      this.logger.error(`Failed to execute workflow: ${workflowId}`, error);
      const wrappedError = this.errorManager.wrapError(error as Error, {
        context: 'workflow-execution',
        workflowId
      });
      this.errorManager.handleError(wrappedError);
      throw error;
    }
  }

  /**
   * Register a tool
   */
  async registerTool(tool: Tool): Promise<void> {
    this.ensureStarted();
    return this.toolRegistry.registerTool(tool);
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginSource: any): Promise<void> {
    this.ensureStarted();
    await this.pluginManager.installPlugin(pluginSource);
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    components: Record<string, any>;
    metrics: {
      activeAgents: number;
      activeWorkflows: number;
      activeExecutions: number;
      uptime: number;
    };
  }> {
    const components = {
      conductor: this.isStarted ? 'healthy' : 'unhealthy',
      agentRuntime: await this.agentRuntime.getHealthStatus(),
      orchestrationEngine: await this.orchestrationEngine.getHealthStatus(),
      eventBus: (this.eventBus as any).getHealthStatus ? await (this.eventBus as any).getHealthStatus() : 'running',
      toolRegistry: await this.toolRegistry.getHealthStatus(),
      pluginManager: await this.pluginManager.getHealthStatus(),
    };

    // Determine overall status
    const unhealthyComponents = Object.values(components).filter(status => status === 'unhealthy');
    const degradedComponents = Object.values(components).filter(status => status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyComponents.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedComponents.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      status: overallStatus,
      timestamp: new Date(),
      components,
      metrics: {
        activeAgents: this.agents.size,
        activeWorkflows: this.workflows.size,
        activeExecutions: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
        uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      },
    };
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<{
    timestamp: Date;
    agents: {
      total: number;
      active: number;
      executing: number;
    };
    workflows: {
      total: number;
      running: number;
      completed: number;
    };
    system: {
      cpu: number;
      memory: number;
      uptime: number;
    };
  }> {
    const runningExecutions = Array.from(this.executions.values()).filter(e => e.status === 'running');
    const completedExecutions = Array.from(this.executions.values()).filter(e => e.status === 'completed');

    return {
      timestamp: new Date(),
      agents: {
        total: this.agents.size,
        active: Array.from(this.agents.values()).filter(a => a.status === 'running').length,
        executing: runningExecutions.length,
      },
      workflows: {
        total: this.workflows.size,
        running: runningExecutions.length,
        completed: completedExecutions.length,
      },
      system: {
        cpu: process.cpuUsage().user / 1000000, // Convert to seconds
        memory: process.memoryUsage().heapUsed,
        uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      },
    };
  }

  /**
   * Get configuration value
   */
  getConfig<T = any>(path: string): T {
    return this.config.get<T>(path);
  }

  /**
   * Update configuration
   */
  setConfig(path: string, value: any): void {
    this.config.set(path, value);
  }

  // Private methods

  private setupEventListeners(): void {
    // Listen for agent events
    this.agentRuntime.on('agent.started', (event: any) => {
      this.emit('agent.started', event);
    });

    this.agentRuntime.on('agent.completed', (event: any) => {
      this.emit('agent.completed', event);
    });

    this.agentRuntime.on('agent.failed', (event: any) => {
      this.emit('agent.failed', event);
    });

    // Listen for workflow events
    this.orchestrationEngine.on('workflow.started', (event: any) => {
      this.emit('workflow.started', event);
    });

    this.orchestrationEngine.on('workflow.completed', (event: any) => {
      this.emit('workflow.completed', event);
    });

    this.orchestrationEngine.on('workflow.failed', (event: any) => {
      this.emit('workflow.failed', event);
    });

    // Listen for error events
    this.errorManager.on('error', (error: any) => {
      this.emit('error', error);
    });
  }

  private async cleanup(): Promise<void> {
    try {
      // Clear collections
      this.agents.clear();
      this.workflows.clear();
      this.executions.clear();

      // Cleanup components
      await this.errorManager.cleanup();

      this.isInitialized = false;
    } catch (error) {
      this.logger.error('Error during cleanup', error);
      throw error;
    }
  }

  private ensureStarted(): void {
    if (!this.isStarted) {
      throw new Error('OpenConductor is not started. Call start() first.');
    }
  }

  // Helper method for generating event IDs (reserved for future use)
  private _generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters for component access

  get version(): string {
    return this.config.get('core.version');
  }

  get instanceId(): string {
    return this.config.get('core.instanceId');
  }

  get uptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }

  get isHealthy(): boolean {
    return this.isStarted && this.isInitialized;
  }

  // Component accessors (read-only)

  get events(): EventBus {
    return this.eventBus;
  }

  get tools(): ToolRegistry {
    return this.toolRegistry;
  }

  get plugins(): PluginManager {
    return this.pluginManager;
  }

  get orchestration(): OrchestrationEngine {
    return this.orchestrationEngine;
  }
}

export default OpenConductor;