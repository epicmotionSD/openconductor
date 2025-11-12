import { 
  SearchRequest, 
  SearchResponse, 
  SearchResult,
  ServerSummary,
  CACHE_TTL
} from '@openconductor/shared';
import { db, cache } from '../db/connection';
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

/**
 * Advanced full-text search engine using PostgreSQL tsvector
 * Provides sophisticated search capabilities with ranking, highlighting, and suggestions
 */
export class SearchEngine {
  private static instance: SearchEngine;

  private constructor() {}

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * Perform advanced full-text search with ranking and highlighting
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const { q, filters, limit = 10 } = request;
    
    const cacheKey = cache.generateKey('advanced-search', JSON.stringify(request));
    const cached = await cache.get<SearchResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Build search query with sophisticated ranking
      const searchQuery = this.buildSearchQuery(q);
      
      let whereConditions = [`s.search_vector @@ to_tsquery('english', $1)`];
      let queryParams = [searchQuery];
      let paramIndex = 2;

      // Apply filters
      if (filters?.category && filters.category.length > 0) {
        whereConditions.push(`s.category = ANY($${paramIndex++}::server_category[])`);
        queryParams.push(filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        whereConditions.push(`s.tags && $${paramIndex++}::text[]`);
        queryParams.push(filters.tags);
      }

      if (filters?.verified !== undefined) {
        whereConditions.push(`s.verified = $${paramIndex++}`);
        queryParams.push(filters.verified);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Advanced search with multiple ranking factors
      const searchResults = await db.query(`
        SELECT 
          s.id, s.slug, s.name, s.tagline, s.description, s.category, s.tags,
          s.repository_url, s.repository_owner, s.repository_name,
          s.npm_package, s.docker_image, s.verified, s.featured,
          st.github_stars, st.cli_installs, st.github_last_commit_at,
          st.popularity_score, st.trending_score,
          
          -- Advanced ranking calculation
          (
            -- Base text search rank
            ts_rank_cd(s.search_vector, to_tsquery('english', $1), 32) * 1.0 +
            
            -- Boost for exact name matches
            CASE 
              WHEN LOWER(s.name) = LOWER($1) THEN 2.0
              WHEN LOWER(s.name) LIKE LOWER($1 || '%') THEN 1.5
              ELSE 0
            END +
            
            -- Boost for verified servers
            CASE WHEN s.verified THEN 0.5 ELSE 0 END +
            
            -- Boost for featured servers
            CASE WHEN s.featured THEN 0.3 ELSE 0 END +
            
            -- Popularity boost (normalized)
            COALESCE(st.popularity_score, 0) / 100 * 0.4 +
            
            -- Trending boost
            COALESCE(st.trending_score, 0) / 50 * 0.2 +
            
            -- Recent activity boost
            CASE 
              WHEN st.github_last_commit_at > NOW() - INTERVAL '30 days' THEN 0.2
              WHEN st.github_last_commit_at > NOW() - INTERVAL '90 days' THEN 0.1
              ELSE 0
            END
            
          ) as search_rank,
          
          -- Highlighted snippets
          ts_headline(
            'english', 
            COALESCE(s.description, ''), 
            to_tsquery('english', $1),
            'MaxFragments=2,MaxWords=20,MinWords=5,StartSel=<mark>,StopSel=</mark>'
          ) as description_highlight,
          
          ts_headline(
            'english', 
            s.name, 
            to_tsquery('english', $1),
            'StartSel=<mark>,StopSel=</mark>'
          ) as name_highlight
          
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        ${whereClause}
        ORDER BY search_rank DESC, st.popularity_score DESC NULLS LAST
        LIMIT $${paramIndex++}
      `, [...queryParams, limit]);

      // Transform results
      const results: SearchResult[] = searchResults.rows.map(row => ({
        server: this.transformToServerSummary(row),
        highlights: {
          name: row.name_highlight !== row.name ? row.name_highlight : undefined,
          description: row.description_highlight !== row.description ? row.description_highlight : undefined,
          tags: this.highlightTags(row.tags, q)
        },
        score: parseFloat(row.search_rank)
      }));

      // Get search suggestions if no results or few results
      const suggestions = results.length < 3 ? await this.generateSearchSuggestions(q) : [];

      // Get total count for pagination
      const countResult = await db.query(`
        SELECT COUNT(*) as total
        FROM mcp_servers s
        ${whereClause}
      `, queryParams.slice(0, -1)); // Remove limit parameter

      const response: SearchResponse = {
        results,
        suggestions,
        total: parseInt(countResult.rows[0].total)
      };

      await cache.set(cacheKey, response, CACHE_TTL.SEARCH_RESULTS);
      return response;

    } catch (error) {
      logger.error('Search failed', { request, error: error.message });
      throw error;
    }
  }

  /**
   * Get search autocomplete suggestions
   */
  async getAutocomplete(query: string, limit = 5): Promise<string[]> {
    const cacheKey = cache.generateKey('autocomplete', query.toLowerCase());
    const cached = await cache.get<string[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const suggestions = new Set<string>();

      // 1. Server name completions
      const nameResults = await db.query(`
        SELECT name, slug
        FROM mcp_servers
        WHERE 
          (LOWER(name) LIKE LOWER($1 || '%') OR LOWER(slug) LIKE LOWER($1 || '%'))
          AND verified = true
        ORDER BY popularity_score DESC NULLS LAST
        LIMIT 10
      `, [query]);

      nameResults.rows.forEach(row => {
        if (row.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(row.name);
        }
        if (row.slug.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(row.slug);
        }
      });

      // 2. Tag completions
      const tagResults = await db.query(`
        SELECT DISTINCT UNNEST(tags) as tag
        FROM mcp_servers
        WHERE UNNEST(tags) ILIKE $1 || '%'
          AND verified = true
        LIMIT 10
      `, [query]);

      tagResults.rows.forEach(row => {
        suggestions.add(row.tag);
      });

      // 3. Category completions
      const categories = [
        'memory', 'filesystem', 'database', 'api', 'search',
        'communication', 'monitoring', 'development', 'custom'
      ];
      
      categories.forEach(category => {
        if (category.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(category);
        }
      });

      // 4. Common search terms
      const commonTerms = [
        'semantic memory', 'file operations', 'database queries', 'api integration',
        'web search', 'team chat', 'system monitoring', 'development tools'
      ];

      commonTerms.forEach(term => {
        if (term.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(term);
        }
      });

      const finalSuggestions = Array.from(suggestions)
        .sort((a, b) => {
          // Prioritize exact prefix matches
          const aExact = a.toLowerCase().startsWith(query.toLowerCase());
          const bExact = b.toLowerCase().startsWith(query.toLowerCase());
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.length - b.length; // Shorter suggestions first
        })
        .slice(0, limit);

      await cache.set(cacheKey, finalSuggestions, CACHE_TTL.SEARCH_RESULTS);
      return finalSuggestions;

    } catch (error) {
      logger.error('Autocomplete failed', { query, error: error.message });
      return [];
    }
  }

  /**
   * Search within specific categories with category-specific ranking
   */
  async searchInCategory(
    category: string, 
    query: string, 
    limit = 10
  ): Promise<SearchResult[]> {
    try {
      const request: SearchRequest = {
        q: query,
        filters: {
          category: [category as any],
          verified: true
        },
        limit
      };

      const response = await this.search(request);
      return response.results;

    } catch (error) {
      logger.error('Category search failed', { category, query, error });
      return [];
    }
  }

  /**
   * Find similar servers based on content similarity
   */
  async findSimilar(serverId: string, limit = 5): Promise<ServerSummary[]> {
    const cacheKey = cache.generateKey('similar-servers', serverId);
    const cached = await cache.get<ServerSummary[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get reference server
      const refResult = await db.query(`
        SELECT name, description, tags, category, search_vector
        FROM mcp_servers 
        WHERE id = $1
      `, [serverId]);

      if (refResult.rows.length === 0) {
        return [];
      }

      const refServer = refResult.rows[0];

      // Find similar servers using vector similarity and content matching
      const similarResults = await db.query(`
        SELECT 
          s.id, s.slug, s.name, s.tagline, s.category, s.tags,
          s.repository_url, s.repository_owner, s.repository_name,
          s.npm_package, s.docker_image, s.verified, s.featured,
          st.github_stars, st.cli_installs, st.github_last_commit_at,
          
          -- Similarity score calculation
          (
            -- Text vector similarity
            ts_rank(s.search_vector, to_tsquery('english', $2), 2) * 2.0 +
            
            -- Category match bonus
            CASE WHEN s.category = $3 THEN 1.0 ELSE 0 END +
            
            -- Tag overlap bonus
            (
              SELECT COUNT(*)
              FROM UNNEST($4::text[]) AS ref_tag
              WHERE ref_tag = ANY(s.tags)
            ) * 0.3 +
            
            -- Popularity similarity bonus (avoid only suggesting popular servers)
            CASE 
              WHEN st.popularity_score BETWEEN $5 - 20 AND $5 + 20 THEN 0.2
              ELSE 0
            END
            
          ) as similarity_score
          
        FROM mcp_servers s
        LEFT JOIN server_stats st ON s.id = st.server_id
        WHERE s.id != $1
          AND s.verified = true
        ORDER BY similarity_score DESC
        LIMIT $6
      `, [
        serverId,
        this.buildSimilarityQuery(refServer.name, refServer.description),
        refServer.category,
        refServer.tags,
        await this.getServerPopularityScore(serverId),
        limit
      ]);

      const similarServers = similarResults.rows.map(this.transformToServerSummary);
      
      await cache.set(cacheKey, similarServers, CACHE_TTL.SERVER_DETAIL);
      return similarServers;

    } catch (error) {
      logger.error('Similar server search failed', { serverId, error: error.message });
      return [];
    }
  }

  /**
   * Get search analytics and insights
   */
  async getSearchAnalytics(): Promise<{
    topQueries: Array<{ query: string; count: number }>;
    popularFilters: Array<{ filter: string; value: string; count: number }>;
    searchVolume: { total: number; trend: number };
  }> {
    const cacheKey = cache.generateKey('search-analytics');
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // This would be implemented with proper search logging
      // For now, return mock data based on our server registry
      const analytics = {
        topQueries: [
          { query: 'memory', count: 156 },
          { query: 'database', count: 89 },
          { query: 'filesystem', count: 67 },
          { query: 'github', count: 45 },
          { query: 'search', count: 34 }
        ],
        popularFilters: [
          { filter: 'category', value: 'memory', count: 89 },
          { filter: 'category', value: 'database', count: 56 },
          { filter: 'verified', value: 'true', count: 234 },
          { filter: 'tags', value: 'semantic', count: 23 }
        ],
        searchVolume: {
          total: 1247,
          trend: 15.3 // +15.3% vs last period
        }
      };

      await cache.set(cacheKey, analytics, CACHE_TTL.STATS);
      return analytics;

    } catch (error) {
      logger.error('Failed to get search analytics', error);
      return { topQueries: [], popularFilters: [], searchVolume: { total: 0, trend: 0 } };
    }
  }

  /**
   * Update search indexes and optimize performance
   */
  async rebuildSearchIndexes(): Promise<void> {
    try {
      logger.info('Rebuilding search indexes');

      // Update search vectors for all servers
      await db.query(`
        UPDATE mcp_servers SET updated_at = NOW()
        WHERE search_vector IS NULL OR updated_at < NOW() - INTERVAL '1 day'
      `);

      // Refresh materialized views if any
      // await db.query('REFRESH MATERIALIZED VIEW server_search_view');

      // Update search statistics
      await db.query(`
        ANALYZE mcp_servers;
        ANALYZE server_stats;
      `);

      logger.info('Search indexes rebuilt successfully');

    } catch (error) {
      logger.error('Failed to rebuild search indexes', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on query analysis
   */
  async generateSearchSuggestions(query: string): Promise<string[]> {
    try {
      const suggestions = new Set<string>();

      // 1. Spell correction suggestions
      const spellingSuggestions = await this.getSpellingSuggestions(query);
      spellingSuggestions.forEach(s => suggestions.add(s));

      // 2. Query expansion based on synonyms
      const expansions = this.expandQuery(query);
      expansions.forEach(s => suggestions.add(s));

      // 3. Popular related queries
      const relatedQueries = await this.getRelatedQueries(query);
      relatedQueries.forEach(s => suggestions.add(s));

      // 4. Category suggestions
      if (query.length > 2) {
        const categories = ['memory', 'database', 'filesystem', 'api', 'search'];
        categories.forEach(cat => {
          if (cat.includes(query.toLowerCase()) || query.toLowerCase().includes(cat)) {
            suggestions.add(cat);
          }
        });
      }

      return Array.from(suggestions)
        .filter(s => s.toLowerCase() !== query.toLowerCase())
        .slice(0, 5);

    } catch (error) {
      logger.error('Failed to generate suggestions', { query, error });
      return [];
    }
  }

  // Private helper methods

  /**
   * Build sophisticated search query with operators and boosting
   */
  private buildSearchQuery(query: string): string {
    if (!query) {
      return '';
    }

    // Clean and tokenize query
    const tokens = query
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
      .split(/\s+/)
      .filter(token => token.length > 1);

    if (tokens.length === 0) {
      return '';
    }

    // Build query with different strategies based on token count
    if (tokens.length === 1) {
      // Single word: use prefix matching and stemming
      const token = tokens[0];
      return `${token}:* | ${token}`;
    } else {
      // Multiple words: use phrase search and AND/OR combinations
      const exactPhrase = tokens.join(' <-> ');
      const anyWords = tokens.join(' | ');
      const allWords = tokens.join(' & ');
      
      // Prioritize: exact phrase > all words > any words
      return `(${exactPhrase}) | (${allWords}) | (${anyWords})`;
    }
  }

  /**
   * Build similarity query for finding related servers
   */
  private buildSimilarityQuery(name: string, description: string): string {
    const words = new Set([
      ...name.toLowerCase().split(/\s+/),
      ...description.toLowerCase().split(/\s+/)
    ]);

    // Remove common words and short words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'from']);
    const meaningfulWords = Array.from(words)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to most important words

    return meaningfulWords.join(' | ');
  }

  /**
   * Highlight matching tags
   */
  private highlightTags(tags: string[], query: string): string[] | undefined {
    if (!tags || !query) {
      return undefined;
    }

    const queryLower = query.toLowerCase();
    const highlightedTags = tags
      .filter(tag => tag.toLowerCase().includes(queryLower))
      .map(tag => {
        const regex = new RegExp(`(${queryLower})`, 'gi');
        return tag.replace(regex, '<mark>$1</mark>');
      });

    return highlightedTags.length > 0 ? highlightedTags : undefined;
  }

  /**
   * Get spelling suggestions using edit distance
   */
  private async getSpellingSuggestions(query: string): Promise<string[]> {
    try {
      // Get all server names and common terms
      const termsResult = await db.query(`
        SELECT DISTINCT name, UNNEST(tags) as tag
        FROM mcp_servers
        WHERE verified = true
        LIMIT 1000
      `);

      const terms = [
        ...termsResult.rows.map(r => r.name.toLowerCase()),
        ...termsResult.rows.map(r => r.tag.toLowerCase())
      ];

      // Find terms with small edit distance
      const suggestions = terms
        .filter(term => this.editDistance(query.toLowerCase(), term) <= 2)
        .filter(term => term !== query.toLowerCase())
        .slice(0, 3);

      return suggestions;

    } catch (error) {
      logger.debug('Spelling suggestions failed', error);
      return [];
    }
  }

  /**
   * Expand query with synonyms and related terms
   */
  private expandQuery(query: string): string[] {
    const expansions: Record<string, string[]> = {
      'db': ['database', 'postgres', 'mongodb', 'sql'],
      'fs': ['filesystem', 'files', 'storage'],
      'mem': ['memory', 'storage', 'persistence'],
      'ai': ['artificial intelligence', 'machine learning', 'neural'],
      'ml': ['machine learning', 'ai', 'model'],
      'api': ['integration', 'service', 'rest', 'graphql'],
      'chat': ['messaging', 'communication', 'slack', 'discord'],
      'file': ['filesystem', 'storage', 'document'],
      'search': ['elasticsearch', 'indexing', 'query'],
      'git': ['github', 'version control', 'repository'],
      'docker': ['container', 'deployment', 'image']
    };

    const queryLower = query.toLowerCase();
    const suggestions: string[] = [];

    for (const [key, values] of Object.entries(expansions)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        suggestions.push(...values);
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Get related queries based on co-search patterns
   */
  private async getRelatedQueries(query: string): Promise<string[]> {
    // This would be implemented with search log analysis
    // For now, return category-based suggestions
    try {
      const categoryQueries: Record<string, string[]> = {
        'memory': ['semantic search', 'persistent storage', 'context management'],
        'database': ['sql queries', 'data management', 'schema operations'],
        'filesystem': ['file operations', 'document management', 'storage'],
        'api': ['web services', 'integrations', 'external apis'],
        'search': ['full text search', 'indexing', 'elasticsearch']
      };

      const queryLower = query.toLowerCase();
      for (const [category, queries] of Object.entries(categoryQueries)) {
        if (queryLower.includes(category)) {
          return queries.slice(0, 3);
        }
      }

      return [];

    } catch (error) {
      logger.debug('Related queries failed', error);
      return [];
    }
  }

  /**
   * Calculate edit distance between two strings
   */
  private editDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Get server popularity score from database
   */
  private async getServerPopularityScore(serverId: string): Promise<number> {
    try {
      const result = await db.query(
        'SELECT popularity_score FROM server_stats WHERE server_id = $1',
        [serverId]
      );
      
      return result.rows.length > 0 ? result.rows[0].popularity_score || 0 : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Transform database row to ServerSummary
   */
  private transformToServerSummary(row: any): ServerSummary {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      category: row.category,
      tags: row.tags || [],
      repository: {
        url: row.repository_url,
        owner: row.repository_owner,
        name: row.repository_name
      },
      stats: {
        stars: row.github_stars || 0,
        installs: row.cli_installs || 0,
        lastCommit: row.github_last_commit_at || new Date().toISOString()
      },
      installation: {
        npm: row.npm_package ? `npm install -g ${row.npm_package}` : undefined,
        docker: row.docker_image ? `docker pull ${row.docker_image}` : undefined
      },
      verified: row.verified,
      featured: row.featured
    };
  }
}

// Export singleton instance
export const searchEngine = SearchEngine.getInstance();