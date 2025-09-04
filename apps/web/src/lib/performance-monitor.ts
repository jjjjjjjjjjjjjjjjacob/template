import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

export interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  inp: number | null; // FID is deprecated, using INP (Interaction to Next Paint)
  lcp: number | null;
  ttfb: number | null;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface PerformanceBudget {
  lcp: number; // Largest Contentful Paint (ms)
  inp: number; // Interaction to Next Paint (ms)
  cls: number; // Cumulative Layout Shift (score)
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
}

// Performance budgets based on Core Web Vitals thresholds
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  lcp: 2500, // Good: <= 2.5s
  inp: 200, // Good: <= 200ms (INP threshold)
  cls: 0.1, // Good: <= 0.1
  fcp: 1800, // Good: <= 1.8s
  ttfb: 800, // Good: <= 800ms
};

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET;
  private isInitialized = false;
  private listeners: Array<(metrics: PerformanceMetrics) => void> = [];

  init(budget?: Partial<PerformanceBudget>) {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    if (budget) {
      this.budget = { ...this.budget, ...budget };
    }

    this.metrics = {
      cls: null,
      fcp: null,
      inp: null,
      lcp: null,
      ttfb: null,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.setupWebVitalsListeners();
    this.isInitialized = true;

    // Track initialization
    posthog.capture('performance_monitor_initialized', {
      budget: JSON.stringify(this.budget),
      url: window.location.href,
    });
  }

  private setupWebVitalsListeners() {
    // Largest Contentful Paint
    onLCP((metric) => {
      this.updateMetric('lcp', metric);
    });

    // Interaction to Next Paint (replaces FID)
    onINP((metric: Metric) => {
      this.updateMetric('inp', metric);
    });

    // Cumulative Layout Shift
    onCLS((metric) => {
      this.updateMetric('cls', metric);
    });

    // First Contentful Paint
    onFCP((metric) => {
      this.updateMetric('fcp', metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      this.updateMetric('ttfb', metric);
    });
  }

  private updateMetric(name: keyof PerformanceMetrics, metric: Metric) {
    if (!this.isInitialized) return;

    (this.metrics as Record<string, number>)[name] = metric.value;
    this.metrics.timestamp = Date.now();

    // Check against budget
    const budget = this.budget[name as keyof PerformanceBudget];
    const isGood = this.isMetricGood(name, metric.value, budget);

    // Track metric with PostHog
    posthog.capture('web_vital_measured', {
      metric_name: name,
      value: metric.value,
      budget,
      is_good: isGood,
      rating: metric.rating,
      url: window.location.href,
      navigation_type: metric.navigationType,
    });

    // Log warning for poor performance
    if (!isGood && process.env.NODE_ENV === 'development') {
      // Performance warning: metric exceeds budget
    }

    // Notify listeners
    this.notifyListeners();
  }

  private isMetricGood(
    name: keyof PerformanceMetrics,
    value: number,
    budget: number
  ): boolean {
    // CLS is inverse - lower is better
    if (name === 'cls') {
      return value <= budget;
    }
    // All other metrics - lower is better
    return value <= budget;
  }

  private getUnit(name: keyof PerformanceMetrics): string {
    return name === 'cls' ? '' : 'ms';
  }

  private notifyListeners() {
    if (this.isComplete()) {
      const completeMetrics = this.metrics as PerformanceMetrics;
      this.listeners.forEach((listener) => listener(completeMetrics));
    }
  }

  // Subscribe to performance metrics updates
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(callback);

    // If metrics are already complete, call immediately
    if (this.isComplete()) {
      callback(this.metrics as PerformanceMetrics);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current metrics snapshot
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Check if all core metrics have been collected
  isComplete(): boolean {
    return !!(
      this.metrics.lcp !== null &&
      this.metrics.fcp !== null &&
      this.metrics.ttfb !== null
    );
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    if (!this.isComplete()) return 0;

    const scores: Record<string, number> = {
      lcp: this.getMetricScore('lcp', this.metrics.lcp!),
      fcp: this.getMetricScore('fcp', this.metrics.fcp!),
      cls: this.getMetricScore('cls', this.metrics.cls!),
      ttfb: this.getMetricScore('ttfb', this.metrics.ttfb!),
    };

    // INP might not be available (no user interaction)
    if (this.metrics.inp !== null) {
      scores.inp = this.getMetricScore('inp', this.metrics.inp!);
    }

    const totalScore = Object.values(scores).reduce(
      (sum, score) => sum + score,
      0
    );
    const metricCount = Object.keys(scores).length;

    return Math.round(totalScore / metricCount);
  }

  private getMetricScore(
    name: keyof PerformanceMetrics,
    value: number
  ): number {
    const budget = this.budget[name as keyof PerformanceBudget];
    const goodThreshold = budget;
    const poorThreshold = budget * 2; // Poor is roughly 2x the good threshold

    if (name === 'cls') {
      // CLS scoring (0-0.1 = good, 0.1-0.25 = needs improvement, >0.25 = poor)
      if (value <= 0.1) return 100;
      if (value <= 0.25) return 50;
      return 0;
    }

    // Time-based metrics scoring
    if (value <= goodThreshold) return 100;
    if (value <= poorThreshold) return 50;
    return 0;
  }

  // Manual tracking for custom performance metrics
  trackCustomMetric(name: string, value: number, unit = 'ms') {
    posthog.capture('custom_performance_metric', {
      metric_name: name,
      value,
      unit,
      url: window.location.href,
      timestamp: Date.now(),
    });
  }

  // Track navigation timing
  trackNavigationTiming() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const timings = {
      dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp_connect: navigation.connectEnd - navigation.connectStart,
      request_response: navigation.responseEnd - navigation.requestStart,
      dom_processing: navigation.loadEventStart - navigation.responseEnd,
      total_load_time: navigation.loadEventEnd - navigation.startTime,
    };

    posthog.capture('navigation_timing', {
      ...timings,
      url: window.location.href,
    });

    return timings;
  }

  // Track resource loading performance
  trackResourceTiming() {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const resources = performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];

    const resourceMetrics = {
      total_resources: resources.length,
      js_resources: resources.filter((r) => r.name.includes('.js')).length,
      css_resources: resources.filter((r) => r.name.includes('.css')).length,
      image_resources: resources.filter((r) =>
        /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name)
      ).length,
      font_resources: resources.filter((r) =>
        /\.(woff|woff2|ttf|otf)/.test(r.name)
      ).length,
      largest_resource: Math.max(...resources.map((r) => r.transferSize || 0)),
      total_transfer_size: resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      ),
    };

    posthog.capture('resource_timing', {
      ...resourceMetrics,
      url: window.location.href,
    });

    return resourceMetrics;
  }

  // Update performance budget
  updateBudget(budget: Partial<PerformanceBudget>) {
    this.budget = { ...this.budget, ...budget };

    posthog.capture('performance_budget_updated', {
      budget: JSON.stringify(this.budget),
      url: window.location.href,
    });
  }

  // Reset metrics (useful for SPA navigation)
  reset() {
    this.metrics = {
      cls: null,
      fcp: null,
      inp: null,
      lcp: null,
      ttfb: null,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((completeMetrics) => {
      setMetrics(completeMetrics);
      setScore(performanceMonitor.getPerformanceScore());
    });

    // Get initial metrics
    setMetrics(performanceMonitor.getMetrics());
    setScore(performanceMonitor.getPerformanceScore());

    return unsubscribe;
  }, []);

  return {
    metrics,
    score,
    isComplete: performanceMonitor.isComplete(),
    budget: DEFAULT_PERFORMANCE_BUDGET,
  };
}

// Utility function to check if a metric is good
export function isMetricGood(
  name: keyof PerformanceBudget,
  value: number,
  budget = DEFAULT_PERFORMANCE_BUDGET
): boolean {
  const threshold = budget[name];
  if (name === 'cls') {
    return value <= threshold;
  }
  return value <= threshold;
}

// Format metric value for display
export function formatMetricValue(
  name: keyof PerformanceMetrics,
  value: number
): string {
  if (name === 'cls') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

// Get metric rating color for UI
export function getMetricRating(
  name: keyof PerformanceBudget,
  value: number,
  budget = DEFAULT_PERFORMANCE_BUDGET
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = budget[name];

  if (name === 'cls') {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  if (value <= threshold) return 'good';
  if (value <= threshold * 1.5) return 'needs-improvement';
  return 'poor';
}
