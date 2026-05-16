'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE, '[]', 'utf8');
}

function generateId() {
  const ts = Math.floor(Date.now() / 1000);
  const rand = crypto.randomBytes(3).toString('hex');
  return `cc_${ts}_${rand}`;
}

function loadContent() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONTENT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveContent(items) {
  ensureDataDir();
  const tmp = CONTENT_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), 'utf8');
  fs.renameSync(tmp, CONTENT_FILE);
}

const VALID_TYPES = [
  'x-reply', 'x-mention', 'x-dm',
  'hn-comment', 'reddit-comment', 'discord-message',
  'linkedin-comment', 'github-comment', 'blog-comment',
  'metric-snapshot', 'note', 'link'
];

const VALID_STATUSES = ['unread', 'read', 'actioned', 'archived'];
const VALID_SENTIMENTS = ['positive', 'neutral', 'negative', null];

function addItem(data) {
  const items = loadContent();
  const item = {
    id: generateId(),
    type: VALID_TYPES.includes(data.type) ? data.type : 'note',
    source: data.source || 'manual',
    sourceUrl: data.sourceUrl || '',
    parentId: data.parentId || null,
    author: data.author || '',
    body: data.body || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    sentiment: VALID_SENTIMENTS.includes(data.sentiment) ? data.sentiment : null,
    priority: [1, 2, 3].includes(data.priority) ? data.priority : 2,
    status: 'unread',
    notes: data.notes || '',
    createdAt: data.createdAt || new Date().toISOString(),
    capturedAt: new Date().toISOString()
  };
  items.unshift(item);
  saveContent(items);
  return item;
}

function getItem(id) {
  const items = loadContent();
  return items.find(i => i.id === id) || null;
}

function updateItem(id, updates) {
  const items = loadContent();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;

  const allowed = ['type', 'source', 'sourceUrl', 'parentId', 'author', 'body',
    'tags', 'sentiment', 'priority', 'status', 'notes'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'type' && !VALID_TYPES.includes(updates[key])) continue;
      if (key === 'status' && !VALID_STATUSES.includes(updates[key])) continue;
      if (key === 'sentiment' && !VALID_SENTIMENTS.includes(updates[key])) continue;
      if (key === 'priority' && ![1, 2, 3].includes(updates[key])) continue;
      items[idx][key] = updates[key];
    }
  }
  saveContent(items);
  return items[idx];
}

function deleteItem(id) {
  const items = loadContent();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx].status = 'archived';
  saveContent(items);
  return items[idx];
}

function getAllItems() {
  return loadContent();
}

function getStats() {
  const items = loadContent();
  const stats = { total: items.length, unread: 0, read: 0, actioned: 0, archived: 0, byType: {} };
  for (const item of items) {
    if (stats[item.status] !== undefined) stats[item.status]++;
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
  }
  return stats;
}

module.exports = {
  loadContent, saveContent, addItem, getItem, updateItem, deleteItem, getAllItems, getStats,
  VALID_TYPES, VALID_STATUSES, VALID_SENTIMENTS, generateId
};
