import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'playground-api-client:db',
    include: ['src/**/*.db.test.ts'],
    globalSetup: ['../../apps/playground-api/global-setup.ts'],
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
