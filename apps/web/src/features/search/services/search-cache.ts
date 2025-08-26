import type { SearchCache } from '../types';

class SearchCacheService {
  private cache: Map<string, SearchCache> = new Map();
  private maxCacheSize = 50;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(query: string, filters?: unknown): string {
    return JSON.stringify({
      query: query.toLowerCase().trim(),
      filters: filters || {},
    });
  }

  get(query: string, filters?: unknown): unknown | null {
    const key = this.getCacheKey(query, filters);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.results;
  }

  set(query: string, results: unknown, filters?: unknown, ttl?: number): void {
    const key = this.getCacheKey(query, filters);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      query,
      results,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidate entries matching the pattern
    const keysToDelete: string[] = [];
    for (const [key, value] of this.cache.entries()) {
      if (value.query.includes(pattern.toLowerCase())) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  preload(
    queries: string[],
    fetcher: (query: string) => Promise<unknown>
  ): void {
    // Preload common queries in the background
    queries.forEach(async (query) => {
      if (!this.get(query)) {
        try {
          const results = await fetcher(query);
          this.set(query, results);
        } catch {
          // Failed to preload query
        }
      }
    });
  }

  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    queries: string[];
  } {
    const queries = Array.from(this.cache.values()).map((c) => c.query);

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      queries,
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export const searchCache = new SearchCacheService();
