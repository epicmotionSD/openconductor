/**
 * Base Agent Implementation
 *
 * Foundation class for all OpenConductor agents
 */
import { Agent, AgentCapability, AgentType, AgentConfig, AgentStatus, AgentMetrics } from '../types/agent';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';
export declare abstract class BaseAgent implements Agent {
    readonly id: string;
    readonly name: string;
    readonly type: AgentType;
    readonly version: string;
    readonly description?: string;
    readonly capabilities: AgentCapability[];
    readonly config: AgentConfig;
    readonly events: EventEmitter;
    protected logger: Logger;
    status: AgentStatus;
    metrics: AgentMetrics;
    private state;
    constructor(config: AgentConfig, logger: Logger);
    abstract execute(input: any, context?: Record<string, any>): Promise<any>;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getStatus(): AgentStatus;
    getState<T = any>(): Promise<T | null>;
    setState<T = any>(state: T): Promise<void>;
    clearState(): Promise<void>;
    getTool(_name: string): any;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void;
}
//# sourceMappingURL=base-agent.d.ts.map