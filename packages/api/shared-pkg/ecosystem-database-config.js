"use strict";
/**
 * Ecosystem Database Configuration
 * Shared configuration for tracking across all Sonnier Ventures products
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultEcosystemDbConfig = exports.EcosystemEventType = exports.UserJourneyStage = exports.EcosystemProduct = void 0;
// Ecosystem products enumeration
var EcosystemProduct;
(function (EcosystemProduct) {
    EcosystemProduct["OPENCONDUCTOR"] = "openconductor";
    EcosystemProduct["FLEXABRAIN"] = "flexabrain";
    EcosystemProduct["FLEXASPORTS"] = "flexasports";
    EcosystemProduct["SPORTINTEL"] = "sportintel";
    EcosystemProduct["X3O_TRINITY"] = "x3o_trinity";
})(EcosystemProduct || (exports.EcosystemProduct = EcosystemProduct = {}));
// User journey stages
var UserJourneyStage;
(function (UserJourneyStage) {
    UserJourneyStage["DISCOVERY"] = "discovery";
    UserJourneyStage["INSTALLATION"] = "installation";
    UserJourneyStage["ACTIVATION"] = "activation";
    UserJourneyStage["ENGAGEMENT"] = "engagement";
    UserJourneyStage["RETENTION"] = "retention";
    UserJourneyStage["EXPANSION"] = "expansion";
})(UserJourneyStage || (exports.UserJourneyStage = UserJourneyStage = {}));
// Event types for ecosystem tracking
var EcosystemEventType;
(function (EcosystemEventType) {
    EcosystemEventType["SERVER_DISCOVERED"] = "server_discovered";
    EcosystemEventType["SERVER_INSTALLED"] = "server_installed";
    EcosystemEventType["CLI_COMMAND_RUN"] = "cli_command_run";
    EcosystemEventType["API_REQUEST"] = "api_request";
    EcosystemEventType["AGENT_CREATED"] = "agent_created";
    EcosystemEventType["AGENT_EXECUTED"] = "agent_executed";
    EcosystemEventType["ORACLE_PREDICTION"] = "oracle_prediction";
    EcosystemEventType["SENTINEL_ALERT"] = "sentinel_alert";
    EcosystemEventType["SAGE_ANALYSIS"] = "sage_analysis";
    EcosystemEventType["DFS_LINEUP_CREATED"] = "dfs_lineup_created";
    EcosystemEventType["PLAYER_ANALYZED"] = "player_analyzed";
    EcosystemEventType["CONTEST_ENTERED"] = "contest_entered";
    EcosystemEventType["PRODUCT_DISCOVERED"] = "product_discovered";
    EcosystemEventType["CROSS_PRODUCT_NAVIGATION"] = "cross_product_navigation";
    EcosystemEventType["ECOSYSTEM_SIGNUP"] = "ecosystem_signup";
})(EcosystemEventType || (exports.EcosystemEventType = EcosystemEventType = {}));
exports.defaultEcosystemDbConfig = {
    primaryUrl: process.env.ECOSYSTEM_DATABASE_URL || process.env.SUPABASE_DATABASE_URL || '',
    readReplicaUrl: process.env.ECOSYSTEM_READ_REPLICA_URL,
    analyticsUrl: process.env.ECOSYSTEM_ANALYTICS_URL,
    cacheUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    poolSize: 20,
    connectionTimeout: 5000,
    ssl: process.env.NODE_ENV === 'production'
};
