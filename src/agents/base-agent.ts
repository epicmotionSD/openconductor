/**
 * Base Agent Implementation
 * 
 * Foundation class for all OpenConductor agents
 */

import { Agent, AgentCapability, AgentType, AgentConfig, AgentStatus, AgentMetrics } from '../types/agent';
import { Logger } from '../utils/logger';
import { EventEmitter } from 'events';

export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: AgentType;
  public readonly version: string;
  public readonly description?: string;
  public readonly capabilities: AgentCapability[];
  public readonly config: AgentConfig;
  public readonly events: EventEmitter = new EventEmitter();
  
  protected logger: Logger;
  public status: AgentStatus = 'idle';
  public metrics: AgentMetrics = {
    executionCount: 0,
    successRate: 0,
    averageExecutionTime: 0,
    lastExecuted: new Date(),
    lastExecutionTime: new Date(),
    errorCount: 0,
    uptime: 0,
    memoryUsage: process.memoryUsage().heapUsed,
    cpuUsage: 0
  };

  // State management
  private state: any = null;

  constructor(config: AgentConfig, logger: Logger) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.version = config.version || '1.0.0';
    this.description = config.description;
    this.capabilities = config.capabilities || {
      supportsStreaming: false,
      supportsBatching: false,
      supportsCallback: false,
      maxConcurrency: 1,
      inputTypes: ['text'],
      outputTypes: ['text']
    };
    this.config = config;
    this.logger = logger;
  }

  abstract execute(input: any, context?: Record<string, any>): Promise<any>;

  async initialize(): Promise<void> {
    this.logger.info(`Initializing agent: ${this.id}`);
    // Subclasses can override
    this.status = 'running';
  }

  async shutdown(): Promise<void> {
    this.logger.info(`Shutting down agent: ${this.id}`);
    // Subclasses can override
    this.status = 'stopped';
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  // Required Agent interface methods
  public async getState<T = any>(): Promise<T | null> {
    return this.state as T | null;
  }

  public async setState<T = any>(state: T): Promise<void> {
    this.state = state;
  }

  public async clearState(): Promise<void> {
    this.state = null;
  }

  public getTool(_name: string): any {
    // Default implementation - can be overridden
    return null;
  }

  public log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void {
    if (typeof this.logger[level as keyof Logger] === 'function') {
      (this.logger[level as keyof Logger] as Function)(message, meta);
    }
  }
}