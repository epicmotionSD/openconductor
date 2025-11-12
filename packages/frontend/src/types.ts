// OpenConductor Registry API - Comprehensive Type Definitions
// Following the complete technical specification

export type ServerCategory = 
  | 'memory' 
  | 'filesystem' 
  | 'database' 
  | 'api' 
  | 'search'
  | 'communication'
  | 'monitoring' 
  | 'development' 
  | 'custom';

// Core MCP Server interface
export interface MCPServer {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  
  // Repository Info
  repository: {
    url: string;
    owner: string;
    name: string;
    branch: string;
    stars: number;
    forks: number;
    openIssues: number;
    lastCommit: string;
    createdAt: string;
  };
  
  // Package Info
  packages: {
    npm?: {
      name: string;
      version: string;
      downloadsWeekly: number;
      downloadsTotal: number;
    };
    pypi?: {
      name: string;
      version: string;
    };
    docker?: {
      image: string;
      tags: string[];
    };
  };
  
  // Classification
  category: ServerCategory;
  subcategory?: string;
  tags: string[];
  
  // Installation
  installation: {
    cli: string;           // "openconductor install openmemory"
    npm?: string;          // "npm install @cavira/openmemory"
    docker?: string;       // "docker pull cavira/openmemory"
    manual?: string;       // Custom instructions
  };
  
  // Configuration
  configuration: {
    schema?: JSONSchema;    // JSON Schema for validation
    example: object;       // Example MCP config
  };
  
  // Documentation
  documentation: {
    readme: string;        // Rendered markdown
    readmeUrl: string;
    docsUrl?: string;
    homepageUrl?: string;
  };
  
  // Versions
  versions: {
    latest: string;
    all: Version[];
  };
  
  // Dependencies
  dependencies: ServerDependency[];
  
  // Stats
  stats: {
    popularity: number;
    trending: number;
    installs: number;
    pageViews: number;
    upvotes: number;
  };
  
  // Status
  verified: boolean;
  featured: boolean;
  deprecated: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

// Summary view for list endpoints
export interface ServerSummary {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category: ServerCategory;
  tags: string[];
  
  repository: {
    url: string;
    owner: string;
    name: string;
  };
  
  stats: {
    stars: number;
    installs: number;
    lastCommit: string;
  };
  
  installation: {
    npm?: string;
    docker?: string;
  };
  
  verified: boolean;
  featured: boolean;
}

// Version information
export interface Version {
  version: string;
  tagName: string;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt: string;
  isPrerelease: boolean;
  isLatest: boolean;
}

// Server dependencies
export interface ServerDependency {
  dependsOnServerId: string;
  dependencyType: 'required' | 'optional' | 'dev';
  versionConstraint?: string;
  server: ServerSummary;
}

// Search interfaces
export interface SearchRequest {
  q: string;
  filters?: {
    category?: ServerCategory[];
    tags?: string[];
    verified?: boolean;
  };
  limit?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  total: number;
}

export interface SearchResult {
  server: ServerSummary;
  highlights: {
    name?: string;
    description?: string;
    tags?: string[];
  };
  score: number;
}

// Stats and analytics interfaces
export interface TrendingRequest {
  period?: '24h' | '7d' | '30d';
  category?: ServerCategory;
  limit?: number;
}

export interface TrendingResponse {
  servers: TrendingServer[];
  period: string;
}

export interface TrendingServer extends ServerSummary {
  trendingScore: number;
  growth: {
    stars: number;
    installs: number;
    percentage: number;
  };
}

export interface PopularResponse {
  servers: ServerSummary[];
  category?: ServerCategory;
}

// Categories interface
export interface CategoryInfo {
  name: ServerCategory;
  displayName: string;
  description: string;
  icon: string;
  count: number;
  featured: ServerSummary[];
}

export interface CategoriesResponse {
  categories: CategoryInfo[];
}

// CLI integration interfaces
export interface CLIConfigResponse {
  server: {
    id: string;
    slug: string;
    name: string;
    version: string;
  };
  
  installation: {
    method: 'npm' | 'docker' | 'manual';
    command: string;
    postInstall?: string[];
  };
  
  mcpConfig: {
    mcpServers: {
      [key: string]: {
        command: string;
        args?: string[];
        env?: Record<string, string>;
      };
    };
  };
  
  requirements: {
    node?: string;
    python?: string;
    docker?: boolean;
  };
}

export interface InstallEventRequest {
  serverId: string;
  version: string;
  platform: 'darwin' | 'linux' | 'win32';
  nodeVersion: string;
  cliVersion: string;
  fingerprint?: string;
}

// Server submission interfaces
export interface SubmitServerRequest {
  repositoryUrl: string;
  name?: string;
  category?: ServerCategory;
  tags?: string[];
  npmPackage?: string;
}

export interface SubmitServerResponse {
  server: {
    id: string;
    slug: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  message: string;
}

export interface UpdateServerRequest {
  tagline?: string;
  description?: string;
  tags?: string[];
  docsUrl?: string;
  homepageUrl?: string;
}

// API response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListServersRequest extends PaginationParams {
  category?: ServerCategory;
  tags?: string[];
  verified?: boolean;
  q?: string;
  sort?: 'popular' | 'trending' | 'recent' | 'stars' | 'installs';
  order?: 'asc' | 'desc';
}

export interface ListServersResponse {
  servers: ServerSummary[];
  pagination: PaginationResponse;
  filters: {
    availableCategories: CategoryCount[];
    availableTags: TagCount[];
  };
}

export interface CategoryCount {
  category: ServerCategory;
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

// User interaction interfaces
export interface UserInteraction {
  userId: string;
  serverId: string;
  interactionType: 'install' | 'upvote' | 'bookmark';
  createdAt: string;
}

// Review interfaces
export interface ServerReview {
  id: string;
  serverId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText?: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// GitHub webhook interfaces
export interface GitHubWebhookPayload {
  eventType: string;
  repository: string;
  payload: any;
}

// Background job interfaces
export interface BackgroundJob {
  id: string;
  jobType: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
}

// API usage tracking
export interface APIUsage {
  apiKeyId?: string;
  ipAddress: string;
  endpoint: string;
  method: string;
  responseTimeMs: number;
  statusCode: number;
  userAgent?: string;
  createdAt: string;
}

// Authentication interfaces
export interface APIKey {
  id: string;
  name: string;
  permissions: object;
  rateLimitPerHour: number;
  active: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

// Legacy interfaces for backward compatibility
export interface MCPServerCreateInput {
  name: string;
  description: string;
  repository: string;
  npmPackage?: string;
  category: ServerCategory;
  tags: string[];
  installation: {
    npm?: string;
    docker?: string;
    manual?: string;
  };
  configExample: Record<string, any>;
}

export interface MCPServerSearchParams {
  query?: string;
  category?: ServerCategory;
  tags?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface MCPServerSearchResult {
  servers: ServerSummary[];
  total: number;
  hasMore: boolean;
}

// Claude Desktop configuration
export interface ClaudeDesktopConfig {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  globalShortcut?: string;
}

export interface InstallationResult {
  success: boolean;
  message: string;
  configPath?: string;
  serverName?: string;
}

// JSON Schema type
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

// Error codes
export const ErrorCodes = {
  NOT_FOUND: 'SERVER_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  DUPLICATE_SERVER: 'DUPLICATE_SERVER',
  INVALID_REPOSITORY: 'INVALID_REPOSITORY',
  GITHUB_API_ERROR: 'GITHUB_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Cache TTL constants
export const CACHE_TTL = {
  SERVER_DETAIL: 300,      // 5 minutes
  SERVER_LIST: 60,         // 1 minute
  SEARCH_RESULTS: 120,     // 2 minutes
  TRENDING: 600,           // 10 minutes
  STATS: 1800,            // 30 minutes
  CATEGORIES: 3600,       // 1 hour
} as const;