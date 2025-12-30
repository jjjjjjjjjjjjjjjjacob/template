import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useBlogShareCanvas,
  type BlogLayoutOption,
} from '@/hooks/use-blog-share-canvas';
import { api } from '@template/convex';
import { useQuery } from 'convex/react';
import type { Id } from '@template/convex/dataModel';
import {
  Download,
  Copy,
  Image,
  Type,
  Maximize2,
  Loader2,
  Info,
  Check,
  Share,
} from 'lucide-react';

interface BlogShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    authorEmail?: string;
    createdAt: number;
    thumbnailId?: string;
    collection?: string;
    projectName?: string;
  };
}

type BlogLayout = 'square' | 'minimal' | 'featured';

const layoutOptions: BlogLayoutOption[] = [
  {
    value: 'square',
    label: 'square',
    description: 'clean & minimal',
    includeImage: false,
    includeExcerpt: true,
    includeAuthor: true,
    includeDate: true,
    aspectRatio: '1:1',
  },
  {
    value: 'minimal',
    label: 'minimal',
    description: 'text focused',
    includeImage: false,
    includeExcerpt: true,
    includeAuthor: true,
    includeDate: true,
    aspectRatio: '1:1',
  },
  {
    value: 'featured',
    label: 'featured',
    description: 'with image',
    includeImage: true,
    includeExcerpt: false,
    includeAuthor: true,
    includeDate: true,
    aspectRatio: '1:1',
  },
];

export function BlogShareModal({
  open,
  onOpenChange,
  post,
}: BlogShareModalProps) {
  const [previewUrls, setPreviewUrls] = useState<Map<BlogLayout, string>>(
    new Map()
  );
  const previewUrlsRef = useRef<Map<BlogLayout, string>>(new Map());
  const [selectedLayout, setSelectedLayout] = useState<BlogLayout>('square');
  const [showPreview, setShowPreview] = useState(false);
  const [allLayoutsReady, setAllLayoutsReady] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get thumbnail image URL if available
  const thumbnailUrl = useQuery(
    api.blog.getImageUrl,
    post.thumbnailId
      ? { storageId: post.thumbnailId as Id<'_storage'> }
      : 'skip'
  );

  const { isGenerating, generateCanvasImage, downloadImage } =
    useBlogShareCanvas({
      filename: `${post.slug}-social-share.png`,
    });

  const shareUrl = `${window.location.origin}/blog/${post.slug}`;
  const currentPreviewUrl = previewUrls.get(selectedLayout) || '';

  // Generate thumbnails immediately when modal opens
  useEffect(() => {
    if (open && !isGenerating && !allLayoutsReady && previewUrls.size === 0) {
      setAllLayoutsReady(false);
      setGenerationError(null);

      // Generate all layouts in parallel
      const generatePromises = layoutOptions.map(async (layout) => {
        try {
          const blob = await generateCanvasImage(
            post,
            shareUrl,
            layout.includeImage ? thumbnailUrl : null,
            layout
          );
          if (blob) {
            const url = URL.createObjectURL(blob);
            return { layout: layout.value, url };
          }
          return null;
        } catch {
          return null;
        }
      });

      Promise.all(generatePromises)
        .then((results) => {
          const newUrls = new Map<BlogLayout, string>();
          const successfulResults = results.filter(Boolean);

          if (successfulResults.length === 0) {
            setGenerationError(
              'Failed to generate preview images. Please try again.'
            );
            return;
          }

          results.forEach((result) => {
            if (result) {
              newUrls.set(result.layout, result.url);
            }
          });

          setPreviewUrls(newUrls);
          previewUrlsRef.current = newUrls;
          setAllLayoutsReady(true);
          setGenerationError(null);
        })
        .catch(() => {
          setGenerationError(
            'Failed to generate preview images. Please try again.'
          );
        });
    }

    // Clean up when modal closes
    if (!open && previewUrls.size > 0) {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls(new Map());
      previewUrlsRef.current = new Map();
      setAllLayoutsReady(false);
      setGenerationError(null);
      setRetryCount(0);
    }
  }, [
    open,
    post,
    shareUrl,
    thumbnailUrl,
    generateCanvasImage,
    isGenerating,
    allLayoutsReady,
    previewUrls.size,
    retryCount,
  ]);

  const handleDownload = async () => {
    if (currentPreviewUrl) {
      // Get the selected layout and regenerate the blob for download
      const selectedLayoutOption = layoutOptions.find(
        (opt) => opt.value === selectedLayout
      );
      if (selectedLayoutOption) {
        const blob = await generateCanvasImage(
          post,
          shareUrl,
          selectedLayoutOption.includeImage ? thumbnailUrl : null,
          selectedLayoutOption
        );
        if (blob) {
          downloadImage(blob);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Failed to copy link
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || 'Check out this blog post',
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Failed to share
        }
      }
    }
  };

  const supportsNativeShare =
    typeof navigator !== 'undefined' && navigator.share;

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      setPreviewUrls(new Map());
      setAllLayoutsReady(false);
      setGenerationError(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[90vh] w-[96vw] max-w-3xl overflow-y-auto p-3 sm:w-full sm:p-6"
          shouldScaleBackground
          scaleFactor={0.8}
          scaleOffset="10px"
        >
          <DialogHeader>
            <DialogTitle>share blog post</DialogTitle>
            <DialogDescription>
              create a social media image for sharing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Layout Selection */}
            <div className="relative">
              <Tabs
                defaultValue={selectedLayout}
                onValueChange={(value) =>
                  setSelectedLayout(value as BlogLayout)
                }
                className="h-[350px] sm:h-[500px]"
              >
                <TabsList className="mb-3 grid h-auto w-full grid-cols-3 sm:mb-4">
                  {layoutOptions.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="flex flex-col items-center gap-1 px-2 py-3 text-xs sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
                    >
                      {option.value === 'featured' ? (
                        <Image className="h-4 w-4 sm:h-4 sm:w-4" />
                      ) : option.value === 'square' ? (
                        <Maximize2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      ) : (
                        <Type className="h-4 w-4 sm:h-4 sm:w-4" />
                      )}
                      <span className="block sm:inline">{option.label}</span>
                      <span className="block text-[10px] opacity-60 sm:hidden">
                        {option.description}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="relative flex flex-col">
                  <div className="bg-muted/10 relative w-full overflow-hidden rounded-lg border">
                    {layoutOptions.map((option) => (
                      <TabsContent
                        key={option.value}
                        value={option.value}
                        className="mt-0 p-2 sm:p-4"
                      >
                        {previewUrls.get(option.value) ? (
                          <div className="flex justify-center">
                            <img
                              src={previewUrls.get(option.value)}
                              alt={`${option.label} layout preview`}
                              className="h-auto max-h-[250px] w-auto cursor-pointer rounded-lg shadow-sm select-none sm:max-h-[400px]"
                              onClick={() => setShowPreview(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setShowPreview(true);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              draggable={false}
                            />
                          </div>
                        ) : generationError ? (
                          <div className="flex h-[250px] w-full flex-col items-center justify-center gap-3 select-none sm:h-[400px] sm:gap-4">
                            <div className="text-destructive flex flex-col items-center gap-2">
                              <Info className="h-5 w-5 sm:h-8 sm:w-8" />
                              <span className="text-center text-xs sm:text-base">
                                {generationError}
                              </span>
                              {retryCount < 3 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleRetry}
                                  className="mt-2"
                                >
                                  retry ({3 - retryCount} attempts left)
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-[250px] w-full flex-col items-center justify-center gap-3 select-none sm:h-[400px] sm:gap-4">
                            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin sm:h-8 sm:w-8" />
                            <span className="text-muted-foreground text-center text-xs select-none sm:text-base">
                              generating {option.label} layout...
                            </span>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </div>

                  {currentPreviewUrl && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="bg-background/90 border-border hover:bg-background absolute top-2 right-2 z-10 rounded-md border p-1 backdrop-blur-sm transition-colors sm:top-4 sm:right-4 sm:rounded-lg sm:p-1.5"
                      aria-label="maximize preview"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </Tabs>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                onClick={handleDownload}
                disabled={!currentPreviewUrl || isGenerating}
                className="h-11 flex-1 sm:h-10"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="text-sm sm:text-base">download image</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="h-11 flex-1 sm:h-10"
              >
                {copySuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    <span className="text-sm sm:text-base">copy link</span>
                  </>
                )}
              </Button>

              {supportsNativeShare && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="h-11 flex-1 sm:h-10"
                >
                  <Share className="mr-2 h-4 w-4" />
                  <span className="text-sm sm:text-base">share</span>
                </Button>
              )}
            </div>

            {/* Post Info */}
            <Alert className="hidden sm:block">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="space-y-1">
                  <div>
                    <strong>title:</strong> {post.title}
                  </div>
                  {post.excerpt && (
                    <div>
                      <strong>excerpt:</strong> {post.excerpt}
                    </div>
                  )}
                  <div>
                    <strong>link:</strong> {shareUrl}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Compact Post Info for Mobile */}
            <div className="block sm:hidden">
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="text-foreground truncate font-[200]">
                  {post.title}
                </div>
                {post.excerpt && (
                  <div className="line-clamp-2 text-xs">{post.excerpt}</div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[95vh] max-w-4xl p-3 sm:p-6">
          <DialogHeader className="pb-2 sm:pb-4">
            <DialogTitle className="line-clamp-1 text-base sm:text-lg">
              {post.title} - {selectedLayout} layout
            </DialogTitle>
            <DialogDescription className="sr-only">
              full size preview of the {selectedLayout} layout for {post.title}
            </DialogDescription>
          </DialogHeader>

          {currentPreviewUrl && (
            <div className="flex justify-center">
              <img
                src={currentPreviewUrl}
                alt="Full preview"
                className="max-h-[75vh] w-auto rounded-lg shadow-lg sm:max-h-[70vh]"
                draggable={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
