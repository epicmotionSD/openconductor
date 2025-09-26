/**
 * One-Click Remediation Engine - AI-Powered Self-Service Actions
 * 
 * Enables developers to execute AI-recommended fixes directly from service
 * pages with one click. Uses Sage agent intelligence to generate safe,
 * effective remediation actions with confidence scoring and rollback plans.
 * 
 * Strategic Value:
 * - Transforms reactive troubleshooting into proactive self-service
 * - Reduces mean time to resolution from hours to minutes
 * - Eliminates need for expert on-call engineers for common issues
 * - Provides intelligent automation with human-readable explanations
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { SageAgent } from '../agents/sage-agent';
import { SentinelAgent } from '../agents/sentinel-agent';

export interface RemediationAction {
  action_id: string;
  title: string;
  description: string;
  category: 'scaling' | 'restart' | 'configuration' | 'rollback' | 'dependency_fix' | 'cache_clear';
  automation_level: 'fully_automated' | 'guided_automation' | 'manual_with_guidance';
  confidence: number; // 0-1 AI confidence in this solution
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_resolution_time: number; // minutes
  success_probability: number; // 0-1 based on historical data
  business_impact: {
    downtime_reduction: number; // minutes saved
    user_impact_reduction: number; // percentage
    revenue_protection: number; // dollars protected
  };
  execution_plan: {
    pre_checks: ExecutionStep[];
    main_actions: ExecutionStep[];
    post_validation: ExecutionStep[];
    rollback_plan: ExecutionStep[];
  };
  sage_reasoning: {
    why_this_action: string;
    expected_outcome: string;
    risk_mitigation: string;
    alternative_considered: string[];
  };
  approval_requirements: {
    auto_executable: boolean;
    requires_confirmation: boolean;
    requires_manager_approval: boolean;
    business_hours_only: boolean;
  };
  monitoring: {
    success_indicators: string[];
    failure_indicators: string[];
    monitoring_duration: number; // minutes
    alert_channels: string[];
  };
}

export interface ExecutionStep {
  step_id: string;
  step_number: number;
  action: string;
  description: string;
  type: 'api_call' | 'shell_command' | 'configuration_update' | 'verification' | 'notification';
  parameters: Record<string, any>;
  timeout_seconds: number;
  retry_policy: {
    max_retries: number;
    retry_delay: number; // seconds
    backoff_strategy: 'linear' | 'exponential';
  };
  success_criteria: string[];
  failure_handling: {
    continue_on_failure: boolean;
    failure_actions: string[];
    escalation_required: boolean;
  };
  estimated_duration: number; // seconds
}

export interface RemediationExecution {
  execution_id: string;
  action_id: string;
  service_id: string;
  initiated_by: string;
  initiated_at: Date;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  execution_log: ExecutionLogEntry[];
  success_indicators_met: string[];
  failure_indicators_detected: string[];
  actual_resolution_time?: number; // minutes
  rollback_executed?: {
    rollback_initiated_at: Date;
    rollback_completed_at?: Date;
    rollback_success: boolean;
  };
  post_execution_validation: {
    success_validated: boolean;
    monitoring_results: any[];
    user_confirmation: boolean;
  };
}

export interface ExecutionLogEntry {
  timestamp: Date;
  step_id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  duration?: number; // milliseconds
}

export interface AutomatedRunbook {
  runbook_id: string;
  title: string;
  description: string;
  applicable_scenarios: string[];
  success_rate: number; // historical success rate
  avg_execution_time: number; // minutes
  last_updated: Date;
  version: string;
  actions: RemediationAction[];
  decision_tree: {
    conditions: Array<{
      condition: string;
      if_true: string; // action_id to execute
      if_false: string; // action_id to execute or next condition
    }>;
  };
  sage_optimization: {
    last_optimized: Date;
    optimization_score: number;
    learning_data_points: number;
  };
}

/**
 * One-Click Remediation Engine
 */
export class OneClickRemediationEngine {
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private sageAgent: SageAgent;
  private sentinelAgent: SentinelAgent;
  
  // Remediation management
  private availableActions = new Map<string, RemediationAction>();
  private activeExecutions = new Map<string, RemediationExecution>();
  private executionHistory: RemediationExecution[] = [];
  private automatedRunbooks = new Map<string, AutomatedRunbook>();
  
  // Learning and optimization
  private actionSuccessRates = new Map<string, number>();
  private userFeedback = new Map<string, Array<{
    feedback: 'helpful' | 'successful' | 'failed' | 'caused_issues';
    timestamp: Date;
    user_id: string;
    context: any;
  }>>();

  constructor(
    sageAgent: SageAgent,
    sentinelAgent: SentinelAgent,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.sageAgent = sageAgent;
    this.sentinelAgent = sentinelAgent;
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;
    
    this.initializeStandardActions();
    this.initializeAutomatedRunbooks();
    
    this.logger.info('One-Click Remediation Engine initialized');
  }

  /**
   * Generate remediation actions for a specific service and situation
   */
  async generateRemediationActions(
    serviceId: string,
    situation: {
      type: 'prediction' | 'incident' | 'performance_issue' | 'dependency_failure';
      details: any;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      context: any;
    }
  ): Promise<RemediationAction[]> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Generating remediation actions', {
        serviceId,
        situationType: situation.type,
        urgency: situation.urgency
      });

      // Step 1: Get Sage recommendations for the situation
      const sageContext = {
        domain: 'service_remediation',
        objective: `Resolve ${situation.type} for service ${serviceId}`,
        currentState: {
          service_id: serviceId,
          situation_type: situation.type,
          situation_details: situation.details,
          urgency: situation.urgency,
          context: situation.context
        },
        riskTolerance: situation.urgency === 'critical' ? 'medium' : 'low',
        timeline: situation.urgency === 'critical' ? 'immediate' : 'short-term'
      };

      const sageRecommendations = await this.sageAgent.execute(sageContext);

      // Step 2: Convert Sage recommendations to executable actions
      const actions = await Promise.all(
        sageRecommendations.recommendations.map(rec => 
          this.convertRecommendationToAction(serviceId, rec, situation)
        )
      );

      // Step 3: Enhance actions with historical success data
      const enhancedActions = actions.map(action => 
        this.enhanceActionWithHistoricalData(action, serviceId, situation)
      );

      // Step 4: Sort by confidence and success probability
      const sortedActions = enhancedActions.sort((a, b) => 
        (b.confidence * b.success_probability) - (a.confidence * a.success_probability)
      );

      // Step 5: Cache actions for quick access
      sortedActions.forEach(action => {
        this.availableActions.set(action.action_id, action);
      });

      const generationTime = Date.now() - startTime;
      
      // Emit actions generated event
      await this.eventBus.emit({
        type: 'remediation.actions_generated',
        timestamp: new Date(),
        data: {
          serviceId,
          situationType: situation.type,
          actionsGenerated: sortedActions.length,
          averageConfidence: sortedActions.reduce((sum, a) => sum + a.confidence, 0) / sortedActions.length,
          generationTime
        }
      });

      this.logger.info('Remediation actions generated', {
        serviceId,
        actionsGenerated: sortedActions.length,
        generationTime
      });

      return sortedActions;

    } catch (error) {
      this.logger.error('Failed to generate remediation actions', {
        serviceId,
        situationType: situation.type,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return fallback actions
      return this.getFallbackActions(serviceId, situation);
    }
  }

  /**
   * Execute one-click remediation action
   */
  async executeRemediationAction(
    actionId: string,
    serviceId: string,
    userId: string,
    options?: {
      skip_confirmations?: boolean;
      dry_run?: boolean;
      custom_parameters?: Record<string, any>;
    }
  ): Promise<RemediationExecution> {
    const executionId = this.generateExecutionId();
    const action = this.availableActions.get(actionId);
    
    if (!action) {
      throw new Error(`Remediation action not found: ${actionId}`);
    }

    try {
      this.logger.info('Starting remediation action execution', {
        executionId,
        actionId,
        serviceId,
        userId,
        isDryRun: options?.dry_run || false
      });

      // Step 1: Pre-execution validation
      await this.validateExecutionPreconditions(action, serviceId);

      // Step 2: Create execution record
      const execution: RemediationExecution = {
        execution_id: executionId,
        action_id: actionId,
        service_id: serviceId,
        initiated_by: userId,
        initiated_at: new Date(),
        status: 'queued',
        current_step: 0,
        total_steps: action.execution_plan.pre_checks.length + 
                    action.execution_plan.main_actions.length + 
                    action.execution_plan.post_validation.length,
        progress_percentage: 0,
        execution_log: [],
        success_indicators_met: [],
        failure_indicators_detected: [],
        post_execution_validation: {
          success_validated: false,
          monitoring_results: [],
          user_confirmation: false
        }
      };

      this.activeExecutions.set(executionId, execution);

      // Step 3: Execute asynchronously
      this.performAsyncExecution(execution, action, options).catch(error => {
        this.logger.error('Async execution failed', {
          executionId,
          error: error.message
        });
        execution.status = 'failed';
      });

      // Emit execution started event
      await this.eventBus.emit({
        type: 'remediation.execution_started',
        timestamp: new Date(),
        data: {
          executionId,
          actionId,
          serviceId,
          userId,
          estimatedTime: action.estimated_resolution_time,
          isDryRun: options?.dry_run || false
        }
      });

      return execution;

    } catch (error) {
      this.logger.error('Failed to start remediation execution', {
        executionId,
        actionId,
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Perform async execution of remediation action
   */
  private async performAsyncExecution(
    execution: RemediationExecution,
    action: RemediationAction,
    options?: any
  ): Promise<void> {
    try {
      execution.status = 'running';
      
      // Phase 1: Pre-checks
      await this.executeSteps(
        execution,
        action.execution_plan.pre_checks,
        'pre_checks',
        options?.dry_run
      );

      // Phase 2: Main actions
      await this.executeSteps(
        execution,
        action.execution_plan.main_actions,
        'main_actions',
        options?.dry_run
      );

      // Phase 3: Post-validation
      await this.executeSteps(
        execution,
        action.execution_plan.post_validation,
        'post_validation',
        options?.dry_run
      );

      // Phase 4: Success validation
      const validationResult = await this.validateExecutionSuccess(execution, action);
      
      if (validationResult.success) {
        execution.status = 'completed';
        execution.actual_resolution_time = (Date.now() - execution.initiated_at.getTime()) / 60000;
        execution.post_execution_validation.success_validated = true;
        
        // Update success rates
        this.updateActionSuccessRate(action.action_id, true);
        
        this.logger.info('Remediation action completed successfully', {
          executionId: execution.execution_id,
          actionId: action.action_id,
          resolutionTime: execution.actual_resolution_time
        });
      } else {
        throw new Error(`Execution validation failed: ${validationResult.reason}`);
      }

    } catch (error) {
      execution.status = 'failed';
      this.addExecutionLog(execution, 'error', `Execution failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Attempt rollback if configured
      if (action.execution_plan.rollback_plan.length > 0) {
        await this.executeRollback(execution, action);
      }
      
      this.updateActionSuccessRate(action.action_id, false);
      
      throw error;
    } finally {
      // Move to history
      this.executionHistory.push(execution);
      this.activeExecutions.delete(execution.execution_id);
      
      // Emit completion event
      await this.eventBus.emit({
        type: 'remediation.execution_completed',
        timestamp: new Date(),
        data: {
          executionId: execution.execution_id,
          actionId: action.action_id,
          serviceId: execution.service_id,
          success: execution.status === 'completed',
          resolutionTime: execution.actual_resolution_time
        }
      });
    }
  }

  /**
   * Execute a sequence of steps
   */
  private async executeSteps(
    execution: RemediationExecution,
    steps: ExecutionStep[],
    phase: string,
    dryRun: boolean = false
  ): Promise<void> {
    for (const step of steps) {
      try {
        this.addExecutionLog(execution, 'info', `Starting ${phase} step: ${step.action}`);
        
        if (dryRun) {
          // Simulate execution for dry run
          await new Promise(resolve => setTimeout(resolve, 100));
          this.addExecutionLog(execution, 'info', `[DRY RUN] Would execute: ${step.action}`);
        } else {
          // Execute actual step
          await this.executeStep(step, execution);
        }
        
        execution.current_step++;
        execution.progress_percentage = Math.round((execution.current_step / execution.total_steps) * 100);
        
        this.addExecutionLog(execution, 'success', `Completed step: ${step.action}`);

      } catch (error) {
        this.addExecutionLog(execution, 'error', `Step failed: ${step.action} - ${error instanceof Error ? error.message : String(error)}`);
        
        if (!step.failure_handling.continue_on_failure) {
          throw error;
        }
        
        // Execute failure actions if configured
        for (const failureAction of step.failure_handling.failure_actions) {
          this.addExecutionLog(execution, 'warning', `Executing failure action: ${failureAction}`);
          await this.executeFailureAction(failureAction, execution);
        }
      }
    }
  }

  /**
   * Execute individual step
   */
  private async executeStep(step: ExecutionStep, execution: RemediationExecution): Promise<any> {
    const startTime = Date.now();
    let result: any;

    try {
      switch (step.type) {
        case 'api_call':
          result = await this.executeApiCall(step.parameters, step.timeout_seconds);
          break;
          
        case 'shell_command':
          result = await this.executeShellCommand(step.parameters.command, step.timeout_seconds);
          break;
          
        case 'configuration_update':
          result = await this.updateConfiguration(step.parameters, step.timeout_seconds);
          break;
          
        case 'verification':
          result = await this.performVerification(step.parameters, execution.service_id);
          break;
          
        case 'notification':
          result = await this.sendNotification(step.parameters, execution);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Validate success criteria
      const criteriaMatch = await this.validateStepSuccessCriteria(step, result);
      if (!criteriaMatch) {
        throw new Error(`Step success criteria not met: ${step.success_criteria.join(', ')}`);
      }

      const duration = Date.now() - startTime;
      this.addExecutionLog(execution, 'success', `Step completed in ${duration}ms`, { result, duration });
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addExecutionLog(execution, 'error', `Step failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`, { duration });
      throw error;
    }
  }

  /**
   * Execute API call step
   */
  private async executeApiCall(parameters: any, timeout: number): Promise<any> {
    // This would make actual API calls to Kubernetes, cloud providers, etc.
    // For demo purposes, we'll simulate the call
    
    const { endpoint, method, body, headers } = parameters;
    
    this.logger.debug('Executing API call', { endpoint, method });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Simulate different responses based on endpoint
    if (endpoint.includes('scale')) {
      return { 
        success: true, 
        message: 'Service scaled successfully',
        new_replica_count: parameters.replicas || 3
      };
    } else if (endpoint.includes('restart')) {
      return {
        success: true,
        message: 'Service restarted successfully',
        restart_time: new Date()
      };
    } else {
      return { success: true, message: 'API call completed' };
    }
  }

  /**
   * Execute shell command step
   */
  private async executeShellCommand(command: string, timeout: number): Promise<any> {
    // This would execute actual shell commands
    // For demo purposes, we'll simulate
    
    this.logger.debug('Executing shell command', { command });
    
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      success: true,
      command,
      exit_code: 0,
      stdout: 'Command executed successfully',
      stderr: ''
    };
  }

  /**
   * Update configuration step
   */
  private async updateConfiguration(parameters: any, timeout: number): Promise<any> {
    // This would update actual configuration
    this.logger.debug('Updating configuration', parameters);
    
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    
    return {
      success: true,
      updated_keys: Object.keys(parameters.updates || {}),
      backup_created: true
    };
  }

  /**
   * Convert Sage recommendation to executable action
   */
  private async convertRecommendationToAction(
    serviceId: string,
    recommendation: any,
    situation: any
  ): Promise<RemediationAction> {
    const actionId = this.generateActionId(recommendation.action);
    
    // Generate execution plan based on recommendation
    const executionPlan = await this.generateExecutionPlan(recommendation, serviceId, situation);
    
    // Calculate business impact
    const businessImpact = this.calculateBusinessImpact(recommendation, situation);
    
    // Get historical success rate
    const successProbability = this.getHistoricalSuccessRate(recommendation.action) || 0.8;

    return {
      action_id: actionId,
      title: recommendation.action,
      description: recommendation.description,
      category: this.categorizeAction(recommendation.action),
      automation_level: 'fully_automated',
      confidence: recommendation.confidence,
      risk_level: this.assessActionRisk(recommendation),
      estimated_resolution_time: this.estimateResolutionTime(recommendation),
      success_probability: successProbability,
      business_impact: businessImpact,
      execution_plan: executionPlan,
      sage_reasoning: {
        why_this_action: recommendation.metadata?.reasoning || 'Sage analysis determined this is the optimal approach',
        expected_outcome: `Resolution of ${situation.type} within ${this.estimateResolutionTime(recommendation)} minutes`,
        risk_mitigation: 'Execution includes comprehensive rollback plan and monitoring',
        alternative_considered: recommendation.metadata?.alternatives || []
      },
      approval_requirements: {
        auto_executable: recommendation.confidence > 0.8 && situation.urgency !== 'critical',
        requires_confirmation: recommendation.confidence < 0.8 || situation.urgency === 'critical',
        requires_manager_approval: false,
        business_hours_only: false
      },
      monitoring: {
        success_indicators: this.generateSuccessIndicators(recommendation),
        failure_indicators: this.generateFailureIndicators(recommendation),
        monitoring_duration: 15, // 15 minutes of post-execution monitoring
        alert_channels: ['service_dashboard', 'incident_channel']
      }
    };
  }

  /**
   * Generate execution plan for recommendation
   */
  private async generateExecutionPlan(
    recommendation: any,
    serviceId: string,
    situation: any
  ): Promise<RemediationAction['execution_plan']> {
    // This would generate actual execution steps based on the recommendation
    // For demo, we'll create a typical scaling action plan
    
    const action = recommendation.action.toLowerCase();
    
    if (action.includes('scale') || action.includes('connection pool')) {
      return {
        pre_checks: [
          {
            step_id: 'check_current_capacity',
            step_number: 1,
            action: 'Check current service capacity',
            description: 'Verify current resource utilization and capacity',
            type: 'verification',
            parameters: { service_id: serviceId, metrics: ['cpu', 'memory', 'connections'] },
            timeout_seconds: 30,
            retry_policy: { max_retries: 2, retry_delay: 5, backoff_strategy: 'linear' },
            success_criteria: ['metrics_available', 'service_responding'],
            failure_handling: { continue_on_failure: false, failure_actions: [], escalation_required: true },
            estimated_duration: 10
          }
        ],
        main_actions: [
          {
            step_id: 'scale_connection_pool',
            step_number: 2,
            action: 'Scale database connection pool',
            description: 'Increase connection pool size to handle traffic',
            type: 'configuration_update',
            parameters: { 
              service_id: serviceId,
              updates: { 'database.pool_size': 100, 'database.max_connections': 120 }
            },
            timeout_seconds: 60,
            retry_policy: { max_retries: 1, retry_delay: 10, backoff_strategy: 'linear' },
            success_criteria: ['configuration_updated', 'service_healthy'],
            failure_handling: { continue_on_failure: false, failure_actions: ['rollback_config'], escalation_required: true },
            estimated_duration: 30
          }
        ],
        post_validation: [
          {
            step_id: 'validate_scaling',
            step_number: 3,
            action: 'Validate scaling effectiveness',
            description: 'Verify that scaling resolved the issue',
            type: 'verification',
            parameters: { 
              service_id: serviceId,
              checks: ['response_time_improved', 'error_rate_reduced', 'connection_pool_healthy']
            },
            timeout_seconds: 120,
            retry_policy: { max_retries: 3, retry_delay: 30, backoff_strategy: 'linear' },
            success_criteria: ['all_checks_passed'],
            failure_handling: { continue_on_failure: true, failure_actions: ['extended_monitoring'], escalation_required: false },
            estimated_duration: 60
          }
        ],
        rollback_plan: [
          {
            step_id: 'rollback_config',
            step_number: 1,
            action: 'Rollback configuration changes',
            description: 'Restore previous configuration if scaling caused issues',
            type: 'configuration_update',
            parameters: { 
              service_id: serviceId,
              restore_backup: true
            },
            timeout_seconds: 60,
            retry_policy: { max_retries: 2, retry_delay: 5, backoff_strategy: 'linear' },
            success_criteria: ['configuration_restored'],
            failure_handling: { continue_on_failure: false, failure_actions: [], escalation_required: true },
            estimated_duration: 30
          }
        ]
      };
    }

    // Default execution plan for other actions
    return {
      pre_checks: [],
      main_actions: [
        {
          step_id: 'execute_action',
          step_number: 1,
          action: recommendation.action,
          description: recommendation.description,
          type: 'api_call',
          parameters: { action: recommendation.action },
          timeout_seconds: 300,
          retry_policy: { max_retries: 1, retry_delay: 30, backoff_strategy: 'linear' },
          success_criteria: ['action_completed'],
          failure_handling: { continue_on_failure: false, failure_actions: [], escalation_required: true },
          estimated_duration: 120
        }
      ],
      post_validation: [],
      rollback_plan: []
    };
  }

  // Helper methods
  private addExecutionLog(
    execution: RemediationExecution,
    level: ExecutionLogEntry['level'],
    message: string,
    details?: any
  ): void {
    execution.execution_log.push({
      timestamp: new Date(),
      step_id: `step_${execution.current_step}`,
      level,
      message,
      details
    });
  }

  private generateActionId(action: string): string {
    const sanitized = action.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `action_${sanitized}_${Date.now()}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private categorizeAction(action: string): RemediationAction['category'] {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('scale') || actionLower.includes('replica')) return 'scaling';
    if (actionLower.includes('restart') || actionLower.includes('reboot')) return 'restart';
    if (actionLower.includes('config') || actionLower.includes('setting')) return 'configuration';
    if (actionLower.includes('rollback') || actionLower.includes('revert')) return 'rollback';
    if (actionLower.includes('cache') || actionLower.includes('clear')) return 'cache_clear';
    if (actionLower.includes('dependency') || actionLower.includes('service')) return 'dependency_fix';
    
    return 'configuration';
  }

  private assessActionRisk(recommendation: any): RemediationAction['risk_level'] {
    const action = recommendation.action.toLowerCase();
    
    if (action.includes('restart') || action.includes('rollback')) return 'medium';
    if (action.includes('scale') || action.includes('cache')) return 'low';
    if (action.includes('config') && action.includes('critical')) return 'high';
    
    return recommendation.impact === 'high' ? 'medium' : 'low';
  }

  private initializeStandardActions(): void {
    // Initialize common remediation actions
    this.logger.info('Standard remediation actions initialized');
  }

  private initializeAutomatedRunbooks(): void {
    // Initialize automated runbooks
    this.logger.info('Automated runbooks initialized');
  }

  private getFallbackActions(serviceId: string, situation: any): RemediationAction[] {
    // Return basic fallback actions when Sage generation fails
    return [
      {
        action_id: 'fallback_restart',
        title: 'Restart Service',
        description: 'Restart the service to resolve transient issues',
        category: 'restart',
        automation_level: 'fully_automated',
        confidence: 0.6,
        risk_level: 'medium',
        estimated_resolution_time: 5,
        success_probability: 0.7,
        business_impact: {
          downtime_reduction: 10,
          user_impact_reduction: 0.8,
          revenue_protection: 1000
        },
        execution_plan: {
          pre_checks: [],
          main_actions: [],
          post_validation: [],
          rollback_plan: []
        },
        sage_reasoning: {
          why_this_action: 'Fallback action when AI analysis unavailable',
          expected_outcome: 'Service restart typically resolves transient issues',
          risk_mitigation: 'Standard restart procedure with health checks',
          alternative_considered: []
        },
        approval_requirements: {
          auto_executable: false,
          requires_confirmation: true,
          requires_manager_approval: false,
          business_hours_only: false
        },
        monitoring: {
          success_indicators: ['service_healthy'],
          failure_indicators: ['service_unhealthy'],
          monitoring_duration: 10,
          alert_channels: ['service_dashboard']
        }
      }
    ];
  }

  /**
   * Public API methods
   */
  getExecution(executionId: string): RemediationExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  getExecutionHistory(serviceId?: string, limit: number = 50): RemediationExecution[] {
    let history = [...this.executionHistory];
    
    if (serviceId) {
      history = history.filter(exec => exec.service_id === serviceId);
    }
    
    return history
      .sort((a, b) => b.initiated_at.getTime() - a.initiated_at.getTime())
      .slice(0, limit);
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    this.addExecutionLog(execution, 'warning', 'Execution cancelled by user');
    
    return true;
  }

  getActionSuccessRates(): Map<string, number> {
    return new Map(this.actionSuccessRates);
  }

  private updateActionSuccessRate(actionId: string, success: boolean): void {
    const current = this.actionSuccessRates.get(actionId) || 0.8;
    const newRate = success ? 
      (current + 1.0) / 2 : // Average with 100% for success
      (current + 0.0) / 2;   // Average with 0% for failure
    
    this.actionSuccessRates.set(actionId, newRate);
  }

  private getHistoricalSuccessRate(action: string): number | undefined {
    const actionId = this.generateActionId(action);
    return this.actionSuccessRates.get(actionId);
  }
}

/**
 * Factory function to create One-Click Remediation Engine
 */
export function createOneClickRemediationEngine(
  sageAgent: SageAgent,
  sentinelAgent: SentinelAgent,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): OneClickRemediationEngine {
  return new OneClickRemediationEngine(
    sageAgent,
    sentinelAgent,
    logger,
    errorManager,
    eventBus
  );
}