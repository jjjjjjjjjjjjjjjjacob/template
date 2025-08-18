// Components
export { SearchProvider } from './components/search-provider';
export { CommandPalette } from '@/components/command-palette';

// Hooks
export { useSearch } from './hooks/use-search';
export { useSearchCache } from './hooks/use-search-cache';

// Services
export { searchCache } from './services/search-cache';

// Types
export type {
  SearchCache,
  SearchFilters,
  SearchState,
  SearchOptions,
  ParsedQuery,
  SearchResultType,
  BaseSearchResult,
  SearchContext,
} from './types';
