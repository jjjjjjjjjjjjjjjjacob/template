export function ProjectSlideshowSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-muted/20 h-80 w-full animate-pulse rounded-lg" />
      <div className="space-y-2">
        <div className="bg-muted/20 h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted/20 h-3 w-1/2 animate-pulse rounded" />
      </div>
    </div>
  );
}

export function ProjectThumbnailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted/20 h-4 w-64 animate-pulse rounded" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border-border/50 space-y-3 rounded-lg border p-4"
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="bg-muted/20 h-5 w-32 animate-pulse rounded" />
                <div className="flex gap-3">
                  <div className="bg-muted/20 h-3 w-16 animate-pulse rounded" />
                  <div className="bg-muted/20 h-3 w-20 animate-pulse rounded" />
                </div>
              </div>
              <div className="bg-muted/20 h-4 w-4 animate-pulse rounded" />
            </div>

            <div className="space-y-1">
              <div className="bg-muted/20 h-3 w-full animate-pulse rounded" />
              <div className="bg-muted/20 h-3 w-5/6 animate-pulse rounded" />
            </div>

            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="bg-muted/20 h-6 w-12 animate-pulse rounded"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="mb-16 space-y-4">
      <div className="bg-muted/20 h-10 w-48 animate-pulse rounded" />
      <div className="bg-muted/20 h-5 w-80 animate-pulse rounded" />
    </div>
  );
}
