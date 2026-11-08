/**
 * Soak — sustained moderate load to surface leaks / pool exhaustion.
 *
 *   pnpm test:k6:soak
 *   SOAK_DURATION=10m SOAK_VUS=20 pnpm test:k6:soak
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { okStatus } from './lib/checks.ts'
import { envDuration, envInt, url } from './lib/env.ts'
import { hitProbe } from './lib/hit.ts'
import { PUBLIC_PROBES, pickWeighted } from './lib/paths.ts'
import { randomToken } from './lib/random.ts'

const vus = envInt('SOAK_VUS', 12)
const duration = envDuration('SOAK_DURATION', '5m')

export const options: Options = {
  scenarios: {
    soak: {
      executor: 'constant-vus',
      vus,
      duration,
      gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.08'],
    http_req_duration: ['p(95)<2500', 'p(99)<5000'],
    mini_drive_errors: ['rate<0.08'],
    mini_drive_health_ms: ['p(95)<1000'],
  },
}

export default function soak(): void {
  const roll = Math.random()

  if (roll < 0.7) {
    hitProbe(
      pickWeighted(
        PUBLIC_PROBES,
        PUBLIC_PROBES.map((p) => (p.name === 'health' ? 3 : 1)),
      ),
    )
  } else if (roll < 0.9) {
    okStatus(
      http.get(url(`/s/k6-soak-${randomToken(12)}`), {
        tags: { name: 'share_gone' },
      }),
      [200, 410],
    )
  } else {
    okStatus(
      http.get(url(`/e/k6-soak-${randomToken(12)}`), {
        tags: { name: 'embed_gone' },
      }),
      [200, 404, 410],
    )
  }

  sleep(0.4 + Math.random() * 0.8)
}
