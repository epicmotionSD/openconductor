/**
 * API Client for OpenConductor Registry
 * Connects to the OpenConductor API to fetch server data
 */

const API_BASE_URL = process.env.OPENCONDUCTOR_API_URL || 'https://api.openconductor.ai';

export interface MCPServer {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  github_url: string;
  npm_package?: string;
  author: string;
  github_stars: number;
  install_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServerDetails extends MCPServer {
  readme?: string;
  installation?: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
  configuration?: any;
}

export interface SearchResult {
  servers: MCPServer[];
  total: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  total_stars: number;
  total_installs: number;
}

export class OpenConductorAPIClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Discover MCP servers with optional filtering
   */
  async discoverServers(options?: {
    query?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    const params = new URLSearchParams();

    if (options?.query) params.append('q', options.query);
    if (options?.category) params.append('category', options.category);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${this.baseUrl}/v1/servers${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return {
      servers: data.servers || data,
      total: data.total || data.length
    };
  }

  /**
   * Search for MCP servers
   */
  async searchServers(query: string, limit: number = 10): Promise<SearchResult> {
    const url = `${this.baseUrl}/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    const data = await response.json() as any;

    return {
      servers: data.results || data.servers || [],
      total: data.total || (data.results?.length || 0)
    };
  }

  /**
   * Get detailed information about a specific server
   */
  async getServerDetails(slug: string): Promise<ServerDetails> {
    const url = `${this.baseUrl}/v1/servers/${slug}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Server '${slug}' not found`);
      }
      throw new Error(`Failed to fetch server details: ${response.statusText}`);
    }

    return await response.json() as ServerDetails;
  }

  /**
   * Get trending MCP servers
   */
  async getTrendingServers(limit: number = 10): Promise<MCPServer[]> {
    const url = `${this.baseUrl}/v1/trending?limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch trending servers: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.servers || data;
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const url = `${this.baseUrl}/v1/stats/categories`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch category stats: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.categories || data;
  }

  /**
   * Get installation command for a server
   */
  async getInstallCommand(slug: string): Promise<string> {
    return `openconductor install ${slug}`;
  }

  /**
   * Generic GET request
   */
  async get(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Resource not found: ${endpoint}`);
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
