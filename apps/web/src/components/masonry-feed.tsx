import React from 'react';

interface MasonryFeedProps {
  items: Array<{ id: string; title?: string; [key: string]: unknown }>;
  isLoading?: boolean;
  _variant?: string;
  _showLoadMoreTarget?: boolean;
}

export function MasonryFeed({
  items,
  isLoading,
}: Omit<MasonryFeedProps, 'variant' | 'showLoadMoreTarget'>) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground text-center">
          Loading items...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-center">
        {items.length === 0 ? 'No items found' : `${items.length} items`}
      </div>
      {/* TODO: Implement masonry layout for items */}
    </div>
  );
}
