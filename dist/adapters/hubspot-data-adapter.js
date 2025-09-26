"use strict";
/**
 * HubSpot Data Adapter for OpenConductor Trinity AI Agents
 * Handles real-time data synchronization and transformation between HubSpot and Trinity agents
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubSpotDataAdapter = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
class HubSpotDataAdapter extends events_1.EventEmitter {
    httpClient;
    config;
    syncConfig;
    dataCache = new Map();
    syncTokens = new Map();
    rateLimitState = {
        daily: { remaining: 40000, resetTime: 0 },
        burst: { remaining: 100, resetTime: 0 }
    };
    syncIntervals = new Map();
    constructor(config, syncConfig) {
        super();
        this.config = {
            baseURL: 'https://api.hubapi.com',
            rateLimits: { daily: 40000, burst: 100 },
            retryConfig: { maxRetries: 3, backoffFactor: 2, maxDelay: 10000 },
            ...config
        };
        this.syncConfig = {
            syncInterval: 5 * 60 * 1000, // 5 minutes
            batchSize: 100,
            enableRealTimeSync: true,
            cacheTimeout: 15 * 60 * 1000, // 15 minutes
            ...syncConfig
        };
        this.httpClient = axios_1.default.create({
            baseURL: this.config.baseURL,
            headers: {
                'Authorization': `Bearer ${this.config.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        this.setupInterceptors();
        this.startPeriodicSync();
    }
    /**
     * Setup HTTP interceptors for rate limiting and error handling
     */
    setupInterceptors() {
        // Request interceptor for rate limiting
        this.httpClient.interceptors.request.use(async (config) => {
            await this.checkRateLimit();
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for rate limit tracking and error handling
        this.httpClient.interceptors.response.use((response) => {
            this.updateRateLimitState(response.headers);
            return response;
        }, async (error) => {
            if (error.response?.status === 429) {
                // Rate limit exceeded, wait and retry
                const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
                await this.delay(retryAfter * 1000);
                return this.httpClient.request(error.config);
            }
            if (error.response?.status >= 500 && error.config?.__retryCount < (this.config.retryConfig?.maxRetries || 3)) {
                // Server error, implement exponential backoff
                error.config.__retryCount = (error.config.__retryCount || 0) + 1;
                const delay = Math.min(1000 * Math.pow(this.config.retryConfig?.backoffFactor || 2, error.config.__retryCount - 1), this.config.retryConfig?.maxDelay || 10000);
                await this.delay(delay);
                return this.httpClient.request(error.config);
            }
            return Promise.reject(error);
        });
    }
    /**
     * DEALS DATA ADAPTER
     */
    async syncDealsData() {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsUpdated = 0;
        let recordsCreated = 0;
        const errors = [];
        try {
            const syncToken = this.syncTokens.get('deals');
            const url = '/crm/v3/objects/deals';
            const params = {
                limit: this.syncConfig.batchSize,
                properties: [
                    'dealname', 'amount', 'dealstage', 'pipeline', 'closedate',
                    'createdate', 'hs_deal_stage_probability', 'hubspot_owner_id',
                    'dealtype', 'hs_analytics_source', 'hs_deal_amount_calculation_preference'
                ],
                associations: ['contacts', 'companies']
            };
            if (syncToken) {
                params.after = syncToken;
            }
            const response = await this.httpClient.get(url, { params });
            const deals = response.data.results || [];
            for (const deal of deals) {
                try {
                    const transformedDeal = this.transformDealRecord(deal);
                    const cacheKey = `deal_${deal.id}`;
                    const existing = this.dataCache.get(cacheKey);
                    if (existing) {
                        if (existing.updatedAt !== transformedDeal.updatedAt) {
                            this.dataCache.set(cacheKey, transformedDeal);
                            recordsUpdated++;
                            this.emit('deal_updated', transformedDeal);
                        }
                    }
                    else {
                        this.dataCache.set(cacheKey, transformedDeal);
                        recordsCreated++;
                        this.emit('deal_created', transformedDeal);
                    }
                    recordsProcessed++;
                }
                catch (error) {
                    errors.push({
                        record: deal.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            // Update sync token for incremental sync
            if (response.data.paging?.next?.after) {
                this.syncTokens.set('deals', response.data.paging.next.after);
            }
            const result = {
                success: errors.length === 0,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors,
                duration: Date.now() - startTime,
                nextSyncToken: response.data.paging?.next?.after
            };
            this.emit('deals_sync_completed', result);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors: [{ record: 'sync', error: error instanceof Error ? error.message : 'Sync failed' }],
                duration: Date.now() - startTime
            };
            this.emit('deals_sync_failed', result);
            return result;
        }
    }
    /**
     * CONTACTS DATA ADAPTER
     */
    async syncContactsData() {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsUpdated = 0;
        let recordsCreated = 0;
        const errors = [];
        try {
            const syncToken = this.syncTokens.get('contacts');
            const url = '/crm/v3/objects/contacts';
            const params = {
                limit: this.syncConfig.batchSize,
                properties: [
                    'firstname', 'lastname', 'email', 'company', 'phone',
                    'lifecyclestage', 'lead_status', 'hs_lead_status',
                    'createdate', 'lastmodifieddate', 'hs_analytics_source',
                    'jobtitle', 'industry', 'hs_persona'
                ],
                associations: ['companies', 'deals']
            };
            if (syncToken) {
                params.after = syncToken;
            }
            const response = await this.httpClient.get(url, { params });
            const contacts = response.data.results || [];
            for (const contact of contacts) {
                try {
                    const transformedContact = this.transformContactRecord(contact);
                    const cacheKey = `contact_${contact.id}`;
                    const existing = this.dataCache.get(cacheKey);
                    if (existing) {
                        if (existing.updatedAt !== transformedContact.updatedAt) {
                            this.dataCache.set(cacheKey, transformedContact);
                            recordsUpdated++;
                            this.emit('contact_updated', transformedContact);
                        }
                    }
                    else {
                        this.dataCache.set(cacheKey, transformedContact);
                        recordsCreated++;
                        this.emit('contact_created', transformedContact);
                    }
                    recordsProcessed++;
                }
                catch (error) {
                    errors.push({
                        record: contact.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            if (response.data.paging?.next?.after) {
                this.syncTokens.set('contacts', response.data.paging.next.after);
            }
            const result = {
                success: errors.length === 0,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors,
                duration: Date.now() - startTime,
                nextSyncToken: response.data.paging?.next?.after
            };
            this.emit('contacts_sync_completed', result);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors: [{ record: 'sync', error: error instanceof Error ? error.message : 'Sync failed' }],
                duration: Date.now() - startTime
            };
            this.emit('contacts_sync_failed', result);
            return result;
        }
    }
    /**
     * COMPANIES DATA ADAPTER
     */
    async syncCompaniesData() {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsUpdated = 0;
        let recordsCreated = 0;
        const errors = [];
        try {
            const syncToken = this.syncTokens.get('companies');
            const url = '/crm/v3/objects/companies';
            const params = {
                limit: this.syncConfig.batchSize,
                properties: [
                    'name', 'domain', 'industry', 'city', 'state', 'country',
                    'numberofemployees', 'annualrevenue', 'lifecyclestage',
                    'createdate', 'hs_lastmodifieddate', 'type', 'description'
                ],
                associations: ['contacts', 'deals']
            };
            if (syncToken) {
                params.after = syncToken;
            }
            const response = await this.httpClient.get(url, { params });
            const companies = response.data.results || [];
            for (const company of companies) {
                try {
                    const transformedCompany = this.transformCompanyRecord(company);
                    const cacheKey = `company_${company.id}`;
                    const existing = this.dataCache.get(cacheKey);
                    if (existing) {
                        if (existing.updatedAt !== transformedCompany.updatedAt) {
                            this.dataCache.set(cacheKey, transformedCompany);
                            recordsUpdated++;
                            this.emit('company_updated', transformedCompany);
                        }
                    }
                    else {
                        this.dataCache.set(cacheKey, transformedCompany);
                        recordsCreated++;
                        this.emit('company_created', transformedCompany);
                    }
                    recordsProcessed++;
                }
                catch (error) {
                    errors.push({
                        record: company.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            if (response.data.paging?.next?.after) {
                this.syncTokens.set('companies', response.data.paging.next.after);
            }
            const result = {
                success: errors.length === 0,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors,
                duration: Date.now() - startTime
            };
            this.emit('companies_sync_completed', result);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors: [{ record: 'sync', error: error instanceof Error ? error.message : 'Sync failed' }],
                duration: Date.now() - startTime
            };
            this.emit('companies_sync_failed', result);
            return result;
        }
    }
    /**
     * MARKETING DATA ADAPTER
     */
    async syncMarketingData() {
        const startTime = Date.now();
        let recordsProcessed = 0;
        let recordsUpdated = 0;
        let recordsCreated = 0;
        const errors = [];
        try {
            // Sync email campaigns
            const campaignsResult = await this.syncEmailCampaigns();
            recordsProcessed += campaignsResult.recordsProcessed;
            recordsUpdated += campaignsResult.recordsUpdated;
            recordsCreated += campaignsResult.recordsCreated;
            errors.push(...campaignsResult.errors);
            // Sync marketing analytics
            const analyticsResult = await this.syncMarketingAnalytics();
            recordsProcessed += analyticsResult.recordsProcessed;
            recordsUpdated += analyticsResult.recordsUpdated;
            recordsCreated += analyticsResult.recordsCreated;
            errors.push(...analyticsResult.errors);
            const result = {
                success: errors.length === 0,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors,
                duration: Date.now() - startTime
            };
            this.emit('marketing_sync_completed', result);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                recordsProcessed,
                recordsUpdated,
                recordsCreated,
                errors: [{ record: 'sync', error: error instanceof Error ? error.message : 'Marketing sync failed' }],
                duration: Date.now() - startTime
            };
            this.emit('marketing_sync_failed', result);
            return result;
        }
    }
    /**
     * GET AGGREGATED DATA FOR TRINITY AGENTS
     */
    async getAggregatedDataForOracle() {
        return {
            deals: Array.from(this.dataCache.entries())
                .filter(([key]) => key.startsWith('deal_'))
                .map(([, value]) => value),
            contacts: Array.from(this.dataCache.entries())
                .filter(([key]) => key.startsWith('contact_'))
                .map(([, value]) => value),
            companies: Array.from(this.dataCache.entries())
                .filter(([key]) => key.startsWith('company_'))
                .map(([, value]) => value),
            lastUpdated: new Date().toISOString()
        };
    }
    async getAggregatedDataForSentinel() {
        const apiMetrics = this.calculateAPIMetrics();
        const dataQuality = await this.assessDataQuality();
        const pipelineHealth = this.analyzePipelineHealth();
        return {
            apiMetrics,
            dataQuality,
            pipelineHealth,
            lastUpdated: new Date().toISOString()
        };
    }
    async getAggregatedDataForSage() {
        const customerSegments = this.analyzeCustomerSegments();
        const marketTrends = this.identifyMarketTrends();
        const competitiveAnalysis = this.performCompetitiveAnalysis();
        const opportunityMatrix = this.buildOpportunityMatrix();
        return {
            customerSegments,
            marketTrends,
            competitiveAnalysis,
            opportunityMatrix,
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * DATA TRANSFORMATION METHODS
     */
    transformDealRecord(deal) {
        return {
            id: deal.id,
            name: deal.properties.dealname,
            amount: parseFloat(deal.properties.amount) || 0,
            stage: deal.properties.dealstage,
            pipeline: deal.properties.pipeline,
            closeDate: deal.properties.closedate,
            probability: parseFloat(deal.properties.hs_deal_stage_probability) || 0,
            ownerId: deal.properties.hubspot_owner_id,
            dealType: deal.properties.dealtype,
            source: deal.properties.hs_analytics_source,
            createdAt: deal.createdAt,
            updatedAt: deal.updatedAt,
            archived: deal.archived || false
        };
    }
    transformContactRecord(contact) {
        return {
            id: contact.id,
            firstName: contact.properties.firstname,
            lastName: contact.properties.lastname,
            email: contact.properties.email,
            company: contact.properties.company,
            phone: contact.properties.phone,
            lifecycleStage: contact.properties.lifecyclestage,
            leadStatus: contact.properties.lead_status || contact.properties.hs_lead_status,
            jobTitle: contact.properties.jobtitle,
            industry: contact.properties.industry,
            persona: contact.properties.hs_persona,
            source: contact.properties.hs_analytics_source,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
            archived: contact.archived || false
        };
    }
    transformCompanyRecord(company) {
        return {
            id: company.id,
            name: company.properties.name,
            domain: company.properties.domain,
            industry: company.properties.industry,
            city: company.properties.city,
            state: company.properties.state,
            country: company.properties.country,
            employeeCount: parseInt(company.properties.numberofemployees) || 0,
            annualRevenue: parseFloat(company.properties.annualrevenue) || 0,
            lifecycleStage: company.properties.lifecyclestage,
            type: company.properties.type,
            description: company.properties.description,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
            archived: company.archived || false
        };
    }
    /**
     * PERIODIC SYNC MANAGEMENT
     */
    startPeriodicSync() {
        if (this.syncConfig.enableRealTimeSync) {
            // Deals sync
            this.syncIntervals.set('deals', setInterval(async () => {
                try {
                    await this.syncDealsData();
                }
                catch (error) {
                    this.emit('sync_error', { type: 'deals', error });
                }
            }, this.syncConfig.syncInterval));
            // Contacts sync
            this.syncIntervals.set('contacts', setInterval(async () => {
                try {
                    await this.syncContactsData();
                }
                catch (error) {
                    this.emit('sync_error', { type: 'contacts', error });
                }
            }, this.syncConfig.syncInterval));
            // Companies sync
            this.syncIntervals.set('companies', setInterval(async () => {
                try {
                    await this.syncCompaniesData();
                }
                catch (error) {
                    this.emit('sync_error', { type: 'companies', error });
                }
            }, this.syncConfig.syncInterval * 2)); // Less frequent
            // Marketing sync
            this.syncIntervals.set('marketing', setInterval(async () => {
                try {
                    await this.syncMarketingData();
                }
                catch (error) {
                    this.emit('sync_error', { type: 'marketing', error });
                }
            }, this.syncConfig.syncInterval * 3)); // Even less frequent
        }
    }
    /**
     * UTILITY METHODS
     */
    async checkRateLimit() {
        const now = Date.now();
        // Check daily limit
        if (this.rateLimitState.daily.remaining <= 0 && now < this.rateLimitState.daily.resetTime) {
            const waitTime = this.rateLimitState.daily.resetTime - now;
            await this.delay(waitTime);
        }
        // Check burst limit
        if (this.rateLimitState.burst.remaining <= 0 && now < this.rateLimitState.burst.resetTime) {
            const waitTime = this.rateLimitState.burst.resetTime - now;
            await this.delay(waitTime);
        }
    }
    updateRateLimitState(headers) {
        const now = Date.now();
        if (headers['x-hubspot-ratelimit-daily-remaining']) {
            this.rateLimitState.daily.remaining = parseInt(headers['x-hubspot-ratelimit-daily-remaining']);
        }
        if (headers['x-hubspot-ratelimit-secondly-remaining']) {
            this.rateLimitState.burst.remaining = parseInt(headers['x-hubspot-ratelimit-secondly-remaining']);
            this.rateLimitState.burst.resetTime = now + 1000; // Reset in 1 second
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Stub methods for analysis (would be implemented with actual business logic)
    async syncEmailCampaigns() {
        return { success: true, recordsProcessed: 0, recordsUpdated: 0, recordsCreated: 0, errors: [], duration: 0 };
    }
    async syncMarketingAnalytics() {
        return { success: true, recordsProcessed: 0, recordsUpdated: 0, recordsCreated: 0, errors: [], duration: 0 };
    }
    calculateAPIMetrics() { return { responseTime: [500], errorRate: 0.01, throughput: 100 }; }
    async assessDataQuality() { return { duplicateContacts: 5, incompleteRecords: 10, staleData: 15 }; }
    analyzePipelineHealth() { return { stageDistribution: {}, conversionRates: {}, velocityTrends: [] }; }
    analyzeCustomerSegments() { return []; }
    identifyMarketTrends() { return []; }
    performCompetitiveAnalysis() { return []; }
    buildOpportunityMatrix() { return []; }
    /**
     * Cleanup resources
     */
    cleanup() {
        // Clear all sync intervals
        for (const [key, interval] of this.syncIntervals) {
            clearInterval(interval);
        }
        this.syncIntervals.clear();
        // Clear cache
        this.dataCache.clear();
        this.syncTokens.clear();
        this.emit('adapter_cleanup_complete');
    }
}
exports.HubSpotDataAdapter = HubSpotDataAdapter;
//# sourceMappingURL=hubspot-data-adapter.js.map