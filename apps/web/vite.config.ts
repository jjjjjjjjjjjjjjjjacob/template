import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  define: {
    // Enable/disable features based on build mode
    __DEV__: mode === 'development',
    __PROD__: mode === 'production',
  },
  server: {
    port: 3000,
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
    // Bundle analysis - only in production builds
    process.env.NODE_ENV === 'production' &&
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
        moduleSideEffects: (id) => {
          // Keep side effects for CSS modules and PostHog
          return id.includes('.css') || id.includes('posthog');
        },
        tryCatchDeoptimization: false,
      },
      output: {
        // Enhanced manual chunks for optimal caching and loading
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            if (id.includes('three') || id.includes('@types/three')) {
              return 'vendor-3d';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('posthog') || id.includes('web-vitals')) {
              return 'vendor-analytics';
            }
            if (id.includes('@clerk')) {
              return 'vendor-auth';
            }
            // Group remaining node_modules into a general vendor chunk
            return 'vendor-misc';
          }

          // Feature-based chunking for better cache granularity
          if (id.includes('/features/auth/')) {
            return 'feature-auth';
          }
          if (id.includes('/features/admin/')) {
            return 'feature-admin';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
        },
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.facadeModuleId?.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        entryFileNames: 'entry/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1] || '';

          if (/\.(woff2?|eot|ttf|otf)$/i.test(extType)) {
            return 'fonts/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|svg|gif|ico|webp)$/i.test(extType)) {
            return 'images/[name]-[hash].[ext]';
          }
          if (/\.(css)$/i.test(extType)) {
            return 'styles/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
      onwarn(warning, warn) {
        // Suppress chunk size warnings since we handle them via performance budgets
        if (warning.code === 'BUNDLE_SIZE_EXCEEDED') {
          return;
        }
        // Suppress eval warnings for development tools
        if (warning.code === 'EVAL' && warning.id?.includes('node_modules')) {
          return;
        }
        warn(warning);
      },
    },
    target: 'es2022', // Updated for better modern browser support
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    // Performance budgets to catch bundle size issues early
    chunkSizeWarningLimit: 250, // 250KB warning for individual chunks
    assetsInlineLimit: 4096, // 4KB inline limit for small assets
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Enable asset optimization
    assetsDir: 'assets',
  },
  // Enhanced performance optimization settings
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-router',
      '@tanstack/react-query',
      'posthog-js',
      'web-vitals',
      'framer-motion',
      'lucide-react',
      'date-fns',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
    exclude: [
      '@template/convex', // Keep Convex external to avoid SSR issues
      'three', // Three.js is large and should be chunked separately
    ],
    // Force re-optimization on dependency changes
    force: process.env.NODE_ENV === 'development',
    // Pre-bundle dependencies for faster dev server startup
    entries: ['./src/entry-client.tsx', './src/routes/**/*.tsx'],
  },

  // Enhanced caching for better development performance
  cacheDir: 'node_modules/.vite',

  // Production-only optimizations
  ...(process.env.NODE_ENV === 'production' && {
    esbuild: {
      // Remove console logs and debugger statements in production
      drop: ['console', 'debugger'],
      // Optimize for smaller bundle size
      legalComments: 'none',
    },
  }),
}));
