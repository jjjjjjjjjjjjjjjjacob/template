#!/usr/bin/env node

/**
 * Hybrid Font Optimization
 * - Only processes fonts that need conversion
 * - Skips already optimized WOFF2 files
 */

import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
  // statSync,
} from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');
const OPTIMIZED_FONTS_DIR = join(PUBLIC_FONTS_DIR, 'optimized');
const CSS_OUTPUT = join(__dirname, '../src/styles/fonts.css');

const FONTS_CONFIG = [
  {
    name: 'GeistSans',
    file: 'GeistSans-Variable.woff2',
    skipOptimization: true, // Already WOFF2
  },
  {
    name: 'GeistMono',
    file: 'GeistMono-Variable.woff2',
    skipOptimization: true, // Already WOFF2
  },
];

function getPyftsubsetPath() {
  try {
    execSync('pyftsubset --help', {
      stdio: 'ignore',
      timeout: 5000, // 5 second timeout
    });
    return 'pyftsubset';
  } catch {
    try {
      execSync('/Users/jacob/Library/Python/3.9/bin/pyftsubset --help', {
        stdio: 'ignore',
        timeout: 5000, // 5 second timeout
      });
      return '/Users/jacob/Library/Python/3.9/bin/pyftsubset';
    } catch {
      return null;
    }
  }
}

function quickSubset(inputPath, outputPath, unicodeRange) {
  const pyftsubset = getPyftsubsetPath();
  if (!pyftsubset) {
    // console.warn('⚠️  pyftsubset not found, copying original file');
    copyFileSync(inputPath, outputPath);
    return;
  }

  const cmd = `${pyftsubset} "${inputPath}" --output-file="${outputPath}" --flavor=woff2 --unicodes="${unicodeRange}" --no-hinting --desubroutinize`;

  try {
    execSync(cmd, {
      stdio: 'pipe',
      timeout: 30000, // 30 second timeout
      encoding: 'utf8',
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.warn('⚠️  Subsetting failed, copying original');
    copyFileSync(inputPath, outputPath);
  }
}

function generateCSS(processedFonts) {
  let css = `/* Hybrid Font Loading - Fast & Optimized */

`;

  // Add font-face rules
  processedFonts.forEach((font) => {
    if (font.skipInCSS) return; // Skip fonts we'll add manually

    const fontPath = `/fonts/optimized/${font.outputName}`;

    css += `@font-face {
  font-family: '${font.name}';
  src: url('${fontPath}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;${font.unicodeRange ? `\n  unicode-range: ${font.unicodeRange};` : ''}
}

`;
  });

  css += `
/* Font Stacks */
:root {
  --font-sans: 'GeistSans', system-ui, -apple-system, sans-serif;
  --font-mono: 'GeistMono', ui-monospace, monospace;
}

/* Apply font to common elements */
body {
  font-family: var(--font-sans);
}`;

  return css;
}

// function formatBytes(bytes) {
//   return (bytes / 1024).toFixed(1) + ' KB';
// }

async function main() {
  // console.log('🚀 Hybrid Font Optimization (Fast Mode)\n');
  // const startTime = Date.now();

  mkdirSync(OPTIMIZED_FONTS_DIR, { recursive: true });

  const processedFonts = [];

  for (const font of FONTS_CONFIG) {
    const inputPath = join(PUBLIC_FONTS_DIR, font.file);
    if (!existsSync(inputPath)) {
      // console.warn(`⚠️  Font not found: ${font.file}`);
      continue;
    }

    // const inputSize = statSync(inputPath).size;
    // console.log(`📁 ${font.name} (${formatBytes(inputSize)})`);

    if (font.skipOptimization) {
      // Just copy WOFF2 files
      const outputName = basename(font.file);
      const outputPath = join(OPTIMIZED_FONTS_DIR, outputName);

      copyFileSync(inputPath, outputPath);
      // console.log(`   ✅ Copied (already optimized)\n`);

      processedFonts.push({ ...font, outputName });
    } else {
      // Convert TTF to WOFF2 with subsetting
      const outputName = basename(font.file, '.ttf') + '.woff2';
      const outputPath = join(OPTIMIZED_FONTS_DIR, outputName);

      // console.log(`   ⚙️  Converting to WOFF2...`);
      quickSubset(inputPath, outputPath, font.unicodeRange || 'U+0000-00FF');

      // const outputSize = existsSync(outputPath) ? statSync(outputPath).size : 0;
      // const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
      // console.log(
      //   `   ✅ Optimized to ${formatBytes(outputSize)} (${savings}% smaller)\n`
      // );

      processedFonts.push({ ...font, outputName });
    }
  }

  // Generate CSS
  // console.log('📝 Generating CSS...');
  const css = generateCSS(processedFonts);
  writeFileSync(CSS_OUTPUT, css);

  // const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  // console.log(`\n✅ Complete in ${duration}s!`);

  // console.log('\n🎯 Optimizations Applied:');
  // console.log('   • WOFF2 fonts used directly (no re-processing)');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
main().catch((e) => {
  // console.error(e);
  process.exit(1);
});
