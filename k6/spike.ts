/**
 * Short spike — sudden VU jump on health + landing.
 *
 *   pnpm test:k6:spike
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { jsonHealthOk, okStatus } from './lib/checks.ts'
import { url } from './lib/env.ts'

export const options: Options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '5s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 5 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.2'],
    http_req_duration: ['p(95)<3000'],
    mini_drive_errors: ['rate<0.2'],
  },
}

export default function spike(): void {
  if (Math.random() < 0.5) {
    jsonHealthOk(http.get(url('/api/health'), { tags: { name: 'health' } }))
  } else {
    okStatus(http.get(url('/'), { tags: { name: 'landing' } }))
  }
  sleep(0.1)
}
