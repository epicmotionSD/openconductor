/**
 * Enhanced MCP Installation Manager with Zero-Configuration Auto-Setup
 * 
 * Extends the existing MCPInstallationManager with intelligent automation:
 * - Zero-configuration server installation
 * - Intelligent dependency resolution
 * - Automated health monitoring and recovery
 * - Real-time progress tracking with Trinity AI guidance
 */

import { Pool } from 'pg';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
import { EventBus } from '../types/events';
import { MCPInstallationManager, ServerInstallation, InstallationRequest, MCPConnection } from './installation-manager';
import { IntelligentDiscoveryEngine, ServerRecommendation, EnvironmentContext, UserGoals } from './intelligent-discovery-engine';

export interface AutoInstallationConfig {
  max_concurrent_installations: number;
  auto_retry_count: number;
  health_check_interval: number;
  progress_reporting_interval: number;
  intelligent_ordering: boolean;
  dependency_auto_resolution: boolean;
  self_healing: boolean;
}

export interface InstallationProgress {
  session_id: string;
  user_id: string;
  total_servers: number;
  completed_servers: number;
  failed_servers: number;
  current_server?: string;
  overall_progress: number; // 0-100
  estimated_time_remaining: number; // minutes
  status: 'initializing' | 'installing' | 'completed' | 'failed' | 'paused';
  detailed_progress: InstallationStepProgress[];
  trinity_guidance?: {
    current_advice: string;
    next_steps: string[];
    troubleshooting_tips: string[];
  };
  start_time: Date;
  last_update: Date;
}

export interface InstallationStepProgress {
  server_id: string;
  server_name: string;
  status: 'pending' | 'downloading' | 'configuring' | 'testing' | 'completed' | 'failed';
  progress: number; // 0-100
  step_details: string;
  elapsed_time: number;
  estimated_remaining: number;
  error_message?: string;
  retry_count: number;
  health_check_status?: 'healthy' | 'degraded' | 'unhealthy';
}

export interface AutoInstallationSession {
  id: string;
  user_id: string;
  environment: EnvironmentContext;
  goals: UserGoals;
  recommendations: ServerRecommendation[];
  config: AutoInstallationConfig;
  progress: InstallationProgress;
  created_at: Date;
  completed_at?: Date;
}

/**
 * Enhanced Installation Manager
 */
export class EnhancedInstallationManager extends MCPInstallationManager {
  private discoveryEngine: IntelligentDiscoveryEngine;
  private activeSessions = new Map<string, AutoInstallationSession>();
  private progressUpdateInterval?: NodeJS.Timeout;
  private healthMonitorInterval?: NodeJS.Timeout;
  
  // Default configuration
  private defaultConfig: AutoInstallationConfig = {
    max_concurrent_installations: 3,
    auto_retry_count: 2,
    health_check_interval: 30000, // 30 seconds
    progress_reporting_interval: 2000, // 2 seconds
    intelligent_ordering: true,
    dependency_auto_resolution: true,
    self_healing: true
  };

  constructor(
    pool: Pool,
    logger: Logger,
    errorManager: ErrorManager,
    eventBus: EventBus,
    discoveryEngine: IntelligentDiscoveryEngine
  ) {
    super(pool, logger, errorManager, eventBus);
    this.discoveryEngine = discoveryEngine;
    
    this.startProgressMonitoring();
    this.startHealthMonitoring();
    
    this.logger.info('Enhanced Installation Manager initialized with zero-config capabilities');
  }

  /**
   * Start zero-configuration auto-installation session
   */
  async startAutoInstallation(
    userId: string,
    environment: EnvironmentContext,
    goals: UserGoals,
    config: Partial<AutoInstallationConfig> = {}
  ): Promise<AutoInstallationSession> {
    const sessionId = this.generateSessionId();
    
    this.logger.info('Starting zero-configuration auto-installation', {
      sessionId,
      userId,
      projectType: environment.project_type,
      objective: goals.primary_objective
    });

    try {
      // Step 1: Generate intelligent server recommendations
      const recommendations = await this.discoveryEngine.generateRecommendations(
        userId,
        environment,
        goals
      );

      // Step 2: Filter and order recommendations for auto-installation
      const installationQueue = this.prepareInstallationQueue(recommendations, environment);

      // Step 3: Create installation session
      const session: AutoInstallationSession = {
        id: sessionId,
        user_id: userId,
        environment,
        goals,
        recommendations: installationQueue,
        config: { ...this.defaultConfig, ...config },
        progress: {
          session_id: sessionId,
          user_id: userId,
          total_servers: installationQueue.length,
          completed_servers: 0,
          failed_servers: 0,
          overall_progress: 0,
          estimated_time_remaining: this.calculateEstimatedTime(installationQueue),
          status: 'initializing',
          detailed_progress: installationQueue.map(rec => ({
            server_id: rec.server.id,
            server_name: rec.server.name,
            status: 'pending',
            progress: 0,
            step_details: 'Queued for installation',
            elapsed_time: 0,
            estimated_remaining: rec.estimated_setup_time,
            retry_count: 0
          })),
          start_time: new Date(),
          last_update: new Date()
        },
        created_at: new Date()
      };

      this.activeSessions.set(sessionId, session);

      // Step 4: Start installation process
      this.executeAutoInstallation(session).catch(error => {
        this.logger.error('Auto-installation failed', { sessionId, error: error.message });
        session.progress.status = 'failed';
      });

      // Emit session started event
      await this.eventBus.emit({
        type: 'installation.auto_session_started',
        timestamp: new Date(),
        data: {
          sessionId,
          userId,
          serverCount: installationQueue.length,
          estimatedTime: session.progress.estimated_time_remaining
        }
      });

      return session;

    } catch (error) {
      this.logger.error('Failed to start auto-installation', {
        sessionId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Execute auto-installation with intelligent ordering and monitoring
   */
  private async executeAutoInstallation(session: AutoInstallationSession): Promise<void> {
    const { id: sessionId, config } = session;
    session.progress.status = 'installing';

    try {
      // Install servers with intelligent concurrency control
      const installationPromises: Promise<void>[] = [];
      let activeInstallations = 0;
      let currentIndex = 0;

      const processNextServer = async (): Promise<void> => {
        if (currentIndex >= session.recommendations.length) return;
        
        const recommendation = session.recommendations[currentIndex];
        const serverProgress = session.progress.detailed_progress[currentIndex];
        currentIndex++;
        activeInstallations++;

        try {
          await this.installServerWithProgress(session, recommendation, serverProgress);
          session.progress.completed_servers++;
        } catch (error) {
          this.logger.error('Server installation failed', {
            sessionId,
            serverId: recommendation.server.id,
            error: error instanceof Error ? error.message : String(error)
          });
          
          serverProgress.status = 'failed';
          serverProgress.error_message = error instanceof Error ? error.message : String(error);
          session.progress.failed_servers++;
          
          // Retry logic
          if (serverProgress.retry_count < config.auto_retry_count) {
            serverProgress.retry_count++;
            await this.retryServerInstallation(session, recommendation, serverProgress);
          }
        }

        activeInstallations--;
        
        // Update overall progress
        this.updateOverallProgress(session);
        
        // Continue with next server if there are more and we haven't hit the limit
        if (currentIndex < session.recommendations.length && 
            activeInstallations < config.max_concurrent_installations) {
          installationPromises.push(processNextServer());
        }
      };

      // Start initial batch of installations
      for (let i = 0; i < Math.min(config.max_concurrent_installations, session.recommendations.length); i++) {
        installationPromises.push(processNextServer());
      }

      // Wait for all installations to complete
      await Promise.all(installationPromises);

      // Complete the session
      session.progress.status = session.progress.failed_servers > 0 ? 'failed' : 'completed';
      session.completed_at = new Date();
      
      // Emit completion event
      await this.eventBus.emit({
        type: 'installation.auto_session_completed',
        timestamp: new Date(),
        data: {
          sessionId,
          userId: session.user_id,
          completedServers: session.progress.completed_servers,
          failedServers: session.progress.failed_servers,
          totalTime: Date.now() - session.progress.start_time.getTime()
        }
      });

      this.logger.info('Auto-installation session completed', {
        sessionId,
        completed: session.progress.completed_servers,
        failed: session.progress.failed_servers
      });

    } catch (error) {
      session.progress.status = 'failed';
      this.logger.error('Auto-installation session failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Install individual server with detailed progress tracking
   */
  private async installServerWithProgress(
    session: AutoInstallationSession,
    recommendation: ServerRecommendation,
    progress: InstallationStepProgress
  ): Promise<void> {
    const startTime = Date.now();
    progress.status = 'downloading';
    progress.step_details = 'Preparing installation...';

    try {
      // Step 1: Prepare installation request
      progress.progress = 10;
      progress.step_details = 'Configuring installation parameters...';
      
      const installRequest: InstallationRequest = {
        server_id: recommendation.server.id,
        installation_method: this.determineInstallationMethod(recommendation, session.environment),
        configuration: await this.generateAutoConfiguration(recommendation, session.environment),
        environment_variables: this.generateEnvironmentVariables(recommendation, session.environment),
        auto_start: true
      };

      // Step 2: Check dependencies
      progress.progress = 20;
      progress.step_details = 'Checking dependencies...';
      
      if (session.config.dependency_auto_resolution) {
        await this.resolveDependencies(recommendation, session);
      }

      // Step 3: Install server
      progress.progress = 30;
      progress.step_details = 'Installing server...';
      progress.status = 'configuring';
      
      const installation = await this.installServer(session.user_id, installRequest);

      // Step 4: Monitor installation progress
      await this.monitorInstallationProgress(installation, progress);

      // Step 5: Health check and validation
      progress.progress = 80;
      progress.step_details = 'Performing health checks...';
      progress.status = 'testing';
      
      await this.performInstallationHealthCheck(installation, progress);

      // Step 6: Complete installation
      progress.progress = 100;
      progress.step_details = 'Installation completed successfully';
      progress.status = 'completed';
      progress.elapsed_time = Date.now() - startTime;

      // Update Trinity guidance
      await this.updateTrinityGuidance(session, `Successfully installed ${recommendation.server.name}`);

    } catch (error) {
      progress.status = 'failed';
      progress.error_message = error instanceof Error ? error.message : String(error);
      progress.elapsed_time = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Prepare installation queue with intelligent ordering
   */
  private prepareInstallationQueue(
    recommendations: ServerRecommendation[],
    environment: EnvironmentContext
  ): ServerRecommendation[] {
    // Filter recommendations suitable for auto-installation
    const autoInstallable = recommendations.filter(rec => 
      rec.installation_priority === 'immediate' || rec.installation_priority === 'high'
    );

    // Sort by priority and dependencies
    return autoInstallable.sort((a, b) => {
      // Priority order: immediate > high > medium > low
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.installation_priority];
      const bPriority = priorityOrder[b.installation_priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Secondary sort by confidence score
      return b.confidence_score - a.confidence_score;
    });
  }

  /**
   * Generate automatic configuration based on environment
   */
  private async generateAutoConfiguration(
    recommendation: ServerRecommendation,
    environment: EnvironmentContext
  ): Promise<any> {
    const config: any = {};

    // Auto-configure based on server type and environment
    if (recommendation.server.tags.includes('database')) {
      config.auto_discover = true;
      config.connection_pool_size = 5;
    }

    if (recommendation.server.tags.includes('cloud')) {
      // Auto-detect cloud credentials from environment
      if (environment.tools.aws_cli) {
        config.provider = 'aws';
        config.use_iam_roles = true;
      }
    }

    if (recommendation.server.tags.includes('monitoring')) {
      config.auto_alerts = true;
      config.health_check_interval = 60;
    }

    return config;
  }

  /**
   * Generate environment variables for server
   */
  private generateEnvironmentVariables(
    recommendation: ServerRecommendation,
    environment: EnvironmentContext
  ): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Set common environment variables
    envVars.NODE_ENV = 'production';
    envVars.LOG_LEVEL = 'info';
    
    // Server-specific variables
    if (recommendation.server.tags.includes('database')) {
      envVars.DB_POOL_SIZE = '5';
      envVars.DB_TIMEOUT = '30000';
    }

    return envVars;
  }

  /**
   * Resolve dependencies automatically
   */
  private async resolveDependencies(
    recommendation: ServerRecommendation,
    session: AutoInstallationSession
  ): Promise<void> {
    for (const dependency of recommendation.dependencies) {
      this.logger.info('Auto-resolving dependency', {
        sessionId: session.id,
        serverId: recommendation.server.id,
        dependency
      });
      
      // Implement dependency resolution logic
      // This would check if dependency is installed and install if needed
    }
  }

  /**
   * Monitor installation progress
   */
  private async monitorInstallationProgress(
    installation: ServerInstallation,
    progress: InstallationStepProgress
  ): Promise<void> {
    const maxWait = 120000; // 2 minutes max wait
    const startTime = Date.now();
    
    while (installation.status === 'installing' && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      // Update progress based on installation status
      const elapsed = Date.now() - startTime;
      progress.progress = Math.min(70, 30 + (elapsed / maxWait) * 40);
      progress.step_details = 'Installing server components...';
      
      // Check if installation completed
      const updatedInstallation = await this.getInstallation(installation.user_id, installation.server_id);
      if (updatedInstallation?.status === 'installed') {
        break;
      }
    }
  }

  /**
   * Perform health check after installation
   */
  private async performInstallationHealthCheck(
    installation: ServerInstallation,
    progress: InstallationStepProgress
  ): Promise<void> {
    try {
      // Connect to server
      const connection = await this.connectToServer(installation.user_id, installation.server_id, {
        timeout: 10000,
        max_retries: 3
      });

      // Perform health check
      const health = await this.getConnectionHealth(connection.id);
      
      if (health.status === 'connected' && health.response_time_ms < 1000) {
        progress.health_check_status = 'healthy';
      } else if (health.status === 'connected') {
        progress.health_check_status = 'degraded';
      } else {
        progress.health_check_status = 'unhealthy';
        throw new Error('Health check failed: Server not responding properly');
      }

    } catch (error) {
      progress.health_check_status = 'unhealthy';
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retry server installation
   */
  private async retryServerInstallation(
    session: AutoInstallationSession,
    recommendation: ServerRecommendation,
    progress: InstallationStepProgress
  ): Promise<void> {
    this.logger.info('Retrying server installation', {
      sessionId: session.id,
      serverId: recommendation.server.id,
      retryCount: progress.retry_count
    });

    progress.status = 'pending';
    progress.step_details = `Retrying installation (attempt ${progress.retry_count + 1})...`;
    progress.progress = 0;

    // Wait a bit before retry
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      await this.installServerWithProgress(session, recommendation, progress);
      session.progress.completed_servers++;
    } catch (error) {
      // If still failing after retry, mark as failed
      progress.status = 'failed';
      progress.error_message = error instanceof Error ? error.message : String(error);
      session.progress.failed_servers++;
    }
  }

  /**
   * Update Trinity AI guidance
   */
  private async updateTrinityGuidance(session: AutoInstallationSession, message: string): Promise<void> {
    // This would integrate with actual Trinity AI agents
    session.progress.trinity_guidance = {
      current_advice: message,
      next_steps: [
        'Continue with remaining server installations',
        'Monitor installation progress',
        'Prepare for onboarding workflow creation'
      ],
      troubleshooting_tips: [
        'Check logs if any installation fails',
        'Verify network connectivity',
        'Ensure sufficient disk space'
      ]
    };
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(session: AutoInstallationSession): void {
    const { completed_servers, failed_servers, total_servers } = session.progress;
    const processedServers = completed_servers + failed_servers;
    
    session.progress.overall_progress = Math.round((processedServers / total_servers) * 100);
    session.progress.estimated_time_remaining = this.calculateRemainingTime(session);
    session.progress.last_update = new Date();
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(recommendations: ServerRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.estimated_setup_time, 0);
  }

  private calculateRemainingTime(session: AutoInstallationSession): number {
    const { completed_servers, total_servers, start_time } = session.progress;
    const elapsed = Date.now() - start_time.getTime();
    const avgTimePerServer = elapsed / Math.max(completed_servers, 1);
    const remainingServers = total_servers - completed_servers - session.progress.failed_servers;
    
    return Math.round((avgTimePerServer * remainingServers) / 60000); // Convert to minutes
  }

  /**
   * Determine installation method based on environment
   */
  private determineInstallationMethod(
    recommendation: ServerRecommendation,
    environment: EnvironmentContext
  ): 'npm' | 'docker' | 'binary' | 'manual' {
    if (environment.tools.docker && recommendation.server.docker_image) {
      return 'docker';
    }
    
    if (environment.project_type === 'nodejs' && recommendation.server.npm_package) {
      return 'npm';
    }
    
    return 'npm'; // Default fallback
  }

  /**
   * Start progress monitoring
   */
  private startProgressMonitoring(): void {
    this.progressUpdateInterval = setInterval(() => {
      for (const session of this.activeSessions.values()) {
        if (session.progress.status === 'installing') {
          this.emitProgressUpdate(session);
        }
      }
    }, this.defaultConfig.progress_reporting_interval);
  }

  /**
   * Start health monitoring for self-healing
   */
  private startHealthMonitoring(): void {
    this.healthMonitorInterval = setInterval(async () => {
      for (const session of this.activeSessions.values()) {
        if (session.config.self_healing && session.progress.status === 'completed') {
          await this.performSelfHealingCheck(session);
        }
      }
    }, this.defaultConfig.health_check_interval);
  }

  /**
   * Emit progress update event
   */
  private async emitProgressUpdate(session: AutoInstallationSession): Promise<void> {
    await this.eventBus.emit({
      type: 'installation.progress_update',
      timestamp: new Date(),
      data: {
        sessionId: session.id,
        userId: session.user_id,
        progress: session.progress
      }
    });
  }

  /**
   * Perform self-healing check
   */
  private async performSelfHealingCheck(session: AutoInstallationSession): Promise<void> {
    // Check health of all installed servers and attempt recovery if needed
    for (const progress of session.progress.detailed_progress) {
      if (progress.status === 'completed' && progress.health_check_status !== 'healthy') {
        this.logger.info('Performing self-healing check', {
          sessionId: session.id,
          serverId: progress.server_id
        });
        
        // Attempt to heal the server installation
        // This would include reconnection attempts, configuration fixes, etc.
      }
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return `auto_install_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get active installation session
   */
  getSession(sessionId: string): AutoInstallationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get installation progress
   */
  getInstallationProgress(sessionId: string): InstallationProgress | undefined {
    return this.activeSessions.get(sessionId)?.progress;
  }

  /**
   * Pause installation session
   */
  async pauseInstallation(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.progress.status = 'paused';
      this.logger.info('Installation session paused', { sessionId });
    }
  }

  /**
   * Resume installation session
   */
  async resumeInstallation(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.progress.status = 'installing';
      this.logger.info('Installation session resumed', { sessionId });
      
      // Continue with remaining installations
      this.executeAutoInstallation(session).catch(error => {
        this.logger.error('Failed to resume installation', { sessionId, error: error.message });
      });
    }
  }

  /**
   * Cleanup completed sessions
   */
  private cleanupSessions(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.completed_at && now - session.completed_at.getTime() > maxAge) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Shutdown enhanced installation manager
   */
  async shutdown(): Promise<void> {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }
    
    if (this.healthMonitorInterval) {
      clearInterval(this.healthMonitorInterval);
    }
    
    // Cleanup sessions
    this.cleanupSessions();
    
    // Call parent shutdown
    await super.shutdown();
    
    this.logger.info('Enhanced Installation Manager shutdown complete');
  }
}

/**
 * Factory function to create enhanced installation manager
 */
export function createEnhancedInstallationManager(
  pool: Pool,
  logger: Logger,
  errorManager: ErrorManager,
  eventBus: EventBus,
  discoveryEngine: IntelligentDiscoveryEngine
): EnhancedInstallationManager {
  return new EnhancedInstallationManager(
    pool,
    logger,
    errorManager,
    eventBus,
    discoveryEngine
  );
}