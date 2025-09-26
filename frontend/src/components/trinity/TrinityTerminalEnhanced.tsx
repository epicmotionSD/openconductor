/**
 * Trinity AI Terminal Enhanced - Complete Integration
 * 
 * Professional Bloomberg Terminal-style Trinity AI orchestration interface.
 * Integrates with OpenConductor's existing WebSocket infrastructure while
 * providing enhanced glassmorphism UI and specialized agent panels.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrinityCard, TrinityAgentCard } from '../ui/trinity-card';
import TrinityOraclePanel from './panels/TrinityOraclePanel';
import TrinitySentinelPanel from './panels/TrinitySentinelPanel';
import TrinitySagePanel from './panels/TrinitySagePanel';
import { cn } from '../../utils/cn';

interface TrinityTerminalProps {
  webSocketUrl?: string;
  autoConnect?: boolean;
  theme?: 'dark' | 'bloomberg';
  onAgentInteraction?: (agent: string, action: string, data?: any) => void;
}

interface WebSocketMessage {
  type: string;
  agent?: 'oracle' | 'sentinel' | 'sage';
  data: any;
  timestamp: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ConnectionStatus {
  connected: boolean;
  latency: number;
  messagesReceived: number;
  lastUpdate: Date | null;
  activeAgents: string[];
  reconnectAttempts: number;
}

const TrinityTerminalEnhanced: React.FC<TrinityTerminalProps> = ({
  webSocketUrl = 'ws://localhost:8080',
  autoConnect = true,
  theme = 'bloomberg',
  onAgentInteraction
}) => {
  // Terminal state
  const [activeAgent, setActiveAgent] = useState<string>('sentinel');
  const [coordinationMode, setCoordinationMode] = useState<boolean>(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    latency: 0,
    messagesReceived: 0,
    lastUpdate: null,
    activeAgents: [],
    reconnectAttempts: 0
  });

  // WebSocket and message state
  const [webSocketData, setWebSocketData] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const latencyTestRef = useRef<{ start: number; id: string } | null>(null);

  // Agent interaction handlers
  const handleOracleInteraction = useCallback((action: string, data?: any) => {
    console.log('[Trinity Terminal] Oracle interaction:', action, data);
    if (onAgentInteraction) {
      onAgentInteraction('oracle', action, data);
    }
  }, [onAgentInteraction]);

  const handleSentinelInteraction = useCallback((action: string, data?: any) => {
    console.log('[Trinity Terminal] Sentinel interaction:', action, data);
    if (onAgentInteraction) {
      onAgentInteraction('sentinel', action, data);
    }
  }, [onAgentInteraction]);

  const handleSageInteraction = useCallback((action: string, data?: any) => {
    console.log('[Trinity Terminal] Sage interaction:', action, data);
    if (onAgentInteraction) {
      onAgentInteraction('sage', action, data);
    }
  }, [onAgentInteraction]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(webSocketUrl);
      
      wsRef.current.onopen = () => {
        console.log('[Trinity Terminal] WebSocket connected');
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          reconnectAttempts: 0,
          activeAgents: ['oracle', 'sentinel', 'sage']
        }));

        // Send latency test
        const latencyTest = {
          type: 'latency_test',
          id: `latency-${Date.now()}`,
          timestamp: Date.now()
        };
        
        latencyTestRef.current = { start: Date.now(), id: latencyTest.id };
        wsRef.current?.send(JSON.stringify(latencyTest));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle latency test response
          if (message.type === 'latency_response' && latencyTestRef.current) {
            const latency = Date.now() - latencyTestRef.current.start;
            setConnectionStatus(prev => ({
              ...prev,
              latency,
              lastUpdate: new Date(),
              messagesReceived: prev.messagesReceived + 1
            }));
            latencyTestRef.current = null;
            return;
          }

          // Process agent messages
          setWebSocketData(message);
          setMessageHistory(prev => [message, ...prev.slice(0, 99)]);
          
          setConnectionStatus(prev => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
            lastUpdate: new Date()
          }));

          // Play notification sound for high-priority messages
          if (message.priority === 'critical' || message.priority === 'high') {
            playNotificationSound(message.priority);
          }

        } catch (error) {
          console.error('[Trinity Terminal] Error parsing message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('[Trinity Terminal] WebSocket closed:', event.code, event.reason);
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          activeAgents: []
        }));

        // Auto-reconnect unless explicitly closed
        if (event.code !== 1000 && autoConnect) {
          setConnectionStatus(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
          
          const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[Trinity Terminal] WebSocket error:', error);
      };

    } catch (error) {
      console.error('[Trinity Terminal] Failed to connect:', error);
    }
  }, [webSocketUrl, autoConnect, connectionStatus.reconnectAttempts]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (autoConnect) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connectWebSocket, autoConnect]);

  // Notification sound system
  const playNotificationSound = useCallback((priority: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(
        priority === 'critical' ? 800 : priority === 'high' ? 600 : 400, 
        audioContext.currentTime
      );
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('[Trinity Terminal] Could not play notification sound:', error);
    }
  }, []);

  // Bloomberg Terminal keyboard shortcuts
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
          setCoordinationMode(!coordinationMode);
          console.log('[Trinity Terminal] Toggled coordination mode (Ctrl+C)');
          break;
          
        case 'p':
          event.preventDefault();
          setCommandPaletteOpen(true);
          console.log('[Trinity Terminal] Command palette opened (Ctrl+P)');
          break;
          
        case 'r':
          event.preventDefault();
          if (wsRef.current) {
            wsRef.current.close();
            setTimeout(connectWebSocket, 1000);
          }
          console.log('[Trinity Terminal] Connection refresh triggered (Ctrl+R)');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [coordinationMode, connectWebSocket]);

  const getConnectionStatusColor = () => {
    if (!connectionStatus.connected) return 'text-red-400';
    if (connectionStatus.latency > 200) return 'text-yellow-400';
    return 'text-green-400';
  };

  const sendMessage = (type: string, agent?: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        agent,
        data,
        timestamp: Date.now(),
        priority: 'medium' as const
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <div className={cn("trinity-terminal-layout", `theme-${theme}`)}>
      {/* Terminal Header Bar */}
      <div className="trinity-card-base trinity-neutral-theme p-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🔗</div>
              <div>
                <div className="trinity-display-sm text-white">OpenConductor AI Terminal</div>
                <div className="trinity-body-sm text-gray-400">
                  Orchestrating the Future of Enterprise AI
                </div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", 
                connectionStatus.connected 
                  ? "bg-green-400 trinity-animate-pulse-sentinel" 
                  : "bg-red-400"
              )} />
              <span className={cn("trinity-body-sm font-medium", getConnectionStatusColor())}>
                {connectionStatus.connected ? 'COORDINATED' : 'DISCONNECTED'}
              </span>
              <span className="trinity-body-sm text-gray-400">
                {connectionStatus.latency}ms
              </span>
              {connectionStatus.reconnectAttempts > 0 && (
                <span className="trinity-body-sm text-yellow-400">
                  (Retry #{connectionStatus.reconnectAttempts})
                </span>
              )}
            </div>
          </div>
          
          {/* Control Panel */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveAgent('oracle')}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-all",
                  activeAgent === 'oracle'
                    ? "trinity-gradient-oracle text-white shadow-glow"
                    : "text-blue-300 hover:text-white"
                )}
              >
                🔮 Oracle
              </button>
              <button
                onClick={() => setActiveAgent('sentinel')}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-all",
                  activeAgent === 'sentinel'
                    ? "trinity-gradient-sentinel text-white shadow-glow"
                    : "text-green-300 hover:text-white"
                )}
              >
                🛡️ Sentinel
              </button>
              <button
                onClick={() => setActiveAgent('sage')}
                className={cn(
                  "px-3 py-1 rounded text-sm transition-all",
                  activeAgent === 'sage'
                    ? "trinity-gradient-sage text-white shadow-glow"
                    : "text-purple-300 hover:text-white"
                )}
              >
                🧠 Sage
              </button>
            </div>
            
            <button
              onClick={() => setCoordinationMode(!coordinationMode)}
              className={cn(
                "px-3 py-1 rounded text-sm transition-all",
                coordinationMode 
                  ? "trinity-gradient-oracle text-white shadow-glow" 
                  : "trinity-glass-oracle text-gray-300 hover:text-white"
              )}
            >
              {coordinationMode ? 'Coordinated' : 'Independent'}
            </button>
            
            <div className="trinity-body-sm text-gray-400">
              Messages: {connectionStatus.messagesReceived}
            </div>
          </div>
        </div>
      </div>

      {/* Main Agent Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeAgent === 'oracle' && (
          <TrinityOraclePanel
            webSocketData={webSocketData?.agent === 'oracle' ? webSocketData : null}
            onPredictionSelect={(prediction) => {
              handleOracleInteraction('prediction_selected', prediction);
            }}
          />
        )}
        
        {activeAgent === 'sentinel' && (
          <TrinitySentinelPanel
            webSocketData={webSocketData?.agent === 'sentinel' ? webSocketData : null}
            onAlertSelect={(alert) => {
              handleSentinelInteraction('alert_selected', alert);
            }}
          />
        )}
        
        {activeAgent === 'sage' && (
          <TrinitySagePanel
            webSocketData={webSocketData?.agent === 'sage' ? webSocketData : null}
            onRecommendationSelect={(recommendation) => {
              handleSageInteraction('recommendation_selected', recommendation);
            }}
          />
        )}
      </div>

      {/* Terminal Status Bar */}
      <div className="trinity-card-base trinity-neutral-theme px-4 py-2 border-t border-gray-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="trinity-body-sm text-gray-400">
              OpenConductor v1.0 • Community Edition • {theme.toUpperCase()} Theme
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="trinity-status-oracle w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-blue-300">Oracle Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="trinity-status-sentinel w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-green-300">Sentinel Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="trinity-status-sage w-2 h-2 rounded-full"></div>
                <span className="trinity-body-sm text-purple-300">Sage Active</span>
              </div>
            </div>
            
            <div className="trinity-body-sm text-gray-400">
              Shortcuts: Ctrl+1,2,3 (Agents) • Ctrl+C (Coordination) • Ctrl+R (Refresh)
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

export default TrinityTerminalEnhanced;