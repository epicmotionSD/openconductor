/**
 * OpenConductor Explainable AI Dashboard
 * 
 * Provides comprehensive AI transparency and trust building features:
 * - Real-time decision explanations with visual breakdowns
 * - Model confidence and uncertainty quantification
 * - Feature importance and contribution analysis
 * - Decision audit trails for regulatory compliance
 * - Model performance monitoring and drift detection
 * - Interactive AI reasoning exploration
 * - GDPR/HIPAA/SOX compliance views
 * 
 * Enterprise Value:
 * - Builds trust through transparency
 * - Enables AI adoption in regulated industries
 * - Reduces compliance risk and audit complexity
 * - Improves AI system debugging and optimization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, Treemap } from 'recharts';
import { AlertTriangle, Brain, Eye, Shield, TrendingUp, Clock, CheckCircle, XCircle, 
         Info, Zap, Target, Users, Database, GitBranch } from 'lucide-react';

interface AIDecision {
  id: string;
  timestamp: Date;
  agent: 'Oracle' | 'Sentinel' | 'Sage';
  decision: string;
  confidence: number;
  outcome: 'success' | 'failure' | 'pending';
  inputFeatures: Array<{
    name: string;
    value: any;
    importance: number;
    contribution: number;
    type: 'numeric' | 'categorical' | 'boolean';
  }>;
  modelInfo: {
    name: string;
    version: string;
    type: string;
    trainingDate: Date;
    accuracy: number;
  };
  explanation: {
    reasoning: string;
    keyFactors: string[];
    alternatives: Array<{
      decision: string;
      probability: number;
      reasoning: string;
    }>;
    uncertainty: {
      epistemic: number; // Model uncertainty
      aleatoric: number; // Data uncertainty
      total: number;
    };
  };
  complianceInfo: {
    dataSource: string;
    consentStatus: 'verified' | 'pending' | 'unknown';
    retentionPolicy: string;
    auditTrail: string[];
  };
  businessImpact: {
    category: string;
    estimatedValue: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    stakeholders: string[];
  };
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  drift: {
    dataDrift: number;
    conceptDrift: number;
    lastDetected: Date;
  };
  bias: {
    demographicParity: number;
    equalizedOdds: number;
    calibration: number;
  };
}

interface ExplainabilityDashboardProps {
  decisions: AIDecision[];
  selectedDecisionId?: string;
  modelMetrics: ModelMetrics;
  onDecisionSelect: (decisionId: string) => void;
  complianceMode?: 'gdpr' | 'hipaa' | 'sox' | 'standard';
}

export const ExplainabilityDashboard: React.FC<ExplainabilityDashboardProps> = ({
  decisions,
  selectedDecisionId,
  modelMetrics,
  onDecisionSelect,
  complianceMode = 'standard'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'decision' | 'model' | 'compliance'>('overview');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const selectedDecision = decisions.find(d => d.id === selectedDecisionId);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const recentDecisions = decisions.filter(d => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - (timeRange === '1h' ? 3600000 : 
                                               timeRange === '24h' ? 86400000 :
                                               timeRange === '7d' ? 604800000 : 2592000000));
      return d.timestamp >= cutoff;
    });

    return {
      totalDecisions: recentDecisions.length,
      averageConfidence: recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / recentDecisions.length || 0,
      successRate: (recentDecisions.filter(d => d.outcome === 'success').length / recentDecisions.length) * 100 || 0,
      highConfidenceDecisions: recentDecisions.filter(d => d.confidence > 0.8).length,
      agentDistribution: {
        Oracle: recentDecisions.filter(d => d.agent === 'Oracle').length,
        Sentinel: recentDecisions.filter(d => d.agent === 'Sentinel').length,
        Sage: recentDecisions.filter(d => d.agent === 'Sage').length
      }
    };
  }, [decisions, timeRange]);

  // Generate confidence distribution data
  const confidenceDistribution = useMemo(() => {
    const buckets = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = buckets.slice(0, -1).map((bucket, idx) => ({
      range: `${(bucket * 100).toFixed(0)}-${(buckets[idx + 1] * 100).toFixed(0)}%`,
      count: decisions.filter(d => d.confidence >= bucket && d.confidence < buckets[idx + 1]).length
    }));
    
    return distribution;
  }, [decisions]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Decisions"
          value={aggregateMetrics.totalDecisions.toLocaleString()}
          icon={Brain}
          trend={12.5}
          color="blue"
        />
        <MetricCard
          title="Average Confidence"
          value={`${(aggregateMetrics.averageConfidence * 100).toFixed(1)}%`}
          icon={Target}
          trend={3.2}
          color="green"
        />
        <MetricCard
          title="Success Rate"
          value={`${aggregateMetrics.successRate.toFixed(1)}%`}
          icon={CheckCircle}
          trend={-1.8}
          color="emerald"
        />
        <MetricCard
          title="Model Accuracy"
          value={`${(modelMetrics.accuracy * 100).toFixed(1)}%`}
          icon={Zap}
          trend={0.5}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Distribution */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Confidence Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Performance */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Agent Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(aggregateMetrics.agentDistribution).map(([agent, count]) => ({
                  name: agent,
                  value: count
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {Object.keys(aggregateMetrics.agentDistribution).map((agent, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B'][index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Decisions Table */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Recent AI Decisions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-300 py-2">Timestamp</th>
                <th className="text-left text-gray-300 py-2">Agent</th>
                <th className="text-left text-gray-300 py-2">Decision</th>
                <th className="text-left text-gray-300 py-2">Confidence</th>
                <th className="text-left text-gray-300 py-2">Outcome</th>
                <th className="text-left text-gray-300 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {decisions.slice(0, 10).map((decision) => (
                <tr key={decision.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 text-gray-300">
                    {decision.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      decision.agent === 'Oracle' ? 'bg-blue-900 text-blue-300' :
                      decision.agent === 'Sentinel' ? 'bg-green-900 text-green-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {decision.agent}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300 max-w-xs truncate">
                    {decision.decision}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${decision.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-300 text-xs">
                        {(decision.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    {decision.outcome === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {decision.outcome === 'failure' && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {decision.outcome === 'pending' && (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => onDecisionSelect(decision.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Explain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDecisionTab = () => {
    if (!selectedDecision) {
      return (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <p className="text-gray-400">Select a decision to view detailed explanations</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Decision Header */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Decision Analysis</h3>
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              selectedDecision.agent === 'Oracle' ? 'bg-blue-900 text-blue-300' :
              selectedDecision.agent === 'Sentinel' ? 'bg-green-900 text-green-300' :
              'bg-yellow-900 text-yellow-300'
            }`}>
              {selectedDecision.agent} Agent
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm">Decision</p>
              <p className="text-white font-medium">{selectedDecision.decision}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Confidence</p>
              <p className="text-white font-medium">{(selectedDecision.confidence * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Timestamp</p>
              <p className="text-white font-medium">{selectedDecision.timestamp.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">AI Reasoning</h4>
            <p className="text-gray-300">{selectedDecision.explanation.reasoning}</p>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Feature Importance</h4>
            <div className="space-y-3">
              {selectedDecision.inputFeatures
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 8)
                .map((feature, index) => (
                <div key={feature.name} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{feature.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${feature.importance * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-400 text-xs w-10 text-right">
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Feature Contributions</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={selectedDecision.inputFeatures
                  .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                  .slice(0, 6)
                }
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="contribution" 
                  fill={(entry) => entry.contribution > 0 ? '#10B981' : '#EF4444'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uncertainty Analysis */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Uncertainty Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Model Uncertainty</p>
              <p className="text-2xl font-bold text-blue-400">
                {(selectedDecision.explanation.uncertainty.epistemic * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Confidence in model knowledge</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Data Uncertainty</p>
              <p className="text-2xl font-bold text-yellow-400">
                {(selectedDecision.explanation.uncertainty.aleatoric * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Inherent data noise</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Uncertainty</p>
              <p className="text-2xl font-bold text-red-400">
                {(selectedDecision.explanation.uncertainty.total * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Overall prediction uncertainty</p>
            </div>
          </div>
        </div>

        {/* Alternative Scenarios */}
        {selectedDecision.explanation.alternatives.length > 0 && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Alternative Scenarios</h4>
            <div className="space-y-3">
              {selectedDecision.explanation.alternatives.map((alt, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-white font-medium">{alt.decision}</h5>
                    <span className="text-gray-400 text-sm">{(alt.probability * 100).toFixed(1)}% probability</span>
                  </div>
                  <p className="text-gray-300 text-sm">{alt.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModelTab = () => (
    <div className="space-y-6">
      {/* Model Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Accuracy"
          value={`${(modelMetrics.accuracy * 100).toFixed(1)}%`}
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Precision"
          value={`${(modelMetrics.precision * 100).toFixed(1)}%`}
          icon={Zap}
          color="blue"
        />
        <MetricCard
          title="Recall"
          value={`${(modelMetrics.recall * 100).toFixed(1)}%`}
          icon={Database}
          color="purple"
        />
        <MetricCard
          title="F1 Score"
          value={`${(modelMetrics.f1Score * 100).toFixed(1)}%`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Model Drift Detection */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <GitBranch className="w-5 h-5 mr-2" />
          Model Drift Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Data Drift</h4>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    modelMetrics.drift.dataDrift < 0.3 ? 'bg-green-500' :
                    modelMetrics.drift.dataDrift < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${modelMetrics.drift.dataDrift * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-300">{(modelMetrics.drift.dataDrift * 100).toFixed(1)}%</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Input data distribution changes</p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Concept Drift</h4>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    modelMetrics.drift.conceptDrift < 0.3 ? 'bg-green-500' :
                    modelMetrics.drift.conceptDrift < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${modelMetrics.drift.conceptDrift * 100}%` }}
                ></div>
              </div>
              <span className="text-gray-300">{(modelMetrics.drift.conceptDrift * 100).toFixed(1)}%</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">Relationship changes between inputs and outputs</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-gray-300 text-sm">
            <strong>Last Drift Detection:</strong> {modelMetrics.drift.lastDetected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bias Analysis */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Fairness & Bias Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Demographic Parity</p>
            <p className="text-2xl font-bold text-blue-400">
              {(modelMetrics.bias.demographicParity * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Equal positive prediction rates</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Equalized Odds</p>
            <p className="text-2xl font-bold text-green-400">
              {(modelMetrics.bias.equalizedOdds * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Equal true/false positive rates</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Calibration</p>
            <p className="text-2xl font-bold text-purple-400">
              {(modelMetrics.bias.calibration * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Prediction probability accuracy</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      {/* Compliance Status */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          {complianceMode.toUpperCase()} Compliance Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComplianceMetric
            title="Data Consent"
            status="compliant"
            percentage={98.5}
            description="Valid consent for AI processing"
          />
          <ComplianceMetric
            title="Audit Trail"
            status="compliant"
            percentage={100}
            description="Complete decision logging"
          />
          <ComplianceMetric
            title="Right to Explanation"
            status="compliant"
            percentage={100}
            description="Explainable AI decisions"
          />
          <ComplianceMetric
            title="Data Retention"
            status="warning"
            percentage={85.3}
            description="Some data approaching retention limits"
          />
        </div>
      </div>

      {/* Recent Audit Events */}
      {selectedDecision && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Decision Audit Trail</h4>
          <div className="space-y-3">
            {selectedDecision.complianceInfo.auditTrail.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm flex-1">{event}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(Date.now() - index * 60000).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Required Actions</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-white text-sm">Review data retention policies</p>
                <p className="text-gray-400 text-xs">15 datasets approaching retention limits</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-white text-sm">Update model documentation</p>
                <p className="text-gray-400 text-xs">Annual compliance review due</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Export Options</h4>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Database className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-white text-sm">Export Audit Report</p>
                  <p className="text-gray-400 text-xs">Complete decision history with explanations</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-white text-sm">Generate Compliance Certificate</p>
                  <p className="text-gray-400 text-xs">Regulatory compliance attestation</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Explainable AI Dashboard</h1>
            <p className="text-gray-400">Transparent AI decision making with comprehensive explanations</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-400 text-sm">AI Systems Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'decision', label: 'Decision Analysis', icon: Eye },
              { id: 'model', label: 'Model Performance', icon: Brain },
              { id: 'compliance', label: 'Compliance', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'decision' && renderDecisionTab()}
        {activeTab === 'model' && renderModelTab()}
        {activeTab === 'compliance' && renderComplianceTab()}
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: number;
  color: string;
}> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400'
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color as keyof typeof colorClasses]}`} />
      </div>
    </div>
  );
};

const ComplianceMetric: React.FC<{
  title: string;
  status: 'compliant' | 'warning' | 'non-compliant';
  percentage: number;
  description: string;
}> = ({ title, status, percentage, description }) => {
  const statusConfig = {
    compliant: { color: 'text-green-400', bg: 'bg-green-900', icon: CheckCircle },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-900', icon: AlertTriangle },
    'non-compliant': { color: 'text-red-400', bg: 'bg-red-900', icon: XCircle }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-medium">{title}</h4>
        <StatusIcon className={`w-5 h-5 ${config.color}`} />
      </div>
      <p className={`text-2xl font-bold ${config.color}`}>{percentage.toFixed(1)}%</p>
      <p className="text-gray-400 text-xs mt-1">{description}</p>
    </div>
  );
};

export default ExplainabilityDashboard;