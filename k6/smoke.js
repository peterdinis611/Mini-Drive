/**
 * Lightweight smoke — few VUs, public surfaces only.
 *
 *   pnpm test:k6:smoke
 *   BASE_URL=http://127.0.0.1:3000 k6 run k6/smoke.js
 */
import http from 'k6/http'
import { sleep } from 'k6'

import { jsonHealthOk, okStatus } from './lib/checks.js'
import { url } from './lib/env.js'

export const options = {
  vus: 2,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
    mini_drive_errors: ['rate<0.05'],
  },
}

export default function smoke() {
  jsonHealthOk(http.get(url('/api/health'), { tags: { name: 'health' } }))
  okStatus(http.get(url('/'), { tags: { name: 'landing' } }))
  okStatus(http.get(url('/robots.txt'), { tags: { name: 'robots' } }))
  okStatus(http.get(url('/sitemap.xml'), { tags: { name: 'sitemap' } }))

  // Missing share token → gone UI (framework may surface 410 or 200+body).
  okStatus(http.get(url('/s/k6-missing-token'), { tags: { name: 'share_gone' } }), [
    200,
    410,
  ])

  sleep(0.5)
}
