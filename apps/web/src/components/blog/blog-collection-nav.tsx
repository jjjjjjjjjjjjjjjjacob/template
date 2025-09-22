import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useUser, useOrganization } from '@clerk/tanstack-react-start';

interface BlogCollectionNavProps {
  activeCollection?: string;
  onCollectionChange: (collection?: string) => void;
  className?: string;
}

export function BlogCollectionNav({
  activeCollection,
  onCollectionChange,
  className = '',
}: BlogCollectionNavProps) {
  const collections = useQuery(api.blog.getCollections);
  const { user } = useUser();
  const { organization, membership } = useOrganization();

  // Check admin status based on Clerk organization membership
  const isAdmin = React.useMemo(() => {
    if (!user) return false;

    // If user is in an organization, check their role
    if (organization && membership) {
      return membership.role === 'org:admin' || membership.role === 'org:owner';
    }

    // Fallback: if no organization setup, treat the user as admin
    // This allows for single-user blogs without requiring organization setup
    return true;
  }, [user, organization, membership]);

  if (!collections || collections.length === 0) {
    return null;
  }

  // Calculate total posts across all collections
  const totalPosts = collections.reduce((sum, col) => sum + col.count, 0);

  // Create "all" collection entry
  const allCollection = { name: 'all', count: totalPosts };

  // Sort collections: all first, then general, then alphabetically
  const sortedCollections = [
    allCollection,
    ...collections
      .filter((col) => col.name !== 'all') // Remove if somehow exists
      .sort((a, b) => {
        if (a.name === 'general') return -1;
        if (b.name === 'general') return 1;
        return a.name.localeCompare(b.name);
      }),
  ];

  const getDisplayName = (name: string) => {
    switch (name) {
      case 'general':
        return 'thoughts';
      case 'project':
        return 'projects';
      default:
        return name;
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <nav className="flex items-center gap-6">
        {sortedCollections.map((collection) => {
          const isActive =
            activeCollection === collection.name ||
            (!activeCollection && collection.name === 'all');

          return (
            <button
              key={collection.name}
              onClick={() =>
                onCollectionChange(
                  collection.name === 'all' ? undefined : collection.name
                )
              }
              className={`text-sm transition-colors ${
                isActive
                  ? 'text-foreground font-[200]'
                  : 'text-muted-foreground hover:text-foreground hover:font-[200]'
              }`}
            >
              {getDisplayName(collection.name)}
              <span className="text-muted-foreground ml-1.5 text-xs">
                ({collection.count})
              </span>
            </button>
          );
        })}
      </nav>

      {/* Create Post Button for Admins */}
      {isAdmin && (
        <Link to="/admin/blog/new">
          <Button size="sm" className="text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            create post
          </Button>
        </Link>
      )}
    </div>
  );
}
