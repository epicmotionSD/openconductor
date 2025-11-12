import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../../.env') });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

// Supabase connection configuration using pooled connection
const supabaseConfig = {
  connectionString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000
};

// Validate connection string
if (!supabaseConfig.connectionString) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL must be set in environment variables');
}

async function deployToSupabase() {
  const pool = new Pool(supabaseConfig);
  
  try {
    logger.info('🚀 Deploying OpenConductor schema to Supabase...');

    // Test connection
    const client = await pool.connect();
    logger.info('✅ Connected to Supabase PostgreSQL');

    // Check existing tables
    logger.info('📋 Checking existing tables...');
    const existingTablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename LIKE '%mcp%' OR tablename LIKE '%server%' OR tablename LIKE '%github%'
      ORDER BY tablename
    `);

    if (existingTablesResult.rows.length > 0) {
      logger.warn('⚠️  Found existing tables:');
      existingTablesResult.rows.forEach(row => {
        logger.warn(`   - ${row.tablename}`);
      });
      
      // Ask if we should drop existing tables
      logger.info('🗑️  Dropping existing tables to ensure clean deployment...');
      
      const tablesToDrop = [
        'mcp_servers', 'server_stats', 'server_versions', 'server_dependencies',
        'user_interactions', 'server_reviews', 'github_webhook_logs', 'api_usage',
        'api_keys', 'background_jobs', 'server_analytics_snapshots'
      ];

      for (const table of tablesToDrop) {
        try {
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          logger.info(`   Dropped table: ${table}`);
        } catch (error) {
          logger.warn(`   Could not drop ${table}: ${error.message}`);
        }
      }

      // Drop enum types
      try {
        await client.query('DROP TYPE IF EXISTS server_category CASCADE');
        logger.info('   Dropped enum: server_category');
      } catch (error) {
        logger.warn('   Could not drop server_category enum');
      }

      // Drop functions
      try {
        await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
        logger.info('   Dropped function: update_updated_at_column');
      } catch (error) {
        logger.warn('   Could not drop update function');
      }
    }

    // Deploy new schema
    logger.info('📦 Deploying comprehensive schema...');
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    await client.query(schema);
    logger.info('✅ Schema deployed successfully');

    // Verify tables were created
    logger.info('🔍 Verifying table creation...');
    const newTablesResult = await client.query(`
      SELECT tablename, schemaname
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND (tablename LIKE '%mcp%' OR tablename LIKE '%server%' OR tablename LIKE '%github%' OR tablename LIKE '%api%' OR tablename LIKE '%background%')
      ORDER BY tablename
    `);

    logger.info(`✅ Created ${newTablesResult.rows.length} tables:`);
    newTablesResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.tablename}`);
    });

    // Verify views
    const viewsResult = await client.query(`
      SELECT viewname
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname LIKE '%server%'
      ORDER BY viewname
    `);

    if (viewsResult.rows.length > 0) {
      logger.info(`✅ Created ${viewsResult.rows.length} views:`);
      viewsResult.rows.forEach(row => {
        logger.info(`   ✓ ${row.viewname}`);
      });
    }

    // Verify indexes
    const indexResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (tablename LIKE '%mcp%' OR tablename LIKE '%server%')
      ORDER BY tablename, indexname
    `);

    logger.info(`✅ Created ${indexResult.rows.length} indexes for performance`);

    client.release();
    logger.info('🎉 Supabase deployment completed successfully!');

    return true;

  } catch (error) {
    logger.error('❌ Supabase deployment failed:', error.message);
    logger.error(error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

async function seedSupabase() {
  const pool = new Pool(supabaseConfig);
  
  try {
    logger.info('🌱 Seeding Supabase database...');

    const client = await pool.connect();

    // Import seed data from our seed.ts
    const { seedDatabase } = await import('./seed');
    
    // Create a mock DatabaseManager for seeding
    const mockDb = {
      transaction: async (callback: any) => {
        return callback(client);
      },
      query: (sql: string, params?: any[]) => client.query(sql, params)
    };

    await seedDatabase(mockDb as any);
    
    client.release();
    logger.info('✅ Supabase seeding completed');

  } catch (error) {
    logger.error('❌ Supabase seeding failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function verifyDeployment() {
  const pool = new Pool(supabaseConfig);
  
  try {
    logger.info('🔍 Verifying deployment...');

    const client = await pool.connect();

    // Check server count
    const serverCountResult = await client.query('SELECT COUNT(*) FROM mcp_servers');
    const serverCount = parseInt(serverCountResult.rows[0].count);
    
    logger.info(`📊 Database contains ${serverCount} servers`);

    // Check stats
    const statsCountResult = await client.query('SELECT COUNT(*) FROM server_stats');
    const statsCount = parseInt(statsCountResult.rows[0].count);
    
    logger.info(`📈 Database contains ${statsCount} server stat records`);

    // Test search functionality
    const searchResult = await client.query(`
      SELECT name, category, tags
      FROM mcp_servers 
      WHERE search_vector @@ plainto_tsquery('english', 'memory')
      LIMIT 3
    `);
    
    logger.info(`🔍 Search test found ${searchResult.rows.length} memory-related servers`);

    // Test views
    const popularViewResult = await client.query('SELECT COUNT(*) FROM popular_servers');
    const popularCount = parseInt(popularViewResult.rows[0].count);
    
    logger.info(`⭐ Popular servers view contains ${popularCount} records`);

    client.release();
    logger.info('✅ Deployment verification successful');
    
    return {
      servers: serverCount,
      stats: statsCount,
      searchWorking: searchResult.rows.length > 0,
      viewsWorking: popularCount >= 0
    };

  } catch (error) {
    logger.error('❌ Deployment verification failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// CLI script execution
async function main() {
  try {
    // Deploy schema
    await deployToSupabase();
    
    // Seed with initial data
    await seedSupabase();
    
    // Verify everything works
    const verification = await verifyDeployment();
    
    logger.info('🎉 SUPABASE DEPLOYMENT COMPLETE!');
    logger.info('📊 Summary:');
    logger.info(`   • ${verification.servers} servers deployed`);
    logger.info(`   • ${verification.stats} stats records created`);
    logger.info(`   • Search engine: ${verification.searchWorking ? '✅ Working' : '❌ Failed'}`);
    logger.info(`   • Views: ${verification.viewsWorking ? '✅ Working' : '❌ Failed'}`);
    logger.info('');
    logger.info('🚀 Ready to restart API server with Supabase connection!');
    
  } catch (error) {
    logger.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { deployToSupabase, seedSupabase, verifyDeployment };