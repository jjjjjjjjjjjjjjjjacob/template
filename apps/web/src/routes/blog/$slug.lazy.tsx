import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import React, { Suspense } from 'react';
import { Button } from '../../components/ui/button';
import { BlogImageGallery } from '../../components/blog/blog-image-gallery';
import { ProjectLinks } from '../../components/blog/project-links';
import { ArrowLeft, CalendarDays, User, Clock, Share } from 'lucide-react';
import { formatReadingTime } from '../../utils/blog-utils';
import { BlogShareModal } from '../../components/blog/blog-share-modal';

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
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">loading post...</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <h1 className="mb-4 text-2xl font-[200]">post not found</h1>
          <p className="text-muted-foreground mb-6">
            the post you're looking for doesn't exist or has been removed
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              back to blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <div className="border-border/20 border-b">
        <div className="mx-auto max-w-[680px] px-4 py-4">
          <Link to="/blog">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              all posts
            </Button>
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-[680px] px-4 py-16">
        {/* Article Header */}
        <header className="mb-12">
          {/* Collection Badge */}
          {postData.collection && (
            <div className="mb-4">
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-[200]">
                {postData.collection === 'general'
                  ? 'thoughts'
                  : postData.collection}
              </span>
            </div>
          )}

          <h1 className="text-foreground mb-8 text-4xl leading-tight font-[200] tracking-wide sm:text-5xl sm:leading-tight">
            {postData.title}
          </h1>

          {/* Project Info for Project Posts */}
          {postData.collection === 'project' && postData.projectName && (
            <div className="border-border/40 mb-8 rounded-lg border p-6">
              <h3 className="text-foreground mb-3 text-lg font-[200]">
                about this project
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                project:{' '}
                <span className="font-[200]">{postData.projectName}</span>
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

          <div className="flex items-start justify-between gap-4">
            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
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
              className="flex items-center gap-2"
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
        <footer className="border-border/40 mt-16 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              last updated {formatDate(postData.updatedAt)}
            </div>
            <Link to="/blog">
              <Button variant="outline" size="sm">
                view all posts
              </Button>
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
    </div>
  );
}
