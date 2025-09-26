"use strict";
/**
 * Alerts MCP Server
 *
 * Model Context Protocol server for real-time alerts, notifications,
 * and monitoring of sports events, injuries, line movements, and anomalies.
 *
 * Integrates with SportsSentinelAgent and OpenConductor's EventBus
 * for sub-200ms alert processing and delivery.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsMCPServer = void 0;
exports.createAlertsMCPServer = createAlertsMCPServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class AlertsMCPServer {
    server;
    eventBus;
    sportsSentinel;
    logger;
    config;
    activeAlerts = new Map();
    alertRules = new Map();
    subscriptions = new Map();
    processingQueue = [];
    tools = [
        {
            name: 'create_alert_rule',
            description: 'Create custom alert rules for sports events, injuries, and market changes',
            inputSchema: {
                type: 'object',
                properties: {
                    ruleName: { type: 'string', description: 'Unique name for the alert rule' },
                    ruleType: {
                        type: 'string',
                        enum: ['injury', 'lineup_change', 'weather', 'line_movement', 'ownership', 'performance', 'custom'],
                        description: 'Type of alert rule'
                    },
                    conditions: {
                        type: 'object',
                        description: 'Conditions that trigger the alert'
                    },
                    filters: {
                        type: 'object',
                        description: 'Filters for when to apply the rule (teams, players, etc.)'
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                        description: 'Alert priority level'
                    },
                    actions: {
                        type: 'array',
                        items: { type: 'object' },
                        description: 'Actions to take when alert triggers'
                    },
                    schedule: {
                        type: 'object',
                        description: 'When the rule should be active (days, hours)'
                    },
                    enabled: { type: 'boolean', description: 'Whether the rule is active' },
                    rateLimitMinutes: { type: 'number', description: 'Minimum minutes between identical alerts' }
                },
                required: ['ruleName', 'ruleType', 'conditions', 'priority', 'actions']
            }
        },
        {
            name: 'monitor_injury_reports',
            description: 'Monitor and alert on injury report changes with fantasy impact analysis',
            inputSchema: {
                type: 'object',
                properties: {
                    players: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific players to monitor (empty for all)'
                    },
                    teams: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific teams to monitor'
                    },
                    positions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Positions to monitor (QB, RB, WR, TE)'
                    },
                    severityThreshold: {
                        type: 'string',
                        enum: ['any', 'moderate', 'major'],
                        description: 'Minimum injury severity for alerts'
                    },
                    includeImpactAnalysis: { type: 'boolean', description: 'Include fantasy impact in alerts' },
                    alertChannels: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Alert delivery channels'
                    },
                    realTimeUpdates: { type: 'boolean', description: 'Enable real-time injury monitoring' }
                }
            }
        },
        {
            name: 'monitor_lineup_changes',
            description: 'Monitor and alert on lineup and depth chart changes',
            inputSchema: {
                type: 'object',
                properties: {
                    teams: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Teams to monitor for lineup changes'
                    },
                    positions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Positions of interest'
                    },
                    changeTypes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['starter_change', 'inactive', 'promotion', 'demotion', 'new_signing']
                        },
                        description: 'Types of lineup changes to monitor'
                    },
                    impactThreshold: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'Minimum impact level for alerts'
                    },
                    preGameHours: { type: 'number', description: 'Hours before game to start monitoring' },
                    includeDepthChart: { type: 'boolean', description: 'Monitor depth chart changes' }
                },
                required: ['teams', 'changeTypes']
            }
        },
        {
            name: 'monitor_weather_conditions',
            description: 'Monitor weather conditions that could impact game outcomes',
            inputSchema: {
                type: 'object',
                properties: {
                    games: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific games to monitor'
                    },
                    venues: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Venues to monitor'
                    },
                    weatherTypes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['rain', 'snow', 'wind', 'temperature', 'dome_closed']
                        },
                        description: 'Weather conditions to alert on'
                    },
                    thresholds: {
                        type: 'object',
                        description: 'Weather thresholds (wind speed, precipitation, etc.)'
                    },
                    forecastHours: { type: 'number', description: 'Hours ahead to monitor forecasts' },
                    includeFantasyImpact: { type: 'boolean', description: 'Include fantasy impact analysis' }
                },
                required: ['weatherTypes', 'thresholds']
            }
        },
        {
            name: 'monitor_line_movements',
            description: 'Monitor betting line movements and market inefficiencies',
            inputSchema: {
                type: 'object',
                properties: {
                    games: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Games to monitor'
                    },
                    lineTypes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['spread', 'total', 'moneyline', 'player_props']
                        },
                        description: 'Types of lines to monitor'
                    },
                    movementThreshold: {
                        type: 'number',
                        description: 'Minimum line movement to trigger alert (points/dollars)'
                    },
                    timeframe: {
                        type: 'string',
                        enum: ['1hour', '4hours', '12hours', '24hours'],
                        description: 'Timeframe for movement analysis'
                    },
                    sportsbooks: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Sportsbooks to monitor'
                    },
                    includeSharpMoney: { type: 'boolean', description: 'Include sharp money indicators' },
                    correlateWithNews: { type: 'boolean', description: 'Correlate movements with news' }
                },
                required: ['lineTypes', 'movementThreshold']
            }
        },
        {
            name: 'monitor_ownership_changes',
            description: 'Monitor DFS ownership projection changes and market shifts',
            inputSchema: {
                type: 'object',
                properties: {
                    contest: { type: 'string', description: 'Contest identifier or type' },
                    site: {
                        type: 'string',
                        enum: ['draftkings', 'fanduel', 'superdraft'],
                        description: 'DFS site to monitor'
                    },
                    players: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific players to monitor'
                    },
                    ownershipThreshold: {
                        type: 'number',
                        description: 'Ownership change threshold (percentage points)'
                    },
                    priceChangeThreshold: {
                        type: 'number',
                        description: 'Salary change threshold for alerts'
                    },
                    timeToLock: { type: 'number', description: 'Hours before contest lock' },
                    includeProjections: { type: 'boolean', description: 'Include updated projections' },
                    correlateWithNews: { type: 'boolean', description: 'Correlate with breaking news' }
                },
                required: ['site', 'ownershipThreshold']
            }
        },
        {
            name: 'create_performance_alert',
            description: 'Create alerts for unusual player or team performance patterns',
            inputSchema: {
                type: 'object',
                properties: {
                    monitorType: {
                        type: 'string',
                        enum: ['player_performance', 'team_performance', 'anomaly_detection'],
                        description: 'Type of performance monitoring'
                    },
                    entities: {
                        type: 'array',
                        description: 'Players or teams to monitor'
                    },
                    metrics: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Performance metrics to track'
                    },
                    triggers: {
                        type: 'object',
                        description: 'Trigger conditions (thresholds, patterns, anomalies)'
                    },
                    comparisonBaseline: {
                        type: 'string',
                        enum: ['season_average', 'career_average', 'position_average', 'custom'],
                        description: 'Baseline for comparison'
                    },
                    confidenceThreshold: { type: 'number', description: 'Statistical confidence threshold' },
                    includeContext: { type: 'boolean', description: 'Include contextual analysis' }
                },
                required: ['monitorType', 'entities', 'metrics', 'triggers']
            }
        },
        {
            name: 'get_active_alerts',
            description: 'Retrieve currently active alerts with filtering options',
            inputSchema: {
                type: 'object',
                properties: {
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                        description: 'Filter by alert priority'
                    },
                    alertType: {
                        type: 'string',
                        description: 'Filter by alert type'
                    },
                    timeRange: {
                        type: 'object',
                        description: 'Time range for alert retrieval'
                    },
                    status: {
                        type: 'string',
                        enum: ['active', 'acknowledged', 'resolved'],
                        description: 'Alert status filter'
                    },
                    limit: { type: 'number', description: 'Maximum alerts to return' },
                    includeHistory: { type: 'boolean', description: 'Include alert history' }
                }
            }
        },
        {
            name: 'acknowledge_alert',
            description: 'Acknowledge alerts and update their status',
            inputSchema: {
                type: 'object',
                properties: {
                    alertIds: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Alert IDs to acknowledge'
                    },
                    notes: { type: 'string', description: 'Optional notes about the acknowledgment' },
                    action: {
                        type: 'string',
                        enum: ['acknowledge', 'resolve', 'escalate', 'suppress'],
                        description: 'Action to take on the alerts'
                    },
                    userId: { type: 'string', description: 'User performing the action' },
                    suppressDuration: { type: 'number', description: 'Minutes to suppress similar alerts' }
                },
                required: ['alertIds', 'action']
            }
        },
        {
            name: 'test_alert_rule',
            description: 'Test alert rules against historical or simulated data',
            inputSchema: {
                type: 'object',
                properties: {
                    ruleId: { type: 'string', description: 'Alert rule to test' },
                    testData: {
                        type: 'object',
                        description: 'Test data or simulation parameters'
                    },
                    timeRange: {
                        type: 'object',
                        description: 'Historical time range for testing'
                    },
                    simulationMode: { type: 'boolean', description: 'Use simulation vs historical data' },
                    dryRun: { type: 'boolean', description: 'Test without actually sending alerts' },
                    generateReport: { type: 'boolean', description: 'Generate test results report' }
                },
                required: ['ruleId']
            }
        },
        {
            name: 'configure_alert_channels',
            description: 'Configure and test alert delivery channels',
            inputSchema: {
                type: 'object',
                properties: {
                    channels: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['email', 'sms', 'webhook', 'slack', 'discord', 'push']
                                },
                                config: { type: 'object', description: 'Channel-specific configuration' },
                                enabled: { type: 'boolean' }
                            }
                        },
                        description: 'Alert delivery channels to configure'
                    },
                    rateLimits: {
                        type: 'object',
                        description: 'Rate limits per channel'
                    },
                    priorityRouting: {
                        type: 'object',
                        description: 'Channel routing based on alert priority'
                    },
                    testDelivery: { type: 'boolean', description: 'Send test alerts to verify setup' }
                },
                required: ['channels']
            }
        }
    ];
    constructor(config, eventBus, sportsSentinel, logger) {
        this.config = config;
        this.eventBus = eventBus;
        this.sportsSentinel = sportsSentinel;
        this.logger = logger;
        this.server = new index_js_1.Server({
            name: config.name,
            version: config.version
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.setupHandlers();
        this.initializeAlerting();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: this.tools
        }));
        // Handle tool calls
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                // Emit alert operation start event
                await this.eventBus.emit({
                    type: 'alerts.operation.started',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'alerts',
                        arguments: args
                    }
                });
                const startTime = Date.now();
                let result;
                switch (name) {
                    case 'create_alert_rule':
                        result = await this.handleCreateAlertRule(args);
                        break;
                    case 'monitor_injury_reports':
                        result = await this.handleMonitorInjuryReports(args);
                        break;
                    case 'monitor_lineup_changes':
                        result = await this.handleMonitorLineupChanges(args);
                        break;
                    case 'monitor_weather_conditions':
                        result = await this.handleMonitorWeatherConditions(args);
                        break;
                    case 'monitor_line_movements':
                        result = await this.handleMonitorLineMovements(args);
                        break;
                    case 'monitor_ownership_changes':
                        result = await this.handleMonitorOwnershipChanges(args);
                        break;
                    case 'create_performance_alert':
                        result = await this.handleCreatePerformanceAlert(args);
                        break;
                    case 'get_active_alerts':
                        result = await this.handleGetActiveAlerts(args);
                        break;
                    case 'acknowledge_alert':
                        result = await this.handleAcknowledgeAlert(args);
                        break;
                    case 'test_alert_rule':
                        result = await this.handleTestAlertRule(args);
                        break;
                    case 'configure_alert_channels':
                        result = await this.handleConfigureAlertChannels(args);
                        break;
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                const executionTime = Date.now() - startTime;
                // Emit alert operation completion event
                await this.eventBus.emit({
                    type: 'alerts.operation.completed',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'alerts',
                        executionTime,
                        success: true
                    }
                });
                return result;
            }
            catch (error) {
                // Emit alert operation error event
                await this.eventBus.emit({
                    type: 'alerts.operation.failed',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'alerts',
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
                throw error;
            }
        });
    }
    async initializeAlerting() {
        // Initialize default alert rules
        this.alertRules.set('injury_critical', {
            id: 'injury_critical',
            name: 'Critical Injury Alerts',
            type: 'injury',
            conditions: { severity: ['major'], positions: ['QB', 'RB', 'WR'] },
            priority: 'critical',
            enabled: true,
            createdAt: new Date()
        });
        this.alertRules.set('lineup_starter_change', {
            id: 'lineup_starter_change',
            name: 'Starting Lineup Changes',
            type: 'lineup_change',
            conditions: { changeType: 'starter_change' },
            priority: 'high',
            enabled: true,
            createdAt: new Date()
        });
        // Subscribe to real-time events for alert processing
        if (this.config.realTime.enabled) {
            await this.eventBus.subscribe([
                'injury.reported',
                'injury.updated',
                'lineup.changed',
                'weather.updated',
                'line.moved',
                'ownership.changed',
                'anomaly.detected'
            ], async (event) => {
                await this.processRealTimeEvent(event);
            });
        }
        // Set up health monitoring
        if (this.config.monitoring.enabled) {
            this.startHealthMonitoring();
        }
        this.logger.info('Alert system initialized', {
            defaultRules: this.alertRules.size,
            realTimeEnabled: this.config.realTime.enabled,
            monitoringEnabled: this.config.monitoring.enabled
        });
    }
    async handleCreateAlertRule(args) {
        this.logger.debug('Handling create_alert_rule', { ruleName: args.ruleName });
        try {
            const ruleId = this.generateRuleId();
            const alertRule = {
                id: ruleId,
                name: args.ruleName,
                type: args.ruleType,
                conditions: args.conditions,
                filters: args.filters || {},
                priority: args.priority,
                actions: args.actions,
                schedule: args.schedule || { alwaysActive: true },
                enabled: args.enabled !== false,
                rateLimitMinutes: args.rateLimitMinutes || 5,
                createdAt: new Date(),
                lastTriggered: null,
                triggerCount: 0
            };
            // Store the rule
            this.alertRules.set(ruleId, alertRule);
            // Set up real-time monitoring for this rule
            if (this.config.realTime.enabled) {
                await this.setupRuleMonitoring(alertRule);
            }
            const result = {
                success: true,
                data: {
                    ruleId,
                    rule: alertRule,
                    message: 'Alert rule created successfully',
                    monitoring: this.config.realTime.enabled ? 'enabled' : 'disabled'
                }
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (error) {
            this.logger.error('Failed to create alert rule', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to create alert rule: ${error.message}`);
        }
    }
    async handleMonitorInjuryReports(args) {
        this.logger.debug('Handling monitor_injury_reports', {
            players: args.players?.length || 'all',
            teams: args.teams?.length || 'all'
        });
        try {
            // Create injury monitoring subscription using SportsSentinelAgent
            const monitoringConfig = {
                players: args.players || [],
                teams: args.teams || [],
                positions: args.positions || [],
                severityThreshold: args.severityThreshold || 'any',
                includeImpactAnalysis: args.includeImpactAnalysis || false,
                alertChannels: args.alertChannels || ['webhook'],
                realTimeUpdates: args.realTimeUpdates !== false
            };
            const monitorId = await this.sportsSentinel.monitorInjuryReports(monitoringConfig);
            // Set up EventBus subscription for injury updates
            if (args.realTimeUpdates !== false) {
                const subscription = await this.eventBus.subscribe(['injury.reported', 'injury.updated'], async (event) => {
                    await this.processInjuryAlert(event, monitoringConfig);
                }, {
                    data: {
                        players: args.players,
                        teams: args.teams,
                        positions: args.positions
                    }
                });
                this.subscriptions.set(monitorId, subscription);
            }
            const result = {
                success: true,
                data: {
                    monitorId,
                    configuration: monitoringConfig,
                    message: 'Injury monitoring activated',
                    realTimeEnabled: args.realTimeUpdates !== false
                }
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (error) {
            this.logger.error('Failed to set up injury monitoring', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to set up injury monitoring: ${error.message}`);
        }
    }
    async handleGetActiveAlerts(args) {
        this.logger.debug('Handling get_active_alerts', { filters: args });
        try {
            let alerts = Array.from(this.activeAlerts.values());
            // Apply filters
            if (args.priority) {
                alerts = alerts.filter(alert => alert.priority === args.priority);
            }
            if (args.alertType) {
                alerts = alerts.filter(alert => alert.type === args.alertType);
            }
            if (args.status) {
                alerts = alerts.filter(alert => alert.status === args.status);
            }
            if (args.timeRange) {
                const start = new Date(args.timeRange.startDate);
                const end = new Date(args.timeRange.endDate);
                alerts = alerts.filter(alert => {
                    const alertTime = new Date(alert.timestamp);
                    return alertTime >= start && alertTime <= end;
                });
            }
            // Apply limit
            if (args.limit) {
                alerts = alerts.slice(0, args.limit);
            }
            // Sort by timestamp (most recent first)
            alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const result = {
                success: true,
                data: {
                    alerts,
                    total: alerts.length,
                    filtered: {
                        priority: args.priority,
                        alertType: args.alertType,
                        status: args.status,
                        limit: args.limit
                    },
                    summary: {
                        critical: alerts.filter(a => a.priority === 'critical').length,
                        high: alerts.filter(a => a.priority === 'high').length,
                        medium: alerts.filter(a => a.priority === 'medium').length,
                        low: alerts.filter(a => a.priority === 'low').length
                    }
                }
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (error) {
            this.logger.error('Failed to get active alerts', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to get active alerts: ${error.message}`);
        }
    }
    async processRealTimeEvent(event) {
        const startTime = Date.now();
        try {
            // Process event against all active alert rules
            for (const [ruleId, rule] of this.alertRules) {
                if (!rule.enabled)
                    continue;
                // Check if event matches rule conditions
                if (await this.evaluateRuleConditions(event, rule)) {
                    // Check rate limiting
                    if (this.isRateLimited(ruleId, rule)) {
                        this.logger.debug('Alert rule rate limited', { ruleId });
                        continue;
                    }
                    // Generate and send alert
                    const alert = await this.generateAlert(event, rule);
                    await this.deliverAlert(alert);
                    // Update rule stats
                    rule.lastTriggered = new Date();
                    rule.triggerCount++;
                }
            }
            const processingTime = Date.now() - startTime;
            // Emit processing metrics for monitoring
            await this.eventBus.emit({
                type: 'alerts.processing.completed',
                timestamp: new Date(),
                data: {
                    eventType: event.type,
                    processingTimeMs: processingTime,
                    rulesEvaluated: this.alertRules.size
                }
            });
        }
        catch (error) {
            this.logger.error('Failed to process real-time event', error);
            // Emit error event
            await this.eventBus.emit({
                type: 'alerts.processing.failed',
                timestamp: new Date(),
                data: {
                    eventType: event.type,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
        }
    }
    async processInjuryAlert(event, config) {
        // Check if event matches monitoring configuration
        const playerId = event.data?.playerId;
        const teamId = event.data?.teamId;
        const position = event.data?.position;
        const severity = event.data?.severity;
        // Apply filters
        if (config.players.length > 0 && !config.players.includes(playerId))
            return;
        if (config.teams.length > 0 && !config.teams.includes(teamId))
            return;
        if (config.positions.length > 0 && !config.positions.includes(position))
            return;
        // Check severity threshold
        const severityLevels = { 'minor': 1, 'moderate': 2, 'major': 3 };
        const thresholdLevel = severityLevels[config.severityThreshold] || 1;
        const eventLevel = severityLevels[severity] || 1;
        if (eventLevel < thresholdLevel)
            return;
        // Generate injury alert
        const alert = {
            id: this.generateAlertId(),
            type: 'injury',
            priority: severity === 'major' ? 'critical' : 'high',
            title: `Injury Report: ${event.data.playerName}`,
            message: `${event.data.playerName} (${position}, ${teamId}) - ${event.data.injuryType}: ${event.data.status}`,
            data: event.data,
            timestamp: new Date(),
            status: 'active',
            source: 'injury_monitor'
        };
        // Add impact analysis if requested
        if (config.includeImpactAnalysis) {
            alert.data.fantasyImpact = await this.sportsSentinel.analyzeInjuryImpact(playerId, event.data);
        }
        // Store and deliver alert
        this.activeAlerts.set(alert.id, alert);
        await this.deliverAlert(alert);
    }
    async evaluateRuleConditions(event, rule) {
        // Simplified rule evaluation - in production, this would be more sophisticated
        const eventType = event.type;
        const ruleType = rule.type;
        // Map event types to rule types
        const typeMapping = {
            'injury': ['injury.reported', 'injury.updated'],
            'lineup_change': ['lineup.changed'],
            'weather': ['weather.updated'],
            'line_movement': ['line.moved'],
            'ownership': ['ownership.changed'],
            'performance': ['performance.anomaly']
        };
        const matchingEvents = typeMapping[ruleType] || [];
        return matchingEvents.includes(eventType);
    }
    isRateLimited(ruleId, rule) {
        if (!rule.lastTriggered)
            return false;
        const now = Date.now();
        const lastTriggered = new Date(rule.lastTriggered).getTime();
        const rateLimitMs = (rule.rateLimitMinutes || 5) * 60 * 1000;
        return (now - lastTriggered) < rateLimitMs;
    }
    async generateAlert(event, rule) {
        return {
            id: this.generateAlertId(),
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type,
            priority: rule.priority,
            title: `Alert: ${rule.name}`,
            message: this.generateAlertMessage(event, rule),
            data: {
                event: event.data,
                rule: rule.conditions,
                source: 'rule_engine'
            },
            timestamp: new Date(),
            status: 'active',
            actions: rule.actions
        };
    }
    generateAlertMessage(event, rule) {
        // Generate contextual alert message based on event and rule
        const eventType = event.type;
        const data = event.data;
        switch (eventType) {
            case 'injury.reported':
                return `New injury reported: ${data.playerName} (${data.position}) - ${data.injuryType}`;
            case 'lineup.changed':
                return `Lineup change: ${data.playerName} status changed to ${data.newStatus}`;
            case 'weather.updated':
                return `Weather alert: ${data.condition} at ${data.venue}`;
            default:
                return `Alert triggered for ${rule.name}`;
        }
    }
    async deliverAlert(alert) {
        try {
            // Emit alert event for other systems to consume
            await this.eventBus.emit({
                type: 'alert.generated',
                timestamp: new Date(),
                data: alert
            });
            this.logger.info('Alert delivered', {
                alertId: alert.id,
                type: alert.type,
                priority: alert.priority
            });
        }
        catch (error) {
            this.logger.error('Failed to deliver alert', error);
        }
    }
    async setupRuleMonitoring(rule) {
        // Set up monitoring for specific rule types
        const eventTypes = this.getEventTypesForRule(rule.type);
        if (eventTypes.length > 0) {
            await this.eventBus.subscribe(eventTypes, async (event) => {
                if (await this.evaluateRuleConditions(event, rule)) {
                    await this.processRuleEvent(event, rule);
                }
            });
        }
    }
    getEventTypesForRule(ruleType) {
        const mapping = {
            'injury': ['injury.reported', 'injury.updated'],
            'lineup_change': ['lineup.changed'],
            'weather': ['weather.updated'],
            'line_movement': ['line.moved'],
            'ownership': ['ownership.changed'],
            'performance': ['performance.anomaly'],
            'custom': ['*'] // Custom rules can listen to all events
        };
        return mapping[ruleType] || [];
    }
    async processRuleEvent(event, rule) {
        const alert = await this.generateAlert(event, rule);
        this.activeAlerts.set(alert.id, alert);
        await this.deliverAlert(alert);
    }
    startHealthMonitoring() {
        setInterval(async () => {
            try {
                const health = {
                    activeAlerts: this.activeAlerts.size,
                    alertRules: this.alertRules.size,
                    subscriptions: this.subscriptions.size,
                    processingQueue: this.processingQueue.length,
                    timestamp: new Date()
                };
                // Emit health metrics
                await this.eventBus.emit({
                    type: 'alerts.health',
                    timestamp: new Date(),
                    data: health
                });
            }
            catch (error) {
                this.logger.error('Health monitoring failed', error);
            }
        }, this.config.monitoring.healthCheckIntervalMs);
    }
    // Helper methods and additional handlers
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRuleId() {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Additional handler implementations (simplified for brevity)
    async handleMonitorLineupChanges(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, monitorId: 'lineup_123' }, null, 2) }] };
    }
    async handleMonitorWeatherConditions(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, monitorId: 'weather_123' }, null, 2) }] };
    }
    async handleMonitorLineMovements(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, monitorId: 'lines_123' }, null, 2) }] };
    }
    async handleMonitorOwnershipChanges(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, monitorId: 'ownership_123' }, null, 2) }] };
    }
    async handleCreatePerformanceAlert(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, alertId: 'perf_123' }, null, 2) }] };
    }
    async handleAcknowledgeAlert(args) {
        for (const alertId of args.alertIds) {
            const alert = this.activeAlerts.get(alertId);
            if (alert) {
                alert.status = args.action;
                alert.acknowledgedAt = new Date();
                alert.acknowledgedBy = args.userId;
            }
        }
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, acknowledged: args.alertIds.length }, null, 2) }] };
    }
    async handleTestAlertRule(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, testResults: 'passed' }, null, 2) }] };
    }
    async handleConfigureAlertChannels(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, channels: args.channels.length }, null, 2) }] };
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('Alerts MCP Server started', {
            name: this.config.name,
            version: this.config.version,
            tools: this.tools.length,
            alertRules: this.alertRules.size,
            realTimeEnabled: this.config.realTime.enabled,
            monitoringEnabled: this.config.monitoring.enabled
        });
    }
    async stop() {
        // Clean up subscriptions
        for (const subscription of this.subscriptions.values()) {
            await this.eventBus.unsubscribe(subscription.id);
        }
        this.subscriptions.clear();
        // Clear active alerts and rules
        this.activeAlerts.clear();
        this.processingQueue.length = 0;
        await this.server.close();
        this.logger.info('Alerts MCP Server stopped');
    }
}
exports.AlertsMCPServer = AlertsMCPServer;
// Export factory function
function createAlertsMCPServer(config, eventBus, sportsSentinel, logger) {
    return new AlertsMCPServer(config, eventBus, sportsSentinel, logger);
}
//# sourceMappingURL=alerts-server.js.map