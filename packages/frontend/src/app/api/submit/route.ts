import { NextRequest, NextResponse } from 'next/server';
import { dbPool } from '../../../lib/database';

export const dynamic = 'force-dynamic';

interface SubmissionRequest {
  repositoryUrl: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterGithub?: string;
  description?: string;
  suggestedCategory?: string;
  suggestedTags?: string[];
}

/**
 * POST /api/submit
 * Community submission endpoint for MCP servers
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmissionRequest = await request.json();

    // Validate required fields
    if (!body.repositoryUrl) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Repository URL is required'
        }
      }, { status: 400 });
    }

    // Validate URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubUrlPattern.test(body.repositoryUrl.replace(/\.git$/, ''))) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Please provide a valid GitHub repository URL (e.g., https://github.com/owner/repo)'
        }
      }, { status: 400 });
    }

    // Check if repository already exists
    const existingServer = await dbPool.query(
      'SELECT id, name, verified FROM mcp_servers WHERE repository_url = $1',
      [body.repositoryUrl]
    );

    if (existingServer.rows.length > 0) {
      const server = existingServer.rows[0];
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: `This server is already in our registry${server.verified ? '' : ' (pending verification)'}`,
          serverId: server.id,
          serverName: server.name
        }
      }, { status: 409 });
    }

    // Check if submission already exists
    const existingSubmission = await dbPool.query(
      'SELECT id, status FROM server_submissions WHERE repository_url = $1 ORDER BY created_at DESC LIMIT 1',
      [body.repositoryUrl]
    );

    if (existingSubmission.rows.length > 0) {
      const submission = existingSubmission.rows[0];

      if (submission.status === 'pending') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'SUBMISSION_PENDING',
            message: 'This server has already been submitted and is awaiting review',
            submissionId: submission.id
          }
        }, { status: 409 });
      }

      if (submission.status === 'rejected') {
        // Allow resubmission if previously rejected
        // Fall through to create new submission
      }
    }

    // Create submission record
    const result = await dbPool.query(
      `INSERT INTO server_submissions (
        repository_url,
        submitter_name,
        submitter_email,
        submitter_github,
        description,
        suggested_category,
        suggested_tags,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, created_at`,
      [
        body.repositoryUrl,
        body.submitterName || null,
        body.submitterEmail || null,
        body.submitterGithub || null,
        body.description || null,
        body.suggestedCategory || null,
        body.suggestedTags || null
      ]
    );

    const submission = result.rows[0];

    // Queue for discovery/validation with high priority
    await dbPool.query(
      `SELECT queue_repo_for_discovery($1, $2, $3, $4)`,
      [
        body.repositoryUrl,
        'community_submission',
        8, // High priority for community submissions
        JSON.stringify({
          submissionId: submission.id,
          submitterName: body.submitterName,
          submittedAt: submission.created_at
        })
      ]
    );

    // Send success response
    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        message: 'Thank you for your submission! We\'ll review it and add it to our registry shortly.',
        status: 'pending',
        estimatedReviewTime: '1-2 business days'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Submission error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to submit server'
      }
    }, { status: 500 });
  }
}

/**
 * GET /api/submit/:id
 * Check submission status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Submission ID is required'
        }
      }, { status: 400 });
    }

    const result = await dbPool.query(
      `SELECT
        id,
        repository_url,
        status,
        review_notes,
        created_at,
        reviewed_at,
        server_id
      FROM server_submissions
      WHERE id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Submission not found'
        }
      }, { status: 404 });
    }

    const submission = result.rows[0];

    // If approved and server created, get server details
    let serverDetails = null;
    if (submission.server_id) {
      const serverResult = await dbPool.query(
        'SELECT id, name, slug, verified FROM mcp_servers WHERE id = $1',
        [submission.server_id]
      );
      if (serverResult.rows.length > 0) {
        serverDetails = serverResult.rows[0];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        repositoryUrl: submission.repository_url,
        status: submission.status,
        reviewNotes: submission.review_notes,
        submittedAt: submission.created_at,
        reviewedAt: submission.reviewed_at,
        server: serverDetails
      }
    });

  } catch (error: any) {
    console.error('Status check error:', error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to check submission status'
      }
    }, { status: 500 });
  }
}

/**
 * OPTIONS - CORS support
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
