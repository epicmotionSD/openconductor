/**
 * OpenConductor MCP Database Setup
 * 
 * Handles database initialization for MCP features including pgvector extension
 * and schema creation for semantic search capabilities.
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger';

export interface DatabaseSetupConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * Database Setup Manager for MCP Features
 */
export class MCPDatabaseSetup {
  private pool: Pool;
  private logger: Logger;

  constructor(config: DatabaseSetupConfig, logger: Logger) {
    this.logger = logger;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Initialize MCP database schema and extensions
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing MCP database schema...');

    try {
      await this.setupExtensions();
      await this.runSchema();
      await this.createPartitions();
      await this.seedInitialData();
      
      this.logger.info('MCP database initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP database:', error);
      throw error;
    }
  }

  /**
   * Set up required PostgreSQL extensions
   */
  private async setupExtensions(): Promise<void> {
    this.logger.info('Setting up PostgreSQL extensions...');

    const extensions = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto"', 
      'CREATE EXTENSION IF NOT EXISTS "vector"'
    ];

    for (const extension of extensions) {
      try {
        await this.pool.query(extension);
        this.logger.debug(`Extension setup: ${extension}`);
      } catch (error) {
        this.logger.error(`Failed to create extension: ${extension}`, error);
        throw error;
      }
    }
  }

  /**
   * Run the MCP database schema
   */
  private async runSchema(): Promise<void> {
    this.logger.info('Running MCP database schema...');

    try {
      const schemaPath = join(__dirname, 'database-schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements and execute
      const statements = schema.split(/;\s*$/gm).filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.query(statement);
        }
      }
      
      this.logger.info('MCP schema executed successfully');
    } catch (error) {
      this.logger.error('Failed to run MCP schema:', error);
      throw error;
    }
  }

  /**
   * Create monthly partitions for high-volume tables
   */
  private async createPartitions(): Promise<void> {
    this.logger.info('Creating monthly partitions for MCP tables...');

    const currentDate = new Date();
    const partitions = [];

    // Create partitions for the next 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const partitionSuffix = `${year}_${month}`;
      
      partitions.push({
        table: `mcp_workflow_executions_${partitionSuffix}`,
        parent: 'mcp_workflow_executions',
        from: date.toISOString().split('T')[0],
        to: nextDate.toISOString().split('T')[0]
      });

      partitions.push({
        table: `usage_events_${partitionSuffix}`,
        parent: 'usage_events', 
        from: date.toISOString().split('T')[0],
        to: nextDate.toISOString().split('T')[0]
      });

      partitions.push({
        table: `user_interactions_${partitionSuffix}`,
        parent: 'user_interactions',
        from: date.toISOString().split('T')[0],
        to: nextDate.toISOString().split('T')[0]
      });
    }

    for (const partition of partitions) {
      try {
        const createPartitionSQL = `
          CREATE TABLE IF NOT EXISTS ${partition.table} 
          PARTITION OF ${partition.parent} 
          FOR VALUES FROM ('${partition.from}') TO ('${partition.to}')
        `;
        
        await this.pool.query(createPartitionSQL);
        this.logger.debug(`Created partition: ${partition.table}`);
      } catch (error) {
        // Ignore if partition already exists
        if (!error.message.includes('already exists')) {
          this.logger.error(`Failed to create partition ${partition.table}:`, error);
        }
      }
    }
  }

  /**
   * Seed initial data for MCP features
   */
  private async seedInitialData(): Promise<void> {
    this.logger.info('Seeding initial MCP data...');

    try {
      // Seed sample MCP servers for development/demo
      await this.seedSampleServers();
      
      // Seed workflow templates
      await this.seedWorkflowTemplates();
      
      this.logger.info('Initial MCP data seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed initial MCP data:', error);
      throw error;
    }
  }

  /**
   * Seed sample MCP servers for development
   */
  private async seedSampleServers(): Promise<void> {
    const sampleServers = [
      {
        name: 'filesystem-server',
        display_name: 'File System Server',
        description: 'Provides access to local file system operations including read, write, and directory management.',
        categories: ['filesystem', 'utilities'],
        tags: ['files', 'directory', 'io'],
        use_cases: ['file management', 'data processing', 'backup operations'],
        npm_package: '@modelcontextprotocol/server-filesystem',
        transport_type: 'stdio',
        performance_tier: 'standard',
        is_official: true,
        is_verified: true
      },
      {
        name: 'postgres-server', 
        display_name: 'PostgreSQL Server',
        description: 'Database operations for PostgreSQL including queries, schema management, and data manipulation.',
        categories: ['database', 'sql'],
        tags: ['postgres', 'sql', 'database', 'queries'],
        use_cases: ['database queries', 'data analysis', 'schema management'],
        npm_package: '@modelcontextprotocol/server-postgres',
        transport_type: 'stdio',
        performance_tier: 'premium',
        is_official: true,
        is_verified: true
      },
      {
        name: 'web-search-server',
        display_name: 'Web Search Server', 
        description: 'Web search capabilities using various search engines and APIs for information retrieval.',
        categories: ['search', 'web', 'information'],
        tags: ['search', 'web', 'google', 'bing', 'information'],
        use_cases: ['research', 'fact checking', 'information gathering'],
        npm_package: '@modelcontextprotocol/server-web-search',
        transport_type: 'stdio',
        performance_tier: 'standard',
        is_official: true,
        is_verified: true
      }
    ];

    for (const server of sampleServers) {
      const checkQuery = 'SELECT id FROM mcp_servers WHERE name = $1';
      const existing = await this.pool.query(checkQuery, [server.name]);
      
      if (existing.rows.length === 0) {
        const insertQuery = `
          INSERT INTO mcp_servers (
            name, display_name, description, categories, tags, use_cases,
            npm_package, transport_type, performance_tier, is_official, is_verified,
            status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        `;
        
        await this.pool.query(insertQuery, [
          server.name,
          server.display_name,
          server.description,
          server.categories,
          server.tags,
          server.use_cases,
          server.npm_package,
          server.transport_type,
          server.performance_tier,
          server.is_official,
          server.is_verified
        ]);
      }
    }
  }

  /**
   * Seed workflow templates
   */
  private async seedWorkflowTemplates(): Promise<void> {
    const templates = [
      {
        title: 'Data Processing Pipeline',
        description: 'A basic workflow template for processing data files with validation and transformation steps.',
        template_definition: {
          nodes: [
            {
              id: 'read-file',
              type: 'mcp_server',
              server: 'filesystem-server',
              tool: 'read_file',
              position: { x: 100, y: 100 }
            },
            {
              id: 'process-data',
              type: 'transform',
              script: 'data => data.map(row => ({ ...row, processed: true }))',
              position: { x: 300, y: 100 }
            },
            {
              id: 'save-results',
              type: 'mcp_server', 
              server: 'filesystem-server',
              tool: 'write_file',
              position: { x: 500, y: 100 }
            }
          ],
          edges: [
            { from: 'read-file', to: 'process-data' },
            { from: 'process-data', to: 'save-results' }
          ]
        },
        difficulty_level: 'beginner',
        categories: ['data-processing', 'files'],
        tags: ['data', 'files', 'transformation', 'pipeline'],
        license_type: 'open_source',
        status: 'published'
      }
    ];

    for (const template of templates) {
      const checkQuery = 'SELECT id FROM workflow_templates WHERE title = $1';
      const existing = await this.pool.query(checkQuery, [template.title]);
      
      if (existing.rows.length === 0) {
        const insertQuery = `
          INSERT INTO workflow_templates (
            title, description, template_definition, difficulty_level,
            categories, tags, license_type, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        
        await this.pool.query(insertQuery, [
          template.title,
          template.description,
          JSON.stringify(template.template_definition),
          template.difficulty_level,
          template.categories,
          template.tags,
          template.license_type,
          template.status
        ]);
      }
    }
  }

  /**
   * Check if pgvector extension is available
   */
  async checkVectorSupport(): Promise<boolean> {
    try {
      const result = await this.pool.query(
        "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
      );
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error('Failed to check vector extension:', error);
      return false;
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    vectorSupport: boolean;
    tablesCreated: boolean;
    partitionsCreated: boolean;
  }> {
    try {
      // Check connection
      await this.pool.query('SELECT 1');
      const connected = true;

      // Check vector support
      const vectorSupport = await this.checkVectorSupport();

      // Check if MCP tables exist
      const tablesResult = await this.pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name IN ('mcp_servers', 'mcp_workflows', 'mcp_tools')
      `);
      const tablesCreated = parseInt(tablesResult.rows[0].count) === 3;

      // Check if partitions exist
      const partitionsResult = await this.pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name LIKE 'mcp_workflow_executions_%' 
        OR table_name LIKE 'usage_events_%'
        OR table_name LIKE 'user_interactions_%'
      `);
      const partitionsCreated = parseInt(partitionsResult.rows[0].count) > 0;

      return {
        connected,
        vectorSupport,
        tablesCreated,
        partitionsCreated
      };
    } catch (error) {
      this.logger.error('Failed to get database health status:', error);
      return {
        connected: false,
        vectorSupport: false,
        tablesCreated: false,
        partitionsCreated: false
      };
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Factory function to create MCP database setup instance
 */
export function createMCPDatabaseSetup(config: DatabaseSetupConfig, logger: Logger): MCPDatabaseSetup {
  return new MCPDatabaseSetup(config, logger);
}