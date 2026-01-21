// Apify Service - Core client for Apify actor integration
// Provides access to Google Trends, SERP scraping, and social listening

import { Pool } from 'pg';

// Apify Actor IDs
const ACTORS = {
  GOOGLE_TRENDS: 'apify/google-trends-scraper',
  GOOGLE_SEARCH: 'apify/google-search-scraper',
  INSTAGRAM_HASHTAG: 'apify/instagram-hashtag-scraper',
  TIKTOK_HASHTAG: 'clockworks/tiktok-hashtag-scraper'
};

// Types
export interface ApifyConfig {
  token: string;
  baseUrl?: string;
}

export interface ActorRunInput {
  actorId: string;
  input: Record<string, any>;
  options?: {
    memory?: number;
    timeout?: number;
    waitForFinish?: number;
  };
}

export interface ActorRunResult {
  id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT';
  datasetId?: string;
  data?: any[];
}

export interface GoogleTrendsInput {
  searchTerms: string[];
  geo?: string;
  timeRange?: string;
  category?: string;
}

export interface GoogleTrendsResult {
  term: string;
  timelineData: Array<{
    time: string;
    value: number;
    formattedTime: string;
  }>;
  relatedQueries: {
    top: Array<{ query: string; value: number }>;
    rising: Array<{ query: string; value: string }>;
  };
  relatedTopics: {
    top: Array<{ topic: { title: string }; value: number }>;
    rising: Array<{ topic: { title: string }; value: string }>;
  };
}

export interface GoogleSearchInput {
  queries: string[];
  maxPagesPerQuery?: number;
  resultsPerPage?: number;
  languageCode?: string;
  locationUule?: string;
  mobileResults?: boolean;
}

export interface GoogleSearchResult {
  query: string;
  organicResults: Array<{
    position: number;
    title: string;
    url: string;
    description: string;
  }>;
  paidResults: Array<{
    position: number;
    title: string;
    url: string;
    description: string;
    displayedUrl: string;
  }>;
  relatedSearches: string[];
  peopleAlsoAsk: string[];
}

export class ApifyService {
  private static instance: ApifyService;
  private config: ApifyConfig;
  private pool: Pool;
  private baseUrl: string;

  private constructor(pool: Pool, config: ApifyConfig) {
    this.pool = pool;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.apify.com/v2';
  }

  static getInstance(pool: Pool, config?: ApifyConfig): ApifyService {
    if (!ApifyService.instance) {
      const apifyConfig: ApifyConfig = config || {
        token: process.env.APIFY_TOKEN || ''
      };
      ApifyService.instance = new ApifyService(pool, apifyConfig);
    }
    return ApifyService.instance;
  }

  // ============================================
  // CORE API METHODS
  // ============================================

  /**
   * Run an Apify actor and wait for results
   */
  async runActor(input: ActorRunInput): Promise<ActorRunResult> {
    const { actorId, input: actorInput, options } = input;

    // Start the actor run
    const runResponse = await this.apiRequest(
      `acts/${actorId}/runs`,
      'POST',
      actorInput,
      {
        memory: options?.memory || 1024,
        timeout: options?.timeout || 300
      }
    );

    const runId = runResponse.data.id;

    // Wait for completion
    const waitTime = options?.waitForFinish || 60000; // Default 60 seconds
    const result = await this.waitForRun(runId, waitTime);

    // Get dataset items if successful
    if (result.status === 'SUCCEEDED' && result.datasetId) {
      const datasetItems = await this.getDatasetItems(result.datasetId);
      result.data = datasetItems;
    }

    return result;
  }

  /**
   * Wait for an actor run to complete
   */
  private async waitForRun(runId: string, maxWaitMs: number): Promise<ActorRunResult> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitMs) {
      const response = await this.apiRequest(`actor-runs/${runId}`, 'GET');
      const run = response.data;

      if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
        return {
          id: run.id,
          status: run.status,
          datasetId: run.defaultDatasetId
        };
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      id: runId,
      status: 'TIMED-OUT'
    };
  }

  /**
   * Get items from a dataset
   */
  async getDatasetItems(datasetId: string, limit?: number): Promise<any[]> {
    const params: Record<string, any> = { clean: true };
    if (limit) params.limit = limit;

    const response = await this.apiRequest(
      `datasets/${datasetId}/items`,
      'GET',
      undefined,
      params
    );

    return response;
  }

  /**
   * Make an API request to Apify
   */
  private async apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    params?: Record<string, any>
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // Add query params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Apify API request failed:', error);
      throw error;
    }
  }

  // ============================================
  // GOOGLE TRENDS METHODS
  // ============================================

  /**
   * Scrape Google Trends for keywords
   */
  async scrapeGoogleTrends(input: GoogleTrendsInput): Promise<GoogleTrendsResult[]> {
    const actorInput = {
      searchTerms: input.searchTerms,
      geo: input.geo || 'US',
      timeRange: input.timeRange || 'now 7-d',
      category: input.category || '0', // All categories
      isMultiple: input.searchTerms.length > 1,
      maxItems: 100,
      extendOutputFunction: '',
      proxyConfiguration: {
        useApifyProxy: true
      }
    };

    const result = await this.runActor({
      actorId: ACTORS.GOOGLE_TRENDS,
      input: actorInput,
      options: {
        memory: 1024,
        timeout: 300,
        waitForFinish: 120000
      }
    });

    if (result.status !== 'SUCCEEDED' || !result.data) {
      throw new Error(`Google Trends scrape failed: ${result.status}`);
    }

    // Store in database for caching
    await this.storeSignals(result.data, 'google_trends');

    return this.parseGoogleTrendsData(result.data);
  }

  /**
   * Parse Google Trends raw data into structured format
   */
  private parseGoogleTrendsData(rawData: any[]): GoogleTrendsResult[] {
    return rawData.map(item => ({
      term: item.searchTerm || item.term,
      timelineData: item.timelineData || [],
      relatedQueries: {
        top: item.relatedQueries?.top || [],
        rising: item.relatedQueries?.rising || []
      },
      relatedTopics: {
        top: item.relatedTopics?.top || [],
        rising: item.relatedTopics?.rising || []
      }
    }));
  }

  // ============================================
  // GOOGLE SEARCH/SERP METHODS
  // ============================================

  /**
   * Scrape Google Search results (SERP)
   */
  async scrapeGoogleSearch(input: GoogleSearchInput): Promise<GoogleSearchResult[]> {
    const actorInput = {
      queries: input.queries.join('\n'),
      maxPagesPerQuery: input.maxPagesPerQuery || 1,
      resultsPerPage: input.resultsPerPage || 10,
      languageCode: input.languageCode || 'en',
      locationUule: input.locationUule, // Location encoding for local results
      mobileResults: input.mobileResults || false,
      includeUnfilteredResults: false,
      saveHtml: false,
      saveHtmlToKeyValueStore: false,
      proxyConfiguration: {
        useApifyProxy: true
      }
    };

    const result = await this.runActor({
      actorId: ACTORS.GOOGLE_SEARCH,
      input: actorInput,
      options: {
        memory: 2048,
        timeout: 300,
        waitForFinish: 120000
      }
    });

    if (result.status !== 'SUCCEEDED' || !result.data) {
      throw new Error(`Google Search scrape failed: ${result.status}`);
    }

    // Store in database
    await this.storeSignals(result.data, 'serp');

    return this.parseGoogleSearchData(result.data);
  }

  /**
   * Parse Google Search raw data into structured format
   */
  private parseGoogleSearchData(rawData: any[]): GoogleSearchResult[] {
    return rawData.map(item => ({
      query: item.searchQuery?.term || item.query,
      organicResults: (item.organicResults || []).map((r: any, i: number) => ({
        position: i + 1,
        title: r.title,
        url: r.url,
        description: r.description || r.snippet
      })),
      paidResults: (item.paidResults || item.ads || []).map((r: any, i: number) => ({
        position: i + 1,
        title: r.title,
        url: r.url,
        description: r.description,
        displayedUrl: r.displayedUrl
      })),
      relatedSearches: item.relatedSearches || [],
      peopleAlsoAsk: (item.peopleAlsoAsk || []).map((q: any) => q.question || q)
    }));
  }

  // ============================================
  // LOCATION ENCODING
  // ============================================

  /**
   * Get UULE (location) code for a city
   * This encodes location for Google Search geotargeting
   */
  getLocationUule(city: string, state: string, country: string = 'United States'): string {
    // UULE format: w+CAIQICIHVGV4YXMsVW5pdGVkIFN0YXRlcw==
    // This is a simplified version - production would use proper encoding
    const location = `${city},${state},${country}`;
    const encoded = Buffer.from(location).toString('base64');
    return `w+CAIQICI${encoded}`;
  }

  /**
   * Get common Houston area location codes
   */
  getHoustonAreaLocations(): Record<string, string> {
    return {
      houston: this.getLocationUule('Houston', 'Texas'),
      katy: this.getLocationUule('Katy', 'Texas'),
      sugarLand: this.getLocationUule('Sugar Land', 'Texas'),
      pearland: this.getLocationUule('Pearland', 'Texas'),
      cypress: this.getLocationUule('Cypress', 'Texas'),
      woodlands: this.getLocationUule('The Woodlands', 'Texas'),
      humble: this.getLocationUule('Humble', 'Texas'),
      pasadena: this.getLocationUule('Pasadena', 'Texas')
    };
  }

  // ============================================
  // DATA STORAGE
  // ============================================

  /**
   * Store scraped data as revenue signals
   */
  private async storeSignals(data: any[], source: string): Promise<void> {
    try {
      for (const item of data) {
        await this.pool.query(`
          INSERT INTO revenue_signals (
            signal_type, source, keyword, title, description, data, confidence, urgency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          'trend',
          source,
          item.searchTerm || item.query || item.keyword,
          `${source} data: ${item.searchTerm || item.query}`,
          `Scraped from ${source}`,
          JSON.stringify(item),
          0.8,
          'medium'
        ]);
      }
    } catch (error) {
      console.error('Error storing signals:', error);
      // Don't throw - storage failure shouldn't block the scrape
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Check if Apify service is properly configured
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.config.token) {
      return { healthy: false, message: 'APIFY_TOKEN not configured' };
    }

    try {
      // Try to get user info to verify token
      const response = await this.apiRequest('users/me', 'GET');
      return {
        healthy: true,
        message: `Connected as: ${response.data?.username || 'unknown'}`
      };
    } catch (error: any) {
      return {
        healthy: false,
        message: `API error: ${error.message}`
      };
    }
  }
}

export default ApifyService;
