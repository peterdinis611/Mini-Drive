/**
 * Guest guards — private routes must redirect, never 5xx.
 *
 *   pnpm test:k6:guest-guard
 */

import { sleep } from 'k6'
import type { Options } from 'k6/options'

import { hitProbe } from './lib/hit.ts'
import { GUEST_GUARD_PROBES } from './lib/paths.ts'

export const options: Options = {
  scenarios: {
    guest_guards: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 8 },
        { duration: '40s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    mini_drive_errors: ['rate<0.05'],
  },
}

export default function guestGuard(): void {
  const probe =
    GUEST_GUARD_PROBES[Math.floor(Math.random() * GUEST_GUARD_PROBES.length)]!
  hitProbe(probe)
  sleep(0.15 + Math.random() * 0.25)
}
