// Components

export { CommandPalette } from '@/components/command-palette';
export { SearchProvider } from './components/search-provider';

// Hooks
export { useSearch } from './hooks/use-search';
export { useSearchCache } from './hooks/use-search-cache';

// Services
export { searchCache } from './services/search-cache';

// Types
export type {
  BaseSearchResult,
  ParsedQuery,
  SearchCache,
  SearchContext,
  SearchFilters,
  SearchOptions,
  SearchResultType,
  SearchState,
} from './types';
