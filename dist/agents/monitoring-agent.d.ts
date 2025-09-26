/**
 * Monitoring Agent Implementation
 *
 * Sentinel-inspired agent for system monitoring and alerting
 */
import { BaseAgent } from './base-agent';
import { AgentConfig } from '../types/agent';
import { Logger } from '../utils/logger';
export declare class MonitoringAgent extends BaseAgent {
    constructor(config: AgentConfig, logger: Logger);
    execute(input: any, context?: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=monitoring-agent.d.ts.map