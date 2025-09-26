"use strict";
/**
 * OpenConductor Event Management API Routes
 *
 * REST endpoints for managing events, subscriptions, and real-time coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventRoutes = createEventRoutes;
const express_1 = require("express");
const error_handler_1 = require("../middleware/error-handler");
/**
 * Create event management routes
 */
function createEventRoutes(conductor, logger, errorManager) {
    const router = (0, express_1.Router)();
    /**
     * GET /events - Get events with filtering
     */
    router.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { types, sources, agentId, workflowId, since, until, page = 1, limit = 100 } = req.query;
        logger.debug('Getting events', {
            types, sources, agentId, workflowId, since, until, page, limit,
            userId: req.user?.id
        });
        try {
            // Build filter object
            const filter = {};
            if (types) {
                filter.types = types.split(',');
            }
            if (sources) {
                filter.sources = sources.split(',');
            }
            if (agentId) {
                filter.agentId = agentId;
            }
            if (workflowId) {
                filter.workflowId = workflowId;
            }
            if (since) {
                filter.since = new Date(since);
            }
            if (until) {
                filter.until = new Date(until);
            }
            // Get events from event bus
            const events = await conductor.events.getHistory(filter);
            // Apply pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const paginatedEvents = events.slice(offset, offset + limitNum);
            const total = events.length;
            const totalPages = Math.ceil(total / limitNum);
            const response = {
                success: true,
                data: paginatedEvents,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                },
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrevious: pageNum > 1
                }
            };
            logger.info('Events retrieved successfully', {
                count: paginatedEvents.length,
                total,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get events:', error);
            throw error;
        }
    }));
    /**
     * POST /events - Publish new event
     */
    router.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const eventData = req.body;
        logger.debug('Publishing event', {
            type: eventData.type,
            source: eventData.source,
            userId: req.user?.id
        });
        try {
            // Create event object
            const event = {
                id: generateEventId(),
                type: eventData.type,
                timestamp: new Date(),
                data: eventData.data,
                source: eventData.source,
                priority: eventData.priority || 'normal',
                target: eventData.target,
                metadata: {
                    ...eventData.metadata,
                    publishedBy: req.user?.id
                }
            };
            // Publish event through event bus
            await conductor.events.emit(event);
            const response = {
                success: true,
                data: event,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event published successfully', {
                eventId: event.id,
                type: event.type,
                source: event.source,
                userId: req.user?.id
            });
            res.status(201).json(response);
        }
        catch (error) {
            logger.error('Failed to publish event:', error);
            throw error;
        }
    }));
    /**
     * GET /events/subscriptions - List event subscriptions
     */
    router.get('/subscriptions', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
        logger.debug('Listing event subscriptions', {
            page, limit,
            userId: req.user?.id
        });
        try {
            // TODO: Implement subscription listing in event bus
            const subscriptions = [];
            // Apply pagination
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const total = subscriptions.length;
            const totalPages = Math.ceil(total / limitNum);
            const response = {
                success: true,
                data: subscriptions,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                },
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrevious: pageNum > 1
                }
            };
            logger.info('Event subscriptions listed successfully', {
                count: subscriptions.length,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to list event subscriptions:', error);
            throw error;
        }
    }));
    /**
     * POST /events/subscriptions - Create event subscription
     */
    router.post('/subscriptions', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const subscriptionData = req.body;
        logger.debug('Creating event subscription', {
            filter: subscriptionData.filter,
            endpoint: subscriptionData.endpoint,
            userId: req.user?.id
        });
        try {
            // Validate endpoint URL
            if (!isValidURL(subscriptionData.endpoint)) {
                throw new error_handler_1.ValidationError('Invalid endpoint URL');
            }
            const subscription = {
                id: generateSubscriptionId(),
                filter: subscriptionData.filter || {},
                endpoint: subscriptionData.endpoint,
                active: subscriptionData.active !== false,
                createdAt: new Date(),
                metadata: {
                    createdBy: req.user?.id
                }
            };
            // TODO: Store subscription and set up webhook delivery
            // For now, just return the subscription object
            const response = {
                success: true,
                data: subscription,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event subscription created successfully', {
                subscriptionId: subscription.id,
                endpoint: subscription.endpoint,
                userId: req.user?.id
            });
            res.status(201).json(response);
        }
        catch (error) {
            logger.error('Failed to create event subscription:', error);
            throw error;
        }
    }));
    /**
     * GET /events/subscriptions/:id - Get specific subscription
     */
    router.get('/subscriptions/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Getting event subscription', { subscriptionId: id, userId: req.user?.id });
        try {
            // TODO: Implement subscription retrieval
            const subscription = getMockSubscription(id);
            if (!subscription) {
                throw new error_handler_1.NotFoundError('Event subscription', id);
            }
            const response = {
                success: true,
                data: subscription,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event subscription retrieved successfully', {
                subscriptionId: id,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get event subscription:', error);
            throw error;
        }
    }));
    /**
     * PUT /events/subscriptions/:id - Update subscription
     */
    router.put('/subscriptions/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        logger.debug('Updating event subscription', { subscriptionId: id, updates, userId: req.user?.id });
        try {
            const subscription = getMockSubscription(id);
            if (!subscription) {
                throw new error_handler_1.NotFoundError('Event subscription', id);
            }
            // Apply updates
            const updatedSubscription = {
                ...subscription,
                ...updates,
                id, // Ensure ID doesn't change
                updatedAt: new Date()
            };
            const response = {
                success: true,
                data: updatedSubscription,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event subscription updated successfully', {
                subscriptionId: id,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to update event subscription:', error);
            throw error;
        }
    }));
    /**
     * DELETE /events/subscriptions/:id - Delete subscription
     */
    router.delete('/subscriptions/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        logger.debug('Deleting event subscription', { subscriptionId: id, userId: req.user?.id });
        try {
            const subscription = getMockSubscription(id);
            if (!subscription) {
                throw new error_handler_1.NotFoundError('Event subscription', id);
            }
            // TODO: Remove subscription and stop webhook delivery
            const response = {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event subscription deleted successfully', {
                subscriptionId: id,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to delete event subscription:', error);
            throw error;
        }
    }));
    /**
     * GET /events/stats - Get event statistics
     */
    router.get('/stats', (0, error_handler_1.asyncHandler)(async (req, res) => {
        const { since, until } = req.query;
        logger.debug('Getting event statistics', { since, until, userId: req.user?.id });
        try {
            // Build filter for statistics
            const filter = {};
            if (since)
                filter.since = new Date(since);
            if (until)
                filter.until = new Date(until);
            // Get event statistics
            const events = await conductor.events.getHistory(filter);
            const stats = {
                totalEvents: events.length,
                eventsByType: getEventsByType(events),
                eventsBySource: getEventsBySource(events),
                eventsByPriority: getEventsByPriority(events),
                eventsOverTime: getEventsOverTime(events),
                averageEventsPerHour: calculateAverageEventsPerHour(events),
                topEventTypes: getTopEventTypes(events),
                recentActivity: events.slice(-10) // Last 10 events
            };
            const response = {
                success: true,
                data: stats,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event statistics retrieved successfully', {
                totalEvents: stats.totalEvents,
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to get event statistics:', error);
            throw error;
        }
    }));
    /**
     * DELETE /events - Clear event history
     */
    router.delete('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
        logger.debug('Clearing event history', { userId: req.user?.id });
        try {
            await conductor.events.clearHistory();
            const response = {
                success: true,
                metadata: {
                    timestamp: new Date(),
                    version: 'v1',
                    requestId: req.requestId
                }
            };
            logger.info('Event history cleared successfully', {
                userId: req.user?.id
            });
            res.json(response);
        }
        catch (error) {
            logger.error('Failed to clear event history:', error);
            throw error;
        }
    }));
    return router;
}
/**
 * Generate unique event ID
 */
function generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
/**
 * Generate unique subscription ID
 */
function generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}
/**
 * Validate URL format
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get mock subscription (temporary implementation)
 */
function getMockSubscription(id) {
    if (id.startsWith('sub_')) {
        return {
            id,
            filter: {
                types: ['agent.*', 'workflow.*']
            },
            endpoint: 'https://example.com/webhooks/events',
            active: true,
            createdAt: new Date(),
            metadata: {
                createdBy: 'system'
            }
        };
    }
    return null;
}
/**
 * Group events by type
 */
function getEventsByType(events) {
    const result = {};
    events.forEach(event => {
        result[event.type] = (result[event.type] || 0) + 1;
    });
    return result;
}
/**
 * Group events by source
 */
function getEventsBySource(events) {
    const result = {};
    events.forEach(event => {
        result[event.source] = (result[event.source] || 0) + 1;
    });
    return result;
}
/**
 * Group events by priority
 */
function getEventsByPriority(events) {
    const result = {};
    events.forEach(event => {
        const priority = event.priority || 'normal';
        result[priority] = (result[priority] || 0) + 1;
    });
    return result;
}
/**
 * Get events over time (hourly buckets)
 */
function getEventsOverTime(events) {
    const hourlyBuckets = {};
    events.forEach(event => {
        const hour = new Date(event.timestamp).toISOString().substring(0, 13) + ':00:00Z';
        hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
    });
    return Object.entries(hourlyBuckets).map(([hour, count]) => ({ hour, count }));
}
/**
 * Calculate average events per hour
 */
function calculateAverageEventsPerHour(events) {
    if (events.length === 0)
        return 0;
    const timeSpanHours = (Date.now() - new Date(events[0].timestamp).getTime()) / (1000 * 60 * 60);
    return timeSpanHours > 0 ? events.length / timeSpanHours : 0;
}
/**
 * Get top event types by frequency
 */
function getTopEventTypes(events) {
    const typeCount = getEventsByType(events);
    return Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}
//# sourceMappingURL=events.js.map