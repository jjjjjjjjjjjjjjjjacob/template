import { useCallback, useEffect } from 'react';
import { searchCache } from '../services/search-cache';

export function useSearchCache() {
  // Clear cache on unmount
  useEffect(() => {
    return () => {
      // Optionally clear cache when component unmounts
      // searchCache.clear();
    };
  }, []);

  const getCached = useCallback((query: string, filters?: any) => {
    return searchCache.get(query, filters);
  }, []);

  const setCached = useCallback(
    (query: string, results: any, filters?: any, ttl?: number) => {
      searchCache.set(query, results, filters, ttl);
    },
    []
  );

  const invalidateCache = useCallback((pattern?: string) => {
    searchCache.invalidate(pattern);
  }, []);

  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);

  const preloadQueries = useCallback(
    (queries: string[], fetcher: (query: string) => Promise<any>) => {
      searchCache.preload(queries, fetcher);
    },
    []
  );

  const getCacheStats = useCallback(() => {
    return searchCache.getCacheStats();
  }, []);

  return {
    getCached,
    setCached,
    invalidateCache,
    clearCache,
    preloadQueries,
    getCacheStats,
  };
}
