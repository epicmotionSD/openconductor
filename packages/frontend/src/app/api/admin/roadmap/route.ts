import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/roadmap
 * Returns roadmap data including items, categories, and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get('resource'); // 'items', 'categories', 'stats', 'updates'

    // If no resource specified, return all data
    if (!resource) {
      const [items, categories, stats, recentUpdates] = await Promise.all([
        getRoadmapItems(),
        getCategories(),
        getRoadmapStats(),
        getRecentUpdates()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          items,
          categories,
          stats,
          recentUpdates
        }
      });
    }

    // Return specific resource
    switch (resource) {
      case 'items':
        const items = await getRoadmapItems();
        return NextResponse.json({ success: true, data: items });

      case 'categories':
        const categories = await getCategories();
        return NextResponse.json({ success: true, data: categories });

      case 'stats':
        const stats = await getRoadmapStats();
        return NextResponse.json({ success: true, data: stats });

      case 'updates':
        const updates = await getRecentUpdates();
        return NextResponse.json({ success: true, data: updates });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid resource parameter' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Roadmap API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roadmap data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roadmap
 * Create a new roadmap item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      description,
      categoryId,
      status,
      priority,
      targetQuarter,
      targetDate,
      owner,
      tags,
      metadata,
      isPublic,
      isFeatured
    } = body;

    if (!title || !slug || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, slug, description' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO roadmap_items (
        title, slug, description, category_id, status, priority,
        target_quarter, target_date, owner, tags, metadata,
        is_public, is_featured
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING
        id, title, slug, description,
        category_id as "categoryId",
        status, priority,
        target_quarter as "targetQuarter",
        target_date as "targetDate",
        completed_date as "completedDate",
        progress_percentage as "progressPercentage",
        owner, tags, metadata,
        vote_count as "voteCount",
        is_public as "isPublic",
        is_featured as "isFeatured",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [
      title,
      slug,
      description,
      categoryId || null,
      status || 'planned',
      priority || 'medium',
      targetQuarter || null,
      targetDate || null,
      owner || null,
      tags || [],
      metadata || {},
      isPublic !== undefined ? isPublic : true,
      isFeatured !== undefined ? isFeatured : false
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Roadmap item creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create roadmap item',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/roadmap
 * Update a roadmap item
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      slug,
      description,
      categoryId,
      status,
      priority,
      targetQuarter,
      targetDate,
      completedDate,
      progressPercentage,
      owner,
      tags,
      metadata,
      isPublic,
      isFeatured
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Roadmap item ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(categoryId);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      // If completing, set completed_date
      if (status === 'completed') {
        updates.push(`completed_date = NOW()`);
        updates.push(`progress_percentage = 100`);
      }
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramCount++}`);
      values.push(priority);
    }
    if (targetQuarter !== undefined) {
      updates.push(`target_quarter = $${paramCount++}`);
      values.push(targetQuarter);
    }
    if (targetDate !== undefined) {
      updates.push(`target_date = $${paramCount++}`);
      values.push(targetDate);
    }
    if (completedDate !== undefined) {
      updates.push(`completed_date = $${paramCount++}`);
      values.push(completedDate);
    }
    if (progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramCount++}`);
      values.push(progressPercentage);
    }
    if (owner !== undefined) {
      updates.push(`owner = $${paramCount++}`);
      values.push(owner);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(metadata);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(isPublic);
    }
    if (isFeatured !== undefined) {
      updates.push(`is_featured = $${paramCount++}`);
      values.push(isFeatured);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query(`
      UPDATE roadmap_items
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id, title, slug, description,
        category_id as "categoryId",
        status, priority,
        target_quarter as "targetQuarter",
        target_date as "targetDate",
        completed_date as "completedDate",
        progress_percentage as "progressPercentage",
        owner, tags, metadata,
        vote_count as "voteCount",
        is_public as "isPublic",
        is_featured as "isFeatured",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Roadmap item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Roadmap item update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update roadmap item',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roadmap
 * Delete a roadmap item
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Roadmap item ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      DELETE FROM roadmap_items
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Roadmap item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Roadmap item deleted successfully'
    });

  } catch (error: any) {
    console.error('Roadmap item deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete roadmap item',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Get all roadmap items with their category information
 */
async function getRoadmapItems() {
  const result = await query(`
    SELECT
      ri.id,
      ri.title,
      ri.slug,
      ri.description,
      ri.category_id as "categoryId",
      ri.status,
      ri.priority,
      ri.target_quarter as "targetQuarter",
      ri.target_date as "targetDate",
      ri.completed_date as "completedDate",
      ri.progress_percentage as "progressPercentage",
      ri.owner,
      ri.tags,
      ri.metadata,
      ri.vote_count as "voteCount",
      ri.is_public as "isPublic",
      ri.is_featured as "isFeatured",
      ri.created_at as "createdAt",
      ri.updated_at as "updatedAt",
      rc.name as "categoryName",
      rc.slug as "categorySlug",
      rc.color as "categoryColor"
    FROM roadmap_items ri
    LEFT JOIN roadmap_categories rc ON ri.category_id = rc.id
    WHERE ri.is_public = true
    ORDER BY
      CASE ri.status
        WHEN 'in-progress' THEN 1
        WHEN 'planned' THEN 2
        WHEN 'completed' THEN 3
        WHEN 'on-hold' THEN 4
        ELSE 5
      END,
      CASE ri.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      ri.created_at DESC
  `);

  return result.rows;
}

/**
 * Get all active categories
 */
async function getCategories() {
  const result = await query(`
    SELECT
      id,
      name,
      slug,
      description,
      color,
      icon,
      display_order as "displayOrder",
      is_active as "isActive",
      created_at as "createdAt"
    FROM roadmap_categories
    WHERE is_active = true
    ORDER BY display_order ASC, name ASC
  `);

  return result.rows;
}

/**
 * Get roadmap statistics
 */
async function getRoadmapStats() {
  const result = await query(`
    SELECT
      COUNT(*) as total_items,
      COUNT(*) FILTER (WHERE status = 'planned') as planned_count,
      COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE status = 'on-hold') as on_hold_count,
      COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
      COALESCE(ROUND(AVG(progress_percentage)), 0) as avg_progress,
      COALESCE(SUM(vote_count), 0) as total_votes
    FROM roadmap_items
    WHERE is_public = true
  `);

  const row = result.rows[0];
  return {
    totalItems: parseInt(row.total_items || '0'),
    plannedCount: parseInt(row.planned_count || '0'),
    inProgressCount: parseInt(row.in_progress_count || '0'),
    completedCount: parseInt(row.completed_count || '0'),
    onHoldCount: parseInt(row.on_hold_count || '0'),
    featuredCount: parseInt(row.featured_count || '0'),
    avgProgress: parseInt(row.avg_progress || '0'),
    totalVotes: parseInt(row.total_votes || '0')
  };
}

/**
 * Get recent roadmap updates
 */
async function getRecentUpdates() {
  const result = await query(`
    SELECT
      ru.id,
      ru.roadmap_item_id as "roadmapItemId",
      ru.title,
      ru.content,
      ru.update_type as "updateType",
      ru.previous_status as "previousStatus",
      ru.new_status as "newStatus",
      ru.progress_change as "progressChange",
      ru.created_by as "createdBy",
      ru.created_at as "createdAt",
      ri.title as "itemTitle",
      ri.slug as "itemSlug"
    FROM roadmap_updates ru
    JOIN roadmap_items ri ON ru.roadmap_item_id = ri.id
    WHERE ri.is_public = true
    ORDER BY ru.created_at DESC
    LIMIT 10
  `);

  return result.rows;
}
