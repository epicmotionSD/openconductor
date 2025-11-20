import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8')
);

export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL || process.env.OPENCONDUCTOR_API_URL || 'https://www.openconductor.ai/api/v1';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent': `openconductor-cli/${pkg.version}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response) {
          // Server responded with error
          const message = error.response.data?.error?.message || error.message;
          throw new Error(message);
        } else if (error.request) {
          // No response received
          throw new Error('Registry is unreachable. Check your internet connection.');
        } else {
          throw error;
        }
      }
    );
  }

  /**
   * Search for MCP servers
   */
  async searchServers(params) {
    const response = await this.client.get('/servers', { params });
    return response.data;
  }

  /**
   * Get detailed server info
   * Fallback to search if direct endpoint fails (for compatibility)
   */
  async getServer(slug) {
    try {
      // Try the direct endpoint first
      const response = await this.client.get(`/servers/${slug}`);
      return response.data;
    } catch (error) {
      // Fallback to search endpoint if direct access fails
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        const searchResult = await this.searchServers({ q: slug, limit: 1 });
        if (searchResult.servers && searchResult.servers.length > 0) {
          const server = searchResult.servers[0];
          // Check if it's an exact slug match
          if (server.slug === slug) {
            return server;
          }
        }
        throw new Error(`Server '${slug}' not found`);
      }
      throw error;
    }
  }

  /**
   * Get CLI-specific install config
   */
  async getInstallConfig(slug) {
    const response = await this.client.get(`/servers/cli/config/${slug}`);
    return response.data;
  }

  /**
   * Track installation (anonymous)
   */
  async trackInstall(serverId, version, metadata) {
    try {
      await this.client.post('/servers/cli/install-event', {
        serverId,
        version,
        platform: process.platform,
        nodeVersion: process.version,
        cliVersion: pkg.version,
        ...metadata
      });
    } catch (error) {
      // Fail silently - analytics shouldn't break CLI
      if (process.env.DEBUG) {
        console.error('Analytics error:', error.message);
      }
    }
  }

  /**
   * Get trending servers
   */
  async getTrending(period = '7d') {
    const response = await this.client.get('/servers/stats/trending', {
      params: { period }
    });
    return response.data;
  }

  /**
   * Get popular servers by category
   */
  async getPopular(category, limit = 10) {
    const response = await this.client.get('/servers/stats/popular', {
      params: { category, limit }
    });
    return response.data;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const response = await this.client.get('/servers/categories');
    return response.data;
  }

  /**
   * Get search suggestions
   */
  async getAutocomplete(query, limit = 5) {
    const response = await this.client.get('/servers/search/autocomplete', {
      params: { q: query, limit }
    });
    return response.data;
  }

  /**
   * Search in specific category
   */
  async searchInCategory(category, query, limit = 10) {
    const response = await this.client.get('/servers/search', {
      params: {
        q: query,
        filters: { category: [category] },
        limit
      }
    });
    return response.data;
  }
}