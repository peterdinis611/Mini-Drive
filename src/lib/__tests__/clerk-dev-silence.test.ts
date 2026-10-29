import { afterEach, describe, expect, it, vi } from 'vitest'

describe('silenceClerkDevKeySpam', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('drops Clerk development-key console spam and keeps other logs', async () => {
    const warn = vi.fn()
    const info = vi.fn()
    const log = vi.fn()
    vi.spyOn(console, 'warn').mockImplementation(warn)
    vi.spyOn(console, 'info').mockImplementation(info)
    vi.spyOn(console, 'log').mockImplementation(log)

    const { silenceClerkDevKeySpam } = await import('#/lib/clerk-dev-silence')
    silenceClerkDevKeySpam()

    console.warn('Clerk has been loaded with development keys')
    console.info('Clerk collects telemetry data from users')
    console.log('hello app')
    console.warn('unrelated warning')

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('unrelated warning')
    expect(info).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith('hello app')
  })
})
