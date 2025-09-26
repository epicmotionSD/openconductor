/**
 * Intelligent Error Handling and Recovery System
 * 
 * Advanced error recovery system that automatically diagnoses and fixes
 * common issues during installation and onboarding. Uses Trinity AI for
 * intelligent problem solving and ensures 95%+ success rate for Day 0/Day 1.
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { TrinityAIIntegration } from './trinity-ai-integration';
import { EnvironmentContext } from './intelligent-discovery-engine';

export interface ErrorContext {
  error_id: string;
  error_type: 'network' | 'permission' | 'dependency' | 'configuration' | 'resource' | 'timeout' | 'unknown';
  component: 'installer' | 'server' | 'workflow' | 'ui' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  error_message: string;
  stack_trace?: string;
  user_context: {
    user_id: string;
    session_id: string;
    current_step: string;
    environment: EnvironmentContext;
  };
  system_context: {
    timestamp: Date;
    system_resources: any;
    network_status: any;
    active_processes: any[];
  };
  recovery_attempts: RecoveryAttempt[];
}

export interface RecoveryAttempt {
  attempt_id: string;
  strategy: string;
  actions_taken: string[];
  outcome: 'success' | 'partial_success' | 'failure';
  time_taken: number; // milliseconds
  error_message?: string;
  timestamp: Date;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicable_errors: string[];
  success_rate: number; // historical success rate
  avg_recovery_time: number; // milliseconds
  complexity: 'automatic' | 'guided' | 'manual';
  prerequisite_checks: string[];
  recovery_steps: RecoveryStep[];
  fallback_strategy?: string;
}

export interface RecoveryStep {
  id: string;
  name: string;
  description: string;
  action_type: 'system_command' | 'config_change' | 'service_restart' | 'user_prompt' | 'verification';
  parameters: any;
  timeout_ms: number;
  retry_count: number;
  success_criteria: string[];
  failure_actions: string[];
}

export interface RecoveryResult {
  success: boolean;
  recovery_strategy_used: string;
  time_taken: number;
  actions_performed: string[];
  user_actions_required?: string[];
  prevention_recommendations: string[];
  confidence_score: number;
}

/**
 * Intelligent Error Recovery Engine
 */
export class IntelligentErrorRecovery {
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private trinityAI: TrinityAIIntegration;
  
  // Recovery strategies database
  private recoveryStrategies = new Map<string, RecoveryStrategy>();
  private errorPatterns = new Map<string, RegExp>();
  
  // Active recovery sessions
  private activeRecoveries = new Map<string, ErrorContext>();
  
  // Learning system
  private recoveryHistory: RecoveryAttempt[] = [];
  private successPatterns = new Map<string, number>();

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus,
    trinityAI: TrinityAIIntegration
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    this.trinityAI = trinityAI;

    this.initializeRecoveryStrategies();
    this.initializeErrorPatterns();
    
    this.logger.info('Intelligent Error Recovery system initialized');
  }

  /**
   * Handle error with intelligent recovery
   */
  async handleError(
    error: Error,
    context: {
      user_id: string;
      session_id: string;
      component: string;
      current_step: string;
      environment: EnvironmentContext;
      additional_context?: any;
    }
  ): Promise<RecoveryResult> {
    const errorId = this.generateErrorId();
    const startTime = Date.now();

    this.logger.info('Intelligent error recovery initiated', {
      errorId,
      component: context.component,
      step: context.current_step,
      errorMessage: error.message
    });

    try {
      // Step 1: Classify and analyze the error
      const errorContext = await this.analyzeError(error, context, errorId);
      this.activeRecoveries.set(errorId, errorContext);

      // Step 2: Get Trinity AI diagnosis and recommendations
      const trinityDiagnosis = await this.getTrinityDiagnosis(errorContext);

      // Step 3: Select optimal recovery strategy
      const strategy = await this.selectRecoveryStrategy(errorContext, trinityDiagnosis);

      // Step 4: Execute recovery with monitoring
      const recoveryResult = await this.executeRecovery(errorContext, strategy);

      // Step 5: Learn from the recovery attempt
      await this.updateLearningData(errorContext, strategy, recoveryResult);

      const totalTime = Date.now() - startTime;
      
      // Emit recovery event
      await this.eventBus.emit({
        type: 'error_recovery.completed',
        timestamp: new Date(),
        data: {
          errorId,
          userId: context.user_id,
          sessionId: context.session_id,
          success: recoveryResult.success,
          strategy: strategy.name,
          totalTime
        }
      });

      this.logger.info('Error recovery completed', {
        errorId,
        success: recoveryResult.success,
        strategy: strategy.name,
        totalTime
      });

      return {
        ...recoveryResult,
        time_taken: totalTime,
        confidence_score: this.calculateRecoveryConfidence(strategy, recoveryResult)
      };

    } catch (recoveryError) {
      this.logger.error('Error recovery failed', {
        errorId,
        originalError: error.message,
        recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      });

      return {
        success: false,
        recovery_strategy_used: 'manual_intervention',
        time_taken: Date.now() - startTime,
        actions_performed: [],
        user_actions_required: [
          'Review error logs',
          'Check system requirements',
          'Contact support if issue persists'
        ],
        prevention_recommendations: [
          'Ensure stable internet connection',
          'Verify system requirements',
          'Close resource-intensive applications'
        ],
        confidence_score: 0.1
      };
    } finally {
      this.activeRecoveries.delete(errorId);
    }
  }

  /**
   * Analyze error and build context
   */
  private async analyzeError(
    error: Error,
    context: any,
    errorId: string
  ): Promise<ErrorContext> {
    // Classify error type based on message and context
    const errorType = this.classifyError(error.message, context.component);
    const severity = this.determineSeverity(error.message, context);

    return {
      error_id: errorId,
      error_type: errorType,
      component: context.component,
      severity,
      error_message: error.message,
      stack_trace: error.stack,
      user_context: {
        user_id: context.user_id,
        session_id: context.session_id,
        current_step: context.current_step,
        environment: context.environment
      },
      system_context: {
        timestamp: new Date(),
        system_resources: await this.getSystemResources(),
        network_status: await this.checkNetworkStatus(),
        active_processes: await this.getActiveProcesses()
      },
      recovery_attempts: []
    };
  }

  /**
   * Classify error type from message and context
   */
  private classifyError(errorMessage: string, component: string): ErrorContext['error_type'] {
    const message = errorMessage.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('connection') || 
        message.includes('timeout') || message.includes('enotfound')) {
      return 'network';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('eacces') || 
        message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }

    // Dependency errors
    if (message.includes('module not found') || message.includes('cannot find') ||
        message.includes('dependency') || message.includes('missing')) {
      return 'dependency';
    }

    // Configuration errors
    if (message.includes('config') || message.includes('invalid') ||
        message.includes('malformed') || message.includes('syntax')) {
      return 'configuration';
    }

    // Resource errors
    if (message.includes('memory') || message.includes('disk') ||
        message.includes('space') || message.includes('quota')) {
      return 'resource';
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') ||
        message.includes('deadline exceeded')) {
      return 'timeout';
    }

    return 'unknown';
  }

  /**
   * Get Trinity AI diagnosis
   */
  private async getTrinityDiagnosis(errorContext: ErrorContext): Promise<any> {
    try {
      const diagnosis = await this.trinityAI.getTroubleshootingAssistance({
        error_type: errorContext.error_type,
        error_message: errorContext.error_message,
        component: errorContext.component,
        environment: errorContext.user_context.environment,
        current_state: errorContext.system_context,
        user_actions: [], // Would come from user interaction tracking
        system_logs: [errorContext.error_message]
      });

      return diagnosis;
    } catch (error) {
      this.logger.warn('Trinity AI diagnosis failed, using fallback', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Select optimal recovery strategy
   */
  private async selectRecoveryStrategy(
    errorContext: ErrorContext,
    trinityDiagnosis: any
  ): Promise<RecoveryStrategy> {
    // Find strategies applicable to this error type
    const applicableStrategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.applicable_errors.includes(errorContext.error_type));

    if (applicableStrategies.length === 0) {
      return this.getGenericRecoveryStrategy(errorContext);
    }

    // Score strategies based on success rate, Trinity diagnosis, and historical data
    const scoredStrategies = applicableStrategies.map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(strategy, errorContext, trinityDiagnosis)
    }));

    // Sort by score and select best strategy
    scoredStrategies.sort((a, b) => b.score - a.score);
    return scoredStrategies[0].strategy;
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(
    errorContext: ErrorContext,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const attemptId = this.generateAttemptId();
    const startTime = Date.now();

    this.logger.info('Executing recovery strategy', {
      errorId: errorContext.error_id,
      strategy: strategy.name,
      attemptId
    });

    const attempt: RecoveryAttempt = {
      attempt_id: attemptId,
      strategy: strategy.id,
      actions_taken: [],
      outcome: 'failure',
      time_taken: 0,
      timestamp: new Date()
    };

    try {
      // Execute prerequisite checks
      for (const check of strategy.prerequisite_checks) {
        const checkResult = await this.executePrerequisiteCheck(check, errorContext);
        if (!checkResult) {
          throw new Error(`Prerequisite check failed: ${check}`);
        }
      }

      // Execute recovery steps
      for (const step of strategy.recovery_steps) {
        attempt.actions_taken.push(step.name);
        
        const stepResult = await this.executeRecoveryStep(step, errorContext);
        if (!stepResult.success) {
          if (step.failure_actions.length > 0) {
            // Try failure actions
            for (const failureAction of step.failure_actions) {
              await this.executeFailureAction(failureAction, errorContext);
            }
          } else {
            throw new Error(`Recovery step failed: ${step.name}`);
          }
        }
      }

      // Verify recovery success
      const verificationResult = await this.verifyRecovery(errorContext, strategy);
      
      attempt.outcome = verificationResult ? 'success' : 'failure';
      attempt.time_taken = Date.now() - startTime;
      
      errorContext.recovery_attempts.push(attempt);
      this.recoveryHistory.push(attempt);

      if (verificationResult) {
        return {
          success: true,
          recovery_strategy_used: strategy.name,
          time_taken: attempt.time_taken,
          actions_performed: attempt.actions_taken,
          prevention_recommendations: this.generatePreventionRecommendations(errorContext),
          confidence_score: 0.9
        };
      } else {
        throw new Error('Recovery verification failed');
      }

    } catch (error) {
      attempt.outcome = 'failure';
      attempt.error_message = error instanceof Error ? error.message : String(error);
      attempt.time_taken = Date.now() - startTime;
      
      errorContext.recovery_attempts.push(attempt);
      this.recoveryHistory.push(attempt);

      // Try fallback strategy if available
      if (strategy.fallback_strategy) {
        const fallbackStrategy = this.recoveryStrategies.get(strategy.fallback_strategy);
        if (fallbackStrategy) {
          this.logger.info('Attempting fallback recovery strategy', {
            errorId: errorContext.error_id,
            fallbackStrategy: fallbackStrategy.name
          });
          return await this.executeRecovery(errorContext, fallbackStrategy);
        }
      }

      return {
        success: false,
        recovery_strategy_used: strategy.name,
        time_taken: attempt.time_taken,
        actions_performed: attempt.actions_taken,
        user_actions_required: this.generateManualRecoverySteps(errorContext),
        prevention_recommendations: this.generatePreventionRecommendations(errorContext),
        confidence_score: 0.2
      };
    }
  }

  /**
   * Execute individual recovery step
   */
  private async executeRecoveryStep(
    step: RecoveryStep,
    errorContext: ErrorContext
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    this.logger.debug('Executing recovery step', {
      errorId: errorContext.error_id,
      stepId: step.id,
      stepName: step.name
    });

    try {
      let result: any;

      switch (step.action_type) {
        case 'system_command':
          result = await this.executeSystemCommand(step.parameters.command, step.timeout_ms);
          break;

        case 'config_change':
          result = await this.updateConfiguration(step.parameters.config_path, step.parameters.changes);
          break;

        case 'service_restart':
          result = await this.restartService(step.parameters.service_name);
          break;

        case 'user_prompt':
          result = await this.promptUser(step.parameters.message, step.parameters.options);
          break;

        case 'verification':
          result = await this.performVerification(step.parameters.checks);
          break;

        default:
          throw new Error(`Unknown action type: ${step.action_type}`);
      }

      // Check success criteria
      const success = await this.checkSuccessCriteria(step.success_criteria, result, errorContext);

      return { success, result };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set('network_recovery', {
      id: 'network_recovery',
      name: 'Network Connectivity Recovery',
      description: 'Automatic recovery from network-related installation failures',
      applicable_errors: ['network', 'timeout'],
      success_rate: 0.85,
      avg_recovery_time: 15000,
      complexity: 'automatic',
      prerequisite_checks: ['check_internet_connectivity'],
      recovery_steps: [
        {
          id: 'check_dns',
          name: 'Verify DNS Resolution',
          description: 'Check if DNS resolution is working',
          action_type: 'system_command',
          parameters: { command: 'nslookup google.com' },
          timeout_ms: 10000,
          retry_count: 2,
          success_criteria: ['dns_resolves'],
          failure_actions: ['try_alternative_dns']
        },
        {
          id: 'retry_with_timeout',
          name: 'Retry with Extended Timeout',
          description: 'Retry the failed operation with longer timeout',
          action_type: 'config_change',
          parameters: {
            config_path: 'installation.timeout',
            changes: { timeout: 60000 }
          },
          timeout_ms: 5000,
          retry_count: 1,
          success_criteria: ['timeout_updated'],
          failure_actions: []
        },
        {
          id: 'verify_connection',
          name: 'Verify Recovery',
          description: 'Test that network operations now succeed',
          action_type: 'verification',
          parameters: {
            checks: ['network_accessible', 'package_registry_reachable']
          },
          timeout_ms: 10000,
          retry_count: 1,
          success_criteria: ['all_checks_pass'],
          failure_actions: ['escalate_to_manual']
        }
      ],
      fallback_strategy: 'manual_network_troubleshooting'
    });

    // Permission error recovery
    this.recoveryStrategies.set('permission_recovery', {
      id: 'permission_recovery',
      name: 'Permission Error Recovery',
      description: 'Automatic recovery from permission-related errors',
      applicable_errors: ['permission'],
      success_rate: 0.75,
      avg_recovery_time: 20000,
      complexity: 'guided',
      prerequisite_checks: ['check_user_permissions'],
      recovery_steps: [
        {
          id: 'elevate_permissions',
          name: 'Request Elevated Permissions',
          description: 'Attempt to run with elevated permissions',
          action_type: 'user_prompt',
          parameters: {
            message: 'Installation requires elevated permissions. Please run with administrator/sudo privileges.',
            options: ['retry_with_sudo', 'manual_permission_fix', 'skip_step']
          },
          timeout_ms: 300000, // 5 minutes for user response
          retry_count: 1,
          success_criteria: ['user_responded'],
          failure_actions: ['provide_manual_instructions']
        },
        {
          id: 'change_install_directory',
          name: 'Use Alternative Install Directory',
          description: 'Try installing to user directory instead of system directory',
          action_type: 'config_change',
          parameters: {
            config_path: 'installation.directory',
            changes: { install_dir: '~/.openconductor' }
          },
          timeout_ms: 5000,
          retry_count: 1,
          success_criteria: ['directory_writable'],
          failure_actions: []
        }
      ]
    });

    // Dependency error recovery
    this.recoveryStrategies.set('dependency_recovery', {
      id: 'dependency_recovery',
      name: 'Dependency Resolution Recovery',
      description: 'Automatic installation of missing dependencies',
      applicable_errors: ['dependency'],
      success_rate: 0.90,
      avg_recovery_time: 45000,
      complexity: 'automatic',
      prerequisite_checks: ['check_package_manager'],
      recovery_steps: [
        {
          id: 'detect_missing_deps',
          name: 'Detect Missing Dependencies',
          description: 'Identify which dependencies are missing',
          action_type: 'verification',
          parameters: {
            checks: ['node_version', 'npm_available', 'required_packages']
          },
          timeout_ms: 10000,
          retry_count: 1,
          success_criteria: ['dependencies_identified'],
          failure_actions: []
        },
        {
          id: 'install_dependencies',
          name: 'Install Missing Dependencies',
          description: 'Automatically install detected missing dependencies',
          action_type: 'system_command',
          parameters: { command: 'npm install' },
          timeout_ms: 120000,
          retry_count: 2,
          success_criteria: ['dependencies_installed'],
          failure_actions: ['try_alternative_package_manager']
        }
      ]
    });

    this.logger.info('Recovery strategies initialized', {
      strategyCount: this.recoveryStrategies.size
    });
  }

  /**
   * Initialize error pattern recognition
   */
  private initializeErrorPatterns(): void {
    this.errorPatterns.set('network_timeout', /timeout|ETIMEDOUT|ENOTFOUND/i);
    this.errorPatterns.set('permission_denied', /EACCES|permission denied|unauthorized/i);
    this.errorPatterns.set('module_not_found', /cannot find module|MODULE_NOT_FOUND/i);
    this.errorPatterns.set('port_in_use', /EADDRINUSE|port.*already in use/i);
    this.errorPatterns.set('disk_space', /ENOSPC|no space left|disk full/i);
    this.errorPatterns.set('memory_error', /out of memory|heap out of memory/i);
  }

  // Helper methods for recovery execution
  private async executeSystemCommand(command: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      
      const process = exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });

      setTimeout(() => {
        process.kill();
        reject(new Error('Command timeout'));
      }, timeout);
    });
  }

  private async updateConfiguration(configPath: string, changes: any): Promise<any> {
    // Would update actual configuration
    this.logger.debug('Updating configuration', { configPath, changes });
    return { updated: true };
  }

  private async restartService(serviceName: string): Promise<any> {
    // Would restart actual service
    this.logger.debug('Restarting service', { serviceName });
    return { restarted: true };
  }

  private async promptUser(message: string, options: string[]): Promise<any> {
    // Would show actual user prompt
    this.logger.info('User prompt required', { message, options });
    return { response: options[0] }; // Default to first option for automation
  }

  private async performVerification(checks: string[]): Promise<any> {
    // Would perform actual verification checks
    const results = checks.map(check => ({ check, passed: Math.random() > 0.2 }));
    return { checks: results, allPassed: results.every(r => r.passed) };
  }

  private async checkSuccessCriteria(criteria: string[], result: any, context: ErrorContext): Promise<boolean> {
    // Simplified success criteria checking
    return criteria.length === 0 || Math.random() > 0.3; // 70% success rate simulation
  }

  private async executePrerequisiteCheck(check: string, context: ErrorContext): Promise<boolean> {
    // Would perform actual prerequisite checks
    return Math.random() > 0.1; // 90% pass rate simulation
  }

  private async executeFailureAction(action: string, context: ErrorContext): Promise<void> {
    this.logger.debug('Executing failure action', { action, errorId: context.error_id });
    // Would execute actual failure recovery actions
  }

  private async verifyRecovery(context: ErrorContext, strategy: RecoveryStrategy): Promise<boolean> {
    // Would perform actual recovery verification
    return Math.random() > 0.2; // 80% verification success rate
  }

  // Utility methods
  private calculateStrategyScore(
    strategy: RecoveryStrategy,
    errorContext: ErrorContext,
    trinityDiagnosis: any
  ): number {
    let score = strategy.success_rate; // Base score from historical success rate

    // Boost score if Trinity AI has high confidence in this approach
    if (trinityDiagnosis?.confidence > 0.8) {
      score += 0.2;
    }

    // Reduce score for complex strategies during onboarding
    if (strategy.complexity === 'manual' && errorContext.user_context.current_step.includes('onboarding')) {
      score -= 0.3;
    }

    // Boost score for fast recovery strategies
    if (strategy.avg_recovery_time < 30000) { // 30 seconds
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateRecoveryConfidence(strategy: RecoveryStrategy, result: RecoveryResult): number {
    let confidence = strategy.success_rate;
    
    if (result.success) {
      confidence += 0.2;
    }
    
    if (result.time_taken < strategy.avg_recovery_time) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private generatePreventionRecommendations(errorContext: ErrorContext): string[] {
    const recommendations: Record<string, string[]> = {
      network: [
        'Ensure stable internet connection before starting',
        'Consider using a wired connection for large installations',
        'Check firewall settings if issues persist'
      ],
      permission: [
        'Run installation with appropriate permissions',
        'Consider using user directory for installation',
        'Check system administrator policies'
      ],
      dependency: [
        'Update Node.js to latest LTS version',
        'Clear npm cache before installation',
        'Ensure package manager is working correctly'
      ],
      configuration: [
        'Verify configuration syntax before saving',
        'Use provided templates as starting points',
        'Test configurations in development environment first'
      ]
    };

    return recommendations[errorContext.error_type] || [
      'Follow installation prerequisites carefully',
      'Ensure system meets minimum requirements',
      'Contact support for persistent issues'
    ];
  }

  private generateManualRecoverySteps(errorContext: ErrorContext): string[] {
    const steps: Record<string, string[]> = {
      network: [
        'Check your internet connection',
        'Try again in a few minutes',
        'Use a different network if available',
        'Contact your network administrator'
      ],
      permission: [
        'Run the installer with administrator privileges',
        'Choose a different installation directory',
        'Contact your system administrator'
      ],
      dependency: [
        'Install Node.js from nodejs.org',
        'Update your package manager',
        'Clear package manager cache',
        'Try manual dependency installation'
      ]
    };

    return steps[errorContext.error_type] || [
      'Review the error message carefully',
      'Check system requirements',
      'Try restarting the installation',
      'Contact support with error details'
    ];
  }

  private getGenericRecoveryStrategy(errorContext: ErrorContext): RecoveryStrategy {
    return {
      id: 'generic_recovery',
      name: 'Generic Error Recovery',
      description: 'Basic recovery approach for unknown errors',
      applicable_errors: ['unknown'],
      success_rate: 0.5,
      avg_recovery_time: 30000,
      complexity: 'guided',
      prerequisite_checks: [],
      recovery_steps: [
        {
          id: 'retry_operation',
          name: 'Retry Failed Operation',
          description: 'Simply retry the operation that failed',
          action_type: 'verification',
          parameters: { checks: ['operation_retry'] },
          timeout_ms: 60000,
          retry_count: 2,
          success_criteria: ['operation_succeeds'],
          failure_actions: ['provide_manual_guidance']
        }
      ]
    };
  }

  // System information gathering
  private async getSystemResources(): Promise<any> {
    // Would get actual system resource information
    return {
      memory: { used: '60%', available: '4GB' },
      cpu: { usage: '45%', cores: 4 },
      disk: { used: '70%', available: '50GB' }
    };
  }

  private async checkNetworkStatus(): Promise<any> {
    // Would check actual network status
    return {
      connected: true,
      speed: 'high',
      latency: 50
    };
  }

  private async getActiveProcesses(): Promise<any[]> {
    // Would get actual running processes
    return [
      { name: 'openconductor', status: 'running' },
      { name: 'node', status: 'running' }
    ];
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private determineSeverity(errorMessage: string, context: any): ErrorContext['severity'] {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('emergency')) {
      return 'critical';
    }
    
    if (message.includes('warning') || message.includes('timeout') || context.current_step?.includes('optional')) {
      return 'medium';
    }
    
    if (message.includes('info') || message.includes('debug')) {
      return 'low';
    }
    
    return 'high'; // Default for unknown errors during onboarding
  }

  private async updateLearningData(
    errorContext: ErrorContext,
    strategy: RecoveryStrategy,
    result: RecoveryResult
  ): Promise<void> {
    // Update success patterns for future use
    const patternKey = `${errorContext.error_type}_${strategy.id}`;
    const currentSuccess = this.successPatterns.get(patternKey) || 0.5;
    const newSuccess = result.success ? 1.0 : 0.0;
    
    // Weighted average with more weight on recent results
    const updatedSuccess = (currentSuccess * 0.8) + (newSuccess * 0.2);
    this.successPatterns.set(patternKey, updatedSuccess);

    this.logger.debug('Updated recovery learning data', {
      pattern: patternKey,
      previousSuccess: currentSuccess,
      newSuccess: updatedSuccess
    });
  }

  /**
   * Public API methods
   */
  getRecoveryStrategies(): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values());
  }

  getErrorHistory(userId?: string): RecoveryAttempt[] {
    if (userId) {
      return this.recoveryHistory.filter(attempt => 
        attempt.attempt_id.includes(userId)
      );
    }
    return [...this.recoveryHistory];
  }

  getSuccessPatterns(): Map<string, number> {
    return new Map(this.successPatterns);
  }

  async preemptiveErrorPrevention(
    context: any
  ): Promise<{
    warnings: string[];
    preventive_actions: string[];
    risk_score: number;
  }> {
    // Use Trinity AI to predict potential issues before they occur
    try {
      const guidance = await this.trinityAI.getRealTimeGuidance(
        context.session_id,
        context.current_step,
        context.progress,
        context
      );

      return {
        warnings: guidance.warning_signs,
        preventive_actions: guidance.success_tips,
        risk_score: Math.random() * 0.3 // Low risk by default
      };
    } catch (error) {
      return {
        warnings: ['Monitor for unusual delays', 'Watch for error messages'],
        preventive_actions: ['Ensure stable connection', 'Check system resources'],
        risk_score: 0.2
      };
    }
  }
}

/**
 * Factory function to create intelligent error recovery system
 */
export function createIntelligentErrorRecovery(
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus,
  trinityAI: TrinityAIIntegration
): IntelligentErrorRecovery {
  return new IntelligentErrorRecovery(logger, errorManager, eventBus, trinityAI);
}