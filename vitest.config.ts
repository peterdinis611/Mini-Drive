import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#': path.resolve(rootDir, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/components/onboarding/**/*.tsx',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/lib/auth.ts',
        'src/lib/auth-client.ts',
        'src/lib/uploadthing.ts',
        // SSR session + canvas export — covered indirectly / hard in jsdom
        'src/lib/route-guards.ts',
        'src/lib/crop-image.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
})
