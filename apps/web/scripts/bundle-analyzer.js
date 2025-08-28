#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DIST_PATH = resolve(__dirname, '../dist');
const OUTPUT_PATH = resolve(__dirname, '../bundle-analysis.json');
const PERFORMANCE_LOG_PATH = resolve(__dirname, '../performance.log');

// Chunk size thresholds (in KB)
const THRESHOLDS = {
  warning: 400,
  error: 800,
  critical: 1000,
};

// Vendor chunk expectations for optimization tracking
const EXPECTED_CHUNKS = [
  'react-vendor',
  'tanstack-vendor',
  'three-vendor',
  'radix-vendor',
  'utils-vendor',
  'charts-vendor',
  'client-vendor',
  'forms-vendor',
];

class BundleAnalyzer {
  constructor(options = {}) {
    this.options = {
      chunksOnly: false,
      monitor: false,
      verbose: false,
      ...options,
    };
    this.analysis = {
      timestamp: new Date().toISOString(),
      chunks: [],
      assets: [],
      summary: {},
      performance: {},
      recommendations: [],
    };
  }

  analyze() {
    console.log('🔍 Analyzing bundle...');

    if (!existsSync(DIST_PATH)) {
      console.error('❌ Build directory not found. Run build first.');
      process.exit(1);
    }

    this.analyzeChunks();
    this.analyzeAssets();
    this.generateSummary();
    this.generateRecommendations();

    if (this.options.monitor) {
      this.logPerformanceMetrics();
    }

    this.saveAnalysis();
    this.displayResults();
  }

  analyzeChunks() {
    let chunks = [];

    try {
      // Try to read Vite's build output manifest
      const manifestPath = resolve(DIST_PATH, '.vite/manifest.json');
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        chunks = this.parseViteManifest(manifest);
      } else {
        // Fallback: analyze files directly
        chunks = this.analyzeFilesDirectly();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      console.warn(
        '⚠️  Could not read build manifest, analyzing files directly'
      );
      chunks = this.analyzeFilesDirectly();
    }

    this.analysis.chunks = chunks;
  }

  parseViteManifest(manifest) {
    const chunks = [];

    Object.entries(manifest).forEach(([key, entry]) => {
      if (entry.isEntry || entry.isDynamicEntry) {
        const size = this.getFileSize(resolve(DIST_PATH, entry.file));
        const gzipSize = this.estimateGzipSize(size);

        chunks.push({
          name: key,
          file: entry.file,
          size: size,
          gzipSize: gzipSize,
          imports: entry.imports || [],
          dynamicImports: entry.dynamicImports || [],
          css: entry.css || [],
          assets: entry.assets || [],
          isEntry: entry.isEntry || false,
          isDynamic: entry.isDynamicEntry || false,
        });
      }
    });

    return chunks.sort((a, b) => b.size - a.size);
  }

  analyzeFilesDirectly() {
    const { readdirSync, statSync } = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
    const chunks = [];

    try {
      const jsFiles = readdirSync(resolve(DIST_PATH, 'js'))
        .filter((file) => file.endsWith('.js'))
        .map((file) => {
          const filePath = resolve(DIST_PATH, 'js', file);
          const stats = statSync(filePath);
          const size = stats.size;

          return {
            name: file.replace(/\.[^.]+$/, ''),
            file: `js/${file}`,
            size: size,
            gzipSize: this.estimateGzipSize(size),
            imports: [],
            dynamicImports: [],
            css: [],
            assets: [],
            isEntry: file.includes('index') || file.includes('main'),
            isDynamic: !file.includes('index') && !file.includes('main'),
          };
        });

      chunks.push(...jsFiles);
    } catch (_error) {
      console.error('Error analyzing files:', _error.message);
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  analyzeAssets() {
    const { readdirSync, statSync } = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
    const assets = [];

    try {
      ['images', 'fonts', 'assets'].forEach((dir) => {
        const dirPath = resolve(DIST_PATH, dir);
        if (existsSync(dirPath)) {
          const files = readdirSync(dirPath);
          files.forEach((file) => {
            const filePath = resolve(dirPath, file);
            const stats = statSync(filePath);

            assets.push({
              name: file,
              path: `${dir}/${file}`,
              size: stats.size,
              type: this.getAssetType(file),
            });
          });
        }
      });
    } catch (_error) {
      console.error('Error analyzing assets:', _error.message);
    }

    this.analysis.assets = assets.sort((a, b) => b.size - a.size);
  }

  generateSummary() {
    const chunks = this.analysis.chunks;
    const assets = this.analysis.assets;

    const totalJSSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalGzipSize = chunks.reduce(
      (sum, chunk) => sum + chunk.gzipSize,
      0
    );
    const totalAssetSize = assets.reduce((sum, asset) => sum + asset.size, 0);

    // Check vendor chunk optimization
    const vendorChunkCount = chunks.filter((chunk) =>
      EXPECTED_CHUNKS.some((expected) => chunk.name.includes(expected))
    ).length;

    this.analysis.summary = {
      totalChunks: chunks.length,
      totalJSSize: totalJSSize,
      totalGzipSize: totalGzipSize,
      totalAssetSize: totalAssetSize,
      totalSize: totalJSSize + totalAssetSize,
      vendorChunkCount: vendorChunkCount,
      expectedVendorChunks: EXPECTED_CHUNKS.length,
      largestChunk: chunks[0] || null,
      compressionRatio: totalJSSize
        ? (totalGzipSize / totalJSSize).toFixed(2)
        : '0.00',
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const chunks = this.analysis.chunks;
    const summary = this.analysis.summary;

    // Check chunk sizes
    chunks.forEach((chunk) => {
      const sizeKB = chunk.size / 1024;
      if (sizeKB > THRESHOLDS.critical) {
        recommendations.push({
          type: 'critical',
          category: 'chunk-size',
          message: `Chunk "${chunk.name}" (${this.formatSize(chunk.size)}) exceeds critical threshold`,
          suggestion:
            'Consider splitting this chunk further or lazy loading components',
        });
      } else if (sizeKB > THRESHOLDS.warning) {
        recommendations.push({
          type: 'warning',
          category: 'chunk-size',
          message: `Chunk "${chunk.name}" (${this.formatSize(chunk.size)}) is large`,
          suggestion:
            'Monitor this chunk and consider optimization if it grows',
        });
      }
    });

    // Check vendor chunk optimization
    if (summary.vendorChunkCount < summary.expectedVendorChunks) {
      recommendations.push({
        type: 'warning',
        category: 'chunk-splitting',
        message: `Only ${summary.vendorChunkCount}/${summary.expectedVendorChunks} vendor chunks found`,
        suggestion:
          'Verify manual chunk splitting configuration in vite.config.ts',
      });
    }

    // Check for Three.js lazy loading
    const threeChunk = chunks.find((chunk) => chunk.name.includes('three'));
    if (threeChunk && threeChunk.isEntry) {
      recommendations.push({
        type: 'warning',
        category: 'lazy-loading',
        message: 'Three.js chunk appears to be in main bundle',
        suggestion: 'Ensure Three.js is properly lazy loaded for ParticleField',
      });
    }

    // Check compression ratio
    const compressionRatio = parseFloat(summary.compressionRatio);
    if (compressionRatio > 0.4) {
      recommendations.push({
        type: 'info',
        category: 'compression',
        message: `Compression ratio (${compressionRatio}) could be improved`,
        suggestion:
          'Consider enabling more aggressive minification or removing unused code',
      });
    }

    this.analysis.recommendations = recommendations;
  }

  logPerformanceMetrics() {
    const buildTime = process.env.BUILD_TIME || new Date().toISOString();
    const metrics = {
      timestamp: buildTime,
      totalSize: this.analysis.summary.totalSize,
      gzipSize: this.analysis.summary.totalGzipSize,
      chunkCount: this.analysis.summary.totalChunks,
      vendorOptimization:
        this.analysis.summary.vendorChunkCount /
        this.analysis.summary.expectedVendorChunks,
    };

    try {
      let logs = [];
      if (existsSync(PERFORMANCE_LOG_PATH)) {
        const existingLogs = readFileSync(PERFORMANCE_LOG_PATH, 'utf-8');
        logs = existingLogs.trim().split('\n').filter(Boolean).map(JSON.parse);
      }

      logs.push(metrics);

      // Keep last 50 builds
      if (logs.length > 50) {
        logs = logs.slice(-50);
      }

      writeFileSync(
        PERFORMANCE_LOG_PATH,
        logs.map((log) => JSON.stringify(log)).join('\n')
      );
    } catch (_error) {
      console.error('Error logging performance metrics:', _error.message);
    }
  }

  saveAnalysis() {
    try {
      writeFileSync(OUTPUT_PATH, JSON.stringify(this.analysis, null, 2));
      console.log(`📊 Analysis saved to ${OUTPUT_PATH}`);
    } catch (_error) {
      console.error('Error saving analysis:', _error.message);
    }
  }

  displayResults() {
    const { chunks, assets, summary, recommendations } = this.analysis;

    console.log('\n🎯 Bundle Analysis Results');
    console.log('='.repeat(50));

    // Summary
    console.log(`📦 Total Chunks: ${summary.totalChunks}`);
    console.log(`💾 JavaScript Size: ${this.formatSize(summary.totalJSSize)}`);
    console.log(
      `🗜️  Gzip Size: ${this.formatSize(summary.totalGzipSize)} (${summary.compressionRatio}x)`
    );
    console.log(`🖼️  Assets Size: ${this.formatSize(summary.totalAssetSize)}`);
    console.log(`📊 Total Size: ${this.formatSize(summary.totalSize)}`);
    console.log(
      `⚙️  Vendor Chunks: ${summary.vendorChunkCount}/${summary.expectedVendorChunks}`
    );

    if (!this.options.chunksOnly) {
      // Top chunks
      console.log('\n🔥 Largest Chunks:');
      chunks.slice(0, 10).forEach((chunk, i) => {
        const status = this.getChunkStatus(chunk.size);
        console.log(
          `${i + 1}. ${chunk.name} - ${this.formatSize(chunk.size)} ${status}`
        );
      });

      // Top assets
      if (assets.length > 0) {
        console.log('\n📁 Largest Assets:');
        assets.slice(0, 5).forEach((asset, i) => {
          console.log(
            `${i + 1}. ${asset.name} - ${this.formatSize(asset.size)}`
          );
        });
      }
    }

    // Recommendations
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec) => {
        const icon = this.getRecommendationIcon(rec.type);
        console.log(`${icon} ${rec.message}`);
        console.log(`   → ${rec.suggestion}`);
      });
    }

    // Performance comparison
    this.displayPerformanceComparison();
  }

  displayPerformanceComparison() {
    if (!existsSync(PERFORMANCE_LOG_PATH)) return;

    try {
      const logs = readFileSync(PERFORMANCE_LOG_PATH, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(JSON.parse);

      if (logs.length < 2) return;

      const current = logs[logs.length - 1];
      const previous = logs[logs.length - 2];

      console.log('\n📈 Performance Comparison (vs previous build):');

      const sizeDiff = current.totalSize - previous.totalSize;
      const sizeChange =
        sizeDiff === 0
          ? 'unchanged'
          : sizeDiff > 0
            ? `+${this.formatSize(sizeDiff)}`
            : `-${this.formatSize(Math.abs(sizeDiff))}`;

      console.log(`Bundle Size: ${sizeChange}`);
      console.log(
        `Chunks: ${current.chunkCount - previous.chunkCount >= 0 ? '+' : ''}${current.chunkCount - previous.chunkCount}`
      );
      console.log(
        `Vendor Optimization: ${(current.vendorOptimization * 100).toFixed(1)}%`
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Silently ignore comparison errors
    }
  }

  getFileSize(filePath) {
    try {
      const { statSync } = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
      return statSync(filePath).size;
    } catch {
      return 0;
    }
  }

  estimateGzipSize(size) {
    // Rough estimate: gzip typically compresses JS to ~25-35% of original size
    return Math.round(size * 0.3);
  }

  getAssetType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap = {
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',
      woff: 'font',
      woff2: 'font',
      ttf: 'font',
      otf: 'font',
      css: 'stylesheet',
      js: 'script',
    };
    return typeMap[ext] || 'other';
  }

  getChunkStatus(size) {
    const sizeKB = size / 1024;
    if (sizeKB > THRESHOLDS.critical) return '🔴';
    if (sizeKB > THRESHOLDS.error) return '🟡';
    if (sizeKB > THRESHOLDS.warning) return '🟠';
    return '🟢';
  }

  getRecommendationIcon(type) {
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type] || 'ℹ️';
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  chunksOnly: args.includes('--chunks-only'),
  monitor: args.includes('--monitor'),
  verbose: args.includes('--verbose'),
};

const analyzer = new BundleAnalyzer(options);
analyzer.analyze();
