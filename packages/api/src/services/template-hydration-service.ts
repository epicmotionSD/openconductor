// Template Hydration Service - Factory Layer
// Generates deployment-ready React components from templates and content

import { Pool } from 'pg';
import { TemplateService, Template, TemplateComponentSchema, TemplateVariable } from './template-service';

// Types
export interface HydrationInput {
  templateId: string;
  content: Record<string, any>;
  options?: HydrationOptions;
}

export interface HydrationOptions {
  targetKeyword?: string;
  geo?: string;
  businessName?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
  };
  darkMode?: boolean;
  seoOptimized?: boolean;
  includeSchema?: boolean; // JSON-LD schema markup
  includeAnalytics?: boolean;
  analyticsId?: string;
}

export interface HydrationResult {
  success: boolean;
  templateId: string;
  content: HydratedContent;
  validation: ValidationResult;
  seo: SEOData;
  estimatedLoadTime: number;
  generatedAt: Date;
}

export interface HydratedContent {
  html: string;
  css: string;
  jsx: string;
  metadata: PageMetadata;
  schema?: string; // JSON-LD
}

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

export interface SEOData {
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  schemaType: string;
  localBusiness?: LocalBusinessSchema;
}

export interface LocalBusinessSchema {
  name: string;
  address: string;
  phone: string;
  geo?: { lat: number; lng: number };
  priceRange?: string;
  openingHours?: string[];
}

export class TemplateHydrationService {
  private static instance: TemplateHydrationService;
  private pool: Pool;
  private templateService: TemplateService;

  private constructor(pool: Pool) {
    this.pool = pool;
    this.templateService = TemplateService.getInstance(pool);
  }

  static getInstance(pool: Pool): TemplateHydrationService {
    if (!TemplateHydrationService.instance) {
      TemplateHydrationService.instance = new TemplateHydrationService(pool);
    }
    return TemplateHydrationService.instance;
  }

  // ============================================
  // MAIN HYDRATION METHOD
  // ============================================

  /**
   * Hydrate a template with content
   */
  async hydrate(input: HydrationInput): Promise<HydrationResult> {
    const { templateId, content, options = {} } = input;

    // Get template
    const template = await this.templateService.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Get component schema
    const schema = this.templateService.getComponentSchema(templateId);
    if (!schema) {
      throw new Error(`Component schema for ${templateId} not found`);
    }

    // Validate content against schema
    const validation = this.validateContent(content, schema);

    // Generate SEO data
    const seo = this.generateSEOData(template, content, options);

    // Generate metadata
    const metadata = this.generateMetadata(template, content, options, seo);

    // Generate HTML
    const html = this.generateHTML(template, schema, content, options);

    // Generate CSS
    const css = this.generateCSS(template, schema, options);

    // Generate JSX (React component)
    const jsx = this.generateJSX(template, schema, content, options);

    // Generate JSON-LD schema if requested
    const jsonLd = options.includeSchema
      ? this.generateJSONLD(template, content, seo)
      : undefined;

    // Estimate load time
    const estimatedLoadTime = this.estimateLoadTime(html, css);

    return {
      success: validation.valid,
      templateId,
      content: {
        html,
        css,
        jsx,
        metadata,
        schema: jsonLd
      },
      validation,
      seo,
      estimatedLoadTime,
      generatedAt: new Date()
    };
  }

  // ============================================
  // VALIDATION
  // ============================================

  private validateContent(
    content: Record<string, any>,
    schema: TemplateComponentSchema
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];

    for (const variable of schema.variables) {
      const value = content[variable.key];

      // Check required fields
      if (variable.required && (value === undefined || value === null || value === '')) {
        missingRequired.push(variable.key);
        errors.push(`Required field "${variable.label}" is missing`);
        continue;
      }

      // Validate if value exists
      if (value !== undefined && value !== null) {
        // Type validation
        if (variable.type === 'array' && !Array.isArray(value)) {
          errors.push(`Field "${variable.label}" must be an array`);
        }

        // Length validation
        if (variable.validation) {
          if (variable.validation.minLength && String(value).length < variable.validation.minLength) {
            errors.push(`Field "${variable.label}" must be at least ${variable.validation.minLength} characters`);
          }
          if (variable.validation.maxLength && String(value).length > variable.validation.maxLength) {
            warnings.push(`Field "${variable.label}" exceeds recommended length of ${variable.validation.maxLength} characters`);
          }
        }

        // Image URL validation
        if (variable.type === 'image' && typeof value === 'string') {
          if (!value.startsWith('http') && !value.startsWith('/')) {
            warnings.push(`Image URL for "${variable.label}" may be invalid`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingRequired
    };
  }

  // ============================================
  // SEO GENERATION
  // ============================================

  private generateSEOData(
    template: Template,
    content: Record<string, any>,
    options: HydrationOptions
  ): SEOData {
    const keyword = options.targetKeyword || '';
    const businessName = options.businessName || content.businessName || '';
    const city = content.city || '';
    const service = content.service || content.headline || '';

    // Generate title based on template type
    let title = '';
    let h1 = '';
    let schemaType = 'WebPage';

    switch (template.templateId) {
      case 'T01': // Converter
        title = `${service} | ${businessName}`;
        h1 = content.headline || `Professional ${service}`;
        schemaType = 'Service';
        break;

      case 'T02': // Booking
        title = `Book ${service} Online | ${businessName}`;
        h1 = `Schedule Your ${service} Appointment`;
        schemaType = 'Service';
        break;

      case 'T03': // Gallery
        title = `${content.title || service} Portfolio | ${businessName}`;
        h1 = content.title || `${service} Gallery`;
        schemaType = 'ImageGallery';
        break;

      case 'T04': // Educational
        title = content.title || `${keyword} Guide`;
        h1 = content.title || keyword;
        schemaType = 'Article';
        break;

      case 'T05': // Comparison
        title = content.title || `${keyword} Comparison`;
        h1 = content.title || `Compare ${keyword}`;
        schemaType = 'Article';
        break;

      case 'T06': // Product
        title = `${content.productName} | ${businessName}`;
        h1 = content.productName;
        schemaType = 'Product';
        break;

      case 'T07': // Local Geo
        title = `${service} in ${city} | ${businessName}`;
        h1 = `${service} in ${city}${content.neighborhood ? `, ${content.neighborhood}` : ''}`;
        schemaType = 'LocalBusiness';
        break;

      case 'T08': // Lead Magnet
        title = content.leadMagnetTitle || content.headline;
        h1 = content.headline || 'Free Download';
        schemaType = 'WebPage';
        break;

      case 'T09': // Review Wall
        title = `${businessName} Reviews | Customer Testimonials`;
        h1 = `What Our Customers Say About ${businessName}`;
        schemaType = 'LocalBusiness';
        break;

      case 'T10': // Link in Bio
        title = `${content.profileName} | Links`;
        h1 = content.profileName;
        schemaType = 'ProfilePage';
        break;

      default:
        title = keyword || 'Page';
        h1 = keyword || 'Welcome';
    }

    // Generate description
    const description = content.metaDescription
      || content.description
      || `${h1}. ${businessName ? `Provided by ${businessName}.` : ''}`;

    // Extract keywords
    const keywords = this.extractKeywords(keyword, content);

    // Build local business schema if applicable
    let localBusiness: LocalBusinessSchema | undefined;
    if (['T01', 'T02', 'T07', 'T09'].includes(template.templateId) && content.address) {
      localBusiness = {
        name: businessName,
        address: content.address,
        phone: content.phone || '',
        priceRange: content.priceRange
      };
    }

    return {
      title: title.substring(0, 60), // SEO title limit
      description: description.substring(0, 160), // Meta description limit
      h1,
      keywords,
      schemaType,
      localBusiness
    };
  }

  private extractKeywords(targetKeyword: string, content: Record<string, any>): string[] {
    const keywords: string[] = [];

    if (targetKeyword) {
      keywords.push(targetKeyword);
    }

    // Extract from content
    ['service', 'city', 'neighborhood', 'productName', 'businessName'].forEach(key => {
      if (content[key]) {
        keywords.push(content[key]);
      }
    });

    // Extract from features/services arrays
    if (Array.isArray(content.services)) {
      content.services.slice(0, 5).forEach((s: any) => {
        if (typeof s === 'string') keywords.push(s);
        else if (s.name) keywords.push(s.name);
      });
    }

    return [...new Set(keywords)].slice(0, 10);
  }

  // ============================================
  // METADATA GENERATION
  // ============================================

  private generateMetadata(
    template: Template,
    content: Record<string, any>,
    options: HydrationOptions,
    seo: SEOData
  ): PageMetadata {
    return {
      title: seo.title,
      description: seo.description,
      canonicalUrl: content.canonicalUrl,
      ogImage: content.heroImage || content.featuredImage || content.profileImage,
      keywords: seo.keywords
    };
  }

  // ============================================
  // HTML GENERATION
  // ============================================

  private generateHTML(
    template: Template,
    schema: TemplateComponentSchema,
    content: Record<string, any>,
    options: HydrationOptions
  ): string {
    const sections = schema.sections
      .sort((a, b) => a.order - b.order)
      .map(section => this.generateSection(section, content, template.templateId));

    const analytics = options.includeAnalytics && options.analyticsId
      ? this.generateAnalyticsScript(options.analyticsId)
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escape(content.title || template.name)}</title>
  <meta name="description" content="${this.escape(content.metaDescription || content.description || '')}">
  <link rel="stylesheet" href="styles.css">
  ${analytics}
</head>
<body class="${options.darkMode ? 'dark' : 'light'}">
  ${sections.join('\n  ')}
</body>
</html>`;
  }

  private generateSection(
    section: any,
    content: Record<string, any>,
    templateId: string
  ): string {
    switch (section.type) {
      case 'hero':
        return this.generateHeroSection(content, templateId);
      case 'trust':
        return this.generateTrustSection(content);
      case 'cta':
        return this.generateCTASection(content);
      case 'testimonials':
        return this.generateTestimonialsSection(content);
      case 'faq':
        return this.generateFAQSection(content);
      case 'gallery':
        return this.generateGallerySection(content);
      case 'map':
        return this.generateMapSection(content);
      case 'form':
        return this.generateFormSection(content, templateId);
      case 'comparison':
        return this.generateComparisonSection(content);
      case 'content':
        return this.generateContentSection(content, section);
      default:
        return `<section class="section-${section.type}"><!-- ${section.name} --></section>`;
    }
  }

  private generateHeroSection(content: Record<string, any>, templateId: string): string {
    return `<section class="hero">
    <div class="hero-content">
      <h1>${this.escape(content.headline || content.title || '')}</h1>
      ${content.subheadline ? `<p class="subheadline">${this.escape(content.subheadline)}</p>` : ''}
      ${content.ctaText ? `<a href="${this.escape(content.ctaUrl || '#')}" class="cta-button">${this.escape(content.ctaText)}</a>` : ''}
    </div>
    ${content.heroImage ? `<div class="hero-image"><img src="${this.escape(content.heroImage)}" alt="${this.escape(content.headline || '')}" loading="lazy"></div>` : ''}
  </section>`;
  }

  private generateTrustSection(content: Record<string, any>): string {
    if (!content.trustLogos || !Array.isArray(content.trustLogos)) {
      return '<section class="trust-bar"></section>';
    }

    const logos = content.trustLogos.map((logo: any) =>
      `<img src="${this.escape(logo.url || logo)}" alt="${this.escape(logo.alt || 'Trust badge')}" class="trust-logo">`
    ).join('\n      ');

    return `<section class="trust-bar">
    <div class="trust-logos">
      ${logos}
    </div>
  </section>`;
  }

  private generateCTASection(content: Record<string, any>): string {
    return `<section class="cta-section">
    <div class="cta-content">
      ${content.ctaHeadline ? `<h2>${this.escape(content.ctaHeadline)}</h2>` : ''}
      <a href="${this.escape(content.ctaUrl || '#')}" class="cta-button primary">${this.escape(content.ctaText || 'Get Started')}</a>
      ${content.phone ? `<p class="phone">Or call: <a href="tel:${content.phone}">${content.phone}</a></p>` : ''}
    </div>
  </section>`;
  }

  private generateTestimonialsSection(content: Record<string, any>): string {
    if (!content.testimonials || !Array.isArray(content.testimonials)) {
      return '<section class="testimonials"></section>';
    }

    const testimonials = content.testimonials.map((t: any) => `
      <div class="testimonial">
        <blockquote>"${this.escape(t.text || t.content || t)}"</blockquote>
        ${t.author ? `<cite>— ${this.escape(t.author)}${t.location ? `, ${this.escape(t.location)}` : ''}</cite>` : ''}
        ${t.rating ? `<div class="rating">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>` : ''}
      </div>
    `).join('\n');

    return `<section class="testimonials">
    <h2>What Our Customers Say</h2>
    <div class="testimonials-grid">
      ${testimonials}
    </div>
  </section>`;
  }

  private generateFAQSection(content: Record<string, any>): string {
    if (!content.faqs || !Array.isArray(content.faqs)) {
      return '<section class="faq"></section>';
    }

    const faqs = content.faqs.map((faq: any) => `
      <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <h3 itemprop="name">${this.escape(faq.question || faq.q)}</h3>
        <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <p itemprop="text">${this.escape(faq.answer || faq.a)}</p>
        </div>
      </div>
    `).join('\n');

    return `<section class="faq" itemscope itemtype="https://schema.org/FAQPage">
    <h2>Frequently Asked Questions</h2>
    <div class="faq-list">
      ${faqs}
    </div>
  </section>`;
  }

  private generateGallerySection(content: Record<string, any>): string {
    if (!content.images || !Array.isArray(content.images)) {
      return '<section class="gallery"></section>';
    }

    const images = content.images.map((img: any) => {
      const src = typeof img === 'string' ? img : img.url;
      const alt = typeof img === 'string' ? '' : (img.alt || img.caption || '');

      return `<div class="gallery-item">
        <img src="${this.escape(src)}" alt="${this.escape(alt)}" loading="lazy">
        ${img.caption ? `<p class="caption">${this.escape(img.caption)}</p>` : ''}
      </div>`;
    }).join('\n');

    return `<section class="gallery">
    <div class="gallery-grid">
      ${images}
    </div>
  </section>`;
  }

  private generateMapSection(content: Record<string, any>): string {
    if (!content.mapEmbedUrl && !content.address) {
      return '<section class="map"></section>';
    }

    return `<section class="map">
    <div class="address">
      <h3>Location</h3>
      <p>${this.escape(content.address || '')}</p>
      ${content.phone ? `<p>Phone: <a href="tel:${content.phone}">${content.phone}</a></p>` : ''}
    </div>
    ${content.mapEmbedUrl ? `<div class="map-embed">
      <iframe src="${this.escape(content.mapEmbedUrl)}" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
    </div>` : ''}
  </section>`;
  }

  private generateFormSection(content: Record<string, any>, templateId: string): string {
    if (templateId === 'T02' && content.bookingWidgetUrl) {
      return `<section class="booking-form">
    <h2>Book Your Appointment</h2>
    <iframe src="${this.escape(content.bookingWidgetUrl)}" width="100%" height="600" frameborder="0"></iframe>
  </section>`;
    }

    if (templateId === 'T08') {
      return `<section class="lead-form">
    <form action="${this.escape(content.formAction || '#')}" method="POST">
      <input type="email" name="email" placeholder="Enter your email" required>
      <button type="submit">Get Free Download</button>
    </form>
  </section>`;
    }

    return `<section class="form">
    <form>
      <input type="text" name="name" placeholder="Your Name" required>
      <input type="email" name="email" placeholder="Your Email" required>
      <textarea name="message" placeholder="Message"></textarea>
      <button type="submit">Submit</button>
    </form>
  </section>`;
  }

  private generateComparisonSection(content: Record<string, any>): string {
    if (!content.options || !content.criteria) {
      return '<section class="comparison"></section>';
    }

    const headers = content.options.map((opt: any) =>
      `<th>${this.escape(typeof opt === 'string' ? opt : opt.name)}</th>`
    ).join('');

    const rows = content.criteria.map((criterion: any) => {
      const cells = content.options.map((opt: any) => {
        const value = criterion.values?.[typeof opt === 'string' ? opt : opt.name] || '—';
        return `<td>${this.escape(String(value))}</td>`;
      }).join('');
      return `<tr><th>${this.escape(criterion.name)}</th>${cells}</tr>`;
    }).join('\n');

    return `<section class="comparison">
    <h2>${this.escape(content.title || 'Comparison')}</h2>
    <table class="comparison-table">
      <thead>
        <tr><th></th>${headers}</tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>`;
  }

  private generateContentSection(content: Record<string, any>, section: any): string {
    return `<section class="content-section ${section.id}">
    ${content.content ? `<div class="content-body">${content.content}</div>` : ''}
  </section>`;
  }

  // ============================================
  // CSS GENERATION
  // ============================================

  private generateCSS(
    template: Template,
    schema: TemplateComponentSchema,
    options: HydrationOptions
  ): string {
    const primary = options.brandColors?.primary || schema.styles.primaryColor;
    const secondary = options.brandColors?.secondary || schema.styles.secondaryColor;
    const fontFamily = schema.styles.fontFamily;
    const borderRadius = schema.styles.borderRadius;
    const darkMode = options.darkMode ?? schema.styles.darkMode;

    return `/* Generated CSS for ${template.name} */
:root {
  --primary: ${primary};
  --secondary: ${secondary};
  --font-family: ${fontFamily};
  --border-radius: ${borderRadius};
  --bg-color: ${darkMode ? '#111827' : '#ffffff'};
  --text-color: ${darkMode ? '#f9fafb' : '#1f2937'};
  --text-muted: ${darkMode ? '#9ca3af' : '#6b7280'};
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

.hero {
  display: flex;
  align-items: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
}

.hero h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero .subheadline {
  font-size: 1.25rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.cta-button {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: 1rem 2rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;
}

.cta-button:hover {
  opacity: 0.9;
}

.trust-bar {
  background: ${darkMode ? '#1f2937' : '#f3f4f6'};
  padding: 1.5rem;
}

.trust-logos {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.trust-logo {
  height: 40px;
  opacity: 0.7;
}

.testimonials {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.testimonials h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.testimonial {
  background: ${darkMode ? '#1f2937' : '#f9fafb'};
  padding: 2rem;
  border-radius: var(--border-radius);
}

.testimonial blockquote {
  font-style: italic;
  margin-bottom: 1rem;
}

.testimonial cite {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.testimonial .rating {
  color: #fbbf24;
  margin-top: 0.5rem;
}

.faq {
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.faq h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.faq-item {
  border-bottom: 1px solid ${darkMode ? '#374151' : '#e5e7eb'};
  padding: 1.5rem 0;
}

.faq-item h3 {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.faq-item p {
  color: var(--text-muted);
}

.gallery {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.gallery-item img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: var(--border-radius);
}

.map {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
}

.comparison-table th,
.comparison-table td {
  padding: 1rem;
  border: 1px solid ${darkMode ? '#374151' : '#e5e7eb'};
  text-align: left;
}

.comparison-table thead th {
  background: var(--primary);
  color: white;
}

.cta-section {
  background: var(--primary);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.cta-section h2 {
  margin-bottom: 1.5rem;
}

.cta-section .cta-button {
  background: white;
  color: var(--primary);
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
  }

  .hero h1 {
    font-size: 2rem;
  }
}`;
  }

  // ============================================
  // JSX GENERATION
  // ============================================

  private generateJSX(
    template: Template,
    schema: TemplateComponentSchema,
    content: Record<string, any>,
    options: HydrationOptions
  ): string {
    const componentName = template.name.replace(/\s+/g, '');

    return `// Generated React Component for ${template.name}
// Template: ${template.templateId}

import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  content: typeof defaultContent;
}

const defaultContent = ${JSON.stringify(content, null, 2)};

export default function ${componentName}({ content = defaultContent }: ${componentName}Props) {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{content.headline || content.title}</h1>
          {content.subheadline && <p className={styles.subheadline}>{content.subheadline}</p>}
          {content.ctaText && (
            <a href={content.ctaUrl || '#'} className={styles.ctaButton}>
              {content.ctaText}
            </a>
          )}
        </div>
        {content.heroImage && (
          <div className={styles.heroImage}>
            <img src={content.heroImage} alt={content.headline || ''} />
          </div>
        )}
      </section>

      {/* Additional sections would be generated based on template */}
    </div>
  );
}

export { ${componentName} };
`;
  }

  // ============================================
  // JSON-LD SCHEMA GENERATION
  // ============================================

  private generateJSONLD(
    template: Template,
    content: Record<string, any>,
    seo: SEOData
  ): string {
    const baseSchema: any = {
      '@context': 'https://schema.org',
      '@type': seo.schemaType,
      name: seo.title,
      description: seo.description
    };

    // Add specific schema based on type
    if (seo.schemaType === 'LocalBusiness' && seo.localBusiness) {
      baseSchema.address = {
        '@type': 'PostalAddress',
        streetAddress: seo.localBusiness.address
      };
      baseSchema.telephone = seo.localBusiness.phone;
      if (seo.localBusiness.priceRange) {
        baseSchema.priceRange = seo.localBusiness.priceRange;
      }
    }

    if (seo.schemaType === 'Product' && content.price) {
      baseSchema.offers = {
        '@type': 'Offer',
        price: content.price,
        priceCurrency: 'USD'
      };
    }

    if (seo.schemaType === 'Article') {
      baseSchema.author = content.author || 'Staff Writer';
      baseSchema.datePublished = new Date().toISOString();
    }

    // Add FAQ schema if FAQs exist
    if (content.faqs && Array.isArray(content.faqs)) {
      baseSchema.mainEntity = content.faqs.map((faq: any) => ({
        '@type': 'Question',
        name: faq.question || faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer || faq.a
        }
      }));
    }

    return `<script type="application/ld+json">
${JSON.stringify(baseSchema, null, 2)}
</script>`;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateAnalyticsScript(analyticsId: string): string {
    return `<!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${analyticsId}');
  </script>`;
  }

  private escape(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private estimateLoadTime(html: string, css: string): number {
    // Simple estimation based on content size
    const totalBytes = html.length + css.length;
    const baseTime = 0.5; // Base 500ms
    const byteTime = totalBytes / 50000; // ~50KB per 1s on slow connection
    return Math.round((baseTime + byteTime) * 1000) / 1000;
  }
}

export default TemplateHydrationService;
