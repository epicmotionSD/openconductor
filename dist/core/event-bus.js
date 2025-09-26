"use strict";
/**
 * EventBus Implementation
 *
 * Event-driven messaging system for OpenConductor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisEventBus = exports.EventBusImpl = void 0;
class EventBusImpl {
    subscribers = new Map();
    globalSubscribers = [];
    eventHistory = [];
    maxHistorySize = 1000;
    logger;
    errorManager;
    constructor(logger, errorManager) {
        this.logger = logger;
        this.errorManager = errorManager;
    }
    /**
     * Subscribe to specific event types
     */
    async subscribe(eventTypes, handler, filter) {
        const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
        const subscription = {
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
            this.subscribers.get(type).push(subscription);
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
    async subscribeToAll(handler, filter) {
        const subscription = {
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
    async unsubscribe(subscriptionId) {
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
        }
        else {
            this.logger.warn(`Subscription not found for unsubscribe`, { subscriptionId });
        }
    }
    /**
     * Emit an event to all subscribers
     */
    async emit(event) {
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
                failures: failures.map(f => f.reason.message)
            });
        }
    }
    /**
     * Get event history
     */
    async getHistory(filter) {
        if (!filter) {
            return [...this.eventHistory];
        }
        return this.eventHistory.filter(event => this.matchesFilter(event, filter));
    }
    /**
     * Clear event history
     */
    async clearHistory() {
        this.eventHistory = [];
        this.logger.info('Event history cleared');
    }
    /**
     * Get subscription statistics
     */
    getSubscriptionStats() {
        const subscriptionsByType = {};
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
    async waitForEvent(eventType, timeout, filter) {
        return new Promise((resolve, reject) => {
            let subscription;
            let timeoutHandle;
            const cleanup = () => {
                if (subscription) {
                    this.unsubscribe(subscription.id);
                }
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
            };
            const handler = async (event) => {
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
    getHealthStatus() {
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
    startTime = Date.now();
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    addToHistory(event) {
        this.eventHistory.push(event);
        // Trim history if it exceeds max size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }
    matchesFilter(event, filter) {
        if (!filter)
            return true;
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
    async notifySubscriber(subscription, event) {
        try {
            await subscription.handler(event);
        }
        catch (error) {
            const eventError = this.errorManager.createError('EVENT_HANDLER_FAILED', `Event handler failed: ${error instanceof Error ? error.message : String(error)}`, 'system', 'medium', {
                subscriptionId: subscription.id,
                eventType: event.type,
                eventId: event.id
            }, error instanceof Error ? error : undefined);
            this.errorManager.handleError(eventError);
            // Optionally deactivate problematic subscriptions after repeated failures
            // This could be implemented with a failure counter per subscription
        }
    }
}
exports.EventBusImpl = EventBusImpl;
/**
 * Redis-based EventBus implementation for distributed deployments
 */
class RedisEventBus extends EventBusImpl {
    // TODO: Implement Redis pub/sub for distributed event handling
    // This would be used in enterprise/multi-instance deployments
    constructor(logger, errorManager, redisConfig) {
        super(logger, errorManager);
        // Redis client initialization would go here
    }
    async emit(event) {
        // Emit locally
        await super.emit(event);
        // Emit to Redis for other instances
        // Implementation would publish to Redis channel
    }
}
exports.RedisEventBus = RedisEventBus;
//# sourceMappingURL=event-bus.js.map