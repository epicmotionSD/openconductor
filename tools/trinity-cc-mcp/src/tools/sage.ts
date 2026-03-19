/**
 * Sage tools — Write operations & synthesis
 *
 * sage_add_content      — Add a new intel item
 * sage_update_content   — Update an existing item
 * sage_log_metric       — Quick-add a metric-snapshot
 * sage_summarize_thread — Summarize a chain of related items
 * sage_synthesize_feed  — Generate a briefing from recent intel
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  addItem,
  getItem,
  updateItem,
  getAllItems,
  queryContent,
} from '../lib/store.js';
import { VALID_TYPES, VALID_STATUSES, VALID_SENTIMENTS, type ContentItem } from '../types.js';

export function registerSageTools(server: McpServer): void {
  // --- sage_add_content ---
  server.tool(
    'sage_add_content',
    'Add a new intel item to the Command Center store.',
    {
      type: z.enum(VALID_TYPES as unknown as [string, ...string[]]).describe('Content type'),
      body: z.string().describe('Main content body'),
      source: z.string().optional().describe('Source identifier (e.g. @user, channel)'),
      sourceUrl: z.string().optional().describe('URL to original content'),
      author: z.string().optional(),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
      sentiment: z.enum(VALID_SENTIMENTS as unknown as [string, ...string[]]).optional(),
      priority: z.number().min(1).max(3).optional().describe('1=urgent, 2=normal, 3=low'),
      notes: z.string().optional(),
      parentId: z.string().optional().describe('ID of parent item for threading'),
    },
    async (params) => {
      const item = addItem({
        type: params.type as ContentItem['type'],
        body: params.body,
        source: params.source ?? '',
        sourceUrl: params.sourceUrl ?? '',
        author: params.author ?? '',
        tags: params.tags ?? [],
        sentiment: (params.sentiment ?? null) as ContentItem['sentiment'],
        priority: (params.priority ?? 2) as ContentItem['priority'],
        notes: params.notes ?? '',
        parentId: params.parentId ?? '',
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({ ok: true, item }, null, 2),
        }],
      };
    },
  );

  // --- sage_update_content ---
  server.tool(
    'sage_update_content',
    'Update fields on an existing intel item.',
    {
      id: z.string().describe('Item ID'),
      status: z.enum(VALID_STATUSES as unknown as [string, ...string[]]).optional(),
      sentiment: z.enum(VALID_SENTIMENTS as unknown as [string, ...string[]]).optional(),
      priority: z.number().min(1).max(3).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
      body: z.string().optional(),
    },
    async (params) => {
      const { id, ...updates } = params;
      const item = updateItem(id, updates as Partial<ContentItem>);
      if (!item) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ ok: false, error: `Item ${id} not found` }) }],
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ok: true, item }, null, 2) }],
      };
    },
  );

  // --- sage_log_metric ---
  server.tool(
    'sage_log_metric',
    'Quick-add a metric-snapshot item. Body should contain the metric value/description.',
    {
      body: z.string().describe('Metric value or description'),
      tags: z.array(z.string()).describe('Tags identifying the metric (e.g. ["npm-downloads", "weekly"])'),
      source: z.string().optional().describe('Metric source'),
    },
    async (params) => {
      const item = addItem({
        type: 'metric-snapshot',
        body: params.body,
        source: params.source ?? '',
        sourceUrl: '',
        author: '',
        tags: params.tags,
        sentiment: null,
        priority: 3,
        notes: '',
        parentId: '',
      });

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ ok: true, item }, null, 2) }],
      };
    },
  );

  // --- sage_summarize_thread ---
  server.tool(
    'sage_summarize_thread',
    'Retrieve a thread of related items by parentId or shared tag. Returns items in chronological order for summarization.',
    {
      parentId: z.string().optional().describe('Parent item ID to look up replies'),
      tag: z.string().optional().describe('Tag to group items by'),
      limit: z.number().optional().describe('Max items to return (default 20)'),
    },
    async (params) => {
      if (!params.parentId && !params.tag) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ ok: false, error: 'Provide parentId or tag' }) }],
        };
      }

      const limit = params.limit ?? 20;
      let items = getAllItems().filter(i => i.status !== 'archived');

      if (params.parentId) {
        const parent = getItem(params.parentId);
        items = items.filter(i => i.id === params.parentId || i.parentId === params.parentId);
        if (parent && !items.find(i => i.id === parent.id)) {
          items.unshift(parent);
        }
      } else if (params.tag) {
        items = items.filter(i => i.tags.includes(params.tag!));
      }

      items.sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());
      items = items.slice(0, limit);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            threadSize: items.length,
            items,
          }, null, 2),
        }],
      };
    },
  );

  // --- sage_synthesize_feed ---
  server.tool(
    'sage_synthesize_feed',
    'Generate a structured briefing from recent intel. Returns categorized content ready for synthesis.',
    {
      hoursBack: z.number().optional().describe('Look-back window (default 24)'),
      types: z.array(z.string()).optional().describe('Filter to these content types'),
      includeArchived: z.boolean().optional().describe('Include archived items (default false)'),
    },
    async (params) => {
      const hoursBack = params.hoursBack ?? 24;
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

      const filters: Record<string, string> = { since };
      if (params.types?.length) {
        filters.type = params.types.join(',');
      }

      const items = queryContent(
        getAllItems(),
        { ...filters, includeArchived: params.includeArchived ? 'true' : undefined } as Record<string, string | undefined>,
      );

      // Build briefing structure
      const byType: Record<string, number> = {};
      const bySentiment: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
      const urgent: unknown[] = [];

      for (const item of items) {
        byType[item.type] = (byType[item.type] || 0) + 1;
        if (item.sentiment && bySentiment[item.sentiment] !== undefined) {
          bySentiment[item.sentiment]++;
        }
        if (item.priority === 1) urgent.push(item);
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            hoursBack,
            totalItems: items.length,
            byType,
            bySentiment,
            urgentCount: urgent.length,
            urgent: urgent.slice(0, 10),
            items: items.slice(0, 50),
          }, null, 2),
        }],
      };
    },
  );
}
