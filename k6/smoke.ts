/**
 * Lightweight smoke — few VUs, public surfaces only.
 *
 *   pnpm test:k6:smoke
 *   BASE_URL=http://127.0.0.1:3000 k6 run k6/smoke.ts
 */

import { sleep } from 'k6'
import http from 'k6/http'
import type { Options } from 'k6/options'

import { jsonHealthOk, okStatus } from './lib/checks.ts'
import { url } from './lib/env.ts'
import { hitProbe } from './lib/hit.ts'
import { GUEST_GUARD_PROBES } from './lib/paths.ts'

export const options: Options = {
  vus: 2,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    mini_drive_errors: ['rate<0.05'],
  },
}

export default function smoke(): void {
  jsonHealthOk(http.get(url('/api/health'), { tags: { name: 'health' } }))
  okStatus(http.get(url('/'), { tags: { name: 'landing' } }))
  okStatus(http.get(url('/robots.txt'), { tags: { name: 'robots' } }))
  okStatus(http.get(url('/sitemap.xml'), { tags: { name: 'sitemap' } }))
  okStatus(http.get(url('/sign-in'), { tags: { name: 'sign_in' } }))
  okStatus(http.get(url('/og.svg'), { tags: { name: 'og_svg' } }))
  okStatus(http.get(url('/favicon.svg'), { tags: { name: 'favicon' } }))
  okStatus(
    http.get(url('/site.webmanifest'), { tags: { name: 'webmanifest' } }),
  )

  // Missing share / embed tokens → gone UI (not 5xx).
  okStatus(
    http.get(url('/s/k6-missing-token'), { tags: { name: 'share_gone' } }),
    [200, 410],
  )
  okStatus(
    http.get(url('/e/k6-missing-token'), { tags: { name: 'embed_gone' } }),
    [200, 404, 410],
  )

  hitProbe(GUEST_GUARD_PROBES[0]!)

  sleep(0.5)
}
