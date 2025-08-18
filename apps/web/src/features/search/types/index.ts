export interface SearchCache {
  query: string;
  results: any;
  timestamp: number;
  ttl: number;
}

export interface SearchFilters {
  tags?: string[];
  minRating?: number;
  maxRating?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  creators?: string[];
  sort?:
    | 'relevance'
    | 'rating_desc'
    | 'rating_asc'
    | 'top_rated'
    | 'most_rated'
    | 'recent'
    | 'oldest'
    | 'name'
    | 'creation_date'
    | 'interaction_time';
  emojiRatings?: {
    emojis?: string[];
    minValue?: number;
  };
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  isSearching: boolean;
  results: any | null;
  error: Error | null;
  history: string[];
  suggestions: any[];
  activeCategory: string | null;
}

export interface SearchOptions {
  debounceMs?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  trackHistory?: boolean;
  instantSearch?: boolean;
  minQueryLength?: number;
}

export interface ParsedQuery {
  terms: string[];
  exactPhrases: string[];
  excludedTerms: string[];
  tags: string[];
  filters: {
    user?: string;
    minRating?: number;
    maxRating?: number;
    dateAfter?: string;
    dateBefore?: string;
  };
}

export type SearchResultType = 'item' | 'user' | 'tag' | 'action' | 'review';

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  image?: string;
  score?: number;
}

export interface SearchContext {
  state: SearchState;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  setFilters: (filters: SearchFilters) => void;
  clearHistory: () => void;
  toggleCategory: (category: string) => void;
}
