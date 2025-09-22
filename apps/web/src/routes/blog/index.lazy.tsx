import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import React from 'react';
import { BlogFeedItem } from '../../components/blog/blog-feed-item';
import { BlogCollectionNav } from '../../components/blog/blog-collection-nav';

export const Route = createLazyFileRoute('/blog/')({
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const [activeCollection, setActiveCollection] = React.useState<
    string | undefined
  >(undefined);
  const posts = useQuery(api.blog.list, {
    limit: 20,
    collection: activeCollection,
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-border/20 border-b">
        <div className="mx-auto max-w-[680px] px-4 py-16">
          <div>
            <h1 className="mb-4 text-5xl font-[200] tracking-wide">blog</h1>
            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
              thoughts, insights, and updates on web development, design, and
              technology
            </p>

            {/* Collection Navigation */}
            <BlogCollectionNav
              activeCollection={activeCollection}
              onCollectionChange={setActiveCollection}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[680px] px-4 py-12">
        {posts === undefined ? (
          <div className="py-12">
            <p className="text-muted-foreground">loading posts...</p>
          </div>
        ) : posts === null || posts.length === 0 ? (
          <div className="py-12">
            <h2 className="mb-4 text-2xl font-[200]">no posts yet</h2>
            <p className="text-muted-foreground">
              check back soon for new content
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post, index) => (
              <BlogFeedItem
                key={post._id}
                post={post}
                className={
                  index === posts.length - 1 ? 'mb-0 border-b-0 pb-0' : ''
                }
              />
            ))}
          </div>
        )}

        {posts && posts.length > 0 && (
          <div className="border-border/40 mt-12 border-t pt-8">
            <p className="text-muted-foreground text-sm">
              showing {posts.length} post{posts.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
