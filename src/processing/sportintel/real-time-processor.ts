/**
 * SportIntel Real-Time Data Processing Pipeline
 * 
 * High-performance event processing pipeline built on OpenConductor's EventBus
 * designed to achieve sub-200ms response times for critical sports events.
 * 
 * Key Features:
 * - Sub-200ms event processing for live games
 * - Intelligent event prioritization and routing
 * - Parallel processing with backpressure control
 * - Integration with Trinity AI agents for real-time predictions
 * - Bloomberg Terminal-style real-time updates
 */

import { EventBus, Event } from '../../types/events';
import { Logger } from '../../utils/logger';
import { SportsOracleAgent } from '../../agents/sportintel/sports-oracle-agent';
import { SportsSentinelAgent } from '../../agents/sportintel/sports-sentinel-agent';
import { SportsDataManager } from '../../storage/sportintel/sports-data-manager';

export interface RealTimeProcessorConfig {
  enabled: boolean;
  performance: {
    targetLatencyMs: number;
    maxConcurrentEvents: number;
    processingTimeoutMs: number;
    batchProcessingEnabled: boolean;
    batchSize: number;
    batchTimeoutMs: number;
  };
  eventPriorities: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  processing: {
    enableMetrics: boolean;
    enableProfiling: boolean;
    circuitBreakerEnabled: boolean;
    retryAttempts: number;
    backpressureThreshold: number;
  };
  streaming: {
    bufferSize: number;
    flushIntervalMs: number;
    enableCompression: boolean;
  };
}

export interface ProcessingMetrics {
  totalEvents: number;
  avgLatency: number;
  successRate: number;
  errorCount: number;
  throughputPerSecond: number;
  backpressureEvents: number;
  circuitBreakerTrips: number;
}

export interface EventProcessingContext {
  eventId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  receivedAt: Date;
  deadline: Date;
  retryCount: number;
  processingStage: string;
  metadata: Record<string, any>;
}

export class RealTimeProcessor {
  private eventBus: EventBus;
  private logger: Logger;
  private config: RealTimeProcessorConfig;
  private sportsOracle: SportsOracleAgent;
  private sportsSentinel: SportsSentinelAgent;
  private dataManager: SportsDataManager;

  // Processing state
  private isProcessing = false;
  private activeEvents = new Map<string, EventProcessingContext>();
  private processingQueue = new Map<string, Event[]>();
  private metrics: ProcessingMetrics;
  private circuitBreakerOpen = false;

  // Performance monitoring
  private latencyBuffer: number[] = [];
  private throughputCounter = 0;
  private lastThroughputReset = Date.now();

  constructor(
    config: RealTimeProcessorConfig,
    eventBus: EventBus,
    logger: Logger,
    agents: {
      sportsOracle: SportsOracleAgent;
      sportsSentinel: SportsSentinelAgent;
      dataManager: SportsDataManager;
    }
  ) {
    this.config = config;
    this.eventBus = eventBus;
    this.logger = logger;
    this.sportsOracle = agents.sportsOracle;
    this.sportsSentinel = agents.sportsSentinel;
    this.dataManager = agents.dataManager;

    this.metrics = {
      totalEvents: 0,
      avgLatency: 0,
      successRate: 0,
      errorCount: 0,
      throughputPerSecond: 0,
      backpressureEvents: 0,
      circuitBreakerTrips: 0
    };

    // Initialize processing queues
    this.initializeProcessingQueues();
  }

  /**
   * Start the real-time processing pipeline
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('Real-time processor disabled');
      return;
    }

    this.logger.info('Starting SportIntel real-time processor...');

    try {
      // Subscribe to all sports-related events
      await this.setupEventSubscriptions();

      // Start processing loops
      this.startProcessingLoops();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isProcessing = true;

      // Emit startup event
      await this.eventBus.emit({
        type: 'realtime.processor.started',
        timestamp: new Date(),
        data: {
          targetLatency: this.config.performance.targetLatencyMs,
          maxConcurrent: this.config.performance.maxConcurrentEvents,
          batchProcessing: this.config.performance.batchProcessingEnabled
        }
      });

      this.logger.info('SportIntel real-time processor started successfully', {
        targetLatency: this.config.performance.targetLatencyMs,
        maxConcurrent: this.config.performance.maxConcurrentEvents
      });

    } catch (error) {
      this.logger.error('Failed to start real-time processor', error);
      throw error;
    }
  }

  /**
   * Stop the real-time processing pipeline
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping SportIntel real-time processor...');

    this.isProcessing = false;

    // Wait for active events to complete (with timeout)
    await this.drainActiveEvents();

    // Clear queues
    this.processingQueue.clear();
    this.activeEvents.clear();

    this.logger.info('SportIntel real-time processor stopped');
  }

  /**
   * Set up event subscriptions for real-time processing
   */
  private async setupEventSubscriptions(): Promise<void> {
    // Critical events - must be processed within 50ms
    await this.eventBus.subscribe(
      this.config.eventPriorities.critical,
      async (event) => await this.processEventWithPriority(event, 'critical'),
      { realTime: true }
    );

    // High priority events - must be processed within 100ms
    await this.eventBus.subscribe(
      this.config.eventPriorities.high,
      async (event) => await this.processEventWithPriority(event, 'high'),
      { realTime: true }
    );

    // Medium priority events - must be processed within 200ms
    await this.eventBus.subscribe(
      this.config.eventPriorities.medium,
      async (event) => await this.processEventWithPriority(event, 'medium')
    );

    // Low priority events - can be processed within 500ms
    await this.eventBus.subscribe(
      this.config.eventPriorities.low,
      async (event) => await this.processEventWithPriority(event, 'low')
    );

    this.logger.info('Event subscriptions configured for real-time processing');
  }

  /**
   * Process event with specific priority handling
   */
  private async processEventWithPriority(
    event: Event, 
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<void> {
    const startTime = Date.now();
    const eventId = this.generateEventId();
    
    // Check circuit breaker
    if (this.circuitBreakerOpen) {
      this.logger.warn('Circuit breaker open, dropping event', { eventId, type: event.type });
      return;
    }

    // Check backpressure
    if (this.activeEvents.size >= this.config.performance.maxConcurrentEvents) {
      this.metrics.backpressureEvents++;
      
      if (priority === 'critical' || priority === 'high') {
        // For critical/high events, force processing by dropping lower priority events
        this.dropLowerPriorityEvents(priority);
      } else {
        this.logger.warn('Backpressure detected, dropping event', { eventId, priority });
        return;
      }
    }

    // Create processing context
    const context: EventProcessingContext = {
      eventId,
      priority,
      receivedAt: new Date(startTime),
      deadline: new Date(startTime + this.getDeadlineForPriority(priority)),
      retryCount: 0,
      processingStage: 'queued',
      metadata: {
        originalEvent: event,
        startTime
      }
    };

    this.activeEvents.set(eventId, context);

    try {
      // Add to priority queue for batch processing if enabled
      if (this.config.performance.batchProcessingEnabled && priority !== 'critical') {
        this.addToBatchQueue(priority, event);
      } else {
        // Process immediately for critical events
        await this.processEventImmediately(event, context);
      }

    } catch (error) {
      this.handleProcessingError(event, context, error);
    }
  }

  /**
   * Process event immediately (for critical/real-time events)
   */
  private async processEventImmediately(event: Event, context: EventProcessingContext): Promise<void> {
    context.processingStage = 'processing';
    
    const processors = this.getEventProcessors(event.type);
    const processingPromises = processors.map(processor => 
      this.executeProcessor(processor, event, context)
    );

    // Execute all processors concurrently
    const results = await Promise.allSettled(processingPromises);
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn('Some event processors failed', {
        eventId: context.eventId,
        failures: failures.length,
        total: processors.length
      });
    }

    // Update metrics
    this.updateProcessingMetrics(context, failures.length === 0);

    // Clean up
    this.activeEvents.delete(context.eventId);
    context.processingStage = 'completed';
  }

  /**
   * Get event processors based on event type
   */
  private getEventProcessors(eventType: string): Array<(event: Event, context: EventProcessingContext) => Promise<void>> {
    const processors: Array<(event: Event, context: EventProcessingContext) => Promise<void>> = [];

    // Core event processors
    switch (eventType) {
      case 'game.play':
        processors.push(
          this.processGamePlay.bind(this),
          this.updateRealTimePredictions.bind(this),
          this.checkGameAlerts.bind(this),
          this.updateMarketData.bind(this)
        );
        break;

      case 'injury.reported':
      case 'injury.updated':
        processors.push(
          this.processInjuryUpdate.bind(this),
          this.analyzeInjuryImpact.bind(this),
          this.triggerInjuryAlerts.bind(this),
          this.updatePlayerProjections.bind(this)
        );
        break;

      case 'lineup.changed':
        processors.push(
          this.processLineupChange.bind(this),
          this.recalculateOwnership.bind(this),
          this.updateLineupAlerts.bind(this),
          this.refreshOptimalLineups.bind(this)
        );
        break;

      case 'line.moved':
        processors.push(
          this.processLineMovement.bind(this),
          this.analyzeMarketEfficiency.bind(this),
          this.updateBettingAlerts.bind(this),
          this.correlateWithNews.bind(this)
        );
        break;

      case 'ownership.changed':
        processors.push(
          this.processOwnershipChange.bind(this),
          this.updateValuePlays.bind(this),
          this.recalculateLineupOptimization.bind(this),
          this.triggerOwnershipAlerts.bind(this)
        );
        break;

      default:
        // Generic processors for all events
        processors.push(
          this.logEventProcessing.bind(this),
          this.updateEventMetrics.bind(this)
        );
    }

    return processors;
  }

  /**
   * Execute individual processor with timeout and error handling
   */
  private async executeProcessor(
    processor: (event: Event, context: EventProcessingContext) => Promise<void>,
    event: Event,
    context: EventProcessingContext
  ): Promise<void> {
    const processorTimeout = this.config.performance.processingTimeoutMs;
    
    return Promise.race([
      processor(event, context),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processor timeout')), processorTimeout);
      })
    ]);
  }

  // Event processors
  private async processGamePlay(event: Event, context: EventProcessingContext): Promise<void> {
    const playData = event.data;
    
    // Store play data in TimescaleDB for real-time queries
    await this.dataManager.insertData({
      table: 'game_plays',
      data: {
        game_id: playData.gameId,
        play_id: playData.playId,
        timestamp: new Date(),
        play_type: playData.type,
        yards: playData.yards,
        down: playData.down,
        distance: playData.distance,
        players_involved: playData.players,
        score_change: playData.scoreChange
      }
    });

    // Emit processed event for real-time subscribers
    await this.eventBus.emit({
      type: 'game.play.processed',
      timestamp: new Date(),
      data: {
        ...playData,
        processingTime: Date.now() - context.metadata.startTime,
        context: context.eventId
      }
    });
  }

  private async updateRealTimePredictions(event: Event, context: EventProcessingContext): Promise<void> {
    const playData = event.data;
    
    // Get affected players from the play
    const affectedPlayers = playData.players || [];
    
    for (const playerId of affectedPlayers) {
      try {
        // Update player predictions in real-time using SportsOracleAgent
        const updatedPrediction = await this.sportsOracle.updatePlayerPrediction(
          playerId,
          {
            latestPlay: playData,
            gameContext: {
              gameId: playData.gameId,
              gameTime: playData.gameTime,
              score: playData.currentScore
            }
          },
          { realTime: true, maxLatencyMs: 50 }
        );

        // Emit prediction update for real-time subscribers
        await this.eventBus.emit({
          type: 'prediction.updated',
          timestamp: new Date(),
          data: {
            playerId,
            prediction: updatedPrediction,
            trigger: 'game_play',
            confidence: updatedPrediction.confidence,
            latency: Date.now() - context.metadata.startTime
          }
        });

      } catch (error) {
        this.logger.error('Failed to update real-time prediction', { playerId, error });
      }
    }
  }

  private async checkGameAlerts(event: Event, context: EventProcessingContext): Promise<void> {
    const playData = event.data;

    // Check for significant events that should trigger alerts
    const alertTriggers = [];

    // Check for scoring plays
    if (playData.scoreChange && Math.abs(playData.scoreChange) >= 3) {
      alertTriggers.push({
        type: 'scoring_play',
        severity: playData.scoreChange >= 6 ? 'high' : 'medium',
        message: `Scoring play: ${playData.scoreChange} points`
      });
    }

    // Check for turnovers
    if (playData.type === 'turnover') {
      alertTriggers.push({
        type: 'turnover',
        severity: 'high',
        message: `Turnover: ${playData.turnoverType}`
      });
    }

    // Check for injuries during play
    if (playData.injury) {
      alertTriggers.push({
        type: 'injury_during_play',
        severity: 'critical',
        message: `Player injured during play: ${playData.injury.playerName}`
      });
    }

    // Send alerts through SportsSentinelAgent
    for (const trigger of alertTriggers) {
      await this.sportsSentinel.processRealTimeAlert({
        type: trigger.type,
        severity: trigger.severity,
        message: trigger.message,
        gameId: playData.gameId,
        timestamp: new Date(),
        processingLatency: Date.now() - context.metadata.startTime
      });
    }
  }

  private async updateMarketData(event: Event, context: EventProcessingContext): Promise<void> {
    const playData = event.data;

    // Update live market data based on game events
    await this.dataManager.insertData({
      table: 'market_updates',
      data: {
        game_id: playData.gameId,
        timestamp: new Date(),
        event_type: 'game_play',
        impact_score: this.calculateMarketImpact(playData),
        affected_players: playData.players,
        processing_time: Date.now() - context.metadata.startTime
      }
    });

    // Emit market update event
    await this.eventBus.emit({
      type: 'market.updated',
      timestamp: new Date(),
      data: {
        gameId: playData.gameId,
        trigger: 'game_play',
        impactScore: this.calculateMarketImpact(playData),
        latency: Date.now() - context.metadata.startTime
      }
    });
  }

  // Additional processor implementations...
  private async processInjuryUpdate(event: Event, context: EventProcessingContext): Promise<void> {
    // Implementation for injury processing
  }

  private async analyzeInjuryImpact(event: Event, context: EventProcessingContext): Promise<void> {
    // Implementation for injury impact analysis
  }

  private async processLineupChange(event: Event, context: EventProcessingContext): Promise<void> {
    // Implementation for lineup change processing
  }

  private async processLineMovement(event: Event, context: EventProcessingContext): Promise<void> {
    // Implementation for line movement processing
  }

  private async processOwnershipChange(event: Event, context: EventProcessingContext): Promise<void> {
    // Implementation for ownership change processing
  }

  // Utility methods
  private getDeadlineForPriority(priority: string): number {
    const deadlines = {
      critical: 50,   // 50ms for critical events
      high: 100,      // 100ms for high priority
      medium: 200,    // 200ms for medium priority
      low: 500        // 500ms for low priority
    };
    return deadlines[priority as keyof typeof deadlines] || 200;
  }

  private dropLowerPriorityEvents(currentPriority: string): void {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorities.indexOf(currentPriority);
    
    for (const [eventId, context] of this.activeEvents) {
      const contextIndex = priorities.indexOf(context.priority);
      if (contextIndex < currentIndex) {
        this.activeEvents.delete(eventId);
        this.logger.debug('Dropped lower priority event for backpressure relief', {
          droppedEventId: eventId,
          droppedPriority: context.priority,
          currentPriority
        });
        break; // Only drop one event per call
      }
    }
  }

  private addToBatchQueue(priority: string, event: Event): void {
    if (!this.processingQueue.has(priority)) {
      this.processingQueue.set(priority, []);
    }
    this.processingQueue.get(priority)!.push(event);
  }

  private initializeProcessingQueues(): void {
    this.processingQueue.set('critical', []);
    this.processingQueue.set('high', []);
    this.processingQueue.set('medium', []);
    this.processingQueue.set('low', []);
  }

  private startProcessingLoops(): void {
    // Start batch processing loop for non-critical events
    if (this.config.performance.batchProcessingEnabled) {
      setInterval(() => {
        if (this.isProcessing) {
          this.processBatchQueues();
        }
      }, this.config.performance.batchTimeoutMs);
    }
  }

  private async processBatchQueues(): Promise<void> {
    for (const [priority, events] of this.processingQueue) {
      if (events.length >= this.config.performance.batchSize || 
          events.length > 0) {
        
        const batch = events.splice(0, this.config.performance.batchSize);
        if (batch.length > 0) {
          await this.processBatch(priority, batch);
        }
      }
    }
  }

  private async processBatch(priority: string, events: Event[]): Promise<void> {
    this.logger.debug('Processing event batch', { priority, count: events.length });

    const batchPromises = events.map(event => {
      const context: EventProcessingContext = {
        eventId: this.generateEventId(),
        priority: priority as any,
        receivedAt: new Date(),
        deadline: new Date(Date.now() + this.getDeadlineForPriority(priority)),
        retryCount: 0,
        processingStage: 'batch',
        metadata: { startTime: Date.now() }
      };

      return this.processEventImmediately(event, context);
    });

    await Promise.allSettled(batchPromises);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateThroughputMetrics();
      this.checkCircuitBreaker();
      this.emitPerformanceMetrics();
    }, 1000); // Update metrics every second
  }

  private updateThroughputMetrics(): void {
    const now = Date.now();
    const elapsed = (now - this.lastThroughputReset) / 1000;
    
    if (elapsed >= 1) {
      this.metrics.throughputPerSecond = this.throughputCounter / elapsed;
      this.throughputCounter = 0;
      this.lastThroughputReset = now;
    }
  }

  private checkCircuitBreaker(): void {
    if (!this.config.processing.circuitBreakerEnabled) return;

    const errorRate = this.metrics.errorCount / Math.max(this.metrics.totalEvents, 1);
    const avgLatency = this.metrics.avgLatency;

    // Open circuit breaker if error rate > 10% or avg latency > 500ms
    if ((errorRate > 0.1 || avgLatency > 500) && !this.circuitBreakerOpen) {
      this.circuitBreakerOpen = true;
      this.metrics.circuitBreakerTrips++;
      this.logger.error('Circuit breaker opened', { errorRate, avgLatency });

      // Auto-reset after 30 seconds
      setTimeout(() => {
        this.circuitBreakerOpen = false;
        this.logger.info('Circuit breaker reset');
      }, 30000);
    }
  }

  private async emitPerformanceMetrics(): Promise<void> {
    await this.eventBus.emit({
      type: 'realtime.processor.metrics',
      timestamp: new Date(),
      data: {
        ...this.metrics,
        activeEvents: this.activeEvents.size,
        queuedEvents: Array.from(this.processingQueue.values())
          .reduce((sum, queue) => sum + queue.length, 0),
        circuitBreakerOpen: this.circuitBreakerOpen
      }
    });
  }

  private updateProcessingMetrics(context: EventProcessingContext, success: boolean): void {
    const latency = Date.now() - context.metadata.startTime;
    
    this.metrics.totalEvents++;
    this.throughputCounter++;
    
    if (success) {
      // Update average latency using exponential moving average
      this.metrics.avgLatency = this.metrics.avgLatency * 0.9 + latency * 0.1;
    } else {
      this.metrics.errorCount++;
    }
    
    this.metrics.successRate = (this.metrics.totalEvents - this.metrics.errorCount) / this.metrics.totalEvents;
    
    // Track latency distribution
    this.latencyBuffer.push(latency);
    if (this.latencyBuffer.length > 1000) {
      this.latencyBuffer.shift();
    }
  }

  private handleProcessingError(event: Event, context: EventProcessingContext, error: any): void {
    this.logger.error('Event processing failed', {
      eventId: context.eventId,
      eventType: event.type,
      priority: context.priority,
      retryCount: context.retryCount,
      error: error instanceof Error ? error.message : String(error)
    });

    // Retry logic
    if (context.retryCount < this.config.processing.retryAttempts && 
        Date.now() < context.deadline.getTime()) {
      context.retryCount++;
      context.processingStage = 'retrying';
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, context.retryCount), 5000);
      setTimeout(() => {
        this.processEventImmediately(event, context).catch(err => {
          this.handleProcessingError(event, context, err);
        });
      }, delay);
    } else {
      // Give up and clean up
      this.activeEvents.delete(context.eventId);
      this.updateProcessingMetrics(context, false);
    }
  }

  private async drainActiveEvents(): Promise<void> {
    const timeout = 5000; // 5 second timeout
    const start = Date.now();
    
    while (this.activeEvents.size > 0 && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.activeEvents.size > 0) {
      this.logger.warn('Some events did not complete during shutdown', {
        remainingEvents: this.activeEvents.size
      });
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateMarketImpact(playData: any): number {
    // Simplified impact calculation
    let impact = 0;
    
    if (playData.scoreChange) impact += Math.abs(playData.scoreChange) * 0.1;
    if (playData.type === 'turnover') impact += 0.3;
    if (playData.type === 'touchdown') impact += 0.5;
    if (playData.yards > 20) impact += 0.2;
    
    return Math.min(impact, 1.0); // Cap at 1.0
  }

  // Additional stub methods for processors
  private async triggerInjuryAlerts(event: Event, context: EventProcessingContext): Promise<void> {}
  private async updatePlayerProjections(event: Event, context: EventProcessingContext): Promise<void> {}
  private async recalculateOwnership(event: Event, context: EventProcessingContext): Promise<void> {}
  private async updateLineupAlerts(event: Event, context: EventProcessingContext): Promise<void> {}
  private async refreshOptimalLineups(event: Event, context: EventProcessingContext): Promise<void> {}
  private async analyzeMarketEfficiency(event: Event, context: EventProcessingContext): Promise<void> {}
  private async updateBettingAlerts(event: Event, context: EventProcessingContext): Promise<void> {}
  private async correlateWithNews(event: Event, context: EventProcessingContext): Promise<void> {}
  private async updateValuePlays(event: Event, context: EventProcessingContext): Promise<void> {}
  private async recalculateLineupOptimization(event: Event, context: EventProcessingContext): Promise<void> {}
  private async triggerOwnershipAlerts(event: Event, context: EventProcessingContext): Promise<void> {}
  private async logEventProcessing(event: Event, context: EventProcessingContext): Promise<void> {}
  private async updateEventMetrics(event: Event, context: EventProcessingContext): Promise<void> {}

  // Public API methods
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  getActiveEventCount(): number {
    return this.activeEvents.size;
  }

  isHealthy(): boolean {
    return !this.circuitBreakerOpen && 
           this.metrics.avgLatency <= this.config.performance.targetLatencyMs &&
           this.metrics.successRate >= 0.95;
  }
}

// Factory function and default configuration
export function createRealTimeProcessor(
  config: RealTimeProcessorConfig,
  eventBus: EventBus,
  logger: Logger,
  agents: {
    sportsOracle: SportsOracleAgent;
    sportsSentinel: SportsSentinelAgent;
    dataManager: SportsDataManager;
  }
): RealTimeProcessor {
  return new RealTimeProcessor(config, eventBus, logger, agents);
}

export const defaultRealTimeConfig: RealTimeProcessorConfig = {
  enabled: true,
  performance: {
    targetLatencyMs: 200,
    maxConcurrentEvents: 100,
    processingTimeoutMs: 5000,
    batchProcessingEnabled: true,
    batchSize: 10,
    batchTimeoutMs: 100
  },
  eventPriorities: {
    critical: ['game.play', 'injury.reported', 'lineup.emergency'],
    high: ['injury.updated', 'lineup.changed', 'weather.severe'],
    medium: ['line.moved', 'ownership.changed', 'news.breaking'],
    low: ['stats.updated', 'analysis.completed', 'report.generated']
  },
  processing: {
    enableMetrics: true,
    enableProfiling: true,
    circuitBreakerEnabled: true,
    retryAttempts: 3,
    backpressureThreshold: 80
  },
  streaming: {
    bufferSize: 1000,
    flushIntervalMs: 1000,
    enableCompression: true
  }
};