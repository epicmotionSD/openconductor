import { Pool, PoolClient, PoolConfig } from 'pg';
import { Redis } from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';
import winston from 'winston';

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Database configuration - Use Supabase if POSTGRES_URL is provided
const dbConfig: PoolConfig = process.env.POSTGRES_URL ? {
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
} : {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'openconductor',
  user: process.env.DB_USER || 'openconductor',
  password: process.env.DB_PASSWORD || 'password',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
};

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool;
  private redis: Redis;

  private constructor() {
    this.pool = new Pool(dbConfig);
    this.redis = new Redis(redisConfig);
    
    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventHandlers(): void {
    // PostgreSQL event handlers
    this.pool.on('connect', (client) => {
      logger.info('New PostgreSQL client connected');
    });

    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });

    // Redis event handlers
    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.redis.on('error', (err) => {
      logger.error('Redis connection error', err);
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready to accept commands');
    });

    // Graceful shutdown
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  public getPool(): Pool {
    return this.pool;
  }

  public getRedis(): Redis {
    return this.redis;
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn('Slow query detected', { 
          query: text.substring(0, 100), 
          duration,
          params: params?.slice(0, 5) 
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error', { 
        query: text.substring(0, 100), 
        params: params?.slice(0, 5), 
        error: error.message 
      });
      throw error;
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async migrate(): Promise<void> {
    logger.info('Starting database migration');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    try {
      await this.query(schema);
      logger.info('Database migration completed successfully');
    } catch (error) {
      logger.error('Database migration failed', error);
      throw error;
    }
  }

  public async seed(): Promise<void> {
    logger.info('Starting database seeding');
    
    // Check if data already exists
    const result = await this.query('SELECT COUNT(*) FROM mcp_servers');
    const count = parseInt(result.rows[0].count);
    
    if (count > 0) {
      logger.info(`Database already contains ${count} servers, skipping seed`);
      return;
    }

    // Import and run seeding logic
    const { seedDatabase } = await import('./seed');
    await seedDatabase(this);
    
    logger.info('Database seeding completed successfully');
  }

  public async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const results = {
      postgres: false,
      redis: false
    };

    try {
      await this.query('SELECT 1');
      results.postgres = true;
    } catch (error) {
      logger.error('PostgreSQL health check failed', error);
    }

    try {
      await this.redis.ping();
      results.redis = true;
    } catch (error) {
      logger.error('Redis health check failed', error);
    }

    return results;
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Shutting down database connections gracefully');
    
    try {
      await this.pool.end();
      logger.info('PostgreSQL pool closed');
    } catch (error) {
      logger.error('Error closing PostgreSQL pool', error);
    }

    try {
      this.redis.disconnect();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
    }

    process.exit(0);
  }
}

// Singleton instance
export const db = DatabaseManager.getInstance();

// Helper functions for backward compatibility and ease of use
export const query = (text: string, params?: any[]) => db.query(text, params);
export const getClient = () => db.getClient();
export const transaction = <T>(callback: (client: PoolClient) => Promise<T>) =>
  db.transaction(callback);

// Initialize database function for server startup
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    
    // Test connections
    const health = await db.healthCheck();
    
    if (!health.postgres) {
      throw new Error('Failed to connect to PostgreSQL');
    }
    
    if (!health.redis) {
      logger.warn('Redis connection failed, cache will not be available');
    }
    
    logger.info('Database connections initialized successfully', health);
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

// Cache helper functions
export class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = db.getRedis();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.warn('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.warn('Cache set error', { key, error: error.message });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.warn('Cache delete error', { key, error: error.message });
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      logger.warn('Cache flush error', error.message);
    }
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}

export const cache = new CacheManager();