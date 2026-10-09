import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/server/**'],
      exclude: ['**/*.test.{ts,tsx}', '**/index.ts', '**/*.types.ts'],
      // Seuils du domaine (plan de la phase 2, lot 8).
      thresholds: { lines: 95, branches: 90 },
    },
  },
});
