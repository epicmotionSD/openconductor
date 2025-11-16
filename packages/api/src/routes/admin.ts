import { Router } from 'express';
import { z } from 'zod';
import { mcpServerRepository, statsRepository } from '../db/models';
import { query } from '../db/connection';
import adminAuth from '../middleware/admin-auth';
import winston from 'winston';

const router = Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Server creation schema
const createServerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  repository_url: z.string().url('Must be a valid URL'),
  repository_owner: z.string().min(1, 'Repository owner is required'),
  repository_name: z.string().min(1, 'Repository name is required'),
  npm_package: z.string().optional(),
  category: z.enum(['memory', 'filesystem', 'database', 'api', 'search', 'communication', 'monitoring', 'development', 'custom']),
  tags: z.array(z.string()).default([]),
  install_command: z.string().optional(),
  verified: z.boolean().default(false),
  featured: z.boolean().default(false)
});

// Apply admin auth to all routes
router.use(adminAuth);

// GET /admin/servers - List all servers with admin details
router.get('/servers', async (req, res) => {
  try {
    const result = await mcpServerRepository.list({
      limit: 100,
      page: 1,
      includeUnverified: true // Admin can see all servers
    } as any);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error listing servers for admin', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch servers'
    });
  }
});

// POST /admin/servers - Create new server
router.post('/servers', async (req, res) => {
  try {
    const validatedData = createServerSchema.parse(req.body);
    
    // Generate install command if not provided
    if (!validatedData.install_command) {
      validatedData.install_command = `openconductor install ${validatedData.slug}`;
    }

    const server = await mcpServerRepository.create(validatedData);
    
    logger.info('Admin created new server', { 
      serverId: server.id, 
      name: server.name,
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { server }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating server', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create server'
    });
  }
});

// PUT /admin/servers/:id - Update server
router.put('/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createServerSchema.partial().parse(req.body);
    
    const server = await mcpServerRepository.update(id, validatedData);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    logger.info('Admin updated server', { 
      serverId: id, 
      updates: Object.keys(validatedData),
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { server }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error updating server', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update server'
    });
  }
});

// DELETE /admin/servers/:id - Delete server
router.delete('/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await mcpServerRepository.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    logger.info('Admin deleted server', { 
      serverId: id, 
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    logger.error('Error deleting server', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete server'
    });
  }
});

// POST /admin/servers/:id/verify - Verify a server
router.post('/servers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    
    const server = await mcpServerRepository.update(id, { verified: true });
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    logger.info('Admin verified server', { 
      serverId: id, 
      serverName: server.name,
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { server }
    });
  } catch (error) {
    logger.error('Error verifying server', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify server'
    });
  }
});

// POST /admin/servers/:id/feature - Feature a server
router.post('/servers/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    
    const server = await mcpServerRepository.update(id, { featured: true });
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    logger.info('Admin featured server', { 
      serverId: id, 
      serverName: server.name,
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { server }
    });
  } catch (error) {
    logger.error('Error featuring server', error);
    res.status(500).json({
      success: false,
      error: 'Failed to feature server'
    });
  }
});

// POST /admin/servers/bulk-import - Bulk import from GitHub URLs
router.post('/servers/bulk-import', async (req, res) => {
  try {
    const { repositories } = req.body;
    
    if (!Array.isArray(repositories)) {
      return res.status(400).json({
        success: false,
        error: 'Repositories must be an array of GitHub URLs'
      });
    }

    const results = [];
    
    for (const repoUrl of repositories) {
      try {
        // Extract owner/repo from GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
          results.push({ url: repoUrl, error: 'Invalid GitHub URL' });
          continue;
        }

        const [, owner, repoName] = match;
        const slug = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        // Create basic server entry
        const serverData = {
          name: repoName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug,
          repository_url: repoUrl,
          repository_owner: owner,
          repository_name: repoName,
          category: 'custom' as const,
          tags: ['mcp', 'server'],
          install_command: `openconductor install ${slug}`,
          verified: false,
          featured: false
        };

        const server = await mcpServerRepository.create(serverData);
        results.push({ url: repoUrl, server: server.name, slug });
        
      } catch (error) {
        results.push({ url: repoUrl, error: error.message });
      }
    }

    logger.info('Admin bulk imported servers', { 
      count: repositories.length,
      successful: results.filter(r => !r.error).length,
      adminKey: (req as any).adminKey?.name 
    });

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    logger.error('Error bulk importing servers', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk import servers'
    });
  }
});

// GET /admin/stats - Admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get comprehensive admin stats
    const [
      totalServers,
      verifiedServers,
      pendingServers,
      recentActivity
    ] = await Promise.all([
        query('SELECT COUNT(*) FROM mcp_servers'),
        query('SELECT COUNT(*) FROM mcp_servers WHERE verified = true'),
        query('SELECT COUNT(*) FROM mcp_servers WHERE verified = false'),
        query(`
          SELECT name, created_at, verified 
          FROM mcp_servers 
          ORDER BY created_at DESC 
          LIMIT 10
        `)
    ]);

    res.json({
      success: true,
      data: {
        servers: {
          total: parseInt(totalServers.rows[0].count),
          verified: parseInt(verifiedServers.rows[0].count),
          pending: parseInt(pendingServers.rows[0].count)
        },
        recentActivity: recentActivity.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats'
    });
  }
});

export default router;