/**
 * Sentinel tools — Monitoring & anomaly detection
 *
 * sentinel_scan_anomalies  — Detect spikes, sentiment shifts, missing metrics
 * sentinel_unread_urgent   — List unread P1 items requiring immediate action
 * sentinel_metric_trend    — Trend analysis on metric-snapshot items
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllItems } from '../lib/store.js';

export function registerSentinelTools(server: McpServer): void {
  // --- sentinel_scan_anomalies ---
  server.tool(
    'sentinel_scan_anomalies',
    'Scan intel for anomalies: negative-sentiment spikes, P1 clusters, stale unread items, and metric gaps.',
    {
      hoursBack: z.number().optional().describe('Look-back window in hours (default 24)'),
    },
    async (params) => {
      const hoursBack = params.hoursBack ?? 24;
      const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
      const all = getAllItems().filter(i => i.status !== 'archived');
      const recent = all.filter(i => new Date(i.capturedAt) >= cutoff);

      const anomalies: { kind: string; severity: string; detail: string; items?: unknown[] }[] = [];

      // Negative spike: >30% of recent items are negative
      const negRecent = recent.filter(i => i.sentiment === 'negative');
      if (recent.length >= 3 && negRecent.length / recent.length > 0.3) {
        anomalies.push({
          kind: 'negative_spike',
          severity: 'high',
          detail: `${negRecent.length}/${recent.length} recent items are negative (${Math.round(negRecent.length / recent.length * 100)}%)`,
          items: negRecent.slice(0, 5),
        });
      }

      // P1 cluster: 3+ P1 items in window
      const p1Recent = recent.filter(i => i.priority === 1);
      if (p1Recent.length >= 3) {
        anomalies.push({
          kind: 'p1_cluster',
          severity: 'high',
          detail: `${p1Recent.length} P1 items in the last ${hoursBack}h`,
          items: p1Recent.slice(0, 5),
        });
      }

      // Stale unread: unread items older than 48h
      const staleThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const stale = all.filter(i => i.status === 'unread' && new Date(i.capturedAt) < staleThreshold);
      if (stale.length > 0) {
        anomalies.push({
          kind: 'stale_unread',
          severity: 'medium',
          detail: `${stale.length} unread items older than 48h`,
          items: stale.slice(0, 5),
        });
      }

      // Metric gap: no metric-snapshot items in window
      const metrics = recent.filter(i => i.type === 'metric-snapshot');
      if (metrics.length === 0 && all.some(i => i.type === 'metric-snapshot')) {
        anomalies.push({
          kind: 'metric_gap',
          severity: 'medium',
          detail: `No metric snapshots in the last ${hoursBack}h`,
        });
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            scanned: all.length,
            recentCount: recent.length,
            hoursBack,
            anomalyCount: anomalies.length,
            anomalies,
          }, null, 2),
        }],
      };
    },
  );

  // --- sentinel_unread_urgent ---
  server.tool(
    'sentinel_unread_urgent',
    'List all unread items with P1 or P2 priority that need immediate attention.',
    {
      maxPriority: z.number().optional().describe('Max priority level to include (default 2, meaning P1 + P2)'),
    },
    async (params) => {
      const maxP = params.maxPriority ?? 2;
      const items = getAllItems()
        .filter(i => i.status === 'unread' && i.priority <= maxP);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total: items.length,
            items: items.slice(0, 50),
          }, null, 2),
        }],
      };
    },
  );

  // --- sentinel_metric_trend ---
  server.tool(
    'sentinel_metric_trend',
    'Analyze trends in metric-snapshot items. Groups by tag and shows chronological values.',
    {
      tag: z.string().optional().describe('Filter metrics by tag'),
      days: z.number().optional().describe('Look-back in days (default 7)'),
    },
    async (params) => {
      const days = params.days ?? 7;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      let metrics = getAllItems()
        .filter(i => i.type === 'metric-snapshot' && i.status !== 'archived')
        .filter(i => new Date(i.capturedAt) >= cutoff);

      if (params.tag) {
        metrics = metrics.filter(i => i.tags.includes(params.tag!));
      }

      // Group by first tag
      const groups: Record<string, { date: string; body: string }[]> = {};
      for (const m of metrics) {
        const key = m.tags[0] || 'untagged';
        if (!groups[key]) groups[key] = [];
        groups[key].push({ date: m.capturedAt, body: m.body });
      }

      // Sort each group chronologically
      for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            days,
            metricCount: metrics.length,
            groups,
          }, null, 2),
        }],
      };
    },
  );
}
