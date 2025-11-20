import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/campaigns
 * Returns campaign data including campaigns, templates, and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get('resource'); // 'campaigns', 'templates', 'stats', 'schedule'

    // If no resource specified, return all data
    if (!resource) {
      const [campaigns, templates, stats] = await Promise.all([
        getCampaigns(),
        getTemplates(),
        getCampaignStats()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          campaigns,
          templates,
          stats
        }
      });
    }

    // Return specific resource
    switch (resource) {
      case 'campaigns':
        const campaigns = await getCampaigns();
        return NextResponse.json({ success: true, data: campaigns });

      case 'templates':
        const templates = await getTemplates();
        return NextResponse.json({ success: true, data: templates });

      case 'stats':
        const stats = await getCampaignStats();
        return NextResponse.json({ success: true, data: stats });

      case 'schedule':
        const schedules = await getLaunchSchedules();
        return NextResponse.json({ success: true, data: schedules });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid resource parameter' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch campaign data',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, title, content, scheduledDate, templateId, metadata } = body;

    if (!name || !type || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, type, content' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO marketing_campaigns (
        name, type, title, content, scheduled_date, template_id, metadata, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
      RETURNING
        id, name, type, status, title, content,
        scheduled_date as "scheduledDate",
        template_id as "templateId",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [name, type, title || null, content, scheduledDate || null, templateId || null, metadata || {}]);

    const campaign = result.rows[0];

    // Create initial metrics entry
    await query(`
      INSERT INTO campaign_metrics (campaign_id, views, clicks, conversions)
      VALUES ($1, 0, 0, 0)
    `, [campaign.id]);

    return NextResponse.json({
      success: true,
      data: campaign
    }, { status: 201 });

  } catch (error: any) {
    console.error('Campaign creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create campaign',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/campaigns
 * Update a campaign (status, content, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, title, content, status, scheduledDate, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      // If publishing, set published_date
      if (status === 'published') {
        updates.push(`published_date = NOW()`);
      }
    }
    if (scheduledDate !== undefined) {
      updates.push(`scheduled_date = $${paramCount++}`);
      values.push(scheduledDate);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(metadata);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query(`
      UPDATE marketing_campaigns
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING
        id, name, type, status, title, content,
        scheduled_date as "scheduledDate",
        published_date as "publishedDate",
        template_id as "templateId",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Campaign update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update campaign',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/campaigns
 * Delete a campaign
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      DELETE FROM marketing_campaigns
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error: any) {
    console.error('Campaign deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete campaign',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Get all campaigns with their metrics
 */
async function getCampaigns() {
  const result = await query(`
    SELECT
      c.id,
      c.name,
      c.type,
      c.status,
      c.title,
      c.content,
      c.scheduled_date as "scheduledDate",
      c.published_date as "publishedDate",
      c.template_id as "templateId",
      c.metadata,
      c.created_at as "createdAt",
      c.updated_at as "updatedAt",
      COALESCE(
        jsonb_build_object(
          'views', m.views,
          'clicks', m.clicks,
          'conversions', m.conversions
        ),
        jsonb_build_object('views', 0, 'clicks', 0, 'conversions', 0)
      ) as metrics
    FROM marketing_campaigns c
    LEFT JOIN LATERAL (
      SELECT views, clicks, conversions
      FROM campaign_metrics
      WHERE campaign_id = c.id
      ORDER BY recorded_at DESC
      LIMIT 1
    ) m ON true
    ORDER BY c.created_at DESC
  `);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    title: row.title,
    content: row.content,
    scheduledDate: row.scheduledDate,
    publishedDate: row.publishedDate,
    templateId: row.templateId,
    metadata: row.metadata,
    metrics: row.metrics,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));
}

/**
 * Get all campaign templates
 */
async function getTemplates() {
  const result = await query(`
    SELECT
      id,
      name,
      type,
      template,
      variables,
      description,
      is_active as "isActive",
      created_at as "createdAt"
    FROM campaign_templates
    WHERE is_active = true
    ORDER BY created_at ASC
  `);

  return result.rows;
}

/**
 * Get campaign statistics
 */
async function getCampaignStats() {
  const result = await query(`
    SELECT
      COUNT(*) as total_campaigns,
      COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
      COUNT(*) FILTER (WHERE status = 'published') as published_count,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COALESCE(SUM((
        SELECT views FROM campaign_metrics cm
        WHERE cm.campaign_id = mc.id
        ORDER BY recorded_at DESC LIMIT 1
      )), 0) as total_views,
      COALESCE(SUM((
        SELECT clicks FROM campaign_metrics cm
        WHERE cm.campaign_id = mc.id
        ORDER BY recorded_at DESC LIMIT 1
      )), 0) as total_clicks,
      COALESCE(SUM((
        SELECT conversions FROM campaign_metrics cm
        WHERE cm.campaign_id = mc.id
        ORDER BY recorded_at DESC LIMIT 1
      )), 0) as total_conversions
    FROM marketing_campaigns mc
  `);

  const row = result.rows[0];
  return {
    totalCampaigns: parseInt(row.total_campaigns || '0'),
    draftCount: parseInt(row.draft_count || '0'),
    scheduledCount: parseInt(row.scheduled_count || '0'),
    publishedCount: parseInt(row.published_count || '0'),
    completedCount: parseInt(row.completed_count || '0'),
    totalViews: parseInt(row.total_views || '0'),
    totalClicks: parseInt(row.total_clicks || '0'),
    totalConversions: parseInt(row.total_conversions || '0')
  };
}

/**
 * Get launch schedules
 */
async function getLaunchSchedules() {
  const result = await query(`
    SELECT
      id,
      title,
      description,
      start_date as "startDate",
      end_date as "endDate",
      campaign_ids as "campaignIds",
      status,
      created_at as "createdAt"
    FROM launch_schedules
    ORDER BY start_date DESC
    LIMIT 10
  `);

  return result.rows;
}
