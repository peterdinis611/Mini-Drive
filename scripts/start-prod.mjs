#!/usr/bin/env node
/**
 * Production entry: srvx serves dist/client static assets + dist/server/server.js fetch.
 * Resolves srvx from a direct dependency or the pnpm virtual store (transitive).
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
process.env.NODE_ENV = 'production'

function resolveSrvxBin() {
  const direct = join(root, 'node_modules/srvx/bin/srvx.mjs')
  if (existsSync(direct)) return direct

  const pnpmDir = join(root, 'node_modules/.pnpm')
  if (!existsSync(pnpmDir)) return null
  const match = readdirSync(pnpmDir).find((name) => name.startsWith('srvx@'))
  if (!match) return null
  const nested = join(pnpmDir, match, 'node_modules/srvx/bin/srvx.mjs')
  return existsSync(nested) ? nested : null
}

const bin = resolveSrvxBin()
if (!bin) {
  console.error(
    '[mini-drive] srvx not found. Run `pnpm install` (srvx is a dependency).',
  )
  process.exit(1)
}

const serverEntry = join(root, 'dist/server/server.js')
if (!existsSync(serverEntry)) {
  console.error(
    '[mini-drive] Missing dist/server/server.js — run `pnpm build` first.',
  )
  process.exit(1)
}

const args = ['--prod', '-s', '../client', 'dist/server/server.js']
if (process.env.PORT) args.unshift(`--port=${process.env.PORT}`)
if (process.env.HOST) args.unshift(`--host=${process.env.HOST}`)

const child = spawn(process.execPath, [bin, ...args], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})
