/**
 * Constant arrival rate — throughput-oriented (open model).
 *
 *   pnpm test:k6:arrival
 *   ARRIVAL_RATE=60 ARRIVAL_DURATION=2m pnpm test:k6:arrival
 */

import { sleep } from 'k6'
import type { Options } from 'k6/options'

import { envDuration, envInt } from './lib/env.ts'
import { hitProbe } from './lib/hit.ts'
import { PUBLIC_PROBES, pickWeighted } from './lib/paths.ts'

const rate = envInt('ARRIVAL_RATE', 40)
const duration = envDuration('ARRIVAL_DURATION', '90s')
const preAllocated = envInt('ARRIVAL_PRE_VUS', Math.min(rate, 50))
const maxVus = envInt('ARRIVAL_MAX_VUS', Math.max(rate * 2, 80))

export const options: Options = {
  scenarios: {
    arrival: {
      executor: 'constant-arrival-rate',
      rate,
      timeUnit: '1s',
      duration,
      preAllocatedVUs: preAllocated,
      maxVUs: maxVus,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.12'],
    http_req_duration: ['p(95)<3000'],
    mini_drive_errors: ['rate<0.12'],
    dropped_iterations: ['count<20'],
  },
}

export default function arrival(): void {
  hitProbe(
    pickWeighted(
      PUBLIC_PROBES,
      PUBLIC_PROBES.map((p) => {
        if (p.name === 'health') return 4
        if (p.name === 'landing') return 3
        return 1
      }),
    ),
  )
  // Tiny jitter so VU pool can recycle under arrival-rate.
  sleep(0.01)
}
