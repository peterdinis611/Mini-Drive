import type { RefinedResponse, ResponseType } from 'k6/http'
import http from 'k6/http'

import { jsonHealthOk, probeOk } from './checks.ts'
import { url } from './env.ts'
import type { Probe } from './paths.ts'

/** GET a catalog probe and assert allowed status. */
export function hitProbe(
  probe: Probe,
): RefinedResponse<ResponseType | undefined> {
  const res = http.get(url(probe.path), {
    tags: { name: probe.name },
    redirects: probe.redirects,
  })
  if (probe.name === 'health') {
    jsonHealthOk(res)
  } else {
    probeOk(res, probe)
  }
  return res
}
