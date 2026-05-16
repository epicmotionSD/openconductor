'use strict';

/**
 * URL → content type auto-detection.
 * Maps URL domains to content types and sources.
 */

const DOMAIN_MAP = [
  { pattern: /(?:twitter\.com|x\.com)\/\w+\/status/i, type: 'x-reply', source: 'x' },
  { pattern: /(?:twitter\.com|x\.com)/i, type: 'x-mention', source: 'x' },
  { pattern: /news\.ycombinator\.com/i, type: 'hn-comment', source: 'hn' },
  { pattern: /reddit\.com/i, type: 'reddit-comment', source: 'reddit' },
  { pattern: /discord\.com|discord\.gg/i, type: 'discord-message', source: 'discord' },
  { pattern: /linkedin\.com/i, type: 'linkedin-comment', source: 'linkedin' },
  { pattern: /github\.com.*(?:issues|discussions|pull)/i, type: 'github-comment', source: 'github' },
  { pattern: /dev\.to/i, type: 'blog-comment', source: 'devto' },
];

function detectType(url) {
  if (!url) return { type: 'note', source: 'manual' };
  for (const entry of DOMAIN_MAP) {
    if (entry.pattern.test(url)) {
      return { type: entry.type, source: entry.source };
    }
  }
  return { type: 'link', source: 'manual' };
}

function parseImport(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return null;

  // Check if first line looks like a URL
  const lines = trimmed.split('\n');
  const firstLine = lines[0].trim();
  const urlMatch = firstLine.match(/^https?:\/\/\S+/);

  if (urlMatch) {
    const url = urlMatch[0];
    const { type, source } = detectType(url);
    const body = lines.slice(1).join('\n').trim() || url;
    return { type, source, sourceUrl: url, body, author: '', tags: [] };
  }

  // Plain text → note
  return { type: 'note', source: 'manual', sourceUrl: '', body: trimmed, author: '', tags: [] };
}

/**
 * Parse a multi-item import blob.
 * Splits on blank-line boundaries; each chunk may start with a URL.
 * Returns array of parsed items (not yet saved).
 */
function parseMultiImport(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return [];

  // Split on double newlines (blank line separators)
  const chunks = trimmed.split(/\n\s*\n/).map(c => c.trim()).filter(Boolean);
  const items = [];

  for (const chunk of chunks) {
    const parsed = parseImport(chunk);
    if (parsed) items.push(parsed);
  }

  return items;
}

module.exports = { detectType, parseImport, parseMultiImport, DOMAIN_MAP };
