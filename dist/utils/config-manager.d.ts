/**
 * Configuration Manager
 *
 * Handles configuration loading, validation, and runtime updates
 */
import { OpenConductorConfig } from '../types/config';
export declare class ConfigManager {
    private config;
    constructor(userConfig?: Partial<OpenConductorConfig>);
    get<T = any>(path: string): T;
    set(path: string, value: any): void;
    has(path: string): boolean;
    private getNestedValue;
    private setNestedValue;
    private mergeConfigs;
}
//# sourceMappingURL=config-manager.d.ts.map