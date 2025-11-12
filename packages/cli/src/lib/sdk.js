import { ApiClient } from './api-client.js';

/**
 * OpenConductor SDK for programmatic access
 * This allows other tools and scripts to interact with the registry
 */
export class OpenConductorSDK {
  constructor(options = {}) {
    this.apiClient = new ApiClient(options.apiUrl);
    this.options = {
      timeout: options.timeout || 10000,
      retries: options.retries || 3,
      ...options
    };
  }

  // Server Discovery Methods
  async searchServers(query, options = {}) {
    return this.apiClient.searchServers({
      q: query,
      category: options.category,
      tags: options.tags,
      verified: options.verified,
      limit: options.limit || 20,
      sort: options.sort || 'popular'
    });
  }

  async getServer(identifier) {
    return this.apiClient.getServer(identifier);
  }

  async getTrendingServers(period = '7d', options = {}) {
    return this.apiClient.getTrending(period);
  }

  async getPopularServers(category, limit = 10) {
    return this.apiClient.getPopular(category, limit);
  }

  async getCategories() {
    return this.apiClient.getCategories();
  }

  // Server Information Methods
  async getServerDetails(slug) {
    return this.getServer(slug);
  }

  async getInstallConfig(slug) {
    return this.apiClient.getInstallConfig(slug);
  }

  async searchByCategory(category, query = '', limit = 10) {
    return this.apiClient.searchInCategory(category, query, limit);
  }

  // Utility Methods
  async validateServer(slug) {
    try {
      const server = await this.getServer(slug);
      return {
        valid: true,
        server,
        issues: []
      };
    } catch (error) {
      return {
        valid: false,
        server: null,
        issues: [error.message]
      };
    }
  }

  async getAutocompleteSuggestions(query, limit = 5) {
    return this.apiClient.getAutocomplete(query, limit);
  }

  // Batch Operations
  async getMultipleServers(slugs) {
    const results = await Promise.allSettled(
      slugs.map(slug => this.getServer(slug))
    );

    return {
      successful: results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value),
      failed: results
        .filter(r => r.status === 'rejected')
        .map(r => ({ error: r.reason.message }))
    };
  }

  async searchMultipleCategories(categories, query = '', limit = 5) {
    const results = await Promise.allSettled(
      categories.map(category => 
        this.searchByCategory(category, query, limit)
      )
    );

    const successfulResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    return {
      results: successfulResults.flat(),
      categories: categories,
      total: successfulResults.reduce((sum, result) => sum + result.length, 0)
    };
  }

  // Analytics and Stats
  async getRegistryStats() {
    // This would call a dedicated stats endpoint
    try {
      const [categories, trending, popular] = await Promise.all([
        this.getCategories(),
        this.getTrendingServers(),
        this.getPopularServers()
      ]);

      return {
        totalCategories: categories.categories.length,
        totalServers: categories.categories.reduce((sum, cat) => sum + cat.count, 0),
        trendingCount: trending.servers.length,
        popularCount: popular.servers.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get registry stats: ${error.message}`);
    }
  }

  // Configuration Helpers
  generateMCPConfig(servers) {
    const mcpConfig = {
      mcpServers: {}
    };

    servers.forEach((server, index) => {
      const port = 8080 + index; // Simple port allocation
      
      mcpConfig.mcpServers[server.slug] = {
        command: server.packages.npm ? 'npx' : 
                 server.packages.docker ? 'docker' : server.slug,
        args: server.packages.npm ? ['-y', server.packages.npm.name] :
              server.packages.docker ? ['run', '--rm', '-i', server.packages.docker.image] : [],
        env: {
          PORT: port.toString()
        }
      };
    });

    return mcpConfig;
  }

  // Filtering and Sorting Helpers
  filterServersByTags(servers, tags) {
    return servers.filter(server => 
      tags.some(tag => server.tags.includes(tag))
    );
  }

  sortServersByPopularity(servers) {
    return servers.sort((a, b) => {
      const aScore = a.stats?.popularity || 0;
      const bScore = b.stats?.popularity || 0;
      return bScore - aScore;
    });
  }

  sortServersByStars(servers) {
    return servers.sort((a, b) => {
      const aStars = a.repository?.stars || 0;
      const bStars = b.repository?.stars || 0;
      return bStars - aStars;
    });
  }

  // Health and Status
  async checkAPIHealth() {
    try {
      // Try to fetch categories as a health check
      await this.getCategories();
      return {
        healthy: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Error Handling with Retries
  async withRetry(operation, retries = this.options.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Factory function for creating SDK instance
 */
export function createSDK(options = {}) {
  return new OpenConductorSDK(options);
}

/**
 * Default SDK instance for convenience
 */
export const sdk = new OpenConductorSDK();

// Re-export for backward compatibility
export default OpenConductorSDK;