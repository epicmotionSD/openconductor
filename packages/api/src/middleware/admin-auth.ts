import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { db } from '../db/connection';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

interface AuthenticatedRequest extends Request {
  adminKey?: {
    id: string;
    name: string;
    permissions: any;
  };
}

export async function adminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Admin API key required. Format: Authorization: Bearer <key>'
      });
    }

    const apiKey = authHeader.substring(7);
    
    if (!apiKey.startsWith('oc_admin_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin API key format'
      });
    }

    // Hash the provided key
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    // Verify key in database
    const result = await db.query(`
      SELECT id, name, permissions, active, expires_at
      FROM api_keys 
      WHERE key_hash = $1 AND active = true
    `, [keyHash]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or inactive admin API key'
      });
    }

    const keyData = result.rows[0];

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Admin API key has expired'
      });
    }

    // Check admin permissions
    const permissions = keyData.permissions;
    if (!permissions.admin?.full_access) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient admin permissions'
      });
    }

    // Update last used timestamp
    await db.query(`
      UPDATE api_keys 
      SET last_used_at = NOW() 
      WHERE id = $1
    `, [keyData.id]);

    // Attach admin info to request
    req.adminKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: permissions
    };

    next();
  } catch (error) {
    logger.error('Admin authentication error', error);
    res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
}

export default adminAuth;