import { createFileRoute } from '@tanstack/react-router'

import { logger } from '#/lib/logger'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now()
        let dbOk = false
        let redisOk: 'ok' | 'error' | 'skipped' = 'skipped'

        try {
          const { pool, waitForDb } = await import('#/db')
          await waitForDb()
          const result = await pool.query<{ ok: number }>('SELECT 1 AS ok')
          dbOk = result.rows[0]?.ok === 1
        } catch (error) {
          logger.error('[mini-drive] health database check failed', error)
          dbOk = false
        }

        const redisUrl = process.env.REDIS_URL?.trim()
        if (redisUrl) {
          try {
            const { createClient } = await import('redis')
            const client = createClient({ url: redisUrl })
            client.on('error', () => {})
            await client.connect()
            const pong = await client.ping()
            await client.quit()
            redisOk = pong === 'PONG' ? 'ok' : 'error'
          } catch (error) {
            logger.error('[mini-drive] health redis check failed', error)
            redisOk = 'error'
          }
        }

        const healthy = dbOk && redisOk !== 'error'
        const body = {
          status: healthy ? 'ok' : 'degraded',
          checks: {
            database: dbOk ? 'ok' : 'error',
            redis: redisOk,
          },
          uptimeSec: Math.floor(process.uptime()),
          durationMs: Date.now() - started,
        }

        return new Response(JSON.stringify(body), {
          status: healthy ? 200 : 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
