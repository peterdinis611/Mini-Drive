import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now()
        let dbOk = false

        try {
          // Use the shared SQLite handle (avoid re-importing the full Drizzle schema graph).
          const { sqlite } = await import('#/db')
          const row = sqlite.prepare('SELECT 1 AS ok').get() as
            | { ok: number }
            | undefined
          dbOk = row?.ok === 1
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
