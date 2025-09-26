/**
 * OpenConductor Agent Type Definitions
 *
 * Core agent types inspired by Trinity AI patterns, designed for the
 * universal orchestration of enterprise AI agents.
 *
 * "Orchestrating the Future of Enterprise AI"
 * - Oracle: Prediction and forecasting agents
 * - Sentinel: Monitoring and alerting agents
 * - Sage: Advisory and recommendation agents
 */
import { EventEmitter } from 'events';
export type AgentType = 'prediction' | 'monitoring' | 'advisory' | 'workflow' | 'data' | 'notification' | 'custom';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'stopped' | 'initializing';
export type CapabilityType = 'prediction' | 'monitoring' | 'data-analysis' | 'notification' | 'api-integration' | 'workflow-automation' | 'nlp' | 'ml-inference' | 'document-processing' | 'real-time-processing' | 'orchestration' | 'compliance' | 'security';
export interface AgentCapability {
    type: CapabilityType;
    name: string;
    description: string;
    version: string;
    parameters?: Record<string, any>;
}
export interface AgentTool {
    id: string;
    name: string;
    type: string;
    version: string;
    description: string;
    config: Record<string, any>;
    endpoints?: {
        [key: string]: {
            url: string;
            method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            headers?: Record<string, string>;
        };
    };
}
export interface AgentMemory {
    type: 'persistent' | 'ephemeral' | 'hybrid';
    store: 'redis' | 'postgresql' | 'memory' | 'file';
    ttl?: number;
    maxSize?: number;
    encryption?: boolean;
    config?: Record<string, any>;
}
export interface AgentMetrics {
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
    lastExecuted?: Date;
    lastExecutionTime?: Date;
    errorCount: number;
    uptime: number;
    memoryUsage?: number;
    cpuUsage?: number;
    customMetrics?: Record<string, number | string>;
}
export interface AgentConfig {
    id: string;
    name: string;
    version: string;
    type: AgentType;
    description?: string;
    author?: string;
    license?: string;
    capabilities: AgentCapability[];
    tools: AgentTool[];
    memory: AgentMemory;
    compliance?: {
        dataRetention?: number;
        auditRequired?: boolean;
        encryptionRequired?: boolean;
        regions?: string[];
    };
    concurrency?: number;
    timeout?: number;
    retryPolicy?: {
        maxRetries: number;
        backoffStrategy: 'linear' | 'exponential';
        initialDelay: number;
    };
    resources?: {
        cpu?: string;
        memory?: string;
        storage?: string;
    };
    permissions?: string[];
    secrets?: string[];
    tags?: string[];
    category?: string;
    dependencies?: string[];
    environment?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
export interface RuntimeEnvironment {
    runtime: string;
    version: string;
    resources: {
        maxMemory: number;
        maxCpu: number;
        timeout: number;
    };
    variables: Record<string, string>;
    allowedModules: string[];
}
export interface SecurityPolicy {
    sandboxed: boolean;
    allowNetworkAccess: boolean;
    allowFileSystemAccess: boolean;
    allowedDomains: string[];
    allowedPaths: string[];
}
export interface AgentInput<T = any> {
    id: string;
    data: T;
    context?: Record<string, any>;
    metadata?: {
        source?: string;
        timestamp?: Date;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        correlationId?: string;
        sovereignty?: {
            region?: string;
            dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
        };
    };
}
export interface AgentOutput<T = any> {
    id: string;
    agentId: string;
    data: T;
    status: 'success' | 'error' | 'partial';
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metrics?: {
        executionTime: number;
        memoryUsed?: number;
        tokensProcessed?: number;
    };
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface AgentLifecycleMethods {
    initialize?(): Promise<void>;
    start?(): Promise<void>;
    stop?(): Promise<void>;
    execute<TInput = any, TOutput = any>(input: TInput, context?: Record<string, any>): Promise<TOutput>;
    cleanup?(): Promise<void>;
    healthCheck?(): Promise<boolean>;
}
/**
 * Universal Agent Interface
 *
 * The foundational interface that enables OpenConductor to orchestrate
 * any AI agent, from any vendor, seamlessly.
 */
export interface Agent extends AgentLifecycleMethods {
    readonly id: string;
    readonly name: string;
    readonly type: AgentType;
    readonly version: string;
    readonly config: AgentConfig;
    status: AgentStatus;
    metrics: AgentMetrics;
    events: EventEmitter;
    getState<T = any>(): Promise<T | null>;
    setState<T = any>(state: T): Promise<void>;
    clearState(): Promise<void>;
    getTool(name: string): AgentTool | null;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void;
}
/**
 * Trinity AI Pattern Interfaces
 *
 * Specialized agent patterns that provide the foundation for
 * enterprise AI orchestration
 */
/**
 * Oracle Pattern - Prediction and Forecasting Agents
 * "The wisdom to see what's coming"
 */
export interface PredictionAgent extends Agent {
    type: 'prediction';
    predict<TInput = any, TPrediction = any>(input: TInput, options?: {
        confidence?: number;
        timeHorizon?: number;
        model?: string;
    }): Promise<{
        prediction: TPrediction;
        confidence: number;
        factors?: string[];
        metadata?: Record<string, any>;
    }>;
}
/**
 * Sentinel Pattern - Monitoring and Alerting Agents
 * "The vigilance to know what's happening"
 */
export interface MonitoringAgent extends Agent {
    type: 'monitoring';
    monitor<TData = any>(data: TData, thresholds?: Record<string, any>): Promise<{
        status: 'normal' | 'warning' | 'critical';
        alerts?: Array<{
            level: 'info' | 'warning' | 'error' | 'critical';
            message: string;
            timestamp: Date;
            data?: any;
        }>;
        metrics?: Record<string, number>;
    }>;
    setThreshold(metric: string, threshold: any): void;
    getThresholds(): Record<string, any>;
}
/**
 * Sage Pattern - Advisory and Recommendation Agents
 * "The intelligence to know what to do"
 */
export interface AdvisoryAgent extends Agent {
    type: 'advisory';
    advise<TContext = any, TRecommendation = any>(context: TContext, options?: {
        maxRecommendations?: number;
        confidenceThreshold?: number;
        categories?: string[];
    }): Promise<{
        recommendations: Array<{
            action: string;
            description: string;
            confidence: number;
            impact: 'low' | 'medium' | 'high';
            category?: string;
            metadata?: Record<string, any>;
        }>;
        reasoning?: string;
        metadata?: Record<string, any>;
    }>;
}
/**
 * Agent Registry Entry
 *
 * Metadata for agents available in the OpenConductor ecosystem
 */
export interface AgentRegistryEntry {
    id: string;
    name: string;
    type: AgentType;
    version: string;
    author: string;
    description: string;
    category: string;
    tags: string[];
    downloads: number;
    rating: number;
    verified: boolean;
    license: string;
    repository?: string;
    documentation?: string;
    enterpriseReady?: boolean;
    complianceLevel?: 'basic' | 'standard' | 'enterprise';
    dependencies: string[];
    requirements: {
        node?: string;
        memory?: string;
        cpu?: string;
    };
    installCommand: string;
    configSchema?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Agent Deployment Configuration
 *
 * Enterprise-grade deployment settings for sovereign control
 */
export interface AgentDeployment {
    id: string;
    agentId: string;
    environment: 'development' | 'staging' | 'production';
    deployment: {
        type: 'cloud' | 'on-premises' | 'hybrid';
        region?: string;
        availability: 'single-zone' | 'multi-zone' | 'multi-region';
        scaling: {
            min: number;
            max: number;
            targetCPU?: number;
            targetMemory?: number;
        };
    };
    security: {
        encryption: boolean;
        networkPolicy?: string;
        accessControl?: string[];
        auditLevel: 'none' | 'basic' | 'detailed' | 'comprehensive';
    };
    monitoring: {
        enabled: boolean;
        metricsRetention?: number;
        alerting?: {
            channels: string[];
            thresholds: Record<string, any>;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=agent.d.ts.map