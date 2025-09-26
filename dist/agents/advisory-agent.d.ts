/**
 * Advisory Agent Implementation
 *
 * Sage-inspired agent for decision support and recommendations
 */
import { BaseAgent } from './base-agent';
import { AgentConfig } from '../types/agent';
import { Logger } from '../utils/logger';
export declare class AdvisoryAgent extends BaseAgent {
    constructor(config: AgentConfig, logger: Logger);
    execute(input: any, context?: Record<string, any>): Promise<any>;
}
//# sourceMappingURL=advisory-agent.d.ts.map