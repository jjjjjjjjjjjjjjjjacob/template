import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { api } from '@template/backend';
import { useQuery } from 'convex/react';
import { ArrowLeft, CalendarDays, Clock, Share, User } from 'lucide-react';
import React, { Suspense } from 'react';
import { SitePublicShell } from '@/components/site/public-shell';
import { BlogImageGallery } from '../../components/blog/blog-image-gallery';
import { BlogShareModal } from '../../components/blog/blog-share-modal';
import { ProjectLinks } from '../../components/blog/project-links';
import { Button } from '../../components/ui/button';
import { formatReadingTime } from '../../utils/blog-utils';

// Dynamic import for markdown components
const MarkdownRenderer = React.lazy(
  () => import('../../components/blog/markdown-renderer')
);

export const Route = createLazyFileRoute('/blog/$slug')({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = useQuery(api.blog.getBySlug, { slug });
  const loaderData = Route.useLoaderData();
  const [shareModalOpen, setShareModalOpen] = React.useState(false);

  // Use loader data for SSR, fallback to query for client-side updates
  const postData = post || loaderData?.post;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAuthorName = () => {
    if (postData?.authorEmail) {
      return postData.authorEmail.split('@')[0];
    }
    return 'admin';
  };

  const renderMarkdown = (markdown: string) => {
    return (
      <Suspense
        fallback={
          <div className="text-muted-foreground py-8 text-center">
            loading content...
          </div>
        }
      >
        <MarkdownRenderer content={markdown} />
      </Suspense>
    );
  };

  if (post === undefined && !loaderData?.post) {
    return (
      <SitePublicShell
        eyebrow="index — writing"
        title="Loading"
        description="Loading post..."
      >
        <p className="site-public-empty">loading post...</p>
      </SitePublicShell>
    );
  }

  if (!postData) {
    return (
      <SitePublicShell
        eyebrow="index — writing"
        title="Not Found"
        description="The post you're looking for does not exist or has been removed."
      >
        <div className="site-public-section">
          <h2>post not found</h2>
          <p>the post you're looking for doesn't exist or has been removed</p>
          <Link to="/blog" className="site-link">
            back to blog
          </Link>
        </div>
      </SitePublicShell>
    );
  }

  return (
    <SitePublicShell
      eyebrow="index — writing"
      title={postData.title}
      description={postData.excerpt}
    >
      <article className="site-blog-post">
        {/* Article Header */}
        <header className="site-blog-post-head">
          <Link to="/blog" className="site-link site-blog-back">
            <ArrowLeft aria-hidden="true" />
            all posts
          </Link>
          {/* Collection Badge */}
          {postData.collection && (
            <p className="site-public-meta">
              {postData.collection === 'general'
                ? 'thoughts'
                : postData.collection}
            </p>
          )}

          {/* Project Info for Project Posts */}
          {postData.collection === 'project' && postData.projectName && (
            <div className="site-public-section">
              <h3>about this project</h3>
              <p>
                project: <span>{postData.projectName}</span>
              </p>
              <ProjectLinks
                githubUrl={postData.githubUrl}
                liveUrl={postData.liveUrl}
                projectName={postData.projectName}
                size="md"
                showLabels={true}
              />
            </div>
          )}

          <div className="site-blog-post-tools">
            <div className="site-blog-post-facts">
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span className="font-[200]">{getAuthorName()}</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4" />
                <span>{formatDate(postData.createdAt)}</span>
              </div>
              {postData.readingTime && (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>{formatReadingTime(postData.readingTime)}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="site-blog-share"
            >
              <Share className="h-4 w-4" />
              <span className="hidden sm:inline">share</span>
            </Button>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
          <div
            className="article-content markdown-content font-[200]"
            style={{
              lineHeight: '1.8',
              fontSize: '1.125rem',
            }}
          >
            {renderMarkdown(postData.markdown)}
          </div>
        </div>

        {/* Blog Images */}
        {postData.images && postData.images.length > 0 && (
          <div className="mt-12">
            <BlogImageGallery images={postData.images} />
          </div>
        )}

        {/* Article Footer */}
        <footer className="site-public-section site-blog-post-footer">
          <div className="site-blog-post-tools">
            <p className="site-public-meta">
              last updated {formatDate(postData.updatedAt)}
            </p>
            <Link to="/blog" className="site-link">
              view all posts
            </Link>
          </div>
        </footer>
      </article>

      {/* Share Modal */}
      <BlogShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        post={{
          _id: postData._id,
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          authorEmail: postData.authorEmail,
          createdAt: postData.createdAt,
          thumbnailId: postData.thumbnailId,
          collection: postData.collection,
          projectName: postData.projectName,
        }}
      />
    </SitePublicShell>
  );
}
