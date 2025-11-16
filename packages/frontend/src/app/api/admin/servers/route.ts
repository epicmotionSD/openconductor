import { NextRequest, NextResponse } from 'next/server';
import { db, dbPool } from '../../../../lib/database';
import { createHash } from 'crypto';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Admin authentication function
async function authenticateAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Admin API key required. Format: Authorization: Bearer <key>' };
    }

    const apiKey = authHeader.substring(7);
    
    if (!apiKey.startsWith('oc_admin_')) {
      return { error: 'Invalid admin API key format' };
    }

    // Hash the provided key
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    // Verify key in database
    const result = await dbPool.query(`
      SELECT id, name, permissions, active, expires_at
      FROM api_keys 
      WHERE key_hash = $1 AND active = true
    `, [keyHash]);

    if (result.rows.length === 0) {
      return { error: 'Invalid or inactive admin API key' };
    }

    const keyData = result.rows[0];

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { error: 'Admin API key has expired' };
    }

    // Check admin permissions (simple boolean structure)
    const permissions = keyData.permissions;
    if (!permissions.admin) {
      return { error: 'Insufficient admin permissions - admin access required' };
    }

    // Update last used timestamp
    await dbPool.query(`
      UPDATE api_keys 
      SET last_used_at = NOW() 
      WHERE id = $1
    `, [keyData.id]);

    return { 
      admin: {
        id: keyData.id,
        name: keyData.name,
        permissions: permissions
      }
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { error: 'Internal authentication error' };
  }
}

// GET /api/admin/servers - List all servers with admin details
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: 401 });
    }

    // Use optimized database service for admin queries
    const result = await db.getServers({
      limit: 100,
      page: 1,
      includeUnverified: true // Admin can see all servers
    });

    return NextResponse.json({
      success: true,
      data: { 
        servers: result.servers,
        pagination: result.pagination
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'private, no-cache' // Admin data should not be cached
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin servers:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

// POST /api/admin/servers - Create new server
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (authResult.error) {
      return NextResponse.json({
        success: false,
        error: authResult.error
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.slug || !body.repository_url || !body.repository_owner || !body.repository_name || !body.category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Generate install command if not provided
    const installCommand = body.install_command || `openconductor install ${body.slug}`;

    // Insert server using optimized connection pool
    const result = await dbPool.query(`
      INSERT INTO mcp_servers (
        name, slug, tagline, description, repository_url, repository_owner, 
        repository_name, npm_package, category, tags, install_command, 
        verified, featured, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `, [
      body.name,
      body.slug,
      body.tagline || '',
      body.description || '',
      body.repository_url,
      body.repository_owner,
      body.repository_name,
      body.npm_package || null,
      body.category,
      JSON.stringify(body.tags || []),
      installCommand,
      body.verified || false,
      body.featured || false
    ]);

    const server = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: { server }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error: any) {
    console.error('Error creating server:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create server'
      }
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}