/**
 * Probe share resolve rate-limit (SHARE_RATE_LIMIT: 30 / 60s per IP).
 * Expects a mix of 200/410 and eventually 429 from a single VU hammering /s/*.
 *
 *   pnpm test:k6:share-rate
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter } from 'k6/metrics'

import { url } from './lib/env.js'
import { randomToken } from './lib/random.js'

const limited = new Counter('share_rate_limited')
const gone = new Counter('share_gone')

export const options = {
  vus: 1,
  iterations: 80,
  thresholds: {
    // At least some 429 once we exceed 30/min from one IP (same k6 process).
    share_rate_limited: ['count>0'],
    share_gone: ['count>0'],
  },
}

export default function shareRate() {
  const token = `k6-${randomToken(16)}`
  const res = http.get(url(`/s/${token}`), {
    tags: { name: 'share_rate_probe' },
  })

  check(res, {
    'share responded': (r) => [200, 410, 429].includes(r.status),
  })

  if (res.status === 429) limited.add(1)
  if (res.status === 410 || res.status === 200) gone.add(1)

  // Stay under wall-clock minute so the sliding window still sees the burst.
  sleep(0.05)
}
