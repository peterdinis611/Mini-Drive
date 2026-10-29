import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

// Prefer localhost over 127.0.0.1 — Vite binds IPv6 ::1 by default on macOS.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const port = (() => {
  try {
    return new URL(baseURL).port || '3000'
  } catch {
    return '3000'
  }
})()

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `pnpm exec vite dev --port ${port} --strictPort`,
        // Static asset readiness — `/api/health` is 503 when Postgres is down (Docker off).
        url: `${baseURL}/favicon.svg`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
