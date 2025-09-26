/**
 * Logger Implementation
 *
 * Structured logging for OpenConductor
 */
import { LoggingConfig } from '../types/config';
export declare class Logger {
    private config;
    constructor(config: LoggingConfig);
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: any): void;
    private shouldLog;
    private log;
}
//# sourceMappingURL=logger.d.ts.map