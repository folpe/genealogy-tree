import { configDefaults, defineConfig } from 'vitest/config';

// Tests contre une vraie base (DATABASE_URL). Une seule base partagée : fichiers en série.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    exclude: configDefaults.exclude,
    globalSetup: ['./tests/integration/global-setup.ts'],
    fileParallelism: false,
  },
});
