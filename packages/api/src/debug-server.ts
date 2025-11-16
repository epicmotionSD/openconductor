// Incremental debug server - adding features back one at a time
console.log('[DEBUG] Starting incremental server...');

import express from 'express';
console.log('[DEBUG] ✅ Express loaded');

import cors from 'cors';
console.log('[DEBUG] ✅ Cors loaded');

import helmet from 'helmet';
console.log('[DEBUG] ✅ Helmet loaded');

import dotenv from 'dotenv';
console.log('[DEBUG] ✅ Dotenv loaded');

dotenv.config();
console.log('[DEBUG] ✅ Environment configured');

// Try loading db connection
try {
  const dbModule = await import('./db/connection');
  console.log('[DEBUG] ✅ DB connection module loaded');
} catch (err: any) {
  console.error('[DEBUG] ❌ DB connection failed:', err.message);
}

// Try loading config
try {
  const configModule = await import('./config/production');
  console.log('[DEBUG] ✅ Production config loaded');
} catch (err: any) {
  console.error('[DEBUG] ❌ Production config failed:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

console.log('[DEBUG] Setting up middleware...');

// Basic middleware
app.use(helmet());
console.log('[DEBUG] ✅ Helmet middleware');

app.use(cors());
console.log('[DEBUG] ✅ CORS middleware');

app.use(express.json({ limit: '10mb' }));
console.log('[DEBUG] ✅ JSON parser');

app.use(express.urlencoded({ extended: true }));
console.log('[DEBUG] ✅ URL encoder');

// Test routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Debug server running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

if (process.env.VERCEL !== '1') {
  console.log('[DEBUG] Starting server on port', PORT);
  const server = app.listen(PORT, () => {
    console.log(`[DEBUG] 🚀 Server successfully started on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('[DEBUG] SIGTERM received');
    server.close(() => {
      console.log('[DEBUG] Server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('[DEBUG] SIGINT received');
    server.close(() => {
      process.exit(0);
    });
  });
}

export default app;
