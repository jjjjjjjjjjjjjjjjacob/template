#!/usr/bin/env node

/**
 * Font subsetting script for Geist fonts only
 * Features:
 * - Optimizes Geist Sans and Geist Mono fonts
 * - Creates WOFF2 outputs for minimal size
 * - Generates CSS for optimal loading
 */

/* eslint-disable no-console */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_FONTS_DIR = join(__dirname, '../public/fonts');

// Geist font optimization configs
const GEIST_FONTS = [
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
];

function checkFontTools() {
  try {
    // Try standard path first
    execSync('pyftsubset --help', { stdio: 'ignore' });
    console.log('✅ pyftsubset found');
    return 'pyftsubset';
  } catch {
    console.log('⚠️  pyftsubset not found. Install with: pip install fonttools[woff]');
    return null;
  }
}

function optimizeGeistFonts() {
  console.log('🔧 Optimizing Geist fonts...\n');
  
  const optimizedDir = join(PUBLIC_FONTS_DIR, 'optimized');
  if (!existsSync(optimizedDir)) {
    mkdirSync(optimizedDir, { recursive: true });
  }

  const pyftsubset = checkFontTools();
  if (!pyftsubset) {
    console.error('❌ Font tools not available. Please install fonttools.');
    process.exit(1);
  }

  const results = [];

  for (const font of GEIST_FONTS) {
    const inputPath = join(PUBLIC_FONTS_DIR, font.file);
    
    if (!existsSync(inputPath)) {
      console.log(`⚠️  ${font.file} not found, skipping...`);
      continue;
    }

    const outputPath = join(optimizedDir, font.file);
    
    try {
      // Basic optimization - these are already WOFF2 files
      const command = `${pyftsubset} "${inputPath}" --output-file="${outputPath}" --flavor=woff2 --layout-features="*" --no-hinting --desubroutinize`;
      
      execSync(command, { stdio: 'ignore' });
      
      console.log(`✅ ${font.name} optimized successfully`);
      results.push(font);
    } catch (error) {
      console.log(`❌ Failed to optimize ${font.name}:`, error.message);
    }
  }

  // Generate CSS
  generateFontCSS(results);
  
  console.log(`\n✅ Geist font optimization complete!`);
  console.log(`Optimized fonts saved to: ${optimizedDir}`);
}

function generateFontCSS(fonts) {
  const cssPath = join(__dirname, '../src/styles/font-optimization.css');
  
  let css = `/* Geist Font Optimization - Generated */\n\n`;
  
  fonts.forEach(font => {
    css += `@font-face {
  font-family: '${font.name}';
  src: url('/fonts/optimized/${font.file}') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

`;
  });
  
  // Add font stack variables
  css += `:root {
  --font-geist-sans: 'GeistSans', system-ui, -apple-system, sans-serif;
  --font-geist-mono: 'GeistMono', ui-monospace, monospace;
}

/* Font loading optimization */
.font-loading {
  font-family: system-ui, -apple-system, sans-serif;
}

.fonts-loaded {
  font-family: var(--font-geist-sans);
}
`;

  writeFileSync(cssPath, css);
  console.log(`📄 CSS generated: ${cssPath}`);
}

// Run optimization
optimizeGeistFonts();