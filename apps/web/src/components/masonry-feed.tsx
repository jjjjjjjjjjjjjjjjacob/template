import React from 'react';

interface MasonryFeedProps {
  items: any[];
  isLoading?: boolean;
  variant?: string;
  showLoadMoreTarget?: boolean;
}

export function MasonryFeed({
  items,
  isLoading,
  variant,
  showLoadMoreTarget,
}: MasonryFeedProps) {
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
