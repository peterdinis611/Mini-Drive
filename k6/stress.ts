/**
 * Stress — push past normal capacity; expect higher latency / some errors.
 *
 *   pnpm test:k6:stress
 *   STRESS_MAX_VUS=120 pnpm test:k6:stress
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { okStatus } from './lib/checks.ts'
import { envInt, url } from './lib/env.ts'
import { hitProbe } from './lib/hit.ts'
import { PUBLIC_PROBES, pickWeighted } from './lib/paths.ts'
import { randomToken } from './lib/random.ts'

const maxVus = envInt('STRESS_MAX_VUS', 80)

export const options: Options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '30s', target: Math.floor(maxVus / 2) },
        { duration: '40s', target: maxVus },
        { duration: '30s', target: maxVus },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    // Stress intentionally looser — still fail on collapse.
    http_req_failed: ['rate<0.35'],
    http_req_duration: ['p(95)<8000'],
    mini_drive_errors: ['rate<0.35'],
  },
}

export default function stress(): void {
  const roll = Math.random()

  if (roll < 0.55) {
    hitProbe(
      pickWeighted(
        PUBLIC_PROBES,
        PUBLIC_PROBES.map((p) =>
          p.name === 'landing' || p.name === 'health' ? 2 : 1,
        ),
      ),
    )
  } else if (roll < 0.8) {
    okStatus(
      http.get(url(`/s/k6-stress-${randomToken(16)}`), {
        tags: { name: 'share_gone' },
      }),
      [200, 410, 429],
    )
  } else {
    okStatus(
      http.get(url(`/e/k6-stress-${randomToken(16)}`), {
        tags: { name: 'embed_gone' },
      }),
      [200, 404, 410, 429],
    )
  }

  sleep(0.05 + Math.random() * 0.15)
}
