"use strict";
/**
 * Configuration Manager
 *
 * Handles configuration loading, validation, and runtime updates
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const config_1 = require("../types/config");
class ConfigManager {
    config;
    constructor(userConfig) {
        this.config = this.mergeConfigs(config_1.DEFAULT_CONFIG, userConfig || {});
    }
    get(path) {
        return this.getNestedValue(this.config, path);
    }
    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }
    has(path) {
        try {
            const value = this.getNestedValue(this.config, path);
            return value !== undefined;
        }
        catch {
            return false;
        }
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    mergeConfigs(base, override) {
        const result = { ...base };
        for (const key in override) {
            if (typeof override[key] === 'object' && !Array.isArray(override[key]) && override[key] !== null) {
                result[key] = this.mergeConfigs(base[key] || {}, override[key]);
            }
            else {
                result[key] = override[key];
            }
        }
        return result;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map