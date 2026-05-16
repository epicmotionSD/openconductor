import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { Octokit } from '@octokit/rest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel Pro

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'OpenConductor-Discovery/1.0.0'
});

// MCP server search queries
const SEARCH_QUERIES = [
  '@modelcontextprotocol/sdk language:typescript',
  '@modelcontextprotocol/sdk language:javascript', 
  'mcp-server in:name,description',
  'topic:mcp-server',
  '"@modelcontextprotocol" in:file'
];

interface DiscoveryResult {
  discovered: number;
  queued: number;
  processed: number;
  added: number;
  failed: number;
  errors: string[];
}

/**
 * POST /api/v1/discovery
 * Run the automated GitHub discovery process
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authorization in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid authorization' }
      }, { status: 401 });
    }
  }

  console.log('[DISCOVERY] Starting GitHub discovery...');
  
  const result: DiscoveryResult = {
    discovered: 0,
    queued: 0,
    processed: 0,
    added: 0,
    failed: 0,
    errors: []
  };

  try {
    const discoveredRepos = new Set<string>();

    // Search GitHub for MCP servers
    for (const query of SEARCH_QUERIES) {
      try {
        const searchResult = await searchGitHub(query);
        searchResult.forEach(url => discoveredRepos.add(url));
      } catch (err: any) {
        console.warn(`[DISCOVERY] Query failed: ${query}`, err.message);
        result.errors.push(`Search failed: ${query}`);
      }
    }

    result.discovered = discoveredRepos.size;
    console.log(`[DISCOVERY] Found ${result.discovered} unique repositories`);

    // Process each discovered repo
    for (const repoUrl of discoveredRepos) {
      try {
        const processed = await processRepository(repoUrl);
        result.processed++;
        
        if (processed.added) {
          result.added++;
        } else if (processed.skipped) {
          result.queued++; // Already exists
        } else {
          result.failed++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Failed: ${repoUrl} - ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[DISCOVERY] Completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Discovery completed',
        ...result,
        duration
      },
      meta: {
        timestamp: new Date().toISOString(),
        executionTime: duration
      }
    });

  } catch (error: any) {
    console.error('[DISCOVERY] Fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'DISCOVERY_FAILED',
        message: error.message
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/discovery
 * Get discovery status and stats
 */
export async function GET() {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_servers,
        COUNT(*) FILTER (WHERE verified = true) as verified,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as added_last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as added_last_week
      FROM mcp_servers
    `);

    return NextResponse.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        lastRun: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: { code: 'STATS_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// Search GitHub for repositories
async function searchGitHub(query: string, maxResults = 100): Promise<string[]> {
  const repos: string[] = [];
  
  try {
    const response = await octokit.search.repos({
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: Math.min(100, maxResults)
    });

    for (const repo of response.data.items) {
      repos.push(repo.html_url);
    }
  } catch (error: any) {
    console.warn(`[DISCOVERY] GitHub search error for "${query}":`, error.message);
  }

  return repos;
}

// Process a single repository
async function processRepository(repoUrl: string): Promise<{ added: boolean; skipped: boolean; reason?: string }> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  // Check if already exists
  const existing = await pool.query(
    'SELECT id FROM mcp_servers WHERE repository_url = $1',
    [repoUrl]
  );

  if (existing.rows.length > 0) {
    return { added: false, skipped: true, reason: 'Already exists' };
  }

  // Validate: Check for MCP SDK dependency
  const hasMCPSDK = await validateMCPDependency(owner, repo);
  if (!hasMCPSDK) {
    return { added: false, skipped: false, reason: 'No MCP SDK dependency' };
  }

  // Get repo metadata
  const repoData = await octokit.repos.get({ owner, repo });
  
  if (repoData.data.fork) {
    return { added: false, skipped: false, reason: 'Is a fork' };
  }

  // Get package.json for npm package name
  let npmPackage = null;
  try {
    const pkgResponse = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
    if ('content' in pkgResponse.data) {
      const content = Buffer.from(pkgResponse.data.content, 'base64').toString('utf-8');
      const packageJson = JSON.parse(content);
      npmPackage = packageJson.name;
    }
  } catch {}

  // Detect category
  const category = detectCategory(repoData.data.description || '', repoData.data.topics || []);
  const slug = repo.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Insert server
  const insertResult = await pool.query(`
    INSERT INTO mcp_servers (
      name, slug, tagline, description, category,
      repository_url, repository_owner, repository_name,
      npm_package, verified, featured, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, $10)
    ON CONFLICT (repository_url) DO NOTHING
    RETURNING id
  `, [
    repoData.data.name,
    slug,
    repoData.data.description || 'MCP Server',
    repoData.data.description || '',
    category,
    repoUrl,
    owner,
    repo,
    npmPackage,
    repoData.data.topics || []
  ]);

  if (insertResult.rows.length > 0) {
    const serverId = insertResult.rows[0].id;
    
    // Insert stats
    await pool.query(`
      INSERT INTO server_stats (server_id, github_stars, github_forks, cli_installs)
      VALUES ($1, $2, $3, 0)
      ON CONFLICT (server_id) DO UPDATE SET
        github_stars = $2,
        github_forks = $3,
        updated_at = NOW()
    `, [serverId, repoData.data.stargazers_count, repoData.data.forks_count]);

    return { added: true, skipped: false };
  }

  return { added: false, skipped: true, reason: 'Insert conflict' };
}

// Validate MCP SDK dependency
async function validateMCPDependency(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
    
    if ('content' in response.data) {
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      const packageJson = JSON.parse(content);
      
      return !!(
        packageJson.dependencies?.['@modelcontextprotocol/sdk'] ||
        packageJson.devDependencies?.['@modelcontextprotocol/sdk'] ||
        packageJson.peerDependencies?.['@modelcontextprotocol/sdk']
      );
    }
  } catch {}
  
  return false;
}

// Parse GitHub URL
function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

// Detect category from description and topics
function detectCategory(description: string, topics: string[]): string {
  const text = `${description} ${topics.join(' ')}`.toLowerCase();
  
  if (text.includes('database') || text.includes('sql') || text.includes('postgres')) return 'database';
  if (text.includes('file') || text.includes('filesystem') || text.includes('storage')) return 'filesystem';
  if (text.includes('memory') || text.includes('cache') || text.includes('redis')) return 'memory';
  if (text.includes('api') || text.includes('http') || text.includes('rest')) return 'api';
  if (text.includes('search') || text.includes('semantic')) return 'search';
  if (text.includes('communication') || text.includes('slack') || text.includes('email')) return 'communication';
  
  return 'custom';
}
