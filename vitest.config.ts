import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

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
    // Les tests contre une vraie base passent par `bun run test:integration`.
    exclude: [...configDefaults.exclude, 'src/**/*.integration.test.ts'],
    setupFiles: ['./tests/vitest.setup.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/server/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/index.ts',
        '**/*.types.ts',
        // Couverts par les tests d'intégration (`bun run test:integration`).
        '**/*.repository.ts',
        '**/*.service.ts',
        '**/*.instance.ts',
        // Adaptateur Vercel Blob (réseau) et chargement des photos de la reprise.
        'src/server/media/media.blob.ts',
        'src/server/migration/notion.media.ts',
        'src/server/auth/auth.ts',
        'src/server/db/client.ts',
        'src/server/db/schema/**',
        'src/server/db/migrations/**',
        'src/server/db/types.ts',
      ],
      // Seuils du domaine (plan de la phase 2, lot 8).
      thresholds: { lines: 95, branches: 90 },
    },
  },
});
