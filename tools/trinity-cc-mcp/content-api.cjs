/**
 * content-api.js — REST bridge
 *
 * Provides mountable route handler for the Command Center HTTP server.
 * Uses the Command Center's own CJS store modules (same content.json).
 *
 * Usage in server.js:
 *   const { handleContentApi } = require('../trinity-cc-mcp/content-api');
 *   // inside your request handler, delegate /api/trinity/* routes
 */

'use strict';

const path = require('path');
const ccRoot = path.join(__dirname, '..', 'command-center');
const store = require(path.join(ccRoot, 'lib', 'store'));
const { queryContent } = require(path.join(ccRoot, 'lib', 'search'));

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { resolve(null); }
    });
    req.on('error', reject);
  });
}

/**
 * Handle /api/trinity/* routes.  Returns true if handled, false otherwise.
 */
async function handleContentApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // GET /api/trinity/stats
  if (p === '/api/trinity/stats' && req.method === 'GET') {
    json(res, 200, store.getStats());
    return true;
  }

  // GET /api/trinity/query?q=...&type=...&status=...
  if (p === '/api/trinity/query' && req.method === 'GET') {
    const params = Object.fromEntries(url.searchParams.entries());
    const items = queryContent(store.getAllItems(), params);
    json(res, 200, { total: items.length, items });
    return true;
  }

  // GET /api/trinity/items
  if (p === '/api/trinity/items' && req.method === 'GET') {
    const items = store.getAllItems();
    json(res, 200, { total: items.length, items });
    return true;
  }

  // POST /api/trinity/items  — add item
  if (p === '/api/trinity/items' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body || !body.type || !body.body) {
      json(res, 400, { error: 'type and body required' });
      return true;
    }
    const item = store.addItem(body);
    json(res, 201, { ok: true, item });
    return true;
  }

  // Item routes: /api/trinity/items/:id
  const itemMatch = p.match(/^\/api\/trinity\/items\/([a-zA-Z0-9_]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];

    if (req.method === 'GET') {
      const item = store.getItem(id);
      if (!item) { json(res, 404, { error: 'not found' }); return true; }
      json(res, 200, item);
      return true;
    }

    if (req.method === 'PUT') {
      const body = await readBody(req);
      const item = store.updateItem(id, body || {});
      if (!item) { json(res, 404, { error: 'not found' }); return true; }
      json(res, 200, { ok: true, item });
      return true;
    }

    if (req.method === 'DELETE') {
      const item = store.deleteItem(id);
      if (!item) { json(res, 404, { error: 'not found' }); return true; }
      json(res, 200, { ok: true, item });
      return true;
    }
  }

  return false; // not handled
}

module.exports = { handleContentApi };
