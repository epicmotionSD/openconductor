"use strict";
/**
 * OpenConductor API Client
 *
 * HTTP REST API client for OpenConductor services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenConductorAPIClient = void 0;
class OpenConductorAPIClient {
    _config;
    logger;
    constructor(config, logger) {
        this._config = config;
        this.logger = logger;
    }
    async get(endpoint, params) {
        this.logger.debug(`API GET: ${endpoint}`, params);
        // Stub implementation
        return { status: 'success', data: {} };
    }
    async post(endpoint, data) {
        this.logger.debug(`API POST: ${endpoint}`, data);
        // Stub implementation
        return { status: 'success', data: {} };
    }
    async put(endpoint, data) {
        this.logger.debug(`API PUT: ${endpoint}`, data);
        // Stub implementation
        return { status: 'success', data: {} };
    }
    async delete(endpoint) {
        this.logger.debug(`API DELETE: ${endpoint}`);
        // Stub implementation
        return { status: 'success' };
    }
}
exports.OpenConductorAPIClient = OpenConductorAPIClient;
//# sourceMappingURL=client.js.map