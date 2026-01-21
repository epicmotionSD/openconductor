// Board of Directors - Agent Registry
// Exports all agent classes for the Revenue Sniper DevOps system

export { BaseAgent, AgentConfig, TaskHandler } from './base-agent';
export { CEOAgent } from './ceo-agent';
export { CTOAgent } from './cto-agent';
export { CMOAgent } from './cmo-agent';
export { CFOAgent } from './cfo-agent';

// Agent types
export type AgentType = 'ceo' | 'cto' | 'cmo' | 'cfo';

// Agent factory
import { AgentService } from '../services/agent-service';
import { CEOAgent } from './ceo-agent';
import { CTOAgent } from './cto-agent';
import { CMOAgent } from './cmo-agent';
import { CFOAgent } from './cfo-agent';
import { BaseAgent } from './base-agent';

export function createAgent(type: AgentType, agentService: AgentService): BaseAgent {
  switch (type) {
    case 'ceo':
      return new CEOAgent(agentService);
    case 'cto':
      return new CTOAgent(agentService);
    case 'cmo':
      return new CMOAgent(agentService);
    case 'cfo':
      return new CFOAgent(agentService);
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

// Board of Directors - All executive agents
export const BOARD_MEMBERS: AgentType[] = ['ceo', 'cto', 'cmo', 'cfo'];
