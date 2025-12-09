import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Plugin to automatically resolve path aliases from tsconfig.json
  // This prevents duplication and keeps paths centralized (TECH-006 mitigation)
  plugins: [tsconfigPaths()],

  // Override esbuild target to ESNext
  esbuild: {
    target: 'esnext',
  },

  // Build configuration for Vite
  build: {
    target: 'esnext',
  },

  // Dependency optimization configuration
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: ['portfinder'],
  },

  test: {
    // Global test settings
    globals: true,

    // Test environment
    environment: 'node',

    // Test file patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],

    // Coverage configuration
    coverage: {
      // Use v8 for faster coverage collection
      provider: 'v8',

      // Coverage thresholds (AC: 12)
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },

      // Reporters for different outputs
      reporter: ['text', 'json', 'html', 'lcov'],

      // Output directory
      reportsDirectory: './coverage',

      // Files to include in coverage
      include: ['backend/src/**/*.ts', 'shared/src/**/*.ts'],

      // Files to exclude from coverage
      exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts', '**/index.ts', '**/types/**'],
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Timeout for async tests
    testTimeout: 10000,

    // Setup files
    setupFiles: [],
  },
});
