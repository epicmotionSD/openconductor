/**
 * Oracle tools — Read-only intelligence queries
 *
 * oracle_query_intel    — Search & filter the content store
 * oracle_get_launch_status — Aggregate stats + unread count + top priorities
 * oracle_analyze_sentiment — Sentiment breakdown across items
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllItems, getStats, queryContent } from '../lib/store.js';

export function registerOracleTools(server: McpServer): void {
  // --- oracle_query_intel ---
  server.tool(
    'oracle_query_intel',
    'Search and filter Command Center intel. Returns matching items with keyword search and structured filters.',
    {
      q: z.string().optional().describe('Keyword search across body, author, tags, notes'),
      type: z.string().optional().describe('Filter by type (comma-separated): x-reply, hn-comment, note, etc.'),
      status: z.string().optional().describe('Filter by status (comma-separated): unread, read, actioned, archived'),
      sentiment: z.string().optional().describe('Filter by sentiment: positive, neutral, negative'),
      tag: z.string().optional().describe('Filter by tag (comma-separated)'),
      priority: z.string().optional().describe('Filter by priority: 1, 2, or 3'),
      source: z.string().optional().describe('Filter by source (comma-separated)'),
      since: z.string().optional().describe('ISO date — items captured on or after'),
      until: z.string().optional().describe('ISO date — items captured on or before'),
      limit: z.number().optional().describe('Max items to return (default 50)'),
    },
    async (params) => {
      const items = getAllItems();
      const filtered = queryContent(items, params as Record<string, string | undefined>);
      const limit = params.limit ?? 50;
      const sliced = filtered.slice(0, limit);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ total: filtered.length, returned: sliced.length, items: sliced }, null, 2),
        }],
      };
    },
  );

  // --- oracle_get_launch_status ---
  server.tool(
    'oracle_get_launch_status',
    'Get a launch-status snapshot: overall stats, unread count, top-priority items, and recent captures.',
    {},
    async () => {
      const stats = getStats();
      const items = getAllItems().filter(i => i.status !== 'archived');
      const urgent = items.filter(i => i.priority === 1).slice(0, 10);
      const recent = items.slice(0, 10);
      const unread = items.filter(i => i.status === 'unread');

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            stats,
            urgentCount: urgent.length,
            urgent,
            unreadCount: unread.length,
            recentCount: recent.length,
            recent,
          }, null, 2),
        }],
      };
    },
  );

  // --- oracle_analyze_sentiment ---
  server.tool(
    'oracle_analyze_sentiment',
    'Analyze sentiment distribution across intel items. Optionally filter by type or time range.',
    {
      type: z.string().optional().describe('Filter by content type'),
      since: z.string().optional().describe('ISO date — items on or after'),
      until: z.string().optional().describe('ISO date — items on or before'),
    },
    async (params) => {
      let items = getAllItems().filter(i => i.status !== 'archived');
      if (params.type) items = items.filter(i => i.type === params.type);
      if (params.since) {
        const d = new Date(params.since);
        if (!isNaN(d.getTime())) items = items.filter(i => new Date(i.capturedAt) >= d);
      }
      if (params.until) {
        const d = new Date(params.until);
        if (!isNaN(d.getTime())) items = items.filter(i => new Date(i.capturedAt) <= d);
      }

      const breakdown = { positive: 0, neutral: 0, negative: 0, unset: 0 };
      for (const item of items) {
        if (item.sentiment === 'positive') breakdown.positive++;
        else if (item.sentiment === 'neutral') breakdown.neutral++;
        else if (item.sentiment === 'negative') breakdown.negative++;
        else breakdown.unset++;
      }
      const total = items.length;
      const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total,
            breakdown,
            percentages: {
              positive: pct(breakdown.positive),
              neutral: pct(breakdown.neutral),
              negative: pct(breakdown.negative),
              unset: pct(breakdown.unset),
            },
            negativeItems: items.filter(i => i.sentiment === 'negative').slice(0, 5),
          }, null, 2),
        }],
      };
    },
  );
}
