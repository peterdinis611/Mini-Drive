import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { scanBuffer, Verdict } = vi.hoisted(() => ({
  scanBuffer: vi.fn(),
  Verdict: {
    Clean: Symbol('Clean'),
    Malicious: Symbol('Malicious'),
    ScanError: Symbol('ScanError'),
  },
}))

vi.mock('pompelmi', () => ({
  scanBuffer,
  Verdict,
}))

import {
  resolveClamavOptions,
  scanBytesForShare,
  virusScanBlockMessage,
} from '#/server/virus-scan.server'
import { EICAR_SIGNATURE } from '#/lib/virus-scan'

const envKeys = [
  'VIRUS_SCAN',
  'CLAMAV_HOST',
  'CLAMAV_PORT',
  'CLAMAV_SOCKET',
  'CLAMAV_LOCAL',
  'CLAMAV_TIMEOUT_MS',
  'VIRUS_SCAN_REQUIRE_CLAMAV',
] as const

function clearVirusEnv() {
  for (const key of envKeys) {
    delete process.env[key]
  }
}

describe('resolveClamavOptions', () => {
  beforeEach(clearVirusEnv)
  afterEach(clearVirusEnv)

  it('prefers UNIX socket over host', () => {
    process.env.CLAMAV_SOCKET = '/run/clamav/clamd.sock'
    process.env.CLAMAV_HOST = '127.0.0.1'
    expect(resolveClamavOptions()).toMatchObject({
      socket: '/run/clamav/clamd.sock',
    })
  })

  it('reads TCP host/port', () => {
    process.env.CLAMAV_HOST = 'clamd'
    process.env.CLAMAV_PORT = '3311'
    expect(resolveClamavOptions()).toEqual({
      host: 'clamd',
      port: 3311,
      timeout: 30_000,
    })
  })

  it('enables local clamscan mode', () => {
    process.env.CLAMAV_LOCAL = '1'
    expect(resolveClamavOptions()).toEqual({})
  })

  it('returns null when nothing configured', () => {
    expect(resolveClamavOptions()).toBeNull()
  })
})

describe('scanBytesForShare + pompelmi', () => {
  beforeEach(() => {
    clearVirusEnv()
    scanBuffer.mockReset()
    process.env.VIRUS_SCAN = 'force'
  })

  afterEach(clearVirusEnv)

  it('skips when VIRUS_SCAN=off', async () => {
    process.env.VIRUS_SCAN = 'off'
    const result = await scanBytesForShare(new Uint8Array([1]), {
      fileName: 'a.txt',
      mimeType: 'text/plain',
    })
    expect(result.verdict).toBe('skipped')
    expect(scanBuffer).not.toHaveBeenCalled()
  })

  it('flags heuristics without calling clamav', async () => {
    const bytes = new TextEncoder().encode(EICAR_SIGNATURE)
    const result = await scanBytesForShare(bytes, {
      fileName: 'eicar.com',
      mimeType: 'application/octet-stream',
    })
    expect(result.verdict).toBe('infected')
    expect(result.engines).toContain('heuristics')
    expect(scanBuffer).not.toHaveBeenCalled()
  })

  it('marks infected when pompelmi returns Malicious', async () => {
    process.env.CLAMAV_HOST = '127.0.0.1'
    scanBuffer.mockResolvedValue(Verdict.Malicious)

    const result = await scanBytesForShare(new Uint8Array([0x89, 0x50]), {
      fileName: 'ok.png',
      mimeType: 'image/png',
    })

    expect(result.verdict).toBe('infected')
    expect(result.engines).toEqual(
      expect.arrayContaining(['heuristics', 'pompelmi']),
    )
    expect(result.findings.some((f) => f.code === 'CLAMAV')).toBe(true)
    expect(scanBuffer).toHaveBeenCalledOnce()
  })

  it('stays clean on Verdict.Clean', async () => {
    process.env.CLAMAV_HOST = '127.0.0.1'
    scanBuffer.mockResolvedValue(Verdict.Clean)

    const result = await scanBytesForShare(new Uint8Array([0x89, 0x50]), {
      fileName: 'ok.png',
      mimeType: 'image/png',
    })

    expect(result.verdict).toBe('clean')
    expect(result.engines).toContain('pompelmi')
  })

  it('errors on ScanError when ClamAV is required', async () => {
    process.env.CLAMAV_HOST = '127.0.0.1'
    process.env.VIRUS_SCAN_REQUIRE_CLAMAV = '1'
    scanBuffer.mockResolvedValue(Verdict.ScanError)

    const result = await scanBytesForShare(new Uint8Array([1]), {
      fileName: 'a.bin',
      mimeType: 'application/octet-stream',
    })

    expect(result.verdict).toBe('error')
    expect(result.findings[0]?.code).toBe('CLAMAV_UNAVAILABLE')
  })

  it('errors when ClamAV is required but not configured', async () => {
    process.env.VIRUS_SCAN_REQUIRE_CLAMAV = '1'
    const result = await scanBytesForShare(new Uint8Array([1]), {
      fileName: 'a.bin',
      mimeType: 'application/octet-stream',
    })
    expect(result.verdict).toBe('error')
    expect(result.findings[0]?.code).toBe('CLAMAV_REQUIRED')
  })
})

describe('virusScanBlockMessage', () => {
  it('formats infected and error messages', () => {
    expect(
      virusScanBlockMessage({
        verdict: 'infected',
        findings: [{ code: 'EICAR', detail: 'x' }],
        engines: [],
      }),
    ).toMatch(/EICAR/)

    expect(
      virusScanBlockMessage({
        verdict: 'error',
        findings: [{ code: 'X', detail: 'ClamAV down' }],
        engines: [],
      }),
    ).toBe('ClamAV down')
  })
})
