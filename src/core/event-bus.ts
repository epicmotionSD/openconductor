/**
 * EventBus Implementation
 * 
 * Event-driven messaging system for OpenConductor
 */

import { 
  EventBus, 
  Event, 
  EventHandler, 
  EventFilter,
  EventSubscription,
  EventType 
} from '../types/events';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';

export class EventBusImpl implements EventBus {
  private subscribers: Map<string, EventSubscription[]> = new Map();
  private globalSubscribers: EventSubscription[] = [];
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;
  private logger: Logger;
  private errorManager: ErrorManager;

  constructor(logger: Logger, errorManager: ErrorManager) {
    this.logger = logger;
    this.errorManager = errorManager;
  }

  /**
   * Subscribe to specific event types
   */
  async subscribe(
    eventTypes: EventType | EventType[], 
    handler: EventHandler,
    filter?: EventFilter
  ): Promise<EventSubscription> {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      eventTypes: types,
      handler,
      filter,
      createdAt: new Date(),
      active: true
    };

    // Add to type-specific subscribers
    for (const type of types) {
      if (!this.subscribers.has(type)) {
        this.subscribers.set(type, []);
      }
      this.subscribers.get(type)!.push(subscription);
    }

    this.logger.debug(`Event subscription created`, {
      subscriptionId: subscription.id,
      eventTypes: types
    });

    return subscription;
  }

  /**
   * Subscribe to all events
   */
  async subscribeToAll(
    handler: EventHandler, 
    filter?: EventFilter
  ): Promise<EventSubscription> {
    const subscription: EventSubscription = {
      id: this.generateSubscriptionId(),
      eventTypes: ['*'],
      handler,
      filter,
      createdAt: new Date(),
      active: true
    };

    this.globalSubscribers.push(subscription);

    this.logger.debug(`Global event subscription created`, {
      subscriptionId: subscription.id
    });

    return subscription;
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    let found = false;

    // Remove from type-specific subscribers
    for (const [type, subscriptions] of this.subscribers.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        found = true;
        
        // Clean up empty arrays
        if (subscriptions.length === 0) {
          this.subscribers.delete(type);
        }
      }
    }

    // Remove from global subscribers
    const globalIndex = this.globalSubscribers.findIndex(sub => sub.id === subscriptionId);
    if (globalIndex !== -1) {
      this.globalSubscribers.splice(globalIndex, 1);
      found = true;
    }

    if (found) {
      this.logger.debug(`Event subscription removed`, { subscriptionId });
    } else {
      this.logger.warn(`Subscription not found for unsubscribe`, { subscriptionId });
    }
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(event: Event): Promise<void> {
    // Add to history
    this.addToHistory(event);

    this.logger.debug(`Emitting event: ${event.type}`, {
      agentId: event.agentId,
      workflowId: event.workflowId,
      timestamp: event.timestamp
    });

    // Get subscribers for this event type
    const typeSubscribers = this.subscribers.get(event.type) || [];
    const allSubscribers = [...typeSubscribers, ...this.globalSubscribers];

    // Filter and notify subscribers
    const notificationPromises = allSubscribers
      .filter(sub => sub.active)
      .filter(sub => this.matchesFilter(event, sub.filter))
      .map(sub => this.notifySubscriber(sub, event));

    // Execute notifications concurrently
    const results = await Promise.allSettled(notificationPromises);

    // Log any failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(`${failures.length} event notifications failed`, {
        eventType: event.type,
        failures: failures.map(f => (f as PromiseRejectedResult).reason.message)
      });
    }
  }

  /**
   * Get event history
   */
  async getHistory(filter?: EventFilter): Promise<Event[]> {
    if (!filter) {
      return [...this.eventHistory];
    }

    return this.eventHistory.filter(event => this.matchesFilter(event, filter));
  }

  /**
   * Clear event history
   */
  async clearHistory(): Promise<void> {
    this.eventHistory = [];
    this.logger.info('Event history cleared');
  }

  /**
   * Get subscription statistics
   */
  getSubscriptionStats(): {
    totalSubscriptions: number;
    subscriptionsByType: Record<string, number>;
    globalSubscriptions: number;
  } {
    const subscriptionsByType: Record<string, number> = {};
    let totalSubscriptions = 0;

    for (const [type, subscriptions] of this.subscribers.entries()) {
      subscriptionsByType[type] = subscriptions.length;
      totalSubscriptions += subscriptions.length;
    }

    return {
      totalSubscriptions: totalSubscriptions + this.globalSubscribers.length,
      subscriptionsByType,
      globalSubscriptions: this.globalSubscribers.length
    };
  }

  /**
   * Wait for a specific event
   */
  async waitForEvent(
    eventType: EventType,
    timeout?: number,
    filter?: EventFilter
  ): Promise<Event> {
    return new Promise((resolve, reject) => {
      let subscription: EventSubscription;
      let timeoutHandle: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (subscription) {
          this.unsubscribe(subscription.id);
        }
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      };

      const handler: EventHandler = async (event) => {
        cleanup();
        resolve(event);
      };

      // Set up timeout
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
      }

      // Subscribe to event
      this.subscribe(eventType, handler, filter).then(sub => {
        subscription = sub;
      });
    });
  }

  /**
   * Get health status of the EventBus
   */
  getHealthStatus(): any {
    const stats = this.getSubscriptionStats();
    return {
      status: 'running',
      subscriptions: stats.totalSubscriptions,
      eventHistory: this.eventHistory.length,
      maxHistorySize: this.maxHistorySize,
      subscriptionsByType: stats.subscriptionsByType,
      globalSubscriptions: stats.globalSubscriptions,
      uptime: Date.now() - this.startTime
    };
  }

  private startTime = Date.now();

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(event: Event): void {
    this.eventHistory.push(event);
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private matchesFilter(event: Event, filter?: EventFilter): boolean {
    if (!filter) return true;

    // Check agent ID filter
    if (filter.agentId && event.agentId !== filter.agentId) {
      return false;
    }

    // Check workflow ID filter
    if (filter.workflowId && event.workflowId !== filter.workflowId) {
      return false;
    }

    // Check time range filter
    if (filter.since && event.timestamp < filter.since) {
      return false;
    }

    if (filter.until && event.timestamp > filter.until) {
      return false;
    }

    // Check data filter (simple key-value matching)
    if (filter.data) {
      for (const [key, value] of Object.entries(filter.data)) {
        if (!event.data || event.data[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  private async notifySubscriber(subscription: EventSubscription, event: Event): Promise<void> {
    try {
      await subscription.handler(event);
    } catch (error) {
      const eventError = this.errorManager.createError(
        'EVENT_HANDLER_FAILED',
        `Event handler failed: ${error instanceof Error ? error.message : String(error)}`,
        'system',
        'medium',
        {
          subscriptionId: subscription.id,
          eventType: event.type,
          eventId: event.id
        },
        error instanceof Error ? error : undefined
      );

      this.errorManager.handleError(eventError);

      // Optionally deactivate problematic subscriptions after repeated failures
      // This could be implemented with a failure counter per subscription
    }
  }
}

/**
 * Redis-based EventBus implementation for distributed deployments
 */
export class RedisEventBus extends EventBusImpl {
  // TODO: Implement Redis pub/sub for distributed event handling
  // This would be used in enterprise/multi-instance deployments
  
  constructor(logger: Logger, errorManager: ErrorManager, redisConfig?: any) {
    super(logger, errorManager);
    // Redis client initialization would go here
  }

  async emit(event: Event): Promise<void> {
    // Emit locally
    await super.emit(event);
    
    // Emit to Redis for other instances
    // Implementation would publish to Redis channel
  }

  // Additional Redis-specific methods would be implemented here
}