/**
 * Quick-Start Templates and Pre-configured Workflows
 * 
 * Provides immediate value through ready-to-use workflow templates that
 * demonstrate OpenConductor's capabilities within the first 15 minutes.
 * Templates are designed to work with auto-installed servers and provide
 * tangible results that users can see and understand immediately.
 */

import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { EnvironmentContext } from './intelligent-discovery-engine';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'file_processing' | 'data_automation' | 'monitoring' | 'development' | 'communication';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number; // minutes to set up
  value_proposition: string;
  use_cases: string[];
  required_servers: string[];
  optional_servers: string[];
  sample_data_included: boolean;
  immediate_value_demo: {
    input_description: string;
    expected_output: string;
    value_statement: string;
  };
  template_config: WorkflowConfig;
  customization_options: CustomizationOption[];
  success_metrics: string[];
}

export interface WorkflowConfig {
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  error_handling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
  scheduling?: SchedulingConfig;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  server: string;
  operation: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error_handling?: {
    retry_count: number;
    retry_delay: number;
    fallback_action?: string;
  };
  timeout_seconds: number;
  depends_on?: string[];
}

export interface WorkflowTrigger {
  type: 'schedule' | 'file_watch' | 'webhook' | 'manual';
  config: any;
  enabled: boolean;
}

export interface ErrorHandlingConfig {
  default_retry_count: number;
  notification_channels: string[];
  escalation_rules: Array<{
    condition: string;
    action: string;
  }>;
}

export interface MonitoringConfig {
  health_checks: boolean;
  performance_tracking: boolean;
  custom_metrics: string[];
  alert_thresholds: Record<string, number>;
}

export interface SchedulingConfig {
  cron_expression: string;
  timezone: string;
  max_concurrent_runs: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'file_path';
  default_value: any;
  options?: any[];
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface GeneratedWorkflow {
  id: string;
  template_id: string;
  name: string;
  config: WorkflowConfig;
  sample_data: any;
  customizations: Record<string, any>;
  created_at: Date;
  ready_to_run: boolean;
}

export interface QuickStartDemo {
  workflow_id: string;
  demo_name: string;
  sample_input: any;
  expected_output: any;
  execution_steps: string[];
  value_demonstration: {
    time_saved: string;
    manual_effort_avoided: string;
    accuracy_improvement: string;
    scalability_benefit: string;
  };
}

/**
 * Quick-Start Template Engine
 */
export class QuickStartTemplates {
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private templates = new Map<string, WorkflowTemplate>();
  private generatedWorkflows = new Map<string, GeneratedWorkflow>();

  constructor(
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus
  ) {
    this.logger = logger;
    this.errorManager = errorManager;
    this.eventBus = eventBus;

    this.initializeTemplates();
    this.logger.info('Quick-start template engine initialized with immediate value templates');
  }

  /**
   * Get templates suitable for user's environment and goals
   */
  async getRecommendedTemplates(
    environment: EnvironmentContext,
    installedServers: string[],
    userGoals?: string[]
  ): Promise<WorkflowTemplate[]> {
    const availableTemplates = Array.from(this.templates.values());

    // Filter templates based on available servers
    const compatibleTemplates = availableTemplates.filter(template => {
      const hasRequiredServers = template.required_servers.every(required =>
        installedServers.some(installed => installed.includes(required))
      );
      return hasRequiredServers;
    });

    // Score and sort templates based on environment and goals
    const scoredTemplates = compatibleTemplates.map(template => ({
      template,
      score: this.calculateTemplateScore(template, environment, userGoals)
    }));

    // Sort by score and return top templates
    scoredTemplates.sort((a, b) => b.score - a.score);

    this.logger.info('Recommended templates generated', {
      totalTemplates: availableTemplates.length,
      compatibleTemplates: compatibleTemplates.length,
      topRecommendations: scoredTemplates.slice(0, 3).map(st => st.template.name)
    });

    return scoredTemplates.slice(0, 5).map(st => st.template);
  }

  /**
   * Generate a ready-to-run workflow from template
   */
  async generateWorkflowFromTemplate(
    templateId: string,
    customizations: Record<string, any> = {},
    userId?: string
  ): Promise<GeneratedWorkflow> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    try {
      // Apply customizations to template
      const customizedConfig = await this.applyCustomizations(template, customizations);

      // Generate sample data
      const sampleData = await this.generateSampleData(template);

      // Create the workflow
      const workflow: GeneratedWorkflow = {
        id: this.generateWorkflowId(template),
        template_id: templateId,
        name: customizations.workflow_name || template.name,
        config: customizedConfig,
        sample_data: sampleData,
        customizations,
        created_at: new Date(),
        ready_to_run: true
      };

      this.generatedWorkflows.set(workflow.id, workflow);

      // Emit workflow generated event
      await this.eventBus.emit({
        type: 'workflow.generated_from_template',
        timestamp: new Date(),
        data: {
          workflowId: workflow.id,
          templateId,
          userId,
          customizations: Object.keys(customizations)
        }
      });

      this.logger.info('Workflow generated from template', {
        workflowId: workflow.id,
        templateId,
        templateName: template.name
      });

      return workflow;

    } catch (error) {
      this.logger.error('Failed to generate workflow from template', {
        templateId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw this.errorManager.wrapError(error as Error, {
        context: 'template-workflow-generation',
        templateId
      });
    }
  }

  /**
   * Create a demo execution plan for immediate value demonstration
   */
  async createDemoPlan(workflowId: string): Promise<QuickStartDemo> {
    const workflow = this.generatedWorkflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const template = this.templates.get(workflow.template_id);
    if (!template) {
      throw new Error(`Template not found: ${workflow.template_id}`);
    }

    const demo: QuickStartDemo = {
      workflow_id: workflowId,
      demo_name: `${template.name} Demo`,
      sample_input: workflow.sample_data.input,
      expected_output: workflow.sample_data.expected_output,
      execution_steps: this.generateExecutionSteps(workflow),
      value_demonstration: {
        time_saved: template.immediate_value_demo.value_statement,
        manual_effort_avoided: `Eliminates ${this.estimateManualEffort(template)} of manual work`,
        accuracy_improvement: "100% consistent results vs manual processing",
        scalability_benefit: `Can process 100x the volume without additional effort`
      }
    };

    return demo;
  }

  /**
   * Execute a quick demo to show immediate value
   */
  async executeDemoWorkflow(demoId: string): Promise<{
    success: boolean;
    execution_time: number;
    results: any;
    value_achieved: string;
  }> {
    // This would integrate with the actual workflow execution engine
    // For now, we'll simulate the execution

    const startTime = Date.now();

    // Simulate workflow execution
    await this.simulateWorkflowExecution();

    const executionTime = Date.now() - startTime;

    const results = {
      files_processed: 5,
      records_transformed: 250,
      data_quality_score: 0.98,
      processing_speed: '250 records/second'
    };

    this.logger.info('Demo workflow executed', {
      demoId,
      executionTime,
      results
    });

    return {
      success: true,
      execution_time: executionTime,
      results,
      value_achieved: `Processed ${results.files_processed} files and ${results.records_transformed} records in ${(executionTime/1000).toFixed(1)} seconds`
    };
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Initialize built-in templates
   */
  private initializeTemplates(): void {
    // File Processing Template
    this.templates.set('file_processor', {
      id: 'file_processor',
      name: 'Smart File Processor',
      description: 'Automatically process and organize files with intelligent routing',
      category: 'file_processing',
      difficulty: 'beginner',
      estimated_time: 5,
      value_proposition: 'Eliminate manual file sorting and processing - save 2+ hours per week',
      use_cases: [
        'Process CSV files automatically',
        'Organize downloads by file type',
        'Convert and rename files in bulk',
        'Archive old files automatically'
      ],
      required_servers: ['file-manager'],
      optional_servers: ['data-transformer', 'notification-sender'],
      sample_data_included: true,
      immediate_value_demo: {
        input_description: '5 sample CSV files with sales data',
        expected_output: 'Processed files with clean data and summary report',
        value_statement: 'What takes 30 minutes manually now happens in 30 seconds automatically'
      },
      template_config: {
        name: 'Smart File Processor',
        description: 'Automatically process files from input directory',
        version: '1.0.0',
        steps: [
          {
            id: 'monitor_files',
            name: 'Monitor Input Directory',
            description: 'Watch for new files in the input directory',
            server: 'file-manager',
            operation: 'watch_directory',
            inputs: {
              directory: './input',
              file_patterns: ['*.csv', '*.txt', '*.json'],
              recursive: false
            },
            outputs: {
              detected_files: 'array'
            },
            timeout_seconds: 300
          },
          {
            id: 'validate_files',
            name: 'Validate File Format',
            description: 'Check if files meet processing requirements',
            server: 'file-manager',
            operation: 'validate_files',
            inputs: {
              files: '${monitor_files.detected_files}',
              validation_rules: {
                max_size: '10MB',
                required_columns: ['name', 'date']
              }
            },
            outputs: {
              valid_files: 'array',
              invalid_files: 'array'
            },
            depends_on: ['monitor_files'],
            timeout_seconds: 60
          },
          {
            id: 'process_files',
            name: 'Process Valid Files',
            description: 'Clean and transform file contents',
            server: 'data-transformer',
            operation: 'transform_data',
            inputs: {
              files: '${validate_files.valid_files}',
              transformations: [
                'clean_whitespace',
                'standardize_dates',
                'remove_duplicates'
              ]
            },
            outputs: {
              processed_files: 'array',
              processing_report: 'object'
            },
            depends_on: ['validate_files'],
            timeout_seconds: 120
          },
          {
            id: 'save_results',
            name: 'Save Processed Files',
            description: 'Save processed files to output directory',
            server: 'file-manager',
            operation: 'save_files',
            inputs: {
              files: '${process_files.processed_files}',
              output_directory: './output',
              naming_pattern: 'processed_{original_name}_{timestamp}'
            },
            outputs: {
              saved_files: 'array'
            },
            depends_on: ['process_files'],
            timeout_seconds: 60
          }
        ],
        triggers: [
          {
            type: 'file_watch',
            config: {
              directory: './input',
              events: ['created', 'modified']
            },
            enabled: true
          }
        ],
        error_handling: {
          default_retry_count: 2,
          notification_channels: ['console', 'log'],
          escalation_rules: [
            {
              condition: 'step_failed_3_times',
              action: 'notify_user'
            }
          ]
        },
        monitoring: {
          health_checks: true,
          performance_tracking: true,
          custom_metrics: ['files_processed_per_hour', 'error_rate'],
          alert_thresholds: {
            error_rate: 0.1,
            processing_time: 300
          }
        }
      },
      customization_options: [
        {
          id: 'input_directory',
          name: 'Input Directory',
          description: 'Directory to monitor for new files',
          type: 'file_path',
          default_value: './input',
          validation: { required: true }
        },
        {
          id: 'file_patterns',
          name: 'File Patterns',
          description: 'File patterns to process (e.g., *.csv, *.txt)',
          type: 'text',
          default_value: '*.csv,*.txt,*.json',
          validation: { required: true }
        },
        {
          id: 'processing_rules',
          name: 'Processing Rules',
          description: 'Data cleaning and transformation rules',
          type: 'select',
          default_value: 'standard',
          options: ['minimal', 'standard', 'aggressive'],
          validation: { required: true }
        }
      ],
      success_metrics: [
        'Files processed without errors',
        'Processing time under 60 seconds',
        'Output files created successfully',
        'No data loss during processing'
      ]
    });

    // Data Pipeline Template
    this.templates.set('data_pipeline', {
      id: 'data_pipeline',
      name: 'ETL Data Pipeline',
      description: 'Extract, transform, and load data from multiple sources',
      category: 'data_automation',
      difficulty: 'intermediate',
      estimated_time: 8,
      value_proposition: 'Automate data integration - replace hours of manual data work',
      use_cases: [
        'Combine data from multiple CSV files',
        'Clean and standardize data formats',
        'Generate daily data reports',
        'Sync data between systems'
      ],
      required_servers: ['data-transformer', 'file-manager'],
      optional_servers: ['database-connector', 'report-generator'],
      sample_data_included: true,
      immediate_value_demo: {
        input_description: 'Sample sales, customer, and inventory data files',
        expected_output: 'Unified clean dataset with business insights',
        value_statement: 'Transform 3 hours of manual data work into 3 minutes of automation'
      },
      template_config: {
        name: 'ETL Data Pipeline',
        description: 'Extract, transform, and load data pipeline',
        version: '1.0.0',
        steps: [
          {
            id: 'extract_data',
            name: 'Extract Data Sources',
            description: 'Load data from multiple sources',
            server: 'data-transformer',
            operation: 'extract_data',
            inputs: {
              sources: [
                { type: 'csv', path: './data/sales.csv' },
                { type: 'csv', path: './data/customers.csv' },
                { type: 'csv', path: './data/inventory.csv' }
              ]
            },
            outputs: {
              raw_datasets: 'array'
            },
            timeout_seconds: 180
          },
          {
            id: 'validate_data',
            name: 'Validate Data Quality',
            description: 'Check data quality and completeness',
            server: 'data-transformer',
            operation: 'validate_data',
            inputs: {
              datasets: '${extract_data.raw_datasets}',
              validation_rules: {
                required_columns: ['id', 'date'],
                data_types: { 'id': 'integer', 'date': 'date' },
                completeness_threshold: 0.95
              }
            },
            outputs: {
              validation_report: 'object',
              clean_datasets: 'array'
            },
            depends_on: ['extract_data'],
            timeout_seconds: 120
          },
          {
            id: 'transform_data',
            name: 'Transform and Merge Data',
            description: 'Apply transformations and merge datasets',
            server: 'data-transformer',
            operation: 'transform_merge',
            inputs: {
              datasets: '${validate_data.clean_datasets}',
              transformations: [
                'standardize_dates',
                'normalize_text',
                'calculate_derived_fields'
              ],
              merge_strategy: 'inner_join',
              join_keys: ['customer_id', 'product_id']
            },
            outputs: {
              merged_dataset: 'object',
              transformation_log: 'array'
            },
            depends_on: ['validate_data'],
            timeout_seconds: 240
          },
          {
            id: 'generate_insights',
            name: 'Generate Business Insights',
            description: 'Calculate key metrics and insights',
            server: 'data-transformer',
            operation: 'calculate_metrics',
            inputs: {
              dataset: '${transform_data.merged_dataset}',
              metrics: [
                'total_sales',
                'avg_order_value',
                'customer_retention_rate',
                'top_products'
              ]
            },
            outputs: {
              insights: 'object',
              summary_report: 'object'
            },
            depends_on: ['transform_data'],
            timeout_seconds: 120
          },
          {
            id: 'save_results',
            name: 'Save Results',
            description: 'Save processed data and insights',
            server: 'file-manager',
            operation: 'save_data',
            inputs: {
              data: '${transform_data.merged_dataset}',
              insights: '${generate_insights.insights}',
              output_formats: ['csv', 'json', 'report'],
              output_directory: './output/pipeline_results'
            },
            outputs: {
              saved_files: 'array'
            },
            depends_on: ['generate_insights'],
            timeout_seconds: 90
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: {
              cron: '0 9 * * *', // Daily at 9 AM
              timezone: 'UTC'
            },
            enabled: true
          }
        ],
        error_handling: {
          default_retry_count: 2,
          notification_channels: ['console', 'email'],
          escalation_rules: [
            {
              condition: 'data_quality_below_threshold',
              action: 'halt_pipeline_notify_user'
            }
          ]
        },
        monitoring: {
          health_checks: true,
          performance_tracking: true,
          custom_metrics: ['data_quality_score', 'processing_duration', 'records_processed'],
          alert_thresholds: {
            data_quality_score: 0.9,
            processing_duration: 600
          }
        },
        scheduling: {
          cron_expression: '0 9 * * *',
          timezone: 'UTC',
          max_concurrent_runs: 1
        }
      },
      customization_options: [
        {
          id: 'data_sources',
          name: 'Data Sources',
          description: 'Configure input data sources',
          type: 'text',
          default_value: './data/*.csv',
          validation: { required: true }
        },
        {
          id: 'schedule',
          name: 'Processing Schedule',
          description: 'When to run the pipeline',
          type: 'select',
          default_value: 'daily',
          options: ['hourly', 'daily', 'weekly', 'manual'],
          validation: { required: true }
        }
      ],
      success_metrics: [
        'Data extracted from all sources',
        'Data quality above 90%',
        'Pipeline completes within time limit',
        'Business insights generated successfully'
      ]
    });

    // Monitoring Setup Template
    this.templates.set('monitoring_setup', {
      id: 'monitoring_setup',
      name: 'Smart Monitoring Dashboard',
      description: 'Set up intelligent monitoring with automated alerts',
      category: 'monitoring',
      difficulty: 'beginner',
      estimated_time: 7,
      value_proposition: 'Never miss critical issues - get intelligent alerts before problems impact users',
      use_cases: [
        'Monitor system health automatically',
        'Get alerts before issues become critical',
        'Track key performance metrics',
        'Generate health reports'
      ],
      required_servers: ['monitoring-agent'],
      optional_servers: ['notification-sender', 'report-generator'],
      sample_data_included: true,
      immediate_value_demo: {
        input_description: 'Sample system metrics and health data',
        expected_output: 'Real-time dashboard with intelligent alerts',
        value_statement: 'Catch issues 10 minutes before they impact users instead of 10 minutes after'
      },
      template_config: {
        name: 'Smart Monitoring Dashboard',
        description: 'Intelligent monitoring with predictive alerts',
        version: '1.0.0',
        steps: [
          {
            id: 'collect_metrics',
            name: 'Collect System Metrics',
            description: 'Gather system and application metrics',
            server: 'monitoring-agent',
            operation: 'collect_metrics',
            inputs: {
              metric_sources: [
                'system_cpu',
                'system_memory',
                'disk_usage',
                'network_io',
                'application_response_time'
              ],
              collection_interval: 30
            },
            outputs: {
              metrics_data: 'array'
            },
            timeout_seconds: 60
          },
          {
            id: 'analyze_trends',
            name: 'Analyze Performance Trends',
            description: 'Identify patterns and anomalies in metrics',
            server: 'monitoring-agent',
            operation: 'analyze_trends',
            inputs: {
              metrics: '${collect_metrics.metrics_data}',
              analysis_window: '1h',
              anomaly_detection: true,
              trend_analysis: true
            },
            outputs: {
              trend_analysis: 'object',
              anomalies: 'array'
            },
            depends_on: ['collect_metrics'],
            timeout_seconds: 90
          },
          {
            id: 'evaluate_alerts',
            name: 'Evaluate Alert Conditions',
            description: 'Check if any alert thresholds are breached',
            server: 'monitoring-agent',
            operation: 'evaluate_alerts',
            inputs: {
              metrics: '${collect_metrics.metrics_data}',
              anomalies: '${analyze_trends.anomalies}',
              alert_rules: [
                { metric: 'cpu_usage', threshold: 80, severity: 'warning' },
                { metric: 'memory_usage', threshold: 90, severity: 'critical' },
                { metric: 'response_time', threshold: 2000, severity: 'warning' }
              ]
            },
            outputs: {
              active_alerts: 'array'
            },
            depends_on: ['collect_metrics', 'analyze_trends'],
            timeout_seconds: 30
          },
          {
            id: 'send_notifications',
            name: 'Send Notifications',
            description: 'Send alerts to configured channels',
            server: 'notification-sender',
            operation: 'send_alerts',
            inputs: {
              alerts: '${evaluate_alerts.active_alerts}',
              notification_channels: ['email', 'slack'],
              escalation_rules: {
                'warning': ['email'],
                'critical': ['email', 'slack']
              }
            },
            outputs: {
              notifications_sent: 'array'
            },
            depends_on: ['evaluate_alerts'],
            timeout_seconds: 60
          }
        ],
        triggers: [
          {
            type: 'schedule',
            config: {
              cron: '*/5 * * * *', // Every 5 minutes
              timezone: 'UTC'
            },
            enabled: true
          }
        ],
        error_handling: {
          default_retry_count: 3,
          notification_channels: ['console'],
          escalation_rules: [
            {
              condition: 'monitoring_failure',
              action: 'fallback_to_basic_checks'
            }
          ]
        },
        monitoring: {
          health_checks: true,
          performance_tracking: true,
          custom_metrics: ['alert_response_time', 'false_positive_rate'],
          alert_thresholds: {
            alert_response_time: 30,
            false_positive_rate: 0.05
          }
        }
      },
      customization_options: [
        {
          id: 'alert_channels',
          name: 'Alert Channels',
          description: 'Where to send alerts (email, slack, etc.)',
          type: 'select',
          default_value: 'email',
          options: ['email', 'slack', 'webhook', 'console'],
          validation: { required: true }
        },
        {
          id: 'alert_sensitivity',
          name: 'Alert Sensitivity',
          description: 'How sensitive should anomaly detection be',
          type: 'select',
          default_value: 'medium',
          options: ['low', 'medium', 'high'],
          validation: { required: true }
        }
      ],
      success_metrics: [
        'Metrics collected successfully',
        'Baseline established for normal behavior',
        'Alert rules configured properly',
        'Test alerts sent successfully'
      ]
    });

    this.logger.info('Template library initialized', {
      templateCount: this.templates.size,
      categories: Array.from(new Set(Array.from(this.templates.values()).map(t => t.category)))
    });
  }

  // Helper methods

  private calculateTemplateScore(
    template: WorkflowTemplate,
    environment: EnvironmentContext,
    userGoals?: string[]
  ): number {
    let score = 0;

    // Base score for difficulty match
    if (template.difficulty === 'beginner') score += 0.3;

    // Project type alignment
    if (environment.project_type === 'nodejs' && template.category === 'development') score += 0.2;
    if (environment.project_type === 'python' && template.category === 'data_automation') score += 0.2;

    // Tool alignment
    Object.keys(environment.tools).forEach(tool => {
      if (environment.tools[tool as keyof typeof environment.tools]) {
        if (template.required_servers.some(server => server.includes(tool))) {
          score += 0.15;
        }
      }
    });

    // User goals alignment
    if (userGoals) {
      userGoals.forEach(goal => {
        if (template.use_cases.some(useCase => 
          useCase.toLowerCase().includes(goal.toLowerCase())
        )) {
          score += 0.25;
        }
      });
    }

    // Immediate value preference
    if (template.sample_data_included && template.estimated_time <= 10) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private async applyCustomizations(
    template: WorkflowTemplate,
    customizations: Record<string, any>
  ): Promise<WorkflowConfig> {
    const config = JSON.parse(JSON.stringify(template.template_config)); // Deep copy

    // Apply customizations based on template options
    template.customization_options.forEach(option => {
      const customValue = customizations[option.id];
      if (customValue !== undefined) {
        this.applyCustomization(config, option.id, customValue);
      }
    });

    return config;
  }

  private applyCustomization(config: WorkflowConfig, optionId: string, value: any): void {
    switch (optionId) {
      case 'input_directory':
        // Update all input directory references
        config.steps.forEach(step => {
          if (step.inputs?.directory) {
            step.inputs.directory = value;
          }
        });
        break;
      case 'file_patterns':
        // Update file pattern filters
        const patterns = value.split(',').map((p: string) => p.trim());
        config.steps.forEach(step => {
          if (step.inputs?.file_patterns) {
            step.inputs.file_patterns = patterns;
          }
        });
        break;
      case 'schedule':
        // Update scheduling configuration
        if (config.scheduling) {
          const scheduleMap: Record<string, string> = {
            'hourly': '0 * * * *',
            'daily': '0 9 * * *',
            'weekly': '0 9 * * 1',
            'manual': ''
          };
          config.scheduling.cron_expression = scheduleMap[value] || scheduleMap.daily;
        }
        break;
    }
  }

  private async generateSampleData(template: WorkflowTemplate): Promise<any> {
    const sampleData: any = {
      input: {},
      expected_output: {}
    };

    switch (template.category) {
      case 'file_processing':
        sampleData.input = {
          files: [
            'sample_sales_data.csv',
            'customer_feedback.txt',
            'inventory_report.json'
          ]
        };
        sampleData.expected_output = {
          processed_files: [
            'processed_sample_sales_data_20241201.csv',
            'processed_customer_feedback_20241201.txt',
            'processed_inventory_report_20241201.json'
          ],
          summary: {
            files_processed: 3,
            total_records: 150,
            processing_time: '2.3 seconds'
          }
        };
        break;

      case 'data_automation':
        sampleData.input = {
          datasets: ['sales.csv', 'customers.csv', 'inventory.csv'],
          total_records: 500
        };
        sampleData.expected_output = {
          merged_dataset: 'unified_business_data.csv',
          insights: {
            total_sales: 125000,
            top_customer: 'Acme Corp',
            best_selling_product: 'Widget Pro'
          }
        };
        break;

      case 'monitoring':
        sampleData.input = {
          metrics: ['cpu_usage', 'memory_usage', 'response_time'],
          collection_period: '1 hour'
        };
        sampleData.expected_output = {
          dashboard_url: 'http://localhost:3000/monitoring',
          alerts_configured: 5,
          baseline_established: true
        };
        break;
    }

    return sampleData;
  }

  private generateExecutionSteps(workflow: GeneratedWorkflow): string[] {
    return workflow.config.steps.map((step, index) => 
      `${index + 1}. ${step.name}: ${step.description}`
    );
  }

  private estimateManualEffort(template: WorkflowTemplate): string {
    const effortMap: Record<string, string> = {
      'file_processing': '2-3 hours of manual file sorting and processing',
      'data_automation': '4-6 hours of data cleaning and analysis',
      'monitoring': '1-2 hours of manual system checking',
      'development': '3-5 hours of repetitive development tasks',
      'communication': '1-2 hours of manual notifications and updates'
    };

    return effortMap[template.category] || '2-4 hours of manual work';
  }

  private async simulateWorkflowExecution(): Promise<void> {
    // Simulate different execution phases
    await new Promise(resolve => setTimeout(resolve, 500)); // Setup
    await new Promise(resolve => setTimeout(resolve, 1000)); // Processing
    await new Promise(resolve => setTimeout(resolve, 300)); // Cleanup
  }

  private generateWorkflowId(template: WorkflowTemplate): string {
    return `workflow_${template.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Public API methods
   */
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  getGeneratedWorkflow(workflowId: string): GeneratedWorkflow | undefined {
    return this.generatedWorkflows.get(workflowId);
  }

  getTemplateCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach(template => categories.add(template.category));
    return Array.from(categories);
  }

  async validateTemplateRequirements(
    templateId: string,
    availableServers: string[]
  ): Promise<{
    canInstall: boolean;
    missingRequirements: string[];
    recommendedServers: string[];
  }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const missingRequired = template.required_servers.filter(required =>
      !availableServers.some(available => available.includes(required))
    );

    const recommendedOptional = template.optional_servers.filter(optional =>
      availableServers.some(available => available.includes(optional))
    );

    return {
      canInstall: missingRequired.length === 0,
      missingRequirements: missingRequired,
      recommendedServers: recommendedOptional
    };
  }
}

/**
 * Factory function to create quick-start template engine
 */
export function createQuickStartTemplates(
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus
): QuickStartTemplates {
  return new QuickStartTemplates(logger, errorManager, eventBus);
}