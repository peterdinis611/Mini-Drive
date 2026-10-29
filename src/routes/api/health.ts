import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now()
        let dbOk = false

        try {
          const { pool, waitForDb } = await import('#/db')
          await waitForDb()
          const result = await pool.query<{ ok: number }>('SELECT 1 AS ok')
          dbOk = result.rows[0]?.ok === 1
        } catch (error) {
          console.error('[mini-drive] health database check failed', error)
          dbOk = false
        }

        const healthy = dbOk
        const body = {
          status: healthy ? 'ok' : 'degraded',
          checks: {
            database: dbOk ? 'ok' : 'error',
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
