/**
 * Revenue Sniper Cron Job
 *
 * Runs daily to:
 * 1. Analyze Google Trends for loctician keywords
 * 2. Detect breakout/rising terms
 * 3. Auto-generate T07 geo-pages for attack opportunities
 * 4. Deploy to capture traffic before competition
 *
 * Schedule: Daily at 6 AM CST
 */

import { Pool } from 'pg';
import { TrendArbitrageService, TrendSignal } from '../services/trend-arbitrage-service';
import { ApifyService } from '../services/apify-service';

// ============================================
// CONFIGURATION
// ============================================

const LOC_SEED_KEYWORDS = [
  // Core services
  'sisterlocks',
  'microlocs',
  'traditional locs',
  'freeform locs',
  'loc retwist',
  'loc maintenance',
  'loc repair',
  'loc retightening',

  // Style variations
  'butterfly locs',
  'faux locs',
  'soft locs',
  'boho locs',
  'goddess locs',
  'distressed locs',

  // Intent keywords
  'loctician near me',
  'loc stylist near me',
  'sisterlocks consultation',
  'starter locs',
  'loc journey',

  // Problem keywords (high intent)
  'loc damage repair',
  'thinning locs',
  'loc breakage',
  'buildup removal locs'
];

const HOUSTON_NEIGHBORHOODS = [
  'houston',
  'katy',
  'sugar land',
  'pearland',
  'cypress',
  'the woodlands',
  'humble',
  'pasadena',
  'missouri city',
  'spring',
  'conroe',
  'league city',
  'baytown',
  'galveston'
];

const MAJOR_METROS = [
  { city: 'atlanta', state: 'GA' },
  { city: 'dallas', state: 'TX' },
  { city: 'chicago', state: 'IL' },
  { city: 'los angeles', state: 'CA' },
  { city: 'new york', state: 'NY' },
  { city: 'detroit', state: 'MI' },
  { city: 'philadelphia', state: 'PA' },
  { city: 'miami', state: 'FL' },
  { city: 'washington dc', state: 'DC' },
  { city: 'charlotte', state: 'NC' }
];

// ============================================
// REVENUE SNIPER CLASS
// ============================================

export interface SniperResult {
  analyzed: number;
  breakouts: TrendSignal[];
  rising: TrendSignal[];
  pagesGenerated: number;
  pagesDeployed: number;
  timestamp: Date;
}

export interface GeneratedPage {
  keyword: string;
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  schema: object;
  signal: TrendSignal;
}

export class RevenueSniperCron {
  private pool: Pool;
  private trendService: TrendArbitrageService;
  private apifyService: ApifyService;

  constructor(pool: Pool) {
    this.pool = pool;
    this.apifyService = ApifyService.getInstance(pool);
    this.trendService = TrendArbitrageService.getInstance(pool, this.apifyService);
  }

  // ============================================
  // MAIN ENTRY POINT
  // ============================================

  /**
   * Run the full Revenue Sniper pipeline
   */
  async run(): Promise<SniperResult> {
    console.log('🎯 [REVENUE SNIPER] Starting daily scan...');
    console.log(`📅 ${new Date().toISOString()}`);

    const result: SniperResult = {
      analyzed: 0,
      breakouts: [],
      rising: [],
      pagesGenerated: 0,
      pagesDeployed: 0,
      timestamp: new Date()
    };

    try {
      // Step 1: Analyze loc trends
      console.log('\n📊 Step 1: Analyzing loc industry trends...');
      const locTrends = await this.analyzeLocTrends();
      result.analyzed += locTrends.analyzed;
      result.breakouts.push(...locTrends.signals.filter(s => s.category === 'breakout'));
      result.rising.push(...locTrends.signals.filter(s => s.category === 'rising'));

      // Step 2: Analyze geo-specific trends (Houston focus)
      console.log('\n📍 Step 2: Analyzing Houston neighborhood trends...');
      const geoTrends = await this.analyzeGeoTrends();
      result.breakouts.push(...geoTrends.filter(s => s.category === 'breakout'));
      result.rising.push(...geoTrends.filter(s => s.category === 'rising'));

      // Step 3: Generate pages for attack opportunities
      console.log('\n🏗️ Step 3: Generating pages for attack opportunities...');
      const attackSignals = [...result.breakouts, ...result.rising]
        .filter(s => s.recommendedAction === 'attack')
        .slice(0, 10); // Top 10 opportunities

      const pages = await this.generatePages(attackSignals);
      result.pagesGenerated = pages.length;

      // Step 4: Queue for deployment
      console.log('\n🚀 Step 4: Queueing pages for deployment...');
      result.pagesDeployed = await this.queueForDeployment(pages);

      // Step 5: Store results
      await this.storeResults(result);

      // Step 6: Send notifications
      await this.sendNotifications(result);

      console.log('\n✅ [REVENUE SNIPER] Scan complete!');
      this.printSummary(result);

      return result;

    } catch (error: any) {
      console.error('❌ [REVENUE SNIPER] Error:', error.message);
      throw error;
    }
  }

  // ============================================
  // TREND ANALYSIS
  // ============================================

  /**
   * Analyze general loc industry trends
   */
  private async analyzeLocTrends() {
    return this.trendService.analyzeTrends({
      seedKeywords: LOC_SEED_KEYWORDS,
      geo: 'US',
      timeframe: 'now 7-d',
      breakoutThreshold: 200,
      risingThreshold: 40,
      minVolume: 50
    });
  }

  /**
   * Analyze geo-specific trends for Houston area
   */
  private async analyzeGeoTrends(): Promise<TrendSignal[]> {
    const signals: TrendSignal[] = [];
    const highIntentKeywords = ['sisterlocks', 'loctician', 'microlocs', 'loc retwist'];

    for (const keyword of highIntentKeywords) {
      for (const neighborhood of HOUSTON_NEIGHBORHOODS.slice(0, 8)) { // Top 8 neighborhoods
        try {
          const geoKeyword = `${keyword} ${neighborhood}`;

          const result = await this.trendService.analyzeTrends({
            seedKeywords: [geoKeyword],
            geo: 'US-TX',
            timeframe: 'now 7-d',
            breakoutThreshold: 150,
            risingThreshold: 30,
            minVolume: 20
          });

          signals.push(...result.signals);

          // Rate limit to avoid Apify quota
          await this.sleep(1000);
        } catch (error) {
          console.warn(`⚠️ Could not analyze: ${keyword} ${neighborhood}`);
        }
      }
    }

    return signals;
  }

  // ============================================
  // PAGE GENERATION
  // ============================================

  /**
   * Generate T07 geo-pages for attack signals
   */
  private async generatePages(signals: TrendSignal[]): Promise<GeneratedPage[]> {
    const pages: GeneratedPage[] = [];

    for (const signal of signals) {
      const page = this.generateT07Page(signal);
      pages.push(page);

      // Store in database
      await this.storePage(page);

      console.log(`  ✓ Generated: ${page.slug}`);
    }

    return pages;
  }

  /**
   * Generate a T07 geo-page from a trend signal
   */
  private generateT07Page(signal: TrendSignal): GeneratedPage {
    const keyword = signal.keyword;
    const slug = this.slugify(keyword);

    // Extract location if present
    const locationMatch = keyword.match(/(houston|katy|sugar land|pearland|cypress|woodlands|humble|pasadena)/i);
    const location = locationMatch ? locationMatch[1] : 'Houston';
    const locationProper = this.titleCase(location);

    // Extract service type
    const serviceMatch = keyword.match(/(sisterlocks|microlocs|locs|retwist|repair|maintenance)/i);
    const service = serviceMatch ? serviceMatch[1] : 'Locs';
    const serviceProper = this.titleCase(service);

    return {
      keyword,
      slug,
      title: `${serviceProper} in ${locationProper}, TX | Professional Loctician Services`,
      metaDescription: `Looking for ${keyword}? Expert loctician services in ${locationProper}. Sisterlocks, microlocs, retwists & more. Book your consultation today!`,
      h1: `${serviceProper} in ${locationProper}`,
      content: this.generatePageContent(keyword, locationProper, serviceProper, signal),
      schema: this.generateSchema(keyword, locationProper, serviceProper),
      signal
    };
  }

  /**
   * Generate SEO-optimized page content
   */
  private generatePageContent(keyword: string, location: string, service: string, signal: TrendSignal): string {
    return `
## Expert ${service} Services in ${location}

Looking for professional **${keyword}** services? You've come to the right place. Our certified locticians specialize in ${service.toLowerCase()} with over 15 years of experience serving the ${location} community.

### Why Choose Us for ${service}?

- **Certified Expertise**: Trained and certified in Sisterlocks™ and traditional loc techniques
- **Personalized Consultation**: Every loc journey is unique - we create custom plans for your hair
- **Quality Products**: We use only premium, loc-friendly products
- **Convenient Location**: Serving ${location} and surrounding areas

### Our ${service} Services Include:

- Sisterlocks Installation & Maintenance
- Microlocs Installation
- Traditional Loc Services
- Loc Retwisting & Retightening
- Loc Repair & Restoration
- Interlocking Services

### Book Your ${service} Appointment

Ready to start or continue your loc journey? **Book your consultation today** and discover why we're ${location}'s trusted loctician.

[BOOK NOW]

---

*Trending: ${signal.category === 'breakout' ? '🔥 High demand' : '📈 Rising interest'} for ${keyword} (+${signal.growthRate}%)*
    `.trim();
  }

  /**
   * Generate LocalBusiness schema
   */
  private generateSchema(keyword: string, location: string, service: string): object {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": `${service} Services - ${location}`,
      "description": `Professional ${keyword} services in ${location}, TX`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": location,
        "addressRegion": "TX",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "29.7604",
        "longitude": "-95.3698"
      },
      "url": `https://example.com/${this.slugify(keyword)}`,
      "telephone": "+1-XXX-XXX-XXXX",
      "priceRange": "$$",
      "openingHours": "Mo-Sa 09:00-18:00"
    };
  }

  // ============================================
  // DEPLOYMENT
  // ============================================

  /**
   * Queue generated pages for deployment
   */
  private async queueForDeployment(pages: GeneratedPage[]): Promise<number> {
    let deployed = 0;

    for (const page of pages) {
      try {
        await this.pool.query(`
          INSERT INTO deployment_queue (
            type, slug, title, content, schema, metadata, status, priority
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (slug) DO UPDATE SET
            content = $4,
            metadata = $6,
            status = 'pending',
            updated_at = NOW()
        `, [
          'geo-page',
          page.slug,
          page.title,
          page.content,
          JSON.stringify(page.schema),
          JSON.stringify({
            keyword: page.keyword,
            signal: page.signal,
            generatedAt: new Date()
          }),
          'pending',
          page.signal.category === 'breakout' ? 1 : 2
        ]);

        deployed++;
      } catch (error: any) {
        // Table might not exist yet - create it
        if (error.message.includes('does not exist')) {
          await this.createDeploymentTable();
          deployed++;
        }
      }
    }

    return deployed;
  }

  /**
   * Create deployment queue table if not exists
   */
  private async createDeploymentTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS deployment_queue (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500),
        content TEXT,
        schema JSONB,
        metadata JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        priority INT DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deployed_at TIMESTAMP
      )
    `);
  }

  // ============================================
  // STORAGE & NOTIFICATIONS
  // ============================================

  /**
   * Store page in database
   */
  private async storePage(page: GeneratedPage): Promise<void> {
    await this.pool.query(`
      INSERT INTO generated_pages (
        keyword, slug, title, meta_description, h1, content, schema, signal_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (slug) DO UPDATE SET
        content = $6,
        signal_data = $8,
        updated_at = NOW()
    `, [
      page.keyword,
      page.slug,
      page.title,
      page.metaDescription,
      page.h1,
      page.content,
      JSON.stringify(page.schema),
      JSON.stringify(page.signal)
    ]).catch(async (error) => {
      // Create table if not exists
      if (error.message.includes('does not exist')) {
        await this.createPagesTable();
      }
    });
  }

  /**
   * Create generated pages table
   */
  private async createPagesTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS generated_pages (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500),
        meta_description TEXT,
        h1 VARCHAR(500),
        content TEXT,
        schema JSONB,
        signal_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * Store sniper run results
   */
  private async storeResults(result: SniperResult): Promise<void> {
    await this.pool.query(`
      INSERT INTO sniper_runs (
        analyzed, breakout_count, rising_count, pages_generated, pages_deployed, run_data
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      result.analyzed,
      result.breakouts.length,
      result.rising.length,
      result.pagesGenerated,
      result.pagesDeployed,
      JSON.stringify(result)
    ]).catch(async (error) => {
      if (error.message.includes('does not exist')) {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS sniper_runs (
            id SERIAL PRIMARY KEY,
            analyzed INT,
            breakout_count INT,
            rising_count INT,
            pages_generated INT,
            pages_deployed INT,
            run_data JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
      }
    });
  }

  /**
   * Send notifications about results
   */
  private async sendNotifications(result: SniperResult): Promise<void> {
    // Log to console for now
    if (result.breakouts.length > 0) {
      console.log('\n🔥 BREAKOUT ALERTS:');
      result.breakouts.forEach(s => {
        console.log(`   • ${s.keyword}: +${s.growthRate}% (${s.recommendedAction.toUpperCase()})`);
      });
    }

    // TODO: Add Telegram/Discord/Email notifications
  }

  // ============================================
  // UTILITIES
  // ============================================

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private titleCase(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printSummary(result: SniperResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REVENUE SNIPER SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Keywords Analyzed:  ${result.analyzed}`);
    console.log(`   🔥 Breakouts Found: ${result.breakouts.length}`);
    console.log(`   📈 Rising Found:    ${result.rising.length}`);
    console.log(`   📄 Pages Generated: ${result.pagesGenerated}`);
    console.log(`   🚀 Pages Queued:    ${result.pagesDeployed}`);
    console.log('='.repeat(60));
  }
}

// ============================================
// CRON SCHEDULE WRAPPER
// ============================================

export async function runRevenueSniper(pool: Pool): Promise<SniperResult> {
  const sniper = new RevenueSniperCron(pool);
  return sniper.run();
}

export default RevenueSniperCron;
