/**
 * Health endpoint focus — pressure on DB pool / waitForDb.
 *
 *   pnpm test:k6:health
 *   HEALTH_VUS=30 HEALTH_DURATION=2m pnpm test:k6:health
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { jsonHealthOk } from './lib/checks.ts'
import { envDuration, envInt, url } from './lib/env.ts'

const vus = envInt('HEALTH_VUS', 20)
const duration = envDuration('HEALTH_DURATION', '90s')

export const options: Options = {
  scenarios: {
    health_pool: {
      executor: 'constant-vus',
      vus,
      duration,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    mini_drive_errors: ['rate<0.05'],
    mini_drive_health_ms: ['p(95)<1000', 'p(99)<2000'],
  },
}

export default function healthPool(): void {
  jsonHealthOk(http.get(url('/api/health'), { tags: { name: 'health' } }))
  sleep(0.05 + Math.random() * 0.1)
}
