/**
 * Service Page Mockups - AIOps + IDP Fusion Demonstration
 * 
 * Visual mockups demonstrating the revolutionary service page experience
 * that embeds Trinity AI intelligence directly where developers work.
 * 
 * Strategic Differentiation Visualization:
 * - Shows before/after comparison with traditional service catalogs
 * - Demonstrates proactive + reactive intelligence integration
 * - Visualizes Trinity AI coordination in real developer workflow
 * - Proves unique AIOps + IDP fusion value proposition
 */

import React, { useState } from 'react';
import { Card } from '../ui/trinity-card';

interface ServicePageMockupsProps {
  onViewLiveDemo: () => void;
}

const ServicePageMockups: React.FC<ServicePageMockupsProps> = ({ onViewLiveDemo }) => {
  const [activeComparison, setActiveComparison] = useState<'traditional' | 'openconductor'>('openconductor');

  return (
    <div className="space-y-8">
      {/* Header with Strategic Context */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            🎯 The Service Page Revolution
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            See how OpenConductor transforms static service catalogs into intelligent operational dashboards
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="text-red-400 font-semibold mb-2">❌ Traditional IDPs</div>
              <div className="text-gray-300 text-sm">
                Static service info, manual troubleshooting, reactive alerts only
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="text-yellow-400 font-semibold mb-2">⚠️ Current AIOps</div>
              <div className="text-gray-300 text-sm">
                Separate monitoring tools, no developer workflow integration
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">✅ OpenConductor</div>
              <div className="text-gray-300 text-sm">
                AI intelligence embedded directly in service pages
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-800 rounded-lg p-2 flex">
          <button
            onClick={() => setActiveComparison('traditional')}
            className={`px-6 py-2 rounded-md transition-all ${
              activeComparison === 'traditional'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Traditional Service Page
          </button>
          <button
            onClick={() => setActiveComparison('openconductor')}
            className={`px-6 py-2 rounded-md transition-all ${
              activeComparison === 'openconductor'
                ? 'bg-cyan-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            OpenConductor Intelligent Service Page
          </button>
        </div>
      </div>

      {/* Service Page Comparison */}
      {activeComparison === 'traditional' ? (
        <TraditionalServicePageMockup />
      ) : (
        <OpenConductorServicePageMockup onViewLiveDemo={onViewLiveDemo} />
      )}

      {/* Strategic Advantages Summary */}
      <StrategicAdvantagesSummary />
    </div>
  );
};

// Traditional Service Page Mockup
const TraditionalServicePageMockup: React.FC = () => (
  <Card className="bg-gray-800/30 border border-red-500/20">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-red-400">Traditional Service Catalog Page</h2>
        <span className="text-red-400 text-sm">❌ Reactive, Manual, Static</span>
      </div>

      {/* Traditional Service Info */}
      <div className="space-y-4">
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">📋 Payment Service</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 ml-2">Running</span>
            </div>
            <div>
              <span className="text-gray-400">Version:</span>
              <span className="text-white ml-2">v2.1.3</span>
            </div>
            <div>
              <span className="text-gray-400">Replicas:</span>
              <span className="text-white ml-2">3/3</span>
            </div>
            <div>
              <span className="text-gray-400">Last Deployed:</span>
              <span className="text-white ml-2">2 hours ago</span>
            </div>
          </div>
        </div>

        {/* Static Links */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">📊 Monitoring & Logs</h4>
          <div className="space-y-2">
            <a href="#" className="block text-blue-400 text-sm hover:text-blue-300">
              → View in Grafana Dashboard
            </a>
            <a href="#" className="block text-blue-400 text-sm hover:text-blue-300">
              → Check Splunk Logs
            </a>
            <a href="#" className="block text-blue-400 text-sm hover:text-blue-300">
              → PagerDuty Incidents
            </a>
            <a href="#" className="block text-blue-400 text-sm hover:text-blue-300">
              → Runbook Documentation
            </a>
          </div>
        </div>

        {/* Manual Troubleshooting */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-red-400 font-medium mb-3">🚨 When Issues Occur</h4>
          <div className="text-gray-300 text-sm space-y-1">
            <div>1. Check multiple monitoring tools manually</div>
            <div>2. Correlate logs, metrics, and recent changes by hand</div>
            <div>3. Form hypothesis about root cause</div>
            <div>4. Implement fix and hope for the best</div>
            <div>5. Monitor results manually</div>
          </div>
          <div className="text-red-400 text-xs mt-3">
            ⏱️ Typical resolution time: 15-30 minutes
          </div>
        </div>

        {/* What's Missing */}
        <div className="bg-gray-600/20 border border-gray-500/20 rounded-lg p-4">
          <h4 className="text-gray-400 font-medium mb-3">❌ What's Missing</h4>
          <div className="text-gray-400 text-sm space-y-1">
            <div>• No predictive alerts before issues occur</div>
            <div>• No automatic correlation of deployments and incidents</div>
            <div>• No AI-powered root cause analysis</div>
            <div>• No confidence scoring for diagnosis accuracy</div>
            <div>• No one-click remediation actions</div>
            <div>• No learning from incident patterns</div>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// OpenConductor Intelligent Service Page Mockup
const OpenConductorServicePageMockup: React.FC<{ onViewLiveDemo: () => void }> = ({ onViewLiveDemo }) => (
  <Card className="bg-gray-800/30 border border-cyan-500/20">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-cyan-400">OpenConductor Intelligent Service Page</h2>
        <span className="text-cyan-400 text-sm">✅ Proactive, AI-Powered, Intelligent</span>
      </div>

      {/* Intelligent Service Header */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-white font-medium">Payment Service</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">DEGRADED</span>
                <span className="text-gray-400 text-xs">v2.1.3 • 3/3 replicas</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-cyan-400 text-sm font-medium">Trinity AI Active</div>
            <div className="text-gray-300 text-xs">🔮 Oracle • 🛡️ Sentinel • 🧙 Sage</div>
          </div>
        </div>
      </div>

      {/* Proactive Oracle Intelligence */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">🔮</span>
          <h4 className="text-blue-400 font-medium">Oracle Proactive Intelligence</h4>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 font-medium">🚨 SLA Breach Predicted</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">87% confident</span>
          </div>
          <div className="text-gray-300 text-sm mb-2">
            Response time trending toward 2.1s, will exceed 2.0s SLA in approximately 12 minutes
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>⏱️ Prevention window: 10 minutes</span>
            <span>📊 Traffic spike + connection pool limit</span>
          </div>
          <button className="mt-3 px-3 py-1 bg-yellow-500 text-black rounded text-sm font-medium hover:bg-yellow-400">
            Prevent Issue (One-Click)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-600/20 rounded p-3">
            <div className="text-white text-sm font-medium">Response Time Trend</div>
            <div className="text-red-400 text-xs">📉 Degrading (92% confidence)</div>
            <div className="text-gray-400 text-xs">1.8s → 2.1s (predicted)</div>
          </div>
          <div className="bg-gray-600/20 rounded p-3">
            <div className="text-white text-sm font-medium">Resource Forecast</div>
            <div className="text-yellow-400 text-xs">⚠️ Pool exhaustion (74% confidence)</div>
            <div className="text-gray-400 text-xs">45/50 → 50/50 connections</div>
          </div>
        </div>
      </div>

      {/* Reactive Sentinel Intelligence */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">🛡️</span>
          <h4 className="text-red-400 font-medium">Sentinel Reactive Intelligence</h4>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 font-medium">🔍 Root Cause: Database Connection Pool Exhaustion</span>
            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">84% confident</span>
          </div>
          <div className="text-gray-300 text-sm mb-2">
            Connection pool reached maximum capacity correlating with deployment v2.1.3 and traffic spike
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Analysis time: 30 seconds vs 10+ minutes manual investigation
          </div>
          
          <div className="space-y-2">
            <div className="bg-gray-600/20 rounded p-2">
              <div className="text-white text-xs font-medium">Timeline Correlation</div>
              <div className="text-gray-400 text-xs">T-8min: Deployment v2.1.3 → T-5min: Traffic spike → T-0min: Pool exhaustion</div>
            </div>
            <div className="bg-gray-600/20 rounded p-2">
              <div className="text-white text-xs font-medium">Evidence Sources</div>
              <div className="text-gray-400 text-xs">Connection metrics, deployment logs, load balancer data</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Sage Intelligence */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">🧙</span>
          <h4 className="text-purple-400 font-medium">Sage Strategic Intelligence</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 font-medium">⚡ Scale Connection Pool</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">91% confident</span>
            </div>
            <div className="text-gray-300 text-sm mb-2">
              Increase pool size from 50 to 100 connections
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Historical success: 94% | Est. time: 5 min | Risk: Low
            </div>
            <button className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600">
              Execute Fix (One-Click)
            </button>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 font-medium">🔧 Enable Auto-scaling</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">88% confident</span>
            </div>
            <div className="text-gray-300 text-sm mb-2">
              Activate horizontal pod autoscaling
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Prevents future issues | Est. time: 10 min | Risk: Low
            </div>
            <button className="w-full px-3 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600">
              Implement Prevention
            </button>
          </div>
        </div>
      </div>

      {/* Dependency Intelligence */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
        <h4 className="text-cyan-400 font-medium mb-3">🔗 Intelligent Dependency Analysis</h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-white text-sm font-medium mb-2">Critical Dependencies</div>
            <div className="space-y-1">
              <div className="bg-red-500/20 rounded p-2 text-xs">
                <div className="text-red-300">payments-db</div>
                <div className="text-gray-400">DEGRADED • Critical impact</div>
              </div>
              <div className="bg-green-500/20 rounded p-2 text-xs">
                <div className="text-green-300">auth-service</div>
                <div className="text-gray-400">HEALTHY • High impact</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-white text-sm font-medium mb-2">Failure Blast Radius</div>
            <div className="space-y-1">
              <div className="text-red-300 text-xs">Immediate: user-dashboard, mobile-app</div>
              <div className="text-yellow-300 text-xs">5-min: analytics-service</div>
              <div className="text-blue-300 text-xs">15-min: audit-service</div>
            </div>
          </div>
          
          <div>
            <div className="text-white text-sm font-medium mb-2">AI Impact Prediction</div>
            <div className="bg-yellow-500/20 rounded p-2 text-xs">
              <div className="text-yellow-300">Users affected: 10,000</div>
              <div className="text-yellow-300">Revenue at risk: $50K</div>
              <div className="text-yellow-300">Recovery time: 2 min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Event Timeline */}
      <div className="bg-gray-700/20 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">📅 Intelligent Event Timeline</h4>
        
        <div className="space-y-2">
          <TimelineEvent
            time="T-12 min"
            actor="🔮 Oracle"
            event="Predicted SLA breach based on response time trends"
            confidence={87}
            type="prediction"
          />
          <TimelineEvent
            time="T-8 min"
            actor="📦 System"
            event="Deployment v2.1.3 completed"
            confidence={100}
            type="deployment"
          />
          <TimelineEvent
            time="T-5 min"
            actor="📊 Metrics"
            event="Traffic spike detected (+300% increase)"
            confidence={95}
            type="anomaly"
          />
          <TimelineEvent
            time="T-0 min"
            actor="🛡️ Sentinel"
            event="Connection pool exhaustion confirmed (49/50 active)"
            confidence={98}
            type="incident"
          />
          <TimelineEvent
            time="T+0.5 min"
            actor="🧙 Sage"
            event="One-click remediation generated (Scale pool to 100)"
            confidence={91}
            type="remediation"
          />
        </div>
      </div>
    </div>
  </Card>
);

// OpenConductor Service Page Mockup
const OpenConductorServicePageMockup: React.FC<{ onViewLiveDemo: () => void }> = ({ onViewLiveDemo }) => (
  <Card className="bg-gray-800/30 border border-cyan-500/20">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-cyan-400">OpenConductor Intelligent Service Page</h2>
        <div className="flex items-center space-x-4">
          <span className="text-cyan-400 text-sm">✅ Proactive, AI-Powered, Intelligent</span>
          <button 
            onClick={onViewLiveDemo}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600"
          >
            View Live Demo
          </button>
        </div>
      </div>

      {/* The complete intelligent service page is already implemented in IntelligentServicePage.tsx */}
      <div className="space-y-4">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
          <h3 className="text-cyan-400 font-medium mb-3">🎯 Strategic Competitive Advantages</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="text-white font-medium">vs Backstage:</div>
              <div className="text-gray-300">• AI intelligence vs static documentation</div>
              <div className="text-gray-300">• Proactive predictions vs reactive alerts only</div>
              <div className="text-gray-300">• One-click fixes vs manual implementation</div>
              <div className="text-gray-300">• 15-min setup vs 3-6 month implementation</div>
            </div>
            <div className="space-y-2">
              <div className="text-white font-medium">vs Commercial IDPs:</div>
              <div className="text-gray-300">• Open-source vs vendor lock-in</div>
              <div className="text-gray-300">• AIOps fusion vs basic automation</div>
              <div className="text-gray-300">• Trinity AI vs single-point solutions</div>
              <div className="text-gray-300">• Explainable AI vs black box decisions</div>
            </div>
          </div>
        </div>

        {/* Live Demo Preview */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">🧪 Interactive Demo Available</h3>
          <div className="text-gray-300 text-sm mb-4">
            Experience the complete Trinity AI service intelligence in action. See proactive predictions, 
            reactive root cause analysis, and strategic remediation working together.
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-cyan-400 text-lg font-bold">12 min</div>
              <div className="text-gray-400 text-xs">Advance Warning</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-lg font-bold">30 sec</div>
              <div className="text-gray-400 text-xs">Root Cause Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-lg font-bold">92%</div>
              <div className="text-gray-400 text-xs">Faster Resolution</div>
            </div>
          </div>
          
          <button 
            onClick={onViewLiveDemo}
            className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
          >
            🚀 Experience the AIOps + IDP Fusion Demo
          </button>
        </div>
      </div>
    </div>
  </Card>
);

// Timeline Event Component
const TimelineEvent: React.FC<{
  time: string;
  actor: string;
  event: string;
  confidence: number;
  type: 'prediction' | 'deployment' | 'anomaly' | 'incident' | 'remediation';
}> = ({ time, actor, event, confidence, type }) => {
  const getTypeColor = (type: string) => {
    const colors = {
      prediction: 'border-blue-500/30 bg-blue-500/10',
      deployment: 'border-gray-500/30 bg-gray-500/10',
      anomaly: 'border-yellow-500/30 bg-yellow-500/10',
      incident: 'border-red-500/30 bg-red-500/10',
      remediation: 'border-green-500/30 bg-green-500/10'
    };
    return colors[type as keyof typeof colors] || colors.incident;
  };

  return (
    <div className={`border rounded-lg p-3 ${getTypeColor(type)}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm font-medium">{time}</span>
          <span className="text-gray-300 text-sm">{actor}</span>
        </div>
        <span className="px-2 py-1 bg-gray-600/30 text-gray-300 text-xs rounded">
          {confidence}% confident
        </span>
      </div>
      <div className="text-gray-300 text-sm">{event}</div>
    </div>
  );
};

// Strategic Advantages Summary
const StrategicAdvantagesSummary: React.FC = () => (
  <Card className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20">
    <div className="p-8">
      <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
        🎯 Strategic Market Differentiation Achieved
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-4">🏆 Competitive Advantages</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Unique AIOps + IDP Fusion</div>
                <div className="text-gray-400 text-sm">No competitor embeds operational intelligence in developer workflow</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Proactive + Reactive Intelligence</div>
                <div className="text-gray-400 text-sm">Prevents issues AND diagnoses them faster than any alternative</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">Trinity AI Coordination</div>
                <div className="text-gray-400 text-sm">Consensus-based confidence vs single-point analysis</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <div className="text-white font-medium">One-Click Remediation</div>
                <div className="text-gray-400 text-sm">Automated fixes with confidence scoring and rollback plans</div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-4">📊 Business Impact Metrics</h3>
          <div className="space-y-3">
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-cyan-400 font-medium">Time to Resolution</div>
              <div className="text-2xl font-bold text-white">92% faster</div>
              <div className="text-gray-400 text-sm">2 minutes vs 25 minutes traditional</div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-green-400 font-medium">Revenue Protection</div>
              <div className="text-2xl font-bold text-white">$46K saved</div>
              <div className="text-gray-400 text-sm">Per incident through faster resolution</div>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-3">
              <div className="text-purple-400 font-medium">Engineering Efficiency</div>
              <div className="text-2xl font-bold text-white">85% reduction</div>
              <div className="text-gray-400 text-sm">In manual troubleshooting effort</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
        <div className="text-green-400 font-bold text-lg mb-2">🚀 Market Positioning Achieved</div>
        <div className="text-gray-300">
          OpenConductor successfully bridges the Platform Engineering Chasm by delivering 
          the open-source flexibility of Backstage with the intelligence and ease-of-use 
          that enterprises demand, plus unique AIOps capabilities no competitor offers.
        </div>
      </div>
    </div>
  </Card>
);

export default ServicePageMockups;