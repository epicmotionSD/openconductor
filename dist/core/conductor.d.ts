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
import { OpenConductorConfig, Agent, WorkflowDefinition, WorkflowExecution, Tool, OrchestrationEngine, EventBus } from '../types';
import { ToolRegistry } from './tool-registry';
import { PluginManager } from './plugin-manager';
/**
 * OpenConductor Main Class
 *
 * The primary interface for the OpenConductor platform.
 * This class orchestrates all components and provides the main API.
 */
export declare class OpenConductor extends EventEmitter {
    private readonly config;
    private readonly logger;
    private readonly errorManager;
    private readonly agentRuntime;
    private readonly eventBus;
    private readonly toolRegistry;
    private readonly pluginManager;
    private readonly orchestrationEngine;
    private isInitialized;
    private isStarted;
    private startTime?;
    private readonly agents;
    private readonly workflows;
    private readonly executions;
    constructor(userConfig?: Partial<OpenConductorConfig>);
    /**
     * Initialize the OpenConductor platform
     */
    initialize(): Promise<void>;
    /**
     * Start the OpenConductor platform
     */
    start(): Promise<void>;
    /**
     * Stop the OpenConductor platform
     */
    stop(): Promise<void>;
    /**
     * Gracefully shutdown the OpenConductor platform
     */
    shutdown(): Promise<void>;
    /**
     * Register an agent with the platform
     */
    registerAgent(agent: Agent): Promise<void>;
    /**
     * Unregister an agent from the platform
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Get an agent by ID
     */
    getAgent(agentId: string): Agent | null;
    /**
     * List all registered agents
     */
    listAgents(): Agent[];
    /**
     * Execute an agent
     */
    executeAgent(agentId: string, input: any): Promise<any>;
    /**
     * Create a new workflow
     */
    createWorkflow(definition: WorkflowDefinition): Promise<void>;
    /**
     * Execute a workflow
     */
    executeWorkflow(workflowId: string, input?: any): Promise<WorkflowExecution>;
    /**
     * Register a tool
     */
    registerTool(tool: Tool): Promise<void>;
    /**
     * Install a plugin
     */
    installPlugin(pluginSource: any): Promise<void>;
    /**
     * Get system health status
     */
    getHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: Date;
        components: Record<string, any>;
        metrics: {
            activeAgents: number;
            activeWorkflows: number;
            activeExecutions: number;
            uptime: number;
        };
    }>;
    /**
     * Get system metrics
     */
    getMetrics(): Promise<{
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
    }>;
    /**
     * Get configuration value
     */
    getConfig<T = any>(path: string): T;
    /**
     * Update configuration
     */
    setConfig(path: string, value: any): void;
    private setupEventListeners;
    private cleanup;
    private ensureStarted;
    private _generateEventId;
    get version(): string;
    get instanceId(): string;
    get uptime(): number;
    get isHealthy(): boolean;
    get events(): EventBus;
    get tools(): ToolRegistry;
    get plugins(): PluginManager;
    get orchestration(): OrchestrationEngine;
}
export default OpenConductor;
//# sourceMappingURL=conductor.d.ts.map