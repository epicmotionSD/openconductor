"use strict";
/**
 * Base Agent Implementation
 *
 * Foundation class for all OpenConductor agents
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const events_1 = require("events");
class BaseAgent {
    id;
    name;
    type;
    version;
    description;
    capabilities;
    config;
    events = new events_1.EventEmitter();
    logger;
    status = 'idle';
    metrics = {
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
    state = null;
    constructor(config, logger) {
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
    async initialize() {
        this.logger.info(`Initializing agent: ${this.id}`);
        // Subclasses can override
        this.status = 'running';
    }
    async shutdown() {
        this.logger.info(`Shutting down agent: ${this.id}`);
        // Subclasses can override
        this.status = 'stopped';
    }
    getStatus() {
        return this.status;
    }
    // Required Agent interface methods
    async getState() {
        return this.state;
    }
    async setState(state) {
        this.state = state;
    }
    async clearState() {
        this.state = null;
    }
    getTool(_name) {
        // Default implementation - can be overridden
        return null;
    }
    log(level, message, meta) {
        if (typeof this.logger[level] === 'function') {
            this.logger[level](message, meta);
        }
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map