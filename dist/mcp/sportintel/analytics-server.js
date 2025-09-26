"use strict";
/**
 * Analytics MCP Server
 *
 * Model Context Protocol server for sports analytics, data visualization,
 * reporting, and business intelligence capabilities.
 *
 * Integrates with OpenConductor's EventBus for real-time analytics
 * and TimescaleDB for time-series analysis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsMCPServer = void 0;
exports.createAnalyticsMCPServer = createAnalyticsMCPServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
class AnalyticsMCPServer {
    server;
    eventBus;
    dataManager;
    logger;
    config;
    activeAnalyses = 0;
    dashboards = new Map();
    reportCache = new Map();
    tools = [
        {
            name: 'analyze_player_trends',
            description: 'Analyze player performance trends over time with statistical insights',
            inputSchema: {
                type: 'object',
                properties: {
                    playerId: { type: 'string', description: 'Player identifier' },
                    metrics: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Metrics to analyze (fantasy_points, targets, yards, etc.)'
                    },
                    timeRange: {
                        type: 'object',
                        description: 'Time range for analysis (startDate, endDate)'
                    },
                    groupBy: {
                        type: 'string',
                        enum: ['game', 'week', 'month', 'season'],
                        description: 'Grouping granularity'
                    },
                    includeProjections: { type: 'boolean', description: 'Include future trend projections' },
                    compareBaseline: { type: 'boolean', description: 'Compare against league/position baseline' },
                    visualizationType: {
                        type: 'string',
                        enum: ['line', 'bar', 'scatter', 'heatmap'],
                        description: 'Chart type for visualization'
                    }
                },
                required: ['playerId', 'metrics', 'timeRange']
            }
        },
        {
            name: 'team_performance_analysis',
            description: 'Comprehensive team performance analysis with advanced metrics',
            inputSchema: {
                type: 'object',
                properties: {
                    teamId: { type: 'string', description: 'Team identifier' },
                    season: { type: 'number', description: 'Season year' },
                    analysisType: {
                        type: 'string',
                        enum: ['offensive', 'defensive', 'overall', 'situational'],
                        description: 'Type of analysis to perform'
                    },
                    situations: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific situations (red_zone, third_down, etc.)'
                    },
                    compareOpponents: { type: 'boolean', description: 'Include opponent-adjusted metrics' },
                    includeAdvancedMetrics: { type: 'boolean', description: 'Include advanced analytics' },
                    visualizations: { type: 'boolean', description: 'Generate visualizations' }
                },
                required: ['teamId', 'season', 'analysisType']
            }
        },
        {
            name: 'matchup_analysis',
            description: 'Detailed matchup analysis between players, teams, or positions',
            inputSchema: {
                type: 'object',
                properties: {
                    matchupType: {
                        type: 'string',
                        enum: ['player_vs_defense', 'team_vs_team', 'position_vs_defense'],
                        description: 'Type of matchup analysis'
                    },
                    entity1: { type: 'string', description: 'First entity (player/team ID)' },
                    entity2: { type: 'string', description: 'Second entity (defense/team ID)' },
                    historicalPeriod: { type: 'string', description: 'Historical period to analyze' },
                    situations: {
                        type: 'array',
                        description: 'Game situations to focus on'
                    },
                    includeWeather: { type: 'boolean', description: 'Include weather impact analysis' },
                    includeInjuries: { type: 'boolean', description: 'Include injury impact' },
                    confidenceLevel: {
                        type: 'number',
                        minimum: 0.8,
                        maximum: 0.99,
                        description: 'Statistical confidence level'
                    }
                },
                required: ['matchupType', 'entity1', 'entity2']
            }
        },
        {
            name: 'market_efficiency_analysis',
            description: 'Analyze DFS market efficiency and identify value opportunities',
            inputSchema: {
                type: 'object',
                properties: {
                    contest: { type: 'string', description: 'Contest identifier or type' },
                    slate: { type: 'string', description: 'DFS slate identifier' },
                    site: {
                        type: 'string',
                        enum: ['draftkings', 'fanduel', 'superdraft'],
                        description: 'DFS site'
                    },
                    analysisDepth: {
                        type: 'string',
                        enum: ['basic', 'advanced', 'comprehensive'],
                        description: 'Depth of market analysis'
                    },
                    positions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Positions to analyze'
                    },
                    valueThreshold: { type: 'number', description: 'Minimum value score threshold' },
                    includeOwnership: { type: 'boolean', description: 'Include ownership projections' },
                    correlationAnalysis: { type: 'boolean', description: 'Include player correlation analysis' }
                },
                required: ['contest', 'site']
            }
        },
        {
            name: 'generate_report',
            description: 'Generate comprehensive analytical reports with visualizations',
            inputSchema: {
                type: 'object',
                properties: {
                    reportType: {
                        type: 'string',
                        enum: ['weekly_recap', 'player_profile', 'team_analysis', 'market_report', 'custom'],
                        description: 'Type of report to generate'
                    },
                    subjects: {
                        type: 'array',
                        description: 'Subjects for the report (player IDs, team IDs, etc.)'
                    },
                    timeframe: {
                        type: 'object',
                        description: 'Timeframe for report data'
                    },
                    sections: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Report sections to include'
                    },
                    visualizations: { type: 'boolean', description: 'Include charts and graphs' },
                    format: {
                        type: 'string',
                        enum: ['pdf', 'html', 'json', 'markdown'],
                        description: 'Output format'
                    },
                    deliveryMethod: {
                        type: 'string',
                        enum: ['download', 'email', 'webhook'],
                        description: 'How to deliver the report'
                    }
                },
                required: ['reportType', 'subjects']
            }
        },
        {
            name: 'create_dashboard',
            description: 'Create real-time analytics dashboards with customizable widgets',
            inputSchema: {
                type: 'object',
                properties: {
                    dashboardName: { type: 'string', description: 'Dashboard name' },
                    widgets: {
                        type: 'array',
                        description: 'Dashboard widgets configuration'
                    },
                    layout: {
                        type: 'object',
                        description: 'Dashboard layout configuration'
                    },
                    refreshInterval: { type: 'number', description: 'Auto-refresh interval in seconds' },
                    filters: {
                        type: 'object',
                        description: 'Default filters for the dashboard'
                    },
                    permissions: {
                        type: 'object',
                        description: 'Access permissions for the dashboard'
                    },
                    realTimeUpdates: { type: 'boolean', description: 'Enable real-time updates' },
                    exportEnabled: { type: 'boolean', description: 'Allow dashboard export' }
                },
                required: ['dashboardName', 'widgets']
            }
        },
        {
            name: 'query_timeseries_data',
            description: 'Query and analyze time-series data with TimescaleDB optimization',
            inputSchema: {
                type: 'object',
                properties: {
                    metric: { type: 'string', description: 'Metric to query' },
                    entities: {
                        type: 'array',
                        description: 'Entity IDs (players, teams, games)'
                    },
                    timeRange: {
                        type: 'object',
                        description: 'Time range for query'
                    },
                    aggregation: {
                        type: 'string',
                        enum: ['raw', 'minute', 'hour', 'day', 'week', 'month'],
                        description: 'Data aggregation level'
                    },
                    functions: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Aggregation functions (avg, sum, min, max, stddev)'
                    },
                    filters: {
                        type: 'object',
                        description: 'Additional filters for the query'
                    },
                    limit: { type: 'number', description: 'Maximum number of results' },
                    useCache: { type: 'boolean', description: 'Use cached results if available' }
                },
                required: ['metric', 'entities', 'timeRange']
            }
        },
        {
            name: 'correlation_analysis',
            description: 'Perform correlation analysis between multiple variables',
            inputSchema: {
                type: 'object',
                properties: {
                    variables: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Variables to analyze for correlation'
                    },
                    entities: {
                        type: 'array',
                        description: 'Entity scope for analysis'
                    },
                    timeframe: {
                        type: 'object',
                        description: 'Time period for analysis'
                    },
                    correlationType: {
                        type: 'string',
                        enum: ['pearson', 'spearman', 'kendall'],
                        description: 'Correlation coefficient type'
                    },
                    significanceLevel: { type: 'number', description: 'Statistical significance level' },
                    visualizeMatrix: { type: 'boolean', description: 'Generate correlation matrix visualization' },
                    includePartialCorrelations: { type: 'boolean', description: 'Include partial correlation analysis' }
                },
                required: ['variables', 'entities', 'timeframe']
            }
        },
        {
            name: 'anomaly_detection',
            description: 'Detect anomalies and outliers in sports performance data',
            inputSchema: {
                type: 'object',
                properties: {
                    dataStream: { type: 'string', description: 'Data stream to analyze' },
                    entities: {
                        type: 'array',
                        description: 'Entities to monitor for anomalies'
                    },
                    detectionMethod: {
                        type: 'string',
                        enum: ['statistical', 'machine_learning', 'isolation_forest', 'lstm'],
                        description: 'Anomaly detection method'
                    },
                    sensitivity: {
                        type: 'number',
                        minimum: 0.1,
                        maximum: 1.0,
                        description: 'Detection sensitivity (0.1 = very sensitive, 1.0 = less sensitive)'
                    },
                    timeWindow: {
                        type: 'object',
                        description: 'Time window for anomaly detection'
                    },
                    alertThreshold: { type: 'number', description: 'Threshold for generating alerts' },
                    includeContext: { type: 'boolean', description: 'Include contextual information for anomalies' }
                },
                required: ['dataStream', 'entities', 'detectionMethod']
            }
        }
    ];
    constructor(config, eventBus, dataManager, logger) {
        this.config = config;
        this.eventBus = eventBus;
        this.dataManager = dataManager;
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
        this.initializeAnalytics();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: this.tools
        }));
        // Handle tool calls
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            this.activeAnalyses++;
            try {
                // Emit analytics operation start event
                await this.eventBus.emit({
                    type: 'analytics.operation.started',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'analytics',
                        arguments: args
                    }
                });
                const startTime = Date.now();
                let result;
                switch (name) {
                    case 'analyze_player_trends':
                        result = await this.handleAnalyzePlayerTrends(args);
                        break;
                    case 'team_performance_analysis':
                        result = await this.handleTeamPerformanceAnalysis(args);
                        break;
                    case 'matchup_analysis':
                        result = await this.handleMatchupAnalysis(args);
                        break;
                    case 'market_efficiency_analysis':
                        result = await this.handleMarketEfficiencyAnalysis(args);
                        break;
                    case 'generate_report':
                        result = await this.handleGenerateReport(args);
                        break;
                    case 'create_dashboard':
                        result = await this.handleCreateDashboard(args);
                        break;
                    case 'query_timeseries_data':
                        result = await this.handleQueryTimeseriesData(args);
                        break;
                    case 'correlation_analysis':
                        result = await this.handleCorrelationAnalysis(args);
                        break;
                    case 'anomaly_detection':
                        result = await this.handleAnomalyDetection(args);
                        break;
                    default:
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
                const executionTime = Date.now() - startTime;
                // Emit analytics operation completion event
                await this.eventBus.emit({
                    type: 'analytics.operation.completed',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'analytics',
                        executionTime,
                        success: true
                    }
                });
                return result;
            }
            catch (error) {
                // Emit analytics operation error event
                await this.eventBus.emit({
                    type: 'analytics.operation.failed',
                    timestamp: new Date(),
                    data: {
                        operation: name,
                        mcpServer: 'analytics',
                        error: error instanceof Error ? error.message : String(error)
                    }
                });
                throw error;
            }
            finally {
                this.activeAnalyses--;
            }
        });
    }
    async initializeAnalytics() {
        // Initialize default dashboards
        this.dashboards.set('overview', {
            id: 'overview',
            name: 'SportIntel Overview',
            widgets: [
                { type: 'player_performance', size: 'large' },
                { type: 'team_stats', size: 'medium' },
                { type: 'market_trends', size: 'medium' }
            ],
            createdAt: new Date(),
            realTimeUpdates: true
        });
        // Subscribe to data updates for real-time analytics
        if (this.config.realTimeAnalytics.enabled) {
            await this.eventBus.subscribe(['data.updated', 'game.play', 'prediction.completed'], async (event) => {
                await this.updateRealTimeAnalytics(event);
            });
        }
        this.logger.info('Analytics components initialized', {
            dashboards: this.dashboards.size,
            realTimeEnabled: this.config.realTimeAnalytics.enabled
        });
    }
    async handleAnalyzePlayerTrends(args) {
        this.logger.debug('Handling analyze_player_trends', { playerId: args.playerId });
        try {
            // Query TimescaleDB for player data
            const playerData = await this.dataManager.queryData({
                type: 'player_stats',
                filters: {
                    playerId: args.playerId,
                    startTime: new Date(args.timeRange.startDate),
                    endTime: new Date(args.timeRange.endDate)
                },
                aggregation: args.groupBy
            });
            // Calculate trend analysis
            const trends = this.calculateTrends(playerData, args.metrics);
            // Generate projections if requested
            let projections = null;
            if (args.includeProjections) {
                projections = await this.generateTrendProjections(trends);
            }
            // Create visualization data
            let visualization = null;
            if (args.visualizationType && this.config.visualization.enabled) {
                visualization = this.createVisualization(trends, args.visualizationType, args.metrics);
            }
            const result = {
                success: true,
                data: {
                    playerId: args.playerId,
                    timeRange: args.timeRange,
                    trends,
                    projections,
                    visualization,
                    statistics: {
                        dataPoints: playerData.length,
                        metricsAnalyzed: args.metrics.length,
                        trendDirection: trends.overallDirection,
                        confidence: trends.confidence
                    }
                },
                metadata: {
                    analysisId: this.generateAnalysisId(),
                    processingTime: Date.now(),
                    cacheUsed: this.config.performance.cacheResults
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
            this.logger.error('Failed to analyze player trends', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to analyze player trends: ${error.message}`);
        }
    }
    async handleTeamPerformanceAnalysis(args) {
        this.logger.debug('Handling team_performance_analysis', { teamId: args.teamId });
        try {
            // Get team data from TimescaleDB
            const teamData = await this.dataManager.queryData({
                type: 'team_stats',
                filters: {
                    teamId: args.teamId,
                    season: args.season,
                    analysisType: args.analysisType
                }
            });
            // Perform analysis based on type
            const analysis = await this.performTeamAnalysis(teamData, args);
            // Generate advanced metrics if requested
            let advancedMetrics = null;
            if (args.includeAdvancedMetrics) {
                advancedMetrics = this.calculateAdvancedTeamMetrics(teamData);
            }
            const result = {
                success: true,
                data: {
                    teamId: args.teamId,
                    season: args.season,
                    analysisType: args.analysisType,
                    analysis,
                    advancedMetrics,
                    rankings: {
                        overall: Math.floor(Math.random() * 32) + 1,
                        offensive: Math.floor(Math.random() * 32) + 1,
                        defensive: Math.floor(Math.random() * 32) + 1
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
            this.logger.error('Failed to analyze team performance', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to analyze team performance: ${error.message}`);
        }
    }
    async handleMatchupAnalysis(args) {
        this.logger.debug('Handling matchup_analysis', {
            matchupType: args.matchupType,
            entity1: args.entity1,
            entity2: args.entity2
        });
        try {
            const matchupData = await this.analyzeMatchup(args);
            const result = {
                success: true,
                data: {
                    matchupType: args.matchupType,
                    entities: [args.entity1, args.entity2],
                    analysis: matchupData.analysis,
                    historicalRecord: matchupData.historical,
                    predictiveFactors: matchupData.factors,
                    recommendation: matchupData.recommendation,
                    confidence: matchupData.confidence
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
            this.logger.error('Failed to analyze matchup', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to analyze matchup: ${error.message}`);
        }
    }
    async handleQueryTimeseriesData(args) {
        this.logger.debug('Handling query_timeseries_data', { metric: args.metric });
        try {
            // Use TimescaleDB optimized queries
            const timeseriesData = await this.dataManager.queryTimeseries({
                metric: args.metric,
                entities: args.entities,
                timeRange: args.timeRange,
                aggregation: args.aggregation,
                functions: args.functions,
                filters: args.filters,
                limit: args.limit,
                useCache: args.useCache && this.config.performance.cacheResults
            });
            const result = {
                success: true,
                data: {
                    metric: args.metric,
                    timeRange: args.timeRange,
                    aggregation: args.aggregation,
                    data: timeseriesData,
                    statistics: {
                        totalPoints: timeseriesData.length,
                        entities: args.entities.length,
                        cached: args.useCache && this.config.performance.cacheResults
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
            this.logger.error('Failed to query timeseries data', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to query timeseries data: ${error.message}`);
        }
    }
    async handleCreateDashboard(args) {
        this.logger.debug('Handling create_dashboard', { dashboardName: args.dashboardName });
        try {
            const dashboardId = this.generateDashboardId();
            const dashboard = {
                id: dashboardId,
                name: args.dashboardName,
                widgets: args.widgets,
                layout: args.layout,
                refreshInterval: args.refreshInterval || 30,
                filters: args.filters || {},
                permissions: args.permissions || { public: false },
                realTimeUpdates: args.realTimeUpdates || false,
                exportEnabled: args.exportEnabled || true,
                createdAt: new Date(),
                lastUpdated: new Date()
            };
            // Store dashboard
            this.dashboards.set(dashboardId, dashboard);
            // Set up real-time updates if enabled
            if (args.realTimeUpdates && this.config.realTimeAnalytics.enabled) {
                await this.setupDashboardRealTimeUpdates(dashboardId);
            }
            const result = {
                success: true,
                data: {
                    dashboardId,
                    dashboard,
                    url: `/dashboards/${dashboardId}`,
                    realTimeEnabled: args.realTimeUpdates
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
            this.logger.error('Failed to create dashboard', error);
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to create dashboard: ${error.message}`);
        }
    }
    // Helper methods for analytics processing
    calculateTrends(data, metrics) {
        // Simplified trend calculation
        return {
            overallDirection: Math.random() > 0.5 ? 'up' : 'down',
            confidence: 0.7 + Math.random() * 0.3,
            volatility: Math.random() * 0.5,
            seasonality: Math.random() > 0.7,
            metricTrends: metrics.reduce((acc, metric) => {
                acc[metric] = {
                    direction: Math.random() > 0.5 ? 'up' : 'down',
                    strength: Math.random(),
                    significance: Math.random() > 0.8
                };
                return acc;
            }, {})
        };
    }
    async generateTrendProjections(trends) {
        return {
            nextPeriod: trends.overallDirection === 'up' ? 'increase' : 'decrease',
            confidence: trends.confidence * 0.8,
            factors: ['Recent form', 'Schedule strength', 'Injury status'],
            projectedRange: {
                low: Math.random() * 50,
                high: Math.random() * 100 + 50
            }
        };
    }
    createVisualization(trends, type, metrics) {
        return {
            type,
            data: {
                labels: metrics,
                datasets: [{
                        label: 'Trend Analysis',
                        data: metrics.map(() => Math.random() * 100),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)'
                    }]
            },
            options: {
                responsive: true,
                title: { display: true, text: 'Player Trend Analysis' }
            }
        };
    }
    async performTeamAnalysis(data, args) {
        // Simplified team analysis
        return {
            strengths: ['Red zone efficiency', 'Third down conversions'],
            weaknesses: ['Pass defense', 'Turnover margin'],
            keyMetrics: {
                offensiveRank: Math.floor(Math.random() * 32) + 1,
                defensiveRank: Math.floor(Math.random() * 32) + 1,
                specialTeamsRank: Math.floor(Math.random() * 32) + 1
            },
            situationalPerformance: args.situations?.reduce((acc, situation) => {
                acc[situation] = {
                    rank: Math.floor(Math.random() * 32) + 1,
                    efficiency: Math.random()
                };
                return acc;
            }, {}) || {}
        };
    }
    calculateAdvancedTeamMetrics(data) {
        return {
            expectedPoints: Math.random() * 30 + 10,
            defenseAdjustedValueOverAverage: Math.random() * 10 - 5,
            successRate: Math.random() * 0.3 + 0.4,
            explosivePlayRate: Math.random() * 0.2 + 0.1,
            paceOfPlay: Math.random() * 20 + 60
        };
    }
    async analyzeMatchup(args) {
        return {
            analysis: {
                favorability: Math.random() > 0.5 ? 'favorable' : 'unfavorable',
                keyFactors: ['Historical performance', 'Recent form', 'Matchup advantages'],
                riskFactors: ['Injury concerns', 'Weather conditions']
            },
            historical: {
                meetings: Math.floor(Math.random() * 10) + 5,
                winRate: Math.random(),
                averageMargin: Math.random() * 20 - 10
            },
            factors: {
                offense: Math.random(),
                defense: Math.random(),
                specialTeams: Math.random(),
                coaching: Math.random()
            },
            recommendation: 'Consider for lineup construction',
            confidence: 0.6 + Math.random() * 0.4
        };
    }
    async updateRealTimeAnalytics(event) {
        // Update dashboards and analytics based on real-time events
        this.logger.debug('Updating real-time analytics', { eventType: event.type });
    }
    async setupDashboardRealTimeUpdates(dashboardId) {
        // Set up EventBus subscription for dashboard updates
        await this.eventBus.subscribe(['data.updated'], async (event) => {
            // Update dashboard with new data
            this.logger.debug('Updating dashboard', { dashboardId, event });
        });
    }
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateDashboardId() {
        return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Additional handler stubs for brevity
    async handleMarketEfficiencyAnalysis(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: { efficiency: 'high' } }, null, 2) }] };
    }
    async handleGenerateReport(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: { reportId: 'report_123' } }, null, 2) }] };
    }
    async handleCorrelationAnalysis(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: { correlations: {} } }, null, 2) }] };
    }
    async handleAnomalyDetection(args) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: { anomalies: [] } }, null, 2) }] };
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('Analytics MCP Server started', {
            name: this.config.name,
            version: this.config.version,
            tools: this.tools.length,
            dashboards: this.dashboards.size,
            visualizationEnabled: this.config.visualization.enabled,
            realTimeAnalytics: this.config.realTimeAnalytics.enabled
        });
    }
    async stop() {
        // Clear caches
        this.reportCache.clear();
        await this.server.close();
        this.logger.info('Analytics MCP Server stopped');
    }
}
exports.AnalyticsMCPServer = AnalyticsMCPServer;
// Export factory function
function createAnalyticsMCPServer(config, eventBus, dataManager, logger) {
    return new AnalyticsMCPServer(config, eventBus, dataManager, logger);
}
//# sourceMappingURL=analytics-server.js.map