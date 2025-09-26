"use strict";
/**
 * SportIntel AI Agent Extensions
 *
 * Trinity AI agents specialized for sports analytics, DFS optimization,
 * and real-time sports data processing on the OpenConductor platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SportIntelAgentFactory = exports.SportsSageAgent = exports.SportsSentinelAgent = exports.SportsOracleAgent = void 0;
var sports_oracle_agent_1 = require("./sports-oracle-agent");
Object.defineProperty(exports, "SportsOracleAgent", { enumerable: true, get: function () { return sports_oracle_agent_1.SportsOracleAgent; } });
var sports_sentinel_agent_1 = require("./sports-sentinel-agent");
Object.defineProperty(exports, "SportsSentinelAgent", { enumerable: true, get: function () { return sports_sentinel_agent_1.SportsSentinelAgent; } });
var sports_sage_agent_1 = require("./sports-sage-agent");
Object.defineProperty(exports, "SportsSageAgent", { enumerable: true, get: function () { return sports_sage_agent_1.SportsSageAgent; } });
/**
 * SportIntel Agent Factory
 *
 * Factory function to create and configure SportIntel agents
 * with proper dependencies and shared configuration.
 */
class SportIntelAgentFactory {
    static createSportsOracle(eventBus, logger) {
        return new SportsOracleAgent(eventBus, logger);
    }
    static createSportsSentinel(eventBus, logger) {
        return new SportsSentinelAgent(eventBus, logger);
    }
    static createSportsSage(eventBus, logger) {
        return new SportsSageAgent(eventBus, logger);
    }
    /**
     * Create complete Trinity AI agent suite for SportIntel
     */
    static createTrinityAgents(eventBus, logger) {
        return {
            oracle: new SportsOracleAgent(eventBus, logger),
            sentinel: new SportsSentinelAgent(eventBus, logger),
            sage: new SportsSageAgent(eventBus, logger)
        };
    }
}
exports.SportIntelAgentFactory = SportIntelAgentFactory;
//# sourceMappingURL=index.js.map