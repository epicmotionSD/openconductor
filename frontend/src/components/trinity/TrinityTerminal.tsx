/**
 * Trinity AI Terminal - Bloomberg Terminal Style Dashboard
 * 
 * Professional-grade AI agent orchestration interface featuring the Trinity AI pattern:
 * - Oracle (Predictive Intelligence) - Left Panel
 * - Sentinel (Monitoring Intelligence) - Center Panel  
 * - Sage (Advisory Intelligence) - Right Panel
 * 
 * Features:
 * - Real-time agent coordination and communication
 * - Bloomberg Terminal-style professional UI/UX
 * - Glassmorphism design with agent-specific themes
 * - Advanced keyboard shortcuts and power user features
 * - WebSocket integration for live agent updates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrinityCard, TrinityAgentCard } from '../ui/trinity-card';
import { cn } from '../../utils/cn';
// Styles are handled in main.css with Tailwind

interface TrinityAgentState {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  confidence: number;
  lastUpdate: Date;
  data: any;
  metrics: {
    requestsProcessed: number;
    averageResponseTime: number;
    successRate: number;
  };
}

interface TrinityTerminalConfig {
  theme: 'dark' | 'bloomberg';
  layout: 'standard' | 'focused' | 'coordinated';
  refreshRate: number;
  soundEnabled: boolean;
  autoConnect: boolean;
  agentSubscriptions: string[];
}

interface TrinityConnectionStatus {
  connected: boolean;
  latency: number;
  messagesReceived: number;
  lastUpdate: Date | null;
  activeAgents: string[];
}

const TrinityTerminal: React.FC = () => {
  // Terminal state
  const [config, setConfig] = useState<TrinityTerminalConfig>({
    theme: 'bloomberg',
    layout: 'coordinated',
    refreshRate: 1000,
    soundEnabled: true,
    autoConnect: true,
    agentSubscriptions: ['oracle_predictions', 'sentinel_monitoring', 'sage_advisory']
  });

  const [activeAgent, setActiveAgent] = useState<string>('oracle');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [agentCoordinationMode, setAgentCoordinationMode] = useState<boolean>(true);

  // Trinity AI Agent States
  const [oracleState, setOracleState] = useState<TrinityAgentState>({
    id: 'oracle',
    name: 'Oracle',
    status: 'active',
    confidence: 94.2,
    lastUpdate: new Date(),
    data: {
      predictions: [],
      forecasts: [],
      models: ['time-series', 'regression', 'classification']
    },
    metrics: {
      requestsProcessed: 1247,
      averageResponseTime: 145,
      successRate: 94.2
    }
  });

  const [sentinelState, setSentinelState] = useState<TrinityAgentState>({
    id: 'sentinel',
    name: 'Sentinel',
    status: 'active',
    confidence: 98.7,
    lastUpdate: new Date(),
    data: {
      alerts: [],
      monitoring: [],
      thresholds: []
    },
    metrics: {
      requestsProcessed: 3421,
      averageResponseTime: 67,
      successRate: 98.7
    }
  });

  const [sageState, setSageState] = useState<TrinityAgentState>({
    id: 'sage',
    name: 'Sage',
    status: 'active',
    confidence: 91.8,
    lastUpdate: new Date(),
    data: {
      recommendations: [],
      decisions: [],
      strategies: []
    },
    metrics: {
      requestsProcessed: 892,
      averageResponseTime: 234,
      successRate: 91.8
    }
  });

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<TrinityConnectionStatus>({
    connected: false,
    latency: 0,
    messagesReceived: 0,
    lastUpdate: null,
    activeAgents: []
  });

  // Refs for performance optimization
  const terminalRef = useRef<HTMLDivElement>(null);
  const updateCounterRef = useRef<number>(0);
  const coordinationLogRef = useRef<any[]>([]);

  // Simulated WebSocket connection and agent coordination
  useEffect(() => {
    const simulateConnection = () => {
      setConnectionStatus(prev => ({
        ...prev,
        connected: true,
        latency: Math.floor(Math.random() * 100) + 50,
        lastUpdate: new Date(),
        activeAgents: ['oracle', 'sentinel', 'sage']
      }));
    };

    const simulateAgentUpdates = () => {
      // Simulate Oracle predictions
      if (Math.random() > 0.7) {
        setOracleState(prev => ({
          ...prev,
          status: 'processing',
          lastUpdate: new Date(),
          metrics: {
            ...prev.metrics,
            requestsProcessed: prev.metrics.requestsProcessed + 1
          }
        }));

        setTimeout(() => {
          setOracleState(prev => ({
            ...prev,
            status: 'active',
            confidence: Math.floor(Math.random() * 10) + 90,
            data: {
              ...prev.data,
              predictions: [...(prev.data.predictions || []).slice(-4), {
                id: Date.now(),
                type: 'forecast',
                value: Math.random() * 100,
                timestamp: new Date()
              }]
            }
          }));
        }, Math.random() * 2000 + 500);
      }

      // Simulate Sentinel monitoring
      if (Math.random() > 0.8) {
        setSentinelState(prev => ({
          ...prev,
          status: 'processing',
          lastUpdate: new Date(),
          metrics: {
            ...prev.metrics,
            requestsProcessed: prev.metrics.requestsProcessed + 1
          }
        }));

        setTimeout(() => {
          setSentinelState(prev => ({
            ...prev,
            status: 'active',
            confidence: Math.floor(Math.random() * 5) + 95,
            data: {
              ...prev.data,
              alerts: [...(prev.data.alerts || []).slice(-3), {
                id: Date.now(),
                type: Math.random() > 0.5 ? 'info' : 'warning',
                message: `System metric threshold ${Math.random() > 0.5 ? 'exceeded' : 'normal'}`,
                timestamp: new Date()
              }]
            }
          }));
        }, Math.random() * 1000 + 200);
      }

      // Simulate Sage recommendations
      if (Math.random() > 0.9) {
        setSageState(prev => ({
          ...prev,
          status: 'processing',
          lastUpdate: new Date(),
          metrics: {
            ...prev.metrics,
            requestsProcessed: prev.metrics.requestsProcessed + 1
          }
        }));

        setTimeout(() => {
          setSageState(prev => ({
            ...prev,
            status: 'active',
            confidence: Math.floor(Math.random() * 15) + 85,
            data: {
              ...prev.data,
              recommendations: [...(prev.data.recommendations || []).slice(-2), {
                id: Date.now(),
                type: 'strategic',
                action: 'Optimize resource allocation based on predictions',
                impact: 'high',
                timestamp: new Date()
              }]
            }
          }));
        }, Math.random() * 3000 + 1000);
      }

      updateCounterRef.current += 1;
    };

    simulateConnection();
    const connectionInterval = setInterval(simulateConnection, 30000);
    const updateInterval = setInterval(simulateAgentUpdates, config.refreshRate);

    return () => {
      clearInterval(connectionInterval);
      clearInterval(updateInterval);
    };
  }, [config.refreshRate]);

  // Keyboard shortcuts for Bloomberg Terminal-style navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      if (!isCtrlPressed) return;
      
      switch (event.key) {
        case '1':
          event.preventDefault();
          setActiveAgent('oracle');
          console.log('[Trinity Terminal] Switched to Oracle Agent (Ctrl+1)');
          break;
          
        case '2':
          event.preventDefault();
          setActiveAgent('sentinel');
          console.log('[Trinity Terminal] Switched to Sentinel Agent (Ctrl+2)');
          break;
          
        case '3':
          event.preventDefault();
          setActiveAgent('sage');
          console.log('[Trinity Terminal] Switched to Sage Agent (Ctrl+3)');
          break;
          
        case 'c':
          event.preventDefault();
          setAgentCoordinationMode(!agentCoordinationMode);
          console.log('[Trinity Terminal] Toggled coordination mode (Ctrl+C)');
          break;
          
        case 'p':
          event.preventDefault();
          setCommandPaletteOpen(true);
          console.log('[Trinity Terminal] Command palette opened (Ctrl+P)');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [agentCoordinationMode]);

  const getConnectionStatusColor = () => {
    if (!connectionStatus.connected) return 'text-red-400';
    if (connectionStatus.latency > 200) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleAgentInteraction = useCallback((agent: string, action: string) => {
    console.log(`[Trinity Terminal] Agent ${agent} interaction: ${action}`);
    coordinationLogRef.current.push({
      timestamp: new Date(),
      agent,
      action,
      user: 'terminal-user'
    });
  }, []);

  return (
    <div ref={terminalRef} className="trinity-terminal-layout">
      {/* Terminal Header */}
      <div className="trinity-card-base trinity-neutral-theme p-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🔗</div>
              <div>
                <div className="trinity-display-sm text-white">Trinity AI Terminal</div>
                <div className="trinity-body-sm text-gray-400">Orchestrating the Future of Enterprise AI</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", 
                connectionStatus.connected ? "bg-green-400 trinity-animate-pulse-sentinel" : "bg-red-400"
              )} />
              <span className={cn("trinity-body-sm", getConnectionStatusColor())}>
                {connectionStatus.connected ? 'COORDINATED' : 'DISCONNECTED'}
              </span>
              <span className="trinity-body-sm text-gray-400">
                {connectionStatus.latency}ms
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAgentCoordinationMode(!agentCoordinationMode)}
              className={cn(
                "px-3 py-1 rounded-md text-sm transition-all",
                agentCoordinationMode 
                  ? "trinity-gradient-oracle text-white shadow-glow" 
                  : "trinity-card-glass text-gray-300 hover:text-white"
              )}
            >
              {agentCoordinationMode ? 'Coordinated' : 'Independent'}
            </button>
            <div className="trinity-body-sm text-gray-400">
              Updates: {updateCounterRef.current}
            </div>
          </div>
        </div>
      </div>

      {/* Main Trinity AI Layout */}
      <div className="flex h-full">
        {/* Oracle Agent - Left Panel (Predictive Intelligence) */}
        <div className="trinity-panel-left">
          <div className="p-6 h-full overflow-y-auto">
            <TrinityAgentCard
              agent="oracle"
              title="Predictive Intelligence System Active"
              confidence={oracleState.confidence}
              status={oracleState.status}
              data={{
                activeModels: oracleState.data.models,
                recentPredictions: oracleState.data.predictions?.length || 0,
                avgResponseTime: `${oracleState.metrics.averageResponseTime}ms`
              }}
              onInteraction={(action) => handleAgentInteraction('oracle', action)}
              className="mb-6"
            />
            
            <TrinityCard variant="glass" agent="oracle" className="p-4">
              <div className="trinity-body-md text-blue-100 mb-4">Recent Predictions</div>
              <div className="space-y-2">
                {oracleState.data.predictions?.slice(-5).map((prediction: any) => (
                  <div key={prediction.id} className="trinity-glass-oracle rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="trinity-body-sm text-blue-200">{prediction.type}</span>
                      <span className="trinity-body-sm text-blue-300 font-medium">
                        {prediction.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )) || <div className="trinity-body-sm text-blue-300">No recent predictions</div>}
              </div>
            </TrinityCard>
          </div>
        </div>

        {/* Sentinel Agent - Center Panel (Monitoring Intelligence) */}
        <div className="trinity-panel-center">
          <div className="p-6 h-full overflow-y-auto">
            <TrinityAgentCard
              agent="sentinel"
              title="Monitoring Intelligence System Operational"
              confidence={sentinelState.confidence}
              status={sentinelState.status}
              data={{
                activeMonitors: sentinelState.data.monitoring?.length || 0,
                alertsActive: sentinelState.data.alerts?.length || 0,
                systemHealth: `${sentinelState.confidence}%`
              }}
              onInteraction={(action) => handleAgentInteraction('sentinel', action)}
              className="mb-6"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrinityCard variant="glass" agent="sentinel" className="p-4">
                <div className="trinity-body-md text-green-100 mb-4">System Alerts</div>
                <div className="space-y-2">
                  {sentinelState.data.alerts?.slice(-4).map((alert: any) => (
                    <div key={alert.id} className={cn(
                      "trinity-glass-sentinel rounded p-3",
                      alert.type === 'warning' && "border-yellow-400/20"
                    )}>
                      <div className="trinity-body-sm text-green-200">{alert.message}</div>
                      <div className="trinity-body-sm text-green-400 text-xs mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  )) || <div className="trinity-body-sm text-green-300">System nominal</div>}
                </div>
              </TrinityCard>
              
              <TrinityCard variant="glass" agent="sentinel" className="p-4">
                <div className="trinity-body-md text-green-100 mb-4">Performance Metrics</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="trinity-body-sm text-green-200">Requests Processed</span>
                    <span className="trinity-body-sm text-green-300 font-medium">
                      {sentinelState.metrics.requestsProcessed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="trinity-body-sm text-green-200">Avg Response Time</span>
                    <span className="trinity-body-sm text-green-300 font-medium">
                      {sentinelState.metrics.averageResponseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="trinity-body-sm text-green-200">Success Rate</span>
                    <span className="trinity-body-sm text-green-300 font-medium">
                      {sentinelState.metrics.successRate}%
                    </span>
                  </div>
                </div>
              </TrinityCard>
            </div>
          </div>
        </div>

        {/* Sage Agent - Right Panel (Advisory Intelligence) */}
        <div className="trinity-panel-right">
          <div className="p-6 h-full overflow-y-auto">
            <TrinityAgentCard
              agent="sage"
              title="Advisory Intelligence System Ready"
              confidence={sageState.confidence}
              status={sageState.status}
              data={{
                recommendationsActive: sageState.data.recommendations?.length || 0,
                decisionsSupported: sageState.data.decisions?.length || 0,
                avgResponseTime: `${sageState.metrics.averageResponseTime}ms`
              }}
              onInteraction={(action) => handleAgentInteraction('sage', action)}
              className="mb-6"
            />
            
            <TrinityCard variant="glass" agent="sage" className="p-4">
              <div className="trinity-body-md text-purple-100 mb-4">Strategic Recommendations</div>
              <div className="space-y-3">
                {sageState.data.recommendations?.slice(-3).map((recommendation: any) => (
                  <div key={recommendation.id} className="trinity-glass-sage rounded p-3">
                    <div className="trinity-body-sm text-purple-200 mb-2">
                      {recommendation.action}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        recommendation.impact === 'high' 
                          ? "bg-purple-500/30 text-purple-300" 
                          : "bg-purple-600/20 text-purple-400"
                      )}>
                        {recommendation.impact} impact
                      </span>
                      <span className="trinity-body-sm text-purple-400 text-xs">
                        {recommendation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )) || <div className="trinity-body-sm text-purple-300">No active recommendations</div>}
              </div>
            </TrinityCard>
          </div>
        </div>
      </div>

      {/* Terminal Status Bar */}
      <div className="trinity-card-base trinity-neutral-theme px-4 py-2 border-t border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="trinity-body-sm text-gray-400">
              Trinity AI v1.0 • Enterprise Edition
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="trinity-status-oracle w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-blue-300">Oracle</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="trinity-status-sentinel w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-green-300">Sentinel</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="trinity-status-sage w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-purple-300">Sage</span>
              </div>
            </div>
          </div>
          
          <div className="trinity-body-sm text-gray-400">
            Last Update: {connectionStatus.lastUpdate?.toLocaleTimeString() || 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrinityTerminal;