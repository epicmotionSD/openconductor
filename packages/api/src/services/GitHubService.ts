import { Octokit } from '@octokit/rest';
import { marked } from 'marked';
import { 
  ServerCategory,
  BackgroundJob 
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

export class GitHubService {
  private static instance: GitHubService;
  private octokit: Octokit;

  private constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      logger.warn('GITHUB_TOKEN not provided - GitHub integration will be limited');
    }

    this.octokit = new Octokit({
      auth: githubToken,
      userAgent: 'OpenConductor/1.0.0'
    });
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Sync a server from GitHub repository
   */
  async syncServer(repositoryUrl: string): Promise<{ serverId: string; updated: boolean }> {
    try {
      const { owner, repo } = this.parseRepoUrl(repositoryUrl);
      
      logger.info('Starting GitHub sync', { owner, repo });

      // Fetch repository metadata
      const repoData = await this.octokit.repos.get({ owner, repo });
      
      // Fetch README content
      const readmeData = await this.fetchReadme(owner, repo);
      
      // Fetch package.json for npm package detection
      const packageInfo = await this.fetchPackageInfo(owner, repo);
      
      // Fetch latest releases
      const releases = await this.fetchReleases(owner, repo);
      
      // Auto-detect category and metadata
      const metadata = this.extractMetadata(repoData.data, readmeData, packageInfo);
      
      // Check if server already exists
      const existingServer = await db.query(
        'SELECT id FROM mcp_servers WHERE repository_url = $1',
        [repositoryUrl]
      );

      let serverId: string;
      let isNewServer = false;

      if (existingServer.rows.length > 0) {
        // Update existing server
        serverId = existingServer.rows[0].id;
        await this.updateExistingServer(serverId, repoData.data, metadata);
      } else {
        // Create new server
        isNewServer = true;
        serverId = await this.createNewServer(repositoryUrl, repoData.data, metadata);
      }

      // Update server statistics
      await this.updateServerStats(serverId, repoData.data, packageInfo);
      
      // Update versions from releases
      await this.updateServerVersions(serverId, releases);

      // Clear related caches
      await this.clearServerCaches(serverId);

      logger.info('GitHub sync completed', { 
        serverId, 
        owner, 
        repo, 
        isNewServer 
      });

      return { serverId, updated: true };
      
    } catch (error) {
      logger.error('GitHub sync failed', { repositoryUrl, error: error.message });
      throw error;
    }
  }

  /**
   * Process GitHub webhook event
   */
  async processWebhook(event: string, payload: any): Promise<void> {
    try {
      logger.info('Processing GitHub webhook', { event, repository: payload.repository?.full_name });

      // Log webhook event
      await db.query(
        `INSERT INTO github_webhook_logs (event_type, repository, payload, received_at)
         VALUES ($1, $2, $3, NOW())`,
        [event, payload.repository?.full_name, JSON.stringify(payload)]
      );

      // Process based on event type
      switch (event) {
        case 'release':
          await this.handleReleaseEvent(payload);
          break;
        case 'push':
          await this.handlePushEvent(payload);
          break;
        case 'star':
        case 'watch':
          await this.handleStarEvent(payload);
          break;
        case 'repository':
          await this.handleRepositoryEvent(payload);
          break;
        default:
          logger.info('Unhandled webhook event', { event });
      }

      // Mark webhook as processed
      await db.query(
        `UPDATE github_webhook_logs 
         SET processed = true, processed_at = NOW()
         WHERE event_type = $1 AND repository = $2 AND processed = false`,
        [event, payload.repository?.full_name]
      );

    } catch (error) {
      logger.error('Webhook processing failed', { event, error: error.message });
      
      // Mark webhook as failed
      await db.query(
        `UPDATE github_webhook_logs 
         SET processed = true, processed_at = NOW(), error = $3
         WHERE event_type = $1 AND repository = $2 AND processed = false`,
        [event, payload.repository?.full_name, error.message]
      );
      
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) {
      return false;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Discover MCP servers from GitHub topics/search
   */
  async discoverMCPServers(limit = 100): Promise<string[]> {
    try {
      // Search for repositories with MCP-related topics
      const searchResults = await this.octokit.search.repos({
        q: 'topic:mcp-server OR topic:model-context-protocol OR "MCP server" in:readme',
        sort: 'stars',
        order: 'desc',
        per_page: limit
      });

      const repositories = searchResults.data.items.map(repo => repo.html_url);
      
      logger.info(`Discovered ${repositories.length} potential MCP servers`);
      return repositories;
      
    } catch (error) {
      logger.error('GitHub discovery failed', error);
      return [];
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(owner: string, repo: string) {
    try {
      const [repoData, releases, readme] = await Promise.all([
        this.octokit.repos.get({ owner, repo }),
        this.octokit.repos.listReleases({ owner, repo, per_page: 10 }),
        this.fetchReadme(owner, repo)
      ]);

      return {
        repository: repoData.data,
        releases: releases.data,
        readme: readme
      };
    } catch (error) {
      logger.error('Failed to get repository info', { owner, repo, error: error.message });
      throw error;
    }
  }

  // Private helper methods

  private async handleReleaseEvent(payload: any): Promise<void> {
    const { repository, release } = payload;
    
    if (release.prerelease && !process.env.INCLUDE_PRERELEASES) {
      return; // Skip prereleases unless configured
    }

    try {
      // Find server in database
      const serverResult = await db.query(
        'SELECT id FROM mcp_servers WHERE repository_owner = $1 AND repository_name = $2',
        [repository.owner.login, repository.name]
      );

      if (serverResult.rows.length === 0) {
        logger.info('Release event for unknown server, attempting to add', {
          repository: repository.full_name
        });
        
        // Trigger sync for this repository
        await this.syncServer(repository.html_url);
        return;
      }

      const serverId = serverResult.rows[0].id;

      // Add new version
      await db.query(
        `INSERT INTO server_versions (
          server_id, version, tag_name, release_notes, release_url, 
          published_at, is_prerelease
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (server_id, version) DO UPDATE SET
          release_notes = $4,
          release_url = $5,
          published_at = $6`,
        [
          serverId,
          release.tag_name.replace(/^v/, ''),
          release.tag_name,
          release.body || '',
          release.html_url,
          release.published_at,
          release.prerelease
        ]
      );

      // Update 'latest' flag if not prerelease
      if (!release.prerelease) {
        await this.updateLatestVersion(serverId);
      }

      // Clear caches
      await this.clearServerCaches(serverId);

      logger.info('Release event processed', {
        serverId,
        version: release.tag_name
      });

    } catch (error) {
      logger.error('Failed to handle release event', { payload, error });
    }
  }

  private async handlePushEvent(payload: any): Promise<void> {
    const { repository, ref } = payload;
    
    // Only process pushes to default branch
    if (ref !== `refs/heads/${repository.default_branch}`) {
      return;
    }

    try {
      // Find server and trigger sync to update README and metadata
      const serverResult = await db.query(
        'SELECT id FROM mcp_servers WHERE repository_owner = $1 AND repository_name = $2',
        [repository.owner.login, repository.name]
      );

      if (serverResult.rows.length > 0) {
        const serverId = serverResult.rows[0].id;
        
        // Update last_synced_at
        await db.query(
          'UPDATE mcp_servers SET last_synced_at = NOW() WHERE id = $1',
          [serverId]
        );

        // Queue sync job for README/metadata update
        await this.queueSyncJob(repository.html_url);
      }

    } catch (error) {
      logger.error('Failed to handle push event', { payload, error });
    }
  }

  private async handleStarEvent(payload: any): Promise<void> {
    const { repository, action } = payload;
    
    try {
      // Update star count in database
      const serverResult = await db.query(
        'SELECT id FROM mcp_servers WHERE repository_owner = $1 AND repository_name = $2',
        [repository.owner.login, repository.name]
      );

      if (serverResult.rows.length > 0) {
        const serverId = serverResult.rows[0].id;
        
        await db.query(
          'UPDATE server_stats SET github_stars = $2 WHERE server_id = $1',
          [serverId, repository.stargazers_count]
        );

        logger.info('Star count updated', {
          serverId,
          action,
          stars: repository.stargazers_count
        });
      }

    } catch (error) {
      logger.error('Failed to handle star event', { payload, error });
    }
  }

  private async handleRepositoryEvent(payload: any): Promise<void> {
    const { repository, action } = payload;
    
    if (action === 'renamed' || action === 'transferred') {
      // Handle repository URL changes
      try {
        await db.query(
          `UPDATE mcp_servers SET 
            repository_url = $1,
            repository_owner = $2,
            repository_name = $3
           WHERE repository_owner = $4 AND repository_name = $5`,
          [
            repository.html_url,
            repository.owner.login,
            repository.name,
            payload.changes?.repository?.name?.from || repository.owner.login,
            payload.changes?.repository?.name?.from || repository.name
          ]
        );

        logger.info('Repository URL updated', {
          oldName: payload.changes?.repository?.name?.from,
          newName: repository.name
        });

      } catch (error) {
        logger.error('Failed to handle repository event', { payload, error });
      }
    }
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }

    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  private async fetchReadme(owner: string, repo: string): Promise<string> {
    try {
      const readmeData = await this.octokit.repos.getReadme({ owner, repo });
      const content = Buffer.from(readmeData.data.content, 'base64').toString('utf-8');
      return marked.parse(content); // Convert to HTML
    } catch (error) {
      logger.warn('Failed to fetch README', { owner, repo });
      return '';
    }
  }

  private async fetchPackageInfo(owner: string, repo: string): Promise<any> {
    try {
      const pkgData = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json'
      });

      if ('content' in pkgData.data) {
        const content = Buffer.from(pkgData.data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      // No package.json found
    }

    return null;
  }

  private async fetchReleases(owner: string, repo: string) {
    try {
      const releases = await this.octokit.repos.listReleases({ 
        owner, 
        repo, 
        per_page: 20 
      });
      return releases.data;
    } catch (error) {
      logger.warn('Failed to fetch releases', { owner, repo });
      return [];
    }
  }

  private extractMetadata(repoData: any, readme: string, packageInfo: any) {
    return {
      name: repoData.name,
      description: repoData.description || '',
      topics: repoData.topics || [],
      category: this.detectCategory(repoData.topics, readme, packageInfo),
      tags: this.extractTags(repoData.topics, readme, packageInfo),
      npmPackage: packageInfo?.name,
      homepage: repoData.homepage,
      language: repoData.language,
      license: repoData.license?.spdx_id,
      hasDocumentation: readme.length > 100
    };
  }

  private detectCategory(topics: string[], readme: string, packageInfo: any): ServerCategory {
    const categoryMap: Record<string, ServerCategory> = {
      // Memory-related
      'memory': 'memory',
      'persistence': 'memory',
      'storage': 'memory',
      'semantic': 'memory',
      
      // Filesystem
      'filesystem': 'filesystem',
      'files': 'filesystem',
      'storage': 'filesystem',
      
      // Database
      'database': 'database',
      'sql': 'database',
      'postgres': 'database',
      'mongodb': 'database',
      'mysql': 'database',
      
      // API integration
      'api': 'api',
      'rest': 'api',
      'graphql': 'api',
      'integration': 'api',
      
      // Search
      'search': 'search',
      'elasticsearch': 'search',
      'indexing': 'search',
      
      // Communication
      'slack': 'communication',
      'discord': 'communication',
      'chat': 'communication',
      'messaging': 'communication',
      
      // Monitoring
      'monitoring': 'monitoring',
      'metrics': 'monitoring',
      'logging': 'monitoring',
      'observability': 'monitoring',
      
      // Development
      'github': 'development',
      'git': 'development',
      'ci': 'development',
      'testing': 'development'
    };

    // Check topics first
    for (const topic of topics) {
      if (categoryMap[topic]) {
        return categoryMap[topic];
      }
    }

    // Check README content
    const readmeLower = readme.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (readmeLower.includes(keyword)) {
        return category;
      }
    }

    // Check package.json dependencies
    if (packageInfo?.dependencies) {
      const deps = Object.keys(packageInfo.dependencies);
      for (const dep of deps) {
        for (const [keyword, category] of Object.entries(categoryMap)) {
          if (dep.includes(keyword)) {
            return category;
          }
        }
      }
    }

    return 'custom';
  }

  private extractTags(topics: string[], readme: string, packageInfo: any): string[] {
    const tags = new Set<string>();
    
    // Add GitHub topics
    topics.forEach(topic => {
      if (topic !== 'mcp-server' && topic !== 'model-context-protocol') {
        tags.add(topic);
      }
    });

    // Extract from package.json keywords
    if (packageInfo?.keywords) {
      packageInfo.keywords.forEach((keyword: string) => {
        if (typeof keyword === 'string' && keyword.length < 50) {
          tags.add(keyword.toLowerCase());
        }
      });
    }

    // Common technology tags from dependencies
    if (packageInfo?.dependencies) {
      const deps = Object.keys(packageInfo.dependencies);
      const techTags = ['react', 'vue', 'express', 'fastify', 'typescript', 'python', 'docker'];
      
      for (const tech of techTags) {
        if (deps.some(dep => dep.includes(tech))) {
          tags.add(tech);
        }
      }
    }

    // Limit to 10 tags, prioritize shorter ones
    return Array.from(tags)
      .sort((a, b) => a.length - b.length)
      .slice(0, 10);
  }

  private async createNewServer(repositoryUrl: string, repoData: any, metadata: any): Promise<string> {
    const { owner, repo } = this.parseRepoUrl(repositoryUrl);
    const slug = this.generateSlug(metadata.name);

    const result = await db.query(
      `INSERT INTO mcp_servers (
        slug, name, description, repository_url, repository_owner, repository_name,
        npm_package, category, tags, homepage_url, verified, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id`,
      [
        slug,
        metadata.name,
        metadata.description,
        repositoryUrl,
        owner,
        repo,
        metadata.npmPackage,
        metadata.category,
        metadata.tags,
        metadata.homepage,
        false // New servers start unverified
      ]
    );

    const serverId = result.rows[0].id;

    // Create initial stats entry
    await db.query(
      'INSERT INTO server_stats (server_id) VALUES ($1)',
      [serverId]
    );

    return serverId;
  }

  private async updateExistingServer(serverId: string, repoData: any, metadata: any): Promise<void> {
    await db.query(
      `UPDATE mcp_servers SET
        name = $2,
        description = $3,
        npm_package = $4,
        category = $5,
        tags = $6,
        homepage_url = $7,
        last_synced_at = NOW()
       WHERE id = $1`,
      [
        serverId,
        metadata.name,
        metadata.description,
        metadata.npmPackage,
        metadata.category,
        metadata.tags,
        metadata.homepage
      ]
    );
  }

  private async updateServerStats(serverId: string, repoData: any, packageInfo: any): Promise<void> {
    await db.query(
      `UPDATE server_stats SET
        github_stars = $2,
        github_forks = $3,
        github_watchers = $4,
        github_open_issues = $5,
        github_last_commit_at = $6,
        github_created_at = $7,
        updated_at = NOW()
       WHERE server_id = $1`,
      [
        serverId,
        repoData.stargazers_count,
        repoData.forks_count,
        repoData.watchers_count,
        repoData.open_issues_count,
        repoData.updated_at,
        repoData.created_at
      ]
    );
  }

  private async updateServerVersions(serverId: string, releases: any[]): Promise<void> {
    for (const release of releases) {
      await db.query(
        `INSERT INTO server_versions (
          server_id, version, tag_name, release_notes, release_url,
          published_at, is_prerelease
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (server_id, version) DO UPDATE SET
          release_notes = $4,
          release_url = $5`,
        [
          serverId,
          release.tag_name.replace(/^v/, ''),
          release.tag_name,
          release.body || '',
          release.html_url,
          release.published_at,
          release.prerelease
        ]
      );
    }

    // Update latest version flag
    await this.updateLatestVersion(serverId);
  }

  private async updateLatestVersion(serverId: string): Promise<void> {
    // Reset all versions to not latest
    await db.query(
      'UPDATE server_versions SET is_latest = false WHERE server_id = $1',
      [serverId]
    );

    // Set most recent non-prerelease as latest
    await db.query(
      `UPDATE server_versions SET is_latest = true 
       WHERE server_id = $1 
         AND is_prerelease = false
         AND id = (
           SELECT id FROM server_versions 
           WHERE server_id = $1 AND is_prerelease = false
           ORDER BY published_at DESC LIMIT 1
         )`,
      [serverId]
    );
  }

  private async queueSyncJob(repositoryUrl: string): Promise<void> {
    await db.query(
      `INSERT INTO background_jobs (job_type, payload, scheduled_at)
       VALUES ('github_sync', $1, NOW())`,
      [JSON.stringify({ repositoryUrl })]
    );
  }

  private async clearServerCaches(serverId: string): Promise<void> {
    // Clear server-specific caches
    const cachePatterns = [
      `server:${serverId}`,
      `servers:list:*`,
      `trending:*`,
      `popular:*`,
      `categories`
    ];
    
    // TODO: Implement pattern-based cache clearing
    await cache.flush(); // For now, clear all cache
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
export const githubService = GitHubService.getInstance();