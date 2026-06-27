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
    this.baseURL = baseURL || process.env.OPENCONDUCTOR_API_URL || 'https://openconductor.ai/api/v1';

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
    const payload = this._unwrapResponse(response);
    return payload;
  }

  /**
   * Get detailed server info
   * Fallback to search if direct endpoint fails (for compatibility)
   */
  async getServer(slug) {
    try {
      // Try the direct endpoint first
      // Interceptor extracts response.data -> {success, data, meta}
      const response = await this.client.get(`/servers/${slug}`);
      const payload = this._unwrapResponse(response);
      const server = this._extractServerFromPayload(payload, slug);
      if (server) {
        return server;
      }
    } catch (error) {
      // Fallback to search endpoint if direct access fails (404, 500, or any error)
      // Search for servers where the slug contains our search term
      const searchResult = await this.searchServers({ q: slug.replace(/-/g, ' '), limit: 20 });
      if (searchResult.servers && searchResult.servers.length > 0) {
        // Find exact slug match
        const server = searchResult.servers.find(s => s.slug === slug);
        if (server) {
          // Normalize the structure to match expected format
          return this._normalizeServerObject(server);
        }
      }
      throw new Error(`Server '${slug}' not found`);
    }
  }

  /**
   * Normalize server object from search endpoint to match detail endpoint format
   * @private
   */
  _normalizeServerObject(server) {
    const existingNpmPackage = server.packages?.npm?.name;
    // Extract npm package name from installation command if available
    let npmPackageName = existingNpmPackage || null;
    if (server.installation && server.installation.npm) {
      // Parse "npm install -g package-name" to extract package name
      if (typeof server.installation.npm === 'string') {
        const match = server.installation.npm.match(/npm install (?:-g )?(@?[\w-/]+)/);
        if (match) {
          npmPackageName = match[1];
        }
      }
    }

    return {
      ...server,
      // Override installation object to have just the package name
      installation: {
        npm: npmPackageName || (typeof server.installation?.npm === 'string' ? server.installation.npm : undefined),
        docker: server.installation?.docker,
        manual: server.installation?.manual
      },
      packages: {
        npm: npmPackageName ? {
          name: npmPackageName,
          downloadsTotal: server.packages?.npm?.downloadsTotal || server.stats?.downloads || 0
        } : server.packages?.npm,
        docker: undefined
      },
      configuration: {
        example: {}
      },
      documentation: {
        docsUrl: server.docs_url,
        homepageUrl: server.homepage_url
      }
    };
  }

  _unwrapResponse(payload) {
    if (payload && payload.success && payload.data !== undefined) {
      return payload.data;
    }
    return payload;
  }

  _extractServerFromPayload(payload, slug) {
    if (!payload) {
      return null;
    }

    if (payload.server) {
      return payload.server;
    }

    if (payload.slug) {
      return payload;
    }

    if (Array.isArray(payload.servers)) {
      const match = payload.servers.find(server => server.slug === slug) || payload.servers[0];
      return match ? this._normalizeServerObject(match) : null;
    }

    return null;
  }

  /**
   * Get CLI-specific install config
   */
  async getInstallConfig(slug) {
    // Interceptor extracts response.data -> {success, data, meta}
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
    // Interceptor extracts response.data -> {success, data, meta}
    const response = await this.client.get('/servers/stats/trending', {
      params: { period }
    });
    return response.data;
  }

  /**
   * Get popular servers by category
   */
  async getPopular(category, limit = 10) {
    // Interceptor extracts response.data -> {success, data, meta}
    const response = await this.client.get('/servers/stats/popular', {
      params: { category, limit }
    });
    return response.data;
  }

  /**
   * Get all categories
   */
  async getCategories() {
    // Interceptor extracts response.data -> {success, data, meta}
    const response = await this.client.get('/servers/categories');
    return response.data;
  }

  /**
   * Get search suggestions
   */
  async getAutocomplete(query, limit = 5) {
    // Interceptor extracts response.data -> {success, data, meta}
    const response = await this.client.get('/servers/search/autocomplete', {
      params: { q: query, limit }
    });
    return response.data;
  }

  /**
   * Search in specific category
   */
  async searchInCategory(category, query, limit = 10) {
    // Interceptor extracts response.data -> {success, data, meta}
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