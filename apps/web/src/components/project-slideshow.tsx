import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { trackEvents } from '@/lib/track-events';
import { cn } from '@/utils';

interface ProjectSlideshowProps {
  previews: string[];
  title: string;
  projectUrl?: string;
  className?: string;
  slideDirection?: 'left-to-right' | 'right-to-left';
  isMobile?: boolean;
}

function isPresentUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isVideoUrl(url: string): boolean {
  if (url.endsWith('#video')) return true;
  const videoExtensions = ['.mov', '.mp4', '.webm', '.ogg'];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}

function isImageUrl(url: string): boolean {
  if (url.endsWith('#image')) return true;
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.avif',
  ];
  return imageExtensions.some((ext) => url.toLowerCase().includes(ext));
}

function getCleanUrl(url: string): string {
  return url.replace(/#(video|image)$/, '');
}

function ProjectSlideshow({
  previews,
  title,
  projectUrl,
  className = '',
  slideDirection = 'left-to-right',
  isMobile = false,
}: ProjectSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogLoading, setDialogLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const validPreviews = previews.filter(isPresentUrl);

  if (validPreviews.length === 0) return null;

  const safeIndex = currentIndex % validPreviews.length;
  const currentPreview = validPreviews[safeIndex];
  const isVideo = isVideoUrl(currentPreview);
  const isImage = isImageUrl(currentPreview);
  const cleanUrl = getCleanUrl(currentPreview);
  const hasMultiplePreviews = validPreviews.length > 1;

  const goToNext = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev + 1) % validPreviews.length);
    trackEvents.projectSlideshowInteracted(title, 'next', safeIndex);
  };

  const goToPrev = () => {
    setIsLoading(true);
    setCurrentIndex(
      (prev) => (prev - 1 + validPreviews.length) % validPreviews.length
    );
    trackEvents.projectSlideshowInteracted(title, 'previous', safeIndex);
  };

  const handleMobileClick = () => {
    if (isMobile && !isVideo) {
      trackEvents.projectSlideshowInteracted(title, 'dialog_opened', safeIndex);
      setDialogLoading(true);
      setShowDialog(true);
    }
  };

  const handleHover = (isHovering: boolean) => {
    if (isHovering) {
      trackEvents.projectSlideshowInteracted(title, 'hover', safeIndex);
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleDialogLoad = () => {
    setDialogLoading(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        `drop-shadow-muted/10 relative min-h-96 overflow-hidden transition perspective-dramatic`,
        className
      )}
      style={{ overflowAnchor: 'none' }}
      role="region"
      tabIndex={-1}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden opacity-100 transform-3d',
          'transition-transform-smooth',
          isMobile && 'transform-none',
          !isMobile &&
            !isHovered &&
            slideDirection === 'left-to-right' &&
            'slideshow-left-default',
          !isMobile &&
            !isHovered &&
            slideDirection === 'right-to-left' &&
            'slideshow-right-default',
          !isMobile && isHovered && 'slideshow-hover'
        )}
      >
        {isLoading && <Skeleton className="absolute inset-0 rounded-2xl" />}

        {isVideo ? (
          <video
            src={cleanUrl}
            className={cn(
              'bg-background absolute inset-0 h-full w-full rounded-2xl object-cover shadow-2xl transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={handleLoad}
          />
        ) : isImage ? (
          <img
            src={cleanUrl}
            alt={`${title} preview - ${safeIndex + 1}`}
            loading="lazy"
            decoding="async"
            className={cn(
              'bg-background absolute inset-0 h-full w-full rounded-2xl object-cover shadow-2xl transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleLoad}
          />
        ) : (
          <iframe
            src={cleanUrl}
            className={cn(
              'bg-background absolute inset-0 h-full w-full overflow-y-hidden rounded-2xl border-0 shadow-2xl transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            title={`${title} preview - ${safeIndex + 1}`}
            loading="lazy"
            scrolling=""
            onLoad={handleLoad}
            onMouseEnter={() => {
              if (!isMobile) {
                trackEvents.projectSlideshowInteracted(
                  title,
                  'hover',
                  safeIndex
                );
              }
            }}
            style={{
              pointerEvents: isMobile ? 'none' : 'auto',
            }}
          />
        )}

        {isMobile && !isVideo && (
          <button
            onClick={handleMobileClick}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            aria-label={`Open ${title} preview in dialog`}
          />
        )}

        {hasMultiplePreviews && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrev();
              }}
              className="bg-background/80 hover:bg-background absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full p-2 shadow-lg transition-colors"
              aria-label="Previous preview"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              className="bg-background/80 hover:bg-background absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full p-2 shadow-lg transition-colors"
              aria-label="Next preview"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {validPreviews.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.currentTarget as HTMLButtonElement).blur();
                    if (idx !== safeIndex) {
                      setCurrentIndex(idx);
                    }
                  }}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all focus:outline-none',
                    idx === safeIndex
                      ? 'bg-foreground w-4'
                      : 'bg-foreground/40 hover:bg-foreground/60'
                  )}
                  aria-label={`Go to preview ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-h-[90vh] max-w-[95vw] p-0"
          showCloseButton={false}
        >
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-left">{title}</DialogTitle>
              {projectUrl && (
                <button
                  onClick={() => window.open(projectUrl, '_blank')}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  go to site
                </button>
              )}
            </div>
            <DialogDescription className="sr-only">
              interactive preview of {title} project in a dialog window
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[70vh] w-full px-4 pb-4">
            {dialogLoading && <Skeleton className="h-full w-full rounded-lg" />}

            {isVideo ? (
              <video
                src={cleanUrl}
                className={cn(
                  'bg-background h-full w-full rounded-lg object-contain shadow-lg transition-opacity duration-300',
                  dialogLoading ? 'opacity-0' : 'opacity-100'
                )}
                autoPlay
                loop
                muted
                playsInline
                controls
                onLoadedData={handleDialogLoad}
              />
            ) : isImage ? (
              <img
                src={cleanUrl}
                alt={`${title} preview - ${safeIndex + 1}`}
                className={cn(
                  'bg-background h-full w-full rounded-lg object-contain shadow-lg transition-opacity duration-300',
                  dialogLoading ? 'opacity-0' : 'opacity-100'
                )}
                onLoad={handleDialogLoad}
              />
            ) : (
              <iframe
                src={cleanUrl}
                className={cn(
                  'bg-background h-full w-full rounded-lg border shadow-lg transition-opacity duration-300',
                  dialogLoading ? 'opacity-0' : 'opacity-100'
                )}
                title={`${title} preview - ${safeIndex + 1}`}
                loading="lazy"
                onLoad={handleDialogLoad}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ProjectSlideshow };
export default ProjectSlideshow;
