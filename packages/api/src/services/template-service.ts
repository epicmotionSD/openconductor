// Template Service - Top 10 Template Registry
// Manages template selection, retrieval, and deployment tracking

import { Pool } from 'pg';

// Types
export type TemplateIntent = 'transactional' | 'informational' | 'commercial' | 'navigational';

export interface Template {
  id: string;
  templateId: string; // T01-T10
  name: string;
  description: string;
  purpose: string;
  targetIntent: TemplateIntent;
  features: string[];
  componentSchema: TemplateComponentSchema;
  deployCount: number;
  avgConversionRate: number | null;
  previewUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateComponentSchema {
  sections: TemplateSection[];
  variables: TemplateVariable[];
  styles: TemplateStyles;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'hero' | 'trust' | 'cta' | 'gallery' | 'faq' | 'testimonials' | 'form' | 'map' | 'comparison' | 'content';
  required: boolean;
  order: number;
  defaultContent?: Record<string, any>;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'array' | 'boolean' | 'select';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: string[]; // For select type
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface TemplateStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
}

export interface TemplateRecommendation {
  template: Template;
  score: number;
  reason: string;
}

export class TemplateService {
  private static instance: TemplateService;
  private pool: Pool;

  // Template component schemas (define structure for each template)
  private static readonly COMPONENT_SCHEMAS: Record<string, TemplateComponentSchema> = {
    T01: {
      sections: [
        { id: 'hero', name: 'Hero Section', type: 'hero', required: true, order: 1 },
        { id: 'trust', name: 'Trust Bar', type: 'trust', required: true, order: 2 },
        { id: 'features', name: 'Features/Benefits', type: 'content', required: false, order: 3 },
        { id: 'testimonials', name: 'Testimonials', type: 'testimonials', required: true, order: 4 },
        { id: 'faq', name: 'FAQ Section', type: 'faq', required: false, order: 5 },
        { id: 'cta', name: 'Call to Action', type: 'cta', required: true, order: 6 }
      ],
      variables: [
        { key: 'headline', label: 'Main Headline', type: 'text', required: true, placeholder: 'Professional Sisterlocks in Houston' },
        { key: 'subheadline', label: 'Subheadline', type: 'text', required: false, placeholder: 'Transform your hair with expert loc care' },
        { key: 'heroImage', label: 'Hero Image URL', type: 'image', required: true },
        { key: 'ctaText', label: 'CTA Button Text', type: 'text', required: true, defaultValue: 'Book Now' },
        { key: 'ctaUrl', label: 'CTA URL', type: 'text', required: true },
        { key: 'trustLogos', label: 'Trust Logos', type: 'array', required: false },
        { key: 'testimonials', label: 'Testimonials', type: 'array', required: true },
        { key: 'faqs', label: 'FAQ Items', type: 'array', required: false },
        { key: 'phone', label: 'Phone Number', type: 'text', required: false },
        { key: 'address', label: 'Business Address', type: 'text', required: false }
      ],
      styles: {
        primaryColor: '#8B5CF6',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
        darkMode: false
      }
    },
    T02: {
      sections: [
        { id: 'header', name: 'Header', type: 'hero', required: true, order: 1 },
        { id: 'services', name: 'Service Selection', type: 'content', required: true, order: 2 },
        { id: 'calendar', name: 'Calendar Picker', type: 'form', required: true, order: 3 },
        { id: 'payment', name: 'Payment Section', type: 'form', required: false, order: 4 },
        { id: 'confirmation', name: 'Confirmation', type: 'content', required: true, order: 5 }
      ],
      variables: [
        { key: 'businessName', label: 'Business Name', type: 'text', required: true },
        { key: 'logoUrl', label: 'Logo URL', type: 'image', required: false },
        { key: 'services', label: 'Services List', type: 'array', required: true },
        { key: 'bookingProvider', label: 'Booking Provider', type: 'select', required: true, options: ['styleseat', 'calendly', 'acuity', 'custom'] },
        { key: 'bookingWidgetUrl', label: 'Booking Widget URL', type: 'text', required: true },
        { key: 'confirmationMessage', label: 'Confirmation Message', type: 'textarea', required: false }
      ],
      styles: {
        primaryColor: '#10B981',
        secondaryColor: '#111827',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '12px',
        darkMode: false
      }
    },
    T03: {
      sections: [
        { id: 'header', name: 'Gallery Header', type: 'hero', required: true, order: 1 },
        { id: 'filters', name: 'Category Filters', type: 'content', required: false, order: 2 },
        { id: 'gallery', name: 'Image Gallery', type: 'gallery', required: true, order: 3 },
        { id: 'cta', name: 'Contact CTA', type: 'cta', required: false, order: 4 }
      ],
      variables: [
        { key: 'title', label: 'Gallery Title', type: 'text', required: true },
        { key: 'description', label: 'Gallery Description', type: 'textarea', required: false },
        { key: 'categories', label: 'Categories', type: 'array', required: false },
        { key: 'images', label: 'Gallery Images', type: 'array', required: true },
        { key: 'enableBeforeAfter', label: 'Enable Before/After', type: 'boolean', required: false, defaultValue: true },
        { key: 'ctaText', label: 'CTA Text', type: 'text', required: false }
      ],
      styles: {
        primaryColor: '#EC4899',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '4px',
        darkMode: false
      }
    },
    T04: {
      sections: [
        { id: 'header', name: 'Article Header', type: 'hero', required: true, order: 1 },
        { id: 'toc', name: 'Table of Contents', type: 'content', required: true, order: 2 },
        { id: 'content', name: 'Main Content', type: 'content', required: true, order: 3 },
        { id: 'faq', name: 'FAQ Section', type: 'faq', required: true, order: 4 },
        { id: 'author', name: 'Author Bio', type: 'content', required: false, order: 5 },
        { id: 'related', name: 'Related Articles', type: 'content', required: false, order: 6 }
      ],
      variables: [
        { key: 'title', label: 'Article Title', type: 'text', required: true },
        { key: 'metaDescription', label: 'Meta Description', type: 'textarea', required: true, validation: { maxLength: 160 } },
        { key: 'featuredImage', label: 'Featured Image', type: 'image', required: true },
        { key: 'content', label: 'Article Content', type: 'textarea', required: true },
        { key: 'faqs', label: 'FAQ Items', type: 'array', required: true },
        { key: 'author', label: 'Author Name', type: 'text', required: false },
        { key: 'authorBio', label: 'Author Bio', type: 'textarea', required: false },
        { key: 'relatedArticles', label: 'Related Articles', type: 'array', required: false }
      ],
      styles: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1F2937',
        fontFamily: 'Georgia, serif',
        borderRadius: '0px',
        darkMode: false
      }
    },
    T05: {
      sections: [
        { id: 'header', name: 'Comparison Header', type: 'hero', required: true, order: 1 },
        { id: 'table', name: 'Comparison Table', type: 'comparison', required: true, order: 2 },
        { id: 'calculator', name: 'Cost Calculator', type: 'form', required: false, order: 3 },
        { id: 'details', name: 'Detailed Breakdown', type: 'content', required: false, order: 4 },
        { id: 'cta', name: 'Decision CTA', type: 'cta', required: true, order: 5 }
      ],
      variables: [
        { key: 'title', label: 'Comparison Title', type: 'text', required: true },
        { key: 'options', label: 'Options to Compare', type: 'array', required: true },
        { key: 'criteria', label: 'Comparison Criteria', type: 'array', required: true },
        { key: 'enableCalculator', label: 'Enable Calculator', type: 'boolean', required: false, defaultValue: false },
        { key: 'recommendedOption', label: 'Recommended Option', type: 'text', required: false },
        { key: 'ctaText', label: 'CTA Text', type: 'text', required: true }
      ],
      styles: {
        primaryColor: '#F59E0B',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
        darkMode: false
      }
    },
    T06: {
      sections: [
        { id: 'hero', name: 'Product Hero', type: 'hero', required: true, order: 1 },
        { id: 'details', name: 'Product Details', type: 'content', required: true, order: 2 },
        { id: 'reviews', name: 'Customer Reviews', type: 'testimonials', required: false, order: 3 },
        { id: 'related', name: 'Related Products', type: 'gallery', required: false, order: 4 }
      ],
      variables: [
        { key: 'productName', label: 'Product Name', type: 'text', required: true },
        { key: 'price', label: 'Price', type: 'text', required: true },
        { key: 'images', label: 'Product Images', type: 'array', required: true },
        { key: 'description', label: 'Product Description', type: 'textarea', required: true },
        { key: 'features', label: 'Product Features', type: 'array', required: false },
        { key: 'reviews', label: 'Reviews', type: 'array', required: false },
        { key: 'addToCartUrl', label: 'Add to Cart URL', type: 'text', required: true }
      ],
      styles: {
        primaryColor: '#EF4444',
        secondaryColor: '#111827',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
        darkMode: false
      }
    },
    T07: {
      sections: [
        { id: 'hero', name: 'Local Hero', type: 'hero', required: true, order: 1 },
        { id: 'map', name: 'Map Section', type: 'map', required: true, order: 2 },
        { id: 'services', name: 'Services', type: 'content', required: true, order: 3 },
        { id: 'testimonials', name: 'Local Reviews', type: 'testimonials', required: false, order: 4 },
        { id: 'cta', name: 'Contact CTA', type: 'cta', required: true, order: 5 }
      ],
      variables: [
        { key: 'city', label: 'City Name', type: 'text', required: true },
        { key: 'neighborhood', label: 'Neighborhood', type: 'text', required: false },
        { key: 'service', label: 'Service Name', type: 'text', required: true },
        { key: 'businessName', label: 'Business Name', type: 'text', required: true },
        { key: 'address', label: 'Full Address', type: 'text', required: true },
        { key: 'phone', label: 'Phone Number', type: 'text', required: true },
        { key: 'mapEmbedUrl', label: 'Google Maps Embed URL', type: 'text', required: true },
        { key: 'services', label: 'Services List', type: 'array', required: true },
        { key: 'localTestimonials', label: 'Local Testimonials', type: 'array', required: false }
      ],
      styles: {
        primaryColor: '#06B6D4',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '12px',
        darkMode: false
      }
    },
    T08: {
      sections: [
        { id: 'hero', name: 'Squeeze Hero', type: 'hero', required: true, order: 1 },
        { id: 'benefits', name: 'Benefits List', type: 'content', required: true, order: 2 },
        { id: 'form', name: 'Email Form', type: 'form', required: true, order: 3 },
        { id: 'preview', name: 'Lead Magnet Preview', type: 'content', required: false, order: 4 }
      ],
      variables: [
        { key: 'headline', label: 'Headline', type: 'text', required: true },
        { key: 'subheadline', label: 'Subheadline', type: 'text', required: false },
        { key: 'leadMagnetTitle', label: 'Lead Magnet Title', type: 'text', required: true },
        { key: 'leadMagnetImage', label: 'Lead Magnet Image', type: 'image', required: true },
        { key: 'benefits', label: 'Benefits', type: 'array', required: true },
        { key: 'formAction', label: 'Form Action URL', type: 'text', required: true },
        { key: 'downloadUrl', label: 'Download URL', type: 'text', required: true },
        { key: 'thankYouMessage', label: 'Thank You Message', type: 'textarea', required: false }
      ],
      styles: {
        primaryColor: '#7C3AED',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '16px',
        darkMode: false
      }
    },
    T09: {
      sections: [
        { id: 'header', name: 'Reviews Header', type: 'hero', required: true, order: 1 },
        { id: 'summary', name: 'Rating Summary', type: 'content', required: true, order: 2 },
        { id: 'reviews', name: 'Reviews List', type: 'testimonials', required: true, order: 3 },
        { id: 'video', name: 'Video Testimonials', type: 'gallery', required: false, order: 4 },
        { id: 'cta', name: 'Review CTA', type: 'cta', required: false, order: 5 }
      ],
      variables: [
        { key: 'businessName', label: 'Business Name', type: 'text', required: true },
        { key: 'avgRating', label: 'Average Rating', type: 'text', required: true },
        { key: 'totalReviews', label: 'Total Reviews', type: 'text', required: true },
        { key: 'reviews', label: 'Reviews', type: 'array', required: true },
        { key: 'videoTestimonials', label: 'Video Testimonial URLs', type: 'array', required: false },
        { key: 'platformBadges', label: 'Platform Badges', type: 'array', required: false },
        { key: 'leaveReviewUrl', label: 'Leave Review URL', type: 'text', required: false }
      ],
      styles: {
        primaryColor: '#FBBF24',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '8px',
        darkMode: false
      }
    },
    T10: {
      sections: [
        { id: 'header', name: 'Profile Header', type: 'hero', required: true, order: 1 },
        { id: 'featured', name: 'Featured Links', type: 'content', required: true, order: 2 },
        { id: 'links', name: 'All Links', type: 'content', required: true, order: 3 },
        { id: 'social', name: 'Social Icons', type: 'content', required: false, order: 4 }
      ],
      variables: [
        { key: 'profileName', label: 'Profile Name', type: 'text', required: true },
        { key: 'profileImage', label: 'Profile Image', type: 'image', required: true },
        { key: 'bio', label: 'Short Bio', type: 'textarea', required: false, validation: { maxLength: 150 } },
        { key: 'featuredLinks', label: 'Featured Links', type: 'array', required: true },
        { key: 'links', label: 'All Links', type: 'array', required: true },
        { key: 'socialLinks', label: 'Social Media Links', type: 'array', required: false },
        { key: 'backgroundColor', label: 'Background Color', type: 'color', required: false }
      ],
      styles: {
        primaryColor: '#F472B6',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter, sans-serif',
        borderRadius: '24px',
        darkMode: true
      }
    }
  };

  private constructor(pool: Pool) {
    this.pool = pool;
  }

  static getInstance(pool: Pool): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService(pool);
    }
    return TemplateService.instance;
  }

  // ============================================
  // TEMPLATE RETRIEVAL
  // ============================================

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<Template[]> {
    const result = await this.pool.query(`
      SELECT * FROM templates ORDER BY template_id
    `);

    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * Get template by ID (T01-T10)
   */
  async getTemplateById(templateId: string): Promise<Template | null> {
    const result = await this.pool.query(`
      SELECT * FROM templates WHERE template_id = $1
    `, [templateId]);

    if (result.rows.length === 0) return null;
    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Get templates by intent
   */
  async getTemplatesByIntent(intent: TemplateIntent): Promise<Template[]> {
    const result = await this.pool.query(`
      SELECT * FROM templates WHERE target_intent = $1 ORDER BY deploy_count DESC
    `, [intent]);

    return result.rows.map(row => this.mapRowToTemplate(row));
  }

  /**
   * Get component schema for a template
   */
  getComponentSchema(templateId: string): TemplateComponentSchema | null {
    return TemplateService.COMPONENT_SCHEMAS[templateId] || null;
  }

  // ============================================
  // TEMPLATE RECOMMENDATION
  // ============================================

  /**
   * Recommend template based on keyword intent and characteristics
   */
  async recommendTemplate(
    keyword: string,
    intent?: TemplateIntent,
    characteristics?: {
      hasLocation?: boolean;
      needsBooking?: boolean;
      isComparison?: boolean;
      hasProducts?: boolean;
    }
  ): Promise<TemplateRecommendation[]> {
    const recommendations: TemplateRecommendation[] = [];
    const lowerKeyword = keyword.toLowerCase();

    // Detect intent from keyword if not provided
    const detectedIntent = intent || this.detectIntent(keyword);

    // Get all templates
    const templates = await this.getAllTemplates();

    for (const template of templates) {
      let score = 0;
      let reason = '';

      // Score based on intent match
      if (template.targetIntent === detectedIntent) {
        score += 40;
        reason = `Matches ${detectedIntent} intent`;
      }

      // Location-based keywords -> T07
      if (characteristics?.hasLocation || this.hasLocationIndicator(lowerKeyword)) {
        if (template.templateId === 'T07') {
          score += 30;
          reason = 'Location-based keyword matches Local Geo-Page';
        }
      }

      // Booking keywords -> T02
      if (characteristics?.needsBooking || this.hasBookingIndicator(lowerKeyword)) {
        if (template.templateId === 'T02') {
          score += 30;
          reason = 'Booking intent matches Booking Portal';
        }
      }

      // Comparison keywords -> T05
      if (characteristics?.isComparison || this.hasComparisonIndicator(lowerKeyword)) {
        if (template.templateId === 'T05') {
          score += 30;
          reason = 'Comparison intent matches Comparison Guide';
        }
      }

      // Product keywords -> T06
      if (characteristics?.hasProducts || this.hasProductIndicator(lowerKeyword)) {
        if (template.templateId === 'T06') {
          score += 30;
          reason = 'Product intent matches Product Drop';
        }
      }

      // How-to/educational keywords -> T04
      if (this.hasEducationalIndicator(lowerKeyword)) {
        if (template.templateId === 'T04') {
          score += 35;
          reason = 'Educational content matches Educational Hub';
        }
      }

      // High-intent transactional (service near me) -> T01
      if (this.hasHighIntentIndicator(lowerKeyword)) {
        if (template.templateId === 'T01') {
          score += 35;
          reason = 'High-intent keyword matches The Converter';
        }
      }

      // Boost by historical performance
      if (template.avgConversionRate && template.avgConversionRate > 3) {
        score += 10;
        reason += ' (High historical conversion rate)';
      }

      if (score > 0) {
        recommendations.push({ template, score, reason: reason.trim() });
      }
    }

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  // ============================================
  // INTENT DETECTION
  // ============================================

  private detectIntent(keyword: string): TemplateIntent {
    const lower = keyword.toLowerCase();

    // Transactional indicators
    const transactionalPatterns = [
      'buy', 'purchase', 'book', 'schedule', 'order', 'hire', 'get',
      'near me', 'price', 'cost', 'appointment', 'service'
    ];

    // Informational indicators
    const informationalPatterns = [
      'how to', 'what is', 'what are', 'why', 'when', 'guide', 'tutorial',
      'tips', 'ideas', 'learn', 'explained'
    ];

    // Commercial investigation
    const commercialPatterns = [
      'best', 'top', 'review', 'compare', 'vs', 'versus',
      'alternative', 'pros and cons'
    ];

    // Navigational
    const navigationalPatterns = [
      'login', 'sign in', 'website', 'official', 'contact'
    ];

    if (transactionalPatterns.some(p => lower.includes(p))) {
      return 'transactional';
    }
    if (informationalPatterns.some(p => lower.includes(p))) {
      return 'informational';
    }
    if (commercialPatterns.some(p => lower.includes(p))) {
      return 'commercial';
    }
    if (navigationalPatterns.some(p => lower.includes(p))) {
      return 'navigational';
    }

    return 'transactional'; // Default for most business keywords
  }

  private hasLocationIndicator(keyword: string): boolean {
    const locationPatterns = [
      'houston', 'texas', 'tx', 'near me', 'in my area',
      'katy', 'sugar land', 'pearland', 'cypress', 'woodlands'
    ];
    return locationPatterns.some(p => keyword.includes(p));
  }

  private hasBookingIndicator(keyword: string): boolean {
    const bookingPatterns = [
      'book', 'schedule', 'appointment', 'reserve', 'availability'
    ];
    return bookingPatterns.some(p => keyword.includes(p));
  }

  private hasComparisonIndicator(keyword: string): boolean {
    const comparisonPatterns = [
      'vs', 'versus', 'compare', 'comparison', 'difference between',
      'or', 'better'
    ];
    return comparisonPatterns.some(p => keyword.includes(p));
  }

  private hasProductIndicator(keyword: string): boolean {
    const productPatterns = [
      'buy', 'shop', 'product', 'price', 'for sale', 'order'
    ];
    return productPatterns.some(p => keyword.includes(p));
  }

  private hasEducationalIndicator(keyword: string): boolean {
    const educationalPatterns = [
      'how to', 'what is', 'guide', 'tutorial', 'learn', 'tips',
      'process', 'step by step', 'explained'
    ];
    return educationalPatterns.some(p => keyword.includes(p));
  }

  private hasHighIntentIndicator(keyword: string): boolean {
    const highIntentPatterns = [
      'near me', 'service', 'professional', 'expert', 'specialist',
      'best', 'top rated'
    ];
    return highIntentPatterns.some(p => keyword.includes(p));
  }

  // ============================================
  // DEPLOYMENT TRACKING
  // ============================================

  /**
   * Record a template deployment
   */
  async recordDeployment(
    templateId: string,
    targetKeyword: string,
    targetUrl: string,
    triggeredBy: string
  ): Promise<string> {
    const result = await this.pool.query(`
      INSERT INTO deployments (template_id, target_keyword, target_url, triggered_by, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `, [templateId, targetKeyword, targetUrl, triggeredBy]);

    // Increment deploy count
    await this.pool.query(`
      UPDATE templates SET deploy_count = deploy_count + 1 WHERE template_id = $1
    `, [templateId]);

    return result.rows[0].id;
  }

  /**
   * Update deployment status
   */
  async updateDeploymentStatus(
    deploymentId: string,
    status: 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back',
    details?: { liveUrl?: string; previewUrl?: string; error?: string; vercelId?: string }
  ): Promise<void> {
    let query = `UPDATE deployments SET status = $1`;
    const params: any[] = [status];

    if (details?.liveUrl) {
      params.push(details.liveUrl);
      query += `, live_url = $${params.length}`;
    }
    if (details?.previewUrl) {
      params.push(details.previewUrl);
      query += `, preview_url = $${params.length}`;
    }
    if (details?.error) {
      params.push(details.error);
      query += `, error = $${params.length}`;
    }
    if (details?.vercelId) {
      params.push(details.vercelId);
      query += `, vercel_deployment_id = $${params.length}`;
    }
    if (status === 'live') {
      query += `, deployed_at = NOW()`;
    }

    params.push(deploymentId);
    query += ` WHERE id = $${params.length}`;

    await this.pool.query(query, params);
  }

  /**
   * Get recent deployments
   */
  async getRecentDeployments(limit: number = 20): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT d.*, t.name as template_name
      FROM deployments d
      LEFT JOIN templates t ON d.template_id = t.template_id
      ORDER BY d.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Update template conversion rate based on deployment performance
   */
  async updateConversionRate(templateId: string, conversionRate: number): Promise<void> {
    // Calculate weighted average
    await this.pool.query(`
      UPDATE templates
      SET avg_conversion_rate = CASE
        WHEN avg_conversion_rate IS NULL THEN $2
        ELSE (avg_conversion_rate * 0.7 + $2 * 0.3)
      END
      WHERE template_id = $1
    `, [templateId, conversionRate]);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private mapRowToTemplate(row: any): Template {
    const schema = TemplateService.COMPONENT_SCHEMAS[row.template_id] || {
      sections: [],
      variables: [],
      styles: { primaryColor: '#8B5CF6', secondaryColor: '#1F2937', fontFamily: 'Inter', borderRadius: '8px', darkMode: false }
    };

    return {
      id: row.id,
      templateId: row.template_id,
      name: row.name,
      description: row.description,
      purpose: row.purpose,
      targetIntent: row.target_intent,
      features: row.features || [],
      componentSchema: row.component_schema || schema,
      deployCount: row.deploy_count || 0,
      avgConversionRate: row.avg_conversion_rate ? parseFloat(row.avg_conversion_rate) : null,
      previewUrl: row.preview_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default TemplateService;
