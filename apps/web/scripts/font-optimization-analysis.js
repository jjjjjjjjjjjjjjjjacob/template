#!/usr/bin/env node

/**
 * Font Optimization Analysis Tool
 * Analyzes font usage, provides optimization recommendations, and measures performance impact
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
// import { execSync as _execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const OPTIMIZED_FONTS_DIR = join(PUBLIC_FONTS_DIR, 'optimized');
const SRC_DIR = join(__dirname, '../src');

// ANSI color codes for better output
// Color constants removed - not used

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function getFileSize(filePath) {
  try {
    if (existsSync(filePath)) {
      return statSync(filePath).size;
    }
  } catch {
    // console.warn(`Could not get size for ${filePath}:`, error.message);
  }
  return 0;
}

function analyzeFontFiles() {
  // console.log(
  //   `${colors.blue}${colors.bold}📊 Font File Analysis${colors.reset}\n`
  // );

  const fonts = [];

  // Analyze original fonts
  if (existsSync(PUBLIC_FONTS_DIR)) {
    const files = readdirSync(PUBLIC_FONTS_DIR).filter(
      (file) => /\\.(woff2?|ttf|otf|eot)$/i.test(file) && !file.startsWith('.')
    );

    files.forEach((file) => {
      const filePath = join(PUBLIC_FONTS_DIR, file);
      const size = getFileSize(filePath);
      const ext = extname(file).toLowerCase();

      fonts.push({
        name: file,
        path: filePath,
        size,
        type: 'original',
        format: ext.slice(1),
        optimized: false,
      });
    });
  }

  // Analyze optimized fonts
  if (existsSync(OPTIMIZED_FONTS_DIR)) {
    const files = readdirSync(OPTIMIZED_FONTS_DIR).filter((file) =>
      /\\.(woff2?|ttf|otf)$/i.test(file)
    );

    files.forEach((file) => {
      const filePath = join(OPTIMIZED_FONTS_DIR, file);
      const size = getFileSize(filePath);
      const ext = extname(file).toLowerCase();

      fonts.push({
        name: file,
        path: filePath,
        size,
        type: 'optimized',
        format: ext.slice(1),
        optimized: true,
      });
    });
  }

  return fonts;
}

function analyzeFontUsage() {
  // console.log(
  //   `${colors.blue}${colors.bold}🔍 Font Usage Analysis${colors.reset}\n`
  // );

  const fontReferences = new Map();
  const cssClasses = new Set();

  function scanDirectory(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !entry.name.startsWith('.') &&
          entry.name !== 'node_modules'
        ) {
          scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          /\\.(tsx?|jsx?|css|scss)$/i.test(entry.name)
        ) {
          scanFile(fullPath);
        }
      });
    } catch {
      // console.warn(`Could not scan directory ${dir}:`, error.message);
    }
  }

  function scanFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');

      // Find font-family references
      const fontFamilyRegex = /font-family:\\s*([^;]+)/gi;
      let match;
      while ((match = fontFamilyRegex.exec(content)) !== null) {
        const fonts = match[1]
          .split(',')
          .map((f) => f.trim().replace(/['"]/g, ''))
          .filter(
            (f) =>
              f &&
              !f.includes('system') &&
              !f.includes('sans-serif') &&
              !f.includes('monospace')
          );

        fonts.forEach((font) => {
          if (!fontReferences.has(font)) {
            fontReferences.set(font, []);
          }
          fontReferences.get(font).push(filePath);
        });
      }

      // Find CSS utility classes
      const classRegex = /className.*?['"](.*?)['"]|class.*?['"](.*?)['"]/gi;
      while ((match = classRegex.exec(content)) !== null) {
        const classes = (match[1] || match[2] || '')
          .split(/\\s+/)
          .filter(Boolean);
        classes.forEach((cls) => {
          if (cls.includes('font-') || cls.includes('text-')) {
            cssClasses.add(cls);
          }
        });
      }
    } catch {
      // Ignore files that can't be read
    }
  }

  scanDirectory(SRC_DIR);

  return { fontReferences, cssClasses };
}

function generateOptimizationRecommendations(fonts, usage) {
  // console.log(
  //   `${colors.yellow}${colors.bold}💡 Optimization Recommendations${colors.reset}\n`
  // );

  const recommendations = [];

  // Check for unused fonts
  const usedFonts = new Set(usage.fontReferences.keys());
  const availableFonts = fonts
    .filter((f) => f.type === 'original')
    .map((f) => f.name.replace(/\\.[^.]+$/, ''));

  availableFonts.forEach((font) => {
    if (!Array.from(usedFonts).some((used) => used.includes(font))) {
      recommendations.push({
        type: 'unused',
        severity: 'medium',
        message: `Font "${font}" appears to be unused and can be removed`,
        action: `Remove ${font} font files to reduce bundle size`,
      });
    }
  });

  // Check for missing optimized versions
  const originalFonts = fonts.filter((f) => f.type === 'original');
  const optimizedFonts = fonts.filter((f) => f.type === 'optimized');

  originalFonts.forEach((font) => {
    const hasOptimized = optimizedFonts.some((opt) =>
      opt.name.includes(font.name.replace(/\\.[^.]+$/, ''))
    );

    if (!hasOptimized && font.size > 100 * 1024) {
      // > 100KB
      recommendations.push({
        type: 'missing_optimization',
        severity: 'high',
        message: `Large font "${font.name}" (${formatSize(font.size)}) has no optimized version`,
        action: 'Run font optimization script: bun run fonts:subset',
      });
    }
  });

  // Check for format optimization
  const nonWoff2Fonts = fonts.filter(
    (f) => f.format !== 'woff2' && f.size > 50 * 1024
  );
  nonWoff2Fonts.forEach((font) => {
    recommendations.push({
      type: 'format_optimization',
      severity: 'medium',
      message: `Font "${font.name}" is not in WOFF2 format (${formatSize(font.size)})`,
      action: 'Convert to WOFF2 for better compression',
    });
  });

  // Check total font size
  const totalSize = fonts.reduce((sum, font) => sum + font.size, 0);
  if (totalSize > 2 * 1024 * 1024) {
    // > 2MB
    recommendations.push({
      type: 'total_size',
      severity: 'high',
      message: `Total font size is ${formatSize(totalSize)}, which may impact performance`,
      action: 'Consider font subsetting or using fewer font variants',
    });
  }

  return recommendations;
}

function generatePerformanceReport() {
  // console.log(
  //   `${colors.green}${colors.bold}📈 Performance Impact Report${colors.reset}\n`
  // );
  // const _originalSize = originalFonts.reduce((sum, font) => sum + font.size, 0);
  // const _optimizedSize = optimizedFonts.reduce(
  //   (sum, font) => sum + font.size,
  //   0
  // );
  // const _savings = originalSize - optimizedSize;
  // const _savingsPercent =
  //   originalSize > 0 ? ((savings / originalSize) * 100).toFixed(1) : 0;
  // console.log(`Original fonts: ${formatSize(originalSize)}`);
  // console.log(`Optimized fonts: ${formatSize(optimizedSize)}`);
  // console.log(
  //   `${colors.green}Size reduction: ${formatSize(savings)} (${savingsPercent}%)${colors.reset}`
  // );
  // Performance reporting disabled - functionality commented out
}

function generateWebVitalsImpact(fonts) {
  // console.log(
  //   `\\n${colors.blue}${colors.bold}🎯 Core Web Vitals Impact${colors.reset}\\n`
  // );

  const totalSize = fonts.reduce((sum, font) => sum + font.size, 0);

  // LCP (Largest Contentful Paint) impact
  // let _lcpImpact = 'Good';
  // let _lcpColor = colors.green;
  if (totalSize > 1024 * 1024) {
    // > 1MB
    // _lcpImpact = 'Needs Improvement';
    // _lcpColor = colors.yellow;
  }
  if (totalSize > 2 * 1024 * 1024) {
    // > 2MB
    // _lcpImpact = 'Poor';
    // _lcpColor = colors.red;
  }

  // console.log(
  //   `LCP Impact: ${lcpColor}${lcpImpact}${colors.reset} (${formatSize(totalSize)} total)`
  // );

  // CLS (Cumulative Layout Shift) recommendations
  // const _hasOptimalDisplay = fonts.some(
  //   (f) => f.name.includes('fallback') || f.name.includes('optional')
  // );
  // const _clsRecommendation = hasOptimalDisplay
  //   ? `${colors.green}Good${colors.reset} - Using optimal font-display strategies`
  //   : `${colors.yellow}Consider${colors.reset} - Add font-display: fallback for critical fonts`;

  // console.log(`CLS Prevention: ${clsRecommendation}`);

  // FID (First Input Delay) impact
  // const _hasPreload = true; // Assuming preload is implemented
  // const _fidImpact = hasPreload
  //   ? `${colors.green}Good${colors.reset} - Critical fonts are preloaded`
  //   : `${colors.yellow}Improve${colors.reset} - Add preload for critical fonts`;

  // console.log(`FID Optimization: ${fidImpact}`);
}

async function main() {
  // console.log(
  //   `${colors.bold}🎨 Font Optimization Analysis Tool${colors.reset}\\n`
  // );

  // Analyze font files
  const fonts = analyzeFontFiles();

  if (fonts.length === 0) {
    // console.log(
    //   `${colors.yellow}No font files found in ${PUBLIC_FONTS_DIR}${colors.reset}`
    // );
    return;
  }

  // console.log(`Found ${fonts.length} font files:`);
  // Font listing functionality disabled
  // console.log();

  // Analyze font usage
  const usage = analyzeFontUsage();
  // console.log(`Font usage in codebase:`);
  // Font reference listing disabled
  // console.log();

  // Generate recommendations
  generateOptimizationRecommendations(fonts, usage);
  // Recommendations display disabled

  // Generate performance report
  generatePerformanceReport();

  // Web Vitals impact
  generateWebVitalsImpact(fonts);

  // console.log(`\\n${colors.bold}🚀 Next Steps:${colors.reset}`);
  // console.log(`1. Run: bun run fonts:subset (if not already done)`);
  // console.log(`2. Run: bun run bundle:analyze (to check bundle impact)`);
  // console.log(`3. Test font loading with DevTools Network throttling`);
  // console.log(`4. Monitor Core Web Vitals in production\\n`);
}

main().catch(() => {});
