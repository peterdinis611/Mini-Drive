/**
 * Steady load against public + health endpoints.
 *
 *   pnpm start   # in another terminal
 *   pnpm test:k6
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { jsonHealthOk, okStatus } from './lib/checks.ts'
import { url } from './lib/env.ts'
import { randomToken } from './lib/random.ts'

export const options: Options = {
  scenarios: {
    public_mix: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    mini_drive_errors: ['rate<0.1'],
    mini_drive_health_ms: ['p(95)<800'],
  },
}

export default function load(): void {
  const roll = Math.random()

  if (roll < 0.35) {
    jsonHealthOk(http.get(url('/api/health'), { tags: { name: 'health' } }))
  } else if (roll < 0.6) {
    okStatus(http.get(url('/'), { tags: { name: 'landing' } }))
  } else if (roll < 0.75) {
    okStatus(http.get(url('/robots.txt'), { tags: { name: 'robots' } }))
    okStatus(http.get(url('/sitemap.xml'), { tags: { name: 'sitemap' } }))
  } else if (roll < 0.9) {
    const token = randomToken(24)
    okStatus(
      http.get(url(`/s/${token}`), { tags: { name: 'share_gone' } }),
      [200, 410],
    )
  } else {
    const token = randomToken(24)
    okStatus(
      http.get(url(`/e/${token}`), { tags: { name: 'embed_gone' } }),
      [200, 404, 410],
    )
  }

  sleep(0.3 + Math.random() * 0.7)
}
