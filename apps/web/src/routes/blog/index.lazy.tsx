import { createLazyFileRoute } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import React from 'react';
import { SitePublicShell } from '@/components/site/public-shell';
import { BlogCollectionNav } from '../../components/blog/blog-collection-nav';
import { BlogFeedItem } from '../../components/blog/blog-feed-item';

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
    <SitePublicShell
      eyebrow="index — writing"
      title="Blog"
      description="Thoughts, notes, and project writing on web development, design, and technology."
    >
      <div className="site-blog-index">
        <BlogCollectionNav
          activeCollection={activeCollection}
          onCollectionChange={setActiveCollection}
          className="site-blog-collections"
        />

        {posts === undefined ? (
          <p className="site-public-empty">loading posts...</p>
        ) : posts === null || posts.length === 0 ? (
          <div className="site-public-section">
            <h2>no posts yet</h2>
            <p>check back soon for new content</p>
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
          <div className="site-public-section">
            <p className="site-public-meta">
              showing {posts.length} post{posts.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    </SitePublicShell>
  );
}
