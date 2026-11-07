/**
 * Steady load against public + health endpoints.
 *
 *   pnpm start   # in another terminal
 *   pnpm test:k6
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { okStatus } from './lib/checks.ts'
import { url } from './lib/env.ts'
import { hitProbe } from './lib/hit.ts'
import { pickWeighted, PUBLIC_PROBES } from './lib/paths.ts'
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

  if (roll < 0.55) {
    hitProbe(
      pickWeighted(
        PUBLIC_PROBES,
        PUBLIC_PROBES.map((p) => {
          if (p.name === 'health') return 4
          if (p.name === 'landing') return 3
          if (p.name === 'sign_in' || p.name === 'sign_up') return 2
          return 1
        }),
      ),
    )
  } else if (roll < 0.8) {
    okStatus(
      http.get(url(`/s/${randomToken(24)}`), { tags: { name: 'share_gone' } }),
      [200, 410],
    )
  } else {
    okStatus(
      http.get(url(`/e/${randomToken(24)}`), { tags: { name: 'embed_gone' } }),
      [200, 404, 410],
    )
  }

  sleep(0.3 + Math.random() * 0.7)
}
