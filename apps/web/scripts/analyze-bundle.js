#!/usr/bin/env node

/**
 * Enhanced bundle analysis script for Vite builds
 * Provides comprehensive bundle analysis with performance budgets and optimization recommendations
 */

/* eslint-disable no-console */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

const DIST_DIR = './.output';
const PUBLIC_DIR = './public';
const CLIENT_DIR = join(DIST_DIR, 'public');

// Performance budgets (in bytes)
const PERFORMANCE_BUDGETS = {
  totalJS: 500 * 1024, // 500KB total JS
  totalCSS: 100 * 1024, // 100KB total CSS
  largestChunk: 250 * 1024, // 250KB largest chunk
  initialBundle: 200 * 1024, // 200KB initial bundle
  totalAssets: 2 * 1024 * 1024, // 2MB total assets
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function getGzipEstimate(size) {
  // Rough estimate: gzip typically achieves 70-80% compression for text files
  return Math.round(size * 0.3);
}

function checkBudget(actual, budget, label) {
  const percentage = (actual / budget) * 100;
  const status = percentage <= 100 ? '✅' : percentage <= 120 ? '⚠️' : '❌';
  const color =
    percentage <= 100
      ? '\x1b[32m'
      : percentage <= 120
        ? '\x1b[33m'
        : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(
    `  ${status} ${label}: ${color}${formatBytes(actual)}${reset} / ${formatBytes(budget)} (${percentage.toFixed(1)}%)`
  );
  return percentage <= 100;
}

function analyzeViteAssets() {
  console.log('📦 Vite Bundle Analysis\n');

  if (!existsSync(DIST_DIR)) {
    console.log('❌ Build directory not found. Run: bun run build');
    return { success: false };
  }

  const results = {
    js: { files: [], total: 0 },
    css: { files: [], total: 0 },
    assets: { files: [], total: 0 },
    chunks: [],
    largestChunk: 0,
    totalSize: 0,
    budgetChecks: [],
  };

  // Check both .output/public (Vite) and .output (Nitro)
  const searchDirs = [
    CLIENT_DIR,
    join(DIST_DIR, 'assets'),
    join(DIST_DIR, '_nuxt'),
    DIST_DIR,
  ].filter((dir) => existsSync(dir));

  function analyzeDirectory(dir, basePath = '') {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = join(basePath, item);

        if (statSync(fullPath).isDirectory()) {
          analyzeDirectory(fullPath, relativePath);
        } else {
          const size = getFileSize(fullPath);
          const ext = extname(item).toLowerCase();

          const fileInfo = {
            name: relativePath,
            size,
            path: fullPath,
            gzipEstimate: getGzipEstimate(size),
            isChunk:
              item.includes('.') && (item.includes('-') || item.includes('_')),
          };

          if (ext === '.js' || ext === '.mjs') {
            results.js.files.push(fileInfo);
            results.js.total += size;
            if (fileInfo.isChunk) {
              results.chunks.push(fileInfo);
              results.largestChunk = Math.max(results.largestChunk, size);
            }
          } else if (ext === '.css') {
            results.css.files.push(fileInfo);
            results.css.total += size;
          } else if (
            [
              '.png',
              '.jpg',
              '.jpeg',
              '.gif',
              '.svg',
              '.webp',
              '.ico',
              '.woff',
              '.woff2',
              '.ttf',
            ].includes(ext)
          ) {
            results.assets.files.push(fileInfo);
            results.assets.total += size;
          }

          results.totalSize += size;
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dir}:`, error.message);
    }
  }

  searchDirs.forEach((dir) => analyzeDirectory(dir));

  return results;
}

function displayResults(results) {
  if (!results.success === false) {
    // JavaScript Analysis
    console.log('🟨 JavaScript Bundles:');
    if (results.js.files.length === 0) {
      console.log('  No JavaScript files found');
    } else {
      results.js.files
        .sort((a, b) => b.size - a.size)
        .slice(0, 10) // Show top 10
        .forEach((file) => {
          const isLarge = file.size > 100 * 1024; // > 100KB
          const indicator = isLarge ? '🔴' : '🟢';
          console.log(
            `  ${indicator} ${file.name}: ${formatBytes(file.size)} (gzip: ~${formatBytes(file.gzipEstimate)})`
          );
        });
    }

    // CSS Analysis
    console.log('\n🟦 CSS Bundles:');
    if (results.css.files.length === 0) {
      console.log('  No CSS files found');
    } else {
      results.css.files
        .sort((a, b) => b.size - a.size)
        .forEach((file) => {
          console.log(
            `  📄 ${file.name}: ${formatBytes(file.size)} (gzip: ~${formatBytes(file.gzipEstimate)})`
          );
        });
    }

    // Assets Analysis
    console.log('\n🖼️  Static Assets:');
    if (results.assets.files.length === 0) {
      console.log('  No static assets found');
    } else {
      const assetsByType = results.assets.files.reduce((acc, file) => {
        const ext = extname(file.name).slice(1) || 'other';
        if (!acc[ext]) acc[ext] = { count: 0, size: 0 };
        acc[ext].count++;
        acc[ext].size += file.size;
        return acc;
      }, {});

      Object.entries(assetsByType).forEach(([type, info]) => {
        console.log(
          `  ${type.toUpperCase()}: ${info.count} files, ${formatBytes(info.size)}`
        );
      });

      // Show largest assets
      const largestAssets = results.assets.files
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);

      if (largestAssets.length > 0) {
        console.log('\n  📊 Largest Assets:');
        largestAssets.forEach((file) => {
          const isLarge = file.size > 500 * 1024; // > 500KB
          const indicator = isLarge ? '⚠️' : '✅';
          console.log(
            `    ${indicator} ${file.name}: ${formatBytes(file.size)}`
          );
        });
      }
    }

    // Performance Budget Check
    console.log('\n🎯 Performance Budget Analysis:');
    const budgetResults = [
      checkBudget(
        results.js.total,
        PERFORMANCE_BUDGETS.totalJS,
        'Total JavaScript'
      ),
      checkBudget(results.css.total, PERFORMANCE_BUDGETS.totalCSS, 'Total CSS'),
      checkBudget(
        results.largestChunk,
        PERFORMANCE_BUDGETS.largestChunk,
        'Largest Chunk'
      ),
      checkBudget(
        results.totalSize,
        PERFORMANCE_BUDGETS.totalAssets,
        'Total Assets'
      ),
    ];

    const passedBudgets = budgetResults.filter(Boolean).length;
    console.log(
      `\n📊 Budget Summary: ${passedBudgets}/${budgetResults.length} checks passed`
    );

    // Totals Summary
    console.log('\n📈 Bundle Summary:');
    console.log(
      `  Total JavaScript: ${formatBytes(results.js.total)} (${results.js.files.length} files)`
    );
    console.log(
      `  Total CSS: ${formatBytes(results.css.total)} (${results.css.files.length} files)`
    );
    console.log(
      `  Total Assets: ${formatBytes(results.assets.total)} (${results.assets.files.length} files)`
    );
    console.log(`  Total Bundle Size: ${formatBytes(results.totalSize)}`);
    console.log(
      `  Estimated Gzipped: ~${formatBytes(getGzipEstimate(results.totalSize))}`
    );

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');

    if (results.js.total > PERFORMANCE_BUDGETS.totalJS) {
      console.log('  🔧 JavaScript is over budget:');
      console.log('    - Consider code splitting with dynamic imports');
      console.log('    - Remove unused dependencies');
      console.log('    - Use tree shaking to eliminate dead code');
    }

    if (results.css.total > PERFORMANCE_BUDGETS.totalCSS) {
      console.log('  🎨 CSS is over budget:');
      console.log('    - Use CSS purging to remove unused styles');
      console.log('    - Consider critical CSS inlining');
    }

    if (results.largestChunk > PERFORMANCE_BUDGETS.largestChunk) {
      console.log('  📦 Large chunks detected:');
      console.log('    - Split vendor libraries into separate chunks');
      console.log('    - Implement route-based code splitting');
    }

    const largeAssets = results.assets.files.filter((f) => f.size > 500 * 1024);
    if (largeAssets.length > 0) {
      console.log('  🖼️  Large assets found:');
      console.log('    - Optimize images (WebP, compression)');
      console.log('    - Consider CDN for large assets');
      console.log('    - Use font subsetting for web fonts');
    }
  }
}

function analyzeFontOptimization() {
  console.log('\n🔤 Font Optimization Analysis:');

  if (!existsSync(PUBLIC_DIR)) {
    console.log('❌ Public directory not found');
    return;
  }

  const fontsDir = join(PUBLIC_DIR, 'fonts');
  if (!existsSync(fontsDir)) {
    console.log('❌ Fonts directory not found');
    return;
  }

  const fontFiles = [];
  const optimizedDir = join(fontsDir, 'optimized');
  const hasOptimizedFonts = existsSync(optimizedDir);

  function scanFonts(dir, isOptimized = false) {
    try {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        if (
          statSync(fullPath).isFile() &&
          ['.woff2', '.woff', '.ttf', '.otf'].includes(extname(item))
        ) {
          fontFiles.push({
            name: item,
            size: getFileSize(fullPath),
            optimized: isOptimized,
            path: fullPath,
          });
        }
      }
    } catch (error) {
      console.warn(`Could not scan fonts in ${dir}:`, error.message);
    }
  }

  scanFonts(fontsDir);
  if (hasOptimizedFonts) {
    scanFonts(optimizedDir, true);
  }

  if (fontFiles.length === 0) {
    console.log('  No font files found');
    return;
  }

  const originalFonts = fontFiles.filter((f) => !f.optimized);
  const optimizedFonts = fontFiles.filter((f) => f.optimized);

  console.log('\n📁 Font Files:');
  fontFiles.forEach((file) => {
    const indicator = file.optimized
      ? '✅'
      : file.size > 1024 * 1024
        ? '🔴'
        : '⚠️';
    const type = file.optimized ? ' (optimized)' : '';
    console.log(
      `  ${indicator} ${file.name}${type}: ${formatBytes(file.size)}`
    );
  });

  const totalOriginal = originalFonts.reduce((sum, f) => sum + f.size, 0);
  const totalOptimized = optimizedFonts.reduce((sum, f) => sum + f.size, 0);

  if (totalOriginal > 0 && totalOptimized > 0) {
    const savings = totalOriginal - totalOptimized;
    const savingsPercent = (savings / totalOriginal) * 100;
    console.log(
      `\n💾 Font Optimization Savings: ${formatBytes(savings)} (${savingsPercent.toFixed(1)}%)`
    );
  }

  if (originalFonts.some((f) => f.size > 1024 * 1024) && !hasOptimizedFonts) {
    console.log(
      '\n⚠️  Large fonts detected. Consider running: bun run fonts:subset'
    );
  }
}

function showPerformanceTips() {
  console.log('\n🚀 Performance Optimization Tips:');
  console.log('  📦 Bundle Optimization:');
  console.log('    - Use dynamic imports for code splitting');
  console.log('    - Implement route-based lazy loading');
  console.log('    - Tree shake unused dependencies');
  console.log('    - Use webpack-bundle-analyzer for deeper insights');

  console.log('\n  🎯 Loading Performance:');
  console.log('    - Preload critical resources');
  console.log('    - Use resource hints (dns-prefetch, preconnect)');
  console.log('    - Implement service worker caching');
  console.log('    - Enable HTTP/2 server push');

  console.log('\n  🖼️  Asset Optimization:');
  console.log('    - Use WebP/AVIF for images');
  console.log('    - Implement responsive images');
  console.log('    - Use CSS sprites for small icons');
  console.log('    - Enable asset compression (gzip/brotli)');

  console.log('\n🔧 Available Commands:');
  console.log('  bun run build                  # Build with optimizations');
  console.log('  bun run bundle:analyze         # Run this analysis');
  console.log('  bun run fonts:subset           # Optimize font files');
  console.log('  bun run performance:summary    # Mobile performance report');
}

function main() {
  console.log('🎯 Enhanced Bundle Analysis for Vite\n');

  const results = analyzeViteAssets();
  displayResults(results);
  analyzeFontOptimization();
  showPerformanceTips();

  console.log(
    '\n✨ Analysis complete! Use the recommendations above to optimize your bundle.'
  );
}

main();
