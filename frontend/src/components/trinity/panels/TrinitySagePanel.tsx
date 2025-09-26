/**
 * Trinity Sage Panel - Advisory Intelligence
 *
 * Professional advisory intelligence panel for Trinity AI Sage agent.
 * Features Bloomberg Terminal-style glassmorphism with Sage-specific theming.
 */

import React, { useState, useEffect } from 'react';
import { TrinityCard, TrinityAgentCard } from '../../ui/trinity-card';
import { cn } from '../../../utils/cn';

interface RecommendationData {
  id: string;
  type: 'strategic' | 'operational' | 'tactical' | 'risk_mitigation';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  priority: number;
  timeframe: 'immediate' | 'short_term' | 'long_term';
  domain: string;
  alternatives: string[];
  timestamp: Date;
  status: 'pending' | 'approved' | 'implemented' | 'rejected';
}

interface DecisionContext {
  objective: string;
  constraints: string[];
  criteria: { name: string; weight: number }[];
  alternatives: { name: string; scores: number[] }[];
}

interface SagePanelProps {
  className?: string;
  onRecommendationSelect?: (recommendation: RecommendationData) => void;
  webSocketData?: any;
}

const TrinitySagePanel: React.FC<SagePanelProps> = ({
  className,
  onRecommendationSelect,
  webSocketData
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [decisionContext, setDecisionContext] = useState<DecisionContext | null>(null);
  const [activeQuery, setActiveQuery] = useState<string>('');
  const [advisoryDomains, setAdvisoryDomains] = useState<string[]>([
    'business_strategy',
    'technology_decisions',
    'resource_allocation',
    'risk_management',
    'operational_efficiency'
  ]);
  const [selectedDomain, setSelectedDomain] = useState<string>('business_strategy');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Generate initial recommendations
  useEffect(() => {
    const generateRecommendations = () => {
      const types = ['strategic', 'operational', 'tactical', 'risk_mitigation'] as const;
      const impacts = ['critical', 'high', 'medium', 'low'] as const;
      const timeframes = ['immediate', 'short_term', 'long_term'] as const;
      
      const sampleRecs = [
        {
          title: 'Optimize Resource Allocation',
          description: 'Reallocate 15% of development resources to high-impact AI initiatives based on predictive analysis',
          domain: 'business_strategy',
          alternatives: ['Maintain current allocation', 'Increase by 25%', 'Gradual 5% monthly increase']
        },
        {
          title: 'Implement Predictive Scaling',
          description: 'Deploy auto-scaling based on Oracle predictions to reduce infrastructure costs by 20-30%',
          domain: 'technology_decisions',
          alternatives: ['Manual scaling', 'Traditional auto-scaling', 'Hybrid approach']
        },
        {
          title: 'Enhanced Security Protocols',
          description: 'Implement zero-trust architecture based on Sentinel threat analysis',
          domain: 'risk_management',
          alternatives: ['Current security model', 'Incremental improvements', 'Full zero-trust migration']
        },
        {
          title: 'Strategic Partnership Initiative',
          description: 'Form alliance with AI research institutions to accelerate innovation',
          domain: 'business_strategy',
          alternatives: ['In-house development', 'Acquisition strategy', 'Multiple partnerships']
        }
      ];

      const newRecommendations: RecommendationData[] = sampleRecs.map((rec, index) => ({
        id: `sage-${Date.now()}-${index}`,
        type: types[Math.floor(Math.random() * types.length)],
        title: rec.title,
        description: rec.description,
        impact: impacts[Math.floor(Math.random() * impacts.length)],
        confidence: Math.random() * 20 + 75,
        priority: Math.floor(Math.random() * 5) + 1,
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
        domain: rec.domain,
        alternatives: rec.alternatives,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        status: 'pending'
      }));

      setRecommendations(prev => [...newRecommendations, ...prev.slice(0, 8)]);
    };

    generateRecommendations();
  }, [selectedDomain]);

  // Process natural language queries
  const handleAdvisoryQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setActiveQuery(query);

    // Simulate processing time
    setTimeout(() => {
      const newRecommendation: RecommendationData = {
        id: `sage-query-${Date.now()}`,
        type: 'strategic',
        title: `Advisory Response: ${query.substring(0, 50)}...`,
        description: `Based on your query "${query}", I recommend implementing a data-driven approach with Trinity AI coordination to optimize outcomes.`,
        impact: 'high',
        confidence: Math.random() * 15 + 80,
        priority: 1,
        timeframe: 'short_term',
        domain: selectedDomain,
        alternatives: ['Alternative approach A', 'Alternative approach B', 'Hybrid solution'],
        timestamp: new Date(),
        status: 'pending'
      };

      setRecommendations(prev => [newRecommendation, ...prev.slice(0, 11)]);
      setIsProcessing(false);
      setActiveQuery('');

      if (onRecommendationSelect) {
        onRecommendationSelect(newRecommendation);
      }
    }, 2500);
  };

  const updateRecommendationStatus = (id: string, status: RecommendationData['status']) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, status } : rec
    ));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-300 bg-red-500/20 border-red-400/30';
      case 'high': return 'text-orange-300 bg-orange-500/20 border-orange-400/30';
      case 'medium': return 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30';
      case 'low': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      default: return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strategic': return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
      case 'operational': return 'text-indigo-300 bg-indigo-500/20 border-indigo-400/30';
      case 'tactical': return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
      case 'risk_mitigation': return 'text-red-300 bg-red-500/20 border-red-400/30';
      default: return 'text-purple-300 bg-purple-500/20 border-purple-400/30';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return '⚡';
      case 'short_term': return '📅';
      case 'long_term': return '🎯';
      default: return '⏱️';
    }
  };

  return (
    <div className={cn("h-full space-y-6", className)}>
      {/* Sage Agent Status */}
      <TrinityAgentCard
        agent="sage"
        title="Advisory Intelligence System"
        confidence={91.8}
        status={isProcessing ? 'processing' : 'active'}
        data={{
          activeDomain: selectedDomain,
          pendingRecommendations: recommendations.filter(r => r.status === 'pending').length,
          avgConfidence: '91.8%'
        }}
        onInteraction={() => console.log('Sage interaction')}
      />

      {/* Natural Language Advisory Query */}
      <TrinityCard variant="glass" agent="sage" className="p-4">
        <div className="trinity-body-md text-purple-100 mb-4">Advisory Query Interface</div>
        
        <div className="space-y-4">
          <div>
            <label className="trinity-body-sm text-purple-200 mb-2 block">Domain Focus</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2 rounded-md trinity-glass-sage text-purple-100 text-sm"
            >
              {advisoryDomains.map(domain => (
                <option key={domain} value={domain}>
                  {domain.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="trinity-body-sm text-purple-200 mb-2 block">
              Advisory Query
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={activeQuery}
                onChange={(e) => setActiveQuery(e.target.value)}
                placeholder="Ask for strategic advice, decision support, or recommendations..."
                className="flex-1 p-3 rounded-md trinity-glass-sage text-purple-100 text-sm placeholder-purple-300/50"
                onKeyPress={(e) => e.key === 'Enter' && handleAdvisoryQuery(activeQuery)}
              />
              <button
                onClick={() => handleAdvisoryQuery(activeQuery)}
                disabled={isProcessing || !activeQuery.trim()}
                className={cn(
                  "px-4 py-3 rounded-md transition-all trinity-body-sm font-medium",
                  isProcessing || !activeQuery.trim()
                    ? "trinity-glass-sage text-purple-400 cursor-not-allowed"
                    : "trinity-gradient-sage text-white hover:shadow-glow interactive-scale"
                )}
              >
                {isProcessing ? '🤔' : '💭'}
              </button>
            </div>
          </div>
        </div>
      </TrinityCard>

      {/* Strategic Recommendations */}
      <TrinityCard variant="glass" agent="sage" className="p-4">
        <div className="trinity-body-md text-purple-100 mb-4 flex items-center justify-between">
          <span>Strategic Recommendations</span>
          <span className="trinity-body-sm text-purple-300">
            {recommendations.filter(r => r.status === 'pending').length} pending
          </span>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {recommendations.slice(0, 6).map((recommendation) => (
            <div
              key={recommendation.id}
              onClick={() => onRecommendationSelect && onRecommendationSelect(recommendation)}
              className="trinity-glass-sage rounded-lg p-4 cursor-pointer hover:bg-purple-950/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    getTypeColor(recommendation.type)
                  )}>
                    {recommendation.type.replace('_', ' ')}
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium border",
                    getImpactColor(recommendation.impact)
                  )}>
                    {recommendation.impact}
                  </div>
                  <span className="text-lg">
                    {getTimeframeIcon(recommendation.timeframe)}
                  </span>
                </div>
                <div className="trinity-body-sm text-purple-300 font-medium">
                  P{recommendation.priority}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="trinity-body-md text-purple-100 font-medium mb-2">
                  {recommendation.title}
                </div>
                <div className="trinity-body-sm text-purple-200 leading-relaxed">
                  {recommendation.description}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="trinity-body-sm text-purple-300">
                    Confidence: {recommendation.confidence.toFixed(1)}%
                  </div>
                  <div className="trinity-body-sm text-purple-400">
                    {recommendation.alternatives.length} alternatives
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {recommendation.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRecommendationStatus(recommendation.id, 'approved');
                        }}
                        className="trinity-body-sm text-green-300 hover:text-white transition-colors text-xs px-2 py-1 rounded border border-green-500/30 hover:bg-green-500/20"
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRecommendationStatus(recommendation.id, 'rejected');
                        }}
                        className="trinity-body-sm text-red-300 hover:text-white transition-colors text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/20"
                      >
                        ✗
                      </button>
                    </>
                  )}
                  <div className="trinity-body-sm text-purple-400 text-xs">
                    {recommendation.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recommendations.length === 0 && (
            <div className="text-center py-8">
              <div className="trinity-body-md text-purple-300 mb-2">No recommendations yet</div>
              <div className="trinity-body-sm text-purple-400">
                Ask a question above to receive strategic advice
              </div>
            </div>
          )}
        </div>
      </TrinityCard>

      {/* Decision Support Matrix */}
      {decisionContext && (
        <TrinityCard variant="glass" agent="sage" className="p-4">
          <div className="trinity-body-md text-purple-100 mb-4">Decision Analysis</div>
          
          <div className="trinity-glass-sage rounded-lg p-3">
            <div className="trinity-body-sm text-purple-100 mb-2">
              Objective: {decisionContext.objective}
            </div>
            <div className="trinity-body-sm text-purple-300 mb-3">
              {decisionContext.criteria.length} criteria • {decisionContext.alternatives.length} alternatives
            </div>
            
            <div className="space-y-2">
              {decisionContext.alternatives.map((alt, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="trinity-body-sm text-purple-200">{alt.name}</span>
                  <span className="trinity-body-sm text-purple-300 font-medium">
                    Score: {alt.scores.reduce((a, b) => a + b, 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TrinityCard>
      )}
    </div>
  );
};

export default TrinitySagePanel;