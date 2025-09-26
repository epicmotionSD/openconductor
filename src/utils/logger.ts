/**
 * Logger Implementation
 * 
 * Structured logging for OpenConductor
 */

import { LoggingConfig } from '../types/config';

export class Logger {
  constructor(private config: LoggingConfig) {}

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.log('info', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, meta);
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      this.log('error', message, error);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: string, message: string, meta?: any): void {
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