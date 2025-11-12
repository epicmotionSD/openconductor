import { 
  MCPServer, 
  ServerSummary, 
  ListServersRequest, 
  ListServersResponse,
  ServerCategory,
  CLIConfigResponse,
  SubmitServerRequest,
  SubmitServerResponse,
  UpdateServerRequest,
  CategoriesResponse,
  CategoryInfo,
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

export class RegistryService {
  private static instance: RegistryService;

  private constructor() {}

  public static getInstance(): RegistryService {
    if (!RegistryService.instance) {
      RegistryService.instance = new RegistryService();
    }
    return RegistryService.instance;
  }

  /**
   * Get server by ID or slug with caching
   */
  async getServer(identifier: string): Promise<MCPServer | null> {
    try {
      // Try ID first, then slug
      let server = await mcpServerRepository.findById(identifier);
      if (!server) {
        server = await mcpServerRepository.findBySlug(identifier);
      }
      
      if (server) {
        // Populate additional data
        await this.populateServerDetails(server);
      }
      
      return server;
    } catch (error) {
      logger.error('Error getting server', { identifier, error });
      throw error;
    }
  }

  /**
   * List servers with filtering and pagination
   */
  async listServers(params: ListServersRequest): Promise<ListServersResponse> {
    try {
      return await mcpServerRepository.list(params);
    } catch (error) {
      logger.error('Error listing servers', { params, error });
      throw error;
    }
  }

  /**
   * Get CLI installation configuration for a server
   */
  async getCLIConfig(slug: string): Promise<CLIConfigResponse | null> {
    const cacheKey = cache.generateKey('cli-config', slug);
    const cached = await cache.get<CLIConfigResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const server = await mcpServerRepository.findBySlug(slug);
      if (!server) {
        return null;
      }

      const config: CLIConfigResponse = {
        server: {
          id: server.id,
          slug: server.slug,
          name: server.name,
          version: server.versions.latest
        },
        installation: {
          method: server.packages.npm ? 'npm' : 
                  server.packages.docker ? 'docker' : 'manual',
          command: this.getInstallCommand(server),
          postInstall: this.getPostInstallCommands(server)
        },
        mcpConfig: {
          mcpServers: {
            [server.slug]: this.generateMCPConfig(server)
          }
        },
        requirements: this.getRequirements(server)
      };

      await cache.set(cacheKey, config, CACHE_TTL.SERVER_DETAIL);
      return config;
    } catch (error) {
      logger.error('Error getting CLI config', { slug, error });
      throw error;
    }
  }

  /**
   * Get all categories with server counts and featured servers
   */
  async getCategories(): Promise<CategoriesResponse> {
    const cacheKey = cache.generateKey('categories');
    const cached = await cache.get<CategoriesResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const categories: CategoryInfo[] = [];
      
      const categoryDefinitions = [
        {
          name: 'memory' as ServerCategory,
          displayName: 'Memory & State',
          description: 'Long-term memory and state management for AI agents',
          icon: '🧠'
        },
        {
          name: 'filesystem' as ServerCategory,
          displayName: 'File System',
          description: 'File and document management capabilities',
          icon: '📁'
        },
        {
          name: 'database' as ServerCategory,
          displayName: 'Databases',
          description: 'Database integration and query capabilities',
          icon: '🗄️'
        },
        {
          name: 'api' as ServerCategory,
          displayName: 'API Integration',
          description: 'External API and service integrations',
          icon: '🔌'
        },
        {
          name: 'search' as ServerCategory,
          displayName: 'Search',
          description: 'Search and information retrieval capabilities',
          icon: '🔍'
        },
        {
          name: 'communication' as ServerCategory,
          displayName: 'Communication',
          description: 'Messaging and communication tools',
          icon: '💬'
        },
        {
          name: 'monitoring' as ServerCategory,
          displayName: 'Monitoring',
          description: 'System monitoring and observability',
          icon: '📊'
        },
        {
          name: 'development' as ServerCategory,
          displayName: 'Development',
          description: 'Development tools and utilities',
          icon: '⚒️'
        },
        {
          name: 'custom' as ServerCategory,
          displayName: 'Custom',
          description: 'Custom and specialized integrations',
          icon: '🔧'
        }
      ];

      for (const categoryDef of categoryDefinitions) {
        // Get server count for category
        const categoryServers = await mcpServerRepository.list({
          category: categoryDef.name,
          verified: true,
          limit: 3, // Get top 3 for featured
          sort: 'popular'
        });

        categories.push({
          ...categoryDef,
          count: categoryServers.pagination.total,
          featured: categoryServers.servers
        });
      }

      const response: CategoriesResponse = { categories };
      await cache.set(cacheKey, response, CACHE_TTL.CATEGORIES);
      
      return response;
    } catch (error) {
      logger.error('Error getting categories', error);
      throw error;
    }
  }

  /**
   * Submit a new server for inclusion in the registry
   */
  async submitServer(request: SubmitServerRequest): Promise<SubmitServerResponse> {
    try {
      // Parse repository URL
      const repoInfo = this.parseRepositoryUrl(request.repositoryUrl);
      if (!repoInfo) {
        throw new Error('Invalid repository URL');
      }

      // Generate slug from name or repository
      const slug = this.generateSlug(request.name || repoInfo.name);
      
      // Check if slug already exists
      const existingServer = await mcpServerRepository.findBySlug(slug);
      if (existingServer) {
        throw new Error('A server with this name already exists');
      }

      // Create server entry (initially unverified)
      const serverData = {
        slug,
        name: request.name || repoInfo.name,
        description: '', // Will be populated from README during GitHub sync
        repository_url: request.repositoryUrl,
        repository_owner: repoInfo.owner,
        repository_name: repoInfo.name,
        npm_package: request.npmPackage,
        category: request.category || 'custom',
        tags: request.tags || [],
        verified: false,
        featured: false,
        config_example: {}
      };

      const server = await mcpServerRepository.create(serverData);

      // TODO: Trigger GitHub sync job for this server
      
      return {
        server: {
          id: server.id,
          slug: server.slug,
          status: 'pending'
        },
        message: 'Server submitted for review. Typical approval time: 24-48 hours.'
      };
    } catch (error) {
      logger.error('Error submitting server', { request, error });
      throw error;
    }
  }

  /**
   * Update server metadata (requires ownership verification)
   */
  async updateServer(slug: string, request: UpdateServerRequest): Promise<MCPServer | null> {
    try {
      const server = await mcpServerRepository.findBySlug(slug);
      if (!server) {
        return null;
      }

      // Update only allowed fields
      const updateData: any = {};
      if (request.tagline !== undefined) updateData.tagline = request.tagline;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.tags !== undefined) updateData.tags = request.tags;
      if (request.docsUrl !== undefined) updateData.docs_url = request.docsUrl;
      if (request.homepageUrl !== undefined) updateData.homepage_url = request.homepageUrl;

      if (Object.keys(updateData).length === 0) {
        return server; // No changes
      }

      return await mcpServerRepository.update(server.id, updateData);
    } catch (error) {
      logger.error('Error updating server', { slug, request, error });
      throw error;
    }
  }

  /**
   * Track CLI installation event
   */
  async trackInstall(serverId: string, metadata: any): Promise<void> {
    try {
      // TODO: Update cli_installs count in server_stats
      // TODO: Log install event for analytics
      logger.info('Install tracked', { serverId, metadata });
    } catch (error) {
      logger.error('Error tracking install', { serverId, metadata, error });
      // Don't throw - this is analytics, not critical
    }
  }

  /**
   * Verify a server (admin only)
   */
  async verifyServer(slug: string, verified: boolean = true): Promise<MCPServer | null> {
    try {
      const server = await mcpServerRepository.findBySlug(slug);
      if (!server) {
        return null;
      }

      return await mcpServerRepository.update(server.id, { verified });
    } catch (error) {
      logger.error('Error verifying server', { slug, verified, error });
      throw error;
    }
  }

  /**
   * Feature a server (admin only)
   */
  async featureServer(slug: string, featured: boolean = true): Promise<MCPServer | null> {
    try {
      const server = await mcpServerRepository.findBySlug(slug);
      if (!server) {
        return null;
      }

      return await mcpServerRepository.update(server.id, { featured });
    } catch (error) {
      logger.error('Error featuring server', { slug, featured, error });
      throw error;
    }
  }

  /**
   * Delete a server (admin only)
   */
  async deleteServer(slug: string): Promise<boolean> {
    try {
      const server = await mcpServerRepository.findBySlug(slug);
      if (!server) {
        return false;
      }

      return await mcpServerRepository.delete(server.id);
    } catch (error) {
      logger.error('Error deleting server', { slug, error });
      throw error;
    }
  }

  // Private helper methods

  private async populateServerDetails(server: MCPServer): Promise<void> {
    // TODO: Populate versions from server_versions table
    // TODO: Populate dependencies from server_dependencies table
    // TODO: Enrich with additional computed data
  }

  private getInstallCommand(server: MCPServer): string {
    if (server.packages.npm) {
      return `npm install -g ${server.packages.npm.name}`;
    } else if (server.packages.docker) {
      return `docker pull ${server.packages.docker.image}`;
    } else {
      return server.installation.manual || `# Manual installation required - see ${server.repository.url}`;
    }
  }

  private getPostInstallCommands(server: MCPServer): string[] | undefined {
    // Return server-specific post-install commands if any
    return undefined;
  }

  private generateMCPConfig(server: MCPServer): any {
    if (server.packages.npm) {
      return {
        command: 'npx',
        args: ['-y', server.packages.npm.name]
      };
    } else if (server.packages.docker) {
      return {
        command: 'docker',
        args: ['run', '--rm', '-i', server.packages.docker.image]
      };
    } else {
      return {
        command: server.slug,
        args: []
      };
    }
  }

  private getRequirements(server: MCPServer): any {
    const requirements: any = {};
    
    if (server.packages.npm) {
      requirements.node = '>=18.0.0';
    }
    
    if (server.packages.docker) {
      requirements.docker = true;
    }
    
    return requirements;
  }

  private parseRepositoryUrl(url: string): { owner: string; name: string } | null {
    const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (githubMatch) {
      return {
        owner: githubMatch[1],
        name: githubMatch[2].replace(/\.git$/, '')
      };
    }
    return null;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// Export singleton instance
export const registryService = RegistryService.getInstance();