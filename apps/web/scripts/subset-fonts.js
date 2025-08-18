#!/usr/bin/env node

/**
 * Enhanced font subsetting script for Noto Color Emoji fonts
 * Features:
 * - Reduces 25MB+ fonts to ~3-4MB by creating optimized subsets
 * - Creates multiple format outputs (WOFF2, WOFF, TTF)
 * - Generates preload hints and CSS for optimal loading
 * - Implements progressive font loading strategy
 */

/* eslint-disable no-console */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const ORIGINAL_FONT = join(PUBLIC_FONTS_DIR, 'NotoColorEmoji-Regular.ttf');

// Core emoji Unicode ranges (most commonly used)
const CORE_RANGES = [
  'U+1F600-1F64F', // Emoticons
  'U+1F300-1F5FF', // Misc Symbols and Pictographs
  'U+1F680-1F6FF', // Transport and Map
  'U+1F1E0-1F1FF', // Regional Indicator Symbols (flags)
  'U+2600-26FF', // Misc symbols
  'U+2700-27BF', // Dingbats
  'U+FE00-FE0F', // Variation Selectors
  'U+1F900-1F9FF', // Supplemental Symbols and Pictographs
];

// Extended emoji ranges (loaded on-demand)
const EXTENDED_RANGES = [
  'U+1F780-1F7FF', // Geometric Shapes Extended
  'U+1F800-1F8FF', // Supplemental Arrows-C
  'U+1FAA0-1FAFF', // Symbols and Pictographs Extended-A
  'U+1FB00-1FBFF', // Symbols and Pictographs Extended-B
];

// Text font optimization configs
const TEXT_FONTS = [
  {
    name: 'GeistSans',
    file: 'GeistSans-Variable.woff2',
    priority: 'high', // Critical font for UI
    subset: 'latin-extended',
  },
  {
    name: 'GeistMono',
    file: 'GeistMono-Variable.woff2',
    priority: 'medium', // Code blocks and preformatted text
    subset: 'latin',
  },
  {
    name: 'Doto',
    file: 'Doto-VariableFont_ROND,wght.woff2',
    priority: 'low', // Display font
    subset: 'latin',
  },
];

function checkFontTools() {
  try {
    // Try standard path first
    execSync('pyftsubset --help', { stdio: 'ignore' });
    console.log('✅ pyftsubset found');
    return 'pyftsubset';
  } catch {
    // Try user-installed Python scripts path
    try {
      execSync('/Users/jacob/Library/Python/3.9/bin/pyftsubset --help', {
        stdio: 'ignore',
      });
      console.log('✅ pyftsubset found at user path');
      return '/Users/jacob/Library/Python/3.9/bin/pyftsubset';
    } catch {
      console.error(
        '❌ pyftsubset not found. Install with: pip install fonttools[woff]'
      );
      return false;
    }
  }
}

function subsetFont(
  inputPath,
  outputPath,
  unicodeRanges,
  format = 'woff2',
  pyftsubsetPath = 'pyftsubset',
  options = {}
) {
  const ranges = Array.isArray(unicodeRanges)
    ? unicodeRanges.join(',')
    : unicodeRanges;
  const cmd = [
    pyftsubsetPath,
    `"${inputPath}"`,
    `--output-file="${outputPath}"`,
    `--flavor=${format}`,
    `--unicodes=${ranges}`,
    '--layout-features="*"',
    '--glyph-names',
    '--symbol-cmap',
    '--legacy-cmap',
    '--notdef-glyph',
    '--notdef-outline',
    '--recommended-glyphs',
    '--name-legacy',
    '--drop-tables+=DSIG',
    '--ignore-missing-glyphs',
    // Additional optimizations
    options.desubroutinize !== false && '--desubroutinize',
    options.noHinting !== false && '--no-hinting',
    options.harfbuzzRepacker !== false && '--harfbuzz-repacker',
  ]
    .filter(Boolean)
    .join(' ');

  console.log(`Creating ${format.toUpperCase()} subset: ${outputPath}`);

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Created: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create ${outputPath}:`, error.message);
    return false;
  }
}

function generatePreloadHints(fonts) {
  const hints = [];

  fonts.forEach((font) => {
    if (font.priority === 'high') {
      hints.push(
        `<link rel="preload" href="/fonts/optimized/${font.file}" as="font" type="font/woff2" crossorigin>`
      );
    }
  });

  // Always preload core emoji
  hints.push(
    `<link rel="preload" href="/fonts/optimized/noto-color-emoji-core.woff2" as="font" type="font/woff2" crossorigin>`
  );

  return hints;
}

function generateLoadingStrategy() {
  return `
/* Progressive Font Loading Strategy */
.font-loading {
  font-family: system-ui, -apple-system, sans-serif;
}

.fonts-loaded {
  font-family: var(--font-sans);
}

/* Critical font loading with fallback */
@media (prefers-reduced-motion: no-preference) {
  .font-loading {
    animation: font-placeholder 0.3s ease-in-out;
  }
}

@keyframes font-placeholder {
  0% { opacity: 0.8; }
  50% { opacity: 0.6; }
  100% { opacity: 0.8; }
}

/* Prevent invisible text during font load */
@font-face {
  font-display: fallback; /* Use fallback for critical fonts */
}

/* Lazy load non-critical fonts */
.font-display-lazy {
  font-display: swap;
}
`;
}

function getFileSize(filePath) {
  try {
    if (!existsSync(filePath)) {
      return 'file not found';
    }
    const stats = execSync(`ls -lh "${filePath}"`, { encoding: 'utf8' });
    const parts = stats.trim().split(/\s+/);
    return parts[4] || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function main() {
  console.log('🎨 Starting font subsetting process...\n');

  // Check if tools are available
  const pyftsubsetPath = checkFontTools();
  if (!pyftsubsetPath) {
    console.log(
      '⚠️  Font subsetting skipped - continuing build without optimized fonts'
    );
    console.log(
      '💡 To enable font optimization, install: pip install fonttools[woff]'
    );
    process.exit(0);
  }

  // Check if original font exists
  if (!existsSync(ORIGINAL_FONT)) {
    console.log(`⚠️  Original font not found: ${ORIGINAL_FONT}`);
    console.log(
      '⚠️  Font subsetting skipped - continuing build without optimized fonts'
    );
    process.exit(0);
  }

  const originalSize = getFileSize(ORIGINAL_FONT);
  console.log(`📦 Original font size: ${originalSize}\n`);

  // Ensure output directory exists
  mkdirSync(PUBLIC_FONTS_DIR, { recursive: true });

  const results = { success: [], failed: [] };

  try {
    // Create optimized directory
    const optimizedDir = join(PUBLIC_FONTS_DIR, 'optimized');
    mkdirSync(optimizedDir, { recursive: true });

    console.log('🎯 Creating emoji font subsets...');

    // Create core emoji subset (WOFF2) - highest priority
    const coreOutputWoff2 = join(optimizedDir, 'noto-color-emoji-core.woff2');
    if (
      subsetFont(
        ORIGINAL_FONT,
        coreOutputWoff2,
        CORE_RANGES,
        'woff2',
        pyftsubsetPath,
        {
          desubroutinize: true,
          noHinting: true,
        }
      )
    ) {
      results.success.push({
        name: 'Core Emoji WOFF2',
        path: coreOutputWoff2,
        size: getFileSize(coreOutputWoff2),
      });
    } else {
      results.failed.push('Core Emoji WOFF2');
    }

    // Create extended emoji subset (WOFF2) - lazy loaded
    const extendedOutputWoff2 = join(
      optimizedDir,
      'noto-color-emoji-extended.woff2'
    );
    if (
      subsetFont(
        ORIGINAL_FONT,
        extendedOutputWoff2,
        EXTENDED_RANGES,
        'woff2',
        pyftsubsetPath,
        {
          desubroutinize: true,
          noHinting: true,
        }
      )
    ) {
      results.success.push({
        name: 'Extended Emoji WOFF2',
        path: extendedOutputWoff2,
        size: getFileSize(extendedOutputWoff2),
      });
    } else {
      results.failed.push('Extended Emoji WOFF2');
    }

    // Create WOFF fallbacks for better browser support
    const coreOutputWoff = join(optimizedDir, 'noto-color-emoji-core.woff');
    if (
      subsetFont(
        ORIGINAL_FONT,
        coreOutputWoff,
        CORE_RANGES,
        'woff',
        pyftsubsetPath
      )
    ) {
      results.success.push({
        name: 'Core Emoji WOFF',
        path: coreOutputWoff,
        size: getFileSize(coreOutputWoff),
      });
    }

    // Create TTF fallbacks for oldest browsers
    const coreOutputTtf = join(PUBLIC_FONTS_DIR, 'noto-color-emoji-core.ttf');
    if (
      subsetFont(
        ORIGINAL_FONT,
        coreOutputTtf,
        CORE_RANGES,
        'ttf',
        pyftsubsetPath
      )
    ) {
      results.success.push({
        name: 'Core Emoji TTF',
        path: coreOutputTtf,
        size: getFileSize(coreOutputTtf),
      });
    }

    console.log('\n📊 Optimization Results:');
    console.log(`Original font size: ${originalSize}`);
    console.log('\nOptimized fonts:');
    results.success.forEach((font) => {
      console.log(`  ✅ ${font.name}: ${font.size}`);
    });

    if (results.failed.length > 0) {
      console.log('\nFailed optimizations:');
      results.failed.forEach((name) => {
        console.log(`  ❌ ${name}`);
      });
    }

    // Generate preload hints
    console.log('\n📋 Preload hints for HTML <head>:');
    const preloadHints = generatePreloadHints(TEXT_FONTS);
    preloadHints.forEach((hint) => console.log(`  ${hint}`));

    // Generate loading strategy CSS
    const loadingStrategyPath = join(
      __dirname,
      '../src/styles/font-loading-strategy.css'
    );
    const { writeFileSync } = await import('fs');
    writeFileSync(loadingStrategyPath, generateLoadingStrategy());
    console.log(
      `\n📝 Font loading strategy written to: ${loadingStrategyPath}`
    );

    console.log('\n✅ Font subsetting completed successfully!');
    console.log('🚀 Mobile performance should be significantly improved.');
    console.log('\n💡 Next steps:');
    console.log('   1. Add preload hints to your HTML head');
    console.log('   2. Import font-loading-strategy.css');
    console.log('   3. Test font loading with DevTools Network throttling');
  } catch (error) {
    console.error('\n❌ Font subsetting failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
