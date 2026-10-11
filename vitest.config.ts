import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: false,
    // Domaine et serveur en Node ; les composants déclarent `@vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/vitest.setup.ts'],
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
