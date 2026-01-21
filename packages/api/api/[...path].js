// Vercel serverless function entry point
// Use require() for compatibility with Vercel's Node.js runtime

let app;
try {
  console.log('[api/index.js] Loading server module...');
  console.log('[api/index.js] POSTGRES_URL set:', !!process.env.POSTGRES_URL);
  console.log('[api/index.js] NODE_ENV:', process.env.NODE_ENV);

  app = require('../dist/server').default;
  console.log('[api/index.js] Server module loaded successfully');
} catch (error) {
  console.error('[api/index.js] Failed to load server module:', error.message);
  console.error('[api/index.js] Stack:', error.stack);

  // Return a minimal Express app that shows the error
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        vercel: process.env.VERCEL
      }
    });
  });
}

// Wrapper to strip /api prefix for Express routing
module.exports = (req, res) => {
  // Strip /api prefix since Express routes are defined under /v1/
  if (req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  return app(req, res);
};
