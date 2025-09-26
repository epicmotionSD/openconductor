"use strict";
/**
 * Logger Implementation
 *
 * Structured logging for OpenConductor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    config;
    constructor(config) {
        this.config = config;
    }
    debug(message, meta) {
        if (this.shouldLog('debug')) {
            this.log('debug', message, meta);
        }
    }
    info(message, meta) {
        if (this.shouldLog('info')) {
            this.log('info', message, meta);
        }
    }
    warn(message, meta) {
        if (this.shouldLog('warn')) {
            this.log('warn', message, meta);
        }
    }
    error(message, error) {
        if (this.shouldLog('error')) {
            this.log('error', message, error);
        }
    }
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error', 'silent'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    log(level, message, meta) {
        const logEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...this.config.metadata,
            ...(meta && { meta })
        };
        if (this.config.console.enabled) {
            console.log(JSON.stringify(logEntry));
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map