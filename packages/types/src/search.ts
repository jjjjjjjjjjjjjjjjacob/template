/**
 * Search-related type definitions shared across the template platform
 */

// Search result types
export type SearchResultType =
  | 'item'
  | 'user'
  | 'tag'
  | 'action';

export interface BaseSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  image?: string;
  score?: number; // Relevance score
}

export interface ItemSearchResult extends BaseSearchResult {
  type: 'item';
  description: string;
  tags?: string[];
  category?: string;
  status?: string;
  createdBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface UserSearchResult extends BaseSearchResult {
  type: 'user';
  username: string;
  itemCount?: number;
  followerCount?: number;
}

export interface TagSearchResult extends BaseSearchResult {
  type: 'tag';
  count: number; // Number of items with this tag
}

export interface ActionSearchResult extends BaseSearchResult {
  type: 'action';
  action: string; // e.g., 'create-item', 'view-profile'
  icon?: string;
}


export type SearchResult =
  | ItemSearchResult
  | UserSearchResult
  | TagSearchResult
  | ActionSearchResult;

// Search filters
export interface SearchFilters {
  tags?: string[];
  category?: string;
  status?: string;
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  creators?: string[]; // User IDs
  sort?: SearchSortOption;
}

export type SearchSortOption =
  | 'relevance'
  | 'recent'
  | 'oldest'
  | 'name'
  | 'creation_date'
  | 'updated_date';

// Search request/response
export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  cursor?: string; // For pagination
  includeTypes?: SearchResultType[]; // Which types to include
}

export interface SearchResponse {
  items: ItemSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions: ActionSearchResult[];
  totalCount: number;
}

export interface SearchSuggestionsResponse {
  items: ItemSearchResult[];
  users: UserSearchResult[];
  tags: TagSearchResult[];
  actions?: ActionSearchResult[];
  recentSearches?: string[];
  trendingSearches?: string[];
  popularTags?: string[];
}

// Search suggestions (for command palette)
export interface SearchSuggestion {
  term: string;
  type: 'recent' | 'trending' | 'recommended';
  metadata?: {
    lastUsed?: string;
    useCount?: number;
    trendingRank?: number;
  };
}

// Search history
export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  timestamp: number;
  resultCount: number;
  clickedResults?: string[]; // IDs of results user clicked
}
