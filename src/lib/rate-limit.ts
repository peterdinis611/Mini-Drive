/**
 * Sliding-window rate limiter.
 * Uses Redis when `REDIS_URL` is set; otherwise in-memory (single process).
 */

type Bucket = {
  timestamps: number[]
}

type LimitOpts = {
  limit: number
  windowMs: number
}

type RateOk = { ok: true; remaining: number }
type RateBlocked = { ok: false; retryAfterMs: number }
export type RateLimitResult = RateOk | RateBlocked

const memoryBuckets = new Map<string, Bucket>()

type RedisClient = {
  zRemRangeByScore: (key: string, min: number, max: number) => Promise<number>
  zCard: (key: string) => Promise<number>
  zAdd: (
    key: string,
    entries: Array<{ score: number; value: string }>,
  ) => Promise<number>
  zRangeWithScores: (
    key: string,
    start: number,
    stop: number,
  ) => Promise<Array<{ value: string; score: number }>>
  expire: (key: string, seconds: number) => Promise<boolean>
  del: (key: string) => Promise<number>
  isOpen: boolean
  connect: () => Promise<unknown>
  quit: () => Promise<unknown>
}

let redisClient: RedisClient | null | undefined
let redisInit: Promise<RedisClient | null> | null = null

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient !== undefined) return redisClient
  if (redisInit) return redisInit

  redisInit = (async () => {
    const url = process.env.REDIS_URL?.trim()
    if (!url) {
      redisClient = null
      return null
    }
    try {
      const { createClient } = await import('redis')
      const client = createClient({ url }) as unknown as RedisClient & {
        on: (event: string, cb: (err: Error) => void) => void
      }
      client.on('error', (error) => {
        console.error('[mini-drive] redis rate-limit error', error)
      })
      if (!client.isOpen) await client.connect()
      redisClient = client
      return client
    } catch (error) {
      console.error('[mini-drive] redis unavailable — using memory rate-limit', error)
      redisClient = null
      return null
    }
  })()

  return redisInit
}

function memoryCheck(key: string, { limit, windowMs }: LimitOpts): RateLimitResult {
  const now = Date.now()
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now
    memoryBuckets.set(key, bucket)
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) }
  }

  bucket.timestamps.push(now)
  memoryBuckets.set(key, bucket)
  return { ok: true, remaining: limit - bucket.timestamps.length }
}

function memorySnapshot(
  key: string,
  { limit, windowMs }: LimitOpts,
): RateLimitResult {
  const now = Date.now()
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] }
  const timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)
  if (timestamps.length >= limit) {
    const oldest = timestamps[0] ?? now
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) }
  }
  return { ok: true, remaining: limit - timestamps.length }
}

function memoryRecordHit(
  key: string,
  { limit, windowMs }: LimitOpts,
): RateLimitResult {
  const now = Date.now()
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)
  bucket.timestamps.push(now)
  memoryBuckets.set(key, bucket)
  if (bucket.timestamps.length > limit) {
    const oldest = bucket.timestamps[0] ?? now
    return { ok: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) }
  }
  return { ok: true, remaining: Math.max(0, limit - bucket.timestamps.length) }
}

async function redisCheck(
  client: RedisClient,
  key: string,
  { limit, windowMs }: LimitOpts,
): Promise<RateLimitResult> {
  const now = Date.now()
  const redisKey = `rl:${key}`
  await client.zRemRangeByScore(redisKey, 0, now - windowMs)
  const count = await client.zCard(redisKey)
  if (count >= limit) {
    const oldestEntries = await client.zRangeWithScores(redisKey, 0, 0)
    const oldest = oldestEntries[0]?.score ?? now
    return {
      ok: false,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    }
  }
  await client.zAdd(redisKey, [{ score: now, value: `${now}:${Math.random()}` }])
  await client.expire(redisKey, Math.ceil(windowMs / 1000) + 1)
  return { ok: true, remaining: limit - count - 1 }
}

async function redisSnapshot(
  client: RedisClient,
  key: string,
  { limit, windowMs }: LimitOpts,
): Promise<RateLimitResult> {
  const now = Date.now()
  const redisKey = `rl:${key}`
  await client.zRemRangeByScore(redisKey, 0, now - windowMs)
  const count = await client.zCard(redisKey)
  if (count >= limit) {
    const oldestEntries = await client.zRangeWithScores(redisKey, 0, 0)
    const oldest = oldestEntries[0]?.score ?? now
    return {
      ok: false,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    }
  }
  return { ok: true, remaining: limit - count }
}

async function redisRecordHit(
  client: RedisClient,
  key: string,
  { limit, windowMs }: LimitOpts,
): Promise<RateLimitResult> {
  const now = Date.now()
  const redisKey = `rl:${key}`
  await client.zRemRangeByScore(redisKey, 0, now - windowMs)
  await client.zAdd(redisKey, [{ score: now, value: `${now}:${Math.random()}` }])
  await client.expire(redisKey, Math.ceil(windowMs / 1000) + 1)
  const count = await client.zCard(redisKey)
  if (count > limit) {
    const oldestEntries = await client.zRangeWithScores(redisKey, 0, 0)
    const oldest = oldestEntries[0]?.score ?? now
    return {
      ok: false,
      retryAfterMs: Math.max(0, windowMs - (now - oldest)),
    }
  }
  return { ok: true, remaining: Math.max(0, limit - count) }
}

/** Gate: increments when under limit (request allowed). */
export async function checkRateLimit(
  key: string,
  opts: LimitOpts,
): Promise<RateLimitResult> {
  const client = await getRedis()
  if (client) return redisCheck(client, key, opts)
  return memoryCheck(key, opts)
}

/** Read-only: whether the key is currently locked (no increment). */
export async function peekRateLimit(
  key: string,
  opts: LimitOpts,
): Promise<RateLimitResult> {
  const client = await getRedis()
  if (client) return redisSnapshot(client, key, opts)
  return memorySnapshot(key, opts)
}

/** Always record a hit (e.g. failed password), then report if over limit. */
export async function recordRateLimitHit(
  key: string,
  opts: LimitOpts,
): Promise<RateLimitResult> {
  const client = await getRedis()
  if (client) return redisRecordHit(client, key, opts)
  return memoryRecordHit(key, opts)
}

/** Clear hits for a key (e.g. after successful unlock). */
export async function clearRateLimit(key: string): Promise<void> {
  const client = await getRedis()
  if (client) {
    await client.del(`rl:${key}`)
    return
  }
  memoryBuckets.delete(key)
}

/** Test helper — clears memory buckets (Redis keys are left alone). */
export function resetRateLimitStore() {
  memoryBuckets.clear()
}
