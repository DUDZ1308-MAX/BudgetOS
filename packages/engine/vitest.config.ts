import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'engine',
    root: '.',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/types.ts', 'src/index.ts'],
      thresholds: {
        statements: 88,
        branches: 68,
        functions: 90,
        lines: 88,
      },
    },
  },
});
