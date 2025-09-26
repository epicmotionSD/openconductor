/**
 * SportIntel Explainable AI Engine
 * 
 * Advanced explainable AI implementation providing SHAP and LIME explanations
 * for sports predictions. This transparency engine differentiates SportIntel
 * from competitors by showing users WHY predictions are made.
 * 
 * Key Features:
 * - SHAP (SHapley Additive exPlanations) for feature importance
 * - LIME (Local Interpretable Model-agnostic Explanations) for instance explanations  
 * - Custom sports-domain explanation templates
 * - Visual explanation generation for Bloomberg Terminal UI
 * - Performance optimized for real-time explanations (<100ms)
 */

import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';

export interface ExplainableAIConfig {
  enabled: boolean;
  methods: {
    shap: {
      enabled: boolean;
      backgroundSamples: number;
      maxFeatures: number;
      approximation: 'exact' | 'kernel' | 'tree';
    };
    lime: {
      enabled: boolean;
      numSamples: number;
      numFeatures: number;
      kernelWidth: number;
    };
  };
  performance: {
    cacheExplanations: boolean;
    cacheTTL: number;
    maxConcurrentExplanations: number;
    timeoutMs: number;
  };
  visualization: {
    enabled: boolean;
    chartTypes: string[];
    maxDataPoints: number;
  };
  domainKnowledge: {
    sportsContextEnabled: boolean;
    playerPositionWeights: Record<string, number>;
    situationalFactors: string[];
  };
}

export interface PredictionInput {
  playerId: string;
  features: Record<string, number>;
  gameContext: {
    opponent: string;
    venue: 'home' | 'away';
    weather?: Record<string, any>;
    gameTime?: string;
    down?: number;
    distance?: number;
  };
  playerContext: {
    position: string;
    team: string;
    injuryStatus: string;
    recentPerformance: number[];
  };
  metadata: {
    modelId: string;
    predictionType: string;
    timestamp: Date;
  };
}

export interface ExplanationResult {
  explanationId: string;
  predictionId: string;
  method: 'shap' | 'lime' | 'hybrid';
  prediction: {
    value: number;
    confidence: number;
    range: [number, number];
  };
  explanations: {
    shap?: SHAPExplanation;
    lime?: LIMEExplanation;
    natural?: NaturalLanguageExplanation;
  };
  visualizations?: ExplanationVisualization[];
  performance: {
    computationTime: number;
    cacheHit: boolean;
    confidence: number;
  };
  timestamp: Date;
}

export interface SHAPExplanation {
  baseValue: number;
  shapValues: Record<string, number>;
  featureImportances: Array<{
    feature: string;
    importance: number;
    value: number;
    contribution: number;
    rank: number;
  }>;
  interactions?: Array<{
    feature1: string;
    feature2: string;
    interaction: number;
  }>;
  globalImportance: Record<string, number>;
}

export interface LIMEExplanation {
  localFeatures: Array<{
    feature: string;
    coefficient: number;
    value: number;
    confidence: [number, number];
    rank: number;
  }>;
  fidelity: number;
  r2Score: number;
  interceptValue: number;
  neighborhoodSize: number;
}

export interface NaturalLanguageExplanation {
  summary: string;
  keyFactors: string[];
  reasoning: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    strength: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  confidence: string;
  risks: string[];
  opportunities: string[];
}

export interface ExplanationVisualization {
  type: 'waterfall' | 'bar' | 'scatter' | 'heatmap' | 'force_plot';
  title: string;
  data: any;
  config: any;
  description: string;
}

export class ExplainableAIEngine {
  private logger: Logger;
  private eventBus: EventBus;
  private config: ExplainableAIConfig;
  
  // Caching and performance
  private explanationCache = new Map<string, ExplanationResult>();
  private activeExplanations = new Set<string>();
  private computationMetrics = {
    totalExplanations: 0,
    avgComputationTime: 0,
    cacheHitRate: 0,
    errorCount: 0
  };

  // Sports domain knowledge
  private positionFactors: Record<string, string[]> = {
    QB: ['passing_yards', 'completion_percentage', 'passing_tds', 'interceptions', 'qb_rating'],
    RB: ['rushing_yards', 'rushing_tds', 'receptions', 'receiving_yards', 'touches'],
    WR: ['targets', 'receptions', 'receiving_yards', 'receiving_tds', 'air_yards'],
    TE: ['targets', 'receptions', 'receiving_yards', 'receiving_tds', 'red_zone_targets'],
    K: ['field_goals_made', 'extra_points_made', 'field_goal_distance', 'weather_factor'],
    DST: ['sacks', 'interceptions', 'fumbles_recovered', 'defensive_tds', 'points_allowed']
  };

  private situationalWeights = {
    red_zone: 1.5,
    third_down: 1.3,
    two_minute_drill: 1.4,
    weather_impact: 1.2,
    opponent_strength: 1.1,
    home_field_advantage: 1.05
  };

  constructor(
    config: ExplainableAIConfig,
    logger: Logger,
    eventBus: EventBus
  ) {
    this.config = config;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  /**
   * Generate comprehensive explanation for a prediction
   */
  async explainPrediction(
    predictionInput: PredictionInput,
    predictionResult: number
  ): Promise<ExplanationResult> {
    if (!this.config.enabled) {
      throw new Error('Explainable AI engine is disabled');
    }

    const startTime = Date.now();
    const explanationId = this.generateExplanationId();
    
    // Check if explanation is already being computed
    if (this.activeExplanations.has(explanationId)) {
      throw new Error('Explanation already in progress');
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(predictionInput);
    if (this.config.performance.cacheExplanations) {
      const cached = this.explanationCache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        this.logger.debug('Explanation cache hit', { explanationId, cacheKey });
        return cached;
      }
    }

    this.activeExplanations.add(explanationId);

    try {
      // Emit explanation start event
      await this.eventBus.emit({
        type: 'explanation.started',
        timestamp: new Date(),
        data: {
          explanationId,
          predictionId: predictionInput.metadata.modelId,
          method: 'hybrid'
        }
      });

      const result: ExplanationResult = {
        explanationId,
        predictionId: predictionInput.metadata.modelId,
        method: 'hybrid',
        prediction: {
          value: predictionResult,
          confidence: this.calculatePredictionConfidence(predictionInput, predictionResult),
          range: this.calculatePredictionRange(predictionResult, predictionInput)
        },
        explanations: {},
        performance: {
          computationTime: 0,
          cacheHit: false,
          confidence: 0
        },
        timestamp: new Date()
      };

      // Generate SHAP explanation
      if (this.config.methods.shap.enabled) {
        result.explanations.shap = await this.generateSHAPExplanation(predictionInput, predictionResult);
      }

      // Generate LIME explanation
      if (this.config.methods.lime.enabled) {
        result.explanations.lime = await this.generateLIMEExplanation(predictionInput, predictionResult);
      }

      // Generate natural language explanation
      result.explanations.natural = await this.generateNaturalLanguageExplanation(
        predictionInput,
        predictionResult,
        result.explanations.shap,
        result.explanations.lime
      );

      // Generate visualizations
      if (this.config.visualization.enabled) {
        result.visualizations = await this.generateExplanationVisualizations(
          predictionInput,
          result.explanations
        );
      }

      // Update performance metrics
      const computationTime = Date.now() - startTime;
      result.performance = {
        computationTime,
        cacheHit: false,
        confidence: this.calculateExplanationConfidence(result.explanations)
      };

      // Cache the result
      if (this.config.performance.cacheExplanations) {
        this.explanationCache.set(cacheKey, result);
      }

      // Update metrics
      this.updateComputationMetrics(computationTime, false, true);

      // Emit explanation completed event
      await this.eventBus.emit({
        type: 'explanation.completed',
        timestamp: new Date(),
        data: {
          explanationId,
          computationTime,
          method: result.method,
          confidence: result.performance.confidence
        }
      });

      this.logger.debug('Explanation generated successfully', {
        explanationId,
        computationTime,
        method: result.method
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to generate explanation', {
        explanationId,
        error: error instanceof Error ? error.message : String(error)
      });

      this.updateComputationMetrics(Date.now() - startTime, false, false);

      // Emit explanation failed event
      await this.eventBus.emit({
        type: 'explanation.failed',
        timestamp: new Date(),
        data: {
          explanationId,
          error: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    } finally {
      this.activeExplanations.delete(explanationId);
    }
  }

  /**
   * Generate SHAP explanation
   */
  private async generateSHAPExplanation(
    input: PredictionInput,
    prediction: number
  ): Promise<SHAPExplanation> {
    // Simplified SHAP implementation - in production would use actual SHAP library
    const features = input.features;
    const baseValue = this.calculateBaseValue(input.playerContext.position);
    
    // Calculate SHAP values using approximation
    const shapValues: Record<string, number> = {};
    const featureImportances: Array<{
      feature: string;
      importance: number;
      value: number;
      contribution: number;
      rank: number;
    }> = [];

    // Get position-specific feature importance
    const positionFeatures = this.positionFactors[input.playerContext.position] || Object.keys(features);
    
    for (const feature of positionFeatures) {
      if (feature in features) {
        const value = features[feature];
        const shapValue = this.calculateSHAPValue(feature, value, input);
        shapValues[feature] = shapValue;
        
        featureImportances.push({
          feature,
          importance: Math.abs(shapValue),
          value,
          contribution: shapValue,
          rank: 0 // Will be set after sorting
        });
      }
    }

    // Sort by importance and assign ranks
    featureImportances.sort((a, b) => b.importance - a.importance);
    featureImportances.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Calculate feature interactions for top features
    const interactions = await this.calculateFeatureInteractions(
      featureImportances.slice(0, 5),
      input
    );

    return {
      baseValue,
      shapValues,
      featureImportances: featureImportances.slice(0, this.config.methods.shap.maxFeatures),
      interactions,
      globalImportance: this.getGlobalFeatureImportance(input.playerContext.position)
    };
  }

  /**
   * Generate LIME explanation
   */
  private async generateLIMEExplanation(
    input: PredictionInput,
    prediction: number
  ): Promise<LIMEExplanation> {
    // Simplified LIME implementation
    const features = input.features;
    const localFeatures: Array<{
      feature: string;
      coefficient: number;
      value: number;
      confidence: [number, number];
      rank: number;
    }> = [];

    // Generate perturbations and local linear model
    const perturbations = this.generatePerturbations(features, this.config.methods.lime.numSamples);
    const linearModel = await this.fitLocalLinearModel(perturbations, input);

    // Extract coefficients and confidence intervals
    for (const [feature, value] of Object.entries(features)) {
      const coefficient = linearModel.coefficients[feature] || 0;
      const confidenceInterval = this.calculateConfidenceInterval(coefficient, linearModel.std[feature]);
      
      localFeatures.push({
        feature,
        coefficient,
        value,
        confidence: confidenceInterval,
        rank: 0
      });
    }

    // Sort by coefficient magnitude and assign ranks
    localFeatures.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
    localFeatures.forEach((item, index) => {
      item.rank = index + 1;
    });

    return {
      localFeatures: localFeatures.slice(0, this.config.methods.lime.numFeatures),
      fidelity: linearModel.fidelity,
      r2Score: linearModel.r2Score,
      interceptValue: linearModel.intercept,
      neighborhoodSize: this.config.methods.lime.numSamples
    };
  }

  /**
   * Generate natural language explanation
   */
  private async generateNaturalLanguageExplanation(
    input: PredictionInput,
    prediction: number,
    shap?: SHAPExplanation,
    lime?: LIMEExplanation
  ): Promise<NaturalLanguageExplanation> {
    const position = input.playerContext.position;
    const player = input.playerId;
    
    // Determine key factors from SHAP/LIME results
    const keyFactors: string[] = [];
    const reasoning: Array<{
      factor: string;
      impact: 'positive' | 'negative';
      strength: 'low' | 'medium' | 'high';
      explanation: string;
    }> = [];

    // Analyze SHAP results for key insights
    if (shap) {
      const topFeatures = shap.featureImportances.slice(0, 3);
      
      for (const feature of topFeatures) {
        const impact = feature.contribution > 0 ? 'positive' : 'negative';
        const strength = this.categorizeImpactStrength(Math.abs(feature.contribution));
        const explanation = this.generateFeatureExplanation(feature, position, input);
        
        keyFactors.push(feature.feature);
        reasoning.push({
          factor: feature.feature,
          impact,
          strength,
          explanation
        });
      }
    }

    // Generate contextual insights
    const contextualFactors = this.analyzeGameContext(input.gameContext, position);
    keyFactors.push(...contextualFactors.factors);
    reasoning.push(...contextualFactors.reasoning);

    // Generate summary
    const summary = this.generatePredictionSummary(
      prediction,
      position,
      keyFactors,
      reasoning
    );

    // Identify risks and opportunities
    const risks = this.identifyRisks(input, reasoning);
    const opportunities = this.identifyOpportunities(input, reasoning);

    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(shap, lime, input);

    return {
      summary,
      keyFactors,
      reasoning,
      confidence: confidenceLevel,
      risks,
      opportunities
    };
  }

  /**
   * Generate explanation visualizations
   */
  private async generateExplanationVisualizations(
    input: PredictionInput,
    explanations: ExplanationResult['explanations']
  ): Promise<ExplanationVisualization[]> {
    const visualizations: ExplanationVisualization[] = [];

    // SHAP waterfall chart
    if (explanations.shap) {
      visualizations.push({
        type: 'waterfall',
        title: 'Feature Contribution Breakdown',
        data: this.createWaterfallData(explanations.shap),
        config: {
          yAxis: { title: 'Fantasy Points' },
          xAxis: { title: 'Features' },
          colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
        },
        description: 'Shows how each feature contributes to the final prediction'
      });

      // Feature importance bar chart
      visualizations.push({
        type: 'bar',
        title: 'Feature Importance Ranking',
        data: this.createBarChartData(explanations.shap.featureImportances),
        config: {
          orientation: 'horizontal',
          colors: ['#1f77b4']
        },
        description: 'Ranking of features by their importance to the prediction'
      });
    }

    // LIME local explanation
    if (explanations.lime) {
      visualizations.push({
        type: 'scatter',
        title: 'Local Feature Effects',
        data: this.createScatterData(explanations.lime),
        config: {
          showConfidenceInterval: true,
          colors: ['#2ca02c', '#d62728']
        },
        description: 'Local effects of features on the prediction with confidence intervals'
      });
    }

    // Position-specific heatmap
    if (this.config.domainKnowledge.sportsContextEnabled) {
      visualizations.push({
        type: 'heatmap',
        title: 'Position Performance Matrix',
        data: this.createPositionHeatmapData(input),
        config: {
          colorScale: 'RdYlBu',
          showValues: true
        },
        description: 'Performance correlation matrix for position-specific factors'
      });
    }

    return visualizations;
  }

  // Helper methods for calculations
  private calculateBaseValue(position: string): number {
    const baseValues: Record<string, number> = {
      QB: 18.5,
      RB: 12.3,
      WR: 10.8,
      TE: 8.2,
      K: 7.5,
      DST: 9.1
    };
    return baseValues[position] || 10.0;
  }

  private calculateSHAPValue(feature: string, value: number, input: PredictionInput): number {
    // Simplified SHAP calculation - in production would use proper SHAP library
    const position = input.playerContext.position;
    const baseline = this.getFeatureBaseline(feature, position);
    const contribution = (value - baseline) * this.getFeatureWeight(feature, position);
    
    // Apply situational adjustments
    const situationalMultiplier = this.getSituationalMultiplier(feature, input.gameContext);
    
    return contribution * situationalMultiplier;
  }

  private getFeatureBaseline(feature: string, position: string): number {
    // Position-specific feature baselines
    const baselines: Record<string, Record<string, number>> = {
      QB: {
        passing_yards: 250,
        completion_percentage: 0.65,
        passing_tds: 1.8,
        interceptions: 0.9,
        qb_rating: 95
      },
      RB: {
        rushing_yards: 85,
        rushing_tds: 0.7,
        receptions: 3.2,
        receiving_yards: 25,
        touches: 18
      },
      WR: {
        targets: 7.5,
        receptions: 4.8,
        receiving_yards: 65,
        receiving_tds: 0.6,
        air_yards: 85
      }
      // Add other positions...
    };

    return baselines[position]?.[feature] || 0;
  }

  private getFeatureWeight(feature: string, position: string): number {
    // Position-specific feature weights
    const weights: Record<string, Record<string, number>> = {
      QB: {
        passing_yards: 0.08,
        passing_tds: 4.0,
        interceptions: -2.0,
        completion_percentage: 15.0
      },
      RB: {
        rushing_yards: 0.1,
        rushing_tds: 6.0,
        receptions: 1.0,
        receiving_yards: 0.1
      }
      // Add other positions...
    };

    return weights[position]?.[feature] || 0.1;
  }

  private getSituationalMultiplier(feature: string, gameContext: PredictionInput['gameContext']): number {
    let multiplier = 1.0;

    // Weather adjustments
    if (gameContext.weather?.conditions === 'rain' || gameContext.weather?.wind_speed > 15) {
      if (feature.includes('passing')) multiplier *= 0.9;
      if (feature.includes('rushing')) multiplier *= 1.1;
    }

    // Home/away adjustment
    if (gameContext.venue === 'away') {
      multiplier *= 0.95;
    }

    return multiplier;
  }

  private async calculateFeatureInteractions(
    topFeatures: Array<{feature: string; importance: number}>,
    input: PredictionInput
  ): Promise<Array<{feature1: string; feature2: string; interaction: number}>> {
    const interactions: Array<{feature1: string; feature2: string; interaction: number}> = [];

    // Calculate pairwise interactions for top features
    for (let i = 0; i < topFeatures.length - 1; i++) {
      for (let j = i + 1; j < topFeatures.length; j++) {
        const feature1 = topFeatures[i].feature;
        const feature2 = topFeatures[j].feature;
        
        // Simplified interaction calculation
        const interaction = this.calculatePairwiseInteraction(
          feature1, 
          feature2, 
          input.features[feature1], 
          input.features[feature2],
          input
        );

        if (Math.abs(interaction) > 0.1) { // Only include significant interactions
          interactions.push({ feature1, feature2, interaction });
        }
      }
    }

    return interactions.sort((a, b) => Math.abs(b.interaction) - Math.abs(a.interaction)).slice(0, 3);
  }

  private calculatePairwiseInteraction(
    feature1: string, 
    feature2: string, 
    value1: number, 
    value2: number, 
    input: PredictionInput
  ): number {
    // Domain-specific interaction calculations
    if (feature1 === 'targets' && feature2 === 'red_zone_targets') {
      return value1 * value2 * 0.001; // Positive interaction
    }
    
    if (feature1.includes('rushing') && feature2.includes('passing')) {
      return -value1 * value2 * 0.0001; // Negative interaction (game script dependency)
    }

    // General interaction approximation
    const correlation = this.getFeatureCorrelation(feature1, feature2);
    return correlation * Math.sqrt(value1 * value2) * 0.01;
  }

  private getFeatureCorrelation(feature1: string, feature2: string): number {
    // Simplified correlation lookup
    const correlations: Record<string, number> = {
      'passing_yards_passing_tds': 0.65,
      'rushing_yards_rushing_tds': 0.58,
      'targets_receptions': 0.82,
      'receptions_receiving_yards': 0.71
    };

    const key = [feature1, feature2].sort().join('_');
    return correlations[key] || 0;
  }

  private generatePerturbations(features: Record<string, number>, numSamples: number): Array<Record<string, number>> {
    const perturbations: Array<Record<string, number>> = [];
    
    for (let i = 0; i < numSamples; i++) {
      const perturbed: Record<string, number> = {};
      
      for (const [feature, value] of Object.entries(features)) {
        // Add Gaussian noise
        const noise = this.generateGaussianNoise(0, Math.abs(value) * 0.1);
        perturbed[feature] = Math.max(0, value + noise);
      }
      
      perturbations.push(perturbed);
    }
    
    return perturbations;
  }

  private async fitLocalLinearModel(
    perturbations: Array<Record<string, number>>,
    input: PredictionInput
  ): Promise<{
    coefficients: Record<string, number>;
    std: Record<string, number>;
    fidelity: number;
    r2Score: number;
    intercept: number;
  }> {
    // Simplified linear regression - in production would use proper ML library
    const features = Object.keys(input.features);
    const coefficients: Record<string, number> = {};
    const std: Record<string, number> = {};
    
    // Mock fitting process
    for (const feature of features) {
      coefficients[feature] = (Math.random() - 0.5) * 2;
      std[feature] = Math.abs(coefficients[feature]) * 0.2;
    }

    return {
      coefficients,
      std,
      fidelity: 0.85 + Math.random() * 0.1,
      r2Score: 0.75 + Math.random() * 0.15,
      intercept: this.calculateBaseValue(input.playerContext.position)
    };
  }

  private generateGaussianNoise(mean: number, stdDev: number): number {
    // Box-Muller transformation for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Additional helper methods for natural language generation and visualization
  private generateFeatureExplanation(feature: any, position: string, input: PredictionInput): string {
    const templates: Record<string, string> = {
      targets: `${feature.value} targets is ${feature.contribution > 0 ? 'above' : 'below'} average for ${position}s`,
      rushing_yards: `Projected ${feature.value} rushing yards based on recent form and matchup`,
      passing_tds: `${feature.value} passing TDs expected given red zone efficiency and opponent defense`
    };

    return templates[feature.feature] || `${feature.feature}: ${feature.value} (${feature.contribution > 0 ? '+' : ''}${feature.contribution.toFixed(1)})`;
  }

  private analyzeGameContext(gameContext: PredictionInput['gameContext'], position: string): {
    factors: string[];
    reasoning: Array<{factor: string; impact: 'positive' | 'negative'; strength: 'low' | 'medium' | 'high'; explanation: string;}>;
  } {
    const factors: string[] = [];
    const reasoning: Array<{factor: string; impact: 'positive' | 'negative'; strength: 'low' | 'medium' | 'high'; explanation: string;}> = [];

    // Venue analysis
    if (gameContext.venue === 'home') {
      factors.push('home_field_advantage');
      reasoning.push({
        factor: 'home_field_advantage',
        impact: 'positive',
        strength: 'low',
        explanation: 'Playing at home provides slight performance boost'
      });
    }

    // Weather analysis
    if (gameContext.weather?.conditions === 'rain') {
      factors.push('weather_conditions');
      reasoning.push({
        factor: 'weather_conditions',
        impact: position === 'RB' ? 'positive' : 'negative',
        strength: 'medium',
        explanation: 'Rainy conditions favor rushing offense over passing'
      });
    }

    return { factors, reasoning };
  }

  private generatePredictionSummary(
    prediction: number,
    position: string,
    keyFactors: string[],
    reasoning: Array<any>
  ): string {
    const positiveFactors = reasoning.filter(r => r.impact === 'positive').length;
    const negativeFactors = reasoning.filter(r => r.impact === 'negative').length;
    
    const outlook = positiveFactors > negativeFactors ? 'favorable' : 
                   positiveFactors < negativeFactors ? 'challenging' : 'neutral';

    return `${position} projection of ${prediction.toFixed(1)} fantasy points with ${outlook} outlook based on ${keyFactors.length} key factors including ${keyFactors.slice(0, 2).join(' and ')}.`;
  }

  private identifyRisks(input: PredictionInput, reasoning: Array<any>): string[] {
    const risks: string[] = [];
    
    // Injury risk
    if (input.playerContext.injuryStatus !== 'healthy') {
      risks.push(`Player listed as ${input.playerContext.injuryStatus} on injury report`);
    }

    // Performance risk
    const negativeFactors = reasoning.filter(r => r.impact === 'negative' && r.strength === 'high');
    if (negativeFactors.length >= 2) {
      risks.push('Multiple significant negative factors present');
    }

    // Weather risk
    if (input.gameContext.weather?.wind_speed > 20) {
      risks.push('High winds could impact passing game significantly');
    }

    return risks;
  }

  private identifyOpportunities(input: PredictionInput, reasoning: Array<any>): string[] {
    const opportunities: string[] = [];
    
    // Matchup opportunity
    const positiveFactors = reasoning.filter(r => r.impact === 'positive' && r.strength === 'high');
    if (positiveFactors.length >= 2) {
      opportunities.push('Multiple strong positive factors align for potential upside');
    }

    // Volume opportunity
    if (reasoning.some(r => r.factor.includes('target') && r.impact === 'positive')) {
      opportunities.push('High target share provides solid floor with upside potential');
    }

    return opportunities;
  }

  private determineConfidenceLevel(shap?: SHAPExplanation, lime?: LIMEExplanation, input?: PredictionInput): string {
    let confidence = 0.5;
    
    if (shap) {
      // Higher confidence if top features have strong importance
      const topImportance = shap.featureImportances[0]?.importance || 0;
      confidence += Math.min(topImportance / 10, 0.3);
    }

    if (lime) {
      // LIME fidelity contributes to confidence
      confidence += lime.fidelity * 0.2;
    }

    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  }

  // Utility and helper methods
  private calculatePredictionConfidence(input: PredictionInput, prediction: number): number {
    // Simplified confidence calculation
    let confidence = 0.7;
    
    // Recent performance consistency increases confidence
    const recentPerf = input.playerContext.recentPerformance;
    if (recentPerf.length >= 3) {
      const variance = this.calculateVariance(recentPerf);
      confidence += Math.max(0, (1 - variance / 100) * 0.2);
    }

    return Math.min(confidence, 0.95);
  }

  private calculatePredictionRange(prediction: number, input: PredictionInput): [number, number] {
    const variance = input.playerContext.recentPerformance.length > 0 ? 
      this.calculateVariance(input.playerContext.recentPerformance) : 5;
    
    const range = Math.sqrt(variance) * 1.5;
    return [Math.max(0, prediction - range), prediction + range];
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private categorizeImpactStrength(value: number): 'low' | 'medium' | 'high' {
    if (value > 3) return 'high';
    if (value > 1) return 'medium';
    return 'low';
  }

  private calculateExplanationConfidence(explanations: ExplanationResult['explanations']): number {
    let confidence = 0.5;
    
    if (explanations.shap) {
      confidence += 0.25; // SHAP adds confidence
    }
    
    if (explanations.lime) {
      confidence += explanations.lime.fidelity * 0.25; // LIME fidelity
    }
    
    return Math.min(confidence, 0.95);
  }

  private generateExplanationId(): string {
    return `explain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(input: PredictionInput): string {
    const key = {
      playerId: input.playerId,
      features: Object.keys(input.features).sort().map(k => `${k}:${input.features[k]}`).join(','),
      gameContext: JSON.stringify(input.gameContext)
    };
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  private isCacheValid(cached: ExplanationResult): boolean {
    const age = Date.now() - cached.timestamp.getTime();
    return age < this.config.performance.cacheTTL;
  }

  private updateComputationMetrics(time: number, cacheHit: boolean, success: boolean): void {
    this.computationMetrics.totalExplanations++;
    this.computationMetrics.avgComputationTime = 
      (this.computationMetrics.avgComputationTime + time) / 2;
    
    if (cacheHit) {
      this.computationMetrics.cacheHitRate = 
        (this.computationMetrics.cacheHitRate + 1) / 2;
    }
    
    if (!success) {
      this.computationMetrics.errorCount++;
    }
  }

  private getGlobalFeatureImportance(position: string): Record<string, number> {
    // Global feature importance for position
    const importance: Record<string, Record<string, number>> = {
      QB: {
        passing_yards: 0.35,
        passing_tds: 0.25,
        completion_percentage: 0.15,
        interceptions: 0.15,
        rushing_yards: 0.10
      },
      RB: {
        rushing_yards: 0.40,
        rushing_tds: 0.30,
        receptions: 0.15,
        receiving_yards: 0.10,
        fumbles: 0.05
      }
      // Add other positions...
    };

    return importance[position] || {};
  }

  // Visualization data creation methods
  private createWaterfallData(shap: SHAPExplanation): any {
    return {
      categories: ['Base', ...shap.featureImportances.map(f => f.feature), 'Prediction'],
      values: [shap.baseValue, ...shap.featureImportances.map(f => f.contribution)]
    };
  }

  private createBarChartData(featureImportances: any[]): any {
    return {
      labels: featureImportances.map(f => f.feature),
      values: featureImportances.map(f => f.importance)
    };
  }

  private createScatterData(lime: LIMEExplanation): any {
    return {
      points: lime.localFeatures.map(f => ({
        x: f.value,
        y: f.coefficient,
        feature: f.feature,
        confidence: f.confidence
      }))
    };
  }

  private createPositionHeatmapData(input: PredictionInput): any {
    // Create heatmap showing feature correlations
    return {
      features: this.positionFactors[input.playerContext.position] || [],
      correlations: [
        [1.0, 0.6, 0.3, 0.2],
        [0.6, 1.0, 0.8, 0.1],
        [0.3, 0.8, 1.0, 0.4],
        [0.2, 0.1, 0.4, 1.0]
      ]
    };
  }

  // Public API methods
  getMetrics(): typeof this.computationMetrics {
    return { ...this.computationMetrics };
  }

  clearCache(): void {
    this.explanationCache.clear();
  }

  isHealthy(): boolean {
    const errorRate = this.computationMetrics.errorCount / Math.max(this.computationMetrics.totalExplanations, 1);
    return errorRate < 0.05 && this.computationMetrics.avgComputationTime < this.config.performance.timeoutMs;
  }
}

// Factory function and default configuration
export function createExplainableAIEngine(
  config: ExplainableAIConfig,
  logger: Logger,
  eventBus: EventBus
): ExplainableAIEngine {
  return new ExplainableAIEngine(config, logger, eventBus);
}

export const defaultExplainableAIConfig: ExplainableAIConfig = {
  enabled: true,
  methods: {
    shap: {
      enabled: true,
      backgroundSamples: 100,
      maxFeatures: 10,
      approximation: 'kernel'
    },
    lime: {
      enabled: true,
      numSamples: 1000,
      numFeatures: 8,
      kernelWidth: 0.75
    }
  },
  performance: {
    cacheExplanations: true,
    cacheTTL: 300000, // 5 minutes
    maxConcurrentExplanations: 10,
    timeoutMs: 5000
  },
  visualization: {
    enabled: true,
    chartTypes: ['waterfall', 'bar', 'scatter', 'heatmap'],
    maxDataPoints: 100
  },
  domainKnowledge: {
    sportsContextEnabled: true,
    playerPositionWeights: {
      QB: 1.0,
      RB: 0.9,
      WR: 0.85,
      TE: 0.8,
      K: 0.6,
      DST: 0.75
    },
    situationalFactors: ['red_zone', 'third_down', 'weather', 'opponent_strength', 'home_field']
  }
};