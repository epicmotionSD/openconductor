import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '../../../../lib/database';
import { randomBytes, createHash } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Admin authentication middleware
function authenticateAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_API_KEY || 'admin-dev-key-12345';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  return token === adminKey;
}

// Generate API key
function generateApiKey(): { key: string; hash: string } {
  const key = `oc_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, hash };
}

// GET - List all API keys
export async function GET(request: NextRequest) {
  try {
    if (!authenticateAdmin(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin API key' }
      }, { status: 401 });
    }

    const result = await dbPool.query(`
      SELECT
        id,
        name,
        permissions,
        rate_limit_per_hour,
        active,
        last_used_at,
        created_at,
        expires_at
      FROM api_keys
      ORDER BY created_at DESC
    `);

    const keys = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      permissions: row.permissions,
      rateLimitPerHour: row.rate_limit_per_hour,
      active: row.active,
      lastUsed: row.last_used_at ? formatTimeAgo(new Date(row.last_used_at)) : 'Never',
      created: row.created_at,
      expires: row.expires_at,
      // Don't return the actual key or hash for security
      keyPreview: '••••••••••••••••'
    }));

    return NextResponse.json({
      success: true,
      data: { keys },
      meta: {
        total: keys.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    if (!authenticateAdmin(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin API key' }
      }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions, rateLimitPerHour, expiresIn } = body;

    // Validate input
    if (!name || !permissions) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name and permissions are required' }
      }, { status: 400 });
    }

    // Generate API key
    const { key, hash } = generateApiKey();

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    }

    // Insert into database
    const result = await dbPool.query(`
      INSERT INTO api_keys (
        key_hash,
        name,
        permissions,
        rate_limit_per_hour,
        active,
        expires_at,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, name, permissions, rate_limit_per_hour, active, created_at, expires_at
    `, [
      hash,
      name,
      JSON.stringify(permissions),
      rateLimitPerHour || 1000,
      true,
      expiresAt
    ]);

    const createdKey = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: createdKey.id,
        name: createdKey.name,
        key: key, // Only return the actual key once during creation
        permissions: createdKey.permissions,
        rateLimitPerHour: createdKey.rate_limit_per_hour,
        active: createdKey.active,
        created: createdKey.created_at,
        expires: createdKey.expires_at
      },
      meta: {
        message: 'API key created successfully. Save this key securely - it won\'t be shown again.',
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating API key:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    if (!authenticateAdmin(request)) {
      return NextResponse.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin API key' }
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'API key ID is required' }
      }, { status: 400 });
    }

    // Soft delete by setting active = false
    await dbPool.query(`
      UPDATE api_keys
      SET active = false, updated_at = NOW()
      WHERE id = $1
    `, [id]);

    return NextResponse.json({
      success: true,
      meta: {
        message: 'API key revoked successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// Helper function to format timestamps
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
