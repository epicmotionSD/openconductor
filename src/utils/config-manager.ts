/**
 * Configuration Manager
 * 
 * Handles configuration loading, validation, and runtime updates
 */

import { OpenConductorConfig, DEFAULT_CONFIG } from '../types/config';

export class ConfigManager {
  private config: OpenConductorConfig;

  constructor(userConfig?: Partial<OpenConductorConfig>) {
    this.config = this.mergeConfigs(DEFAULT_CONFIG, userConfig || {});
  }

  get<T = any>(path: string): T {
    return this.getNestedValue(this.config, path);
  }

  set(path: string, value: any): void {
    this.setNestedValue(this.config, path, value);
  }

  has(path: string): boolean {
    try {
      const value = this.getNestedValue(this.config, path);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private mergeConfigs(base: any, override: any): any {
    const result = { ...base };
    for (const key in override) {
      if (typeof override[key] === 'object' && !Array.isArray(override[key]) && override[key] !== null) {
        result[key] = this.mergeConfigs(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  getAll(): OpenConductorConfig {
    return this.config;
  }
}