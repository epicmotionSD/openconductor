/**
 * OpenConductor Event System Types
 * 
 * Event-driven architecture that enables real-time coordination
 * and communication in the OpenConductor ecosystem.
 * 
 * "Open Orchestration. Sovereign Control."
 */

export type EventType =
  | 'agent.registered'
  | 'agent.unregistered'
  | 'agent.started'
  | 'agent.stopped'
  | 'agent.error'
  | 'agent.heartbeat'
  | 'workflow.created'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.cancelled'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'system.alert'
  | 'system.maintenance'
  | 'system.initialized'
  | 'system.started'
  | 'system.stopping'
  | 'custom';

export type EventPriority = 'low' | 'medium' | 'high' | 'critical';

export type EventScope = 'global' | 'workflow' | 'agent' | 'step';

/**
 * Base OpenConductor Event
 * 
 * All events in the system inherit from this base interface
 */
export interface OpenConductorEvent<T = any> {
  // Event identification
  id: string;
  type: EventType;
  source: string;
  timestamp: Date;
  
  // Event routing and scope
  scope: EventScope;
  target?: string;
  correlationId?: string;
  causationId?: string;
  
  // Event metadata
  priority: EventPriority;
  version: string;
  
  // Event payload
  data: T;
  metadata?: Record<string, any>;
  
  // Enterprise features
  auditRequired?: boolean;
  securityContext?: {
    userId?: string;
    sessionId?: string;
    permissions?: string[];
  };
  
  // Message durability
  persistent?: boolean;
  ttl?: number; // Time to live in seconds
}

/**
 * Agent Events
 * 
 * Events related to agent lifecycle and operations
 */
export interface AgentRegisteredEvent extends OpenConductorEvent {
  type: 'agent.registered';
  data: {
    agentId: string;
    name: string;
    type: string;
    version: string;
    capabilities: string[];
  };
}

export interface AgentStartedEvent extends OpenConductorEvent {
  type: 'agent.started';
  data: {
    agentId: string;
    executionId: string;
    input?: any;
  };
}

export interface AgentStoppedEvent extends OpenConductorEvent {
  type: 'agent.stopped';
  data: {
    agentId: string;
    executionId: string;
    output?: any;
    duration: number;
    success: boolean;
  };
}

export interface AgentErrorEvent extends OpenConductorEvent {
  type: 'agent.error';
  data: {
    agentId: string;
    executionId?: string;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  };
}

export interface AgentHeartbeatEvent extends OpenConductorEvent {
  type: 'agent.heartbeat';
  data: {
    agentId: string;
    status: string;
    metrics: {
      cpu: number;
      memory: number;
      uptime: number;
      executionCount: number;
    };
  };
}

/**
 * Workflow Events
 * 
 * Events related to workflow orchestration
 */
export interface WorkflowCreatedEvent extends OpenConductorEvent {
  type: 'workflow.created';
  data: {
    workflowId: string;
    name: string;
    version: string;
    author?: string;
  };
}

export interface WorkflowStartedEvent extends OpenConductorEvent {
  type: 'workflow.started';
  data: {
    workflowId: string;
    executionId: string;
    input?: any;
    triggeredBy?: {
      type: string;
      source: string;
    };
  };
}

export interface WorkflowCompletedEvent extends OpenConductorEvent {
  type: 'workflow.completed';
  data: {
    workflowId: string;
    executionId: string;
    output?: any;
    duration: number;
    stepCount: number;
    metrics: {
      successfulSteps: number;
      failedSteps: number;
      totalExecutionTime: number;
    };
  };
}

export interface WorkflowFailedEvent extends OpenConductorEvent {
  type: 'workflow.failed';
  data: {
    workflowId: string;
    executionId: string;
    error: {
      step?: string;
      code: string;
      message: string;
      details?: any;
    };
    duration: number;
    completedSteps: number;
  };
}

export interface WorkflowCancelledEvent extends OpenConductorEvent {
  type: 'workflow.cancelled';
  data: {
    workflowId: string;
    executionId: string;
    reason: string;
    cancelledBy?: string;
    duration: number;
    completedSteps: number;
  };
}

/**
 * Step Events
 * 
 * Events related to individual workflow steps
 */
export interface StepStartedEvent extends OpenConductorEvent {
  type: 'step.started';
  data: {
    workflowId: string;
    executionId: string;
    stepId: string;
    stepName: string;
    agentId?: string;
    input?: any;
  };
}

export interface StepCompletedEvent extends OpenConductorEvent {
  type: 'step.completed';
  data: {
    workflowId: string;
    executionId: string;
    stepId: string;
    stepName: string;
    agentId?: string;
    output?: any;
    duration: number;
  };
}

export interface StepFailedEvent extends OpenConductorEvent {
  type: 'step.failed';
  data: {
    workflowId: string;
    executionId: string;
    stepId: string;
    stepName: string;
    agentId?: string;
    error: {
      code: string;
      message: string;
      details?: any;
    };
    attempt: number;
    maxAttempts: number;
    willRetry: boolean;
  };
}

/**
 * System Events
 * 
 * Events related to system health and operations
 */
export interface SystemAlertEvent extends OpenConductorEvent {
  type: 'system.alert';
  data: {
    alertId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    component: string;
    message: string;
    metrics?: Record<string, number>;
    threshold?: {
      metric: string;
      value: number;
      operator: string;
    };
  };
}

export interface SystemMaintenanceEvent extends OpenConductorEvent {
  type: 'system.maintenance';
  data: {
    maintenanceId: string;
    action: 'scheduled' | 'started' | 'completed' | 'cancelled';
    component?: string;
    scheduledTime?: Date;
    estimatedDuration?: number;
    description?: string;
  };
}

/**
 * Custom Event
 * 
 * Extensible event type for custom use cases
 */
export interface CustomEvent extends OpenConductorEvent {
  type: 'custom';
  customType: string;
  data: any;
}

/**
 * Simple Event Interface for basic event bus operations
 */
export interface Event {
  id?: string;
  type: EventType;
  agentId?: string;
  workflowId?: string;
  timestamp: Date;
  data?: any;
}

/**
 * Event Filter
 *
 * Filtering options for event subscriptions and queries
 */
export interface EventFilter {
  types?: EventType[];
  sources?: string[];
  scopes?: EventScope[];
  priorities?: EventPriority[];
  agentId?: string;
  workflowId?: string;
  correlationId?: string;
  since?: Date;
  until?: Date;
  data?: Record<string, any>;
  limit?: number;
  offset?: number;
}

/**
 * Event Subscription
 *
 * Configuration for event subscriptions
 */
export interface EventSubscription {
  id: string;
  eventTypes: EventType[] | ['*'];
  handler: EventHandler;
  filter?: EventFilter;
  createdAt: Date;
  active: boolean;
  
  // Optional enterprise features
  name?: string;
  delivery?: {
    method: 'webhook' | 'websocket' | 'callback' | 'queue';
    endpoint?: string;
    headers?: Record<string, string>;
    authentication?: {
      type: 'none' | 'api-key' | 'bearer' | 'basic';
      credentials?: Record<string, string>;
    };
    retryPolicy?: {
      maxRetries: number;
      backoffStrategy: 'linear' | 'exponential';
      initialDelay: number;
    };
  };
  lastDelivery?: Date;
  owner?: string;
  permissions?: string[];
}

/**
 * Event Store Interface
 * 
 * Persistent storage and retrieval of events
 */
export interface EventStore {
  // Event storage
  store(event: OpenConductorEvent): Promise<void>;
  storeBatch(events: OpenConductorEvent[]): Promise<void>;
  
  // Event retrieval
  getEvent(eventId: string): Promise<OpenConductorEvent | null>;
  getEvents(filter: EventFilter): Promise<OpenConductorEvent[]>;
  getEventsByCorrelation(correlationId: string): Promise<OpenConductorEvent[]>;
  
  // Event streaming
  createStream(filter: EventFilter): AsyncIterable<OpenConductorEvent>;
  
  // Maintenance
  purgeEvents(beforeDate: Date): Promise<number>;
  getStorageStats(): Promise<EventStorageStats>;
}

/**
 * Event Bus Interface
 *
 * Real-time event publishing and subscription
 */
export interface EventBus {
  // Basic event operations
  emit(event: Event): Promise<void>;
  
  // Subscription management
  subscribe(eventTypes: EventType | EventType[], handler: EventHandler, filter?: EventFilter): Promise<EventSubscription>;
  subscribeToAll(handler: EventHandler, filter?: EventFilter): Promise<EventSubscription>;
  unsubscribe(subscriptionId: string): Promise<void>;
  
  // Event history
  getHistory(filter?: EventFilter): Promise<Event[]>;
  clearHistory(): Promise<void>;
  
  // Utilities
  waitForEvent(eventType: EventType, timeout?: number, filter?: EventFilter): Promise<Event>;
  
  // Enterprise features (optional)
  publish?(event: OpenConductorEvent): Promise<void>;
  publishBatch?(events: OpenConductorEvent[]): Promise<void>;
  listSubscriptions?(owner?: string): Promise<EventSubscription[]>;
  createWebSocketConnection?(filter: EventFilter): Promise<WebSocketEventStream>;
  getHealth?(): Promise<EventBusHealth>;
  getMetrics?(): Promise<EventBusMetrics>;
}

/**
 * Event Handler
 *
 * Function interface for handling events
 */
export type EventHandler = (event: Event) => Promise<void> | void;

/**
 * WebSocket Event Stream
 * 
 * Real-time event stream over WebSocket
 */
export interface WebSocketEventStream {
  id: string;
  filter: EventFilter;
  
  // Stream control
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  
  // Event handling
  onEvent(handler: EventHandler): void;
  onError(handler: (error: Error) => void): void;
  onClose(handler: () => void): void;
  
  // State
  isActive(): boolean;
  getStats(): EventStreamStats;
}

/**
 * Event Storage Stats
 * 
 * Statistics about event storage
 */
export interface EventStorageStats {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  storageSize: number;
  oldestEvent?: Date;
  newestEvent?: Date;
  indexSize: number;
}

/**
 * Event Bus Health
 * 
 * Health status of the event bus
 */
export interface EventBusHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  
  components: {
    publisher: 'healthy' | 'degraded' | 'unhealthy';
    subscriber: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    websockets: 'healthy' | 'degraded' | 'unhealthy';
  };
  
  metrics: {
    activeSubscriptions: number;
    activeConnections: number;
    publishRate: number;
    errorRate: number;
  };
}

/**
 * Event Bus Metrics
 * 
 * Performance metrics for the event bus
 */
export interface EventBusMetrics {
  timestamp: Date;
  
  // Publishing metrics
  published: {
    total: number;
    rate: number; // events per second
    byType: Record<EventType, number>;
    averageSize: number;
  };
  
  // Subscription metrics
  subscriptions: {
    active: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
  };
  
  // Connection metrics
  connections: {
    websocket: number;
    total: number;
    averageLifetime: number;
  };
  
  // Storage metrics
  storage: {
    events: number;
    size: number;
    writeRate: number;
    readRate: number;
  };
  
  // Performance metrics
  performance: {
    cpu: number;
    memory: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
  };
}

/**
 * Event Stream Stats
 * 
 * Statistics for individual event streams
 */
export interface EventStreamStats {
  eventsDelivered: number;
  lastEventTime?: Date;
  averageLatency: number;
  errorCount: number;
  connectionUptime: number;
}

/**
 * Event Builder
 * 
 * Utility class for creating well-formed events
 */
export class EventBuilder {
  private event: Partial<OpenConductorEvent>;
  
  constructor(type: EventType, source: string) {
    this.event = {
      id: this.generateId(),
      type,
      source,
      timestamp: new Date(),
      priority: 'medium',
      scope: 'global',
      version: '1.0',
      persistent: true
    };
  }
  
  withData<T>(data: T): EventBuilder {
    this.event.data = data;
    return this;
  }
  
  withPriority(priority: EventPriority): EventBuilder {
    this.event.priority = priority;
    return this;
  }
  
  withScope(scope: EventScope): EventBuilder {
    this.event.scope = scope;
    return this;
  }
  
  withTarget(target: string): EventBuilder {
    this.event.target = target;
    return this;
  }
  
  withCorrelationId(correlationId: string): EventBuilder {
    this.event.correlationId = correlationId;
    return this;
  }
  
  withMetadata(metadata: Record<string, any>): EventBuilder {
    this.event.metadata = { ...this.event.metadata, ...metadata };
    return this;
  }
  
  withTTL(ttlSeconds: number): EventBuilder {
    this.event.ttl = ttlSeconds;
    return this;
  }
  
  requiresAudit(): EventBuilder {
    this.event.auditRequired = true;
    return this;
  }
  
  build(): OpenConductorEvent {
    if (!this.event.data) {
      throw new Error('Event data is required');
    }
    return this.event as OpenConductorEvent;
  }
  
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}