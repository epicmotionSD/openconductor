"use strict";
/**
 * OpenConductor Event System Types
 *
 * Event-driven architecture that enables real-time coordination
 * and communication in the OpenConductor ecosystem.
 *
 * "Open Orchestration. Sovereign Control."
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBuilder = void 0;
/**
 * Event Builder
 *
 * Utility class for creating well-formed events
 */
class EventBuilder {
    event;
    constructor(type, source) {
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
    withData(data) {
        this.event.data = data;
        return this;
    }
    withPriority(priority) {
        this.event.priority = priority;
        return this;
    }
    withScope(scope) {
        this.event.scope = scope;
        return this;
    }
    withTarget(target) {
        this.event.target = target;
        return this;
    }
    withCorrelationId(correlationId) {
        this.event.correlationId = correlationId;
        return this;
    }
    withMetadata(metadata) {
        this.event.metadata = { ...this.event.metadata, ...metadata };
        return this;
    }
    withTTL(ttlSeconds) {
        this.event.ttl = ttlSeconds;
        return this;
    }
    requiresAudit() {
        this.event.auditRequired = true;
        return this;
    }
    build() {
        if (!this.event.data) {
            throw new Error('Event data is required');
        }
        return this.event;
    }
    generateId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.EventBuilder = EventBuilder;
//# sourceMappingURL=events.js.map