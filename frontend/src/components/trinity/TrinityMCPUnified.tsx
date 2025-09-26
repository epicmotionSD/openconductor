/**
 * Trinity AI + MCP Unified Terminal
 * 
 * Professional Bloomberg Terminal-style interface combining Trinity AI agents
 * with MCP server registry and workflow automation capabilities.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Brain, Shield, Eye, Settings, Server, Workflow, 
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  Play, Pause, RefreshCw, Zap
} from 'lucide-react';
import { mockMCPData, MockMCPServer, MockMCPWorkflow, MockMCPExecution } from '../../services/mockMCPData';

interface TrinityMCPUnifiedProps {
  webSocketUrl: string;
  autoConnect: boolean;
  theme: 'dark' | 'bloomberg';
  onAgentInteraction: (agent: string, action: string, data: any) => void;
  onMCPInteraction: (action: string, data: any) => void;
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
  };
  mcpWorkflows: any[];
}

const TrinityMCPUnified: React.FC<TrinityMCPUnifiedProps> = ({
  webSocketUrl,
  autoConnect,
  theme,
  onAgentInteraction,
  onMCPInteraction
}) => {
  // Trinity AI States
  const [oracleState, setOracleState] = useState<TrinityAgentState>({
    id: 'oracle',
    name: 'Oracle',
    status: 'active',
    confidence: 94.2,
    lastUpdate: new Date(),
    metrics: { requestsProcessed: 1247, averageResponseTime: 145, successRate: 94.2 },
    mcpWorkflows: []
  });

  const [sentinelState, setSentinelState] = useState<TrinityAgentState>({
    id: 'sentinel', 
    name: 'Sentinel',
    status: 'active',
    confidence: 98.7,
    lastUpdate: new Date(),
    metrics: { requestsProcessed: 3421, averageResponseTime: 67, successRate: 98.7 },
    mcpWorkflows: []
  });

  const [sageState, setSageState] = useState<TrinityAgentState>({
    id: 'sage',
    name: 'Sage', 
    status: 'active',
    confidence: 91.8,
    lastUpdate: new Date(),
    metrics: { requestsProcessed: 892, averageResponseTime: 234, successRate: 91.8 },
    mcpWorkflows: []
  });

  // MCP States
  const [mcpServers, setMcpServers] = useState<MockMCPServer[]>([]);
  const [mcpWorkflows, setMcpWorkflows] = useState<MockMCPWorkflow[]>([]);
  const [mcpExecutions, setMcpExecutions] = useState<MockMCPExecution[]>([]);
  const [activePanel, setActivePanel] = useState('oracle');
  const [mcpPanelMode, setMcpPanelMode] = useState<'servers' | 'workflows' | 'executions' | 'analytics'>('servers');

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    latency: 42,
    messagesReceived: 0,
    lastUpdate: null as Date | null
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const updateCounterRef = useRef(0);

  // Initialize data and real-time updates
  useEffect(() => {
    const initializeData = async () => {
      try {
        const [servers, workflows, executions] = await Promise.all([
          mockMCPData.getServers(),
          mockMCPData.getWorkflows(),
          mockMCPData.getWorkflowExecutions()
        ]);

        setMcpServers(servers);
        setMcpWorkflows(workflows);
        setMcpExecutions(executions);

        // Load Trinity AI + MCP integration data
        const trinityIntegration = mockMCPData.getTrinityMCPIntegration();
        
        setOracleState(prev => ({ ...prev, mcpWorkflows: trinityIntegration.oracle_workflows }));
        setSentinelState(prev => ({ ...prev, mcpWorkflows: trinityIntegration.sentinel_workflows }));
        setSageState(prev => ({ ...prev, mcpWorkflows: trinityIntegration.sage_workflows }));

        // Simulate connection
        setConnectionStatus({
          connected: true,
          latency: 42,
          messagesReceived: 0,
          lastUpdate: new Date()
        });

        setIsStreaming(true);
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();
  }, []);

  // Real-time updates simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      updateCounterRef.current += 1;
      
      // Update Trinity AI states
      const updateAgent = (setState: React.Dispatch<React.SetStateAction<TrinityAgentState>>) => {
        setState(prev => ({
          ...prev,
          confidence: Math.max(85, Math.min(99, prev.confidence + (Math.random() - 0.5) * 2)),
          lastUpdate: new Date(),
          status: Math.random() > 0.9 ? 'processing' : 'active'
        }));
      };

      if (Math.random() > 0.7) updateAgent(setOracleState);
      if (Math.random() > 0.6) updateAgent(setSentinelState);
      if (Math.random() > 0.8) updateAgent(setSageState);

      // Update connection latency
      setConnectionStatus(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 50) + 25,
        messagesReceived: prev.messagesReceived + 1,
        lastUpdate: new Date()
      }));
    }, 2000);

    // Start MCP real-time updates
    const stopMCPUpdates = mockMCPData.startRealTimeUpdates((update) => {
      if (update.type === 'execution_update') {
        setMcpExecutions(update.data);
      }
    });

    return () => {
      clearInterval(interval);
      stopMCPUpdates();
    };
  }, [isStreaming]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      if (!isCtrlPressed) return;
      
      switch (event.key) {
        case '1':
          event.preventDefault();
          setActivePanel('oracle');
          break;
        case '2':
          event.preventDefault();
          setActivePanel('sentinel');
          break;
        case '3':
          event.preventDefault();
          setActivePanel('sage');
          break;
        case '4':
          event.preventDefault();
          setActivePanel('mcp');
          break;
        case 'r':
          event.preventDefault();
          window.location.reload();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Professional Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-cyan-400/20 p-4">
        <div className="flex items-center justify-between">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">OpenConductor Terminal</h1>
              <p className="text-xs text-gray-400">Trinity AI • MCP Automation • AIOps 2.0</p>
            </div>
          </div>
          
          {/* Center: Agent Status */}
          <div className="flex items-center gap-6">
            <AgentStatusIndicator agent={oracleState} color="blue" />
            <AgentStatusIndicator agent={sentinelState} color="green" />
            <AgentStatusIndicator agent={sageState} color="purple" />
          </div>
          
          {/* Right: Connection & Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-mono">
                {connectionStatus.connected ? 'CONNECTED' : 'DISCONNECTED'} • {connectionStatus.latency}ms
              </span>
            </div>
            
            <button
              onClick={toggleStreaming}
              className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              title={isStreaming ? 'Pause Updates' : 'Resume Updates'}
            >
              {isStreaming ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-4">
          <PanelTab 
            id="oracle" 
            label="Oracle" 
            subtitle="Predictive" 
            icon={Brain} 
            isActive={activePanel === 'oracle'}
            confidence={oracleState.confidence}
            onClick={() => setActivePanel('oracle')}
          />
          <PanelTab 
            id="sentinel" 
            label="Sentinel" 
            subtitle="Monitoring" 
            icon={Shield} 
            isActive={activePanel === 'sentinel'}
            confidence={sentinelState.confidence}
            onClick={() => setActivePanel('sentinel')}
          />
          <PanelTab 
            id="sage" 
            label="Sage" 
            subtitle="Advisory" 
            icon={Eye} 
            isActive={activePanel === 'sage'}
            confidence={sageState.confidence}
            onClick={() => setActivePanel('sage')}
          />
          <PanelTab 
            id="mcp" 
            label="MCP" 
            subtitle="Automation" 
            icon={Server} 
            isActive={activePanel === 'mcp'}
            confidence={95.4}
            onClick={() => setActivePanel('mcp')}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'oracle' && (
          <OraclePanel 
            agent={oracleState} 
            mcpWorkflows={oracleState.mcpWorkflows}
            onInteraction={onAgentInteraction}
          />
        )}
        
        {activePanel === 'sentinel' && (
          <SentinelPanel 
            agent={sentinelState}
            mcpWorkflows={sentinelState.mcpWorkflows}
            alerts={mockMCPData.generateAlertToWorkflowScenarios()}
            onInteraction={onAgentInteraction}
          />
        )}
        
        {activePanel === 'sage' && (
          <SagePanel 
            agent={sageState}
            mcpWorkflows={sageState.mcpWorkflows}
            onInteraction={onAgentInteraction}
          />
        )}
        
        {activePanel === 'mcp' && (
          <MCPPanel 
            mode={mcpPanelMode}
            servers={mcpServers}
            workflows={mcpWorkflows}
            executions={mcpExecutions}
            onModeChange={setMcpPanelMode}
            onInteraction={onMCPInteraction}
          />
        )}
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-900/95 border-t border-gray-700/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-gray-400">
            <span>OpenConductor v2.1.0 • Enterprise Edition</span>
            <span>Updates: {updateCounterRef.current}</span>
            <span>Last: {connectionStatus.lastUpdate?.toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center gap-4 text-gray-400">
            <span>Ctrl+1-4: Switch Panels</span>
            <span>Ctrl+R: Refresh</span>
            <span>MCP Servers: {mcpServers.length}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/**
 * Agent Status Indicator Component
 */
const AgentStatusIndicator: React.FC<{
  agent: TrinityAgentState;
  color: 'blue' | 'green' | 'purple';
}> = ({ agent, color }) => {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/20 border-blue-400/30',
    green: 'text-green-400 bg-green-500/20 border-green-400/30', 
    purple: 'text-purple-400 bg-purple-500/20 border-purple-400/30'
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${colorMap[color]}`}>
      <div className={`w-2 h-2 rounded-full ${agent.status === 'processing' ? 'animate-pulse' : ''} bg-current`}></div>
      <span className="text-xs font-medium">{agent.name}</span>
      <span className="text-xs font-mono">{agent.confidence.toFixed(1)}%</span>
    </div>
  );
};

/**
 * Panel Tab Component
 */
const PanelTab: React.FC<{
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
  confidence: number;
  onClick: () => void;
}> = ({ id, label, subtitle, icon: Icon, isActive, confidence, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
        isActive 
          ? 'bg-cyan-600/20 border border-cyan-400/30 text-cyan-400' 
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
      }`}
    >
      <Icon className="w-4 h-4" />
      <div className="text-left">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-75">{subtitle}</div>
      </div>
      <div className="text-xs font-mono">{confidence.toFixed(1)}%</div>
    </button>
  );
};

/**
 * Oracle Panel Component
 */
const OraclePanel: React.FC<{
  agent: TrinityAgentState;
  mcpWorkflows: any[];
  onInteraction: (agent: string, action: string, data: any) => void;
}> = ({ agent, mcpWorkflows, onInteraction }) => {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Agent Status */}
        <div className="bg-blue-900/20 border border-blue-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-400">🔮 Oracle - Predictive Intelligence</h2>
                <p className="text-blue-300">"The wisdom to see what's coming"</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{agent.confidence.toFixed(1)}%</div>
              <div className="text-blue-300 text-sm">Confidence</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900/10 rounded-lg p-3">
              <div className="text-blue-400 text-lg font-bold">{agent.metrics.requestsProcessed}</div>
              <div className="text-blue-300 text-sm">Predictions Made</div>
            </div>
            <div className="bg-blue-900/10 rounded-lg p-3">
              <div className="text-blue-400 text-lg font-bold">{agent.metrics.averageResponseTime}ms</div>
              <div className="text-blue-300 text-sm">Avg Response</div>
            </div>
            <div className="bg-blue-900/10 rounded-lg p-3">
              <div className="text-blue-400 text-lg font-bold">{agent.metrics.successRate}%</div>
              <div className="text-blue-300 text-sm">Success Rate</div>
            </div>
          </div>
        </div>

        {/* MCP Workflows */}
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔗 Oracle + MCP Automation Workflows</h3>
          <div className="space-y-3">
            {mcpWorkflows.map((workflow, index) => (
              <div key={index} className="bg-blue-900/10 border border-blue-400/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-blue-400 font-medium">{workflow.name}</h4>
                  <span className="text-green-400 text-sm">{workflow.success_rate}% success</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{workflow.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Trigger: {workflow.trigger}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Last: {workflow.last_triggered}</span>
                    <button 
                      onClick={() => onInteraction('oracle', 'execute_workflow', workflow)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sentinel Panel Component
 */
const SentinelPanel: React.FC<{
  agent: TrinityAgentState;
  mcpWorkflows: any[];
  alerts: any[];
  onInteraction: (agent: string, action: string, data: any) => void;
}> = ({ agent, mcpWorkflows, alerts, onInteraction }) => {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Agent Status */}
        <div className="bg-green-900/20 border border-green-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-400">🛡️ Sentinel - Monitoring Intelligence</h2>
                <p className="text-green-300">"The vigilance to know what's happening"</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">{agent.confidence.toFixed(1)}%</div>
              <div className="text-green-300 text-sm">System Health</div>
            </div>
          </div>
        </div>

        {/* Alert to Automation */}
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🚨 Alert → Automation Pipeline</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${
                alert.severity === 'critical' ? 'bg-red-900/20 border-red-400/30' :
                alert.severity === 'high' ? 'bg-orange-900/20 border-orange-400/30' :
                'bg-yellow-900/20 border-yellow-400/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{alert.type}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.status === 'automated_resolution_completed' ? 'bg-green-500/20 text-green-400' :
                      alert.status === 'automated_resolution_in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {alert.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">{alert.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Triggered Workflow:</span>
                    <div className="text-cyan-400">{alert.triggered_workflow}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">MCP Servers:</span>
                    <div className="text-gray-300">{alert.servers_used.join(', ')}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Resolution:</span>
                    <div className="text-green-400">{alert.estimated_resolution}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">AI Confidence:</span>
                    <div className="text-purple-400">{Math.round(alert.confidence * 100)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Sage Panel Component
 */
const SagePanel: React.FC<{
  agent: TrinityAgentState;
  mcpWorkflows: any[];
  onInteraction: (agent: string, action: string, data: any) => void;
}> = ({ agent, mcpWorkflows, onInteraction }) => {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Agent Status */}
        <div className="bg-purple-900/20 border border-purple-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-purple-400">🧠 Sage - Advisory Intelligence</h2>
                <p className="text-purple-300">"The intelligence to know what to do"</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">{agent.confidence.toFixed(1)}%</div>
              <div className="text-purple-300 text-sm">Advisory Score</div>
            </div>
          </div>
        </div>

        {/* Strategic Automation */}
        <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🎯 Strategic Automation Workflows</h3>
          <div className="space-y-3">
            {mcpWorkflows.map((workflow, index) => (
              <div key={index} className="bg-purple-900/10 border border-purple-400/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-purple-400 font-medium">{workflow.name}</h4>
                  <span className="text-green-400 text-sm">{workflow.success_rate}% success</span>
                </div>
                <p className="text-gray-300 text-sm mb-3">{workflow.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Servers: {workflow.servers?.join(', ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Last: {workflow.last_triggered}</span>
                    <button 
                      onClick={() => onInteraction('sage', 'execute_workflow', workflow)}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                    >
                      Execute
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * MCP Panel Component
 */
const MCPPanel: React.FC<{
  mode: 'servers' | 'workflows' | 'executions' | 'analytics';
  servers: MockMCPServer[];
  workflows: MockMCPWorkflow[];
  executions: MockMCPExecution[];
  onModeChange: (mode: 'servers' | 'workflows' | 'executions' | 'analytics') => void;
  onInteraction: (action: string, data: any) => void;
}> = ({ mode, servers, workflows, executions, onModeChange, onInteraction }) => {
  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* MCP Header */}
        <div className="bg-cyan-900/20 border border-cyan-400/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-400/30 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-cyan-400">🔗 MCP Server Registry & Automation</h2>
                <p className="text-cyan-300">"The npm for MCP Servers - Enterprise Edition"</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {(['servers', 'workflows', 'executions', 'analytics'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    mode === m 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-cyan-900/10 rounded-lg p-3">
              <div className="text-cyan-400 text-lg font-bold">{servers.length}</div>
              <div className="text-cyan-300 text-sm">Available Servers</div>
            </div>
            <div className="bg-green-900/10 rounded-lg p-3">
              <div className="text-green-400 text-lg font-bold">{workflows.length}</div>
              <div className="text-green-300 text-sm">Active Workflows</div>
            </div>
            <div className="bg-blue-900/10 rounded-lg p-3">
              <div className="text-blue-400 text-lg font-bold">{executions.filter(e => e.status === 'running').length}</div>
              <div className="text-blue-300 text-sm">Running Now</div>
            </div>
            <div className="bg-purple-900/10 rounded-lg p-3">
              <div className="text-purple-400 text-lg font-bold">95.4%</div>
              <div className="text-purple-300 text-sm">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Dynamic Content Based on Mode */}
        {mode === 'servers' && (
          <MCPServerBrowser servers={servers} onInteraction={onInteraction} />
        )}
        
        {mode === 'workflows' && (
          <MCPWorkflowManager workflows={workflows} onInteraction={onInteraction} />
        )}
        
        {mode === 'executions' && (
          <MCPExecutionMonitor executions={executions} onInteraction={onInteraction} />
        )}
        
        {mode === 'analytics' && (
          <MCPAnalyticsDashboard onInteraction={onInteraction} />
        )}
      </div>
    </div>
  );
};

/**
 * MCP Server Browser Component
 */
const MCPServerBrowser: React.FC<{
  servers: MockMCPServer[];
  onInteraction: (action: string, data: any) => void;
}> = ({ servers, onInteraction }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">🔍 MCP Server Registry</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {servers.slice(0, 6).map((server) => (
          <div key={server.id} className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{server.display_name}</h4>
              <div className="flex items-center gap-2">
                {server.is_verified && (
                  <span className="text-green-400 text-xs">✓ Verified</span>
                )}
                {server.is_featured && (
                  <span className="text-yellow-400 text-xs">★ Featured</span>
                )}
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-3">{server.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>⭐ {server.star_count}</span>
                <span>📥 {server.download_count}</span>
                <span>🔧 {server.tool_count} tools</span>
              </div>
              <button 
                onClick={() => onInteraction('install_server', server)}
                className="px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MCP Workflow Manager Component
 */
const MCPWorkflowManager: React.FC<{
  workflows: MockMCPWorkflow[];
  onInteraction: (action: string, data: any) => void;
}> = ({ workflows, onInteraction }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">⚡ Workflow Management</h3>
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{workflow.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs">{workflow.success_rate}% success</span>
                <span className="text-blue-400 text-xs">{workflow.execution_count} runs</span>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-3">{workflow.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>⭐ {workflow.star_count}</span>
                <span>📊 {workflow.avg_execution_time}ms avg</span>
                <span>👤 {workflow.author_name}</span>
              </div>
              <button 
                onClick={() => onInteraction('execute_workflow', workflow)}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MCP Execution Monitor Component
 */
const MCPExecutionMonitor: React.FC<{
  executions: MockMCPExecution[];
  onInteraction: (action: string, data: any) => void;
}> = ({ executions, onInteraction }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Real-time Execution Monitor</h3>
      <div className="space-y-3">
        {executions.slice(0, 8).map((execution) => (
          <div key={execution.id} className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">{execution.workflow_name}</h4>
              <span className={`text-xs px-2 py-1 rounded ${
                execution.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                execution.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                execution.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {execution.status}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{execution.progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    execution.status === 'completed' ? 'bg-green-400' :
                    execution.status === 'failed' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`}
                  style={{ width: `${execution.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <span>Current Step:</span>
                <div className="text-white">{execution.current_step}</div>
              </div>
              <div>
                <span>Steps:</span>
                <div className="text-white">{execution.total_steps} total</div>
              </div>
              <div>
                <span>Started:</span>
                <div className="text-white">{new Date(execution.started_at).toLocaleTimeString()}</div>
              </div>
              <div>
                <span>Duration:</span>
                <div className="text-white">
                  {execution.execution_time_ms 
                    ? `${execution.execution_time_ms}ms` 
                    : `${Math.floor((Date.now() - new Date(execution.started_at).getTime()) / 1000)}s`
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MCP Analytics Dashboard Component
 */
const MCPAnalyticsDashboard: React.FC<{
  onInteraction: (action: string, data: any) => void;
}> = ({ onInteraction }) => {
  return (
    <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📈 MCP Platform Analytics</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-cyan-900/20 border border-cyan-400/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">2,340</div>
          <div className="text-cyan-300 text-sm">Total Servers</div>
        </div>
        <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">8,934</div>
          <div className="text-green-300 text-sm">Active Workflows</div>
        </div>
        <div className="bg-blue-900/20 border border-blue-400/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">45,672</div>
          <div className="text-blue-300 text-sm">Total Executions</div>
        </div>
        <div className="bg-purple-900/20 border border-purple-400/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">94.2%</div>
          <div className="text-purple-300 text-sm">Success Rate</div>
        </div>
      </div>

      <div className="text-center text-gray-400">
        <TrendingUp className="w-8 h-8 mx-auto mb-2" />
        <p>Real-time analytics charts and detailed metrics coming in production deployment</p>
      </div>
    </div>
  );
};

export default TrinityMCPUnified;