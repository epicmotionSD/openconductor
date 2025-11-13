import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './db/connection';
import { serversRouter } from './routes/servers';
import { errorHandler, requestLogger, performanceMonitor, securityLogger } from './middleware/errorHandler';
import { healthCheckHandler, livenessHandler, readinessHandler, metricsHandler } from './monitoring/healthChecks';
import { anonymousLimiter, trackApiUsage } from './middleware/rateLimiter';
import { config } from './config/production';
import { githubSyncWorker } from './workers/GitHubSyncWorker';
import { jobProcessor, jobScheduler } from './workers/JobProcessor';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  });
});

// API routes - mount according to specification
app.use('/v1/servers', serversRouter);

// Legacy API routes for backward compatibility
app.use('/api/servers', serversRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenConductor API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API docs: http://localhost:${PORT}/api/servers`);
});

export default app;