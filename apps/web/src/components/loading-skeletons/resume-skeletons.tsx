export function ResumeChartsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="bg-muted/20 h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted/20 h-2 w-full animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
        <div className="bg-muted/20 h-64 w-full animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export function SkillsVisualizationSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-muted/20 h-32 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>

      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...Array(6)].map((_, j) => (
              <div
                key={j}
                className="bg-muted/20 h-20 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExperienceTimelineSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-muted/20 h-8 w-48 animate-pulse rounded" />
      <div className="space-y-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border-muted/20 relative border-l-2 pl-8">
            <div className="bg-muted/20 absolute top-0 -left-2 h-4 w-4 rounded-full" />
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="bg-muted/20 h-6 w-48 animate-pulse rounded" />
                  <div className="bg-muted/20 h-5 w-32 animate-pulse rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="bg-muted/20 h-4 w-24 animate-pulse rounded" />
                  <div className="bg-muted/20 h-4 w-20 animate-pulse rounded" />
                </div>
              </div>

              <div className="bg-muted/20 h-4 w-full animate-pulse rounded" />

              <div className="space-y-2">
                <div className="bg-muted/20 h-4 w-32 animate-pulse rounded" />
                <div className="space-y-1">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="bg-muted/20 h-3 w-5/6 animate-pulse rounded"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-muted/20 h-4 w-24 animate-pulse rounded" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(6)].map((_, j) => (
                    <div
                      key={j}
                      className="bg-muted/20 h-6 w-16 animate-pulse rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResumeHeaderSkeleton() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="bg-muted/20 mx-auto h-12 w-64 animate-pulse rounded" />
        <div className="bg-muted/20 mx-auto h-6 w-80 animate-pulse rounded" />
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="bg-muted/20 h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted/20 h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted/20 h-8 w-24 animate-pulse rounded" />
      </div>

      <div className="mx-auto max-w-2xl space-y-2">
        <div className="bg-muted/20 h-4 w-full animate-pulse rounded" />
        <div className="bg-muted/20 mx-auto h-4 w-5/6 animate-pulse rounded" />
        <div className="bg-muted/20 mx-auto h-4 w-4/5 animate-pulse rounded" />
      </div>
    </div>
  );
}
