/**
 * Simple in-memory cache to handle API rate limits
 * No external dependencies required
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get value from cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired, remove from cache
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with optional custom TTL
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache instance
export const cache = new SimpleCache(300); // 5 minute default TTL
