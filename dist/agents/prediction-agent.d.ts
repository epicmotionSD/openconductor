/**
 * Prediction Agent Implementation
 *
 * Oracle-inspired agent for predictive analysis and forecasting
 */
import { BaseAgent } from './base-agent';
import { AgentConfig } from '../types/agent';
import { Logger } from '../utils/logger';
export declare class PredictionAgent extends BaseAgent {
    constructor(config: AgentConfig, logger: Logger);
    execute(input: any, context?: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=prediction-agent.d.ts.map