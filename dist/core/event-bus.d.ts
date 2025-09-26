/**
 * EventBus Implementation
 *
 * Event-driven messaging system for OpenConductor
 */
import { EventBus, Event, EventHandler, EventFilter, EventSubscription, EventType } from '../types/events';
import { Logger } from '../utils/logger';
import { ErrorManager } from '../utils/error-manager';
export declare class EventBusImpl implements EventBus {
    private subscribers;
    private globalSubscribers;
    private eventHistory;
    private maxHistorySize;
    private logger;
    private errorManager;
    constructor(logger: Logger, errorManager: ErrorManager);
    /**
     * Subscribe to specific event types
     */
    subscribe(eventTypes: EventType | EventType[], handler: EventHandler, filter?: EventFilter): Promise<EventSubscription>;
    /**
     * Subscribe to all events
     */
    subscribeToAll(handler: EventHandler, filter?: EventFilter): Promise<EventSubscription>;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): Promise<void>;
    /**
     * Emit an event to all subscribers
     */
    emit(event: Event): Promise<void>;
    /**
     * Get event history
     */
    getHistory(filter?: EventFilter): Promise<Event[]>;
    /**
     * Clear event history
     */
    clearHistory(): Promise<void>;
    /**
     * Get subscription statistics
     */
    getSubscriptionStats(): {
        totalSubscriptions: number;
        subscriptionsByType: Record<string, number>;
        globalSubscriptions: number;
    };
    /**
     * Wait for a specific event
     */
    waitForEvent(eventType: EventType, timeout?: number, filter?: EventFilter): Promise<Event>;
    /**
     * Get health status of the EventBus
     */
    getHealthStatus(): any;
    private startTime;
    private generateSubscriptionId;
    private addToHistory;
    private matchesFilter;
    private notifySubscriber;
}
/**
 * Redis-based EventBus implementation for distributed deployments
 */
export declare class RedisEventBus extends EventBusImpl {
    constructor(logger: Logger, errorManager: ErrorManager, redisConfig?: any);
    emit(event: Event): Promise<void>;
}
//# sourceMappingURL=event-bus.d.ts.map