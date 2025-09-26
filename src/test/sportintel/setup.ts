/**
 * SportIntel Test Setup
 * 
 * Configures Jest testing environment for SportIntel components
 * Extends OpenConductor test utilities with sports analytics specific setup
 */

import { config } from 'dotenv';
import { join } from 'path';
import { SportIntelConfigManager } from '../../config/sportintel/development-config';
import { Logger } from '../../utils/logger';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.sportintel') });

// Configure test environment
process.env.NODE_ENV = 'testing';
process.env.LOG_LEVEL = 'error';

// Global test configuration
const sportIntelConfig = SportIntelConfigManager.getInstance();

// Mock external services for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushdb: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock API providers
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Global test utilities
export class SportIntelTestUtils {
  private static testDatabase: any;
  private static testRedis: any;

  static async setupTestEnvironment(): Promise<void> {
    // Ensure test configuration is loaded
    sportIntelConfig.updateConfig('testing', {
      enableTestData: true,
      mockExternalAPIs: true,
      enableIntegrationTests: true,
    });

    // Initialize test logger
    Logger.getInstance().setLevel('error');
  }

  static async teardownTestEnvironment(): Promise<void> {
    // Clean up any resources
    if (this.testDatabase) {
      await this.testDatabase.end();
    }
    if (this.testRedis) {
      await this.testRedis.disconnect();
    }
  }

  static createMockPlayerData(overrides: Partial<any> = {}): any {
    return {
      id: 'player-123',
      name: 'Test Player',
      position: 'QB',
      team: 'TEST',
      salary: 8000,
      projectedPoints: 18.5,
      ownership: 15.2,
      weather: 'Clear',
      homeAway: 'home',
      opponent: 'OPP',
      vegas: {
        spread: -3.5,
        total: 47.5,
        implied: 25.25,
      },
      recent: {
        avgPoints: 17.2,
        consistency: 0.78,
        ceiling: 35.8,
        floor: 8.2,
      },
      ...overrides,
    };
  }

  static createMockGameData(overrides: Partial<any> = {}): any {
    return {
      id: 'game-456',
      homeTeam: 'HOME',
      awayTeam: 'AWAY',
      startTime: '2023-12-10T18:00:00Z',
      week: 14,
      season: 2023,
      weather: {
        temperature: 45,
        windSpeed: 8,
        precipitation: 0,
        conditions: 'Clear',
      },
      vegas: {
        spread: -3.5,
        total: 47.5,
        moneyline: { home: -165, away: 145 },
      },
      ...overrides,
    };
  }

  static createMockPredictionData(overrides: Partial<any> = {}): any {
    return {
      playerId: 'player-123',
      gameId: 'game-456',
      prediction: {
        points: 18.5,
        confidence: 0.78,
        ceiling: 28.2,
        floor: 11.8,
        explanation: {
          factors: [
            { factor: 'matchup', impact: 0.15, description: 'Favorable matchup vs weak defense' },
            { factor: 'recent_form', impact: 0.12, description: 'Strong recent performance' },
            { factor: 'vegas_implied', impact: 0.08, description: 'High team total' },
          ],
          shap_values: {
            salary: 0.05,
            recent_avg: 0.18,
            opponent_rank: -0.12,
            home_away: 0.03,
            weather: -0.02,
          },
        },
      },
      timestamp: '2023-12-10T12:00:00Z',
      model: 'xgboost_v2',
      version: '1.0.0',
      ...overrides,
    };
  }

  static createMockPortfolioData(overrides: Partial<any> = {}): any {
    return {
      id: 'portfolio-789',
      userId: 'user-123',
      name: 'Test Portfolio',
      bankroll: 10000,
      currentExposure: 2500,
      lineups: [
        {
          id: 'lineup-001',
          players: [
            this.createMockPlayerData({ position: 'QB', salary: 8000 }),
            this.createMockPlayerData({ position: 'RB', salary: 7500 }),
            this.createMockPlayerData({ position: 'RB', salary: 6000 }),
            this.createMockPlayerData({ position: 'WR', salary: 7000 }),
            this.createMockPlayerData({ position: 'WR', salary: 6500 }),
            this.createMockPlayerData({ position: 'WR', salary: 5500 }),
            this.createMockPlayerData({ position: 'TE', salary: 5000 }),
            this.createMockPlayerData({ position: 'DST', salary: 2500 }),
            this.createMockPlayerData({ position: 'K', salary: 2000 }),
          ],
          projectedPoints: 145.8,
          salary: 50000,
          ownership: 12.5,
          roi: 0.15,
        },
      ],
      performance: {
        totalWins: 45,
        totalEntries: 120,
        winRate: 0.375,
        avgRoi: 0.08,
        sharpnessRatio: 1.25,
      },
      ...overrides,
    };
  }

  static createMockAlertData(overrides: Partial<any> = {}): any {
    return {
      id: 'alert-999',
      type: 'player_news',
      severity: 'high',
      title: 'Player Injury Update',
      message: 'Test Player listed as questionable for Sunday',
      playerId: 'player-123',
      gameId: 'game-456',
      timestamp: '2023-12-10T10:30:00Z',
      read: false,
      actions: [
        { type: 'fade_player', label: 'Fade Player' },
        { type: 'pivot_exposure', label: 'Pivot Exposure' },
      ],
      ...overrides,
    };
  }

  static async waitFor(condition: () => boolean, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }

  static mockTimestamp(timestamp: string): jest.SpyInstance {
    return jest.spyOn(Date, 'now').mockReturnValue(new Date(timestamp).getTime());
  }

  static mockEnvironment(env: 'development' | 'testing' | 'production'): jest.SpyInstance {
    return jest.spyOn(process.env, 'NODE_ENV', 'get').mockReturnValue(env);
  }

  static createMockEventBusMessage(type: string, payload: any = {}): any {
    return {
      id: `msg-${Date.now()}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      source: 'test',
      metadata: {
        correlationId: `corr-${Date.now()}`,
        causationId: `cause-${Date.now()}`,
      },
    };
  }

  static createMockWebSocketMessage(type: string, data: any = {}): any {
    return {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: `ws-${Date.now()}`,
    };
  }

  static async flushPromises(): Promise<void> {
    await new Promise(resolve => setImmediate(resolve));
  }

  static expectToThrowAsync = async (fn: () => Promise<any>, expectedError?: string | RegExp): Promise<void> => {
    let error: Error | undefined;
    try {
      await fn();
    } catch (e) {
      error = e as Error;
    }
    
    if (!error) {
      throw new Error('Expected function to throw an error');
    }
    
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else {
        expect(error.message).toMatch(expectedError);
      }
    }
  };

  static mockApiResponse(data: any, status: number = 200): any {
    return {
      data,
      status,
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }

  static mockApiError(message: string, status: number = 500): any {
    const error = new Error(message) as any;
    error.response = {
      data: { error: message },
      status,
      statusText: 'Internal Server Error',
      headers: {},
      config: {},
    };
    return error;
  }

  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateRandomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

// Global setup and teardown
beforeAll(async () => {
  await SportIntelTestUtils.setupTestEnvironment();
});

afterAll(async () => {
  await SportIntelTestUtils.teardownTestEnvironment();
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Export configuration for use in tests
export const testConfig = sportIntelConfig;
export { SportIntelConfigManager };

// Global test timeout
jest.setTimeout(10000);

// Suppress console logs in tests unless explicitly needed
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

export default SportIntelTestUtils;