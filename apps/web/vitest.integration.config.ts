/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts', './src/test-utils/integration-setup.ts'],
    include: ['src/**/*.integration.test.{js,ts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    testTimeout: 10000, // 10 seconds for integration tests
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}{test,spec}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        // Project specific exclusions
        'src/entry-client.tsx',
        'src/entry-server.tsx',
        'src/ssr.tsx',
        'src/routeTree.gen.ts',
        'src/router.tsx',
        'src/client.tsx',
        'src/app.tsx',
        'src/mocks/**',
        'src/test-utils/**',
        'public/**',
        'scripts/**',
        '**/*.config.*',
        'src/lib/posthog.ts', // External service setup
        'src/utils/seo.ts', // SSR metadata helpers
        'src/components/posthog-*', // Analytics wrappers
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@template/convex': resolve(__dirname, '../convex'),
      '@template/types': resolve(__dirname, '../../packages/types/src'),
      '@template/utils': resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
