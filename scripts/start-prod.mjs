#!/usr/bin/env node
/**
 * Production entry: srvx serves hashed Vite client assets with long-lived cache
 * headers, then forwards everything else to dist/server/server.js.
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { serve } from 'srvx/node'
import { staticMiddleware } from 'srvx/static'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
process.env.NODE_ENV = 'production'

const serverEntry = join(root, 'dist/server/server.js')
const clientDir = join(root, 'dist/client')

if (!existsSync(serverEntry)) {
  console.error(
    '[mini-drive] Missing dist/server/server.js — run `pnpm build` first.',
  )
  process.exit(1)
}
if (!existsSync(clientDir)) {
  console.error('[mini-drive] Missing dist/client — run `pnpm build` first.')
  process.exit(1)
}

const mod = await import(pathToFileURL(serverEntry).href)
const entry = mod.default ?? mod
if (typeof entry?.fetch !== 'function') {
  console.error('[mini-drive] Server entry must export { fetch }.')
  process.exit(1)
}

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOST || process.env.HOSTNAME || undefined

const server = serve({
  port,
  hostname,
  gracefulShutdown: true,
  fetch: (request) => entry.fetch(request),
  middleware: [
    // Hashed Vite bundles + public/ copies — long cache; HTML still comes from fetch.
    staticMiddleware({
      dir: clientDir,
      maxAge: 31_536_000,
      immutable: true,
      compress: true,
      etag: true,
      lastModified: true,
    }),
  ],
})

await server.ready()
console.log(
  `[mini-drive] listening on http://${hostname || 'localhost'}:${port}/`,
)
