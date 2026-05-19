import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://test.placeholder.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-placeholder-service-role-key',
      FRONTEND_URL: 'http://localhost:5173',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
  },
})
