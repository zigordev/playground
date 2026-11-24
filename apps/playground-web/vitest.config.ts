import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'playground-web',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
