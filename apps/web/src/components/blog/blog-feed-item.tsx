import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { CalendarDays, User, Clock } from 'lucide-react';
import { Id } from '@template/convex/dataModel';
import { formatReadingTime } from '../../utils/blog-utils';
import { ProjectLinks } from './project-links';

interface BlogFeedItemProps {
  post: {
    _id: Id<'blogPosts'>;
    title: string;
    slug: string;
    excerpt?: string;
    readingTime?: number;
    createdAt: number;
    updatedAt: number;
    authorId: string;
    authorEmail?: string;
    thumbnailId?: Id<'_storage'>;
    collection?: string;
    projectName?: string;
    githubUrl?: string;
    liveUrl?: string;
    projectTags?: string[];
  };
  className?: string;
}

export function BlogFeedItem({ post, className }: BlogFeedItemProps) {
  const thumbnailUrl = useQuery(
    api.blog.getImageUrl,
    post.thumbnailId ? { storageId: post.thumbnailId } : 'skip'
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAuthorName = () => {
    if (post.authorEmail) {
      return post.authorEmail.split('@')[0];
    }
    return 'admin';
  };

  const getCollectionDisplayName = (collection?: string) => {
    switch (collection) {
      case 'general':
        return 'thoughts';
      case 'project':
        return 'project';
      default:
        return collection || 'general';
    }
  };

  return (
    <article
      className={`group border-border/30 mb-12 border-b pb-10 ${className}`}
    >
      <Link
        to="/blog/$slug"
        params={{ slug: post.slug }}
        className="block hover:no-underline"
      >
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          {/* Thumbnail */}
          {post.thumbnailId && thumbnailUrl && (
            <div className="mb-4">
              <div className="bg-muted aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={thumbnailUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </div>
          )}

          {/* Author & Meta Info */}
          <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center">
              <User className="mr-1.5 h-3 w-3" />
              <span className="font-[200]">{getAuthorName()}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="mr-1.5 h-3 w-3" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            {post.readingTime && (
              <div className="flex items-center">
                <Clock className="mr-1.5 h-3 w-3" />
                <span>{formatReadingTime(post.readingTime)}</span>
              </div>
            )}
            {/* Collection Badge */}
            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-[200]">
              {getCollectionDisplayName(post.collection)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-foreground group-hover:text-primary mb-4 line-clamp-2 text-xl leading-snug font-[200] transition-colors duration-200">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Project Links */}
          {(post.githubUrl || post.liveUrl) && (
            <div className="mb-3">
              <ProjectLinks
                githubUrl={post.githubUrl}
                liveUrl={post.liveUrl}
                projectName={post.projectName}
                size="sm"
                showLabels={true}
              />
            </div>
          )}

          {/* Read More Link */}
          <div className="text-primary group-hover:text-primary/80 text-sm font-[200] transition-colors">
            read more →
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden gap-6 sm:flex">
          {/* Main Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Author & Date Only */}
            <div className="text-muted-foreground mb-3 flex items-center gap-3 text-sm">
              <div className="flex items-center">
                <User className="mr-1.5 h-3.5 w-3.5" />
                <span className="font-[200]">{getAuthorName()}</span>
              </div>
              <div className="flex items-center">
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-foreground group-hover:text-primary mb-3 line-clamp-2 text-xl leading-tight font-[200] transition-colors duration-200">
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Project Links */}
            {(post.githubUrl || post.liveUrl) && (
              <div className="mb-4">
                <ProjectLinks
                  githubUrl={post.githubUrl}
                  liveUrl={post.liveUrl}
                  projectName={post.projectName}
                  size="sm"
                  showLabels={true}
                />
              </div>
            )}

            {/* Spacer to push footer to bottom */}
            <div className="flex-1"></div>

            {/* Footer with Reading Time, Collection Tag, and Read More */}
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                {post.readingTime && (
                  <div className="flex items-center">
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    <span>{formatReadingTime(post.readingTime)}</span>
                  </div>
                )}
                <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-[200]">
                  {getCollectionDisplayName(post.collection)}
                </span>
              </div>
              <div className="text-primary group-hover:text-primary/80 text-sm font-[200] transition-colors">
                read more →
              </div>
            </div>
          </div>

          {/* Natural Height Thumbnail for Desktop */}
          {post.thumbnailId && thumbnailUrl && (
            <div className="flex-shrink-0">
              <div className="bg-muted aspect-[4/3] w-60 overflow-hidden rounded-lg lg:w-64">
                <img
                  src={thumbnailUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
