/**
 * Static / SEO asset load — cacheable public files.
 *
 *   pnpm test:k6:static
 */

import { sleep } from 'k6'
import type { Options } from 'k6/options'

import { hitProbe } from './lib/hit.ts'
import { STATIC_PROBES } from './lib/paths.ts'

export const options: Options = {
  scenarios: {
    static_assets: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 15 },
        { duration: '45s', target: 40 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
    mini_drive_errors: ['rate<0.05'],
  },
}

export default function staticAssets(): void {
  const probe = STATIC_PROBES[Math.floor(Math.random() * STATIC_PROBES.length)]!
  hitProbe(probe)
  sleep(0.05 + Math.random() * 0.1)
}
