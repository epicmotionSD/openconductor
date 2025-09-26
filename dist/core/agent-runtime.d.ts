/**
 * AgentRuntime Implementation
 *
 * Sandboxed runtime environment for executing agents
 */
import { Agent, AgentStatus } from '../types/agent';
import { EventBus } from '../types/events';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
export declare class AgentRuntime {
    private agents;
    private runtimes;
    private logger;
    private errorManager;
    private eventBus;
    constructor(logger: Logger, errorManager: ErrorManager, eventBus: EventBus);
    /**
     * Register a new agent with the runtime
     */
    registerAgent(agent: Agent): Promise<void>;
    /**
     * Unregister an agent from the runtime
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Start an agent
     */
    startAgent(agentId: string): Promise<void>;
    /**
     * Stop an agent
     */
    stopAgent(agentId: string): Promise<void>;
    /**
     * Execute a task on an agent
     */
    executeTask(agentId: string, task: any, context?: Record<string, any>): Promise<any>;
    /**
     * Get agent status and metrics
     */
    getAgentStatus(agentId: string): AgentStatus | null;
    /**
     * Get all registered agents
     */
    getRegisteredAgents(): Agent[];
    /**
     * Get health status of the runtime
     */
    getHealthStatus(): any;
    /**
     * Event listener method for EventBus compatibility
     */
    on(event: string, callback: (...args: any[]) => void): void;
    /**
     * Cleanup method
     */
    cleanup(): Promise<void>;
    private startTime;
    private validateAgent;
    private createRuntime;
    private createEnvironment;
    private createSecurityPolicy;
    private initializeAgent;
    private executeInRuntime;
    private destroyRuntime;
    private heartbeatIntervals;
    private startHeartbeat;
    private stopHeartbeat;
}
//# sourceMappingURL=agent-runtime.d.ts.map