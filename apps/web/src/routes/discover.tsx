// @ts-nocheck
import { createFileRoute, Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useItemsPaginated,
  useAllTags,
  useItemsByTag,
  useCurrentUser,
} from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

// Skeleton for lazy-loaded components
function ItemCategoryRowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="bg-background/90 w-64 flex-shrink-0 border-none shadow-lg backdrop-blur"
          >
            <div className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="mb-3 h-3 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Lazy load heavy category component
const ItemCategoryRow = lazy(() =>
  import('@/components/item-category-row').then((m) => ({
    default: m.ItemCategoryRow,
  }))
);

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

interface CategoryCollection {
  title: string;
  description: string;
  category: string;
  icon?: React.ReactNode;
}

const FEATURED_CATEGORIES: CategoryCollection[] = [
  {
    title: 'Popular',
    description: 'Most popular items',
    category: 'popular',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    title: 'Featured',
    description: 'Featured items',
    category: 'featured',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

function DiscoverPage() {
  const { data: currentUser } = useCurrentUser();
  const { setColorTheme, setSecondaryColorTheme } = useTheme();

  // Apply user's color themes when user data changes
  React.useEffect(() => {
    if (currentUser) {
      const primaryColor =
        currentUser.primaryColor || currentUser.themeColor || 'pink';
      const secondaryColor = currentUser.secondaryColor || 'orange';

      setColorTheme(`${primaryColor}-primary` as any);
      setSecondaryColorTheme(`${secondaryColor}-secondary` as any);
    }
  }, [currentUser, setColorTheme, setSecondaryColorTheme]);

  return (
    <div className="from-background via-background min-h-screen bg-gradient-to-br to-[hsl(var(--theme-primary))]/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="from-theme-primary to-theme-secondary mb-2 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent lowercase drop-shadow-md sm:text-4xl">
            discover items
          </h1>
          <p className="text-muted-foreground drop-shadow-sm">
            explore curated collections of items
          </p>
        </div>

        {/* Featured Categories Grid */}
        <section className="mb-12">
          <h2 className="from-theme-primary to-theme-secondary mb-6 bg-gradient-to-r bg-clip-text text-2xl font-semibold text-transparent lowercase">
            featured categories
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_CATEGORIES.map((category) => (
              <Link
                key={category.category}
                to="/search"
                search={{
                  category: category.category,
                  tab: 'items',
                }}
                className="transition-transform hover:scale-[1.02]"
              >
                <Card className="bg-background/90 h-full border-none shadow-lg backdrop-blur transition-all duration-300 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold lowercase">
                          {category.title}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                      </div>
                      {category.icon && (
                        <div className="text-muted-foreground">
                          {category.icon}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <ArrowRight className="text-muted-foreground h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Items Section */}
        <RecentItemsSection />

        {/* Popular Tags Section */}
        <PopularTagsSection />
      </div>
    </div>
  );
}

// Recent Items Section Component
function RecentItemsSection() {
  const { data: items, isLoading } = useItemsPaginated(12);

  if (isLoading) {
    return <ItemCategoryRowSkeleton />;
  }

  if (!items?.items || items.items.length === 0) {
    return null;
  }

  const recentItems = items.items.slice(0, 8);

  return (
    <Suspense fallback={<ItemCategoryRowSkeleton />}>
      <ItemCategoryRow
        title={
          <p>
            <span className="font-noto-color">✨</span> recent items
          </p>
        }
        items={recentItems}
      />
    </Suspense>
  );
}

// Popular Tags Section Component
function PopularTagsSection() {
  const { data: allTags, isLoading: tagsLoading } = useAllTags();

  if (tagsLoading) {
    return <ItemCategoryRowSkeleton />;
  }

  if (!allTags || allTags.length === 0) {
    return null;
  }

  // Get the most popular tag
  const popularTag = allTags[0];

  return <PopularTagItems tag={popularTag.tag} />;
}

// Component for items from popular tags
function PopularTagItems({ tag }: { tag: string }) {
  const { data: tagItems, isLoading } = useItemsByTag(tag, 10);

  if (isLoading) {
    return <ItemCategoryRowSkeleton />;
  }

  if (!tagItems || tagItems.length < 3) {
    return null;
  }

  const displayTitle = `#${tag}`;

  return (
    <Suspense fallback={<ItemCategoryRowSkeleton />}>
      <ItemCategoryRow
        title={displayTitle}
        items={tagItems}
      />
    </Suspense>
  );
}