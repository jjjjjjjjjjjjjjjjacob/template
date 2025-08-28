// Performance monitoring configuration for Vite builds
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PERFORMANCE_LOG = resolve(process.cwd(), 'performance.log');
const BUILD_METRICS_FILE = resolve(process.cwd(), 'build-metrics.json');

// Performance thresholds for monitoring
export const PERFORMANCE_THRESHOLDS = {
  // Bundle size limits (in KB)
  bundleSize: {
    warning: 2000, // 2MB total bundle
    error: 3000, // 3MB total bundle
  },

  // Individual chunk limits (in KB)
  chunkSize: {
    warning: 400, // 400KB per chunk
    error: 800, // 800KB per chunk
    critical: 1000, // 1MB per chunk
  },

  // Build time limits (in seconds)
  buildTime: {
    warning: 30,
    error: 60,
  },

  // Compression ratio (higher is worse)
  compression: {
    warning: 0.4,
    error: 0.5,
  },
};

// Expected chunk structure for optimization validation
export const EXPECTED_CHUNK_STRUCTURE = {
  // Core chunks that should exist
  required: ['react-vendor', 'tanstack-vendor', 'utils-vendor'],

  // Optional chunks for features
  optional: [
    'three-vendor', // 3D graphics - lazy loaded
    'radix-vendor', // UI components - on demand
    'charts-vendor', // Data viz - admin only
    'client-vendor', // Client features
    'forms-vendor', // Form handling
  ],

  // Chunks that should be lazy loaded
  lazyLoaded: ['three-vendor', 'charts-vendor'],
};

// Build plugins for performance monitoring
export const buildPlugins = [];

// Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      buildStart: new Date().toISOString(),
      buildEnd: null,
      buildTime: null,
      bundleSize: null,
      chunkAnalysis: null,
      warnings: [],
      errors: [],
      optimizations: [],
    };
  }

  startBuild() {
    this.startTime = Date.now();
    this.metrics.buildStart = new Date().toISOString();
    console.log('📊 Performance monitoring started');
  }

  endBuild(bundleInfo = {}) {
    this.metrics.buildEnd = new Date().toISOString();
    this.metrics.buildTime = (Date.now() - this.startTime) / 1000;
    this.metrics.bundleSize = bundleInfo.size || 0;
    this.metrics.chunkAnalysis = bundleInfo.chunks || {};

    this.validatePerformance();
    this.saveMetrics();
    this.displaySummary();
  }

  validatePerformance() {
    const { buildTime, bundleSize, chunkAnalysis } = this.metrics;

    // Validate build time
    if (buildTime > PERFORMANCE_THRESHOLDS.buildTime.error) {
      this.metrics.errors.push(
        `Build time ${buildTime}s exceeds error threshold (${PERFORMANCE_THRESHOLDS.buildTime.error}s)`
      );
    } else if (buildTime > PERFORMANCE_THRESHOLDS.buildTime.warning) {
      this.metrics.warnings.push(
        `Build time ${buildTime}s exceeds warning threshold (${PERFORMANCE_THRESHOLDS.buildTime.warning}s)`
      );
    }

    // Validate bundle size
    const bundleSizeKB = bundleSize / 1024;
    if (bundleSizeKB > PERFORMANCE_THRESHOLDS.bundleSize.error) {
      this.metrics.errors.push(
        `Bundle size ${this.formatSize(bundleSize)} exceeds error threshold`
      );
    } else if (bundleSizeKB > PERFORMANCE_THRESHOLDS.bundleSize.warning) {
      this.metrics.warnings.push(
        `Bundle size ${this.formatSize(bundleSize)} exceeds warning threshold`
      );
    }

    // Validate chunk structure
    this.validateChunkStructure(chunkAnalysis);

    // Track optimizations
    this.trackOptimizations(chunkAnalysis);
  }

  validateChunkStructure(chunks) {
    if (!chunks || typeof chunks !== 'object') return;

    const chunkNames = Object.keys(chunks);

    // Check required chunks exist
    EXPECTED_CHUNK_STRUCTURE.required.forEach((required) => {
      if (!chunkNames.some((name) => name.includes(required))) {
        this.metrics.warnings.push(`Missing required chunk: ${required}`);
      }
    });

    // Check chunk sizes
    Object.entries(chunks).forEach(([name, info]) => {
      const sizeKB = (info.size || 0) / 1024;

      if (sizeKB > PERFORMANCE_THRESHOLDS.chunkSize.critical) {
        this.metrics.errors.push(
          `Chunk ${name} (${this.formatSize(info.size)}) exceeds critical size`
        );
      } else if (sizeKB > PERFORMANCE_THRESHOLDS.chunkSize.error) {
        this.metrics.warnings.push(
          `Chunk ${name} (${this.formatSize(info.size)}) exceeds error threshold`
        );
      }
    });

    // Validate lazy loading implementation
    EXPECTED_CHUNK_STRUCTURE.lazyLoaded.forEach((lazyChunk) => {
      const chunk = chunkNames.find((name) => name.includes(lazyChunk));
      if (chunk && chunks[chunk] && !chunks[chunk].isDynamic) {
        this.metrics.warnings.push(
          `Chunk ${chunk} should be lazy loaded but appears to be in main bundle`
        );
      }
    });
  }

  trackOptimizations(chunks) {
    if (!chunks || typeof chunks !== 'object') return;

    const chunkNames = Object.keys(chunks);

    // Track vendor chunk optimization
    const vendorChunks = chunkNames.filter((name) => name.includes('-vendor'));
    const expectedVendorCount =
      EXPECTED_CHUNK_STRUCTURE.required.length +
      EXPECTED_CHUNK_STRUCTURE.optional.length;
    const optimizationRatio = vendorChunks.length / expectedVendorCount;

    this.metrics.optimizations.push({
      type: 'vendor-chunking',
      ratio: optimizationRatio,
      achieved: vendorChunks.length,
      expected: expectedVendorCount,
      status:
        optimizationRatio > 0.8
          ? 'good'
          : optimizationRatio > 0.5
            ? 'fair'
            : 'poor',
    });

    // Track lazy loading optimization
    const dynamicChunks = chunkNames.filter(
      (name) => chunks[name] && chunks[name].isDynamic
    );

    this.metrics.optimizations.push({
      type: 'lazy-loading',
      dynamicChunks: dynamicChunks.length,
      totalChunks: chunkNames.length,
      status: dynamicChunks.length > 0 ? 'implemented' : 'missing',
    });

    // Track compression optimization
    const totalSize = Object.values(chunks).reduce(
      (sum, chunk) => sum + (chunk.size || 0),
      0
    );
    const totalGzipSize = Object.values(chunks).reduce(
      (sum, chunk) => sum + (chunk.gzipSize || chunk.size * 0.3),
      0
    );
    const compressionRatio = totalSize > 0 ? totalGzipSize / totalSize : 0;

    this.metrics.optimizations.push({
      type: 'compression',
      ratio: compressionRatio,
      status:
        compressionRatio < 0.3
          ? 'excellent'
          : compressionRatio < 0.4
            ? 'good'
            : 'needs-improvement',
    });
  }

  saveMetrics() {
    try {
      // Save detailed metrics
      writeFileSync(BUILD_METRICS_FILE, JSON.stringify(this.metrics, null, 2));

      // Append to performance log
      const logEntry = {
        timestamp: this.metrics.buildStart,
        buildTime: this.metrics.buildTime,
        bundleSize: this.metrics.bundleSize,
        warnings: this.metrics.warnings.length,
        errors: this.metrics.errors.length,
        optimizations: this.metrics.optimizations.reduce((acc, opt) => {
          acc[opt.type] = opt.status;
          return acc;
        }, {}),
      };

      let logs = [];
      if (existsSync(PERFORMANCE_LOG)) {
        const existingLogs = readFileSync(PERFORMANCE_LOG, 'utf-8');
        logs = existingLogs.trim().split('\n').filter(Boolean).map(JSON.parse);
      }

      logs.push(logEntry);

      // Keep last 100 builds
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      writeFileSync(
        PERFORMANCE_LOG,
        logs.map((log) => JSON.stringify(log)).join('\n')
      );
    } catch (_error) {
      console.error('❌ Error saving performance metrics:', _error.message);
    }
  }

  displaySummary() {
    const { buildTime, bundleSize, warnings, errors, optimizations } =
      this.metrics;

    console.log('\n🎯 Build Performance Summary');
    console.log('='.repeat(40));
    console.log(`⏱️  Build Time: ${buildTime.toFixed(2)}s`);
    console.log(`📦 Bundle Size: ${this.formatSize(bundleSize)}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    // Display optimization status
    console.log('\n🔧 Optimization Status:');
    optimizations.forEach((opt) => {
      const icon = this.getOptimizationIcon(opt.status);
      console.log(`${icon} ${opt.type}: ${opt.status}`);
    });

    // Display warnings and errors
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error) => console.log(`   • ${error}`));
    }

    // Performance trend
    this.displayTrend();
  }

  displayTrend() {
    if (!existsSync(PERFORMANCE_LOG)) return;

    try {
      const logs = readFileSync(PERFORMANCE_LOG, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(JSON.parse)
        .slice(-5); // Last 5 builds

      if (logs.length < 2) return;

      console.log('\n📈 Performance Trend (last 5 builds):');

      const current = logs[logs.length - 1];
      const previous = logs[logs.length - 2];

      const buildTimeTrend = current.buildTime - previous.buildTime;
      const sizeTrend = current.bundleSize - previous.bundleSize;

      console.log(`Build Time: ${this.formatTrend(buildTimeTrend, 's')}`);
      console.log(`Bundle Size: ${this.formatTrend(sizeTrend, 'bytes')}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Silently ignore trend display errors
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  formatTrend(value, unit) {
    const sign = value >= 0 ? '+' : '';
    const formattedValue =
      unit === 'bytes'
        ? this.formatSize(Math.abs(value))
        : `${Math.abs(value).toFixed(2)}${unit}`;
    const trend = value === 0 ? '→' : value > 0 ? '↗️' : '↘️';
    return `${trend} ${sign}${formattedValue}`;
  }

  getOptimizationIcon(status) {
    const icons = {
      excellent: '🟢',
      good: '🟢',
      implemented: '🟢',
      fair: '🟡',
      'needs-improvement': '🟡',
      poor: '🔴',
      missing: '🔴',
    };
    return icons[status] || '⚪';
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Vite plugin for performance monitoring
export function performancePlugin() {
  return {
    name: 'performance-monitor',
    buildStart() {
      performanceMonitor.startBuild();
    },
    writeBundle(options, bundle) {
      // Collect bundle information
      const bundleInfo = {
        size: Object.values(bundle).reduce((sum, chunk) => {
          return sum + (chunk.code ? chunk.code.length : 0);
        }, 0),
        chunks: Object.fromEntries(
          Object.entries(bundle).map(([key, chunk]) => [
            key,
            {
              size: chunk.code ? chunk.code.length : 0,
              isDynamic: chunk.isDynamicEntry || false,
              isEntry: chunk.isEntry || false,
            },
          ])
        ),
      };

      performanceMonitor.endBuild(bundleInfo);
    },
  };
}

export default {
  buildPlugins: [performancePlugin()],
  thresholds: PERFORMANCE_THRESHOLDS,
  expectedStructure: EXPECTED_CHUNK_STRUCTURE,
  monitor: performanceMonitor,
};
