import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    envDir: path.resolve(__dirname, '../..'), // Load .env files from root directory
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
    ],
    build: {
      rollupOptions: {
        treeshake: {
          preset: 'recommended',
          propertyReadSideEffects: false,
          moduleSideEffects: false,
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
    },
  };
});
