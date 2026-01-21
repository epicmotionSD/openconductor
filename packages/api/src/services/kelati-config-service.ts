// Kelati Configuration Service - First Revenue Application
// Pre-configured settings for Kelati Natural Hair salon in Houston

import { Pool } from 'pg';
import { TemplateService } from './template-service';
import { TrendArbitrageService } from './trend-arbitrage-service';
import { ApifyService } from './apify-service';
import { VercelDeployService } from './vercel-deploy-service';

// Kelati Business Configuration
export const KELATI_CONFIG = {
  business: {
    name: 'Kelati Natural Hair',
    brand: 'Kelati',
    subBrands: {
      locShop: 'Loc Shop',
      locAcademy: 'Loc Academy',
      locVitality: 'Loc Vitality'
    },
    phone: '(713) 555-0123', // Replace with real
    email: 'hello@kelati.com',
    address: {
      street: '1234 Main Street',
      city: 'Houston',
      state: 'Texas',
      zip: '77001',
      neighborhood: 'Montrose'
    },
    website: 'https://kelati.com',
    bookingUrl: 'https://kelatic.com/book', // From kelatic-booking project
    styleSheet: 'https://styleseat.com/kelati', // External booking
    socialMedia: {
      instagram: '@kelatinaturalhair',
      tiktok: '@kelatihair',
      facebook: 'kelatinaturalhair'
    }
  },

  // Primary services offered
  services: [
    {
      id: 'sisterlocks',
      name: 'Sisterlocks',
      description: 'Traditional Sisterlocks installation and maintenance',
      priceRange: '$300-$1500',
      duration: '8-16 hours (installation)',
      keywords: ['sisterlocks', 'sisterlocks installation', 'sisterlocks consultant']
    },
    {
      id: 'microlocs',
      name: 'Microlocs',
      description: 'Micro-sized traditional locs with various techniques',
      priceRange: '$250-$800',
      duration: '6-12 hours',
      keywords: ['microlocs', 'micro locs', 'small locs']
    },
    {
      id: 'loc-maintenance',
      name: 'Loc Maintenance',
      description: 'Retightening, repairs, and general loc care',
      priceRange: '$85-$200',
      duration: '2-4 hours',
      keywords: ['loc maintenance', 'loc retightening', 'loc repair', 'locs retwist']
    },
    {
      id: 'loc-styling',
      name: 'Loc Styling',
      description: 'Styling, updos, and special occasion looks',
      priceRange: '$50-$150',
      duration: '1-3 hours',
      keywords: ['loc styling', 'loc updo', 'loc hairstyles']
    },
    {
      id: 'consultations',
      name: 'Consultations',
      description: 'Free consultations for new clients',
      priceRange: 'Free',
      duration: '30 min',
      keywords: ['loc consultation', 'sisterlocks consultation', 'natural hair consultation']
    }
  ],

  // Houston-area service locations
  serviceAreas: [
    { name: 'Houston', priority: 1, population: 2300000 },
    { name: 'Katy', priority: 2, population: 21000 },
    { name: 'Sugar Land', priority: 2, population: 111000 },
    { name: 'Pearland', priority: 3, population: 125000 },
    { name: 'Cypress', priority: 3, population: 186000 },
    { name: 'The Woodlands', priority: 3, population: 118000 },
    { name: 'Humble', priority: 4, population: 15000 },
    { name: 'Pasadena', priority: 4, population: 152000 },
    { name: 'Missouri City', priority: 4, population: 74000 },
    { name: 'League City', priority: 5, population: 111000 }
  ],

  // Seed keywords for trend monitoring
  seedKeywords: {
    primary: [
      'sisterlocks houston',
      'microlocs houston',
      'loctician houston',
      'loc maintenance houston',
      'natural hair salon houston'
    ],
    secondary: [
      'sisterlocks near me',
      'microlocs near me',
      'loc repair houston',
      'sisterlocks retightening houston',
      'butterfly locs houston',
      'faux locs houston'
    ],
    informational: [
      'how to start sisterlocks',
      'sisterlocks vs microlocs',
      'how much do sisterlocks cost',
      'how long do sisterlocks take',
      'sisterlocks maintenance guide'
    ],
    competitors: [
      // Add competitor names for monitoring
    ]
  },

  // Template mapping for Kelati
  templateMapping: {
    landing: 'T01',      // High-intent service pages
    booking: 'T02',      // Booking portal
    gallery: 'T03',      // Portfolio/before-after
    educational: 'T04',  // Blog posts
    comparison: 'T05',   // Sisterlocks vs Microlocs
    geoPages: 'T07',     // Local neighborhood pages
    reviews: 'T09',      // Review wall
    linkinbio: 'T10'     // Social media link page
  },

  // Brand styling
  branding: {
    primaryColor: '#8B5CF6',    // Purple
    secondaryColor: '#1F2937',  // Dark gray
    accentColor: '#F59E0B',     // Gold
    fontFamily: 'Inter, system-ui, sans-serif',
    logo: '/images/kelati-logo.png',
    favicon: '/favicon.ico'
  },

  // Analytics
  analytics: {
    googleAnalyticsId: process.env.GA_TRACKING_ID || '',
    googleAdsId: process.env.GOOGLE_ADS_ID || '',
    facebookPixelId: process.env.FB_PIXEL_ID || ''
  }
};

// Types
export interface KelatiPageConfig {
  templateId: string;
  targetKeyword: string;
  slug: string;
  content: Record<string, any>;
  priority: number;
}

export interface KelatiGeoPageConfig extends KelatiPageConfig {
  city: string;
  neighborhood?: string;
  service: string;
}

export class KelatiConfigService {
  private static instance: KelatiConfigService;
  private pool: Pool;
  private templateService: TemplateService;
  private trendService: TrendArbitrageService;
  private apifyService: ApifyService;
  private deployService: VercelDeployService;

  private constructor(pool: Pool) {
    this.pool = pool;
    this.templateService = TemplateService.getInstance(pool);
    this.apifyService = ApifyService.getInstance(pool);
    this.trendService = TrendArbitrageService.getInstance(pool, this.apifyService);
    this.deployService = VercelDeployService.getInstance(pool);
  }

  static getInstance(pool: Pool): KelatiConfigService {
    if (!KelatiConfigService.instance) {
      KelatiConfigService.instance = new KelatiConfigService(pool);
    }
    return KelatiConfigService.instance;
  }

  // ============================================
  // PAGE GENERATION
  // ============================================

  /**
   * Generate all Kelati page configurations
   */
  generateAllPageConfigs(): KelatiPageConfig[] {
    const pages: KelatiPageConfig[] = [];

    // 1. Main landing pages (one per service)
    pages.push(...this.generateServiceLandingPages());

    // 2. Geo pages (service + location combos)
    pages.push(...this.generateGeoPages());

    // 3. Comparison pages
    pages.push(...this.generateComparisonPages());

    // 4. Educational content pages
    pages.push(...this.generateEducationalPages());

    // 5. Specialty pages (booking, reviews, etc.)
    pages.push(...this.generateSpecialtyPages());

    return pages;
  }

  /**
   * Generate service-specific landing pages
   */
  generateServiceLandingPages(): KelatiPageConfig[] {
    return KELATI_CONFIG.services.map(service => ({
      templateId: KELATI_CONFIG.templateMapping.landing,
      targetKeyword: `${service.name.toLowerCase()} houston`,
      slug: `${service.id}-houston`,
      priority: 1,
      content: {
        headline: `Professional ${service.name} in Houston`,
        subheadline: service.description,
        heroImage: `/images/services/${service.id}-hero.jpg`,
        ctaText: 'Book Your Appointment',
        ctaUrl: KELATI_CONFIG.business.bookingUrl,
        phone: KELATI_CONFIG.business.phone,
        address: `${KELATI_CONFIG.business.address.street}, ${KELATI_CONFIG.business.address.city}, ${KELATI_CONFIG.business.address.state}`,
        priceRange: service.priceRange,
        duration: service.duration,
        businessName: KELATI_CONFIG.business.name,
        testimonials: [], // Would be populated from database
        faqs: this.getServiceFAQs(service.id)
      }
    }));
  }

  /**
   * Generate local geo pages for each service + area combo
   */
  generateGeoPages(): KelatiGeoPageConfig[] {
    const pages: KelatiGeoPageConfig[] = [];

    // High-priority services
    const priorityServices = ['sisterlocks', 'microlocs', 'loc-maintenance'];

    for (const serviceId of priorityServices) {
      const service = KELATI_CONFIG.services.find(s => s.id === serviceId);
      if (!service) continue;

      for (const area of KELATI_CONFIG.serviceAreas) {
        // Only generate for high-priority areas
        if (area.priority > 3) continue;

        const keyword = `${service.name.toLowerCase()} ${area.name.toLowerCase()} tx`;
        const slug = `${service.id}-${area.name.toLowerCase().replace(/\s+/g, '-')}`;

        pages.push({
          templateId: KELATI_CONFIG.templateMapping.geoPages,
          targetKeyword: keyword,
          slug,
          city: area.name,
          service: service.name,
          priority: area.priority,
          content: {
            city: area.name,
            neighborhood: null,
            service: service.name,
            businessName: KELATI_CONFIG.business.name,
            address: `${KELATI_CONFIG.business.address.street}, ${KELATI_CONFIG.business.address.city}, ${KELATI_CONFIG.business.address.state}`,
            phone: KELATI_CONFIG.business.phone,
            mapEmbedUrl: this.getGoogleMapsEmbed(area.name),
            services: KELATI_CONFIG.services.map(s => ({
              name: s.name,
              description: s.description,
              price: s.priceRange
            })),
            localTestimonials: [],
            ctaText: 'Book Now',
            ctaUrl: KELATI_CONFIG.business.bookingUrl
          }
        });
      }
    }

    return pages;
  }

  /**
   * Generate comparison pages
   */
  generateComparisonPages(): KelatiPageConfig[] {
    return [
      {
        templateId: KELATI_CONFIG.templateMapping.comparison,
        targetKeyword: 'sisterlocks vs microlocs',
        slug: 'sisterlocks-vs-microlocs',
        priority: 2,
        content: {
          title: 'Sisterlocks vs Microlocs: Complete Comparison Guide',
          options: [
            { name: 'Sisterlocks', recommended: true },
            { name: 'Microlocs', recommended: false }
          ],
          criteria: [
            {
              name: 'Installation Time',
              values: { 'Sisterlocks': '8-16 hours', 'Microlocs': '6-12 hours' }
            },
            {
              name: 'Starting Cost',
              values: { 'Sisterlocks': '$300-$1500', 'Microlocs': '$250-$800' }
            },
            {
              name: 'Maintenance Frequency',
              values: { 'Sisterlocks': 'Every 4-6 weeks', 'Microlocs': 'Every 4-8 weeks' }
            },
            {
              name: 'Loc Size',
              values: { 'Sisterlocks': 'Very small, uniform', 'Microlocs': 'Small to medium' }
            },
            {
              name: 'Best For',
              values: { 'Sisterlocks': 'Fine to medium hair', 'Microlocs': 'All hair types' }
            }
          ],
          recommendedOption: 'Sisterlocks',
          ctaText: 'Book a Consultation',
          ctaUrl: KELATI_CONFIG.business.bookingUrl
        }
      },
      {
        templateId: KELATI_CONFIG.templateMapping.comparison,
        targetKeyword: 'traditional locs vs sisterlocks',
        slug: 'traditional-locs-vs-sisterlocks',
        priority: 3,
        content: {
          title: 'Traditional Locs vs Sisterlocks: Which is Right for You?',
          options: [
            { name: 'Traditional Locs', recommended: false },
            { name: 'Sisterlocks', recommended: true }
          ],
          criteria: [
            {
              name: 'Starting Method',
              values: { 'Traditional Locs': 'Twists, coils, freeform', 'Sisterlocks': 'Interlocking tool' }
            },
            {
              name: 'Loc Size',
              values: { 'Traditional Locs': 'Medium to large', 'Sisterlocks': 'Very small' }
            },
            {
              name: 'Styling Flexibility',
              values: { 'Traditional Locs': 'Good', 'Sisterlocks': 'Excellent' }
            },
            {
              name: 'Weight on Scalp',
              values: { 'Traditional Locs': 'Heavier', 'Sisterlocks': 'Very light' }
            }
          ],
          recommendedOption: 'Sisterlocks',
          ctaText: 'Get Expert Advice',
          ctaUrl: KELATI_CONFIG.business.bookingUrl
        }
      }
    ];
  }

  /**
   * Generate educational content pages
   */
  generateEducationalPages(): KelatiPageConfig[] {
    return [
      {
        templateId: KELATI_CONFIG.templateMapping.educational,
        targetKeyword: 'how to start sisterlocks',
        slug: 'how-to-start-sisterlocks-guide',
        priority: 2,
        content: {
          title: 'How to Start Sisterlocks: Complete Beginner\'s Guide',
          metaDescription: 'Learn everything about starting Sisterlocks - from finding a consultant to your first installation. Expert guide by Kelati Natural Hair in Houston.',
          featuredImage: '/images/blog/start-sisterlocks.jpg',
          author: 'Kelati Team',
          authorBio: 'Expert locticians serving Houston since 2015',
          content: `
# How to Start Sisterlocks

Starting your Sisterlocks journey is an exciting decision. This guide covers everything you need to know...

## Step 1: Research and Consultation
Before starting Sisterlocks, schedule a consultation with a certified Sisterlocks consultant...

## Step 2: Hair Preparation
Your hair should be at least 1.5 inches long for Sisterlocks installation...

## Step 3: Installation Day
The installation process takes 8-16 hours depending on hair density...

## Step 4: First 6 Months Care
The settling period is crucial for your Sisterlocks journey...
          `,
          faqs: [
            {
              question: 'How long should my hair be for Sisterlocks?',
              answer: 'Your hair should be at least 1.5 inches long, though some consultants prefer 2+ inches.'
            },
            {
              question: 'How much do Sisterlocks cost?',
              answer: 'Initial installation typically ranges from $300-$1500 depending on hair density and length.'
            },
            {
              question: 'Can I wash my Sisterlocks?',
              answer: 'Yes! After the initial settling period (usually 4-6 weeks), you can wash regularly.'
            }
          ]
        }
      },
      {
        templateId: KELATI_CONFIG.templateMapping.educational,
        targetKeyword: 'sisterlocks maintenance guide',
        slug: 'sisterlocks-maintenance-guide',
        priority: 3,
        content: {
          title: 'Sisterlocks Maintenance Guide: Tips from Houston\'s Top Locticians',
          metaDescription: 'Expert tips for maintaining healthy Sisterlocks. Learn about retightening schedules, washing, and styling from Kelati Natural Hair.',
          featuredImage: '/images/blog/sisterlocks-maintenance.jpg',
          author: 'Kelati Team',
          content: '...',
          faqs: []
        }
      }
    ];
  }

  /**
   * Generate specialty pages
   */
  generateSpecialtyPages(): KelatiPageConfig[] {
    return [
      {
        templateId: KELATI_CONFIG.templateMapping.booking,
        targetKeyword: 'book sisterlocks appointment houston',
        slug: 'book',
        priority: 1,
        content: {
          businessName: KELATI_CONFIG.business.name,
          logoUrl: KELATI_CONFIG.branding.logo,
          services: KELATI_CONFIG.services.map(s => ({
            name: s.name,
            description: s.description,
            price: s.priceRange,
            duration: s.duration
          })),
          bookingProvider: 'custom',
          bookingWidgetUrl: KELATI_CONFIG.business.bookingUrl,
          confirmationMessage: 'Thank you for booking with Kelati! We look forward to serving you.'
        }
      },
      {
        templateId: KELATI_CONFIG.templateMapping.reviews,
        targetKeyword: 'kelati reviews houston',
        slug: 'reviews',
        priority: 2,
        content: {
          businessName: KELATI_CONFIG.business.name,
          avgRating: '4.9',
          totalReviews: '150+',
          reviews: [], // Would be populated from database/API
          platformBadges: ['Google', 'Yelp', 'StyleSeat'],
          leaveReviewUrl: 'https://g.page/kelati/review'
        }
      },
      {
        templateId: KELATI_CONFIG.templateMapping.linkinbio,
        targetKeyword: 'kelati natural hair links',
        slug: 'links',
        priority: 3,
        content: {
          profileName: KELATI_CONFIG.business.name,
          profileImage: KELATI_CONFIG.branding.logo,
          bio: 'Houston\'s Premier Natural Hair Salon | Sisterlocks | Microlocs | Loc Care',
          featuredLinks: [
            { label: 'Book Appointment', url: KELATI_CONFIG.business.bookingUrl },
            { label: 'View Portfolio', url: `${KELATI_CONFIG.business.website}/gallery` }
          ],
          links: [
            { label: 'Sisterlocks Info', url: `${KELATI_CONFIG.business.website}/sisterlocks-houston` },
            { label: 'Microlocs Info', url: `${KELATI_CONFIG.business.website}/microlocs-houston` },
            { label: 'Pricing', url: `${KELATI_CONFIG.business.website}/pricing` },
            { label: 'Reviews', url: `${KELATI_CONFIG.business.website}/reviews` }
          ],
          socialLinks: [
            { platform: 'instagram', url: `https://instagram.com/${KELATI_CONFIG.business.socialMedia.instagram.replace('@', '')}` },
            { platform: 'tiktok', url: `https://tiktok.com/${KELATI_CONFIG.business.socialMedia.tiktok}` },
            { platform: 'facebook', url: `https://facebook.com/${KELATI_CONFIG.business.socialMedia.facebook}` }
          ],
          backgroundColor: KELATI_CONFIG.branding.primaryColor
        }
      },
      {
        templateId: KELATI_CONFIG.templateMapping.gallery,
        targetKeyword: 'sisterlocks gallery houston',
        slug: 'gallery',
        priority: 2,
        content: {
          title: 'Kelati Portfolio - Sisterlocks & Loc Styles',
          description: 'View our work: Sisterlocks installations, microlocs, and loc styling in Houston',
          categories: ['Sisterlocks', 'Microlocs', 'Loc Styling', 'Before & After'],
          images: [], // Would be populated from database
          enableBeforeAfter: true,
          ctaText: 'Book Your Transformation',
          ctaUrl: KELATI_CONFIG.business.bookingUrl
        }
      }
    ];
  }

  // ============================================
  // DEPLOYMENT METHODS
  // ============================================

  /**
   * Deploy all Kelati pages
   */
  async deployAllPages(): Promise<{
    success: number;
    failed: number;
    results: any[];
  }> {
    const pages = this.generateAllPageConfigs();
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    // Sort by priority
    pages.sort((a, b) => a.priority - b.priority);

    for (const page of pages) {
      try {
        const result = await this.deployService.deploy({
          templateId: page.templateId,
          targetKeyword: page.targetKeyword,
          content: page.content,
          slug: page.slug,
          production: true
        });

        if (result.success) {
          success++;
        } else {
          failed++;
        }
        results.push(result);

        // Delay between deployments
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        failed++;
        results.push({ success: false, error: error.message, page: page.slug });
      }
    }

    return { success, failed, results };
  }

  /**
   * Deploy specific page type
   */
  async deployPageType(
    type: 'landing' | 'geo' | 'comparison' | 'educational' | 'specialty'
  ): Promise<any[]> {
    let pages: KelatiPageConfig[];

    switch (type) {
      case 'landing':
        pages = this.generateServiceLandingPages();
        break;
      case 'geo':
        pages = this.generateGeoPages();
        break;
      case 'comparison':
        pages = this.generateComparisonPages();
        break;
      case 'educational':
        pages = this.generateEducationalPages();
        break;
      case 'specialty':
        pages = this.generateSpecialtyPages();
        break;
      default:
        pages = [];
    }

    const results = await this.deployService.deployBatch(
      pages.map(p => ({
        templateId: p.templateId,
        targetKeyword: p.targetKeyword,
        content: p.content,
        slug: p.slug
      }))
    );

    return results;
  }

  // ============================================
  // TREND MONITORING
  // ============================================

  /**
   * Analyze trends for Kelati keywords
   */
  async analyzeKelatiTrends(): Promise<any> {
    const allKeywords = [
      ...KELATI_CONFIG.seedKeywords.primary,
      ...KELATI_CONFIG.seedKeywords.secondary
    ];

    return this.trendService.analyzeTrends({
      seedKeywords: allKeywords,
      geo: 'US-TX',
      timeframe: 'now 7-d',
      breakoutThreshold: 200,
      risingThreshold: 30,
      minVolume: 50
    });
  }

  /**
   * Get trending opportunities for Kelati
   */
  async getTrendingOpportunities(): Promise<{
    breakout: any[];
    rising: any[];
    recommendations: string[];
  }> {
    const trendResult = await this.analyzeKelatiTrends();

    const breakout = trendResult.signals.filter((s: any) => s.category === 'breakout');
    const rising = trendResult.signals.filter((s: any) => s.category === 'rising');

    const recommendations: string[] = [];

    // Generate recommendations
    for (const signal of breakout.slice(0, 3)) {
      recommendations.push(
        `High opportunity: "${signal.keyword}" is breaking out (+${signal.growthRate}%). Consider deploying a landing page immediately.`
      );
    }

    for (const signal of rising.slice(0, 5)) {
      if (!breakout.find((b: any) => b.keyword === signal.keyword)) {
        recommendations.push(
          `Rising trend: "${signal.keyword}" (+${signal.growthRate}%). Monitor and prepare content.`
        );
      }
    }

    return { breakout, rising, recommendations };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getServiceFAQs(serviceId: string): Array<{ question: string; answer: string }> {
    const faqs: Record<string, Array<{ question: string; answer: string }>> = {
      sisterlocks: [
        { question: 'How long does Sisterlocks installation take?', answer: 'Initial installation typically takes 8-16 hours, depending on hair density and length.' },
        { question: 'How much do Sisterlocks cost?', answer: 'Installation ranges from $300-$1500. Maintenance costs $85-$200 every 4-6 weeks.' },
        { question: 'Can I wash my Sisterlocks?', answer: 'Yes! After the initial settling period (4-6 weeks), you can wash your Sisterlocks regularly.' }
      ],
      microlocs: [
        { question: 'What is the difference between microlocs and Sisterlocks?', answer: 'Microlocs are small traditional locs, while Sisterlocks use a specific interlocking technique. Both achieve a similar look.' },
        { question: 'How long do microlocs take to install?', answer: 'Microloc installation typically takes 6-12 hours depending on the method and hair density.' }
      ],
      'loc-maintenance': [
        { question: 'How often should I get my locs retightened?', answer: 'Most clients need retightening every 4-6 weeks for Sisterlocks, or 4-8 weeks for traditional locs.' },
        { question: 'What is included in loc maintenance?', answer: 'Maintenance includes retightening new growth, repairing any slippage, and addressing any loc health concerns.' }
      ]
    };

    return faqs[serviceId] || [];
  }

  private getGoogleMapsEmbed(location: string): string {
    const baseUrl = 'https://www.google.com/maps/embed/v1/place';
    const apiKey = process.env.GOOGLE_MAPS_EMBED_KEY || '';
    const query = encodeURIComponent(`${KELATI_CONFIG.business.name} ${location} Texas`);
    return `${baseUrl}?key=${apiKey}&q=${query}`;
  }
}

export default KelatiConfigService;
