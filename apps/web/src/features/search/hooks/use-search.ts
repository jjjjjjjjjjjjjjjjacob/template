// This file contains search functionality and may need type fixes
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from '@template/convex';
import { searchCache } from '../services/search-cache';
import type { SearchFilters, SearchOptions, SearchState } from '../types';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const DEFAULT_OPTIONS: SearchOptions = {
  debounceMs: 300,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000,
  trackHistory: true,
  instantSearch: true,
  minQueryLength: 2,
};

export function useSearch(options: SearchOptions = {}) {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<SearchState>({
    query: '',
    filters: {},
    isSearching: false,
    results: null,
    error: null,
    history: [],
    suggestions: null,
    activeCategory: null,
  });

  const debouncedQuery = useDebouncedValue(state.query, opts.debounceMs);
  const trackSearchMutation = useConvexMutation(api.search.trackSearch);

  // Main search query
  const searchQuery = useQuery({
    ...convexQuery(api.search.searchAll, {
      query: debouncedQuery,
      filters: state.filters,
      limit: 20,
      page: 1,
      includeTypes: state.activeCategory ? [state.activeCategory] : undefined,
    }),
    enabled:
      opts.instantSearch && debouncedQuery.length >= (opts.minQueryLength || 0),
    staleTime: opts.cacheTTL,
    gcTime: opts.cacheTTL,
  });

  // Suggestions query
  const suggestionsQuery = useQuery({
    ...convexQuery(api.search.getSearchSuggestions, {
      query: state.query,
      limit: 10,
    }),
    enabled: state.query.length > 0,
    staleTime: 30000,
  });

  // Update state when search completes
  useEffect(() => {
    if (searchQuery.data) {
      setState((prev) => ({
        ...prev,
        results: searchQuery.data,
        isSearching: false,
        error: null,
      }));

      // Track search if enabled
      if (opts.trackHistory && debouncedQuery) {
        const totalResults =
          (searchQuery.data.items?.length || 0) +
          (searchQuery.data.users?.length || 0) +
          (searchQuery.data.tags?.length || 0) +
          (searchQuery.data.actions?.length || 0) +
          (searchQuery.data.reviews?.length || 0);

        trackSearchMutation({
          query: debouncedQuery,
          resultCount: totalResults,
        });
      }
    }
  }, [
    searchQuery.data,
    debouncedQuery,
    opts.trackHistory,
    trackSearchMutation,
  ]);

  // Update suggestions
  useEffect(() => {
    if (suggestionsQuery.data) {
      setState((prev) => ({
        ...prev,
        suggestions: suggestionsQuery.data,
      }));
    }
  }, [suggestionsQuery.data]);

  // Handle search errors
  useEffect(() => {
    if (searchQuery.error) {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error: searchQuery.error as Error,
      }));
    }
  }, [searchQuery.error]);

  // Search function
  const search = useCallback(
    async (query: string, filters?: SearchFilters) => {
      // Cancel any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Check minimum query length
      if (query.length < (opts.minQueryLength || 0) && !filters) {
        setState((prev) => ({
          ...prev,
          query: '',
          results: null,
          error: null,
        }));
        return;
      }

      // Check cache first if enabled
      if (opts.cacheEnabled) {
        const cached = searchCache.get(query, filters);
        if (cached) {
          setState((prev) => ({
            ...prev,
            query,
            filters: filters || {},
            results: cached as import('@template/types').SearchResponse,
            isSearching: false,
            error: null,
          }));
          return;
        }
      }

      // Update state to trigger search
      setState((prev) => ({
        ...prev,
        query,
        filters: filters || {},
        isSearching: true,
        error: null,
      }));

      // Add to history
      if (opts.trackHistory && query && !state.history.includes(query)) {
        setState((prev) => ({
          ...prev,
          history: [query, ...prev.history.slice(0, 9)],
        }));
      }
    },
    [opts, state.history]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      query: '',
      results: null,
      suggestions: null,
      error: null,
      isSearching: false,
    }));
  }, []);

  // Set filters
  const setFilters = useCallback(
    (filters: SearchFilters) => {
      setState((prev) => ({
        ...prev,
        filters,
      }));

      // Re-run search with new filters if query exists
      if (state.query) {
        search(state.query, filters);
      }
    },
    [state.query, search]
  );

  // Clear history
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  // Toggle category filter
  const toggleCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      activeCategory: prev.activeCategory === category ? null : category,
    }));
  }, []);

  // Set query without searching (for controlled input)
  const setQuery = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      query,
    }));
  }, []);

  return {
    // State
    query: state.query,
    results: state.results,
    isSearching: state.isSearching || searchQuery.isLoading,
    error: state.error,
    filters: state.filters,
    history: state.history,
    suggestions: state.suggestions,
    activeCategory: state.activeCategory,

    // Actions
    search,
    setQuery,
    clearSearch,
    setFilters,
    clearHistory,
    toggleCategory,

    // Query states
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    refetch: searchQuery.refetch,
  };
}
