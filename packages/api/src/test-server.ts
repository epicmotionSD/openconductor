// Minimal test server to debug Railway crash
console.log('[TEST] Starting minimal server...');

import express from 'express';
console.log('[TEST] Express loaded');

import dotenv from 'dotenv';
console.log('[TEST] Dotenv loaded');

dotenv.config();
console.log('[TEST] Environment loaded');

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
