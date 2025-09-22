import * as React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@template/convex';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Image as ImageIcon, Expand } from 'lucide-react';
import { Id } from '@template/convex/dataModel';

interface BlogImageGalleryProps {
  images?: Id<'_storage'>[];
  className?: string;
}

export function BlogImageGallery({
  images = [],
  className,
}: BlogImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-[200]">images</h3>

      {/* Single image layout */}
      {images.length === 1 && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="group relative cursor-pointer">
              <ImageCard storageId={images[0]} className="w-full" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/10">
                <Button
                  variant="secondary"
                  size="sm"
                  className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <Expand className="mr-2 h-4 w-4" />
                  view full size
                </Button>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="w-full max-w-7xl">
            <DialogTitle className="sr-only">full size image view</DialogTitle>
            <DialogDescription className="sr-only">
              enlarged view of the image for better visibility
            </DialogDescription>
            <ImageCard storageId={images[0]} className="w-full" showFullSize />
          </DialogContent>
        </Dialog>
      )}

      {/* Grid layout for multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((storageId) => (
            <Dialog key={storageId}>
              <DialogTrigger asChild>
                <div className="group relative cursor-pointer">
                  <ImageCard storageId={storageId} className="aspect-video" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/10">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    >
                      <Expand className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="w-full max-w-7xl">
                <DialogTitle className="sr-only">
                  full size image view
                </DialogTitle>
                <DialogDescription className="sr-only">
                  enlarged view of the image for better visibility
                </DialogDescription>
                <ImageCard
                  storageId={storageId}
                  className="w-full"
                  showFullSize
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}

interface ImageCardProps {
  storageId: Id<'_storage'>;
  className?: string;
  showFullSize?: boolean;
}

function ImageCard({ storageId, className, showFullSize }: ImageCardProps) {
  const imageUrl = useQuery(api.blog.getImageUrl, { storageId });

  if (!imageUrl) {
    return (
      <div
        className={`bg-muted flex items-center justify-center rounded-lg ${className}`}
      >
        <div className="text-muted-foreground flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          <span className="text-sm">loading image...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <img
        src={imageUrl}
        alt=""
        className={`h-full w-full object-cover ${showFullSize ? 'max-h-[80vh] object-contain' : ''}`}
      />
    </div>
  );
}
