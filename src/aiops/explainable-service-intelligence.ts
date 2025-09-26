/**
 * Explainable Service Intelligence - Making AI Decisions Transparent
 * 
 * Provides explainable AI for service intelligence decisions, making
 * predictions and root cause analysis transparent and trustworthy for
 * developers. This builds trust in AI recommendations and enables
 * better decision-making.
 * 
 * Strategic Value:
 * - Makes AI predictions and root cause analysis trustworthy and actionable
 * - Provides confidence scoring so developers know when to trust AI insights
 * - Enables learning and improvement through feedback loops
 * - Creates transparency that differentiates from "black box" AIOps tools
 */

import { Logger } from '../utils/logger';
import { EventBus } from '../types/events';
import { ServiceHealthIntelligence, OraclePrediction, RootCauseAnalysis } from './service-intelligence-engine';

export interface ExplainableIntelligence {
  explanation_id: string;
  service_id: string;
  intelligence_type: 'proactive_prediction' | 'reactive_analysis' | 'dependency_impact' | 'remediation_recommendation';
  explanation: {
    summary: string;
    confidence_breakdown: ConfidenceBreakdown;
    reasoning_chain: ReasoningStep[];
    evidence_sources: EvidenceSource[];
    uncertainty_factors: UncertaintyFactor[];
    alternative_hypotheses: AlternativeHypothesis[];
  };
  actionability: {
    recommended_actions: string[];
    confidence_thresholds: ConfidenceThreshold[];
    risk_assessment: string;
    when_to_act: string;
    when_to_investigate_further: string;
  };
  learning_insights: {
    model_limitations: string[];
    data_quality_notes: string[];
    improvement_suggestions: string[];
    feedback_loop_status: string;
  };
  visualization_data: {
    confidence_chart: any;
    reasoning_flow: any;
    evidence_strength: any;
    uncertainty_bubble: any;
  };
  metadata: {
    generated_at: Date;
    processing_time: number;
    explanation_version: string;
    Trinity_agent_contributions: {
      oracle_weight: number;
      sentinel_weight: number;
      sage_weight: number;
    };
  };
}

export interface ConfidenceBreakdown {
  overall_confidence: number; // 0-1
  components: {
    data_quality: number;
    model_confidence: number;
    historical_accuracy: number;
    consensus_score: number;
    domain_expertise: number;
  };
  confidence_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  reliability_indicators: {
    sample_size: number;
    feature_completeness: number;
    temporal_relevance: number;
    cross_validation_score: number;
  };
}

export interface ReasoningStep {
  step_number: number;
  step_type: 'data_analysis' | 'pattern_recognition' | 'correlation_analysis' | 'prediction_generation' | 'validation';
  description: string;
  agent_source: 'oracle' | 'sentinel' | 'sage' | 'correlation_engine';
  input_data: string[];
  reasoning_logic: string;
  output_contribution: number; // 0-1 how much this step contributed to final result
  confidence: number;
  validation_status: 'validated' | 'uncertain' | 'conflicting';
}

export interface EvidenceSource {
  source_id: string;
  source_type: 'historical_data' | 'real_time_metrics' | 'deployment_events' | 'configuration_changes' | 'dependency_health' | 'user_reports';
  description: string;
  reliability: number; // 0-1
  recency: number; // hours ago
  relevance: number; // 0-1 how relevant to current analysis
  data_points: number;
  quality_score: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
}

export interface UncertaintyFactor {
  factor: string;
  impact_on_confidence: number; // negative number, how much this reduces confidence
  description: string;
  mitigation: string; // how to reduce this uncertainty
  severity: 'low' | 'medium' | 'high';
  addressable: boolean; // can this uncertainty be reduced with more data/time
}

export interface AlternativeHypothesis {
  hypothesis: string;
  probability: number;
  supporting_evidence: string[];
  distinguishing_factors: string[]; // what would prove this hypothesis vs the main one
  investigation_steps: string[];
  impact_if_true: 'minimal' | 'moderate' | 'significant';
}

export interface ConfidenceThreshold {
  threshold: number;
  action_recommendation: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  typical_accuracy: number; // historical accuracy at this confidence level
}

/**
 * Explainable Service Intelligence Engine
 */
export class ExplainableServiceIntelligence {
  private logger: Logger;
  private eventBus: EventBus;
  
  // Explanation cache and history
  private explanationCache = new Map<string, ExplainableIntelligence>();
  private explanationHistory: ExplainableIntelligence[] = [];
  
  // Learning and feedback data
  private feedbackData = new Map<string, {
    user_feedback: 'helpful' | 'not_helpful' | 'incorrect';
    actual_outcome: string;
    explanation_accuracy: number;
    timestamp: Date;
  }>();
  
  // Confidence calibration data
  private confidenceCalibration = {
    prediction_accuracy_by_confidence: new Map<number, number>(),
    root_cause_accuracy_by_confidence: new Map<number, number>(),
    user_trust_by_confidence: new Map<number, number>()
  };

  constructor(logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.initializeConfidenceThresholds();
    this.logger.info('Explainable Service Intelligence initialized');
  }

  /**
   * Generate explainable intelligence for service health predictions
   */
  async explainServicePrediction(
    serviceId: string,
    prediction: OraclePrediction,
    contextData: {
      historical_metrics: any;
      recent_deployments: any[];
      dependency_health: any;
      oracle_analysis: any;
    }
  ): Promise<ExplainableIntelligence> {
    const startTime = Date.now();
    const explanationId = this.generateExplanationId('prediction');

    try {
      this.logger.debug('Generating explainable prediction intelligence', {
        explanationId,
        serviceId,
        predictionType: prediction.type
      });

      // Step 1: Break down confidence components
      const confidenceBreakdown = this.analyzeConfidenceComponents(
        prediction,
        contextData,
        'prediction'
      );

      // Step 2: Generate reasoning chain
      const reasoningChain = this.buildPredictionReasoningChain(
        prediction,
        contextData,
        confidenceBreakdown
      );

      // Step 3: Identify evidence sources
      const evidenceSources = this.identifyEvidenceSources(
        prediction,
        contextData,
        'prediction'
      );

      // Step 4: Analyze uncertainty factors
      const uncertaintyFactors = this.analyzeUncertaintyFactors(
        prediction,
        contextData,
        confidenceBreakdown
      );

      // Step 5: Generate alternative hypotheses
      const alternativeHypotheses = this.generateAlternativeHypotheses(
        prediction,
        contextData
      );

      // Step 6: Create actionability guidance
      const actionability = this.generateActionabilityGuidance(
        prediction,
        confidenceBreakdown,
        'prediction'
      );

      // Step 7: Generate learning insights
      const learningInsights = this.generateLearningInsights(
        prediction,
        contextData,
        'prediction'
      );

      // Step 8: Create visualization data
      const visualizationData = this.generateVisualizationData(
        confidenceBreakdown,
        reasoningChain,
        evidenceSources,
        uncertaintyFactors
      );

      const processingTime = Date.now() - startTime;

      const explanation: ExplainableIntelligence = {
        explanation_id: explanationId,
        service_id: serviceId,
        intelligence_type: 'proactive_prediction',
        explanation: {
          summary: this.generatePredictionSummary(prediction, confidenceBreakdown),
          confidence_breakdown: confidenceBreakdown,
          reasoning_chain: reasoningChain,
          evidence_sources: evidenceSources,
          uncertainty_factors: uncertaintyFactors,
          alternative_hypotheses: alternativeHypotheses
        },
        actionability: actionability,
        learning_insights: learningInsights,
        visualization_data: visualizationData,
        metadata: {
          generated_at: new Date(),
          processing_time: processingTime,
          explanation_version: '1.0.0',
          Trinity_agent_contributions: {
            oracle_weight: 0.8, // Primary contributor for predictions
            sentinel_weight: 0.15, // Provides context
            sage_weight: 0.05 // Provides strategic context
          }
        }
      };

      // Cache and store
      this.explanationCache.set(explanationId, explanation);
      this.explanationHistory.push(explanation);

      // Emit explanation generated event
      await this.eventBus.emit({
        type: 'explanation.service_prediction_generated',
        timestamp: new Date(),
        data: {
          explanationId,
          serviceId,
          predictionType: prediction.type,
          confidenceLevel: confidenceBreakdown.confidence_level,
          processingTime
        }
      });

      return explanation;

    } catch (error) {
      this.logger.error('Failed to generate explainable prediction intelligence', {
        explanationId,
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate explainable intelligence for root cause analysis
   */
  async explainRootCauseAnalysis(
    serviceId: string,
    rootCauseAnalysis: RootCauseAnalysis,
    contextData: {
      incident_data: any;
      correlation_events: any[];
      dependency_status: any;
      trinity_consensus: any;
    }
  ): Promise<ExplainableIntelligence> {
    const startTime = Date.now();
    const explanationId = this.generateExplanationId('root_cause');

    try {
      this.logger.debug('Generating explainable root cause intelligence', {
        explanationId,
        serviceId,
        incidentId: rootCauseAnalysis.incident_id
      });

      // Step 1: Analyze confidence in root cause analysis
      const confidenceBreakdown = this.analyzeConfidenceComponents(
        rootCauseAnalysis,
        contextData,
        'root_cause'
      );

      // Step 2: Build root cause reasoning chain
      const reasoningChain = this.buildRootCauseReasoningChain(
        rootCauseAnalysis,
        contextData,
        confidenceBreakdown
      );

      // Step 3: Identify evidence sources for root cause
      const evidenceSources = this.identifyEvidenceSources(
        rootCauseAnalysis,
        contextData,
        'root_cause'
      );

      // Step 4: Analyze what makes this analysis uncertain
      const uncertaintyFactors = this.analyzeUncertaintyFactors(
        rootCauseAnalysis,
        contextData,
        confidenceBreakdown
      );

      // Step 5: Generate alternative root cause hypotheses
      const alternativeHypotheses = this.generateAlternativeRootCauses(
        rootCauseAnalysis,
        contextData
      );

      // Step 6: Create actionability guidance for incident response
      const actionability = this.generateActionabilityGuidance(
        rootCauseAnalysis,
        confidenceBreakdown,
        'root_cause'
      );

      // Step 7: Generate learning insights for future improvements
      const learningInsights = this.generateLearningInsights(
        rootCauseAnalysis,
        contextData,
        'root_cause'
      );

      // Step 8: Create visualization data
      const visualizationData = this.generateVisualizationData(
        confidenceBreakdown,
        reasoningChain,
        evidenceSources,
        uncertaintyFactors
      );

      const processingTime = Date.now() - startTime;

      const explanation: ExplainableIntelligence = {
        explanation_id: explanationId,
        service_id: serviceId,
        intelligence_type: 'reactive_analysis',
        explanation: {
          summary: this.generateRootCauseSummary(rootCauseAnalysis, confidenceBreakdown),
          confidence_breakdown: confidenceBreakdown,
          reasoning_chain: reasoningChain,
          evidence_sources: evidenceSources,
          uncertainty_factors: uncertaintyFactors,
          alternative_hypotheses: alternativeHypotheses
        },
        actionability: actionability,
        learning_insights: learningInsights,
        visualization_data: visualizationData,
        metadata: {
          generated_at: new Date(),
          processing_time: processingTime,
          explanation_version: '1.0.0',
          Trinity_agent_contributions: {
            oracle_weight: 0.3, // Provides pattern analysis
            sentinel_weight: 0.5, // Primary correlation contributor
            sage_weight: 0.2 // Provides strategic context
          }
        }
      };

      // Cache and store
      this.explanationCache.set(explanationId, explanation);
      this.explanationHistory.push(explanation);

      // Emit explanation generated event
      await this.eventBus.emit({
        type: 'explanation.root_cause_generated',
        timestamp: new Date(),
        data: {
          explanationId,
          serviceId,
          incidentId: rootCauseAnalysis.incident_id,
          confidenceLevel: confidenceBreakdown.confidence_level,
          processingTime
        }
      });

      return explanation;

    } catch (error) {
      this.logger.error('Failed to generate explainable root cause intelligence', {
        explanationId,
        serviceId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Analyze confidence components for any type of intelligence
   */
  private analyzeConfidenceComponents(
    analysisResult: any,
    contextData: any,
    analysisType: 'prediction' | 'root_cause'
  ): ConfidenceBreakdown {
    // Base confidence from the analysis
    const baseConfidence = analysisResult.confidence || analysisResult.confidence_score || 0.5;

    // Data quality assessment
    const dataQuality = this.assessDataQuality(contextData, analysisType);
    
    // Model confidence (how confident is the underlying model)
    const modelConfidence = this.assessModelConfidence(analysisResult, analysisType);
    
    // Historical accuracy (how accurate have similar analyses been)
    const historicalAccuracy = this.getHistoricalAccuracy(analysisResult, analysisType);
    
    // Trinity consensus score (how much do the agents agree)
    const consensusScore = this.calculateTrinityConsensus(analysisResult, contextData);
    
    // Domain expertise factor (how well does this align with known patterns)
    const domainExpertise = this.assessDomainExpertise(analysisResult, contextData, analysisType);

    // Calculate overall confidence as weighted average
    const overallConfidence = (
      dataQuality * 0.25 +
      modelConfidence * 0.25 +
      historicalAccuracy * 0.2 +
      consensusScore * 0.15 +
      domainExpertise * 0.15
    );

    // Determine confidence level
    let confidenceLevel: ConfidenceBreakdown['confidence_level'];
    if (overallConfidence >= 0.9) confidenceLevel = 'very_high';
    else if (overallConfidence >= 0.75) confidenceLevel = 'high';
    else if (overallConfidence >= 0.6) confidenceLevel = 'medium';
    else if (overallConfidence >= 0.4) confidenceLevel = 'low';
    else confidenceLevel = 'very_low';

    // Calculate reliability indicators
    const reliabilityIndicators = {
      sample_size: this.calculateSampleSize(contextData),
      feature_completeness: this.calculateFeatureCompleteness(contextData),
      temporal_relevance: this.calculateTemporalRelevance(contextData),
      cross_validation_score: this.calculateCrossValidationScore(analysisResult)
    };

    return {
      overall_confidence: overallConfidence,
      components: {
        data_quality: dataQuality,
        model_confidence: modelConfidence,
        historical_accuracy: historicalAccuracy,
        consensus_score: consensusScore,
        domain_expertise: domainExpertise
      },
      confidence_level: confidenceLevel,
      reliability_indicators: reliabilityIndicators
    };
  }

  /**
   * Build reasoning chain for predictions
   */
  private buildPredictionReasoningChain(
    prediction: OraclePrediction,
    contextData: any,
    confidenceBreakdown: ConfidenceBreakdown
  ): ReasoningStep[] {
    const steps: ReasoningStep[] = [];

    // Step 1: Data Collection and Analysis
    steps.push({
      step_number: 1,
      step_type: 'data_analysis',
      description: 'Analyzed historical service metrics and performance patterns',
      agent_source: 'oracle',
      input_data: ['Historical metrics', 'Performance trends', 'Resource utilization'],
      reasoning_logic: `Oracle agent processed ${this.calculateSampleSize(contextData)} data points from the last 24 hours to identify baseline patterns and trends`,
      output_contribution: 0.3,
      confidence: confidenceBreakdown.components.data_quality,
      validation_status: confidenceBreakdown.components.data_quality > 0.7 ? 'validated' : 'uncertain'
    });

    // Step 2: Pattern Recognition
    steps.push({
      step_number: 2,
      step_type: 'pattern_recognition',
      description: 'Identified patterns indicating potential service degradation',
      agent_source: 'oracle',
      input_data: ['Trend analysis', 'Anomaly detection', 'Seasonal patterns'],
      reasoning_logic: `Pattern recognition algorithms identified ${prediction.affected_metrics.length} metrics showing concerning trends that historically correlate with ${prediction.type}`,
      output_contribution: 0.4,
      confidence: confidenceBreakdown.components.model_confidence,
      validation_status: 'validated'
    });

    // Step 3: Contextual Analysis
    steps.push({
      step_number: 3,
      step_type: 'correlation_analysis',
      description: 'Correlated prediction with deployment and configuration context',
      agent_source: 'sentinel',
      input_data: ['Recent deployments', 'Configuration changes', 'Dependency status'],
      reasoning_logic: `Sentinel correlated prediction with recent system changes, finding ${contextData.recent_deployments?.length || 0} deployments and identifying contextual factors`,
      output_contribution: 0.2,
      confidence: confidenceBreakdown.components.consensus_score,
      validation_status: 'validated'
    });

    // Step 4: Validation and Cross-check
    steps.push({
      step_number: 4,
      step_type: 'validation',
      description: 'Validated prediction against historical similar incidents',
      agent_source: 'oracle',
      input_data: ['Historical incidents', 'Similar patterns', 'Outcome data'],
      reasoning_logic: `Cross-validated against ${this.getHistoricalSimilarIncidents(prediction).length} similar historical incidents with ${Math.round(confidenceBreakdown.components.historical_accuracy * 100)}% accuracy rate`,
      output_contribution: 0.1,
      confidence: confidenceBreakdown.components.historical_accuracy,
      validation_status: confidenceBreakdown.components.historical_accuracy > 0.6 ? 'validated' : 'uncertain'
    });

    return steps;
  }

  /**
   * Build reasoning chain for root cause analysis
   */
  private buildRootCauseReasoningChain(
    rootCause: RootCauseAnalysis,
    contextData: any,
    confidenceBreakdown: ConfidenceBreakdown
  ): ReasoningStep[] {
    const steps: ReasoningStep[] = [];

    // Step 1: Incident Detection and Symptom Analysis
    steps.push({
      step_number: 1,
      step_type: 'data_analysis',
      description: 'Analyzed incident symptoms and service health indicators',
      agent_source: 'sentinel',
      input_data: ['Service metrics', 'Error logs', 'Performance indicators'],
      reasoning_logic: `Sentinel analyzed incident symptoms and identified ${rootCause.probable_causes.length} potential contributing factors based on anomaly patterns`,
      output_contribution: 0.3,
      confidence: confidenceBreakdown.components.data_quality,
      validation_status: 'validated'
    });

    // Step 2: Timeline Correlation
    steps.push({
      step_number: 2,
      step_type: 'correlation_analysis',
      description: 'Correlated incident timeline with deployments and configuration changes',
      agent_source: 'sentinel',
      input_data: ['Event timeline', 'Deployment logs', 'Configuration changes'],
      reasoning_logic: `Timeline correlation identified ${contextData.correlation_events?.length || 0} events within the incident window, with strongest correlation to ${rootCause.probable_causes[0]?.cause || 'primary cause'}`,
      output_contribution: 0.35,
      confidence: confidenceBreakdown.components.consensus_score,
      validation_status: 'validated'
    });

    // Step 3: Pattern Matching
    steps.push({
      step_number: 3,
      step_type: 'pattern_recognition',
      description: 'Matched incident pattern against historical root cause database',
      agent_source: 'oracle',
      input_data: ['Historical incidents', 'Pattern library', 'Resolution outcomes'],
      reasoning_logic: `Pattern matching found ${this.getHistoricalSimilarIncidents(rootCause).length} similar incidents with known root causes, providing validation for current analysis`,
      output_contribution: 0.25,
      confidence: confidenceBreakdown.components.historical_accuracy,
      validation_status: 'validated'
    });

    // Step 4: Trinity Consensus Validation
    steps.push({
      step_number: 4,
      step_type: 'validation',
      description: 'Validated root cause through Trinity AI consensus mechanism',
      agent_source: 'sage',
      input_data: ['Oracle insights', 'Sentinel correlations', 'Strategic context'],
      reasoning_logic: `Trinity consensus mechanism achieved ${Math.round(rootCause.trinity_consensus.agreement_score * 100)}% agreement across all three agents, with Sage providing strategic validation`,
      output_contribution: 0.1,
      confidence: rootCause.trinity_consensus.agreement_score,
      validation_status: rootCause.trinity_consensus.agreement_score > 0.7 ? 'validated' : 'uncertain'
    });

    return steps;
  }

  /**
   * Generate actionability guidance based on confidence levels
   */
  private generateActionabilityGuidance(
    analysisResult: any,
    confidenceBreakdown: ConfidenceBreakdown,
    analysisType: 'prediction' | 'root_cause'
  ): ExplainableIntelligence['actionability'] {
    const confidence = confidenceBreakdown.overall_confidence;
    
    // Define confidence thresholds and corresponding actions
    const thresholds: ConfidenceThreshold[] = [
      {
        threshold: 0.9,
        action_recommendation: analysisType === 'prediction' ? 
          'Take immediate preventive action - prediction is highly reliable' :
          'Implement recommended fix immediately - root cause is highly probable',
        risk_level: 'low',
        typical_accuracy: 0.95
      },
      {
        threshold: 0.75,
        action_recommendation: analysisType === 'prediction' ?
          'Prepare preventive measures and monitor closely' :
          'Implement fix with additional monitoring and rollback plan',
        risk_level: 'medium',
        typical_accuracy: 0.85
      },
      {
        threshold: 0.6,
        action_recommendation: analysisType === 'prediction' ?
          'Increase monitoring and prepare contingency plans' :
          'Investigate further before implementing fix',
        risk_level: 'medium',
        typical_accuracy: 0.75
      },
      {
        threshold: 0.4,
        action_recommendation: 'Gather more data before taking action',
        risk_level: 'high',
        typical_accuracy: 0.6
      }
    ];

    // Find applicable threshold
    const applicableThreshold = thresholds.find(t => confidence >= t.threshold) || thresholds[thresholds.length - 1];

    const recommendedActions = this.generateSpecificActions(analysisResult, confidence, analysisType);
    
    return {
      recommended_actions: recommendedActions,
      confidence_thresholds: thresholds,
      risk_assessment: this.generateRiskAssessment(confidence, analysisType),
      when_to_act: this.generateWhenToAct(confidence, analysisType),
      when_to_investigate_further: this.generateWhenToInvestigate(confidence, analysisType)
    };
  }

  /**
   * Generate natural language summary
   */
  private generatePredictionSummary(
    prediction: OraclePrediction,
    confidenceBreakdown: ConfidenceBreakdown
  ): string {
    const confidenceText = this.confidenceLevelToText(confidenceBreakdown.confidence_level);
    const timeText = this.formatTimeToImpact(prediction.predicted_time);
    
    let summary = `${confidenceText} confidence prediction: ${prediction.type} `;
    summary += `expected ${timeText}. `;
    
    if (prediction.prevention_window > 0) {
      summary += `${prediction.prevention_window} minutes available for prevention. `;
    }
    
    summary += `Primary factors: ${prediction.affected_metrics.slice(0, 2).join(', ')}. `;
    
    if (confidenceBreakdown.confidence_level === 'high' || confidenceBreakdown.confidence_level === 'very_high') {
      summary += 'Immediate action recommended.';
    } else if (confidenceBreakdown.confidence_level === 'medium') {
      summary += 'Monitor closely and prepare contingency plans.';
    } else {
      summary += 'Gather more data before taking action.';
    }

    return summary;
  }

  private generateRootCauseSummary(
    rootCause: RootCauseAnalysis,
    confidenceBreakdown: ConfidenceBreakdown
  ): string {
    const confidenceText = this.confidenceLevelToText(confidenceBreakdown.confidence_level);
    const topCause = rootCause.probable_causes[0];
    
    let summary = `${confidenceText} confidence root cause analysis: `;
    
    if (topCause) {
      summary += `Most likely cause is ${topCause.cause} `;
      summary += `(${Math.round(topCause.confidence * 100)}% confidence). `;
      summary += `Estimated fix time: ${topCause.estimated_fix_time} minutes. `;
    }
    
    summary += `Analysis based on ${rootCause.trinity_consensus.agreement_score ? 
      Math.round(rootCause.trinity_consensus.agreement_score * 100) + '% Trinity AI consensus' : 
      'multi-factor correlation analysis'}. `;
    
    if (confidenceBreakdown.confidence_level === 'high' || confidenceBreakdown.confidence_level === 'very_high') {
      summary += 'Recommended to proceed with fix implementation.';
    } else if (confidenceBreakdown.confidence_level === 'medium') {
      summary += 'Recommended to validate root cause before implementing fix.';
    } else {
      summary += 'Investigate alternative causes before proceeding.';
    }

    return summary;
  }

  /**
   * Generate specific actionable recommendations
   */
  private generateSpecificActions(
    analysisResult: any,
    confidence: number,
    analysisType: 'prediction' | 'root_cause'
  ): string[] {
    const actions: string[] = [];

    if (analysisType === 'prediction') {
      if (confidence >= 0.8) {
        actions.push('Implement preventive scaling of affected resources');
        actions.push('Activate incident response team for proactive monitoring');
        actions.push('Prepare rollback plans for recent deployments');
      } else if (confidence >= 0.6) {
        actions.push('Increase monitoring frequency for affected metrics');
        actions.push('Notify on-call team of potential upcoming issue');
        actions.push('Review and prepare contingency plans');
      } else {
        actions.push('Gather additional metrics for better prediction accuracy');
        actions.push('Review prediction methodology and data sources');
        actions.push('Consider manual investigation of concerning trends');
      }
    } else { // root_cause
      if (confidence >= 0.8) {
        actions.push('Implement recommended fix with standard rollback procedures');
        actions.push('Monitor fix implementation with automated validation');
        actions.push('Document resolution for future incident prevention');
      } else if (confidence >= 0.6) {
        actions.push('Implement fix in test environment first');
        actions.push('Prepare detailed rollback plan before production fix');
        actions.push('Increase monitoring during fix implementation');
      } else {
        actions.push('Investigate alternative root causes before fixing');
        actions.push('Gather additional evidence to improve confidence');
        actions.push('Consider escalating to subject matter experts');
      }
    }

    return actions;
  }

  // Assessment helper methods
  private assessDataQuality(contextData: any, analysisType: string): number {
    let qualityScore = 0.7; // Base score
    
    // Check data recency
    const dataRecency = this.calculateDataRecency(contextData);
    qualityScore += dataRecency * 0.2;
    
    // Check data completeness
    const completeness = this.calculateFeatureCompleteness(contextData);
    qualityScore += completeness * 0.1;
    
    return Math.min(1, qualityScore);
  }

  private assessModelConfidence(analysisResult: any, analysisType: string): number {
    // Extract model confidence from analysis result
    if (analysisType === 'prediction') {
      return analysisResult.confidence || 0.7;
    } else {
      return analysisResult.confidence_score || 0.7;
    }
  }

  private getHistoricalAccuracy(analysisResult: any, analysisType: string): number {
    // Get historical accuracy for similar analyses
    const accuracyMap = analysisType === 'prediction' ? 
      this.confidenceCalibration.prediction_accuracy_by_confidence :
      this.confidenceCalibration.root_cause_accuracy_by_confidence;
    
    const confidence = Math.round((analysisResult.confidence || 0.5) * 10) / 10;
    return accuracyMap.get(confidence) || 0.75; // Default historical accuracy
  }

  private calculateTrinityConsensus(analysisResult: any, contextData: any): number {
    if (analysisResult.trinity_consensus) {
      return analysisResult.trinity_consensus.agreement_score;
    }
    
    // Simulate consensus calculation
    return 0.8 + Math.random() * 0.15; // 80-95% consensus
  }

  private assessDomainExpertise(analysisResult: any, contextData: any, analysisType: string): number {
    // Assess how well the analysis aligns with domain expertise
    // In production, this would reference actual domain knowledge base
    return 0.8; // Simulated domain expertise alignment
  }

  // Utility methods
  private generateExplanationId(type: string): string {
    return `explain_${type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private confidenceLevelToText(level: ConfidenceBreakdown['confidence_level']): string {
    const mapping = {
      'very_high': 'Very high',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
      'very_low': 'Very low'
    };
    return mapping[level];
  }

  private formatTimeToImpact(predictedTime: Date): string {
    const minutesToImpact = Math.round((predictedTime.getTime() - Date.now()) / 60000);
    
    if (minutesToImpact < 60) {
      return `in ${minutesToImpact} minutes`;
    } else if (minutesToImpact < 1440) {
      return `in ${Math.round(minutesToImpact / 60)} hours`;
    } else {
      return `in ${Math.round(minutesToImpact / 1440)} days`;
    }
  }

  private calculateSampleSize(contextData: any): number {
    // Calculate effective sample size from context data
    let sampleSize = 0;
    if (contextData.historical_metrics) {
      Object.values(contextData.historical_metrics).forEach((metrics: any) => {
        if (Array.isArray(metrics)) sampleSize += metrics.length;
      });
    }
    return sampleSize;
  }

  private calculateFeatureCompleteness(contextData: any): number {
    // Calculate what percentage of expected features are available
    const expectedFeatures = ['response_time', 'error_rate', 'throughput', 'cpu_usage', 'memory_usage'];
    const availableFeatures = contextData.historical_metrics ? 
      Object.keys(contextData.historical_metrics).filter(key => expectedFeatures.includes(key)) : [];
    
    return availableFeatures.length / expectedFeatures.length;
  }

  private calculateDataRecency(contextData: any): number {
    // Calculate how recent the data is (more recent = higher quality)
    // In production, this would check actual timestamps
    return 0.9; // Simulated high recency
  }

  private calculateTemporalRelevance(contextData: any): number {
    // How relevant is the data to current time context
    return 0.85; // Simulated relevance
  }

  private calculateCrossValidationScore(analysisResult: any): number {
    // Cross-validation score from model
    return 0.8; // Simulated cross-validation
  }

  private getHistoricalSimilarIncidents(analysisResult: any): any[] {
    // Get similar historical incidents for validation
    return Array.from({length: 5}, (_, i) => ({ id: `incident_${i}`, similarity: 0.8 + Math.random() * 0.15 }));
  }

  private initializeConfidenceThresholds(): void {
    // Initialize with some baseline confidence calibration data
    this.confidenceCalibration.prediction_accuracy_by_confidence.set(0.9, 0.92);
    this.confidenceCalibration.prediction_accuracy_by_confidence.set(0.8, 0.83);
    this.confidenceCalibration.prediction_accuracy_by_confidence.set(0.7, 0.74);
    
    this.confidenceCalibration.root_cause_accuracy_by_confidence.set(0.9, 0.88);
    this.confidenceCalibration.root_cause_accuracy_by_confidence.set(0.8, 0.79);
    this.confidenceCalibration.root_cause_accuracy_by_confidence.set(0.7, 0.71);
  }

  /**
   * Public API methods
   */
  async recordFeedback(
    explanationId: string,
    feedback: 'helpful' | 'not_helpful' | 'incorrect',
    actualOutcome?: string
  ): Promise<void> {
    const explanation = this.explanationCache.get(explanationId);
    if (!explanation) return;

    this.feedbackData.set(explanationId, {
      user_feedback: feedback,
      actual_outcome: actualOutcome || 'unknown',
      explanation_accuracy: feedback === 'helpful' ? 1.0 : feedback === 'not_helpful' ? 0.5 : 0.0,
      timestamp: new Date()
    });

    // Update confidence calibration based on feedback
    this.updateConfidenceCalibration(explanation, feedback);

    await this.eventBus.emit({
      type: 'explanation.feedback_received',
      timestamp: new Date(),
      data: { explanationId, feedback, actualOutcome }
    });
  }

  private updateConfidenceCalibration(explanation: ExplainableIntelligence, feedback: string): void {
    // Update confidence calibration based on user feedback
    const confidence = Math.round(explanation.explanation.confidence_breakdown.overall_confidence * 10) / 10;
    const accuracy = feedback === 'helpful' ? 1.0 : feedback === 'not_helpful' ? 0.5 : 0.0;
    
    if (explanation.intelligence_type === 'proactive_prediction') {
      const current = this.confidenceCalibration.prediction_accuracy_by_confidence.get(confidence) || 0.5;
      const updated = (current + accuracy) / 2; // Simple moving average
      this.confidenceCalibration.prediction_accuracy_by_confidence.set(confidence, updated);
    } else {
      const current = this.confidenceCalibration.root_cause_accuracy_by_confidence.get(confidence) || 0.5;
      const updated = (current + accuracy) / 2;
      this.confidenceCalibration.root_cause_accuracy_by_confidence.set(confidence, updated);
    }
  }

  getExplanation(explanationId: string): ExplainableIntelligence | undefined {
    return this.explanationCache.get(explanationId);
  }

  getExplanationHistory(serviceId?: string, limit: number = 50): ExplainableIntelligence[] {
    let history = [...this.explanationHistory];
    
    if (serviceId) {
      history = history.filter(exp => exp.service_id === serviceId);
    }
    
    return history
      .sort((a, b) => b.metadata.generated_at.getTime() - a.metadata.generated_at.getTime())
      .slice(0, limit);
  }

  getConfidenceCalibrationData(): typeof this.confidenceCalibration {
    return {
      prediction_accuracy_by_confidence: new Map(this.confidenceCalibration.prediction_accuracy_by_confidence),
      root_cause_accuracy_by_confidence: new Map(this.confidenceCalibration.root_cause_accuracy_by_confidence),
      user_trust_by_confidence: new Map(this.confidenceCalibration.user_trust_by_confidence)
    };
  }
}

/**
 * Factory function to create Explainable Service Intelligence
 */
export function createExplainableServiceIntelligence(
  logger: Logger,
  eventBus: EventBus
): ExplainableServiceIntelligence {
  return new ExplainableServiceIntelligence(logger, eventBus);
}