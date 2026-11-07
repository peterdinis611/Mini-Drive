import { afterEach, describe, expect, it, vi } from 'vitest'

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('forwards to console in DEV', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { logger } = await import('#/lib/logger')
    logger.error('boom', 1)
    expect(error).toHaveBeenCalledWith('boom', 1)
  })

  it('stderrLine writes to process.stderr', async () => {
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true)
    const { stderrLine } = await import('#/lib/logger')
    stderrLine('ops warning')
    expect(write).toHaveBeenCalledWith('ops warning\n')
  })
})
