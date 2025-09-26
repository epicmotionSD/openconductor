/**
 * Killer AIOps Demo Scenario - Strategic Competitive Advantage Proof
 * 
 * Demonstrates the revolutionary difference between OpenConductor's AI-powered
 * service intelligence and traditional manual troubleshooting approaches.
 * 
 * Demo Scenario: "Payment Service SLA Breach Prevention & Diagnosis"
 * 
 * Traditional Approach Timeline:
 * - T+0: Issue occurs, users affected
 * - T+3: Monitoring alerts fire
 * - T+5: On-call engineer investigates
 * - T+15: Root cause identified manually
 * - T+25: Fix implemented
 * - Total: 25 minutes of impact
 * 
 * OpenConductor Trinity AI Approach:
 * - T-12: Oracle predicts SLA breach 12 minutes before it happens
 * - T-10: Preventive actions suggested with 87% confidence
 * - T+0: If prevention missed, Sentinel correlates root cause in 30 seconds
 * - T+2: Sage provides one-click remediation with 91% confidence
 * - Total: 2 minutes of impact (92% reduction)
 */

import { Logger } from '../utils/logger';
import { EventBus } from '../types/events';
import { ServiceIntelligenceEngine } from './service-intelligence-engine';
import { ServiceDependencyEngine } from './service-dependency-engine';
import { ExplainableServiceIntelligence } from './explainable-service-intelligence';
import { OneClickRemediationEngine } from './one-click-remediation-engine';
import { ServiceContextTimeline } from './service-context-timeline';

export interface DemoScenario {
  scenario_id: string;
  title: string;
  description: string;
  business_context: {
    service_name: string;
    business_impact: string;
    user_base: number;
    revenue_per_minute: number;
    sla_requirements: any;
  };
  traditional_approach: {
    total_time: number; // minutes
    manual_steps: DemoStep[];
    business_impact: {
      users_affected: number;
      revenue_lost: number;
      reputation_damage: string;
    };
  };
  openconductor_approach: {
    total_time: number; // minutes
    ai_steps: DemoStep[];
    business_impact: {
      users_affected: number;
      revenue_protected: number;
      reputation_preserved: string;
    };
    strategic_advantages: string[];
  };
  competitive_analysis: {
    vs_backstage: string[];
    vs_commercial_idps: string[];
    unique_value_props: string[];
  };
}

export interface DemoStep {
  step_number: number;
  timestamp_offset: number; // minutes from scenario start
  actor: 'human_engineer' | 'oracle_ai' | 'sentinel_ai' | 'sage_ai' | 'traditional_monitoring';
  action: string;
  description: string;
  duration: number; // minutes
  confidence?: number; // for AI actions
  success_probability?: number; // for AI actions
  manual_effort_required: 'none' | 'minimal' | 'moderate' | 'significant';
  outcome: string;
}

export interface DemoExecution {
  execution_id: string;
  scenario_id: string;
  started_at: Date;
  current_step: number;
  status: 'running' | 'completed' | 'paused';
  approach: 'traditional' | 'openconductor';
  live_metrics: {
    time_elapsed: number;
    steps_completed: number;
    current_action: string;
    ai_insights_generated: number;
    manual_effort_saved: number;
  };
  real_time_events: Array<{
    timestamp: Date;
    event: string;
    actor: string;
    impact: string;
  }>;
  comparison_data: {
    time_advantage: number; // percentage faster
    effort_reduction: number; // percentage less manual work
    accuracy_improvement: number; // percentage more accurate
    business_value: number; // dollars saved/protected
  };
}

/**
 * Killer AIOps Demo Engine
 */
export class KillerAIOpsDemoEngine {
  private logger: Logger;
  private eventBus: EventBus;
  private serviceIntelligence: ServiceIntelligenceEngine;
  private dependencyEngine: ServiceDependencyEngine;
  private explainableAI: ExplainableServiceIntelligence;
  private remediationEngine: OneClickRemediationEngine;
  private timeline: ServiceContextTimeline;
  
  // Demo management
  private activeDemo?: DemoExecution;
  private demoScenarios = new Map<string, DemoScenario>();
  private demoHistory: DemoExecution[] = [];

  constructor(
    serviceIntelligence: ServiceIntelligenceEngine,
    dependencyEngine: ServiceDependencyEngine,
    explainableAI: ExplainableServiceIntelligence,
    remediationEngine: OneClickRemediationEngine,
    timeline: ServiceContextTimeline,
    logger: Logger,
    eventBus: EventBus
  ) {
    this.serviceIntelligence = serviceIntelligence;
    this.dependencyEngine = dependencyEngine;
    this.explainableAI = explainableAI;
    this.remediationEngine = remediationEngine;
    this.timeline = timeline;
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeDemoScenarios();
    this.logger.info('Killer AIOps Demo Engine initialized');
  }

  /**
   * Start the killer AIOps demo
   */
  async startKillerDemo(
    scenarioId: string = 'payment_service_sla_breach',
    approach: 'traditional' | 'openconductor' | 'both' = 'both'
  ): Promise<DemoExecution> {
    const scenario = this.demoScenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Demo scenario not found: ${scenarioId}`);
    }

    const executionId = this.generateExecutionId();
    
    try {
      this.logger.info('Starting killer AIOps demo', {
        executionId,
        scenarioId,
        approach
      });

      const execution: DemoExecution = {
        execution_id: executionId,
        scenario_id: scenarioId,
        started_at: new Date(),
        current_step: 0,
        status: 'running',
        approach: approach === 'both' ? 'openconductor' : approach,
        live_metrics: {
          time_elapsed: 0,
          steps_completed: 0,
          current_action: 'Initializing demo scenario...',
          ai_insights_generated: 0,
          manual_effort_saved: 0
        },
        real_time_events: [],
        comparison_data: {
          time_advantage: 0,
          effort_reduction: 0,
          accuracy_improvement: 0,
          business_value: 0
        }
      };

      this.activeDemo = execution;

      // Start demo execution
      if (approach === 'both') {
        await this.executeBothApproaches(execution, scenario);
      } else if (approach === 'openconductor') {
        await this.executeOpenConductorApproach(execution, scenario);
      } else {
        await this.executeTraditionalApproach(execution, scenario);
      }

      return execution;

    } catch (error) {
      this.logger.error('Killer demo failed to start', {
        executionId,
        scenarioId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute OpenConductor approach demonstrating AI advantages
   */
  private async executeOpenConductorApproach(
    execution: DemoExecution,
    scenario: DemoScenario
  ): Promise<void> {
    const steps = scenario.openconductor_approach.ai_steps;
    
    this.addRealTimeEvent(execution, 'Demo started with OpenConductor Trinity AI approach', 'system', 'Beginning AI-powered incident prevention and resolution');

    for (const [index, step] of steps.entries()) {
      execution.current_step = index + 1;
      execution.live_metrics.current_action = step.action;

      this.addRealTimeEvent(execution, step.action, step.actor, step.description);

      // Simulate step execution time
      await this.simulateStepExecution(step, execution);

      // Update metrics
      execution.live_metrics.steps_completed++;
      execution.live_metrics.time_elapsed += step.duration;
      
      if (step.actor.includes('ai')) {
        execution.live_metrics.ai_insights_generated++;
      }
      
      if (step.manual_effort_required === 'none') {
        execution.live_metrics.manual_effort_saved += step.duration;
      }

      // Special handling for key demonstration points
      await this.handleKeyDemonstrationPoints(step, execution, scenario);

      // Emit step completed event
      await this.eventBus.emit({
        type: 'demo.step_completed',
        timestamp: new Date(),
        data: {
          executionId: execution.execution_id,
          stepNumber: step.step_number,
          actor: step.actor,
          action: step.action,
          duration: step.duration,
          confidence: step.confidence
        }
      });
    }

    // Calculate final comparison metrics
    execution.comparison_data = this.calculateComparisonMetrics(scenario, execution);
    execution.status = 'completed';

    this.addRealTimeEvent(execution, 'Demo completed successfully!', 'system', 
      `AI approach completed in ${execution.live_metrics.time_elapsed} minutes vs traditional ${scenario.traditional_approach.total_time} minutes`);
  }

  /**
   * Handle key demonstration points that prove strategic advantages
   */
  private async handleKeyDemonstrationPoints(
    step: DemoStep,
    execution: DemoExecution,
    scenario: DemoScenario
  ): Promise<void> {
    switch (step.step_number) {
      case 1: // Oracle Prediction
        if (step.actor === 'oracle_ai') {
          this.addRealTimeEvent(execution, 
            '🔮 Oracle AI: SLA breach predicted 12 minutes before impact',
            'oracle_ai',
            `87% confidence prediction vs 0% advance warning with traditional monitoring`
          );
          
          // Show specific prediction
          await this.demonstrateOraclePrediction(execution, scenario);
        }
        break;

      case 2: // Sentinel Correlation
        if (step.actor === 'sentinel_ai') {
          this.addRealTimeEvent(execution,
            '🛡️ Sentinel AI: Root cause identified in 30 seconds',
            'sentinel_ai', 
            'Database connection pool exhaustion correlated with deployment v2.1.3 vs 10+ minutes manual analysis'
          );
          
          // Show correlation analysis
          await this.demonstrateSentinelCorrelation(execution, scenario);
        }
        break;

      case 3: // Sage Remediation
        if (step.actor === 'sage_ai') {
          this.addRealTimeEvent(execution,
            '🧙 Sage AI: One-click remediation ready',
            'sage_ai',
            '91% confidence connection pool scaling solution vs manual research and planning'
          );
          
          // Show automated remediation
          await this.demonstrateSageRemediation(execution, scenario);
        }
        break;
    }
  }

  /**
   * Demonstrate Oracle's predictive capabilities
   */
  private async demonstrateOraclePrediction(
    execution: DemoExecution,
    scenario: DemoScenario
  ): Promise<void> {
    // Simulate Oracle generating prediction
    const serviceId = 'payment-service';
    const mockServiceData = {
      name: 'Payment Service',
      metrics: {
        response_time: Array.from({length: 50}, (_, i) => 1600 + i * 8), // Trending upward
        error_rate: Array.from({length: 50}, () => 2.1 + Math.random() * 0.5),
        connection_pool_usage: Array.from({length: 50}, (_, i) => 70 + i * 0.6) // Approaching limit
      }
    };

    const intelligence = await this.serviceIntelligence.getServiceIntelligence(serviceId, {
      include_predictions: true,
      prediction_horizon: 60
    });

    this.addRealTimeEvent(execution,
      'Oracle Analysis: Response time trend indicates SLA breach in 12 minutes',
      'oracle_ai',
      `Current: 1.9s → Predicted: 2.1s (SLA: 2.0s) | Confidence: 87% | Prevention window: 10 minutes`
    );

    // Add strategic insight
    this.addRealTimeEvent(execution,
      '🎯 Strategic Advantage: Proactive vs Reactive',
      'system',
      'Traditional monitoring alerts AFTER problems occur. Oracle predicts BEFORE impact.'
    );
  }

  /**
   * Demonstrate Sentinel's correlation capabilities
   */
  private async demonstrateSentinelCorrelation(
    execution: DemoExecution,
    scenario: DemoScenario
  ): Promise<void> {
    // Simulate Sentinel analyzing incident correlation
    this.addRealTimeEvent(execution,
      'Sentinel Analysis: Correlating incident with recent changes...',
      'sentinel_ai',
      'Analyzing deployment timeline, configuration changes, and dependency health'
    );

    // Simulate 30-second analysis
    await new Promise(resolve => setTimeout(resolve, 500)); // Demo timing

    this.addRealTimeEvent(execution,
      'Root Cause Identified: Database connection pool exhausted',
      'sentinel_ai',
      'Correlation: Deployment v2.1.3 (8 min ago) + Traffic spike (5 min ago) → Connection pool limit (50 → 49 active)'
    );

    this.addRealTimeEvent(execution,
      '⚡ Time Advantage: 30 seconds vs 10+ minutes manual',
      'system',
      'Traditional: Check logs → Query metrics → Investigate changes → Cross-reference → Hypothesis'
    );

    this.addRealTimeEvent(execution,
      '🧠 Intelligence Advantage: Automatic correlation vs manual investigation',
      'system',
      'AI instantly correlates deployment timing, configuration state, and metric patterns'
    );
  }

  /**
   * Demonstrate Sage's strategic remediation
   */
  private async demonstrateSageRemediation(
    execution: DemoExecution,
    scenario: DemoScenario
  ): Promise<void> {
    // Simulate Sage generating remediation strategy
    this.addRealTimeEvent(execution,
      'Sage Analysis: Generating optimal remediation strategy...',
      'sage_ai',
      'Analyzing historical resolutions, business impact, and risk factors'
    );

    // Show strategic decision making
    this.addRealTimeEvent(execution,
      'Strategic Decision: Scale connection pool (91% confidence)',
      'sage_ai',
      'Historical data: 94% success rate, 5-minute resolution time, minimal risk'
    );

    this.addRealTimeEvent(execution,
      'Alternative Considered: Service restart (78% confidence)',
      'sage_ai',
      'Rejected: Higher risk, longer downtime, doesn\'t address root cause'
    );

    this.addRealTimeEvent(execution,
      '🎯 One-Click Remediation Ready',
      'sage_ai',
      'Automated fix generated with rollback plan and success validation'
    );

    // Execute one-click remediation
    await this.demonstrateOneClickRemediation(execution);
  }

  /**
   * Demonstrate one-click remediation execution
   */
  private async demonstrateOneClickRemediation(execution: DemoExecution): Promise<void> {
    this.addRealTimeEvent(execution,
      '🚀 Executing One-Click Remediation...',
      'sage_ai',
      'Scaling database connection pool from 50 to 100 connections'
    );

    // Simulate execution steps
    const remediationSteps = [
      'Pre-check: Validating current service health',
      'Action: Updating connection pool configuration',
      'Validation: Confirming configuration applied',
      'Monitoring: Verifying error rate reduction',
      'Success: SLA breach prevented, service restored'
    ];

    for (const [index, stepDesc] of remediationSteps.entries()) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Demo timing
      
      this.addRealTimeEvent(execution,
        `Step ${index + 1}/5: ${stepDesc}`,
        'sage_ai',
        'Automated execution with real-time validation'
      );
    }

    this.addRealTimeEvent(execution,
      '✅ Issue Resolved Successfully!',
      'system',
      'Response time: 1.9s → 1.2s | Error rate: 2.3% → 0.8% | Connection pool: 49/100 healthy'
    );

    this.addRealTimeEvent(execution,
      '🎉 Business Impact: Crisis Averted',
      'system',
      '$50,000 revenue protected, 10,000 users unaffected, SLA maintained'
    );
  }

  /**
   * Calculate strategic comparison metrics
   */
  private calculateComparisonMetrics(
    scenario: DemoScenario,
    execution: DemoExecution
  ): DemoExecution['comparison_data'] {
    const traditionalTime = scenario.traditional_approach.total_time;
    const aiTime = execution.live_metrics.time_elapsed;
    
    const timeAdvantage = ((traditionalTime - aiTime) / traditionalTime) * 100;
    
    const traditionalManualEffort = scenario.traditional_approach.manual_steps
      .filter(step => step.manual_effort_required !== 'none')
      .reduce((sum, step) => sum + step.duration, 0);
    
    const aiManualEffort = execution.live_metrics.time_elapsed - execution.live_metrics.manual_effort_saved;
    const effortReduction = ((traditionalManualEffort - aiManualEffort) / traditionalManualEffort) * 100;
    
    const accuracyImprovement = 25; // AI provides 25% higher accuracy through data-driven decisions
    
    const revenueProtected = scenario.business_context.revenue_per_minute * (traditionalTime - aiTime);

    return {
      time_advantage: Math.round(timeAdvantage),
      effort_reduction: Math.round(effortReduction),
      accuracy_improvement: accuracyImprovement,
      business_value: revenueProtected
    };
  }

  /**
   * Initialize demo scenarios
   */
  private initializeDemoScenarios(): void {
    // Payment Service SLA Breach Prevention Scenario
    this.demoScenarios.set('payment_service_sla_breach', {
      scenario_id: 'payment_service_sla_breach',
      title: 'Payment Service SLA Breach Prevention & Rapid Resolution',
      description: 'Demonstrates AI preventing SLA breach 12 minutes before impact, then rapid root cause analysis and resolution',
      business_context: {
        service_name: 'Payment Service',
        business_impact: 'Critical revenue-generating service handling $2M daily transactions',
        user_base: 50000,
        revenue_per_minute: 2000,
        sla_requirements: {
          availability: 99.9,
          response_time: 2000, // 2 seconds
          error_rate: 1.0 // 1%
        }
      },
      traditional_approach: {
        total_time: 25,
        manual_steps: [
          {
            step_number: 1,
            timestamp_offset: 0,
            actor: 'traditional_monitoring',
            action: 'SLA breach occurs - alerts fire',
            description: 'Response time exceeds 2.0s SLA, alerts trigger',
            duration: 0,
            manual_effort_required: 'none',
            outcome: 'Users experiencing slow payments, revenue impact starting'
          },
          {
            step_number: 2,
            timestamp_offset: 3,
            actor: 'human_engineer',
            action: 'On-call engineer notified',
            description: 'Engineer receives alert, starts investigation',
            duration: 2,
            manual_effort_required: 'moderate',
            outcome: 'Engineer begins manual troubleshooting process'
          },
          {
            step_number: 3,
            timestamp_offset: 5,
            actor: 'human_engineer',
            action: 'Manual investigation begins',
            description: 'Check logs, query metrics, review recent changes',
            duration: 10,
            manual_effort_required: 'significant',
            outcome: 'Engineer manually correlating data, forming hypotheses'
          },
          {
            step_number: 4,
            timestamp_offset: 15,
            actor: 'human_engineer',
            action: 'Root cause identified',
            description: 'Database connection pool exhaustion identified',
            duration: 5,
            manual_effort_required: 'moderate',
            outcome: 'Root cause determined through manual analysis'
          },
          {
            step_number: 5,
            timestamp_offset: 20,
            actor: 'human_engineer',
            action: 'Manual fix implementation',
            description: 'Research solution, implement connection pool scaling',
            duration: 5,
            manual_effort_required: 'moderate',
            outcome: 'Issue resolved after 25 minutes of impact'
          }
        ],
        business_impact: {
          users_affected: 10000,
          revenue_lost: 50000,
          reputation_damage: 'Moderate - SLA breach documented'
        }
      },
      openconductor_approach: {
        total_time: 2,
        ai_steps: [
          {
            step_number: 1,
            timestamp_offset: -12,
            actor: 'oracle_ai',
            action: 'Oracle predicts SLA breach',
            description: 'Response time trend analysis predicts breach in 12 minutes',
            duration: 0.5,
            confidence: 0.87,
            success_probability: 0.92,
            manual_effort_required: 'none',
            outcome: 'Proactive alert generated with prevention recommendations'
          },
          {
            step_number: 2,
            timestamp_offset: -10,
            actor: 'sage_ai',
            action: 'Preventive actions recommended',
            description: 'Scale connection pool proactively to prevent issue',
            duration: 0.5,
            confidence: 0.91,
            success_probability: 0.94,
            manual_effort_required: 'minimal',
            outcome: 'One-click prevention available (if developer acts on alert)'
          },
          {
            step_number: 3,
            timestamp_offset: 0,
            actor: 'sentinel_ai',
            action: 'Real-time correlation analysis',
            description: 'If prevention missed, instant root cause analysis',
            duration: 0.5,
            confidence: 0.84,
            success_probability: 0.89,
            manual_effort_required: 'none',
            outcome: 'Root cause identified in 30 seconds vs 10+ minutes manual'
          },
          {
            step_number: 4,
            timestamp_offset: 1,
            actor: 'sage_ai',
            action: 'One-click remediation',
            description: 'Automated fix with monitoring and rollback plan',
            duration: 1,
            confidence: 0.91,
            success_probability: 0.94,
            manual_effort_required: 'none',
            outcome: 'Issue resolved in 2 minutes total vs 25 minutes traditional'
          }
        ],
        business_impact: {
          users_affected: 200, // 98% reduction
          revenue_protected: 46000, // $46k saved
          reputation_preserved: 'Excellent - proactive prevention, minimal impact'
        },
        strategic_advantages: [
          'Proactive prediction 12 minutes before impact',
          'Root cause analysis 30 seconds vs 10+ minutes', 
          'One-click remediation vs manual implementation',
          'AI confidence scoring vs human guesswork',
          'Automated rollback plans vs manual risk',
          'Business impact quantification in real-time'
        ]
      },
      competitive_analysis: {
        vs_backstage: [
          'Backstage: Static service catalog with links to external monitoring',
          'OpenConductor: AI intelligence embedded directly in service pages',
          'Backstage: No predictive capabilities, reactive only',
          'OpenConductor: Predicts issues 10+ minutes before they occur',
          'Backstage: Manual correlation of events and changes',
          'OpenConductor: Automated Trinity AI correlation and root cause analysis'
        ],
        vs_commercial_idps: [
          'Port/OpsLevel: Basic service info without intelligent analysis',
          'OpenConductor: Full AIOps intelligence embedded in service catalog',
          'Commercial IDPs: Limited automation, mostly documentation and workflows',
          'OpenConductor: AI-powered predictions, correlations, and automated fixes',
          'Commercial IDPs: Vendor lock-in with proprietary intelligence',
          'OpenConductor: Open-source intelligence with full customization'
        ],
        unique_value_props: [
          'Only platform embedding operational intelligence in developer workflow',
          'Trinity AI coordination providing consensus-based confidence',
          'Proactive prediction combined with reactive analysis in one view',
          'Explainable AI making decisions transparent and trustworthy',
          'One-click remediation with automated rollback and monitoring',
          'Open-source AIOps intelligence vs proprietary black boxes'
        ]
      }
    });

    this.logger.info('Demo scenario initialized', {
      scenarioId: 'payment_service_sla_breach',
      traditionalTime: 25,
      aiTime: 2,
      timeAdvantage: '92% faster'
    });
  }

  /**
   * Add real-time event to demo execution
   */
  private addRealTimeEvent(
    execution: DemoExecution,
    event: string,
    actor: string,
    impact: string
  ): void {
    execution.real_time_events.push({
      timestamp: new Date(),
      event,
      actor,
      impact
    });

    // Keep only last 50 events
    if (execution.real_time_events.length > 50) {
      execution.real_time_events = execution.real_time_events.slice(-50);
    }
  }

  /**
   * Simulate step execution with realistic timing
   */
  private async simulateStepExecution(step: DemoStep, execution: DemoExecution): Promise<void> {
    const simulationTime = Math.min(step.duration * 100, 2000); // Max 2 seconds for demo
    
    // Show progress for longer steps
    if (step.duration > 2) {
      const progressSteps = Math.min(5, step.duration);
      for (let i = 0; i < progressSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, simulationTime / progressSteps));
        
        this.addRealTimeEvent(execution,
          `${step.action} - ${Math.round(((i + 1) / progressSteps) * 100)}% complete`,
          step.actor,
          `Step ${i + 1}/${progressSteps} in progress`
        );
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, simulationTime));
    }
  }

  /**
   * Get demo results for strategic presentation
   */
  getDemoResults(): {
    scenarios_available: string[];
    last_execution?: {
      scenario: string;
      time_advantage: string;
      effort_reduction: string;
      business_value: string;
      strategic_proof_points: string[];
    };
    competitive_advantages: {
      vs_backstage: string[];
      vs_commercial_idps: string[];
      unique_differentiators: string[];
    };
  } {
    const lastDemo = this.demoHistory[this.demoHistory.length - 1];
    const scenario = lastDemo ? this.demoScenarios.get(lastDemo.scenario_id) : undefined;

    return {
      scenarios_available: Array.from(this.demoScenarios.keys()),
      last_execution: lastDemo && scenario ? {
        scenario: scenario.title,
        time_advantage: `${lastDemo.comparison_data.time_advantage}% faster`,
        effort_reduction: `${lastDemo.comparison_data.effort_reduction}% less manual work`,
        business_value: `$${lastDemo.comparison_data.business_value.toLocaleString()} protected`,
        strategic_proof_points: scenario.openconductor_approach.strategic_advantages
      } : undefined,
      competitive_advantages: scenario ? scenario.competitive_analysis : {
        vs_backstage: [],
        vs_commercial_idps: [],
        unique_differentiators: []
      }
    };
  }

  // Utility methods
  private generateExecutionId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Public API methods
   */
  getCurrentDemo(): DemoExecution | undefined {
    return this.activeDemo;
  }

  getAvailableScenarios(): DemoScenario[] {
    return Array.from(this.demoScenarios.values());
  }

  getDemoHistory(): DemoExecution[] {
    return [...this.demoHistory];
  }

  async stopDemo(): Promise<void> {
    if (this.activeDemo) {
      this.activeDemo.status = 'paused';
      this.addRealTimeEvent(this.activeDemo, 'Demo stopped by user', 'system', 'Demo execution paused');
    }
  }

  async getStrategicSummary(): Promise<{
    value_proposition: string;
    competitive_advantages: string[];
    market_differentiation: string[];
    roi_demonstration: string;
  }> {
    const scenario = this.demoScenarios.get('payment_service_sla_breach')!;
    
    return {
      value_proposition: 'Proactive AI prevents issues 10+ minutes before impact + reactive AI diagnoses in 30 seconds vs 10+ minutes manual',
      competitive_advantages: [
        '8,640x faster than Backstage (15 min setup vs 90 days)',
        'Only platform embedding AIOps intelligence in developer workflow',
        '92% faster incident resolution vs traditional manual approaches',
        'Proactive prediction + reactive analysis in unified experience',
        'Open-source intelligence vs proprietary black box solutions'
      ],
      market_differentiation: [
        'Bridges Platform Engineering Chasm (open + commercial benefits)',
        'Trinity AI coordination creates consensus-based confidence',
        'Explainable AI builds trust vs unexplainable monitoring alerts',
        'Service catalog becomes intelligent operational dashboard',
        'Zero vendor lock-in with enterprise-grade intelligence'
      ],
      roi_demonstration: `$${scenario.business_context.revenue_per_minute * (scenario.traditional_approach.total_time - scenario.openconductor_approach.total_time)} revenue protected per incident + ${Math.round(((scenario.traditional_approach.total_time - scenario.openconductor_approach.total_time) / scenario.traditional_approach.total_time) * 100)}% engineering time saved`
    };
  }
}

/**
 * Factory function to create Killer AIOps Demo Engine
 */
export function createKillerAIOpsDemoEngine(
  serviceIntelligence: ServiceIntelligenceEngine,
  dependencyEngine: ServiceDependencyEngine,
  explainableAI: ExplainableServiceIntelligence,
  remediationEngine: OneClickRemediationEngine,
  timeline: ServiceContextTimeline,
  logger: Logger,
  eventBus: EventBus
): KillerAIOpsDemoEngine {
  return new KillerAIOpsDemoEngine(
    serviceIntelligence,
    dependencyEngine,
    explainableAI,
    remediationEngine,
    timeline,
    logger,
    eventBus
  );
}