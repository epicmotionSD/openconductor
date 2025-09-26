/**
 * OpenConductor Registry API Routes
 * 
 * REST endpoints for agent registry, discovery, and marketplace features
 */

import { Router, Request, Response } from 'express';
import { OpenConductor } from '../../core/conductor';
import { Logger } from '../../utils/logger';
import { ErrorManager } from '../../utils/error-manager';
import { 
  asyncHandler, 
  NotFoundError, 
  ValidationError 
} from '../middleware/error-handler';
import { AgentRegistryEntry } from '../../types/agent';
import { APIResponse } from '../../types/api';

/**
 * Create registry management routes
 */
export function createRegistryRoutes(
  conductor: OpenConductor,
  logger: Logger,
  errorManager: ErrorManager
): Router {
  const router = Router();

  /**
   * GET /registry/agents - Search agents in registry
   */
  router.get('/agents', asyncHandler(async (req: Request, res: Response) => {
    const { 
      q, 
      type, 
      tags, 
      category,
      minRating,
      maxPrice,
      page = 1, 
      limit = 20,
      sort = 'popularity',
      order = 'desc'
    } = req.query;
    
    logger.debug('Searching agent registry', {
      q, type, tags, category, minRating, maxPrice,
      page, limit, sort, order,
      userId: req.user?.id
    });

    try {
      // Build search query
      const searchQuery: any = {
        q: q as string,
        type: type as string,
        tags: tags ? (tags as string).split(',') : undefined,
        category: category as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        limit: parseInt(limit as string)
      };

      // Get agents from registry (mock implementation)
      const allAgents = getMockRegistryAgents();
      
      // Apply filters
      let filteredAgents = allAgents;
      
      if (searchQuery.q) {
        const searchTerm = searchQuery.q.toLowerCase();
        filteredAgents = filteredAgents.filter(agent =>
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.description.toLowerCase().includes(searchTerm) ||
          agent.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      if (searchQuery.type) {
        filteredAgents = filteredAgents.filter(agent => agent.type === searchQuery.type);
      }
      
      if (searchQuery.category) {
        filteredAgents = filteredAgents.filter(agent => agent.category === searchQuery.category);
      }
      
      if (searchQuery.tags) {
        filteredAgents = filteredAgents.filter(agent =>
          searchQuery.tags.some((tag: string) => agent.tags.includes(tag))
        );
      }
      
      if (searchQuery.minRating) {
        filteredAgents = filteredAgents.filter(agent => agent.rating >= searchQuery.minRating);
      }
      
      if (searchQuery.maxPrice) {
        filteredAgents = filteredAgents.filter(agent => 
          !agent.price || agent.price <= searchQuery.maxPrice
        );
      }

      // Apply sorting
      filteredAgents.sort((a, b) => {
        let aValue, bValue;
        
        switch (sort) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'rating':
            aValue = a.rating;
            bValue = b.rating;
            break;
          case 'downloads':
            aValue = a.downloads;
            bValue = b.downloads;
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'publishedAt':
            aValue = new Date(a.publishedAt).getTime();
            bValue = new Date(b.publishedAt).getTime();
            break;
          case 'popularity':
          default:
            aValue = a.downloads * (a.rating || 0);
            bValue = b.downloads * (b.rating || 0);
            break;
        }
        
        if (order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // Apply pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      const paginatedAgents = filteredAgents.slice(offset, offset + limitNum);
      
      const total = filteredAgents.length;
      const totalPages = Math.ceil(total / limitNum);

      const response: APIResponse<AgentRegistryEntry[]> = {
        success: true,
        data: paginatedAgents,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      };

      logger.info('Agent registry search completed successfully', {
        query: q,
        resultsCount: paginatedAgents.length,
        total,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to search agent registry:', error);
      throw error;
    }
  }));

  /**
   * GET /registry/agents/:id - Get specific agent from registry
   */
  router.get('/agents/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting agent from registry', { agentId: id, userId: req.user?.id });

    try {
      const agent = getMockRegistryAgent(id);
      
      if (!agent) {
        throw new NotFoundError('Agent in registry', id);
      }

      const response: APIResponse<AgentRegistryEntry> = {
        success: true,
        data: agent,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent retrieved from registry successfully', {
        agentId: id,
        agentName: agent.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get agent from registry:', error);
      throw error;
    }
  }));

  /**
   * POST /registry/agents - Publish agent to registry
   */
  router.post('/agents', asyncHandler(async (req: Request, res: Response) => {
    const agentData = req.body as AgentRegistryEntry;
    
    logger.debug('Publishing agent to registry', { 
      agentName: agentData.name,
      agentType: agentData.type,
      userId: req.user?.id 
    });

    try {
      // Validate required fields
      if (!agentData.name || !agentData.type || !agentData.version) {
        throw new ValidationError('Missing required fields: name, type, version');
      }

      // Add publication metadata
      const registryEntry: AgentRegistryEntry = {
        ...agentData,
        id: agentData.id || generateRegistryId(),
        publishedAt: new Date(),
        publishedBy: req.user?.id,
        downloads: 0,
        rating: 0,
        reviews: [],
        status: 'pending',
        verified: false
      };

      // TODO: Store in registry database
      // For now, just return the entry

      const response: APIResponse<AgentRegistryEntry> = {
        success: true,
        data: registryEntry,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent published to registry successfully', {
        agentId: registryEntry.id,
        agentName: registryEntry.name,
        agentType: registryEntry.type,
        userId: req.user?.id
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to publish agent to registry:', error);
      throw error;
    }
  }));

  /**
   * PUT /registry/agents/:id - Update agent listing
   */
  router.put('/agents/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    logger.debug('Updating agent registry listing', { agentId: id, updates, userId: req.user?.id });

    try {
      const agent = getMockRegistryAgent(id);
      
      if (!agent) {
        throw new NotFoundError('Agent in registry', id);
      }

      // Check ownership (in real implementation)
      if (agent.publishedBy !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only update your own agent listings'
          }
        });
      }

      // Apply updates
      const updatedAgent = {
        ...agent,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      const response: APIResponse<AgentRegistryEntry> = {
        success: true,
        data: updatedAgent,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent registry listing updated successfully', {
        agentId: id,
        agentName: updatedAgent.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to update agent registry listing:', error);
      throw error;
    }
  }));

  /**
   * DELETE /registry/agents/:id - Remove agent from registry
   */
  router.delete('/agents/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Removing agent from registry', { agentId: id, userId: req.user?.id });

    try {
      const agent = getMockRegistryAgent(id);
      
      if (!agent) {
        throw new NotFoundError('Agent in registry', id);
      }

      // Check ownership (in real implementation)
      if (agent.publishedBy !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only remove your own agent listings'
          }
        });
      }

      // TODO: Remove from registry database

      const response: APIResponse<void> = {
        success: true,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent removed from registry successfully', {
        agentId: id,
        agentName: agent.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to remove agent from registry:', error);
      throw error;
    }
  }));

  /**
   * POST /registry/agents/:id/download - Download/install agent from registry
   */
  router.post('/agents/:id/download', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Downloading agent from registry', { agentId: id, userId: req.user?.id });

    try {
      const agent = getMockRegistryAgent(id);
      
      if (!agent) {
        throw new NotFoundError('Agent in registry', id);
      }

      // Generate download/installation instructions
      const downloadInfo = {
        agentId: agent.id,
        agentName: agent.name,
        version: agent.version,
        downloadUrl: `https://registry.openconductor.ai/agents/${id}/download`,
        installCommand: `openconductor install agent ${id}`,
        documentation: agent.documentation,
        requirements: agent.requirements || [],
        licenseAccepted: true, // In real implementation, require license acceptance
        estimatedSize: `${Math.floor(Math.random() * 50) + 10}MB`
      };

      // Increment download counter (in real implementation)
      agent.downloads = (agent.downloads || 0) + 1;

      const response: APIResponse<any> = {
        success: true,
        data: downloadInfo,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent download initiated successfully', {
        agentId: id,
        agentName: agent.name,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to download agent from registry:', error);
      throw error;
    }
  }));

  /**
   * GET /registry/agents/:id/stats - Get agent statistics
   */
  router.get('/agents/:id/stats', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    logger.debug('Getting agent statistics from registry', { agentId: id, userId: req.user?.id });

    try {
      const agent = getMockRegistryAgent(id);
      
      if (!agent) {
        throw new NotFoundError('Agent in registry', id);
      }

      const stats = {
        downloads: agent.downloads || 0,
        rating: agent.rating || 0,
        reviews: agent.reviews?.length || 0,
        installations: Math.floor((agent.downloads || 0) * 0.7), // Estimate
        activeUsers: Math.floor((agent.downloads || 0) * 0.3), // Estimate
        downloadTrend: generateDownloadTrend(),
        ratingDistribution: generateRatingDistribution(agent.rating || 0),
        popularityRank: Math.floor(Math.random() * 100) + 1,
        category: agent.category,
        tags: agent.tags
      };

      const response: APIResponse<any> = {
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Agent statistics retrieved successfully', {
        agentId: id,
        downloads: stats.downloads,
        rating: stats.rating,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get agent statistics:', error);
      throw error;
    }
  }));

  /**
   * GET /registry/categories - Get available categories
   */
  router.get('/categories', asyncHandler(async (req: Request, res: Response) => {
    logger.debug('Getting registry categories', { userId: req.user?.id });

    try {
      const categories = [
        { id: 'data-analysis', name: 'Data Analysis', count: 45 },
        { id: 'automation', name: 'Automation', count: 38 },
        { id: 'monitoring', name: 'Monitoring', count: 29 },
        { id: 'communication', name: 'Communication', count: 23 },
        { id: 'security', name: 'Security', count: 19 },
        { id: 'productivity', name: 'Productivity', count: 34 },
        { id: 'integration', name: 'Integration', count: 41 },
        { id: 'machine-learning', name: 'Machine Learning', count: 27 },
        { id: 'workflow', name: 'Workflow', count: 31 },
        { id: 'utilities', name: 'Utilities', count: 22 }
      ];

      const response: APIResponse<any[]> = {
        success: true,
        data: categories,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Registry categories retrieved successfully', {
        categoriesCount: categories.length,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get registry categories:', error);
      throw error;
    }
  }));

  /**
   * GET /registry/tags - Get popular tags
   */
  router.get('/tags', asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50 } = req.query;
    
    logger.debug('Getting registry tags', { limit, userId: req.user?.id });

    try {
      const tags = [
        { tag: 'data-processing', count: 67 },
        { tag: 'api-integration', count: 54 },
        { tag: 'automation', count: 43 },
        { tag: 'monitoring', count: 38 },
        { tag: 'nlp', count: 32 },
        { tag: 'machine-learning', count: 29 },
        { tag: 'workflow', count: 25 },
        { tag: 'database', count: 23 },
        { tag: 'web-scraping', count: 21 },
        { tag: 'email', count: 19 },
        { tag: 'slack', count: 18 },
        { tag: 'analytics', count: 16 },
        { tag: 'security', count: 15 },
        { tag: 'scheduling', count: 14 },
        { tag: 'reporting', count: 13 }
      ].slice(0, parseInt(limit as string));

      const response: APIResponse<any[]> = {
        success: true,
        data: tags,
        metadata: {
          timestamp: new Date(),
          version: 'v1',
          requestId: (req as any).requestId
        }
      };

      logger.info('Registry tags retrieved successfully', {
        tagsCount: tags.length,
        userId: req.user?.id
      });

      res.json(response);
    } catch (error) {
      logger.error('Failed to get registry tags:', error);
      throw error;
    }
  }));

  return router;
}

/**
 * Generate unique registry ID
 */
function generateRegistryId(): string {
  return `reg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

/**
 * Get mock registry agents (temporary implementation)
 */
function getMockRegistryAgents(): AgentRegistryEntry[] {
  return [
    {
      id: 'data-analyzer-pro',
      name: 'Data Analyzer Pro',
      description: 'Advanced data analysis agent with machine learning capabilities',
      type: 'oracle',
      version: '2.1.0',
      author: 'DataCorp Inc.',
      category: 'data-analysis',
      tags: ['data-processing', 'machine-learning', 'analytics'],
      capabilities: ['data-analysis', 'pattern-recognition', 'reporting'],
      requirements: ['python>=3.8', 'pandas', 'scikit-learn'],
      documentation: 'https://docs.datacorp.com/data-analyzer-pro',
      homepage: 'https://datacorp.com/products/analyzer-pro',
      repository: 'https://github.com/datacorp/analyzer-pro',
      license: 'MIT',
      price: 29.99,
      downloads: 1547,
      rating: 4.8,
      reviews: [
        { rating: 5, comment: 'Excellent tool for data analysis!', author: 'user1' },
        { rating: 4, comment: 'Very powerful but learning curve is steep', author: 'user2' }
      ],
      publishedAt: new Date('2024-01-15'),
      publishedBy: 'datacorp',
      status: 'published',
      verified: true,
      featured: true
    },
    {
      id: 'slack-notifier',
      name: 'Slack Notifier',
      description: 'Send notifications and manage Slack channels automatically',
      type: 'sentinel',
      version: '1.3.2',
      author: 'Community',
      category: 'communication',
      tags: ['slack', 'notifications', 'automation'],
      capabilities: ['messaging', 'channel-management', 'webhooks'],
      requirements: ['slack-sdk'],
      documentation: 'https://github.com/community/slack-notifier/wiki',
      repository: 'https://github.com/community/slack-notifier',
      license: 'Apache-2.0',
      downloads: 2341,
      rating: 4.6,
      reviews: [],
      publishedAt: new Date('2024-02-20'),
      publishedBy: 'community',
      status: 'published',
      verified: false,
      featured: false
    },
    {
      id: 'workflow-optimizer',
      name: 'Workflow Optimizer',
      description: 'Optimize and automate business workflows',
      type: 'advisory',
      version: '1.0.1',
      author: 'FlowTech Solutions',
      category: 'workflow',
      tags: ['workflow', 'optimization', 'automation'],
      capabilities: ['workflow-analysis', 'optimization', 'automation'],
      requirements: ['workflow-engine'],
      documentation: 'https://flowtech.io/docs/optimizer',
      repository: 'https://github.com/flowtech/workflow-optimizer',
      license: 'Commercial',
      price: 149.99,
      downloads: 823,
      rating: 4.9,
      reviews: [],
      publishedAt: new Date('2024-03-10'),
      publishedBy: 'flowtech',
      status: 'published',
      verified: true,
      featured: true
    }
  ];
}

/**
 * Get mock registry agent by ID (temporary implementation)
 */
function getMockRegistryAgent(id: string): AgentRegistryEntry | null {
  const agents = getMockRegistryAgents();
  return agents.find(agent => agent.id === id) || null;
}

/**
 * Generate download trend data
 */
function generateDownloadTrend(): Array<{ date: string; downloads: number }> {
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    trend.push({
      date: date.toISOString().split('T')[0],
      downloads: Math.floor(Math.random() * 20) + 5
    });
  }
  return trend;
}

/**
 * Generate rating distribution
 */
function generateRatingDistribution(avgRating: number): Record<string, number> {
  const base = Math.floor(avgRating);
  return {
    '5': base === 5 ? 60 : base === 4 ? 40 : 20,
    '4': base >= 4 ? 30 : 25,
    '3': 15,
    '2': 8,
    '1': 2
  };
}