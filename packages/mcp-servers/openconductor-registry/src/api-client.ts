/**
 * API Client for OpenConductor Registry
 * Connects to the OpenConductor API to fetch server data
 *
 * The live API wraps every response in an envelope:
 *   { success, data: { ... }, meta }
 * and returns servers in a nested shape (repository.*, stats.*).
 * This client unwraps the envelope and normalizes servers into the flat
 * shape the MCP tool renderers expect.
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

export interface CategoryStat {
  category: string;
  count: number;
}

/**
 * Normalize a server object from the API's nested shape into the flat shape
 * the MCP tool renderers expect. Handles both list/search summaries
 * (tagline + stats.stars) and full server details (description + repository.stars).
 */
function normalizeServer(raw: any): MCPServer {
  const repository = raw?.repository ?? {};
  const stats = raw?.stats ?? {};
  const packages = raw?.packages ?? {};

  return {
    id: raw?.id ?? '',
    slug: raw?.slug ?? '',
    name: raw?.name ?? '',
    // Summaries only carry `tagline`; full details carry `description`.
    description: raw?.description ?? raw?.tagline ?? '',
    category: raw?.category ?? 'custom',
    tags: raw?.tags ?? [],
    github_url: repository.url ?? raw?.github_url ?? '',
    // packages.npm.name on details; summaries don't expose the bare name.
    npm_package: packages?.npm?.name ?? raw?.npm_package,
    author: repository.owner ?? raw?.author ?? '',
    // details put stars under repository.stars, summaries under stats.stars.
    github_stars: repository.stars ?? stats.stars ?? 0,
    install_count: stats.installs ?? 0,
    verified: Boolean(raw?.verified),
    created_at: raw?.createdAt ?? raw?.created_at ?? '',
    updated_at: raw?.updatedAt ?? raw?.updated_at ?? '',
  };
}

export class OpenConductorAPIClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Unwrap the API envelope: { success, data, meta } -> data
   */
  private unwrap(body: any): any {
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data;
    }
    return body;
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

    const data = this.unwrap(await response.json());
    const servers = (data?.servers ?? []).map(normalizeServer);

    return {
      servers,
      total: data?.pagination?.total ?? servers.length,
    };
  }

  /**
   * Search for MCP servers
   */
  async searchServers(query: string, limit: number = 10): Promise<SearchResult> {
    const url = `${this.baseUrl}/v1/servers/search?q=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    const data = this.unwrap(await response.json());
    // Search results are wrapped: data.results = [{ server, highlights, score }]
    const results = data?.results ?? [];
    const servers = results.map((r: any) => normalizeServer(r?.server ?? r));

    return {
      servers,
      total: data?.total ?? servers.length,
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

    const data = this.unwrap(await response.json());
    return normalizeServer(data) as ServerDetails;
  }

  /**
   * Get category statistics (server counts per category).
   * The API already aggregates these in `data.filters.availableCategories`
   * on every server list call, so we read them from a minimal /v1/servers call.
   */
  async getCategoryStats(): Promise<CategoryStat[]> {
    const url = `${this.baseUrl}/v1/servers?limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch category stats: ${response.statusText}`);
    }

    const data = this.unwrap(await response.json());
    const categories = data?.filters?.availableCategories ?? [];

    return categories.map((c: any) => ({
      category: c?.category ?? String(c),
      count: c?.count ?? 0,
    }));
  }

  /**
   * Get installation command for a server
   */
  async getInstallCommand(slug: string): Promise<string> {
    return `openconductor install ${slug}`;
  }

  /**
   * Generic GET request (returns the raw envelope, e.g. { success, data })
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
