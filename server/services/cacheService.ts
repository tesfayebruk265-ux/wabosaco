/**
 * Wabi SACCO - Centralized Enterprise Cache Layer
 * Supports Memory LRU Cache + Redis Adapter Interface, Tagged Invalidation, TTL Policies, and Cache Warming.
 */

import { logger } from './loggerService';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  tags: string[];
  expiresAt: number; // unix timestamp in ms
  createdAt: number;
  hitCount: number;
  sizeBytes: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  keysCount: number;
  tagsCount: number;
  memoryEstimatedBytes: number;
  evictions: number;
  invalidations: number;
  uptimeSeconds: number;
}

export interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
}

export class CacheService {
  private static instance: CacheService;
  private store: Map<string, CacheEntry> = new Map();
  private tagMap: Map<string, Set<string>> = new Map(); // tag -> Set of keys
  private maxEntries: number = 10000;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private invalidations: number = 0;
  private startTime: number = Date.now();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRedisEnabled: boolean = false;

  private constructor() {
    // Schedule periodic sweep every 30 seconds for expired keys
    this.cleanupInterval = setInterval(() => {
      this.sweepExpired();
    }, 30000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Retrieve a value from the cache
   */
  public get<T = any>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.del(key);
      this.misses++;
      return null;
    }

    entry.hitCount++;
    this.hits++;
    return entry.value as T;
  }

  /**
   * Set a value in the cache with TTL and optional tagging
   */
  public set<T = any>(key: string, value: T, options?: CacheOptions): void {
    const ttlSeconds = options?.ttlSeconds ?? 300; // default 5 mins
    const tags = options?.tags || [];
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Check capacity limit and perform LRU eviction if full
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLRU();
    }

    // Estimate size
    let sizeBytes = 128;
    try {
      sizeBytes = Buffer.byteLength(JSON.stringify(value) || '', 'utf8');
    } catch {
      sizeBytes = 256;
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      tags,
      expiresAt,
      createdAt: Date.now(),
      hitCount: 0,
      sizeBytes,
    };

    // If key already had tags, unregister old tag associations
    if (this.store.has(key)) {
      const oldEntry = this.store.get(key)!;
      oldEntry.tags.forEach((tag) => {
        const set = this.tagMap.get(tag);
        if (set) {
          set.delete(key);
          if (set.size === 0) this.tagMap.delete(tag);
        }
      });
    }

    this.store.set(key, entry);

    // Register tag mappings
    tags.forEach((tag) => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    });
  }

  /**
   * Get or compute pattern (Cache-Aside)
   */
  public async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, options);
    return value;
  }

  /**
   * Delete a single key
   */
  public del(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    entry.tags.forEach((tag) => {
      const set = this.tagMap.get(tag);
      if (set) {
        set.delete(key);
        if (set.size === 0) this.tagMap.delete(tag);
      }
    });

    this.store.delete(key);
    this.invalidations++;
    return true;
  }

  /**
   * Invalidate all keys matching a specific tag
   */
  public invalidateTag(tag: string): number {
    const keys = this.tagMap.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    const keysArray = Array.from(keys);
    keysArray.forEach((k) => {
      if (this.del(k)) {
        count++;
      }
    });

    this.tagMap.delete(tag);
    logger.info('Cache tag invalidated', { module: 'CACHE', tag, keysCleared: count });
    return count;
  }

  /**
   * Invalidate multiple tags at once
   */
  public invalidateTags(tags: string[]): number {
    let total = 0;
    tags.forEach((t) => {
      total += this.invalidateTag(t);
    });
    return total;
  }

  /**
   * Invalidate keys starting with a prefix
   */
  public invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.del(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.store.clear();
    this.tagMap.clear();
    this.invalidations++;
  }

  /**
   * Evict lowest hitCount / oldest entry (LRU hybrid)
   */
  private evictLRU(): void {
    let candidateKey: string | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.store.entries()) {
      // Score = hitCount * 1000 + (now - createdAt)
      const score = entry.hitCount * 1000 + (Date.now() - entry.createdAt) / 1000;
      if (score < minScore) {
        minScore = score;
        candidateKey = key;
      }
    }

    if (candidateKey) {
      this.del(candidateKey);
      this.evictions++;
    }
  }

  /**
   * Sweep all expired keys
   */
  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.del(key);
      }
    }
  }

  /**
   * Get operational cache metrics and health
   */
  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRatio = totalRequests > 0 ? parseFloat(((this.hits / totalRequests) * 100).toFixed(2)) : 0;

    let estimatedBytes = 0;
    for (const entry of this.store.values()) {
      estimatedBytes += entry.sizeBytes;
    }

    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio,
      keysCount: this.store.size,
      tagsCount: this.tagMap.size,
      memoryEstimatedBytes: estimatedBytes,
      evictions: this.evictions,
      invalidations: this.invalidations,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Cache warming: preload critical lookup tables, settings, products & KPIs
   */
  public async warmUp(db: any): Promise<{ warmedKeys: string[]; durationMs: number }> {
    const start = Date.now();
    const warmedKeys: string[] = [];

    try {
      // 1. Chart of Accounts
      const coa = db.getChartOfAccounts ? db.getChartOfAccounts() : [];
      this.set('db:lookup:chart_of_accounts', coa, { ttlSeconds: 3600, tags: ['coa', 'lookup'] });
      warmedKeys.push('db:lookup:chart_of_accounts');

      // 2. Saving Products
      const savingProducts = db.getSavingProducts ? db.getSavingProducts() : [];
      this.set('db:lookup:saving_products', savingProducts, { ttlSeconds: 3600, tags: ['products', 'savings'] });
      warmedKeys.push('db:lookup:saving_products');

      // 3. Loan Products
      const loanProducts = db.getLoanProducts ? db.getLoanProducts() : [];
      this.set('db:lookup:loan_products', loanProducts, { ttlSeconds: 3600, tags: ['products', 'loans'] });
      warmedKeys.push('db:lookup:loan_products');

      // 4. Feature Flags
      const featureFlags = db.getFeatureFlags ? db.getFeatureFlags() : [];
      this.set('db:config:feature_flags', featureFlags, { ttlSeconds: 1800, tags: ['settings', 'flags'] });
      warmedKeys.push('db:config:feature_flags');

      // 5. Organization Profile
      const orgProfile = db.getOrganizationProfile ? db.getOrganizationProfile() : {};
      this.set('db:config:org_profile', orgProfile, { ttlSeconds: 3600, tags: ['settings', 'organization'] });
      warmedKeys.push('db:config:org_profile');

      // 6. Working Calendar & Holidays
      const calendar = db.getWorkingCalendar ? db.getWorkingCalendar() : {};
      const holidays = db.getPublicHolidays ? db.getPublicHolidays() : [];
      this.set('db:config:working_calendar', calendar, { ttlSeconds: 3600, tags: ['settings', 'calendar'] });
      this.set('db:config:public_holidays', holidays, { ttlSeconds: 3600, tags: ['settings', 'calendar'] });
      warmedKeys.push('db:config:working_calendar', 'db:config:public_holidays');

      const durationMs = Date.now() - start;
      logger.info('Cache warm-up completed successfully', {
        module: 'CACHE',
        durationMs,
        keysCount: warmedKeys.length,
      });

      return { warmedKeys, durationMs };
    } catch (err: any) {
      logger.error('Cache warm-up error', { module: 'CACHE', error: err.message });
      return { warmedKeys, durationMs: Date.now() - start };
    }
  }
}

export const cache = CacheService.getInstance();
