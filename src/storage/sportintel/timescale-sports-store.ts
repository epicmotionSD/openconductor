/**
 * TimescaleDB Sports Data Store
 * 
 * High-performance time-series database integration for SportIntel platform,
 * optimized for sports analytics with automatic compression and retention policies.
 * 
 * Key Features:
 * - Hypertables for player stats, game data, and predictions
 * - Automatic compression (90%+ space savings)
 * - Intelligent data retention policies by subscription tier
 * - Real-time continuous aggregates
 * - Cost-optimized storage strategies
 */

import { Pool, PoolClient } from 'pg';
import { Logger } from '../../utils/logger';
import { EventBus } from '../../types/events';

export interface TimescaleConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  compressionEnabled?: boolean;
  retentionPolicies?: Record<string, string>;
}

export interface SportsTimeSeriesData {
  timestamp: Date;
  playerId?: string;
  gameId?: string;
  team?: string;
  season?: number;
  week?: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PlayerStatPoint {
  timestamp: Date;
  playerId: string;
  gameId: string;
  team: string;
  opponent: string;
  position: string;
  week: number;
  season: number;
  // Core stats
  fantasyPoints: number;
  passingYards?: number;
  passingTDs?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  targets?: number;
  // Advanced metrics
  snapCount?: number;
  redZoneTargets?: number;
  airYards?: number;
  targetShare?: number;
  // Context data
  gameScript?: number;
  weatherTemp?: number;
  weatherWind?: number;
  // Metadata
  dataSource: string;
  confidence: number;
}

export interface GameStatePoint {
  timestamp: Date;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  week: number;
  season: number;
  quarter: number;
  timeRemaining: number;
  homeScore: number;
  awayScore: number;
  possession: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  // Derived metrics
  gameScript: number;
  scoreDifferential: number;
  winProbability: number;
  // Environmental
  temperature?: number;
  windSpeed?: number;
  precipitation?: number;
  venue: string;
  surface: string;
}

export interface PredictionPoint {
  timestamp: Date;
  predictionId: string;
  modelId: string;
  playerId?: string;
  gameId?: string;
  predictionType: 'player_performance' | 'game_outcome' | 'ownership';
  // Prediction data
  predictedValue: number;
  actualValue?: number;
  confidence: number;
  // Metadata
  features: Record<string, number>;
  shapValues?: Record<string, number>;
  modelVersion: string;
  // Validation
  isValidated: boolean;
  accuracy?: number;
}

export class TimescaleSportsStore {
  private pool: Pool;
  private logger: Logger;
  private eventBus: EventBus;
  private initialized: boolean = false;

  constructor(config: TimescaleConfig, logger: Logger, eventBus: EventBus) {
    this.logger = logger;
    this.eventBus = eventBus;
    
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.logger.info('TimescaleDB Sports Store initialized', {
      host: config.host,
      database: config.database,
      maxConnections: config.maxConnections || 20
    });
  }

  /**
   * Initialize TimescaleDB hypertables and policies
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Initializing TimescaleDB sports schema');

    const client = await this.pool.connect();
    
    try {
      // Enable TimescaleDB extension
      await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb;');

      // Create base tables and hypertables
      await this.createPlayerStatsHypertable(client);
      await this.createGameStatesHypertable(client);
      await this.createPredictionsHypertable(client);
      await this.createOwnershipHypertable(client);
      await this.createInjuriesHypertable(client);
      await this.createWeatherHypertable(client);

      // Set up compression policies
      await this.setupCompressionPolicies(client);

      // Set up retention policies
      await this.setupRetentionPolicies(client);

      // Create continuous aggregates for real-time analytics
      await this.createContinuousAggregates(client);

      // Create indexes for performance
      await this.createOptimizedIndexes(client);

      this.initialized = true;
      this.logger.info('TimescaleDB sports schema initialized successfully');

      // Emit initialization event
      this.eventBus.emit({
        type: 'timescale_sports_store_initialized',
        timestamp: new Date(),
        data: { success: true }
      });

    } catch (error) {
      this.logger.error('Failed to initialize TimescaleDB sports schema', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert player statistics with automatic conflict resolution
   */
  async insertPlayerStats(stats: PlayerStatPoint[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO player_stats (
          timestamp, player_id, game_id, team, opponent, position,
          week, season, fantasy_points, passing_yards, passing_tds,
          rushing_yards, rushing_tds, receiving_yards, receiving_tds,
          receptions, targets, snap_count, red_zone_targets, air_yards,
          target_share, game_script, weather_temp, weather_wind,
          data_source, confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        ON CONFLICT (player_id, game_id, timestamp)
        DO UPDATE SET
          fantasy_points = EXCLUDED.fantasy_points,
          passing_yards = EXCLUDED.passing_yards,
          passing_tds = EXCLUDED.passing_tds,
          rushing_yards = EXCLUDED.rushing_yards,
          rushing_tds = EXCLUDED.rushing_tds,
          receiving_yards = EXCLUDED.receiving_yards,
          receiving_tds = EXCLUDED.receiving_tds,
          receptions = EXCLUDED.receptions,
          targets = EXCLUDED.targets,
          snap_count = EXCLUDED.snap_count,
          confidence = GREATEST(player_stats.confidence, EXCLUDED.confidence),
          updated_at = NOW()
      `;

      for (const stat of stats) {
        await client.query(query, [
          stat.timestamp, stat.playerId, stat.gameId, stat.team, stat.opponent,
          stat.position, stat.week, stat.season, stat.fantasyPoints,
          stat.passingYards, stat.passingTDs, stat.rushingYards, stat.rushingTDs,
          stat.receivingYards, stat.receivingTDs, stat.receptions, stat.targets,
          stat.snapCount, stat.redZoneTargets, stat.airYards, stat.targetShare,
          stat.gameScript, stat.weatherTemp, stat.weatherWind, stat.dataSource, stat.confidence
        ]);
      }

      await client.query('COMMIT');
      
      this.logger.debug(`Inserted ${stats.length} player stat points`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to insert player stats', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert game state data for real-time game analysis
   */
  async insertGameStates(states: GameStatePoint[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO game_states (
          timestamp, game_id, home_team, away_team, week, season,
          quarter, time_remaining, home_score, away_score, possession,
          down, distance, yard_line, game_script, score_differential,
          win_probability, temperature, wind_speed, precipitation,
          venue, surface
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      `;

      for (const state of states) {
        await client.query(query, [
          state.timestamp, state.gameId, state.homeTeam, state.awayTeam,
          state.week, state.season, state.quarter, state.timeRemaining,
          state.homeScore, state.awayScore, state.possession, state.down,
          state.distance, state.yardLine, state.gameScript, state.scoreDifferential,
          state.winProbability, state.temperature, state.windSpeed,
          state.precipitation, state.venue, state.surface
        ]);
      }

      await client.query('COMMIT');
      
      this.logger.debug(`Inserted ${states.length} game state points`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to insert game states', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Insert prediction data for model accuracy tracking
   */
  async insertPredictions(predictions: PredictionPoint[]): Promise<void> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const prediction of predictions) {
        await client.query(`
          INSERT INTO predictions (
            timestamp, prediction_id, model_id, player_id, game_id,
            prediction_type, predicted_value, actual_value, confidence,
            features, shap_values, model_version, is_validated, accuracy
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (prediction_id) 
          DO UPDATE SET 
            actual_value = EXCLUDED.actual_value,
            is_validated = EXCLUDED.is_validated,
            accuracy = EXCLUDED.accuracy,
            updated_at = NOW()
        `, [
          prediction.timestamp, prediction.predictionId, prediction.modelId,
          prediction.playerId, prediction.gameId, prediction.predictionType,
          prediction.predictedValue, prediction.actualValue, prediction.confidence,
          JSON.stringify(prediction.features), JSON.stringify(prediction.shapValues),
          prediction.modelVersion, prediction.isValidated, prediction.accuracy
        ]);
      }

      await client.query('COMMIT');
      
      this.logger.debug(`Inserted ${predictions.length} prediction points`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Failed to insert predictions', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query player statistics with time range and filters
   */
  async queryPlayerStats(filters: {
    playerId?: string;
    team?: string;
    position?: string;
    startTime: Date;
    endTime: Date;
    season?: number;
    week?: number;
    limit?: number;
  }): Promise<PlayerStatPoint[]> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      let whereClause = 'WHERE timestamp >= $1 AND timestamp <= $2';
      const params: any[] = [filters.startTime, filters.endTime];
      let paramIndex = 3;

      if (filters.playerId) {
        whereClause += ` AND player_id = $${paramIndex++}`;
        params.push(filters.playerId);
      }
      if (filters.team) {
        whereClause += ` AND team = $${paramIndex++}`;
        params.push(filters.team);
      }
      if (filters.position) {
        whereClause += ` AND position = $${paramIndex++}`;
        params.push(filters.position);
      }
      if (filters.season) {
        whereClause += ` AND season = $${paramIndex++}`;
        params.push(filters.season);
      }
      if (filters.week) {
        whereClause += ` AND week = $${paramIndex++}`;
        params.push(filters.week);
      }

      const limitClause = filters.limit ? `LIMIT ${filters.limit}` : '';

      const query = `
        SELECT * FROM player_stats 
        ${whereClause}
        ORDER BY timestamp DESC
        ${limitClause}
      `;

      const result = await client.query(query, params);
      
      return result.rows.map(row => this.mapRowToPlayerStat(row));

    } finally {
      client.release();
    }
  }

  /**
   * Get real-time aggregated statistics using continuous aggregates
   */
  async getPlayerAggregates(
    playerId: string,
    timeframe: '1h' | '1d' | '7d' | '30d' | 'season'
  ): Promise<{
    avgFantasyPoints: number;
    totalSnapCount: number;
    consistencyScore: number;
    recentTrend: number;
    gameCount: number;
  }> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      const materializedView = this.getMaterializedViewName(timeframe);
      
      const query = `
        SELECT 
          AVG(fantasy_points) as avg_fantasy_points,
          SUM(snap_count) as total_snap_count,
          STDDEV(fantasy_points) as fp_stddev,
          COUNT(*) as game_count,
          (SELECT fantasy_points FROM player_stats 
           WHERE player_id = $1 
           ORDER BY timestamp DESC LIMIT 1) as latest_fp
        FROM ${materializedView}
        WHERE player_id = $1
          AND bucket >= NOW() - INTERVAL '${timeframe}'
      `;

      const result = await client.query(query, [playerId]);
      const row = result.rows[0];

      if (!row || !row.game_count) {
        return {
          avgFantasyPoints: 0,
          totalSnapCount: 0,
          consistencyScore: 0,
          recentTrend: 0,
          gameCount: 0
        };
      }

      const consistencyScore = row.fp_stddev ? 
        Math.max(0, 100 - (row.fp_stddev / row.avg_fantasy_points) * 100) : 0;
      
      const recentTrend = (row.latest_fp - row.avg_fantasy_points) / row.avg_fantasy_points;

      return {
        avgFantasyPoints: parseFloat(row.avg_fantasy_points) || 0,
        totalSnapCount: parseInt(row.total_snap_count) || 0,
        consistencyScore: Math.round(consistencyScore),
        recentTrend: Math.round(recentTrend * 100) / 100,
        gameCount: parseInt(row.game_count) || 0
      };

    } finally {
      client.release();
    }
  }

  /**
   * Clean up old data based on retention policies
   */
  async cleanupOldData(): Promise<{ deletedRows: number; freedSpace: string }> {
    if (!this.initialized) await this.initialize();

    const client = await this.pool.connect();
    
    try {
      let totalDeleted = 0;

      // Delete old raw player stats (keep 2 years)
      const playerStatsResult = await client.query(`
        DELETE FROM player_stats 
        WHERE timestamp < NOW() - INTERVAL '2 years'
      `);
      totalDeleted += playerStatsResult.rowCount || 0;

      // Delete old game states (keep 1 year)
      const gameStatesResult = await client.query(`
        DELETE FROM game_states 
        WHERE timestamp < NOW() - INTERVAL '1 year'
      `);
      totalDeleted += gameStatesResult.rowCount || 0;

      // Delete old predictions (keep 6 months)
      const predictionsResult = await client.query(`
        DELETE FROM predictions 
        WHERE timestamp < NOW() - INTERVAL '6 months'
      `);
      totalDeleted += predictionsResult.rowCount || 0;

      // Get database size for reporting
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      const freedSpace = sizeResult.rows[0]?.size || 'Unknown';

      this.logger.info('Cleaned up old TimescaleDB data', {
        deletedRows: totalDeleted,
        databaseSize: freedSpace
      });

      return { deletedRows: totalDeleted, freedSpace };

    } finally {
      client.release();
    }
  }

  // Private helper methods

  private async createPlayerStatsHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        timestamp TIMESTAMPTZ NOT NULL,
        player_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        team TEXT NOT NULL,
        opponent TEXT NOT NULL,
        position TEXT NOT NULL,
        week INTEGER NOT NULL,
        season INTEGER NOT NULL,
        fantasy_points REAL NOT NULL,
        passing_yards INTEGER,
        passing_tds INTEGER,
        rushing_yards INTEGER,
        rushing_tds INTEGER,
        receiving_yards INTEGER,
        receiving_tds INTEGER,
        receptions INTEGER,
        targets INTEGER,
        snap_count INTEGER,
        red_zone_targets INTEGER,
        air_yards REAL,
        target_share REAL,
        game_script REAL,
        weather_temp REAL,
        weather_wind REAL,
        data_source TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(player_id, game_id, timestamp)
      );
    `);

    // Create hypertable
    await client.query(`
      SELECT create_hypertable('player_stats', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async createGameStatesHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_states (
        timestamp TIMESTAMPTZ NOT NULL,
        game_id TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        week INTEGER NOT NULL,
        season INTEGER NOT NULL,
        quarter INTEGER NOT NULL,
        time_remaining INTEGER NOT NULL,
        home_score INTEGER NOT NULL,
        away_score INTEGER NOT NULL,
        possession TEXT,
        down INTEGER,
        distance INTEGER,
        yard_line INTEGER,
        game_script REAL,
        score_differential INTEGER,
        win_probability REAL,
        temperature REAL,
        wind_speed REAL,
        precipitation REAL,
        venue TEXT,
        surface TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      SELECT create_hypertable('game_states', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async createPredictionsHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        timestamp TIMESTAMPTZ NOT NULL,
        prediction_id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        player_id TEXT,
        game_id TEXT,
        prediction_type TEXT NOT NULL,
        predicted_value REAL NOT NULL,
        actual_value REAL,
        confidence REAL NOT NULL,
        features JSONB,
        shap_values JSONB,
        model_version TEXT NOT NULL,
        is_validated BOOLEAN DEFAULT FALSE,
        accuracy REAL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      SELECT create_hypertable('predictions', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async createOwnershipHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ownership_data (
        timestamp TIMESTAMPTZ NOT NULL,
        player_id TEXT NOT NULL,
        contest_type TEXT NOT NULL,
        projected_ownership REAL,
        actual_ownership REAL,
        salary INTEGER,
        projected_points REAL,
        actual_points REAL,
        week INTEGER NOT NULL,
        season INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      SELECT create_hypertable('ownership_data', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async createInjuriesHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS injury_reports (
        timestamp TIMESTAMPTZ NOT NULL,
        player_id TEXT NOT NULL,
        status TEXT NOT NULL, -- healthy, questionable, doubtful, out
        injury_type TEXT,
        body_part TEXT,
        severity TEXT,
        estimated_return TEXT,
        source TEXT NOT NULL,
        confidence REAL DEFAULT 1.0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      SELECT create_hypertable('injury_reports', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async createWeatherHypertable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_data (
        timestamp TIMESTAMPTZ NOT NULL,
        game_id TEXT NOT NULL,
        venue TEXT NOT NULL,
        temperature REAL,
        wind_speed REAL,
        wind_direction INTEGER,
        precipitation REAL,
        humidity REAL,
        conditions TEXT,
        visibility REAL,
        is_indoor BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      SELECT create_hypertable('weather_data', 'timestamp', if_not_exists => TRUE);
    `);
  }

  private async setupCompressionPolicies(client: PoolClient): Promise<void> {
    // Compress data older than 7 days to achieve 90%+ space savings
    const tables = ['player_stats', 'game_states', 'predictions', 'ownership_data', 'injury_reports', 'weather_data'];
    
    for (const table of tables) {
      await client.query(`
        SELECT add_compression_policy('${table}', INTERVAL '7 days');
      `).catch(() => {
        // Policy might already exist, ignore error
        this.logger.debug(`Compression policy for ${table} already exists or failed to create`);
      });
    }
  }

  private async setupRetentionPolicies(client: PoolClient): Promise<void> {
    // Different retention periods for different data types
    const retentionPolicies = {
      'player_stats': '2 years',
      'game_states': '1 year', 
      'predictions': '6 months',
      'ownership_data': '1 year',
      'injury_reports': '6 months',
      'weather_data': '1 year'
    };

    for (const [table, retention] of Object.entries(retentionPolicies)) {
      await client.query(`
        SELECT add_retention_policy('${table}', INTERVAL '${retention}');
      `).catch(() => {
        // Policy might already exist, ignore error
        this.logger.debug(`Retention policy for ${table} already exists or failed to create`);
      });
    }
  }

  private async createContinuousAggregates(client: PoolClient): Promise<void> {
    // Daily player stats aggregates
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS player_stats_daily
      WITH (timescaledb.continuous) AS
      SELECT 
        time_bucket('1 day', timestamp) AS bucket,
        player_id,
        team,
        position,
        AVG(fantasy_points) as avg_fantasy_points,
        MAX(fantasy_points) as max_fantasy_points,
        MIN(fantasy_points) as min_fantasy_points,
        STDDEV(fantasy_points) as fp_stddev,
        SUM(snap_count) as total_snaps,
        COUNT(*) as game_count
      FROM player_stats
      GROUP BY bucket, player_id, team, position;
    `).catch(() => {
      this.logger.debug('Daily player stats continuous aggregate already exists');
    });

    // Weekly aggregates
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS player_stats_weekly  
      WITH (timescaledb.continuous) AS
      SELECT 
        time_bucket('1 week', timestamp) AS bucket,
        player_id,
        team,
        position,
        AVG(fantasy_points) as avg_fantasy_points,
        SUM(fantasy_points) as total_fantasy_points,
        STDDEV(fantasy_points) as fp_stddev,
        COUNT(*) as game_count
      FROM player_stats
      GROUP BY bucket, player_id, team, position;
    `).catch(() => {
      this.logger.debug('Weekly player stats continuous aggregate already exists');
    });
  }

  private async createOptimizedIndexes(client: PoolClient): Promise<void> {
    // Player stats indexes for common queries
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_player_stats_player_season ON player_stats (player_id, season, week)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_team_week ON player_stats (team, season, week)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_position ON player_stats (position, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_game_states_game ON game_states (game_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions (model_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_ownership_player_week ON ownership_data (player_id, season, week)',
      'CREATE INDEX IF NOT EXISTS idx_injury_player ON injury_reports (player_id, timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_weather_game ON weather_data (game_id, timestamp)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery).catch((error) => {
        this.logger.debug('Index creation skipped (likely already exists)', { error: error.message });
      });
    }
  }

  private getMaterializedViewName(timeframe: string): string {
    switch (timeframe) {
      case '1h':
      case '1d':
        return 'player_stats_daily';
      case '7d':
      case '30d':
      case 'season':
        return 'player_stats_weekly';
      default:
        return 'player_stats_daily';
    }
  }

  private mapRowToPlayerStat(row: any): PlayerStatPoint {
    return {
      timestamp: row.timestamp,
      playerId: row.player_id,
      gameId: row.game_id,
      team: row.team,
      opponent: row.opponent,
      position: row.position,
      week: row.week,
      season: row.season,
      fantasyPoints: row.fantasy_points,
      passingYards: row.passing_yards,
      passingTDs: row.passing_tds,
      rushingYards: row.rushing_yards,
      rushingTDs: row.rushing_tds,
      receivingYards: row.receiving_yards,
      receivingTDs: row.receiving_tds,
      receptions: row.receptions,
      targets: row.targets,
      snapCount: row.snap_count,
      redZoneTargets: row.red_zone_targets,
      airYards: row.air_yards,
      targetShare: row.target_share,
      gameScript: row.game_script,
      weatherTemp: row.weather_temp,
      weatherWind: row.weather_wind,
      dataSource: row.data_source,
      confidence: row.confidence
    };
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('TimescaleDB Sports Store closed');
  }
}