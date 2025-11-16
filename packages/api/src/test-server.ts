// Minimal test server to debug Railway crash
console.log('[TEST] Starting minimal server...');

import express from 'express';
console.log('[TEST] Express loaded');

import dotenv from 'dotenv';
console.log('[TEST] Dotenv loaded');

dotenv.config();
console.log('[TEST] Environment loaded');

// Test if we can import from @openconductor/shared
try {
  console.log('[TEST] Attempting to import from @openconductor/shared...');
  const shared = require('@openconductor/shared');
  console.log('[TEST] ✅ @openconductor/shared loaded successfully');
  console.log('[TEST] Available exports:', Object.keys(shared).slice(0, 10).join(', '));
} catch (err: any) {
  console.error('[TEST] ❌ FAILED to load @openconductor/shared:', err.message);
  console.error('[TEST] Error stack:', err.stack);
}

// Test if we can import the config
try {
  console.log('[TEST] Attempting to import production config...');
  const { config } = require('./config/production');
  console.log('[TEST] ✅ Production config loaded');
  console.log('[TEST] Config CORS origins:', config.api.corsOrigins);
} catch (err: any) {
  console.error('[TEST] ❌ FAILED to load production config:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

console.log('[TEST] Creating test route...');
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal test server running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

if (process.env.VERCEL !== '1') {
  console.log('[TEST] Starting server on port', PORT);
  const server = app.listen(PORT, () => {
    console.log(`[TEST] ✅ Server running on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('[TEST] SIGTERM received');
    server.close(() => {
      console.log('[TEST] Server closed');
    });
  });
}

export default app;
