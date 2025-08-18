// @ts-nocheck
import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import * as React from 'react';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load search components for code splitting
const SearchResultsGrid = lazy(() =>
  import('@/features/search/components').then((m) => ({
    default: m.SearchResultsGrid,
  }))
);
const SearchPagination = lazy(() =>
  import('@/features/search/components').then((m) => ({
    default: m.SearchPagination,
  }))
);

// Import non-heavy components normally
import { useSearchResults } from '@/features/search/hooks/use-search-results';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MobileFilterSheet } from '@/features/search/components/mobile-filter-sheet';
import { cn } from '@/utils/tailwind-utils';

// Loading skeletons for code-split components
function SearchResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <div className="p-4">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-3 h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function PaginationSkeleton() {
  return (
    <div className="mt-6 flex justify-center gap-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

const searchParamsSchema = z.object({
  q: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  sort: z
    .enum([
      'relevance',
      'recent',
      'oldest',
      'name',
      'creation_date',
      'updated_date',
    ])
    .optional()
    .default('relevance'),
  page: z.number().optional().default(1),
  tab: z
    .enum(['all', 'items', 'users', 'tags'])
    .optional()
    .default('all'),
});

export const Route = createFileRoute('/search')({
  validateSearch: searchParamsSchema,
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const {
    q,
    tags,
    category,
    status,
    sort,
    page,
    tab,
  } = Route.useSearch();

  const { data, isLoading, error } = useSearchResults({
    query: q || '',
    filters: {
      tags,
      category,
      status,
      sort,
    },
    page,
    tab,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">Search Results</h1>
        {q && (
          <p className="text-muted-foreground">
            Showing results for: <span className="font-medium">"{q}"</span>
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block">
          <SearchFilters />
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden">
          <MobileFilterSheet>
            <SearchFilters />
          </MobileFilterSheet>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {error && (
            <Card className="p-8 text-center">
              <p className="text-destructive">
                Error loading search results. Please try again.
              </p>
            </Card>
          )}

          {isLoading && <SearchResultsSkeleton />}

          {!isLoading && !error && (
            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResultsGrid data={data} />
            </Suspense>
          )}

          {!isLoading && !error && data && (
            <Suspense fallback={<PaginationSkeleton />}>
              <SearchPagination
                currentPage={page}
                totalPages={data.totalPages || 1}
                totalResults={data.totalResults || 0}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchFilters() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const updateFilters = (updates: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates, page: 1 }),
    });
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold">Filters</h3>

      <div className="space-y-6">
        {/* Search Query */}
        <div>
          <Label htmlFor="search-query">Search</Label>
          <Input
            id="search-query"
            type="text"
            value={search.q || ''}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Search items..."
          />
        </div>

        {/* Category Filter */}
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={search.category || ''}
            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="popular">Popular</option>
            <option value="featured">Featured</option>
            <option value="recent">Recent</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={search.status || ''}
            onChange={(e) => updateFilters({ status: e.target.value || undefined })}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <Label htmlFor="sort">Sort By</Label>
          <select
            id="sort"
            value={search.sort}
            onChange={(e) => updateFilters({ sort: e.target.value as any })}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="relevance">Relevance</option>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="creation_date">Creation Date</option>
            <option value="updated_date">Updated Date</option>
          </select>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={() => updateFilters({ q: undefined, category: undefined, status: undefined, sort: 'relevance' })}
          className="w-full"
        >
          Clear Filters
        </Button>
      </div>
    </Card>
  );
}