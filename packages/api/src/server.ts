// Initialize tracing as early as possible
// TEMPORARILY DISABLED FOR DEBUGGING
// import './tracing';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/connection';
import { serversRouter } from './routes/servers';
import adminRouter from './routes/admin';
import feedbackRouter from './routes/feedback';
import ecosystemAnalyticsRouter from './routes/ecosystem-analytics';
import { discoveryRouter } from './routes/discovery';
import stacksRouter from './routes/stacks.js';
import billingRouter from './routes/billing';
// Board of Directors - Revenue Sniper routes
import { createAgentRoutes } from './routes/agents';
import { createIntelligenceRoutes } from './routes/intelligence';
import { createTemplateRoutes } from './routes/templates';
import { createKelatiRoutes } from './routes/kelati';
import { createCommandCenterRoutes } from './routes/command-center';
import { db } from './db/connection';
import { errorHandler, requestLogger, performanceMonitor, securityLogger } from './middleware/errorHandler';
import { healthCheckHandler, livenessHandler, readinessHandler, metricsHandler } from './monitoring/healthChecks';
import { anonymousLimiter, trackApiUsage } from './middleware/rateLimiter';
import { config } from './config/production';
import { githubSyncWorker } from './workers/GitHubSyncWorker';
import { jobProcessor, jobScheduler } from './workers/JobProcessor';

console.log('[DEBUG] Server starting - all imports loaded');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with production configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openconductor.ai"]
    }
  }
}));

app.use(cors({
  origin: config.api.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
// Note: Stripe webhooks need raw body, so we use a custom parser
app.use('/v1/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database (async, don't block server startup)
initializeDatabase().catch(err => {
  console.warn('Database initialization failed, continuing without database:', err.message);
});

// Initialize Phase 2 Enterprise Features
if (process.env.OPENCONDUCTOR_PHASE === 'phase2') {
  console.log('🚀 Initializing Phase 2 Enterprise Features...');
  
  // Start background workers
  if (process.env.AUTO_START_GITHUB_WORKER === 'true') {
    const syncInterval = parseInt(process.env.GITHUB_SYNC_INTERVAL || '60');
    githubSyncWorker.start(syncInterval);
    console.log('✅ GitHub Sync Worker started');
  }
  
  if (process.env.AUTO_START_JOB_PROCESSOR === 'true') {
    const pollInterval = parseInt(process.env.JOB_POLL_INTERVAL || '30');
    jobProcessor.start(pollInterval);
    console.log('✅ Background Job Processor started');
    
    // Setup recurring enterprise jobs
    jobScheduler.setupRecurringJobs().then(() => {
      console.log('✅ Enterprise job scheduling configured');
    }).catch(error => {
      console.warn('Job scheduling setup failed:', error.message);
    });
  }
  
  console.log('🎯 Phase 2 Enterprise Platform: ACTIVE');
}

// API routes - mount according to specification
app.use('/v1/servers', serversRouter);
app.use('/v1/stacks', stacksRouter);
app.use('/v1/admin', adminRouter);
app.use('/v1/feedback', feedbackRouter);
app.use('/v1/analytics', ecosystemAnalyticsRouter);
app.use('/v1/discovery', discoveryRouter);
app.use('/v1/billing', billingRouter);

// Board of Directors - Revenue Sniper API routes
const pool = db.getPool();
app.use('/v1/agents', createAgentRoutes(pool));
app.use('/v1/intelligence', createIntelligenceRoutes(pool));
app.use('/v1/templates', createTemplateRoutes(pool));
app.use('/v1/kelati', createKelatiRoutes(pool));
app.use('/v1/command-center', createCommandCenterRoutes(pool));

// Legacy API routes for backward compatibility
app.use('/api/servers', serversRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/discovery', discoveryRouter);

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'OpenConductor API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      servers: '/v1/servers',
      search: '/v1/servers/search?q=query',
      agents: '/v1/agents',
      commandCenter: '/v1/command-center',
      templates: '/v1/templates',
      stacks: '/v1/stacks'
    },
    docs: 'https://openconductor.ai/docs'
  });
});

// Additional API endpoints
app.get('/v1/search', (req, res) => res.redirect(307, `/v1/servers/search?${req.url.split('?')[1] || ''}`));
app.get('/v1/categories', (req, res) => res.redirect(307, `/v1/servers/categories`));
app.get('/v1/stats/trending', (req, res) => res.redirect(307, `/v1/servers/stats/trending?${req.url.split('?')[1] || ''}`));
app.get('/v1/stats/popular', (req, res) => res.redirect(307, `/v1/servers/stats/popular?${req.url.split('?')[1] || ''}`));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the server only if not in serverless environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 OpenConductor API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API Base: http://localhost:${PORT}/v1`);
    console.log(`🔧 Admin: http://localhost:${PORT}/v1/admin`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });
}

export default app;