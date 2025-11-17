import { Octokit } from '@octokit/rest';
import { db } from '../db/connection';
import winston from 'winston';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

interface ValidationResult {
  type: string;
  passed: boolean;
  score: number;
  details: any;
  errorMessage?: string;
}

interface DiscoveryResult {
  repositoryUrl: string;
  added: boolean;
  serverId?: string;
  validations: ValidationResult[];
  reason?: string;
}

export class GitHubDiscoveryService {
  private static instance: GitHubDiscoveryService;
  private octokit: Octokit;

  // Search queries optimized for MCP server discovery
  private searchQueries = [
    '@modelcontextprotocol/sdk language:typescript',
    '@modelcontextprotocol/sdk language:javascript',
    'mcp-server in:name,description',
    'model-context-protocol in:name,description,readme',
    'topic:mcp-server',
    'topic:model-context-protocol',
    '"mcp server" in:readme language:typescript',
    '"mcp server" in:readme language:python',
    'filename:mcp.json',
    '"@modelcontextprotocol" in:file'
  ];

  private constructor() {
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      logger.warn('GITHUB_TOKEN not provided - GitHub integration will be rate limited');
    }

    this.octokit = new Octokit({
      auth: githubToken,
      userAgent: 'OpenConductor-Discovery/1.0.0'
    });
  }

  public static getInstance(): GitHubDiscoveryService {
    if (!GitHubDiscoveryService.instance) {
      GitHubDiscoveryService.instance = new GitHubDiscoveryService();
    }
    return GitHubDiscoveryService.instance;
  }

  /**
   * Run daily discovery process
   * Searches GitHub for new MCP servers and queues them for validation
   */
  async runDailyDiscovery(): Promise<{ discovered: number; queued: number }> {
    logger.info('Starting daily MCP server discovery');

    const discovered = new Set<string>();
    const queued: string[] = [];

    try {
      // Run all search queries in parallel
      const searchResults = await Promise.allSettled(
        this.searchQueries.map(query => this.searchGitHub(query))
      );

      // Collect all unique repository URLs
      for (const result of searchResults) {
        if (result.status === 'fulfilled') {
          result.value.forEach(url => discovered.add(url));
        } else {
          logger.error('Search query failed', { error: result.reason });
        }
      }

      logger.info(`Discovered ${discovered.size} unique repositories`);

      // Queue each discovered repo for processing
      for (const repoUrl of discovered) {
        const queueId = await this.queueRepoForDiscovery(repoUrl, 'github_search');
        if (queueId) {
          queued.push(repoUrl);
        }
      }

      logger.info(`Queued ${queued.length} repositories for validation`);

      return {
        discovered: discovered.size,
        queued: queued.length
      };

    } catch (error) {
      logger.error('Daily discovery failed', { error });
      throw error;
    }
  }

  /**
   * Search GitHub with a specific query
   */
  private async searchGitHub(query: string, maxResults: number = 100): Promise<string[]> {
    try {
      logger.debug(`Searching GitHub: ${query}`);

      const repos: string[] = [];
      let page = 1;
      const perPage = 100;

      while (repos.length < maxResults) {
        const response = await this.octokit.search.repos({
          q: query,
          sort: 'updated',
          order: 'desc',
          per_page: Math.min(perPage, maxResults - repos.length),
          page
        });

        if (response.data.items.length === 0) break;

        for (const repo of response.data.items) {
          repos.push(repo.html_url);
        }

        // GitHub search API has pagination limits
        if (response.data.items.length < perPage) break;
        page++;
      }

      logger.debug(`Found ${repos.length} repos for query: ${query}`);
      return repos;

    } catch (error: any) {
      logger.error(`GitHub search failed for query: ${query}`, { error: error.message });
      return [];
    }
  }

  /**
   * Add repository to discovery queue
   */
  async queueRepoForDiscovery(
    repositoryUrl: string,
    sourceType: string,
    priority: number = 5,
    metadata: any = {}
  ): Promise<string | null> {
    try {
      const result = await db.query(
        `SELECT queue_repo_for_discovery($1, $2, $3, $4) as id`,
        [repositoryUrl, sourceType, priority, JSON.stringify(metadata)]
      );

      return result.rows[0]?.id || null;
    } catch (error) {
      logger.error('Failed to queue repo', { repositoryUrl, error });
      return null;
    }
  }

  /**
   * Process next item from discovery queue
   */
  async processNextDiscoveryItem(): Promise<DiscoveryResult | null> {
    try {
      // Get next item from queue
      const queueItem = await db.query(`SELECT * FROM get_next_discovery_item()`);

      if (queueItem.rows.length === 0) {
        logger.debug('No pending discovery items');
        return null;
      }

      const { id: queueId, repository_url, source_type } = queueItem.rows[0];

      logger.info(`Processing discovery item`, { queueId, repository_url, source_type });

      // Run all validations
      const validations = await this.validateRepository(repository_url);

      // Check if all required validations passed
      const requiredValidations = validations.filter(v => v.type.includes('required'));
      const allRequiredPassed = requiredValidations.every(v => v.passed);

      let result: DiscoveryResult = {
        repositoryUrl: repository_url,
        added: false,
        validations
      };

      if (allRequiredPassed) {
        // Auto-add as unverified server
        const serverId = await this.addUnverifiedServer(repository_url, validations);

        if (serverId) {
          result.added = true;
          result.serverId = serverId;

          // Record discovery source
          await db.query(
            `INSERT INTO discovery_sources (server_id, source_type, discovered_by)
             VALUES ($1, $2, $3)`,
            [serverId, source_type, 'auto-discovery']
          );

          // Update queue status
          await db.query(
            `UPDATE discovery_queue SET status = 'completed', processed_at = NOW()
             WHERE id = $1`,
            [queueId]
          );

          logger.info(`Server added successfully`, { serverId, repository_url });
        } else {
          result.reason = 'Failed to create server record';
          await this.markQueueItemFailed(queueId, result.reason);
        }
      } else {
        const failedValidations = requiredValidations.filter(v => !v.passed);
        result.reason = `Failed required validations: ${failedValidations.map(v => v.type).join(', ')}`;

        await this.markQueueItemFailed(queueId, result.reason);
        logger.info(`Server rejected`, { repository_url, reason: result.reason });
      }

      return result;

    } catch (error: any) {
      logger.error('Failed to process discovery item', { error: error.message });
      return null;
    }
  }

  /**
   * Validate a repository meets all requirements
   */
  async validateRepository(repositoryUrl: string): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = [];

    try {
      const { owner, repo } = this.parseRepoUrl(repositoryUrl);

      // 1. Check if repo exists and is accessible
      const repoCheck = await this.validateRepoExists(owner, repo);
      validations.push(repoCheck);
      if (!repoCheck.passed) return validations;

      // 2. Validate package.json exists and has MCP SDK dependency
      const packageJsonCheck = await this.validatePackageJson(owner, repo);
      validations.push(packageJsonCheck);

      // 3. Check for README
      const readmeCheck = await this.validateReadme(owner, repo);
      validations.push(readmeCheck);

      // 4. Test npm install (if package.json passed)
      if (packageJsonCheck.passed) {
        const installCheck = await this.validateNpmInstall(repositoryUrl);
        validations.push(installCheck);

        // 5. Run functional test (if install passed)
        if (installCheck.passed) {
          const functionalCheck = await this.validateFunctionalTest(repositoryUrl);
          validations.push(functionalCheck);
        }
      }

      // 6. Check for fork status
      const forkCheck = await this.validateNotFork(owner, repo);
      validations.push(forkCheck);

      // Save all validation results to database
      for (const validation of validations) {
        await db.query(
          `INSERT INTO server_validations
           (repository_url, validation_type, passed, score, details, error_message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            repositoryUrl,
            validation.type,
            validation.passed,
            validation.score,
            JSON.stringify(validation.details),
            validation.errorMessage
          ]
        );
      }

    } catch (error: any) {
      logger.error('Validation failed', { repositoryUrl, error: error.message });
      validations.push({
        type: 'validation_error',
        passed: false,
        score: 0,
        details: {},
        errorMessage: error.message
      });
    }

    return validations;
  }

  /**
   * Validation: Check if repository exists
   */
  private async validateRepoExists(owner: string, repo: string): Promise<ValidationResult> {
    try {
      const response = await this.octokit.repos.get({ owner, repo });

      return {
        type: 'repo_exists',
        passed: true,
        score: 10,
        details: {
          stars: response.data.stargazers_count,
          language: response.data.language,
          updated_at: response.data.updated_at
        }
      };
    } catch (error: any) {
      return {
        type: 'repo_exists',
        passed: false,
        score: 0,
        details: {},
        errorMessage: `Repository not accessible: ${error.message}`
      };
    }
  }

  /**
   * Validation: Check package.json has @modelcontextprotocol/sdk
   */
  private async validatePackageJson(owner: string, repo: string): Promise<ValidationResult> {
    try {
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json'
      });

      if ('content' in response.data) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        const packageJson = JSON.parse(content);

        const hasMCPSDK =
          packageJson.dependencies?.['@modelcontextprotocol/sdk'] ||
          packageJson.devDependencies?.['@modelcontextprotocol/sdk'] ||
          packageJson.peerDependencies?.['@modelcontextprotocol/sdk'];

        return {
          type: 'package_json_mcp_sdk_required',
          passed: !!hasMCPSDK,
          score: hasMCPSDK ? 20 : 0,
          details: {
            hasPackageJson: true,
            hasMCPSDK: !!hasMCPSDK,
            dependencies: Object.keys(packageJson.dependencies || {}),
            name: packageJson.name,
            version: packageJson.version
          },
          errorMessage: hasMCPSDK ? undefined : 'Missing @modelcontextprotocol/sdk dependency'
        };
      }

      return {
        type: 'package_json_mcp_sdk_required',
        passed: false,
        score: 0,
        details: {},
        errorMessage: 'package.json not found or not readable'
      };

    } catch (error: any) {
      return {
        type: 'package_json_mcp_sdk_required',
        passed: false,
        score: 0,
        details: {},
        errorMessage: `Cannot read package.json: ${error.message}`
      };
    }
  }

  /**
   * Validation: Check for README
   */
  private async validateReadme(owner: string, repo: string): Promise<ValidationResult> {
    try {
      await this.octokit.repos.getReadme({ owner, repo });

      return {
        type: 'has_readme',
        passed: true,
        score: 5,
        details: { hasReadme: true }
      };
    } catch {
      return {
        type: 'has_readme',
        passed: false,
        score: 0,
        details: { hasReadme: false },
        errorMessage: 'README not found'
      };
    }
  }

  /**
   * Validation: Test npm install works
   */
  private async validateNpmInstall(repositoryUrl: string): Promise<ValidationResult> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));

    try {
      logger.debug(`Testing npm install for ${repositoryUrl} in ${tempDir}`);

      // Clone repository
      await execAsync(`git clone --depth 1 ${repositoryUrl} ${tempDir}`, {
        timeout: 60000
      });

      // Run npm install
      const { stdout, stderr } = await execAsync('npm install', {
        cwd: tempDir,
        timeout: 120000 // 2 minute timeout
      });

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        type: 'npm_install_required',
        passed: true,
        score: 15,
        details: {
          installSuccessful: true,
          output: stdout.substring(0, 500)
        }
      };

    } catch (error: any) {
      // Clean up on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {}

      return {
        type: 'npm_install_required',
        passed: false,
        score: 0,
        details: {
          installSuccessful: false
        },
        errorMessage: `npm install failed: ${error.message}`
      };
    }
  }

  /**
   * Validation: Test server can start (basic functional test)
   */
  private async validateFunctionalTest(repositoryUrl: string): Promise<ValidationResult> {
    // For now, simplified functional test
    // TODO: Implement actual MCP protocol test
    return {
      type: 'functional_test',
      passed: true,
      score: 10,
      details: {
        note: 'Functional testing not yet implemented - auto-passed for now'
      }
    };
  }

  /**
   * Validation: Check if repository is a fork (show original only)
   */
  private async validateNotFork(owner: string, repo: string): Promise<ValidationResult> {
    try {
      const response = await this.octokit.repos.get({ owner, repo });

      const isFork = response.data.fork;

      if (isFork && response.data.parent) {
        // Record fork relationship
        await db.query(
          `INSERT INTO repository_relationships
           (server_id, relationship_type, confidence_score, metadata)
           SELECT id, 'fork', 1.0, $1
           FROM mcp_servers
           WHERE repository_url = $2
           ON CONFLICT DO NOTHING`,
          [
            JSON.stringify({
              parent_url: response.data.parent.html_url,
              parent_full_name: response.data.parent.full_name
            }),
            `https://github.com/${owner}/${repo}`
          ]
        );
      }

      return {
        type: 'not_fork',
        passed: !isFork,
        score: isFork ? -5 : 5,
        details: {
          isFork,
          parentUrl: isFork ? response.data.parent?.html_url : null
        },
        errorMessage: isFork ? 'Repository is a fork - original should be indexed instead' : undefined
      };

    } catch (error: any) {
      return {
        type: 'not_fork',
        passed: true, // If we can't check, assume not a fork
        score: 0,
        details: {},
        errorMessage: `Could not check fork status: ${error.message}`
      };
    }
  }

  /**
   * Add server as unverified to database
   */
  private async addUnverifiedServer(repositoryUrl: string, validations: ValidationResult[]): Promise<string | null> {
    try {
      const { owner, repo } = this.parseRepoUrl(repositoryUrl);

      // Fetch repo metadata
      const repoData = await this.octokit.repos.get({ owner, repo });

      // Fetch package.json for metadata
      let packageName = null;
      try {
        const pkgResponse = await this.octokit.repos.getContent({
          owner,
          repo,
          path: 'package.json'
        });

        if ('content' in pkgResponse.data) {
          const content = Buffer.from(pkgResponse.data.content, 'base64').toString('utf-8');
          const packageJson = JSON.parse(content);
          packageName = packageJson.name;
        }
      } catch {}

      // Auto-detect category from description/topics
      const category = this.detectCategory(repoData.data);

      // Create slug
      const slug = repo.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Insert server
      const result = await db.query(
        `INSERT INTO mcp_servers (
          name, slug, tagline, description, category,
          repository_url, repository_owner, repository_name,
          npm_package, verified, featured, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, NOW(), NOW())
        ON CONFLICT (repository_url)
        DO UPDATE SET updated_at = NOW()
        RETURNING id`,
        [
          repoData.data.name,
          slug,
          repoData.data.description || 'MCP Server',
          repoData.data.description || '',
          category,
          repositoryUrl,
          owner,
          repo,
          packageName
        ]
      );

      const serverId = result.rows[0]?.id;

      if (serverId) {
        // Update server stats
        await db.query(
          `INSERT INTO server_stats (server_id, github_stars, cli_installs)
           VALUES ($1, $2, 0)
           ON CONFLICT (server_id)
           DO UPDATE SET github_stars = $2, updated_at = NOW()`,
          [serverId, repoData.data.stargazers_count]
        );
      }

      return serverId;

    } catch (error: any) {
      logger.error('Failed to add unverified server', { repositoryUrl, error: error.message });
      return null;
    }
  }

  /**
   * Detect category from repository metadata
   */
  private detectCategory(repoData: any): string {
    const description = (repoData.description || '').toLowerCase();
    const topics = (repoData.topics || []).join(' ').toLowerCase();
    const text = `${description} ${topics}`;

    if (text.includes('database') || text.includes('sql') || text.includes('postgres')) return 'database';
    if (text.includes('file') || text.includes('filesystem') || text.includes('storage')) return 'filesystem';
    if (text.includes('memory') || text.includes('cache') || text.includes('redis')) return 'memory';
    if (text.includes('api') || text.includes('http') || text.includes('rest')) return 'api';

    return 'custom';
  }

  /**
   * Mark queue item as failed
   */
  private async markQueueItemFailed(queueId: string, error: string): Promise<void> {
    await db.query(
      `UPDATE discovery_queue
       SET status = 'failed',
           last_error = $2,
           retry_count = retry_count + 1,
           next_retry_at = NOW() + INTERVAL '1 hour',
           processed_at = NOW()
       WHERE id = $1`,
      [queueId, error]
    );
  }

  /**
   * Parse GitHub repository URL
   */
  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) {
      throw new Error(`Invalid GitHub URL: ${url}`);
    }
    return { owner: match[1], repo: match[2] };
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats(): Promise<any> {
    const queueStats = await db.query(`
      SELECT
        COUNT(*) as total_queued,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE source_type = 'github_search') as from_github_search,
        COUNT(*) FILTER (WHERE source_type = 'community_submission') as from_community
      FROM discovery_queue
    `);

    const recentActivity = await db.query(`
      SELECT
        DATE(processed_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM discovery_queue
      WHERE processed_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(processed_at)
      ORDER BY date DESC
    `);

    const validationStats = await db.query(`
      SELECT
        validation_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE passed = true) as passed,
        AVG(score) as avg_score
      FROM server_validations
      WHERE validated_at >= NOW() - INTERVAL '7 days'
      GROUP BY validation_type
    `);

    return {
      queueStats: queueStats.rows[0],
      recentActivity: recentActivity.rows,
      validationStats: validationStats.rows
    };
  }

  /**
   * Process discovery queue in batch
   * Validates and adds multiple repositories from the queue
   */
  async processQueue(options: { limit?: number } = {}): Promise<{
    processed: number;
    added: number;
    failed: number;
    results: DiscoveryResult[];
  }> {
    const limit = options.limit || 10;
    const results: DiscoveryResult[] = [];
    let added = 0;
    let failed = 0;

    logger.info(`Processing discovery queue (limit: ${limit})`);

    for (let i = 0; i < limit; i++) {
      const result = await this.processNextDiscoveryItem();

      if (!result) {
        logger.info('No more items in queue');
        break;
      }

      results.push(result);

      if (result.added) {
        added++;
      } else {
        failed++;
      }
    }

    logger.info(`Queue processing complete: ${results.length} processed, ${added} added, ${failed} failed`);

    return {
      processed: results.length,
      added,
      failed,
      results
    };
  }

  /**
   * Get items in discovery queue
   */
  async getQueueItems(options: { limit?: number; status?: string } = {}): Promise<any[]> {
    const limit = options.limit || 20;
    const status = options.status || 'pending';

    const result = await db.query(
      `SELECT
        id,
        repository_url,
        source_type,
        priority,
        status,
        retry_count,
        max_retries,
        last_error,
        metadata,
        created_at,
        processed_at,
        next_retry_at
      FROM discovery_queue
      WHERE status = $1
      ORDER BY priority DESC, created_at ASC
      LIMIT $2`,
      [status, limit]
    );

    return result.rows;
  }
}

export const githubDiscoveryService = GitHubDiscoveryService.getInstance();
