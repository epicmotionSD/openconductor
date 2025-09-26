/**
 * SportIntel Database Utilities
 * 
 * Database migration, seeding, and management utilities for development
 */

import { Pool, PoolClient } from 'pg';
import { createClient } from 'redis';
import { SportIntelConfigManager } from '../../src/config/sportintel/development-config';
import { Logger } from '../../src/utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

const config = SportIntelConfigManager.getInstance();
const logger = Logger.getInstance();

export class SportIntelDatabaseUtils {
  private pgPool: Pool;
  private redisClient: any;

  constructor() {
    const dbConfig = config.getSection('database');
    
    this.pgPool = new Pool({
      host: dbConfig.timescale.host,
      port: dbConfig.timescale.port,
      database: dbConfig.timescale.database,
      user: dbConfig.timescale.username,
      password: dbConfig.timescale.password,
      ssl: dbConfig.timescale.ssl,
      max: dbConfig.timescale.maxConnections,
    });

    this.redisClient = createClient({
      url: config.getRedisUrl(),
    });
  }

  /**
   * Initialize database connections
   */
  async connect(): Promise<void> {
    try {
      await this.pgPool.connect();
      await this.redisClient.connect();
      logger.info('Database connections established');
    } catch (error) {
      logger.error('Failed to connect to databases', { error });
      throw error;
    }
  }

  /**
   * Close database connections
   */
  async disconnect(): Promise<void> {
    try {
      await this.pgPool.end();
      await this.redisClient.disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Failed to close database connections', { error });
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      logger.info('Running database migrations...');

      // Create migrations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Enable TimescaleDB extension
      await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb');

      // Create schemas
      await client.query('CREATE SCHEMA IF NOT EXISTS sportintel');
      await client.query('CREATE SCHEMA IF NOT EXISTS analytics');
      await client.query('CREATE SCHEMA IF NOT EXISTS cache');

      // Run migration files
      const migrationsDir = path.join(__dirname, '../migrations');
      const migrationFiles = await this.getMigrationFiles(migrationsDir);

      for (const file of migrationFiles) {
        await this.runMigrationFile(client, file);
      }

      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed database with test data
   */
  async seedDatabase(): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      logger.info('Seeding database with test data...');

      // Insert test leagues
      await client.query(`
        INSERT INTO sportintel.leagues (id, name, sport, country, active)
        VALUES 
          ('nfl', 'National Football League', 'football', 'USA', true),
          ('nba', 'National Basketball Association', 'basketball', 'USA', true),
          ('mlb', 'Major League Baseball', 'baseball', 'USA', true)
        ON CONFLICT (id) DO NOTHING
      `);

      // Insert test teams
      await client.query(`
        INSERT INTO sportintel.teams (id, league_id, name, abbreviation, city, conference, division)
        VALUES 
          ('kc', 'nfl', 'Kansas City Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
          ('buf', 'nfl', 'Buffalo Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
          ('sf', 'nfl', 'San Francisco 49ers', 'SF', 'San Francisco', 'NFC', 'West'),
          ('phi', 'nfl', 'Philadelphia Eagles', 'PHI', 'Philadelphia', 'NFC', 'East')
        ON CONFLICT (id) DO NOTHING
      `);

      // Insert test players
      await this.seedPlayers(client);

      // Insert test games
      await this.seedGames(client);

      // Insert test market data
      await this.seedMarketData(client);

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Database seeding failed', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Drop and recreate database
   */
  async resetDatabase(): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      logger.info('Resetting database...');

      // Drop all tables in reverse dependency order
      const dropQueries = [
        'DROP TABLE IF EXISTS sportintel.predictions CASCADE',
        'DROP TABLE IF EXISTS sportintel.market_data CASCADE', 
        'DROP TABLE IF EXISTS sportintel.player_stats CASCADE',
        'DROP TABLE IF EXISTS sportintel.games CASCADE',
        'DROP TABLE IF EXISTS sportintel.players CASCADE',
        'DROP TABLE IF EXISTS sportintel.teams CASCADE',
        'DROP TABLE IF EXISTS sportintel.leagues CASCADE',
        'DROP TABLE IF EXISTS analytics.performance_metrics CASCADE',
        'DROP TABLE IF EXISTS analytics.model_accuracy CASCADE',
        'DROP TABLE IF EXISTS cache.cache_statistics CASCADE',
        'DROP SCHEMA IF EXISTS sportintel CASCADE',
        'DROP SCHEMA IF EXISTS analytics CASCADE',
        'DROP SCHEMA IF EXISTS cache CASCADE',
      ];

      for (const query of dropQueries) {
        await client.query(query);
      }

      // Clear Redis cache
      await this.redisClient.flushDb();

      logger.info('Database reset completed');
    } catch (error) {
      logger.error('Database reset failed', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get migration files in order
   */
  private async getMigrationFiles(migrationsDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Assuming files are named with timestamps/version numbers
    } catch (error) {
      logger.warn('Migrations directory not found, skipping file-based migrations');
      return [];
    }
  }

  /**
   * Run a single migration file
   */
  private async runMigrationFile(client: PoolClient, filename: string): Promise<void> {
    const version = filename.replace('.sql', '');
    
    // Check if migration already applied
    const result = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      [version]
    );

    if (result.rows.length > 0) {
      logger.info(`Migration ${version} already applied, skipping`);
      return;
    }

    // Read and execute migration
    const migrationPath = path.join(__dirname, '../migrations', filename);
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version]
      );
      await client.query('COMMIT');
      logger.info(`Migration ${version} applied successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Seed test players
   */
  private async seedPlayers(client: PoolClient): Promise<void> {
    const players = [
      {
        id: 'mahomes-patrick',
        team_id: 'kc',
        name: 'Patrick Mahomes',
        position: 'QB',
        jersey_number: 15,
        height: '6-3',
        weight: 225,
        experience: 6,
        salary: 9000,
      },
      {
        id: 'allen-josh',
        team_id: 'buf', 
        name: 'Josh Allen',
        position: 'QB',
        jersey_number: 17,
        height: '6-5',
        weight: 237,
        experience: 5,
        salary: 8800,
      },
      {
        id: 'mccaffrey-christian',
        team_id: 'sf',
        name: 'Christian McCaffrey',
        position: 'RB',
        jersey_number: 23,
        height: '5-11',
        weight: 205,
        experience: 6,
        salary: 8500,
      },
      {
        id: 'brown-aj',
        team_id: 'phi',
        name: 'A.J. Brown',
        position: 'WR',
        jersey_number: 11,
        height: '6-1',
        weight: 226,
        experience: 4,
        salary: 7800,
      },
    ];

    for (const player of players) {
      await client.query(`
        INSERT INTO sportintel.players (
          id, team_id, name, position, jersey_number, height, weight, experience, salary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          salary = EXCLUDED.salary
      `, [
        player.id, player.team_id, player.name, player.position,
        player.jersey_number, player.height, player.weight, player.experience, player.salary
      ]);
    }
  }

  /**
   * Seed test games
   */
  private async seedGames(client: PoolClient): Promise<void> {
    const games = [
      {
        id: 'kc-buf-2023-w14',
        home_team_id: 'kc',
        away_team_id: 'buf',
        scheduled_time: '2023-12-10T18:00:00Z',
        week: 14,
        season: 2023,
        status: 'scheduled',
        spread: -2.5,
        total: 47.5,
      },
      {
        id: 'sf-phi-2023-w14',
        home_team_id: 'sf',
        away_team_id: 'phi', 
        scheduled_time: '2023-12-10T21:25:00Z',
        week: 14,
        season: 2023,
        status: 'scheduled',
        spread: -3.0,
        total: 45.5,
      },
    ];

    for (const game of games) {
      await client.query(`
        INSERT INTO sportintel.games (
          id, home_team_id, away_team_id, scheduled_time, week, season, status, spread, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        game.id, game.home_team_id, game.away_team_id, game.scheduled_time,
        game.week, game.season, game.status, game.spread, game.total
      ]);
    }
  }

  /**
   * Seed market data
   */
  private async seedMarketData(client: PoolClient): Promise<void> {
    const marketData = [
      {
        player_id: 'mahomes-patrick',
        game_id: 'kc-buf-2023-w14',
        timestamp: new Date(),
        salary: 9000,
        ownership: 25.5,
        projected_points: 22.8,
        floor: 15.2,
        ceiling: 32.4,
      },
      {
        player_id: 'allen-josh', 
        game_id: 'kc-buf-2023-w14',
        timestamp: new Date(),
        salary: 8800,
        ownership: 22.1,
        projected_points: 21.5,
        floor: 14.8,
        ceiling: 30.9,
      },
    ];

    for (const data of marketData) {
      await client.query(`
        INSERT INTO sportintel.market_data (
          player_id, game_id, timestamp, salary, ownership, projected_points, floor, ceiling
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (player_id, game_id, timestamp) DO NOTHING
      `, [
        data.player_id, data.game_id, data.timestamp, data.salary,
        data.ownership, data.projected_points, data.floor, data.ceiling
      ]);
    }
  }

  /**
   * Health check for databases
   */
  async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const health = { postgres: false, redis: false };

    try {
      await this.pgPool.query('SELECT 1');
      health.postgres = true;
    } catch (error) {
      logger.error('PostgreSQL health check failed', { error });
    }

    try {
      await this.redisClient.ping();
      health.redis = true;
    } catch (error) {
      logger.error('Redis health check failed', { error });
    }

    return health;
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<any> {
    const client = await this.pgPool.connect();
    
    try {
      const stats = await client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE schemaname IN ('sportintel', 'analytics', 'cache')
        ORDER BY schemaname, tablename
      `);

      const redisInfo = await this.redisClient.info('memory');
      const redisStats = this.parseRedisInfo(redisInfo);

      return {
        postgres: stats.rows,
        redis: redisStats,
      };
    } catch (error) {
      logger.error('Failed to get database statistics', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Parse Redis INFO output
   */
  private parseRedisInfo(info: string): any {
    const stats: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return stats;
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    try {
      await this.redisClient.flushDb();
      logger.info('All caches cleared');
    } catch (error) {
      logger.error('Failed to clear caches', { error });
      throw error;
    }
  }

  /**
   * Export database schema for documentation
   */
  async exportSchema(): Promise<string> {
    const client = await this.pgPool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          table_schema,
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema IN ('sportintel', 'analytics', 'cache')
        ORDER BY table_schema, table_name, ordinal_position
      `);

      let schema = '# SportIntel Database Schema\n\n';
      let currentTable = '';
      
      for (const row of result.rows) {
        const tableName = `${row.table_schema}.${row.table_name}`;
        
        if (tableName !== currentTable) {
          schema += `## ${tableName}\n\n`;
          schema += '| Column | Type | Nullable | Default |\n';
          schema += '|--------|------|----------|----------|\n';
          currentTable = tableName;
        }
        
        schema += `| ${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || ''} |\n`;
      }
      
      return schema;
    } catch (error) {
      logger.error('Failed to export schema', { error });
      throw error;
    } finally {
      client.release();
    }
  }
}

// CLI interface for database utilities
if (require.main === module) {
  const utils = new SportIntelDatabaseUtils();
  const command = process.argv[2];

  const main = async () => {
    await utils.connect();
    
    try {
      switch (command) {
        case 'migrate':
          await utils.runMigrations();
          break;
        case 'seed':
          await utils.seedDatabase();
          break;
        case 'reset':
          await utils.resetDatabase();
          await utils.runMigrations();
          await utils.seedDatabase();
          break;
        case 'health':
          const health = await utils.healthCheck();
          console.log('Database Health:', health);
          break;
        case 'stats':
          const stats = await utils.getStatistics();
          console.log('Database Statistics:', JSON.stringify(stats, null, 2));
          break;
        case 'clear-cache':
          await utils.clearCaches();
          break;
        case 'export-schema':
          const schema = await utils.exportSchema();
          console.log(schema);
          break;
        default:
          console.log('Usage: ts-node database-utils.ts <command>');
          console.log('Commands: migrate, seed, reset, health, stats, clear-cache, export-schema');
      }
    } finally {
      await utils.disconnect();
    }
  };

  main().catch(console.error);
}

export default SportIntelDatabaseUtils;