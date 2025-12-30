import { useState, useEffect } from 'react';
import {
  usePerformanceMetrics,
  formatMetricValue,
  getMetricRating,
} from '@/lib/performance-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface NavigationTimingData {
  dns_lookup: number;
  tcp_connect: number;
  request_response: number;
  dom_processing: number;
  total_load_time: number;
}

interface ResourceTimingData {
  total_resources: number;
  js_resources: number;
  css_resources: number;
  image_resources: number;
  font_resources: number;
  largest_resource: number;
  total_transfer_size: number;
}

export function PerformanceDashboard() {
  const { metrics, score, isComplete, budget } = usePerformanceMetrics();
  const [navigationTiming, setNavigationTiming] =
    useState<NavigationTimingData | null>(null);
  const [resourceTiming, setResourceTiming] =
    useState<ResourceTimingData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment || typeof window === 'undefined') return;

    // Get navigation timing data
    const getNavigationData = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          setNavigationTiming({
            dns_lookup:
              navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp_connect: navigation.connectEnd - navigation.connectStart,
            request_response: navigation.responseEnd - navigation.requestStart,
            dom_processing: navigation.loadEventStart - navigation.responseEnd,
            total_load_time: navigation.loadEventEnd - navigation.startTime,
          });
        }

        // Get resource timing data
        const resources = performance.getEntriesByType(
          'resource'
        ) as PerformanceResourceTiming[];
        if (resources.length > 0) {
          setResourceTiming({
            total_resources: resources.length,
            js_resources: resources.filter((r) => r.name.includes('.js'))
              .length,
            css_resources: resources.filter((r) => r.name.includes('.css'))
              .length,
            image_resources: resources.filter((r) =>
              /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name)
            ).length,
            font_resources: resources.filter((r) =>
              /\.(woff|woff2|ttf|otf)/.test(r.name)
            ).length,
            largest_resource: Math.max(
              ...resources.map((r) => r.transferSize || 0)
            ),
            total_transfer_size: resources.reduce(
              (sum, r) => sum + (r.transferSize || 0),
              0
            ),
          });
        }
      }
    };

    // Get data after page load
    if (document.readyState === 'complete') {
      getNavigationData();
    } else {
      window.addEventListener('load', getNavigationData);
      return () => window.removeEventListener('load', getNavigationData);
    }
  }, [isDevelopment]);

  if (!isDevelopment) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBadgeVariant = (
    rating: 'good' | 'needs-improvement' | 'poor'
  ) => {
    switch (rating) {
      case 'good':
        return 'default';
      case 'needs-improvement':
        return 'secondary';
      case 'poor':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-gray-900 text-white shadow-lg hover:bg-gray-800"
          size="sm"
        >
          📊 perf
        </Button>
      ) : (
        <Card className="max-h-96 w-96 overflow-auto border bg-white/95 shadow-lg backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light">
                performance monitor
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={`text-lg font-light ${getScoreColor(score)}`}>
                  {score}/100
                </div>
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="vitals" className="w-full">
              <TabsList className="mb-3 grid h-8 w-full grid-cols-3 text-xs">
                <TabsTrigger value="vitals" className="text-xs">
                  vitals
                </TabsTrigger>
                <TabsTrigger value="timing" className="text-xs">
                  timing
                </TabsTrigger>
                <TabsTrigger value="resources" className="text-xs">
                  resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vitals" className="mt-0 space-y-3">
                <div className="space-y-2">
                  {/* LCP */}
                  {metrics.lcp !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-light">lcp</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRatingBadgeVariant(
                            getMetricRating('lcp', metrics.lcp!, budget)
                          )}
                          className="text-xs"
                        >
                          {formatMetricValue('lcp', metrics.lcp!)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* FCP */}
                  {metrics.fcp !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-light">fcp</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRatingBadgeVariant(
                            getMetricRating('fcp', metrics.fcp!, budget)
                          )}
                          className="text-xs"
                        >
                          {formatMetricValue('fcp', metrics.fcp!)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* INP */}
                  {metrics.inp !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-light">inp</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRatingBadgeVariant(
                            getMetricRating('inp', metrics.inp!, budget)
                          )}
                          className="text-xs"
                        >
                          {formatMetricValue('inp', metrics.inp!)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* CLS */}
                  {metrics.cls !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-light">cls</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRatingBadgeVariant(
                            getMetricRating('cls', metrics.cls!, budget)
                          )}
                          className="text-xs"
                        >
                          {formatMetricValue('cls', metrics.cls!)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* TTFB */}
                  {metrics.ttfb !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-light">ttfb</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getRatingBadgeVariant(
                            getMetricRating('ttfb', metrics.ttfb!, budget)
                          )}
                          className="text-xs"
                        >
                          {formatMetricValue('ttfb', metrics.ttfb!)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall Score */}
                <div className="border-t pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-light">score</span>
                    <span
                      className={`text-xs font-light ${getScoreColor(score)}`}
                    >
                      {score}/100
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>

                {!isComplete && (
                  <div className="text-xs text-gray-500 italic">
                    collecting metrics...
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timing" className="mt-0 space-y-2">
                {navigationTiming ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>dns lookup</span>
                      <span>{Math.round(navigationTiming.dns_lookup)}ms</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>tcp connect</span>
                      <span>{Math.round(navigationTiming.tcp_connect)}ms</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>request/response</span>
                      <span>
                        {Math.round(navigationTiming.request_response)}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>dom processing</span>
                      <span>
                        {Math.round(navigationTiming.dom_processing)}ms
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-xs font-light">
                      <span>total load time</span>
                      <span>
                        {Math.round(navigationTiming.total_load_time)}ms
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    navigation timing not available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resources" className="mt-0 space-y-2">
                {resourceTiming ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>total resources</span>
                      <span>{resourceTiming.total_resources}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>javascript</span>
                      <span>{resourceTiming.js_resources}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>css</span>
                      <span>{resourceTiming.css_resources}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>images</span>
                      <span>{resourceTiming.image_resources}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>fonts</span>
                      <span>{resourceTiming.font_resources}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-xs">
                      <span>transfer size</span>
                      <span>
                        {formatBytes(resourceTiming.total_transfer_size)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>largest resource</span>
                      <span>
                        {formatBytes(resourceTiming.largest_resource)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    resource timing not available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
