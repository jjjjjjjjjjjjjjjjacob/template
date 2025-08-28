import { cn } from '@/utils';
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

interface ProjectSlideshowProps {
  previews: string[];
  title: string;
  projectUrl?: string;
  className?: string;
  slideDirection?: 'left-to-right' | 'right-to-left';
  isMobile?: boolean;
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
  const containerRef = useRef<HTMLDivElement>(null);

  /*
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % previews.length);
  }, [previews.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + previews.length) % previews.length);
  }, [previews.length]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && previews.length > 1) {
      nextSlide();
    }
    if (isRightSwipe && previews.length > 1) {
      prevSlide();
    }
  };
  */

  const handleMobileIframeClick = () => {
    if (isMobile) {
      setShowDialog(true);
    }
  };

  if (previews.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        `drop-shadow-muted/10 relative min-h-96 overflow-hidden transition perspective-dramatic`,
        className
      )}
      role="region"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      // onTouchStart={onTouchStart}
      // onTouchMove={onTouchMove}
      // onTouchEnd={onTouchEnd}
    >
      <div
        className={cn(
          'relative h-full overflow-hidden opacity-100 transform-3d',
          'transition-transform-smooth',
          // Mobile state - no transforms
          isMobile && 'transform-none',
          // Desktop default states
          !isMobile &&
            !isHovered &&
            slideDirection === 'left-to-right' &&
            'slideshow-left-default',
          !isMobile &&
            !isHovered &&
            slideDirection === 'right-to-left' &&
            'slideshow-right-default',
          // Desktop hover state (should override default)
          !isMobile && isHovered && 'slideshow-hover'
        )}
      >
        <iframe
          src={previews[currentIndex]}
          className="bg-background h-full w-full overflow-y-hidden rounded-2xl border-0 shadow-2xl"
          title={`${title} preview - ${currentIndex + 1}`}
          loading="lazy"
          scrolling=""
          tabIndex={-1}
          style={{
            pointerEvents: isMobile ? 'none' : 'auto',
          }}
        />

        {/* Mobile overlay to catch clicks and prevent iframe interaction */}
        {isMobile && (
          <button
            onClick={handleMobileIframeClick}
            className="absolute inset-0 z-10 cursor-pointer bg-transparent"
            aria-label={`Open ${title} preview in dialog`}
          />
        )}
      </div>

      {previews.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {previews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white/80'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe indicators for mobile */}
      {isMobile && previews.length > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
          <div className="text-xs text-white/50">← swipe</div>
          <div className="text-xs text-white/50">swipe →</div>
        </div>
      )}

      {/* Mobile dialog for full iframe interaction */}
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
                  className="text-muted-foreground hover:text-foreground transition-colors-smooth flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  go to site
                </button>
              )}
            </div>
          </DialogHeader>
          <div className="h-[70vh] w-full px-4 pb-4">
            <iframe
              src={previews[currentIndex]}
              className="bg-background h-full w-full rounded-lg border shadow-lg"
              title={`${title} preview - ${currentIndex + 1}`}
              loading="lazy"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ProjectSlideshow };
export default ProjectSlideshow;
