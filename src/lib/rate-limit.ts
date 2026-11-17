/**
 * Sliding-window rate limiter.
 * Uses Redis when `REDIS_URL` is set; otherwise in-memory (single process).
 * Production with REDIS_URL fails closed if Redis is unreachable.
 */

import { logger } from '#/lib/logger'

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
const MEMORY_MAX_KEYS = 10_000

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
  eval: (
    script: string,
    options: { keys: string[]; arguments: string[] },
  ) => Promise<unknown>
  isOpen: boolean
  connect: () => Promise<unknown>
  quit: () => Promise<unknown>
}

let redisClient: RedisClient | null | undefined
let redisInit: Promise<RedisClient | null> | null = null
let redisFailUntil = 0

function redisRequired(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    Boolean(process.env.REDIS_URL?.trim())
  )
}

async function getRedis(): Promise<RedisClient | null> {
  if (redisClient) return redisClient
  if (Date.now() < redisFailUntil) {
    if (redisRequired()) {
      throw new Error('Redis rate-limit unavailable')
    }
    return null
  }
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
        logger.error('[mini-drive] redis rate-limit error', error)
        redisClient = undefined
        redisInit = null
        redisFailUntil = Date.now() + 5_000
      })
      if (!client.isOpen) await client.connect()
      redisClient = client
      redisFailUntil = 0
      return client
    } catch (error) {
      logger.error(
        '[mini-drive] redis unavailable — using memory rate-limit',
        error,
      )
      redisClient = undefined
      redisInit = null
      redisFailUntil = Date.now() + 5_000
      if (redisRequired()) {
        throw new Error('Redis rate-limit unavailable')
      }
      return null
    }
  })()

  try {
    return await redisInit
  } finally {
    // Allow retry after failure window.
    if (!redisClient) redisInit = null
  }
}

function pruneMemoryBuckets(now: number) {
  if (memoryBuckets.size <= MEMORY_MAX_KEYS) return
  for (const [key, bucket] of memoryBuckets) {
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < 3_600_000)
    if (bucket.timestamps.length === 0) memoryBuckets.delete(key)
    if (memoryBuckets.size <= MEMORY_MAX_KEYS * 0.8) break
  }
}

function memoryCheck(
  key: string,
  { limit, windowMs }: LimitOpts,
): RateLimitResult {
  const now = Date.now()
  pruneMemoryBuckets(now)
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
  pruneMemoryBuckets(now)
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

/** Atomic sliding-window check+add via Lua. Returns [allowed(0|1), remainingOrRetryMs]. */
const REDIS_CHECK_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2] or now)
  return {0, math.max(0, window - (now - oldestScore))}
end
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)
return {1, limit - count - 1}
`

const REDIS_RECORD_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, math.ceil(window / 1000) + 1)
local count = redis.call('ZCARD', key)
if count > limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2] or now)
  return {0, math.max(0, window - (now - oldestScore))}
end
return {1, math.max(0, limit - count)}
`

async function redisEval(
  client: RedisClient,
  script: string,
  key: string,
  opts: LimitOpts,
): Promise<RateLimitResult> {
  const now = Date.now()
  const redisKey = `rl:${key}`
  const result = (await client.eval(script, {
    keys: [redisKey],
    arguments: [
      String(now),
      String(opts.windowMs),
      String(opts.limit),
      `${now}:${Math.random()}`,
    ],
  })) as [number, number]

  const allowed = Number(result[0]) === 1
  const value = Number(result[1])
  if (allowed) return { ok: true, remaining: value }
  return { ok: false, retryAfterMs: value }
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

/** Gate: increments when under limit (request allowed). */
export async function checkRateLimit(
  key: string,
  opts: LimitOpts,
): Promise<RateLimitResult> {
  const client = await getRedis()
  if (client) return redisEval(client, REDIS_CHECK_LUA, key, opts)
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
  if (client) return redisEval(client, REDIS_RECORD_LUA, key, opts)
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
  redisFailUntil = 0
}
