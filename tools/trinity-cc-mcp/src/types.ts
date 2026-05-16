/**
 * Trinity CC MCP — Shared types
 * Mirrors the item shape from tools/command-center/lib/store.js
 */

export const VALID_TYPES = [
  'x-reply', 'x-mention', 'x-dm',
  'hn-comment', 'reddit-comment', 'discord-message',
  'linkedin-comment', 'github-comment', 'blog-comment',
  'metric-snapshot', 'note', 'link',
] as const;

export type ContentType = (typeof VALID_TYPES)[number];

export const VALID_STATUSES = ['unread', 'read', 'actioned', 'archived'] as const;
export type ContentStatus = (typeof VALID_STATUSES)[number];

export const VALID_SENTIMENTS = ['positive', 'neutral', 'negative', null] as const;
export type ContentSentiment = 'positive' | 'neutral' | 'negative' | null;

export type Priority = 1 | 2 | 3;

export interface ContentItem {
  id: string;
  type: ContentType;
  source: string;
  sourceUrl: string;
  parentId: string | null;
  author: string;
  body: string;
  tags: string[];
  sentiment: ContentSentiment;
  priority: Priority;
  status: ContentStatus;
  notes: string;
  createdAt: string;
  capturedAt: string;
}

export interface ContentStats {
  total: number;
  unread: number;
  read: number;
  actioned: number;
  archived: number;
  byType: Record<string, number>;
}
