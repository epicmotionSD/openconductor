/**
 * Trinity HubSpot Orchestrator - Real-time Business Intelligence Workflows
 * Coordinates Oracle, Sentinel, and Sage agents for comprehensive business intelligence
 */
import { EventBus } from '../core/event-bus';
import { OrchestrationEngine } from '../orchestration/engine';
import { HubSpotDataAdapter } from '../adapters/hubspot-data-adapter';
interface WorkflowConfig {
    id: string;
    name: string;
    description: string;
    schedule?: {
        type: 'interval' | 'cron' | 'event_driven';
        value: string | number;
    };
    agents: string[];
    parameters: Record<string, any>;
    timeout: number;
    retries: number;
}
interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    steps: WorkflowStep[];
    results: Record<string, any>;
    errors: string[];
}
interface WorkflowStep {
    id: string;
    name: string;
    agentId: string;
    capability: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    result?: any;
    error?: string;
    dependencies: string[];
}
export declare class TrinityHubSpotOrchestrator {
    private eventBus;
    private orchestrationEngine;
    private oracleAgent;
    private sentinelAgent;
    private sageAgent;
    private hubspotAdapter;
    private workflows;
    private executions;
    private scheduledWorkflows;
    constructor(eventBus: EventBus, orchestrationEngine: OrchestrationEngine, hubspotAdapter: HubSpotDataAdapter);
    /**
     * Setup event handlers for real-time orchestration
     */
    private setupEventHandlers;
    /**
     * Initialize default business intelligence workflows
     */
    private initializeDefaultWorkflows;
    /**
     * Register a new workflow
     */
    registerWorkflow(config: WorkflowConfig): void;
    /**
     * Execute a specific workflow
     */
    executeWorkflow(workflowId: string, parameters?: Record<string, any>): Promise<WorkflowExecution>;
    /**
     * Execute Daily Comprehensive Business Intelligence workflow
     */
    private executeDailyComprehensiveBI;
    /**
     * Execute Pipeline Monitoring workflow
     */
    private executePipelineMonitoring;
    /**
     * Execute Weekly Strategic Planning workflow
     */
    private executeWeeklyStrategicPlanning;
    /**
     * Execute Event-Driven Forecast workflow
     */
    private executeEventDrivenForecast;
    /**
     * Execute generic workflow for custom workflows
     */
    private executeGenericWorkflow;
    /**
     * Trigger workflows based on data changes
     */
    private triggerDataDrivenWorkflows;
    /**
     * Trigger emergency workflow for critical alerts
     */
    private triggerEmergencyWorkflow;
    /**
     * Helper methods
     */
    private createWorkflowSteps;
    private scheduleWorkflow;
    private areDependenciesMet;
    private getAgentById;
    private shouldTriggerWorkflow;
    private generateConsolidatedInsights;
    private calculateOverallConfidence;
    private getDataFreshness;
    private generateStrategicInsights;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export {};
//# sourceMappingURL=trinity-hubspot-orchestrator.d.ts.map