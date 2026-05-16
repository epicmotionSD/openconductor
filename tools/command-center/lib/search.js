'use strict';

/**
 * Search and filter engine for content items.
 * Keyword search across body, author, tags, notes.
 * Structured filters for type, source, status, sentiment, tag, date range.
 */

function searchContent(items, query) {
  if (!query || !query.trim()) return items;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const haystack = [
      item.body,
      item.author,
      item.notes,
      ...(item.tags || [])
    ].join(' ').toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

function filterContent(items, filters) {
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
    result = result.filter(i => sentiments.includes(i.sentiment));
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
    if (!isNaN(since)) result = result.filter(i => new Date(i.capturedAt) >= since);
  }
  if (filters.until) {
    const until = new Date(filters.until);
    if (!isNaN(until)) result = result.filter(i => new Date(i.capturedAt) <= until);
  }

  return result;
}

function queryContent(items, params) {
  let result = items;
  if (params.q) result = searchContent(result, params.q);
  result = filterContent(result, params);
  // Exclude archived by default unless explicitly requested
  if (!params.status || !params.status.includes('archived')) {
    result = result.filter(i => i.status !== 'archived');
  }
  return result;
}

module.exports = { searchContent, filterContent, queryContent };
