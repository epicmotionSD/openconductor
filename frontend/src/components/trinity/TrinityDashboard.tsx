/**
 * Trinity Agent Dashboard
 * 
 * Professional Bloomberg Terminal-style interface focused on Trinity AI agents
 * with MCP automation running as supporting infrastructure in the background.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Shield, Eye, Settings, TrendingUp, AlertTriangle, 
  CheckCircle, Clock, Play, Pause, RefreshCw, Zap, DollarSign,
  Activity, Users, Award, BarChart3
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { mockMCPData } from '../../services/mockMCPData';

interface TrinityDashboardProps {
  webSocketUrl: string;
  autoConnect: boolean;
  theme: 'dark' | 'bloomberg';
  onAgentInteraction: (agent: string, action: string, data: any) => void;
}

interface TrinityAgentState {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  confidence: number;
  lastUpdate: Date;
  metrics: {
    requestsProcessed: number;
    averageResponseTime: number;
    successRate: number;
    roiImpact: number;
  };
  automationWorkflows: number;
}

const TrinityDashboard: React.FC<TrinityDashboardProps> = ({
  webSocketUrl,
  autoConnect,
  theme,
  onAgentInteraction
}) => {
  const { data: session } = useSession();
  const [activeAgent, setActiveAgent] = useState('oracle');
  
  // Trinity AI States
  const [oracleState, setOracleState] = useState<TrinityAgentState>({
    id: 'oracle',
    name: 'Oracle Analytics',
    status: 'active',
    confidence: 94.2,
    lastUpdate: new Date(),
    metrics: { 
      requestsProcessed: 1247, 
      averageResponseTime: 145, 
      successRate: 94.2, 
      roiImpact: 150000 
    },
    automationWorkflows: 12
  });

  const [sentinelState, setSentinelState] = useState<TrinityAgentState>({
    id: 'sentinel', 
    name: 'Sentinel Monitoring',
    status: 'active',
    confidence: 98.7,
    lastUpdate: new Date(),
    metrics: { 
      requestsProcessed: 3421, 
      averageResponseTime: 67, 
      successRate: 98.7, 
      roiImpact: 75000 
    },
    automationWorkflows: 8
  });

  const [sageState, setSageState] = useState<TrinityAgentState>({
    id: 'sage',
    name: 'Sage Optimization', 
    status: 'active',
    confidence: 91.8,
    lastUpdate: new Date(),
    metrics: { 
      requestsProcessed: 892, 
      averageResponseTime: 234, 
      successRate: 91.8, 
      roiImpact: 200000 
    },
    automationWorkflows: 15
  });

  // Connection and streaming state
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    latency: 42,
    messagesReceived: 0,
    lastUpdate: null as Date | null
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [showAutomationDetails, setShowAutomationDetails] = useState(false);
  const updateCounterRef = useRef(0);

  // Initialize real-time updates
  useEffect(() => {
    const initializeData = async () => {
      // Simulate connection
      setConnectionStatus({
        connected: true,
        latency: 42,
        messagesReceived: 0,
        lastUpdate: new Date()
      });
      setIsStreaming(true);
    };

    initializeData();
  }, []);

  // Real-time updates simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      updateCounterRef.current += 1;
      
      // Update Trinity AI states with realistic fluctuations
      const updateAgent = (setState: React.Dispatch<React.SetStateAction<TrinityAgentState>>) => {
        setState(prev => ({
          ...prev,
          confidence: Math.max(85, Math.min(99, prev.confidence + (Math.random() - 0.5) * 1.5)),
          lastUpdate: new Date(),
          status: Math.random() > 0.9 ? 'processing' : 'active',
          metrics: {
            ...prev.metrics,
            requestsProcessed: prev.metrics.requestsProcessed + Math.floor(Math.random() * 3),
            roiImpact: prev.metrics.roiImpact + Math.floor(Math.random() * 1000)
          }
        }));
      };

      if (Math.random() > 0.7) updateAgent(setOracleState);
      if (Math.random() > 0.6) updateAgent(setSentinelState);
      if (Math.random() > 0.8) updateAgent(setSageState);

      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 50) + 25,
        messagesReceived: prev.messagesReceived + 1,
        lastUpdate: new Date()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      if (!isCtrlPressed) return;
      
      switch (event.key) {
        case '1':
          event.preventDefault();
          setActiveAgent('oracle');
          break;
        case '2':
          event.preventDefault();
          setActiveAgent('sentinel');
          break;
        case '3':
          event.preventDefault();
          setActiveAgent('sage');
          break;
        case 'a':
          event.preventDefault();
          setShowAutomationDetails(!showAutomationDetails);
          break;
        case 'r':
          event.preventDefault();
          window.location.reload();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAutomationDetails]);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const currentAgent = activeAgent === 'oracle' ? oracleState : 
                     activeAgent === 'sentinel' ? sentinelState : sageState;

  const totalRoiImpact = oracleState.metrics.roiImpact + sentinelState.metrics.roiImpact + sageState.metrics.roiImpact;
  const totalInteractions = oracleState.metrics.requestsProcessed + sentinelState.metrics.requestsProcessed + sageState.metrics.requestsProcessed;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Professional Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Trinity Branding */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">Trinity Agent Intelligence</h1>
              <p className="text-xs text-gray-400">Oracle • Sentinel • Sage • Enterprise Platform</p>
            </div>
          </div>
          
          {/* Center: Live ROI Metrics */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div className="text-right">
                <div className="text-sm font-bold text-green-400">
                  ${(totalRoiImpact / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-green-300">Monthly ROI</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <Activity className="w-4 h-4 text-blue-400" />
              <div className="text-right">
                <div className="text-sm font-bold text-blue-400">
                  {totalInteractions.toLocaleString()}
                </div>
                <div className="text-xs text-blue-300">Total Interactions</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <div className="text-right">
                <div className="text-sm font-bold text-purple-400">
                  {Math.round((oracleState.confidence + sentinelState.confidence + sageState.confidence) / 3)}%
                </div>
                <div className="text-xs text-purple-300">Avg Confidence</div>
              </div>
            </div>
          </div>
          
          {/* Right: Connection & Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-mono">
                LIVE • {connectionStatus.latency}ms
              </span>
            </div>
            
            <button
              onClick={toggleStreaming}
              className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              title={isStreaming ? 'Pause Updates' : 'Resume Updates'}
            >
              {isStreaming ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setShowAutomationDetails(!showAutomationDetails)}
              className={`p-2 transition-colors ${showAutomationDetails ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-300'}`}
              title="Toggle Automation Details"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Trinity Agent Navigation */}
        <div className="flex items-center gap-1 mt-4">
          <AgentTab 
            id="oracle" 
            label="Oracle Analytics" 
            subtitle="Predictive Intelligence" 
            icon={Brain} 
            isActive={activeAgent === 'oracle'}
            confidence={oracleState.confidence}
            roiImpact={oracleState.metrics.roiImpact}
            workflows={oracleState.automationWorkflows}
            onClick={() => setActiveAgent('oracle')}
          />
          <AgentTab 
            id="sentinel" 
            label="Sentinel Monitoring" 
            subtitle="System Intelligence" 
            icon={Shield} 
            isActive={activeAgent === 'sentinel'}
            confidence={sentinelState.confidence}
            roiImpact={sentinelState.metrics.roiImpact}
            workflows={sentinelState.automationWorkflows}
            onClick={() => setActiveAgent('sentinel')}
          />
          <AgentTab 
            id="sage" 
            label="Sage Optimization" 
            subtitle="Advisory Intelligence" 
            icon={Eye} 
            isActive={activeAgent === 'sage'}
            confidence={sageState.confidence}
            roiImpact={sageState.metrics.roiImpact}
            workflows={sageState.automationWorkflows}
            onClick={() => setActiveAgent('sage')}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Primary Agent Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeAgent === 'oracle' && (
            <TrinityAgentPanel 
              agent={oracleState} 
              agentType="oracle"
              onInteraction={onAgentInteraction}
              showAutomationDetails={showAutomationDetails}
            />
          )}
          
          {activeAgent === 'sentinel' && (
            <TrinityAgentPanel 
              agent={sentinelState}
              agentType="sentinel"
              onInteraction={onAgentInteraction}
              showAutomationDetails={showAutomationDetails}
            />
          )}
          
          {activeAgent === 'sage' && (
            <TrinityAgentPanel 
              agent={sageState}
              agentType="sage"
              onInteraction={onAgentInteraction}
              showAutomationDetails={showAutomationDetails}
            />
          )}
        </div>

        {/* Automation Sidebar (collapsible) */}
        {showAutomationDetails && (
          <div className="w-80 bg-gray-900/50 border-l border-gray-700/30 p-4 overflow-y-auto">
            <AutomationSidebar 
              agentType={activeAgent}
              workflows={currentAgent.automationWorkflows}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-900/95 border-t border-gray-700/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-gray-400">
            <span>Trinity Agent Platform v2.1.0 • Enterprise Edition</span>
            <span>User: {session?.user?.name || 'Demo Mode'}</span>
            <span>Updates: {updateCounterRef.current}</span>
          </div>
          
          <div className="flex items-center gap-4 text-gray-400">
            <span>Ctrl+1-3: Switch Agents</span>
            <span>Ctrl+A: Toggle Automation</span>
            <span>Ctrl+R: Refresh</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * Trinity Agent Tab Component
 */
const AgentTab: React.FC<{
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  confidence: number;
  roiImpact: number;
  workflows: number;
  onClick: () => void;
}> = ({ id, label, subtitle, icon: Icon, isActive, confidence, roiImpact, workflows, onClick }) => {
  const getColorClass = () => {
    if (id === 'oracle') return 'text-blue-400 border-blue-400/30 bg-blue-500/20';
    if (id === 'sentinel') return 'text-green-400 border-green-400/30 bg-green-500/20';
    return 'text-purple-400 border-purple-400/30 bg-purple-500/20';
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-w-[280px] ${
        isActive 
          ? `${getColorClass()} border` 
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="text-left flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-75">{subtitle}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono">{confidence.toFixed(1)}%</div>
        <div className="text-xs opacity-75">${(roiImpact/1000).toFixed(0)}k</div>
      </div>
    </button>
  );
};

/**
 * Trinity Agent Panel Component
 */
const TrinityAgentPanel: React.FC<{
  agent: TrinityAgentState;
  agentType: string;
  onInteraction: (agent: string, action: string, data: any) => void;
  showAutomationDetails: boolean;
}> = ({ agent, agentType, onInteraction, showAutomationDetails }) => {
  const getAgentEmoji = () => {
    if (agentType === 'oracle') return '🔮';
    if (agentType === 'sentinel') return '🛡️';
    return '🧠';
  };

  const getColorClasses = () => {
    if (agentType === 'oracle') return {
      primary: 'blue-400',
      bg: 'blue-900/20',
      border: 'blue-400/20',
      accent: 'blue-500/20'
    };
    if (agentType === 'sentinel') return {
      primary: 'green-400',
      bg: 'green-900/20',
      border: 'green-400/20',
      accent: 'green-500/20'
    };
    return {
      primary: 'purple-400',
      bg: 'purple-900/20',
      border: 'purple-400/20',
      accent: 'purple-500/20'
    };
  };

  const colors = getColorClasses();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Agent Status Header */}
      <div className={`bg-${colors.bg} border border-${colors.border} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-${colors.accent} border border-${colors.border} rounded-xl flex items-center justify-center text-2xl`}>
              {getAgentEmoji()}
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-${colors.primary}`}>
                {agent.name}
              </h2>
              <p className={`text-${colors.primary}/80 text-lg`}>
                {agentType === 'oracle' && '"The wisdom to see what\'s coming"'}
                {agentType === 'sentinel' && '"The vigilance to know what\'s happening"'}
                {agentType === 'sage' && '"The intelligence to know what to do"'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-4xl font-bold text-${colors.primary} mb-2`}>
              {agent.confidence.toFixed(1)}%
            </div>
            <div className={`text-${colors.primary}/80`}>Confidence Score</div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <MetricCard 
            label="Interactions" 
            value={agent.metrics.requestsProcessed.toLocaleString()}
            color={colors.primary}
            bgColor={colors.accent}
          />
          <MetricCard 
            label="Avg Response" 
            value={`${agent.metrics.averageResponseTime}ms`}
            color={colors.primary}
            bgColor={colors.accent}
          />
          <MetricCard 
            label="Success Rate" 
            value={`${agent.metrics.successRate.toFixed(1)}%`}
            color={colors.primary}
            bgColor={colors.accent}
          />
          <MetricCard 
            label="ROI Impact" 
            value={`$${(agent.metrics.roiImpact / 1000).toFixed(0)}k`}
            color={colors.primary}
            bgColor={colors.accent}
          />
        </div>
      </div>

      {/* Agent-Specific Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Main Agent Interface */}
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {agentType === 'oracle' && '🔮 Predictive Analytics'}
            {agentType === 'sentinel' && '🛡️ System Monitoring'}
            {agentType === 'sage' && '🧠 Strategic Advisory'}
          </h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => onInteraction(agentType, 'execute', {})}
              className={`w-full px-4 py-3 bg-${colors.primary}/20 border border-${colors.primary}/30 text-${colors.primary} rounded-lg hover:bg-${colors.primary}/30 transition-colors font-medium`}
            >
              {agentType === 'oracle' && 'Generate Prediction'}
              {agentType === 'sentinel' && 'Run Health Check'}
              {agentType === 'sage' && 'Get Recommendation'}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button className={`px-3 py-2 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 transition-colors`}>
                View History
              </button>
              <button className={`px-3 py-2 bg-gray-800 text-gray-300 rounded text-sm hover:bg-gray-700 transition-colors`}>
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Live Performance */}
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚡ Live Performance</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Current Load</span>
                <span className="text-white">{Math.floor(Math.random() * 40 + 20)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full bg-${colors.primary} transition-all duration-300`} style={{width: `${Math.floor(Math.random() * 40 + 20)}%`}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Response Quality</span>
                <span className="text-white">{agent.confidence.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full bg-${colors.primary} transition-all duration-300`} style={{width: `${agent.confidence}%`}}></div>
              </div>
            </div>

            <div className={`bg-${colors.accent} border border-${colors.border} rounded-lg p-3 mt-4`}>
              <div className="text-sm text-gray-300 mb-1">Background Automation</div>
              <div className={`text-${colors.primary} font-semibold`}>
                {agent.automationWorkflows} workflows active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Recent Activity</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 bg-${colors.accent} rounded-lg flex items-center justify-center`}>
                  <CheckCircle className={`w-4 h-4 text-${colors.primary}`} />
                </div>
                <div>
                  <div className="text-white text-sm">
                    {agentType === 'oracle' && `Prediction #${1000 + i} completed`}
                    {agentType === 'sentinel' && `Health check #${2000 + i} passed`}
                    {agentType === 'sage' && `Advisory #${3000 + i} generated`}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {Math.floor(Math.random() * 30) + 1} minutes ago
                  </div>
                </div>
              </div>
              <div className={`text-${colors.primary} text-sm font-medium`}>
                {Math.floor(Math.random() * 20 + 80)}% confidence
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  label: string;
  value: string;
  color: string;
  bgColor: string;
}> = ({ label, value, color, bgColor }) => (
  <div className={`bg-${bgColor} rounded-lg p-3`}>
    <div className={`text-${color} text-lg font-bold`}>{value}</div>
    <div className={`text-${color}/80 text-sm`}>{label}</div>
  </div>
);

/**
 * Automation Sidebar Component
 */
const AutomationSidebar: React.FC<{
  agentType: string;
  workflows: number;
}> = ({ agentType, workflows }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-white border-b border-gray-700/30 pb-2">
      🔗 Background Automation
    </h3>
    
    <div className="text-sm text-gray-400 mb-4">
      MCP infrastructure powering {workflows} automated workflows for {agentType} agent.
    </div>

    <div className="space-y-3">
      {[...Array(Math.min(workflows, 5))].map((_, i) => (
        <div key={i} className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
          <div className="text-white text-sm font-medium mb-1">
            {agentType === 'oracle' && `Prediction Trigger #${i + 1}`}
            {agentType === 'sentinel' && `Alert Response #${i + 1}`}
            {agentType === 'sage' && `Advisory Workflow #${i + 1}`}
          </div>
          <div className="text-gray-400 text-xs mb-2">
            Last executed {Math.floor(Math.random() * 60)} minutes ago
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-xs">Active</span>
          </div>
        </div>
      ))}
    </div>

    <button className="w-full px-3 py-2 bg-cyan-600/20 border border-cyan-400/30 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-colors text-sm">
      View All Workflows
    </button>
  </div>
);

export default TrinityDashboard;