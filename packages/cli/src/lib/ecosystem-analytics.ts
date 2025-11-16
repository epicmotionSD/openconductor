import crypto from 'crypto';
import os from 'os';
import fs from 'fs';
import path from 'path';
import type {
  EcosystemEvent,
  EcosystemProduct,
  EcosystemEventType,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
  BatchEventsRequest
} from '@openconductor/shared';

/**
 * EcosystemAnalytics - Anonymous analytics tracking for cross-product discovery
 *
 * Features:
 * - Anonymous user identification (SHA-256 machine hash)
 * - Offline queue for failed requests
 * - Silent failures (never breaks CLI)
 * - Cross-product journey tracking
 * - Network effects measurement
 *
 * Privacy:
 * - No PII collected
 * - No API keys logged
 * - Anonymous machine ID hash
 * - Respects user privacy
 */
export class EcosystemAnalytics {
  private static instance: EcosystemAnalytics;
  private userHash: string;
  private sessionId: string;
  private config: AnalyticsConfig;
  private offlineQueue: EcosystemEvent[] = [];
  private configDir: string;
  private queuePath: string;

  private constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.userHash = this.generateUserHash();
    this.sessionId = crypto.randomUUID();
    this.configDir = path.join(os.homedir(), '.openconductor');
    this.queuePath = path.join(this.configDir, 'analytics-queue.json');

    // Ensure config directory exists
    this.ensureConfigDir();

    // Load any offline events
    this.loadOfflineQueue();
  }

  static getInstance(config?: Partial<AnalyticsConfig>): EcosystemAnalytics {
    if (!this.instance) {
      this.instance = new EcosystemAnalytics(config);
    }
    return this.instance;
  }

  /**
   * Generate consistent anonymous user hash based on machine characteristics
   * Uses SHA-256 to create a non-reversible identifier
   */
  private generateUserHash(): string {
    try {
      const cpus = os.cpus();
      const machineId = [
        os.hostname(),
        os.platform(),
        os.arch(),
        cpus.length > 0 ? cpus[0].model : 'unknown'
      ].join('-');

      return crypto.createHash('sha256').update(machineId).digest('hex');
    } catch (error) {
      // Fallback to random hash if machine info unavailable
      return crypto.createHash('sha256').update(crypto.randomUUID()).digest('hex');
    }
  }

  /**
   * Track MCP server installation
   */
  async trackInstall(serverSlug: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.track('install', {
      server_slug: serverSlug,
      platform: os.platform() as 'darwin' | 'linux' | 'win32',
      node_version: process.version,
      cli_version: '0.1.0',
      installation_method: 'cli',
      success: true,
      ...metadata
    });
  }

  /**
   * Track server discovery/search
   */
  async trackDiscovery(query: string, resultsCount: number, metadata: Record<string, any> = {}): Promise<void> {
    await this.track('discovery', {
      query,
      results_count: resultsCount,
      ...metadata
    });
  }

  /**
   * Track ecosystem product referral (cross-product discovery)
   */
  async trackEcosystemReferral(
    destination: 'flexabrain' | 'x3o' | 'flexasports',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.track('ecosystem_referral', {
      destination,
      source: 'openconductor-cli',
      ...metadata
    });
  }

  /**
   * Track general usage event
   */
  async trackUsage(action: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.track('usage', {
      action,
      ...metadata
    });
  }

  /**
   * Core tracking method
   */
  private async track(eventType: EcosystemEventType, metadata: Record<string, any>): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const event: EcosystemEvent = {
      event_id: crypto.randomUUID(),
      timestamp: new Date(),
      product: 'openconductor',
      event_type: eventType,
      user_hash: this.userHash,
      session_id: this.sessionId,
      metadata
    };

    try {
      // Dynamic import to avoid bundling issues
      const fetch = await this.getFetch();

      const response = await fetch(`${this.config.apiUrl}/v1/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ecosystem-Source': 'openconductor-cli',
          'X-CLI-Version': '0.1.0'
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (response.ok) {
        // Success! Try to sync any offline events
        await this.syncOfflineQueue();
      } else {
        // API error - queue for later
        this.queueOffline(event);
      }
    } catch (error) {
      // Network error, timeout, or other failure - queue for later
      this.queueOffline(event);
    }
  }

  /**
   * Queue event for offline sync
   */
  private queueOffline(event: EcosystemEvent): void {
    try {
      this.offlineQueue.push(event);

      // Keep queue size manageable (max 100 events)
      if (this.offlineQueue.length > 100) {
        this.offlineQueue = this.offlineQueue.slice(-100);
      }

      this.saveOfflineQueue();
    } catch (error) {
      // Silent fail - analytics shouldn't break the CLI
    }
  }

  /**
   * Load offline queue from disk
   */
  private loadOfflineQueue(): void {
    try {
      if (fs.existsSync(this.queuePath)) {
        const data = fs.readFileSync(this.queuePath, 'utf-8');
        const parsed = JSON.parse(data);

        // Convert string dates back to Date objects
        this.offlineQueue = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      // If queue is corrupted, start fresh
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to disk
   */
  private saveOfflineQueue(): void {
    try {
      fs.writeFileSync(this.queuePath, JSON.stringify(this.offlineQueue, null, 2));
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Sync offline queue to server
   */
  private async syncOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    try {
      const fetch = await this.getFetch();
      const batchRequest: BatchEventsRequest = {
        events: this.offlineQueue
      };

      const response = await fetch(`${this.config.apiUrl}/v1/analytics/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ecosystem-Source': 'openconductor-cli',
          'X-CLI-Version': '0.1.0'
        },
        body: JSON.stringify(batchRequest),
        signal: AbortSignal.timeout(5000) // Longer timeout for batch
      });

      if (response.ok) {
        // Clear queue on success
        this.offlineQueue = [];

        // Delete queue file
        if (fs.existsSync(this.queuePath)) {
          fs.unlinkSync(this.queuePath);
        }
      }
    } catch (error) {
      // Keep offline queue for next sync attempt
    }
  }

  /**
   * Ensure config directory exists
   */
  private ensureConfigDir(): void {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Get fetch implementation (works in Node.js 18+)
   */
  private async getFetch(): Promise<typeof fetch> {
    // Node.js 18+ has built-in fetch
    if (typeof fetch !== 'undefined') {
      return fetch;
    }

    // Fallback to node-fetch for older Node versions
    try {
      const nodeFetch = await import('node-fetch');
      return nodeFetch.default as any;
    } catch (error) {
      throw new Error('Fetch not available. Please use Node.js 18 or later.');
    }
  }

  /**
   * Get user hash (for debugging/testing)
   */
  getUserHash(): string {
    return this.userHash;
  }

  /**
   * Get session ID (for debugging/testing)
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get offline queue size (for debugging/testing)
   */
  getOfflineQueueSize(): number {
    return this.offlineQueue.length;
  }

  /**
   * Manually trigger offline sync (for testing)
   */
  async manualSync(): Promise<void> {
    await this.syncOfflineQueue();
  }

  /**
   * Clear offline queue (for testing)
   */
  clearOfflineQueue(): void {
    this.offlineQueue = [];
    if (fs.existsSync(this.queuePath)) {
      fs.unlinkSync(this.queuePath);
    }
  }
}

// Export singleton getter for easy use
export const getAnalytics = (): EcosystemAnalytics => {
  return EcosystemAnalytics.getInstance();
};
