/**
 * Probe embed resolve under the same SHARE_RATE_LIMIT (30 / 60s per IP).
 * Missing tokens → 200/404/410; burst should eventually see 429.
 *
 *   pnpm test:k6:embed-rate
 */

import { check, sleep } from 'k6'
import http from 'k6/http'
import { Counter } from 'k6/metrics'
import type { Options } from 'k6/options'

import { url } from './lib/env.ts'
import { randomToken } from './lib/random.ts'

const limited = new Counter('embed_rate_limited')
const gone = new Counter('embed_gone')

export const options: Options = {
  vus: 1,
  iterations: 80,
  thresholds: {
    embed_rate_limited: ['count>0'],
    embed_gone: ['count>0'],
  },
}

export default function embedRate(): void {
  const token = `k6-e-${randomToken(16)}`
  const res = http.get(url(`/e/${token}`), {
    tags: { name: 'embed_rate_probe' },
  })

  check(res, {
    'embed responded': (r) => [200, 404, 410, 429].includes(r.status),
  })

  if (res.status === 429) limited.add(1)
  if (res.status === 410 || res.status === 404 || res.status === 200) {
    gone.add(1)
  }

  sleep(0.05)
}
