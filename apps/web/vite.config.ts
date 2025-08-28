import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Simple performance monitoring plugin
const performancePlugin = () => {
  let buildStart = 0;
  return {
    name: 'performance-monitor',
    buildStart() {
      buildStart = Date.now();
      console.log('🏗️  Build started with performance monitoring');
    },
    writeBundle(_options: any, bundle: any) {
      const buildTime = (Date.now() - buildStart) / 1000;
      const bundleSize = Object.values(bundle).reduce(
        (sum: number, chunk: any) => {
          return sum + (chunk.code ? chunk.code.length : 0);
        },
        0
      );

      console.log(`⚡ Build completed in ${buildTime.toFixed(2)}s`);
      console.log(`📦 Bundle size: ${(bundleSize / 1024).toFixed(1)}KB`);

      // Save basic metrics
      if (process.env.PERF_MONITOR === 'true') {
        const metrics = {
          timestamp: new Date().toISOString(),
          buildTime,
          bundleSize,
          chunkCount: Object.keys(bundle).length,
        };

        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const fs = require('fs');
          fs.writeFileSync(
            path.resolve(process.cwd(), 'build-metrics.json'),
            JSON.stringify(metrics, null, 2)
          );
        } catch (error) {
          console.warn('Could not save build metrics:', error.message);
        }
      }
    },
  };
};

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    envDir: path.resolve(__dirname, '../..'), // Load .env files from root directory
    server: {
      port: 3030,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart({
        target: 'cloudflare-module',
        customViteReactPlugin: true,
      }),
      react(),
      // Add performance monitoring in production builds
      ...(isProduction ? [performancePlugin()] : []),
    ],
    build: {
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
          propertyReadSideEffects: false,
          moduleSideEffects: false,
        },
        // Exclude test files and test utilities from production bundle
        external: [
          /\.test\.(ts|tsx|js|jsx)$/,
          /\.spec\.(ts|tsx|js|jsx)$/,
          /__tests__/,
          /vitest/,
          /@testing-library/,
        ],
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core React chunk - always needed for SSR
          'react-vendor': ['react', 'react-dom'],

          // TanStack routing and state management
          'tanstack-vendor': [
            '@tanstack/react-router',
            '@tanstack/react-query',
            '@tanstack/react-start',
            '@tanstack/react-router-with-query',
          ],

          // Three.js and 3D graphics - lazy loaded
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],

          // Radix UI components - loaded on demand
          'radix-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],

          // Utilities and small libraries
          'utils-vendor': [
            '@template/utils',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'zod',
            'tiny-invariant',
          ],

          // Data visualization - lazy loaded for admin
          'charts-vendor': [
            'recharts',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
          ],

          // Client-only features
          'client-vendor': [
            'posthog-js',
            'lucide-react',
            'next-themes',
            'sonner',
            'vaul',
            'zustand',
          ],

          // Form handling
          'forms-vendor': ['react-hook-form', '@hookform/resolvers'],
        },
        output: {
          // Optimize asset file names and paths
          assetFileNames: (assetInfo) => {
            // Optimize font file names and paths
            if (
              assetInfo.name &&
              /\.(woff|woff2|ttf|otf|eot)$/.test(assetInfo.name)
            ) {
              return 'fonts/[name]-[hash][extname]';
            }
            // Optimize images
            if (
              assetInfo.name &&
              /\.(png|jpg|jpeg|svg|gif|webp|avif)$/.test(assetInfo.name)
            ) {
              return 'images/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },

          // Optimize chunk file names
          chunkFileNames: 'js/[name]-[hash].js',

          // Optimize entry file names
          entryFileNames: 'js/[name]-[hash].js',

          // Additional output optimizations
          compact: true,
        },
      },
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      // Optimize asset handling
      assetsInlineLimit: 2048, // Reduce inline limit to decrease bundle size
      // Configure chunk size warnings
      chunkSizeWarningLimit: 400,
      // Enable compression-friendly output
      reportCompressedSize: true,
      // CSS code splitting
      cssCodeSplit: true,
    },
    ssr: {
      noExternal: ['posthog-js', 'posthog-js/react', 'qrcode'],
      // Externalize heavy client-only dependencies for SSR
      external: ['next-themes', 'zustand', 'recharts'],
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        // Core React (always needed for SSR)
        'react',
        'react-dom',
        '@tanstack/react-router',
        '@tanstack/react-query',
        '@tanstack/react-start',
        // Essential utilities (small and frequently used)
        'clsx',
        'tailwind-merge',
        'zod',
        'tiny-invariant',
        // Convex (critical for data fetching)
        'convex',
        '@convex-dev/react-query',
        // Authentication (needed early)
        '@clerk/tanstack-react-start',
        // Essential UI components
        'class-variance-authority',
      ],
      exclude: [
        // Heavy dependencies that should be lazy loaded
        '@tanstack/react-table',
        'lucide-react', // Icons can be loaded on demand
        'recharts', // Charts loaded on demand for admin
        // Development tools
        '@tanstack/react-query-devtools',
        '@tanstack/react-router-devtools',
        // Analytics (loaded asynchronously anyway)
        'posthog-js',
        'posthog-js/react',
        // Form libraries - loaded on demand
        'react-hook-form',
        '@hookform/resolvers',
        // Client-only UI libraries
        'next-themes',
        'sonner',
        'vaul',
      ],
    },

    // Enable additional optimizations
    esbuild: {
      // Remove console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
      // Enable more aggressive minification
      legalComments: 'none',
      // Support for latest JS features
      target: 'es2020',
    },

    // Additional performance optimizations
    define: {
      // Remove development-only code in production
      __DEV__: JSON.stringify(!isProduction),
      // Build-time performance monitoring
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Enable performance monitoring via environment variable
    ...(process.env.PERF_MONITOR === 'true' &&
      isProduction &&
      {
        // Performance monitoring will be loaded dynamically during build
      }),
  };
});
