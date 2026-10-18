type Bucket = {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

/**
 * Sliding-window rate limiter (in-memory, per process).
 * Suitable for local/single-instance deploy; swap for Redis in multi-node.
 */
export function checkRateLimit(
  key: string,
  {
    limit,
    windowMs,
  }: {
    limit: number
    windowMs: number
  },
): { ok: true; remaining: number } | { ok: false; retryAfterMs: number } {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]!
    buckets.set(key, bucket)
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) }
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return { ok: true, remaining: limit - bucket.timestamps.length }
}

/** Test helper — clears all buckets. */
export function resetRateLimitStore() {
  buckets.clear()
}
