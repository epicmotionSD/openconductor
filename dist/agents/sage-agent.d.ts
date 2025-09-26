/**
 * Sage Agent - Advanced Advisory and Decision Support
 *
 * Trinity AI Pattern: "The intelligence to know what to do"
 *
 * Provides comprehensive advisory capabilities including:
 * - Decision analysis and recommendations
 * - Multi-criteria decision making (MCDM)
 * - Risk assessment and mitigation strategies
 * - Strategic planning and optimization
 * - Knowledge-based expert systems
 */
import { BaseAgent } from './base-agent';
import { AgentConfig, AdvisoryAgent as IAdvisoryAgent } from '../types/agent';
import { Logger } from '../utils/logger';
export type RecommendationType = 'action' | 'strategy' | 'optimization' | 'risk-mitigation' | 'decision';
export type ConfidenceLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'immediate';
export interface DecisionCriteria {
    name: string;
    weight: number;
    type: 'benefit' | 'cost' | 'constraint';
    unit?: string;
    description?: string;
}
export interface Alternative {
    id: string;
    name: string;
    description: string;
    scores: Record<string, number>;
    feasible: boolean;
    metadata?: Record<string, any>;
}
export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    action: string;
    confidence: number;
    impact: ImpactLevel;
    urgency: UrgencyLevel;
    category?: string;
    reasoning: string;
    benefits: string[];
    risks: string[];
    prerequisites?: string[];
    timeline?: {
        immediate?: string[];
        shortTerm?: string[];
        mediumTerm?: string[];
        longTerm?: string[];
    };
    resources?: {
        human?: string[];
        financial?: number;
        technical?: string[];
    };
    alternatives?: string[];
    successMetrics?: string[];
    metadata?: Record<string, any>;
    createdAt: Date;
}
export interface AdvisoryContext {
    domain: string;
    objective: string;
    constraints?: Record<string, any>;
    preferences?: Record<string, number>;
    stakeholders?: string[];
    timeline?: string;
    budget?: number;
    riskTolerance?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
    priorityWeights?: Record<string, number>;
    historicalData?: any[];
    currentState?: Record<string, any>;
}
export interface AdvisoryResult {
    recommendations: Recommendation[];
    analysis: {
        summary: string;
        keyFindings: string[];
        riskAssessment: {
            level: 'low' | 'medium' | 'high' | 'critical';
            factors: string[];
            mitigations: string[];
        };
        opportunityAssessment: {
            level: 'low' | 'medium' | 'high' | 'exceptional';
            areas: string[];
            timeline: string;
        };
    };
    decisionMatrix?: {
        alternatives: Alternative[];
        criteria: DecisionCriteria[];
        scores: Record<string, Record<string, number>>;
        rankings: Array<{
            alternativeId: string;
            score: number;
            rank: number;
        }>;
    };
    reasoning: string;
    confidence: number;
    metadata: {
        analysisMethod: string;
        dataPoints: number;
        processingTime: number;
        version: string;
        timestamp: Date;
    };
}
export declare class SageAgent extends BaseAgent implements IAdvisoryAgent {
    private knowledgeBase;
    private decisionTemplates;
    private recommendationHistory;
    private expertRules;
    constructor(config: AgentConfig, logger: Logger);
    initialize(): Promise<void>;
    execute(input: any, context?: Record<string, any>): Promise<AdvisoryResult>;
    advise<TContext = any, TRecommendation = any>(context: TContext, options?: {
        maxRecommendations?: number;
        confidenceThreshold?: number;
        categories?: string[];
    }): Promise<{
        recommendations: Array<{
            action: string;
            description: string;
            confidence: number;
            impact: 'low' | 'medium' | 'high';
            category?: string;
            metadata?: Record<string, any>;
        }>;
        reasoning?: string;
        metadata?: Record<string, any>;
    }>;
    private generateRecommendations;
    private applyGeneralAdvisoryPatterns;
    private generateOptimizationRecommendations;
    private assessRisks;
    private assessOpportunities;
    private buildDecisionMatrix;
    private rankRecommendations;
    private calculateOverallConfidence;
    private parseNaturalLanguageQuery;
    private inferContext;
    private extractTimeline;
    private hasProcessMetrics;
    private calculateProcessEfficiency;
    private convertImpactToScore;
    private convertUrgencyToScore;
    private estimateFeasibility;
    private estimateRisk;
    private generateReasoning;
    private getRelevantDataPoints;
    private initializeKnowledgeBase;
    private initializeDecisionTemplates;
    private initializeExpertRules;
    addKnowledge(domain: string, knowledge: any): Promise<void>;
    getKnowledge(domain: string): any;
    addExpertRule(domain: string, rule: Function): Promise<void>;
    getRecommendationHistory(limit?: number): Array<{
        context: AdvisoryContext;
        result: AdvisoryResult;
        timestamp: Date;
    }>;
    validateRecommendation(recommendationId: string, outcome: 'successful' | 'failed' | 'partial'): Promise<void>;
}
//# sourceMappingURL=sage-agent.d.ts.map