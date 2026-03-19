/**
 * Trinity CC MCP — Atomic JSON store
 * Reads/writes the same content.json used by Command Center.
 * DATA_DIR is resolved from TRINITY_DATA_DIR env or defaults to
 * ../../command-center/data relative to this package root.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { ContentItem, ContentStats, ContentType, ContentStatus, ContentSentiment, Priority } from '../types.js';
import { VALID_TYPES, VALID_STATUSES } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.TRINITY_DATA_DIR
  ? path.resolve(process.env.TRINITY_DATA_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'command-center', 'data');

const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE, '[]', 'utf8');
}

export function generateId(): string {
  const ts = Math.floor(Date.now() / 1000);
  const rand = crypto.randomBytes(3).toString('hex');
  return `cc_${ts}_${rand}`;
}

export function loadContent(): ContentItem[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
    return JSON.parse(raw) as ContentItem[];
  } catch {
    return [];
  }
}

export function saveContent(items: ContentItem[]): void {
  ensureDataDir();
  const tmp = CONTENT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), 'utf8');
  fs.renameSync(tmp, CONTENT_FILE);
}

export function addItem(data: Partial<ContentItem>): ContentItem {
  const items = loadContent();
  const item: ContentItem = {
    id: generateId(),
    type: VALID_TYPES.includes(data.type as ContentType) ? data.type as ContentType : 'note',
    source: data.source || 'manual',
    sourceUrl: data.sourceUrl || '',
    parentId: data.parentId || null,
    author: data.author || '',
    body: data.body || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    sentiment: (['positive', 'neutral', 'negative', null] as const).includes(data.sentiment as ContentSentiment)
      ? (data.sentiment as ContentSentiment) : null,
    priority: ([1, 2, 3] as const).includes(data.priority as Priority) ? data.priority as Priority : 2,
    status: 'unread',
    notes: data.notes || '',
    createdAt: data.createdAt || new Date().toISOString(),
    capturedAt: new Date().toISOString(),
  };
  items.unshift(item);
  saveContent(items);
  return item;
}

export function getItem(id: string): ContentItem | null {
  return loadContent().find(i => i.id === id) ?? null;
}

export function updateItem(id: string, updates: Partial<ContentItem>): ContentItem | null {
  const items = loadContent();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;

  const allowed: (keyof ContentItem)[] = [
    'type', 'source', 'sourceUrl', 'parentId', 'author', 'body',
    'tags', 'sentiment', 'priority', 'status', 'notes',
  ];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'type' && !VALID_TYPES.includes(updates[key] as ContentType)) continue;
      if (key === 'status' && !VALID_STATUSES.includes(updates[key] as ContentStatus)) continue;
      if (key === 'sentiment' && !(['positive', 'neutral', 'negative', null] as readonly (string | null)[]).includes(updates[key] as string | null)) continue;
      if (key === 'priority' && !([1, 2, 3] as readonly number[]).includes(updates[key] as number)) continue;
      (items[idx] as unknown as Record<string, unknown>)[key] = updates[key];
    }
  }
  saveContent(items);
  return items[idx];
}

export function deleteItem(id: string): ContentItem | null {
  const items = loadContent();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx].status = 'archived';
  saveContent(items);
  return items[idx];
}

export function getAllItems(): ContentItem[] {
  return loadContent();
}

export function getStats(): ContentStats {
  const items = loadContent();
  const stats: ContentStats = {
    total: items.length, unread: 0, read: 0, actioned: 0, archived: 0, byType: {},
  };
  for (const item of items) {
    if (item.status in stats && typeof stats[item.status as keyof Omit<ContentStats, 'byType' | 'total'>] === 'number') {
      (stats as unknown as Record<string, number>)[item.status]++;
    }
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
  }
  return stats;
}

// --- Search / Filter (mirrors search.js) ---

export function searchContent(items: ContentItem[], query: string): ContentItem[] {
  if (!query?.trim()) return items;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const haystack = [item.body, item.author, item.notes, ...(item.tags || [])].join(' ').toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

export function filterContent(items: ContentItem[], filters: Record<string, string | undefined>): ContentItem[] {
  let result = items;
  if (filters.type) {
    const types = filters.type.split(',');
    result = result.filter(i => types.includes(i.type));
  }
  if (filters.source) {
    const sources = filters.source.split(',');
    result = result.filter(i => sources.includes(i.source));
  }
  if (filters.status) {
    const statuses = filters.status.split(',');
    result = result.filter(i => statuses.includes(i.status));
  }
  if (filters.sentiment) {
    const sentiments = filters.sentiment.split(',');
    result = result.filter(i => sentiments.includes(i.sentiment ?? ''));
  }
  if (filters.tag) {
    const tags = filters.tag.split(',');
    result = result.filter(i => i.tags && tags.some(t => i.tags.includes(t)));
  }
  if (filters.priority) {
    const p = parseInt(filters.priority, 10);
    if ([1, 2, 3].includes(p)) result = result.filter(i => i.priority === p);
  }
  if (filters.since) {
    const since = new Date(filters.since);
    if (!isNaN(since.getTime())) result = result.filter(i => new Date(i.capturedAt) >= since);
  }
  if (filters.until) {
    const until = new Date(filters.until);
    if (!isNaN(until.getTime())) result = result.filter(i => new Date(i.capturedAt) <= until);
  }
  return result;
}

export function queryContent(items: ContentItem[], params: Record<string, string | undefined>): ContentItem[] {
  let result = items;
  if (params.q) result = searchContent(result, params.q);
  result = filterContent(result, params);
  if (!params.status || !params.status.includes('archived')) {
    result = result.filter(i => i.status !== 'archived');
  }
  return result;
}
