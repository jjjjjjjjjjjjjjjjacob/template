import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';
import type { Id } from '@template/convex/dataModel';

interface BlogInlineImageProps {
  src: string;
  alt?: string;
  position?: 'left' | 'right' | 'center' | 'full-width';
  width?: string;
  caption?: string;
  className?: string;
}

export function BlogInlineImage({
  src,
  alt = '',
  position = 'center',
  width,
  caption,
  className,
}: BlogInlineImageProps) {
  // More robust storage ID detection - Convex storage IDs start with 'k' and are 32-40 characters
  const isStorageId =
    src.startsWith('k') &&
    src.length >= 32 &&
    src.length <= 40 &&
    !src.includes('://') &&
    /^k[a-z0-9]+$/i.test(src);
  const imageUrl = useQuery(
    api.blog.getImageUrl,
    isStorageId ? { storageId: src as Id<'_storage'> } : 'skip'
  );

  const finalUrl = isStorageId ? imageUrl : src;

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'float-left mr-6 mb-4 clear-left sm:max-w-[45%] max-w-full';
      case 'right':
        return 'float-right ml-6 mb-4 clear-right sm:max-w-[45%] max-w-full';
      case 'center':
        return 'mx-auto my-8 block max-w-full';
      case 'full-width':
        return 'w-full my-12 -mx-4 sm:-mx-6 lg:-mx-8';
      default:
        return 'mx-auto my-8 block max-w-full';
    }
  };

  const getContainerClasses = () => {
    if (position === 'full-width') {
      return 'full-width-image-container';
    }
    return '';
  };

  const getImageClasses = () => {
    const baseClasses = 'rounded-lg shadow-sm';

    if (position === 'full-width') {
      return cn(baseClasses, 'w-full h-auto');
    }

    return cn(baseClasses, 'max-w-full h-auto');
  };

  const imageStyle: React.CSSProperties = {};
  if (width && position !== 'full-width') {
    imageStyle.width = width;
  }

  if (!finalUrl && isStorageId) {
    return (
      <figure
        className={cn(getPositionClasses(), getContainerClasses(), className)}
      >
        <div
          className="bg-muted flex min-h-[200px] items-center justify-center rounded-lg"
          style={imageStyle}
        >
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">loading image...</span>
          </div>
        </div>
        {caption && (
          <figcaption className="text-muted-foreground mt-2 text-sm italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (!finalUrl) {
    return (
      <figure
        className={cn(getPositionClasses(), getContainerClasses(), className)}
      >
        <div
          className="bg-muted flex min-h-[200px] items-center justify-center rounded-lg"
          style={imageStyle}
        >
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">image not found</span>
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs opacity-60">src: {src}</span>
            )}
          </div>
        </div>
        {caption && (
          <figcaption className="text-muted-foreground mt-2 text-sm italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure
      className={cn(getPositionClasses(), getContainerClasses(), className)}
    >
      <img
        src={finalUrl}
        alt={alt}
        className={cn(getImageClasses())}
        style={imageStyle}
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-sm italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

interface MarkdownImageProps {
  src?: string;
  alt?: string;
  'data-position'?: string;
  'data-width'?: string;
  'data-caption'?: string;
  'data-inline-image'?: boolean;
}

export function MarkdownImage(props: MarkdownImageProps) {
  const {
    src = '',
    alt = '',
    'data-position': position,
    'data-width': width,
    'data-caption': caption,
    'data-inline-image': isInlineImage,
  } = props;

  // Detect storage IDs directly - Convex storage IDs start with 'k' and are 32-40 characters
  const isStorageId =
    src.startsWith('k') &&
    src.length >= 32 &&
    src.length <= 40 &&
    !src.includes('://') &&
    /^k[a-z0-9]+$/i.test(src);

  // Use BlogInlineImage for storage IDs or when explicitly marked as inline
  if (isStorageId || isInlineImage) {
    return (
      <BlogInlineImage
        src={src}
        alt={alt}
        position={position as 'left' | 'right' | 'center' | 'full-width'}
        width={width}
        caption={caption}
      />
    );
  }

  // Default handling for regular URLs
  return (
    <img
      src={src}
      alt={alt}
      className="mx-auto my-8 block h-auto max-w-full rounded-lg shadow-sm"
    />
  );
}
