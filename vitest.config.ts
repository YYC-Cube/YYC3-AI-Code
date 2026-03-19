import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Optimize test performance
    maxConcurrency: 4,
    cache: {
      dir: '.vitest_cache',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Ignore empty lines to improve percentage accuracy
      ignoreEmptyLines: true,
      // Check all files, even uncovered ones
      all: true,
      include: [
        'src/app/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**', // Exclude test files from coverage
        '**/*.config.*',
        '**/coverage/**',
      ],
      // Thresholds (optional, set high to encourage quality)
      thresholds: {
        statements: 10,
        branches: 10,
        functions: 10,
        lines: 10,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
