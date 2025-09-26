/**
 * Intelligent Service Page - The Killer AIOps Feature UI
 * 
 * Revolutionary service page that embeds Trinity AI intelligence directly
 * where developers work daily. Shows proactive predictions, reactive root
 * cause analysis, and strategic recommendations in one integrated view.
 * 
 * Strategic Differentiation:
 * - No competitor offers this level of AI integration in service catalogs
 * - Transforms static service pages into intelligent operational dashboards
 * - Provides both proactive predictions and reactive root cause analysis
 * - Enables one-click remediation actions with AI-generated confidence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/trinity-card';

interface ServiceIntelligenceData {
  service_id: string;
  service_name: string;
  current_status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  proactive_insights: {
    oracle_predictions: Array<{
      type: string;
      predicted_time: Date;
      confidence: number;
      severity: string;
      prevention_window: number;
      prediction_reasoning: string;
    }>;
    health_trends: Array<{
      metric_name: string;
      trend_direction: string;
      confidence: number;
      predicted_values: Array<{ timestamp: Date; value: number; confidence: number }>;
    }>;
    predictive_alerts: Array<{
      title: string;
      description: string;
      time_to_impact: number;
      confidence: number;
      auto_remediation_available: boolean;
    }>;
  };
  reactive_analysis: {
    current_incidents: Array<{
      incident_id: string;
      severity: string;
      affected_components: string[];
      detected_at: Date;
    }>;
    root_cause_analysis: Array<{
      analysis_id: string;
      probable_causes: Array<{
        cause: string;
        confidence: number;
        fix_difficulty: string;
        estimated_fix_time: number;
      }>;
      explanation: {
        summary: string;
        technical_details: string;
      };
      confidence_score: number;
    }>;
  };
  strategic_recommendations: {
    sage_actions: Array<{
      title: string;
      description: string;
      confidence: number;
      estimated_resolution_time: number;
      one_click_available: boolean;
      sage_reasoning: string;
    }>;
    automated_runbooks: Array<{
      title: string;
      steps: string[];
      estimated_time: number;
      success_probability: number;
    }>;
  };
  dependency_health: {
    critical_dependencies: Array<{
      service_name: string;
      health_status: string;
      impact_if_failed: string;
      trend: string;
    }>;
    blast_radius: {
      tier_1: string[];
      tier_2: string[];
      tier_3: string[];
    };
  };
}

interface IntelligentServicePageProps {
  serviceId: string;
  onRemediationAction: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}

const IntelligentServicePage: React.FC<IntelligentServicePageProps> = ({
  serviceId,
  onRemediationAction,
  onFeedback
}) => {
  const [serviceData, setServiceData] = useState<ServiceIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'incidents' | 'dependencies'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch service intelligence data
  const fetchServiceIntelligence = useCallback(async () => {
    try {
      // In production, this would call the actual service intelligence API
      const mockData: ServiceIntelligenceData = {
        service_id: serviceId,
        service_name: `Payment Service`,
        current_status: 'degraded',
        proactive_insights: {
          oracle_predictions: [
            {
              type: 'sla_breach',
              predicted_time: new Date(Date.now() + 12 * 60 * 1000), // 12 minutes from now
              confidence: 0.87,
              severity: 'high',
              prevention_window: 10,
              prediction_reasoning: 'Response time trending toward 2.1s, approaching SLA threshold of 2.0s based on current load patterns'
            },
            {
              type: 'resource_exhaustion',
              predicted_time: new Date(Date.now() + 25 * 60 * 1000), // 25 minutes from now
              confidence: 0.74,
              severity: 'medium',
              prevention_window: 20,
              prediction_reasoning: 'Memory usage following exponential growth pattern, predicted to exceed 90% threshold'
            }
          ],
          health_trends: [
            {
              metric_name: 'response_time',
              trend_direction: 'degrading',
              confidence: 0.92,
              predicted_values: Array.from({length: 10}, (_, i) => ({
                timestamp: new Date(Date.now() + i * 5 * 60 * 1000),
                value: 1800 + i * 20,
                confidence: 0.9 - i * 0.05
              }))
            },
            {
              metric_name: 'error_rate',
              trend_direction: 'stable',
              confidence: 0.85,
              predicted_values: Array.from({length: 10}, (_, i) => ({
                timestamp: new Date(Date.now() + i * 5 * 60 * 1000),
                value: 2.1 + Math.random() * 0.3,
                confidence: 0.85
              }))
            }
          ],
          predictive_alerts: [
            {
              title: 'SLA Breach Imminent',
              description: 'Response time will exceed 2.0s SLA in approximately 12 minutes',
              time_to_impact: 12,
              confidence: 0.87,
              auto_remediation_available: true
            }
          ]
        },
        reactive_analysis: {
          current_incidents: [
            {
              incident_id: 'INC-2024-001',
              severity: 'major',
              affected_components: ['payment-api', 'user-session'],
              detected_at: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
            }
          ],
          root_cause_analysis: [
            {
              analysis_id: 'RCA-001',
              probable_causes: [
                {
                  cause: 'Database connection pool exhaustion due to recent traffic spike',
                  confidence: 0.84,
                  fix_difficulty: 'moderate',
                  estimated_fix_time: 15
                },
                {
                  cause: 'Memory leak in payment processor introduced in v2.1.3 deployment',
                  confidence: 0.71,
                  fix_difficulty: 'complex',
                  estimated_fix_time: 45
                }
              ],
              explanation: {
                summary: 'High confidence root cause analysis identifies database connection pool exhaustion as primary issue',
                technical_details: 'Connection pool reached maximum capacity of 50 connections at 14:23 UTC, correlating with 300% traffic increase from promotional campaign'
              },
              confidence_score: 0.84
            }
          ]
        },
        strategic_recommendations: {
          sage_actions: [
            {
              title: 'Scale Database Connection Pool',
              description: 'Increase connection pool size from 50 to 100 connections',
              confidence: 0.91,
              estimated_resolution_time: 5,
              one_click_available: true,
              sage_reasoning: 'Historical data shows connection pool scaling resolves 94% of similar incidents within 5 minutes'
            },
            {
              title: 'Enable Auto-scaling',
              description: 'Activate horizontal pod autoscaling for payment service',
              confidence: 0.88,
              estimated_resolution_time: 10,
              one_click_available: true,
              sage_reasoning: 'Auto-scaling will prevent future resource exhaustion and handle traffic spikes automatically'
            }
          ],
          automated_runbooks: [
            {
              title: 'Emergency Database Pool Recovery',
              steps: [
                'Scale connection pool to 100 connections',
                'Restart payment service instances',
                'Verify error rate reduction',
                'Monitor for 15 minutes'
              ],
              estimated_time: 8,
              success_probability: 0.94
            }
          ]
        },
        dependency_health: {
          critical_dependencies: [
            {
              service_name: 'payments-db',
              health_status: 'degraded',
              impact_if_failed: 'critical',
              trend: 'degrading'
            },
            {
              service_name: 'auth-service',
              health_status: 'healthy',
              impact_if_failed: 'high',
              trend: 'stable'
            },
            {
              service_name: 'notification-service',
              health_status: 'healthy',
              impact_if_failed: 'medium',
              trend: 'improving'
            }
          ],
          blast_radius: {
            tier_1: ['user-dashboard', 'mobile-app'],
            tier_2: ['analytics-service', 'reporting-api'],
            tier_3: ['audit-service']
          }
        }
      };

      setServiceData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch service intelligence:', error);
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchServiceIntelligence();
    
    // Auto-refresh every 30 seconds if enabled
    const interval = autoRefresh ? setInterval(fetchServiceIntelligence, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchServiceIntelligence, autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Trinity AI intelligence...</p>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load service intelligence</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Header with Intelligent Status */}
      <ServiceIntelligenceHeader serviceData={serviceData} />
      
      {/* Proactive Intelligence Section */}
      <ProactiveIntelligenceSection 
        predictions={serviceData.proactive_insights}
        onPreventiveAction={onRemediationAction}
        onFeedback={onFeedback}
      />
      
      {/* Reactive Intelligence Section */}
      {serviceData.reactive_analysis.current_incidents.length > 0 && (
        <ReactiveIntelligenceSection
          incidents={serviceData.reactive_analysis}
          onRemediationAction={onRemediationAction}
          onFeedback={onFeedback}
        />
      )}
      
      {/* Strategic Recommendations */}
      <StrategicRecommendationsSection
        recommendations={serviceData.strategic_recommendations}
        onActionExecute={onRemediationAction}
        onFeedback={onFeedback}
      />
      
      {/* Dependency Health and Impact Analysis */}
      <DependencyHealthSection
        dependencyHealth={serviceData.dependency_health}
        serviceId={serviceId}
      />
      
      {/* Trinity AI Insights Panel */}
      <TrinityAIInsightsPanel serviceData={serviceData} />
    </div>
  );
};

// Service Intelligence Header Component
const ServiceIntelligenceHeader: React.FC<{ serviceData: ServiceIntelligenceData }> = ({ serviceData }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'text-green-400 bg-green-500/10',
      degraded: 'text-yellow-400 bg-yellow-500/10',
      unhealthy: 'text-orange-400 bg-orange-500/10',
      critical: 'text-red-400 bg-red-500/10'
    };
    return colors[status as keyof typeof colors] || colors.healthy;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '🔶',
      critical: '🚨'
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  return (
    <Card className="bg-gray-800/50 border border-cyan-500/20">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{getStatusIcon(serviceData.current_status)}</div>
          <div>
            <h1 className="text-2xl font-bold text-white">{serviceData.service_name}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(serviceData.current_status)}`}>
                {serviceData.current_status.toUpperCase()}
              </span>
              <span className="text-gray-400 text-sm">Service ID: {serviceData.service_id}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-cyan-400 text-sm font-medium">Trinity AI Intelligence</div>
          <div className="text-gray-300 text-sm">
            🔮 Oracle • 🛡️ Sentinel • 🧙 Sage
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Proactive Intelligence Section
const ProactiveIntelligenceSection: React.FC<{
  predictions: ServiceIntelligenceData['proactive_insights'];
  onPreventiveAction: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ predictions, onPreventiveAction, onFeedback }) => {
  return (
    <Card className="bg-gray-800/50 border border-blue-500/20">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔮</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-blue-400">Oracle Proactive Intelligence</h2>
            <p className="text-gray-400 text-sm">Predictive insights and early warning system</p>
          </div>
        </div>

        {/* Predictive Alerts */}
        {predictions.predictive_alerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">🚨 Predictive Alerts</h3>
            <div className="space-y-3">
              {predictions.predictive_alerts.map((alert, index) => (
                <PredictiveAlertCard
                  key={index}
                  alert={alert}
                  onPreventiveAction={onPreventiveAction}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          </div>
        )}

        {/* Health Trends */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">📈 Health Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predictions.health_trends.map((trend, index) => (
              <HealthTrendCard key={index} trend={trend} />
            ))}
          </div>
        </div>

        {/* Oracle Predictions */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">🔮 Oracle Predictions</h3>
          <div className="space-y-3">
            {predictions.oracle_predictions.map((prediction, index) => (
              <OraclePredictionCard key={index} prediction={prediction} onFeedback={onFeedback} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Reactive Intelligence Section
const ReactiveIntelligenceSection: React.FC<{
  incidents: ServiceIntelligenceData['reactive_analysis'];
  onRemediationAction: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ incidents, onRemediationAction, onFeedback }) => {
  return (
    <Card className="bg-gray-800/50 border border-red-500/20">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🛡️</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400">Sentinel Reactive Intelligence</h2>
            <p className="text-gray-400 text-sm">AI-powered root cause analysis and incident correlation</p>
          </div>
        </div>

        {/* Current Incidents */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">🚨 Active Incidents</h3>
          <div className="space-y-3">
            {incidents.current_incidents.map((incident, index) => (
              <IncidentCard key={index} incident={incident} />
            ))}
          </div>
        </div>

        {/* Root Cause Analysis */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">🔍 AI Root Cause Analysis</h3>
          <div className="space-y-4">
            {incidents.root_cause_analysis.map((analysis, index) => (
              <RootCauseAnalysisCard
                key={index}
                analysis={analysis}
                onRemediationAction={onRemediationAction}
                onFeedback={onFeedback}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Strategic Recommendations Section  
const StrategicRecommendationsSection: React.FC<{
  recommendations: ServiceIntelligenceData['strategic_recommendations'];
  onActionExecute: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ recommendations, onActionExecute, onFeedback }) => {
  return (
    <Card className="bg-gray-800/50 border border-purple-500/20">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🧙</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-purple-400">Sage Strategic Intelligence</h2>
            <p className="text-gray-400 text-sm">AI-powered remediation actions and strategic recommendations</p>
          </div>
        </div>

        {/* One-Click Remediation Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">⚡ One-Click Remediation</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.sage_actions
              .filter(action => action.one_click_available)
              .map((action, index) => (
                <OneClickRemediationCard
                  key={index}
                  action={action}
                  onExecute={onActionExecute}
                  onFeedback={onFeedback}
                />
              ))}
          </div>
        </div>

        {/* Automated Runbooks */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">📋 Automated Runbooks</h3>
          <div className="space-y-3">
            {recommendations.automated_runbooks.map((runbook, index) => (
              <AutomatedRunbookCard key={index} runbook={runbook} onExecute={onActionExecute} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Individual Card Components
const PredictiveAlertCard: React.FC<{
  alert: any;
  onPreventiveAction: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ alert, onPreventiveAction, onFeedback }) => (
  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-yellow-400 font-medium">{alert.title}</span>
          <ConfidenceBadge confidence={alert.confidence} />
        </div>
        <p className="text-gray-300 text-sm mb-3">{alert.description}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>⏱️ Impact in {alert.time_to_impact} minutes</span>
          <span>🎯 {Math.round(alert.confidence * 100)}% confidence</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        {alert.auto_remediation_available && (
          <button
            onClick={() => onPreventiveAction(`prevent_${alert.title}`)}
            className="px-3 py-1 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-400 transition-colors"
          >
            Prevent Issue
          </button>
        )}
        <FeedbackButtons
          onFeedback={(feedback) => onFeedback(`alert_${alert.title}`, feedback)}
        />
      </div>
    </div>
  </div>
);

const RootCauseAnalysisCard: React.FC<{
  analysis: any;
  onRemediationAction: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ analysis, onRemediationAction, onFeedback }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-red-400 font-medium">Root Cause Analysis</span>
          <ConfidenceBadge confidence={analysis.confidence_score} />
        </div>
        <p className="text-gray-300 text-sm">{analysis.explanation.summary}</p>
      </div>
      
      <FeedbackButtons
        onFeedback={(feedback) => onFeedback(analysis.analysis_id, feedback)}
      />
    </div>

    <div className="space-y-3">
      <h4 className="text-white font-medium">Probable Causes:</h4>
      {analysis.probable_causes.map((cause: any, index: number) => (
        <div key={index} className="bg-gray-700/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm">{cause.cause}</span>
            <div className="flex items-center space-x-2">
              <ConfidenceBadge confidence={cause.confidence} />
              <span className={`px-2 py-1 text-xs rounded ${
                cause.fix_difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                cause.fix_difficulty === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {cause.fix_difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>🛠️ Est. fix time: {cause.estimated_fix_time} min</span>
            <span>🎯 {Math.round(cause.confidence * 100)}% confident</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OneClickRemediationCard: React.FC<{
  action: any;
  onExecute: (actionId: string) => void;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ action, onExecute, onFeedback }) => (
  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-green-400 font-medium">{action.title}</span>
          <ConfidenceBadge confidence={action.confidence} />
        </div>
        <p className="text-gray-300 text-sm mb-2">{action.description}</p>
        <div className="text-xs text-gray-400">
          ⏱️ {action.estimated_resolution_time} min • 🧙 {action.sage_reasoning}
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-between">
      <FeedbackButtons
        onFeedback={(feedback) => onFeedback(action.title, feedback)}
      />
      
      <button
        onClick={() => onExecute(action.title)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
      >
        Execute Fix
      </button>
    </div>
  </div>
);

// Supporting Components
const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  const getColor = () => {
    if (percentage >= 90) return 'bg-green-500/20 text-green-400';
    if (percentage >= 75) return 'bg-blue-500/20 text-blue-400';
    if (percentage >= 60) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getColor()}`}>
      {percentage}% confident
    </span>
  );
};

const FeedbackButtons: React.FC<{
  onFeedback: (feedback: 'helpful' | 'not_helpful') => void;
}> = ({ onFeedback }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={() => onFeedback('helpful')}
      className="text-xs text-gray-400 hover:text-green-400 transition-colors"
      title="This insight was helpful"
    >
      👍
    </button>
    <button
      onClick={() => onFeedback('not_helpful')}
      className="text-xs text-gray-400 hover:text-red-400 transition-colors"
      title="This insight was not helpful"
    >
      👎
    </button>
  </div>
);

const HealthTrendCard: React.FC<{ trend: any }> = ({ trend }) => {
  const getTrendColor = (direction: string) => {
    const colors = {
      improving: 'text-green-400',
      stable: 'text-blue-400',
      degrading: 'text-yellow-400',
      critical: 'text-red-400'
    };
    return colors[direction as keyof typeof colors] || colors.stable;
  };

  const getTrendIcon = (direction: string) => {
    const icons = {
      improving: '📈',
      stable: '➡️',
      degrading: '📉',
      critical: '🔻'
    };
    return icons[direction as keyof typeof icons] || '➡️';
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-medium">{trend.metric_name}</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTrendIcon(trend.trend_direction)}</span>
          <ConfidenceBadge confidence={trend.confidence} />
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm">
        <span className={getTrendColor(trend.trend_direction)}>
          {trend.trend_direction.toUpperCase()}
        </span>
        <span className="text-gray-400">
          Current: {trend.predicted_values[0]?.value.toFixed(1)}
        </span>
        <span className="text-gray-400">
          Predicted: {trend.predicted_values[trend.predicted_values.length - 1]?.value.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

const IncidentCard: React.FC<{ incident: any }> = ({ incident }) => {
  const getSeverityColor = (severity: string) => {
    const colors = {
      minor: 'text-yellow-400 bg-yellow-500/10',
      major: 'text-orange-400 bg-orange-500/10',
      critical: 'text-red-400 bg-red-500/10'
    };
    return colors[severity as keyof typeof colors] || colors.minor;
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    return `${minutes} min ago`;
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-medium">{incident.incident_id}</span>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
            {incident.severity.toUpperCase()}
          </span>
          <span className="text-gray-400 text-xs">{getTimeAgo(incident.detected_at)}</span>
        </div>
      </div>
      <div className="text-gray-300 text-sm">
        Affected: {incident.affected_components.join(', ')}
      </div>
    </div>
  );
};

const OraclePredictionCard: React.FC<{
  prediction: any;
  onFeedback: (intelligenceId: string, feedback: 'helpful' | 'not_helpful') => void;
}> = ({ prediction, onFeedback }) => (
  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-blue-400 font-medium">{prediction.type.replace('_', ' ').toUpperCase()}</span>
          <ConfidenceBadge confidence={prediction.confidence} />
        </div>
        <p className="text-gray-300 text-sm mb-3">{prediction.prediction_reasoning}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <span>⏱️ {Math.round((prediction.predicted_time.getTime() - Date.now()) / 60000)} min</span>
          <span>🛡️ {prediction.prevention_window} min prevention window</span>
          <span>📊 {prediction.severity} severity</span>
        </div>
      </div>
      
      <FeedbackButtons
        onFeedback={(feedback) => onFeedback(`prediction_${prediction.type}`, feedback)}
      />
    </div>
  </div>
);

const AutomatedRunbookCard: React.FC<{
  runbook: any;
  onExecute: (actionId: string) => void;
}> = ({ runbook, onExecute }) => (
  <div className="bg-gray-700/30 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-white font-medium">{runbook.title}</span>
      <div className="flex items-center space-x-2">
        <span className="text-green-400 text-sm">{Math.round(runbook.success_probability * 100)}% success rate</span>
        <button
          onClick={() => onExecute(runbook.title)}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
        >
          Run Runbook
        </button>
      </div>
    </div>
    
    <div className="space-y-1">
      {runbook.steps.map((step: string, index: number) => (
        <div key={index} className="text-gray-400 text-sm">
          {index + 1}. {step}
        </div>
      ))}
    </div>
    
    <div className="text-xs text-gray-400 mt-3">
      ⏱️ Estimated time: {runbook.estimated_time} minutes
    </div>
  </div>
);

const DependencyHealthSection: React.FC<{
  dependencyHealth: ServiceIntelligenceData['dependency_health'];
  serviceId: string;
}> = ({ dependencyHealth, serviceId }) => (
  <Card className="bg-gray-800/50 border border-cyan-500/20">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-cyan-400 mb-4">🔗 Dependency Health & Impact Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Dependencies */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Critical Dependencies</h3>
          <div className="space-y-2">
            {dependencyHealth.critical_dependencies.map((dep, index) => (
              <DependencyHealthCard key={index} dependency={dep} />
            ))}
          </div>
        </div>
        
        {/* Blast Radius */}
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Failure Blast Radius</h3>
          <BlastRadiusVisualization blastRadius={dependencyHealth.blast_radius} />
        </div>
      </div>
    </div>
  </Card>
);

const DependencyHealthCard: React.FC<{ dependency: any }> = ({ dependency }) => {
  const getHealthColor = (status: string) => {
    const colors = {
      healthy: 'text-green-400',
      degraded: 'text-yellow-400',
      unhealthy: 'text-red-400'
    };
    return colors[status as keyof typeof colors] || colors.healthy;
  };

  return (
    <div className="bg-gray-700/30 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-medium">{dependency.service_name}</span>
        <span className={`text-sm ${getHealthColor(dependency.health_status)}`}>
          {dependency.health_status}
        </span>
      </div>
      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
        <span>Impact: {dependency.impact_if_failed}</span>
        <span>Trend: {dependency.trend}</span>
      </div>
    </div>
  );
};

const BlastRadiusVisualization: React.FC<{ blastRadius: any }> = ({ blastRadius }) => (
  <div className="space-y-3">
    <div>
      <div className="text-sm text-red-400 mb-1">Immediate (0-2 min)</div>
      <div className="flex flex-wrap gap-1">
        {blastRadius.tier_1.map((service: string, index: number) => (
          <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
            {service}
          </span>
        ))}
      </div>
    </div>
    
    <div>
      <div className="text-sm text-yellow-400 mb-1">Short-term (2-10 min)</div>
      <div className="flex flex-wrap gap-1">
        {blastRadius.tier_2.map((service: string, index: number) => (
          <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
            {service}
          </span>
        ))}
      </div>
    </div>
    
    <div>
      <div className="text-sm text-blue-400 mb-1">Medium-term (10-30 min)</div>
      <div className="flex flex-wrap gap-1">
        {blastRadius.tier_3.map((service: string, index: number) => (
          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
            {service}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const TrinityAIInsightsPanel: React.FC<{ serviceData: ServiceIntelligenceData }> = ({ serviceData }) => (
  <Card className="bg-gray-800/50 border border-gray-500/20">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-300 mb-4">🤖 Trinity AI System Status</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl mb-2">🔮</div>
          <div className="text-blue-400 font-medium">Oracle</div>
          <div className="text-sm text-gray-400">
            {serviceData.proactive_insights.oracle_predictions.length} predictions
          </div>
          <div className="text-xs text-green-400">Active</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl mb-2">🛡️</div>
          <div className="text-red-400 font-medium">Sentinel</div>
          <div className="text-sm text-gray-400">
            {serviceData.reactive_analysis.current_incidents.length} incidents
          </div>
          <div className="text-xs text-green-400">Active</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl mb-2">🧙</div>
          <div className="text-purple-400 font-medium">Sage</div>
          <div className="text-sm text-gray-400">
            {serviceData.strategic_recommendations.sage_actions.length} actions
          </div>
          <div className="text-xs text-green-400">Active</div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
        <div className="text-cyan-400 font-medium text-sm mb-2">🎯 Strategic Advantage</div>
        <div className="text-gray-300 text-sm">
          This AI-powered service intelligence is embedded directly in your service catalog - 
          something no other Platform Engineering solution offers. You're seeing the future 
          of AIOps + IDP fusion.
        </div>
      </div>
    </div>
  </Card>
);

export default IntelligentServicePage;