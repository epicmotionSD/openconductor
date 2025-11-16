import { 
  SearchRequest, 
  SearchResponse, 
  SearchResult,
  ServerSummary,
  ServerCategory,
  CACHE_TTL
} from '@openconductor/shared';
import { mcpServerRepository } from '../db/models';
import { cache } from '../db/connection';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Perform full-text search across MCP servers
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    try {
      // Use repository search with caching
      const response = await mcpServerRepository.search(request);

      // Enhance results with search suggestions
      if (response.results.length === 0 && request.q) {
        response.suggestions = await this.generateSearchSuggestions(request.q);
      }

      return response;
    } catch (error) {
      logger.error('Error performing search', { request, error });
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for search queries
   */
  async getAutocomplete(query: string, limit: number = 5): Promise<string[]> {
    const cacheKey = cache.generateKey('autocomplete', query.toLowerCase());
    const cached = await cache.get<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const suggestions = await this.generateAutocomplete(query, limit);
      await cache.set(cacheKey, suggestions, CACHE_TTL.SEARCH_RESULTS);
      return suggestions;
    } catch (error) {
      logger.error('Error generating autocomplete', { query, error });
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit: number = 10): Promise<string[]> {
    const cacheKey = cache.generateKey('popular-searches');
    const cached = await cache.get<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // TODO: Get from search analytics/logs
      const popularTerms = [
        'memory',
        'database',
        'filesystem',
        'github',
        'search',
        'api',
        'slack',
        'postgres',
        'mongodb',
        'google'
      ];

      await cache.set(cacheKey, popularTerms, CACHE_TTL.STATS);
      return popularTerms.slice(0, limit);
    } catch (error) {
      logger.error('Error getting popular search terms', error);
      return [];
    }
  }

  /**
   * Log search query for analytics
   */
  async logSearch(query: string, results: number, userId?: string): Promise<void> {
    try {
      // TODO: Store search analytics for improving search and suggestions
      logger.info('Search logged', { 
        query: query.substring(0, 100), // Truncate for privacy
        results, 
        userId: userId ? 'logged_in' : 'anonymous'
      });
    } catch (error) {
      logger.warn('Error logging search', error);
      // Don't throw - this is analytics, not critical
    }
  }

  /**
   * Search within a specific category
   */
  async searchInCategory(
    category: ServerCategory, 
    query: string, 
    limit: number = 10
  ): Promise<SearchResult[]> {
    const request: SearchRequest = {
      q: query,
      filters: {
        category: [category],
        verified: true
      },
      limit
    };

    const response = await this.search(request);
    return response.results;
  }

  /**
   * Find similar servers based on tags and category
   */
  async findSimilar(serverId: string, limit: number = 5): Promise<ServerSummary[]> {
    const cacheKey = cache.generateKey('similar', serverId);
    const cached = await cache.get<ServerSummary[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get the reference server
      const server = await mcpServerRepository.findById(serverId);
      if (!server) {
        return [];
      }

      // Search for servers in same category with overlapping tags
      const request: SearchRequest = {
        q: server.tags.join(' '),
        filters: {
          category: [server.category],
          verified: true
        },
        limit: limit + 1 // +1 to account for excluding the original server
      };

      const response = await this.search(request);
      
      // Filter out the original server and limit results
      const similar = response.results
        .map(r => r.server)
        .filter(s => s.id !== serverId)
        .slice(0, limit);

      await cache.set(cacheKey, similar, CACHE_TTL.SERVER_DETAIL);
      return similar;
    } catch (error) {
      logger.error('Error finding similar servers', { serverId, error });
      return [];
    }
  }

  /**
   * Get search filters with counts
   */
  async getSearchFilters(): Promise<{
    categories: { name: ServerCategory; count: number }[];
    tags: { name: string; count: number }[];
  }> {
    const cacheKey = cache.generateKey('search-filters');
    const cached = await cache.get<{
      categories: { name: ServerCategory; count: number }[];
      tags: { name: string; count: number }[];
    }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get category counts
      const categoryResult = await mcpServerRepository.list({ 
        limit: 1000, 
        verified: true 
      });
      
      const categoryCounts = categoryResult.filters.availableCategories.map(c => ({
        name: c.category,
        count: c.count
      }));

      const tagCounts = categoryResult.filters.availableTags.map(t => ({
        name: t.tag,
        count: t.count
      }));

      const filters = {
        categories: categoryCounts,
        tags: tagCounts.slice(0, 20) // Top 20 tags
      };

      await cache.set(cacheKey, filters, CACHE_TTL.STATS);
      return filters;
    } catch (error) {
      logger.error('Error getting search filters', error);
      return {
        categories: [],
        tags: []
      };
    }
  }

  // Private helper methods

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Generate suggestions based on common typos and alternatives
    const queryLower = query.toLowerCase();
    
    // Common alternatives
    const alternatives: Record<string, string[]> = {
      'db': ['database', 'postgres', 'mongodb'],
      'fs': ['filesystem', 'files'],
      'mem': ['memory'],
      'ai': ['artificial intelligence', 'machine learning'],
      'ml': ['machine learning', 'ai'],
      'api': ['integration', 'service'],
      'chat': ['messaging', 'communication', 'slack'],
      'file': ['filesystem', 'storage'],
      'search': ['elasticsearch', 'indexing'],
      'git': ['github', 'version control'],
      'docker': ['container', 'deployment']
    };

    // Add alternatives for partial matches
    for (const [key, values] of Object.entries(alternatives)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        suggestions.push(...values);
      }
    }

    // Add popular terms similar to query
    const popularTerms = await this.getPopularSearchTerms(20);
    for (const term of popularTerms) {
      if (term.includes(queryLower) || queryLower.includes(term)) {
        suggestions.push(term);
      }
    }

    // Remove duplicates and limit
    return Array.from(new Set(suggestions)).slice(0, 5);
  }

  private async generateAutocomplete(query: string, limit: number): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Get server names that start with the query
    try {
      const searchResults = await mcpServerRepository.search({
        q: query,
        limit: limit * 2
      });

      // Extract potential completions from server names and tags
      for (const result of searchResults.results) {
        const server = result.server;
        
        // Add server name if it starts with query
        if (server.name.toLowerCase().startsWith(query.toLowerCase())) {
          suggestions.push(server.name);
        }

        // Add matching tags
        for (const tag of server.tags) {
          if (tag.toLowerCase().startsWith(query.toLowerCase())) {
            suggestions.push(tag);
          }
        }
      }
    } catch (error) {
      logger.warn('Error generating server-based autocomplete', error);
    }

    // Add category names that match
    const categories = [
      'memory', 'filesystem', 'database', 'api', 'search',
      'communication', 'monitoring', 'development', 'custom'
    ];
    
    for (const category of categories) {
      if (category.startsWith(query.toLowerCase())) {
        suggestions.push(category);
      }
    }

    // Remove duplicates, sort by relevance, and limit
    const unique = Array.from(new Set(suggestions));
    return unique
      .sort((a, b) => {
        // Prefer exact prefix matches
        const aStarts = a.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.toLowerCase().startsWith(query.toLowerCase());
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, limit);
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();