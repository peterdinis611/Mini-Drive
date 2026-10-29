import { check } from 'k6'
import { Rate, Trend } from 'k6/metrics'

export const errorRate = new Rate('mini_drive_errors')
export const healthDuration = new Trend('mini_drive_health_ms', true)

export function okStatus(res, allowed = [200]) {
  const pass = check(res, {
    [`status in [${allowed.join(',')}]`]: (r) => allowed.includes(r.status),
  })
  errorRate.add(!pass)
  return pass
}

export function jsonHealthOk(res) {
  let body = null
  try {
    body = res.json()
  } catch {
    body = null
  }
  const pass = check(res, {
    'health status 200': (r) => r.status === 200,
    'health json ok': () => body?.status === 'ok',
    'health db ok': () => body?.checks?.database === 'ok',
  })
  errorRate.add(!pass)
  healthDuration.add(res.timings.duration)
  return pass
}
