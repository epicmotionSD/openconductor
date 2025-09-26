/**
 * Trinity Sentinel Panel - Monitoring Intelligence
 *
 * Professional monitoring intelligence panel for Trinity AI Sentinel agent.
 * Features Bloomberg Terminal-style glassmorphism with Sentinel-specific theming.
 */

import React, { useState, useEffect } from 'react';
import { TrinityCard, TrinityAgentCard } from '../../ui/trinity-card';
import { cn } from '../../../utils/cn';

interface AlertData {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  severity: 'high' | 'medium' | 'low';
  message: string;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
  metadata: Record<string, any>;
}

interface MetricData {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface SentinelPanelProps {
  className?: string;
  onAlertSelect?: (alert: AlertData) => void;
  webSocketData?: any;
}

const TrinitySentinelPanel: React.FC<SentinelPanelProps> = ({
  className,
  onAlertSelect,
  webSocketData
}) => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [monitoringTargets, setMonitoringTargets] = useState<string[]>([
    'system_performance',
    'api_endpoints',
    'database_health',
    'network_latency',
    'error_rates'
  ]);
  const [selectedTarget, setSelectedTarget] = useState<string>('system_performance');

  // Initialize metrics
  useEffect(() => {
    const initialMetrics: MetricData[] = [
      {
        name: 'CPU Usage',
        value: 67.8,
        unit: '%',
        threshold: 80,
        status: 'normal',
        trend: 'stable',
        history: [65.2, 66.1, 67.8, 68.3, 67.8]
      },
      {
        name: 'Memory Usage',
        value: 74.3,
        unit: '%',
        threshold: 85,
        status: 'normal',
        trend: 'up',
        history: [70.1, 71.8, 73.2, 74.1, 74.3]
      },
      {
        name: 'Response Time',
        value: 145,
        unit: 'ms',
        threshold: 200,
        status: 'normal',
        trend: 'down',
        history: [158, 152, 148, 146, 145]
      },
      {
        name: 'Error Rate',
        value: 0.12,
        unit: '%',
        threshold: 1.0,
        status: 'normal',
        trend: 'stable',
        history: [0.15, 0.13, 0.12, 0.11, 0.12]
      },
      {
        name: 'Throughput',
        value: 1247,
        unit: 'req/s',
        threshold: 1000,
        status: 'normal',
        trend: 'up',
        history: [1180, 1205, 1223, 1235, 1247]
      }
    ];
    
    setMetrics(initialMetrics);
  }, []);

  // Simulate monitoring alerts
  useEffect(() => {
    const generateAlert = () => {
      const alertTypes = ['info', 'warning', 'critical'] as const;
      const sources = ['SystemMonitor', 'DatabaseWatcher', 'APIGateway', 'NetworkMonitor'];
      const messages = [
        'System performance within normal parameters',
        'Database connection pool reaching capacity',
        'API endpoint response time exceeding threshold',
        'Network latency spike detected',
        'Error rate increase detected in payment service'
      ];

      const newAlert: AlertData = {
        id: `alert-${Date.now()}`,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
        message: messages[Math.floor(Math.random() * messages.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: new Date(),
        acknowledged: false,
        metadata: {
          target: selectedTarget,
          value: Math.random() * 100,
          threshold: Math.random() * 50 + 50
        }
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 19)]);
    };

    const interval = setInterval(generateAlert, 8000);
    return () => clearInterval(interval);
  }, [selectedTarget]);

  // Update metrics simulation
  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(prev => prev.map(metric => {
        const variation = (Math.random() - 0.5) * 10;
        const newValue = Math.max(0, metric.value + variation);
        const newHistory = [...metric.history.slice(1), newValue];
        
        return {
          ...metric,
          value: Number(newValue.toFixed(metric.name === 'Error Rate' ? 2 : 1)),
          history: newHistory,
          status: newValue > metric.threshold ? 'warning' : 
                 newValue > metric.threshold * 0.9 ? 'warning' : 'normal',
          trend: newValue > metric.value ? 'up' : 
                newValue < metric.value ? 'down' : 'stable'
        };
      }));
    };

    const interval = setInterval(updateMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getAlertColor = (type: string, severity: string) => {
    if (type === 'critical') return 'text-red-300 bg-red-500/20 border-red-400/30';
    if (type === 'warning') return 'text-yellow-300 bg-yellow-500/20 border-yellow-400/30';
    if (type === 'info') return 'text-blue-300 bg-blue-500/20 border-blue-400/30';
    return 'text-green-300 bg-green-500/20 border-green-400/30';
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <div className={cn("h-full space-y-6", className)}>
      {/* Sentinel Agent Status */}
      <TrinityAgentCard
        agent="sentinel"
        title="Monitoring Intelligence System"
        confidence={98.7}
        status="active"
        data={{
          activeTargets: monitoringTargets.length,
          alertsActive: alerts.filter(a => !a.acknowledged).length,
          systemHealth: '98.7%'
        }}
        onInteraction={() => console.log('Sentinel interaction')}
      />

      {/* Real-time Metrics */}
      <TrinityCard variant="glass" agent="sentinel" className="p-4">
        <div className="trinity-body-md text-green-100 mb-4">System Metrics</div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.name} className="trinity-glass-sentinel rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="trinity-body-sm text-green-200">{metric.name}</span>
                <span className="text-lg">{getTrendIcon(metric.trend)}</span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className={cn("trinity-body-lg font-bold", getMetricStatusColor(metric.status))}>
                  {metric.value}{metric.unit}
                </span>
                <span className="trinity-body-sm text-green-400">
                  /{metric.threshold}{metric.unit}
                </span>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    metric.status === 'critical' ? "bg-red-400" :
                    metric.status === 'warning' ? "bg-yellow-400" : "bg-green-400"
                  )}
                  style={{ width: `${Math.min(100, (metric.value / metric.threshold) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </TrinityCard>

      {/* Monitoring Targets */}
      <TrinityCard variant="glass" agent="sentinel" className="p-4">
        <div className="trinity-body-md text-green-100 mb-4">Monitoring Targets</div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {monitoringTargets.map((target) => (
            <button
              key={target}
              onClick={() => setSelectedTarget(target)}
              className={cn(
                "px-3 py-2 rounded-md text-sm transition-all",
                target === selectedTarget
                  ? "trinity-gradient-sentinel text-white shadow-glow"
                  : "trinity-glass-sentinel text-green-300 hover:text-white"
              )}
            >
              {target.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="trinity-glass-sentinel rounded-lg p-3">
          <div className="trinity-body-sm text-green-100 mb-2">
            Active Target: <span className="font-medium">{selectedTarget}</span>
          </div>
          <div className="trinity-body-sm text-green-300">
            Status: Monitoring active • {Math.floor(Math.random() * 1000)} checks/min
          </div>
        </div>
      </TrinityCard>

      {/* Active Alerts */}
      <TrinityCard variant="glass" agent="sentinel" className="p-4">
        <div className="trinity-body-md text-green-100 mb-4 flex items-center justify-between">
          <span>System Alerts</span>
          <span className="trinity-body-sm text-green-300">
            {alerts.filter(a => !a.acknowledged).length} active
          </span>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {alerts.slice(0, 8).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "trinity-glass-sentinel rounded-lg p-3 transition-all",
                alert.acknowledged ? "opacity-50" : "hover:bg-green-950/30"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "px-2 py-1 rounded text-xs font-medium border",
                  getAlertColor(alert.type, alert.severity)
                )}>
                  {alert.type.toUpperCase()}
                </div>
                <div className="trinity-body-sm text-green-400">
                  {alert.source}
                </div>
              </div>
              
              <div className="trinity-body-sm text-green-200 mb-2">
                {alert.message}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="trinity-body-sm text-green-400 text-xs">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="trinity-body-sm text-green-300 hover:text-white transition-colors text-xs px-2 py-1 rounded border border-green-500/30 hover:bg-green-500/20"
                  >
                    ACK
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {alerts.length === 0 && (
            <div className="text-center py-8">
              <div className="trinity-body-md text-green-300 mb-2">No alerts</div>
              <div className="trinity-body-sm text-green-400">
                System monitoring is active and healthy
              </div>
            </div>
          )}
        </div>
      </TrinityCard>
    </div>
  );
};

export default TrinitySentinelPanel;