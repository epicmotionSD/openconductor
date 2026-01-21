'use client';

import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Eye,
  DollarSign,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Types
interface Deployment {
  id: string;
  templateId: string;
  templateName: string;
  targetKeyword: string;
  targetUrl: string;
  status: 'pending' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back';
  previewUrl?: string;
  liveUrl?: string;
  error?: string;
  createdAt: Date;
  deployedAt?: Date;
  metrics?: DeploymentMetrics;
}

interface DeploymentMetrics {
  pageViews: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  qualityScore: number;
}

interface DeploymentSummary {
  totalDeployments: number;
  liveDeployments: number;
  failedDeployments: number;
  totalPageViews: number;
  totalConversions: number;
  totalRevenue: number;
  avgROAS: number;
}

interface DeploymentTrackerProps {
  deployments?: Deployment[];
  summary?: DeploymentSummary;
  onRollback?: (id: string) => void;
  onRefresh?: () => void;
}

// Status colors and icons
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    icon: <Clock className="w-4 h-4" />
  },
  building: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: <RefreshCw className="w-4 h-4 animate-spin" />
  },
  deploying: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    icon: <Rocket className="w-4 h-4" />
  },
  live: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  failed: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: <XCircle className="w-4 h-4" />
  },
  rolled_back: {
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: <RotateCcw className="w-4 h-4" />
  }
};

// Mock data for development
const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: '1',
    templateId: 'T01',
    templateName: 'The Converter',
    targetKeyword: 'sisterlocks houston',
    targetUrl: '/sisterlocks-houston',
    status: 'live',
    previewUrl: 'https://sisterlocks-houston-preview.vercel.app',
    liveUrl: 'https://sisterlocks-houston.vercel.app',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    deployedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    metrics: {
      pageViews: 1234,
      conversions: 45,
      conversionRate: 3.65,
      revenue: 6750,
      roas: 4.2,
      qualityScore: 9
    }
  },
  {
    id: '2',
    templateId: 'T07',
    templateName: 'The Local Geo-Page',
    targetKeyword: 'microlocs katy tx',
    targetUrl: '/microlocs-katy-tx',
    status: 'live',
    liveUrl: 'https://microlocs-katy.vercel.app',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    deployedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    metrics: {
      pageViews: 456,
      conversions: 12,
      conversionRate: 2.63,
      revenue: 1800,
      roas: 3.1,
      qualityScore: 8
    }
  },
  {
    id: '3',
    templateId: 'T02',
    templateName: 'The Booking Portal',
    targetKeyword: 'book sisterlocks appointment houston',
    targetUrl: '/book-sisterlocks-houston',
    status: 'building',
    createdAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    id: '4',
    templateId: 'T05',
    templateName: 'The Comparison Guide',
    targetKeyword: 'sisterlocks vs microlocs',
    targetUrl: '/sisterlocks-vs-microlocs',
    status: 'failed',
    error: 'Build failed: Missing required image assets',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

const MOCK_SUMMARY: DeploymentSummary = {
  totalDeployments: 12,
  liveDeployments: 8,
  failedDeployments: 2,
  totalPageViews: 8543,
  totalConversions: 187,
  totalRevenue: 28050,
  avgROAS: 3.8
};

export function DeploymentTracker({
  deployments = MOCK_DEPLOYMENTS,
  summary = MOCK_SUMMARY,
  onRollback,
  onRefresh
}: DeploymentTrackerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'live' | 'failed' | 'in_progress'>('all');

  const filteredDeployments = deployments.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'live') return d.status === 'live';
    if (filter === 'failed') return d.status === 'failed' || d.status === 'rolled_back';
    if (filter === 'in_progress') return ['pending', 'building', 'deploying'].includes(d.status);
    return true;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Deployment Tracker</h3>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{summary.liveDeployments}</div>
            <div className="text-xs text-gray-400">Live Pages</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white">{formatNumber(summary.totalPageViews)}</div>
            <div className="text-xs text-gray-400">Page Views</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.totalRevenue)}</div>
            <div className="text-xs text-gray-400">Revenue</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{summary.avgROAS.toFixed(1)}x</div>
            <div className="text-xs text-gray-400">Avg ROAS</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-800 bg-gray-800/30">
        {(['all', 'live', 'in_progress', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Deployments List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredDeployments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No deployments match the current filter
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredDeployments.map(deployment => {
              const statusConfig = STATUS_CONFIG[deployment.status];
              const isExpanded = expandedId === deployment.id;

              return (
                <div key={deployment.id} className="hover:bg-gray-800/30 transition-colors">
                  {/* Main Row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : deployment.id)}
                  >
                    {/* Expand Toggle */}
                    <div className="text-gray-500">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>

                    {/* Status */}
                    <div className={`p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">
                          {deployment.targetKeyword}
                        </span>
                        <span className="text-xs text-gray-500">{deployment.templateId}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {deployment.templateName} • {getTimeAgo(deployment.createdAt)}
                      </div>
                    </div>

                    {/* Metrics (if live) */}
                    {deployment.status === 'live' && deployment.metrics && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>{formatNumber(deployment.metrics.pageViews)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-400">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatCurrency(deployment.metrics.revenue)}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          deployment.metrics.roas >= 3 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {deployment.metrics.roas >= 3 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{deployment.metrics.roas.toFixed(1)}x</span>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {deployment.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 ml-14 space-y-4">
                      {/* Error Message */}
                      {deployment.error && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-red-300">{deployment.error}</span>
                        </div>
                      )}

                      {/* URLs */}
                      <div className="space-y-2">
                        {deployment.previewUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20">Preview:</span>
                            <a
                              href={deployment.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              {deployment.previewUrl}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {deployment.liveUrl && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20">Live URL:</span>
                            <a
                              href={deployment.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-400 hover:underline flex items-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              {deployment.liveUrl}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Metrics Details */}
                      {deployment.metrics && (
                        <div className="grid grid-cols-6 gap-3">
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className="text-lg font-semibold text-white">
                              {formatNumber(deployment.metrics.pageViews)}
                            </div>
                            <div className="text-xs text-gray-500">Views</div>
                          </div>
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className="text-lg font-semibold text-white">
                              {deployment.metrics.conversions}
                            </div>
                            <div className="text-xs text-gray-500">Conversions</div>
                          </div>
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className="text-lg font-semibold text-white">
                              {deployment.metrics.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">CVR</div>
                          </div>
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className="text-lg font-semibold text-green-400">
                              {formatCurrency(deployment.metrics.revenue)}
                            </div>
                            <div className="text-xs text-gray-500">Revenue</div>
                          </div>
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className={`text-lg font-semibold ${
                              deployment.metrics.roas >= 3 ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {deployment.metrics.roas.toFixed(1)}x
                            </div>
                            <div className="text-xs text-gray-500">ROAS</div>
                          </div>
                          <div className="bg-gray-800/50 rounded p-2 text-center">
                            <div className="text-lg font-semibold text-purple-400">
                              {deployment.metrics.qualityScore}/10
                            </div>
                            <div className="text-xs text-gray-500">Quality</div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {deployment.status === 'live' && (
                          <>
                            <button className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              View Analytics
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRollback?.(deployment.id);
                              }}
                              className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Rollback
                            </button>
                          </>
                        )}
                        {deployment.status === 'failed' && (
                          <button className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            Retry Deployment
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-800/30 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Showing {filteredDeployments.length} of {summary.totalDeployments} deployments
        </span>
        <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
          View All Deployments →
        </button>
      </div>
    </div>
  );
}

export default DeploymentTracker;
