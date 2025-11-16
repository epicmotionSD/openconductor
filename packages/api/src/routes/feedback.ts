import { Router } from 'express';
import { db } from '../db/connection';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

const router = Router();

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
 * Submit user feedback/testimonial
 * POST /api/feedback
 */
router.post('/', [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('testimonial').trim().isLength({ min: 10 }).withMessage('Testimonial must be at least 10 characters'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('permission').isBoolean().withMessage('Permission must be true or false'),
  body('role').optional().trim(),
  body('company').optional().trim(),
  body('experience').optional().trim()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      role,
      company,
      experience,
      testimonial,
      rating,
      permission
    } = req.body;

    // Store feedback in database
    const result = await db.query(
      `INSERT INTO user_feedback (
        name, role, company, discovery_method, testimonial, 
        rating, permission_to_use, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id`,
      [name, role, company, experience, testimonial, rating, permission]
    );

    const feedbackId = result.rows[0].id;

    // Log successful feedback submission
    logger.info('Feedback submitted', {
      feedbackId,
      name,
      company,
      rating,
      hasPermission: permission
    });

    // If this is a high-rating testimonial with permission, flag it for review
    if (rating >= 4 && permission) {
      await db.query(
        'UPDATE user_feedback SET featured_candidate = true WHERE id = $1',
        [feedbackId]
      );
      
      logger.info('High-rating testimonial flagged for featuring', { feedbackId, rating });
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!',
      id: feedbackId
    });

  } catch (error) {
    logger.error('Failed to submit feedback', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback. Please try again later.'
    });
  }
});

/**
 * Get featured testimonials (for marketing use)
 * GET /api/feedback/featured
 */
router.get('/featured', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        name, role, company, testimonial, rating, submitted_at
       FROM user_feedback 
       WHERE permission_to_use = true 
         AND rating >= 4 
         AND featured_candidate = true
       ORDER BY rating DESC, submitted_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      testimonials: result.rows
    });

  } catch (error) {
    logger.error('Failed to fetch featured testimonials', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    });
  }
});

/**
 * Get feedback stats (for internal use)
 * GET /api/feedback/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_submissions,
        AVG(rating) as average_rating,
        COUNT(*) FILTER (WHERE permission_to_use = true) as testimonials_with_permission,
        COUNT(*) FILTER (WHERE rating >= 4) as high_ratings,
        COUNT(*) FILTER (WHERE featured_candidate = true) as featured_candidates
       FROM user_feedback`
    );

    const discoveryMethods = await db.query(
      `SELECT discovery_method, COUNT(*) as count 
       FROM user_feedback 
       WHERE discovery_method IS NOT NULL 
       GROUP BY discovery_method 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      stats: {
        ...stats.rows[0],
        discovery_methods: discoveryMethods.rows
      }
    });

  } catch (error) {
    logger.error('Failed to fetch feedback stats', { error: error.message });
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

export default router;