import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db/connection';
import { ErrorCodes } from '@openconductor/shared';
import { createError } from './errorHandler';
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

/**
 * Authentication and authorization middleware system
 */

interface APIKey {
  id: string;
  name: string;
  permissions: {
    read: boolean;
    write: boolean;
    admin: boolean;
    submit: boolean;
    manage: boolean;
  };
  rateLimitPerHour: number;
  active: boolean;
  userId?: string;
}

interface AuthenticatedRequest extends Request {
  apiKey?: APIKey;
  user?: {
    id: string;
    email: string;
    role: 'user' | 'moderator' | 'admin';
  };
  permissions?: string[];
}

/**
 * API Key authentication middleware
 */
export const authenticateAPIKey = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication (for public endpoints)
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return next();
    }

    // Hash the token to lookup in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Lookup API key
    const result = await db.query(`
      SELECT 
        id, name, permissions, rate_limit_per_hour, active, user_id, 
        last_used_at, expires_at
      FROM api_keys 
      WHERE key_hash = $1 AND active = true
    `, [tokenHash]);

    if (result.rows.length === 0) {
      throw createError('Invalid API key', 401, ErrorCodes.UNAUTHORIZED);
    }

    const apiKeyData = result.rows[0];

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      throw createError('API key has expired', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Update last used timestamp
    await db.query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [apiKeyData.id]
    );

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyData.id,
      name: apiKeyData.name,
      permissions: apiKeyData.permissions,
      rateLimitPerHour: apiKeyData.rate_limit_per_hour,
      active: apiKeyData.active,
      userId: apiKeyData.user_id
    };

    logger.debug('API key authenticated', {
      keyId: apiKeyData.id,
      keyName: apiKeyData.name,
      userId: apiKeyData.user_id
    });

    next();

  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    
    logger.error('API key authentication failed', { error: error.message });
    return next(createError('Authentication failed', 401, ErrorCodes.UNAUTHORIZED));
  }
};

/**
 * Require authentication middleware
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey && !req.user) {
    throw createError(
      'Authentication required. Please provide a valid API key.',
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }
  
  next();
};

/**
 * Permission check middleware factory
 */
export const requirePermission = (permission: keyof APIKey['permissions']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey?.permissions[permission]) {
      throw createError(
        `Permission denied. Required permission: ${permission}`,
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }
    
    next();
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const hasAdminPermission = req.apiKey?.permissions.admin || req.user?.role === 'admin';
  
  if (!hasAdminPermission) {
    throw createError(
      'Admin access required',
      403,
      ErrorCodes.UNAUTHORIZED
    );
  }
  
  next();
};

/**
 * Server ownership verification middleware
 */
export const requireServerOwnership = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id || req.apiKey?.userId;
    
    if (!userId) {
      throw createError('User identification required for ownership verification', 401);
    }

    // Check if user owns this server (simplified - would need proper ownership table)
    const serverResult = await db.query(`
      SELECT s.id, s.repository_owner, s.repository_name
      FROM mcp_servers s
      WHERE s.slug = $1
    `, [slug]);

    if (serverResult.rows.length === 0) {
      throw createError('Server not found', 404, ErrorCodes.NOT_FOUND);
    }

    const server = serverResult.rows[0];

    // For now, check if user has admin permission
    // In production, would verify GitHub ownership or explicit ownership records
    const hasOwnership = req.apiKey?.permissions.admin || req.user?.role === 'admin';
    
    if (!hasOwnership) {
      throw createError(
        'You do not have permission to modify this server',
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }

    next();

  } catch (error) {
    if (error.statusCode) {
      return next(error);
    }
    
    logger.error('Ownership verification failed', { error: error.message });
    return next(createError('Ownership verification failed', 500));
  }
};

/**
 * API key management service
 */
export class APIKeyService {
  private static instance: APIKeyService;

  public static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  /**
   * Create a new API key
   */
  async createAPIKey(
    name: string,
    permissions: Partial<APIKey['permissions']> = {},
    userId?: string,
    rateLimitPerHour: number = 1000,
    expiresInDays?: number
  ): Promise<{ apiKey: string; keyInfo: Partial<APIKey> }> {
    try {
      // Generate secure random API key
      const apiKey = this.generateAPIKey();
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Set default permissions
      const fullPermissions = {
        read: true,
        write: false,
        admin: false,
        submit: false,
        manage: false,
        ...permissions
      };

      // Calculate expiration date
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      // Insert into database
      const result = await db.query(`
        INSERT INTO api_keys (
          key_hash, name, user_id, permissions, rate_limit_per_hour, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `, [
        keyHash,
        name,
        userId || null,
        JSON.stringify(fullPermissions),
        rateLimitPerHour,
        expiresAt
      ]);

      const keyInfo = {
        id: result.rows[0].id,
        name,
        permissions: fullPermissions,
        rateLimitPerHour,
        active: true,
        userId,
        createdAt: result.rows[0].created_at,
        expiresAt: expiresAt?.toISOString()
      };

      logger.info('API key created', {
        keyId: keyInfo.id,
        keyName: name,
        userId,
        permissions: Object.keys(fullPermissions).filter(k => fullPermissions[k as keyof typeof fullPermissions])
      });

      return { apiKey, keyInfo };

    } catch (error) {
      logger.error('Failed to create API key', { name, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(keyId: string): Promise<boolean> {
    try {
      const result = await db.query(
        'UPDATE api_keys SET active = false, updated_at = NOW() WHERE id = $1',
        [keyId]
      );

      const revoked = result.rowCount > 0;
      
      if (revoked) {
        logger.info('API key revoked', { keyId });
      }

      return revoked;

    } catch (error) {
      logger.error('Failed to revoke API key', { keyId, error: error.message });
      throw error;
    }
  }

  /**
   * List API keys for a user
   */
  async listUserAPIKeys(userId: string): Promise<Partial<APIKey>[]> {
    try {
      const result = await db.query(`
        SELECT id, name, permissions, rate_limit_per_hour, active, 
               last_used_at, expires_at, created_at
        FROM api_keys
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        permissions: row.permissions,
        rateLimitPerHour: row.rate_limit_per_hour,
        active: row.active,
        lastUsedAt: row.last_used_at,
        expiresAt: row.expires_at,
        createdAt: row.created_at
      }));

    } catch (error) {
      logger.error('Failed to list API keys', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update API key permissions
   */
  async updateAPIKeyPermissions(
    keyId: string, 
    permissions: Partial<APIKey['permissions']>
  ): Promise<boolean> {
    try {
      // Get current permissions
      const currentResult = await db.query(
        'SELECT permissions FROM api_keys WHERE id = $1',
        [keyId]
      );

      if (currentResult.rows.length === 0) {
        return false;
      }

      const currentPermissions = currentResult.rows[0].permissions;
      const updatedPermissions = { ...currentPermissions, ...permissions };

      // Update permissions
      const result = await db.query(
        'UPDATE api_keys SET permissions = $2, updated_at = NOW() WHERE id = $1',
        [keyId, JSON.stringify(updatedPermissions)]
      );

      const updated = result.rowCount > 0;
      
      if (updated) {
        logger.info('API key permissions updated', {
          keyId,
          newPermissions: Object.keys(permissions)
        });
      }

      return updated;

    } catch (error) {
      logger.error('Failed to update API key permissions', { keyId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate secure API key
   */
  private generateAPIKey(): string {
    // Generate 32 bytes of random data
    const randomBytes = crypto.randomBytes(32);
    
    // Create a readable API key format: oc_live_xxxxxxxxxxxxx
    const prefix = process.env.NODE_ENV === 'production' ? 'oc_live_' : 'oc_test_';
    const keyData = randomBytes.toString('base64url'); // URL-safe base64
    
    return prefix + keyData;
  }
}

/**
 * OAuth integration for GitHub-based authentication
 */
export class GitHubAuthService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.GITHUB_OAUTH_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      logger.warn('GitHub OAuth not configured - user authentication will be limited');
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI || 'http://localhost:3001/auth/github/callback',
      scope: 'read:user,user:email',
      state: state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description}`);
      }

      return data.access_token;

    } catch (error) {
      logger.error('GitHub OAuth token exchange failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user information from GitHub
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    login: string;
    email: string;
    name: string;
    avatar_url: string;
  }> {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'OpenConductor/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const userData = await response.json();

      // Get primary email if not public
      let email = userData.email;
      if (!email) {
        const emailResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'OpenConductor/1.0.0'
          }
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json();
          const primaryEmail = emails.find((e: any) => e.primary);
          email = primaryEmail?.email;
        }
      }

      return {
        id: userData.id.toString(),
        login: userData.login,
        email: email || '',
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url
      };

    } catch (error) {
      logger.error('Failed to get GitHub user info', { error: error.message });
      throw error;
    }
  }
}

/**
 * Permission checking utilities
 */
export class PermissionChecker {
  /**
   * Check if request has specific permission
   */
  static hasPermission(req: AuthenticatedRequest, permission: keyof APIKey['permissions']): boolean {
    // Check API key permissions
    if (req.apiKey?.permissions[permission]) {
      return true;
    }

    // Check user role permissions
    if (req.user) {
      switch (permission) {
        case 'read':
          return true; // All authenticated users can read
        case 'write':
          return ['moderator', 'admin'].includes(req.user.role);
        case 'admin':
          return req.user.role === 'admin';
        case 'submit':
          return true; // All authenticated users can submit
        case 'manage':
          return ['moderator', 'admin'].includes(req.user.role);
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Check if user can modify a specific server
   */
  static async canModifyServer(
    req: AuthenticatedRequest, 
    serverSlug: string
  ): Promise<boolean> {
    // Admins can modify any server
    if (this.hasPermission(req, 'admin')) {
      return true;
    }

    // Check server ownership (simplified)
    // In production, would check against ownership records or GitHub permissions
    try {
      const serverResult = await db.query(`
        SELECT repository_owner
        FROM mcp_servers
        WHERE slug = $1
      `, [serverSlug]);

      if (serverResult.rows.length === 0) {
        return false;
      }

      // For now, allow modification if user has manage permission
      return this.hasPermission(req, 'manage');

    } catch (error) {
      logger.error('Server ownership check failed', { serverSlug, error: error.message });
      return false;
    }
  }

  /**
   * Get effective permissions for request
   */
  static getEffectivePermissions(req: AuthenticatedRequest): string[] {
    const permissions: string[] = [];

    if (req.apiKey) {
      Object.entries(req.apiKey.permissions).forEach(([perm, allowed]) => {
        if (allowed) {
          permissions.push(perm);
        }
      });
    }

    if (req.user) {
      permissions.push('read', 'submit');
      
      if (['moderator', 'admin'].includes(req.user.role)) {
        permissions.push('write', 'manage');
      }
      
      if (req.user.role === 'admin') {
        permissions.push('admin');
      }
    }

    return [...new Set(permissions)]; // Remove duplicates
  }
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CORS headers for API requests
  const allowedOrigins = [
    'https://openconductor.ai',
    'https://www.openconductor.ai',
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  }

  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Remove potentially dangerous characters
        req.query[key] = value.replace(/[<>'"]/g, '');
      }
    }
  }

  // Limit request body size
  if (req.body && JSON.stringify(req.body).length > 1024 * 1024) { // 1MB limit
    throw createError('Request body too large', 413);
  }

  next();
};

// Export singleton instances
export const apiKeyService = APIKeyService.getInstance();
export const githubAuthService = new GitHubAuthService();