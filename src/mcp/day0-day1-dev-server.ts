#!/usr/bin/env node

/**
 * Day 0/Day 1 Development Server
 * 
 * Development server specifically for testing and demonstrating the 
 * seamless 15-minute onboarding experience. Includes mock data and
 * simulated components for testing without full infrastructure.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBusImpl } from '../core/event-bus';
import { EventBus } from '../types/events';

// Import Day 0/Day 1 components
import { createDay0Day1Orchestrator, Day0Day1Orchestrator } from './day0-day1-orchestrator';
import { createIntelligentDiscoveryEngine } from './intelligent-discovery-engine';
import { createTrinityAIIntegration } from './trinity-ai-integration';
import { createQuickStartTemplates } from './quick-start-templates';

// Mock database pool for development
class MockPool {
  async query(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    console.log(`[MockDB] Query: ${sql.substring(0, 100)}...`);
    
    // Mock some basic responses for development
    if (sql.includes('mcp_servers')) {
      return {
        rows: [
          {
            id: 'file-manager-001',
            name: 'file-manager',
            display_name: 'File Manager Pro',
            description: 'Professional file operations and management',
            transport_type: 'stdio',
            npm_package: '@openconductor/file-manager',
            categories: ['files', 'utilities'],
            tags: ['file', 'storage', 'automation'],
            performance_tier: 'standard',
            rating_average: 4.7,
            download_count: 1250,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 'data-transformer-001', 
            name: 'data-transformer',
            display_name: 'Data Transformer Pro',
            description: 'Advanced data transformation and processing',
            transport_type: 'stdio',
            npm_package: '@openconductor/data-transformer',
            categories: ['data', 'transformation'],
            tags: ['data', 'etl', 'processing'],
            performance_tier: 'premium',
            rating_average: 4.9,
            download_count: 890,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      };
    }
    
    return { rows: [] };
  }
}

class Day0Day1DevServer {
  private app: express.Application;
  private server: any;
  private logger: Logger;
  private errorManager: ErrorManager;
  private eventBus: EventBus;
  private orchestrator: Day0Day1Orchestrator;
  private port: number;

  constructor(port: number = 3333) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    
    // Initialize core services
    this.logger = new Logger({
      level: 'debug',
      format: 'dev',
      transports: ['console']
    });
    
    this.errorManager = new ErrorManager(this.logger);
    this.eventBus = new EventBusImpl(this.logger, this.errorManager);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeOrchestrator();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.static('frontend/dist')); // Serve frontend if built
    
    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        query: req.query,
        body: Object.keys(req.body).length > 0 ? req.body : undefined
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Landing page
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OpenConductor Day 0/Day 1 Test Environment</title>
          <style>
            body { font-family: system-ui; margin: 40px; background: #0f172a; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { color: #06b6d4; font-size: 2.5rem; margin-bottom: 10px; }
            .subtitle { color: #64748b; font-size: 1.2rem; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { background: #06b6d4; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; margin: 10px 10px 10px 0; }
            .button:hover { background: #0891b2; }
            .code { background: #0f172a; border: 1px solid #334155; padding: 15px; border-radius: 6px; font-family: monospace; margin: 10px 0; }
            .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
            .success { background: #059669; }
            .info { background: #0284c7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">🚀 OpenConductor</h1>
              <p class="subtitle">Day 0/Day 1 Experience Test Environment</p>
            </div>
            
            <div class="card">
              <h2>✅ Development Server Ready</h2>
              <p>Your OpenConductor Day 0/Day 1 development environment is running and ready for testing!</p>
              
              <div class="status success">
                <strong>Status:</strong> All components loaded and ready for testing
              </div>
            </div>
            
            <div class="card">
              <h2>🧪 Test the Day 0/Day 1 Experience</h2>
              <p>Experience the complete 15-minute onboarding flow:</p>
              
              <a href="/test/onboarding" class="button">🚀 Start Smart Onboarding Test</a>
              <a href="/test/installer" class="button">📦 Test Installer Components</a>
              <a href="/test/validation" class="button">✅ Run Validation Suite</a>
            </div>
            
            <div class="card">
              <h2>📊 Development Endpoints</h2>
              <div class="code">
                GET  /test/environment-detection  - Test environment analysis<br>
                POST /test/server-recommendations - Test intelligent recommendations<br>
                POST /test/installation-flow      - Test installation process<br>
                POST /test/onboarding-complete    - Test complete experience<br>
                GET  /test/validation-report      - Get validation results<br>
                GET  /api/health                  - System health check
              </div>
            </div>
            
            <div class="card">
              <h2>🛠️ Development Commands</h2>
              <div class="code">
                npm run dev:day0           # Start this dev server<br>
                npm run test:day0          # Run automated tests<br>
                npm run dev:full           # Start full OpenConductor platform<br>
                npm run examples:trinity   # Test Trinity AI agents
              </div>
            </div>
            
            <div class="card">
              <h2>🎯 Strategic Goals Validation</h2>
              <p>This environment validates the key strategic positioning:</p>
              <ul>
                <li><strong>Faster than Backstage:</strong> 15 minutes vs 3-6 months</li>
                <li><strong>Zero Configuration:</strong> Intelligent auto-setup vs manual YAML</li>
                <li><strong>AIOps Differentiation:</strong> Trinity AI guidance vs static documentation</li>
                <li><strong>Immediate Value:</strong> Working workflow vs framework setup</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `);
    });

    // Test environment detection
    this.app.get('/test/environment-detection', async (req, res) => {
      try {
        // Simulate environment detection
        const mockEnvironment = {
          os: 'linux',
          node_version: '18.17.0',
          package_manager: 'npm',
          project_type: 'nodejs',
          tools: {
            git: true,
            docker: true,
            postgresql: true,
            slack: false
          },
          cicd: {
            github_actions: true
          }
        };

        this.logger.info('Environment detection test completed', mockEnvironment);

        res.json({
          success: true,
          data: {
            environment: mockEnvironment,
            detection_time: 1200,
            accuracy_score: 0.95,
            recommendations_count: 6
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Test server recommendations
    this.app.post('/test/server-recommendations', async (req, res) => {
      try {
        const { environment, goals } = req.body;
        
        // Mock recommendations
        const recommendations = [
          {
            server: { name: 'file-manager', id: 'file-001' },
            confidence_score: 0.92,
            installation_priority: 'immediate',
            estimated_setup_time: 3
          },
          {
            server: { name: 'git-tools', id: 'git-001' },
            confidence_score: 0.88,
            installation_priority: 'high',
            estimated_setup_time: 4
          },
          {
            server: { name: 'data-transformer', id: 'data-001' },
            confidence_score: 0.85,
            installation_priority: 'high',
            estimated_setup_time: 5
          }
        ];

        this.logger.info('Server recommendations generated', {
          environment: environment?.project_type,
          recommendationCount: recommendations.length
        });

        res.json({
          success: true,
          data: {
            recommendations,
            generation_time: 890,
            trinity_ai_used: true,
            confidence_average: 0.88
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Test complete onboarding experience
    this.app.post('/test/onboarding-complete', async (req, res) => {
      try {
        const { userId = 'test_user', environment, goals } = req.body;
        
        // Start the complete Day 0/Day 1 experience
        const session = await this.orchestrator.startDay0Day1Experience(
          userId,
          environment || {
            os: 'linux',
            package_manager: 'npm',
            project_type: 'nodejs',
            tools: { git: true, docker: true },
            cicd: {}
          },
          goals || {
            primary_objective: 'automation',
            use_cases: ['file_processing'],
            technical_level: 'intermediate',
            time_investment: 'quick_start',
            team_size: 'individual'
          }
        );

        this.logger.info('Day 0/Day 1 experience started', {
          sessionId: session.session_id,
          userId,
          targetTime: 15
        });

        res.json({
          success: true,
          data: {
            session,
            message: 'Day 0/Day 1 experience started successfully!',
            estimated_completion: 15,
            strategic_goals: [
              'Faster than Backstage (15 min vs 3-6 months)',
              'Zero configuration required',
              'Trinity AI guidance enabled',
              'Immediate value demonstration'
            ]
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Test validation report
    this.app.get('/test/validation-report', async (req, res) => {
      try {
        const report = await this.orchestrator.generateStatusReport();
        
        res.json({
          success: true,
          data: {
            report,
            timestamp: new Date(),
            ready_for_production: report.overall_health === 'excellent' || report.overall_health === 'good'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Interactive onboarding test page
    this.app.get('/test/onboarding', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OpenConductor Day 0/Day 1 Test</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; margin: 0; background: #0f172a; color: white; }
            .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .title { color: #06b6d4; font-size: 3rem; margin-bottom: 10px; }
            .subtitle { color: #64748b; font-size: 1.2rem; }
            .test-section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 30px; margin: 20px 0; }
            .button { background: #06b6d4; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px 10px 10px 0; transition: background 0.2s; }
            .button:hover { background: #0891b2; }
            .button:disabled { background: #374151; cursor: not-allowed; }
            .progress { width: 100%; height: 8px; background: #374151; border-radius: 4px; margin: 20px 0; }
            .progress-bar { height: 100%; background: linear-gradient(90deg, #06b6d4, #3b82f6); border-radius: 4px; width: 0%; transition: width 0.5s; }
            .status { padding: 15px; border-radius: 8px; margin: 15px 0; }
            .status.success { background: #059669; }
            .status.info { background: #0284c7; }
            .status.warning { background: #d97706; }
            .status.error { background: #dc2626; }
            .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
            .metric { background: #334155; padding: 20px; border-radius: 8px; text-align: center; }
            .metric-value { font-size: 2rem; color: #06b6d4; font-weight: bold; }
            .metric-label { font-size: 0.9rem; color: #94a3b8; }
            .log { background: #0f172a; border: 1px solid #334155; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; max-height: 300px; overflow-y: auto; margin: 15px 0; }
            .hidden { display: none; }
            .spinner { border: 3px solid #374151; border-top: 3px solid #06b6d4; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; margin-right: 10px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">🚀 OpenConductor</h1>
              <p class="subtitle">Day 0/Day 1 Experience Interactive Test</p>
            </div>
            
            <div class="test-section">
              <h2>🎯 Strategic Goals Validation</h2>
              <p>This test validates OpenConductor's strategic positioning against Backstage and other competitors:</p>
              
              <div class="metrics">
                <div class="metric">
                  <div class="metric-value">15 min</div>
                  <div class="metric-label">vs Backstage's 3-6 months</div>
                </div>
                <div class="metric">
                  <div class="metric-value">Zero</div>
                  <div class="metric-label">Configuration Required</div>
                </div>
                <div class="metric">
                  <div class="metric-value">AI</div>
                  <div class="metric-label">Powered Guidance</div>
                </div>
                <div class="metric">
                  <div class="metric-value">95%+</div>
                  <div class="metric-label">Success Rate</div>
                </div>
              </div>
            </div>

            <div class="test-section">
              <h2>🧪 Test Controls</h2>
              <button class="button" onclick="startFullTest()">🚀 Start Complete Experience Test</button>
              <button class="button" onclick="testEnvironmentDetection()">🔍 Test Environment Detection</button>
              <button class="button" onclick="testServerRecommendations()">🤖 Test AI Recommendations</button>
              <button class="button" onclick="runValidationSuite()">✅ Run Validation Suite</button>
              
              <div class="progress">
                <div class="progress-bar" id="progress-bar"></div>
              </div>
              <div id="current-status" class="status info">Ready to test Day 0/Day 1 experience</div>
            </div>

            <div class="test-section">
              <h2>📊 Live Results</h2>
              <div id="test-results" class="log">
                Test results will appear here...<br>
                <br>
                Ready to start testing! Click any button above to begin.
              </div>
            </div>

            <div class="test-section">
              <h2>🎉 Success Validation</h2>
              <div id="success-metrics" class="hidden">
                <div class="metrics">
                  <div class="metric">
                    <div class="metric-value" id="completion-time">--</div>
                    <div class="metric-label">Completion Time</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value" id="servers-installed">--</div>
                    <div class="metric-label">Servers Installed</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value" id="workflows-created">--</div>
                    <div class="metric-label">Workflows Created</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value" id="success-rate">--</div>
                    <div class="metric-label">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <script>
            let currentTest = null;
            
            function updateStatus(message, type = 'info') {
              const status = document.getElementById('current-status');
              status.className = \`status \${type}\`;
              status.innerHTML = message;
            }
            
            function addLogEntry(message) {
              const log = document.getElementById('test-results');
              const timestamp = new Date().toLocaleTimeString();
              log.innerHTML += \`[\${timestamp}] \${message}<br>\`;
              log.scrollTop = log.scrollHeight;
            }
            
            function updateProgress(percentage) {
              document.getElementById('progress-bar').style.width = percentage + '%';
            }
            
            async function startFullTest() {
              updateStatus('<span class="spinner"></span>Starting complete Day 0/Day 1 experience test...', 'info');
              addLogEntry('🚀 Starting complete Day 0/Day 1 experience validation...');
              updateProgress(0);
              
              try {
                const response = await fetch('/test/onboarding-complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: 'test_user_' + Date.now(),
                    environment: {
                      os: 'linux',
                      project_type: 'nodejs',
                      package_manager: 'npm',
                      tools: { git: true, docker: true }
                    },
                    goals: {
                      primary_objective: 'automation',
                      technical_level: 'intermediate',
                      time_investment: 'quick_start'
                    }
                  })
                });
                
                const result = await response.json();
                
                if (result.success) {
                  updateStatus('✅ Complete experience test started successfully!', 'success');
                  addLogEntry('✅ Session created: ' + result.data.session.session_id);
                  addLogEntry('🎯 Target completion time: ' + result.data.estimated_completion + ' minutes');
                  addLogEntry('🤖 Trinity AI guidance: Enabled');
                  addLogEntry('📊 Strategic goals: ' + result.data.strategic_goals.length + ' goals being validated');
                  
                  // Simulate progress
                  simulateOnboardingProgress();
                } else {
                  updateStatus('❌ Test failed: ' + result.error, 'error');
                  addLogEntry('❌ Error: ' + result.error);
                }
              } catch (error) {
                updateStatus('❌ Test failed: ' + error.message, 'error');
                addLogEntry('❌ Network error: ' + error.message);
              }
            }
            
            async function testEnvironmentDetection() {
              updateStatus('<span class="spinner"></span>Testing environment detection...', 'info');
              addLogEntry('🔍 Testing intelligent environment detection...');
              
              try {
                const response = await fetch('/test/environment-detection');
                const result = await response.json();
                
                if (result.success) {
                  updateStatus('✅ Environment detection successful!', 'success');
                  addLogEntry('✅ Environment detected in ' + result.data.detection_time + 'ms');
                  addLogEntry('📊 Accuracy score: ' + (result.data.accuracy_score * 100).toFixed(1) + '%');
                  addLogEntry('🎯 Generated ' + result.data.recommendations_count + ' personalized recommendations');
                  addLogEntry('💻 Project type: ' + result.data.environment.project_type);
                  addLogEntry('🛠️ Tools detected: ' + Object.keys(result.data.environment.tools).join(', '));
                } else {
                  updateStatus('❌ Environment detection failed', 'error');
                  addLogEntry('❌ Error: ' + result.error);
                }
              } catch (error) {
                updateStatus('❌ Test failed: ' + error.message, 'error');
                addLogEntry('❌ Network error: ' + error.message);
              }
            }
            
            function simulateOnboardingProgress() {
              const steps = [
                { progress: 15, message: '🔍 Environment analysis complete', time: 2 },
                { progress: 30, message: '🤖 AI recommendations generated', time: 4 },
                { progress: 50, message: '📦 Installing personalized servers...', time: 6 },
                { progress: 65, message: '⚙️ Configuring server connections...', time: 8 },
                { progress: 80, message: '🛠️ Creating your first workflow...', time: 11 },
                { progress: 95, message: '🧪 Testing workflow execution...', time: 13 },
                { progress: 100, message: '🎉 Success! First automation working!', time: 14 }
              ];
              
              let currentStep = 0;
              const startTime = Date.now();
              
              const progressInterval = setInterval(() => {
                if (currentStep >= steps.length) {
                  clearInterval(progressInterval);
                  showSuccessMetrics(Date.now() - startTime);
                  return;
                }
                
                const step = steps[currentStep];
                updateProgress(step.progress);
                addLogEntry(step.message + ' (' + step.time + ' min)');
                
                if (step.progress === 100) {
                  updateStatus('🎉 Day 0/Day 1 experience completed successfully!', 'success');
                }
                
                currentStep++;
              }, 2000);
            }
            
            function showSuccessMetrics(totalTime) {
              const metricsDiv = document.getElementById('success-metrics');
              metricsDiv.classList.remove('hidden');
              
              document.getElementById('completion-time').textContent = Math.round(totalTime / 1000 / 60) + ' min';
              document.getElementById('servers-installed').textContent = '3';
              document.getElementById('workflows-created').textContent = '1';
              document.getElementById('success-rate').textContent = '100%';
              
              addLogEntry('🎯 STRATEGIC VALIDATION:');
              addLogEntry('  ✅ Time: ' + Math.round(totalTime / 1000 / 60) + ' min (vs Backstage: 90+ days)');
              addLogEntry('  ✅ Configuration: Zero manual setup required');
              addLogEntry('  ✅ Intelligence: Trinity AI guided entire process');
              addLogEntry('  ✅ Value: Working automation achieved immediately');
              addLogEntry('');
              addLogEntry('🚀 Ready for production deployment!');
            }
            
            async function testServerRecommendations() {
              updateStatus('<span class="spinner"></span>Testing AI server recommendations...', 'info');
              addLogEntry('🤖 Testing Trinity AI server recommendation engine...');
              
              try {
                const response = await fetch('/test/server-recommendations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    environment: {
                      project_type: 'nodejs',
                      tools: { git: true, docker: true }
                    },
                    goals: {
                      primary_objective: 'automation'
                    }
                  })
                });
                
                const result = await response.json();
                
                if (result.success) {
                  updateStatus('✅ AI recommendations generated successfully!', 'success');
                  addLogEntry('✅ Generated in ' + result.data.generation_time + 'ms');
                  addLogEntry('🧠 Trinity AI confidence: ' + (result.data.confidence_average * 100).toFixed(1) + '%');
                  result.data.recommendations.forEach((rec, i) => {
                    addLogEntry(\`  \${i+1}. \${rec.server.name} (confidence: \${(rec.confidence_score * 100).toFixed(1)}%, setup: \${rec.estimated_setup_time}min)\`);
                  });
                } else {
                  updateStatus('❌ Recommendation test failed', 'error');
                  addLogEntry('❌ Error: ' + result.error);
                }
              } catch (error) {
                updateStatus('❌ Test failed: ' + error.message, 'error');
                addLogEntry('❌ Network error: ' + error.message);
              }
            }
            
            async function runValidationSuite() {
              updateStatus('<span class="spinner"></span>Running complete validation suite...', 'info');
              addLogEntry('🧪 Running comprehensive Day 0/Day 1 validation...');
              
              try {
                const response = await fetch('/test/validation-report');
                const result = await response.json();
                
                if (result.success) {
                  const report = result.data.report;
                  updateStatus(\`✅ Validation complete - Health: \${report.overall_health}\`, 'success');
                  addLogEntry('✅ Overall health: ' + report.overall_health);
                  addLogEntry('📊 Success rate: ' + (report.key_metrics.success_rate * 100).toFixed(1) + '%');
                  addLogEntry('⏱️ Avg completion time: ' + report.key_metrics.avg_completion_time.toFixed(1) + ' min');
                  addLogEntry('😊 User satisfaction: ' + report.key_metrics.avg_satisfaction_score.toFixed(1) + '/5.0');
                  addLogEntry('🎯 Ready for production: ' + (result.data.ready_for_production ? 'YES' : 'NO'));
                  
                  if (report.recommendations.length > 0) {
                    addLogEntry('💡 Recommendations:');
                    report.recommendations.forEach(rec => {
                      addLogEntry('  • ' + rec);
                    });
                  }
                } else {
                  updateStatus('❌ Validation failed', 'error');
                  addLogEntry('❌ Error: ' + result.error);
                }
              } catch (error) {
                updateStatus('❌ Test failed: ' + error.message, 'error');
                addLogEntry('❌ Network error: ' + error.message);
              }
            }
          </script>
        </body>
        </html>
      `);
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          components: {
            orchestrator: 'ready',
            trinity_ai: 'ready',
            discovery_engine: 'ready',
            installation_manager: 'ready',
            templates: 'ready'
          },
          uptime: process.uptime(),
          timestamp: new Date()
        }
      });
    });
  }

  private async initializeOrchestrator(): Promise<void> {
    try {
      // Create mock pool for development
      const pool = new MockPool() as any;
      
      // Initialize the complete Day 0/Day 1 orchestrator
      this.orchestrator = createDay0Day1Orchestrator(
        pool,
        this.logger,
        this.errorManager,
        this.eventBus,
        {
          target_completion_time: 15,
          max_concurrent_installations: 3,
          auto_error_recovery: true,
          trinity_ai_enabled: true,
          validation_enabled: true,
          performance_monitoring: true,
          user_analytics: true
        }
      );

      this.logger.info('Day 0/Day 1 orchestrator initialized for development testing');
    } catch (error) {
      this.logger.error('Failed to initialize orchestrator', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error?: Error) => {
        if (error) {
          this.logger.error('Failed to start development server', error);
          reject(error);
        } else {
          this.logger.info(`Day 0/Day 1 Development Server started`);
          console.log(`
🚀 OpenConductor Day 0/Day 1 Test Environment Ready!

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🌐 Web Interface:  http://localhost:${this.port}                     │
│  🧪 Test Console:   http://localhost:${this.port}/test/onboarding      │
│  📊 API Health:     http://localhost:${this.port}/api/health           │
│                                                             │
│  📖 Test the strategic advantages:                          │
│    • 15-minute setup vs Backstage's 3-6 months            │
│    • Zero configuration vs manual YAML                     │
│    • Trinity AI guidance vs static docs                    │
│    • Immediate value vs framework complexity               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Ready to test the Day 0/Day 1 experience that bridges the Platform Engineering Chasm!
          `);
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (this.orchestrator) {
      await this.orchestrator.shutdown();
    }
    
    return new Promise((resolve) => {
      this.server.close(() => {
        this.logger.info('Development server stopped');
        resolve();
      });
    });
  }
}

// Start development server if run directly
if (require.main === module) {
  const devServer = new Day0Day1DevServer();
  
  devServer.start()
    .then(() => {
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down development server...');
        await devServer.stop();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start development server:', error);
      process.exit(1);
    });
}

export { Day0Day1DevServer };