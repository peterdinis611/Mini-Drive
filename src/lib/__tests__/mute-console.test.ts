import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originals = {
  debug: console.debug,
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  trace: console.trace,
  dir: console.dir,
  table: console.table,
  group: console.group,
  groupCollapsed: console.groupCollapsed,
  groupEnd: console.groupEnd,
}

describe('muteConsoleInProduction', () => {
  const prevNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    Object.assign(console, originals)
  })

  afterEach(() => {
    Object.assign(console, originals)
    process.env.NODE_ENV = prevNodeEnv
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('replaces console methods when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production'

    const { muteConsoleInProduction } = await import('#/lib/mute-console')
    muteConsoleInProduction()

    expect(() => {
      console.log('silent')
      console.warn('silent')
      console.error('silent')
    }).not.toThrow()
    expect(console.log).not.toBe(originals.log)
  })

  it('leaves console alone outside production', async () => {
    process.env.NODE_ENV = 'development'

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const { muteConsoleInProduction } = await import('#/lib/mute-console')
    muteConsoleInProduction()
    console.log('kept')
    expect(log).toHaveBeenCalledWith('kept')
  })
})
