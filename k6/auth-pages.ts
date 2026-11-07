/**
 * Auth surface load — Clerk sign-in / sign-up HTML under moderate traffic.
 *
 *   pnpm test:k6:auth-pages
 */

import { sleep } from 'k6'
import type { Options } from 'k6/options'

import { hitProbe } from './lib/hit.ts'
import type { Probe } from './lib/paths.ts'

const AUTH_PROBES: Probe[] = [
  { path: '/sign-in', name: 'sign_in', allowed: [200] },
  { path: '/sign-up', name: 'sign_up', allowed: [200] },
  { path: '/login', name: 'login_redirect', allowed: [200, 301, 302, 303, 307, 308] },
  { path: '/register', name: 'register_redirect', allowed: [200, 301, 302, 303, 307, 308] },
]

export const options: Options = {
  scenarios: {
    auth_pages: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '45s', target: 25 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<3500'],
    mini_drive_errors: ['rate<0.1'],
  },
}

export default function authPages(): void {
  const probe = AUTH_PROBES[Math.floor(Math.random() * AUTH_PROBES.length)]!
  hitProbe(probe)
  sleep(0.2 + Math.random() * 0.4)
}
