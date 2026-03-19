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
    maxConcurrency: 4,
    cache: {
      dir: 'cacheDir/vitest',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      ignoreEmptyLines: true,
      all: true, // 统计所有文件
      include: [
        'src/app/**/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}', // 如果有这个目录
      ],
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**', // 排除测试文件本身
        '**/*.config.*',
        '**/coverage/**',
        '**/cacheDir/**', // 排除缓存
        '**/stories/**', // 排除 Storybook stories
        '**/*.mock.*', // 排除 mock 文件
      ],
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
