import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Id } from '@template/convex/dataModel';

interface BlogCardProps {
  post: {
    _id: Id<'blogPosts'>;
    title: string;
    slug: string;
    createdAt: number;
    updatedAt: number;
    authorId: string;
    thumbnailId?: Id<'_storage'>;
  };
  className?: string;
}

export function BlogCard({ post, className }: BlogCardProps) {
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

  return (
    <Link to="/blog/$slug" params={{ slug: post.slug }}>
      <Card
        className={`group h-full cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
      >
        {/* Thumbnail Image Section */}
        {post.thumbnailId && (
          <div className="relative aspect-video overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <ImageIcon className="text-muted-foreground h-12 w-12" />
              </div>
            )}

            {/* Gradient Overlay for Title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Title Overlay */}
            <div className="absolute right-0 bottom-0 left-0 p-4">
              <CardTitle className="group-hover:text-primary-foreground text-xl leading-tight text-white transition-colors duration-200">
                {post.title}
              </CardTitle>
            </div>
          </div>
        )}

        {/* Content Section */}
        <CardHeader className={post.thumbnailId ? 'pb-3' : undefined}>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-muted-foreground flex items-center text-sm">
              <CalendarDays className="mr-1 h-4 w-4" />
              {formatDate(post.createdAt)}
            </div>
            <ArrowRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 transition-all duration-200 group-hover:translate-x-1" />
          </div>

          {/* Title for posts without thumbnail */}
          {!post.thumbnailId && (
            <CardTitle className="group-hover:text-primary text-xl transition-colors duration-200">
              {post.title}
            </CardTitle>
          )}
        </CardHeader>

        {/* Additional content area for future use (excerpts, tags, etc.) */}
        {post.thumbnailId && (
          <CardContent className="pt-0">
            <div className="text-muted-foreground text-sm">
              {/* This could be used for excerpt or other metadata */}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
