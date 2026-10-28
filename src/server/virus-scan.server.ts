import { createConnection } from 'node:net'

import { UPLOAD_LIMITS } from '#/lib/constants'
import {
  scanBufferHeuristics,
  type VirusScanFinding,
  type VirusScanVerdict,
} from '#/lib/virus-scan'

export type ShareVirusScanResult = {
  verdict: VirusScanVerdict
  findings: VirusScanFinding[]
  engines: string[]
}

function clamavConfig(): { host: string; port: number } | null {
  const host = process.env.CLAMAV_HOST?.trim()
  if (!host) return null
  const port = Number(process.env.CLAMAV_PORT ?? '3310')
  if (!Number.isFinite(port) || port <= 0) return null
  return { host, port }
}

function requireClamav(): boolean {
  return process.env.VIRUS_SCAN_REQUIRE_CLAMAV === '1'
}

/**
 * Scan file bytes before creating a public share.
 * Always runs heuristics; ClamAV INSTREAM if CLAMAV_HOST is set.
 */
export async function scanBytesForShare(
  bytes: Uint8Array,
  meta: { fileName: string; mimeType: string },
): Promise<ShareVirusScanResult> {
  if (process.env.VITEST || process.env.VIRUS_SCAN === 'off') {
    return { verdict: 'skipped', findings: [], engines: ['skipped'] }
  }

  const findings: VirusScanFinding[] = []
  const engines: string[] = []

  const heuristic = scanBufferHeuristics(bytes, meta)
  engines.push(heuristic.engine)
  findings.push(...heuristic.findings)

  const clam = clamavConfig()
  if (clam) {
    try {
      const clamResult = await scanWithClamav(bytes, clam)
      engines.push('clamav')
      if (clamResult.infected) {
        findings.push({
          code: clamResult.signature ?? 'CLAMAV',
          detail: clamResult.raw,
        })
      }
    } catch (err) {
      engines.push('clamav-error')
      if (requireClamav()) {
        return {
          verdict: 'error',
          findings: [
            {
              code: 'CLAMAV_UNAVAILABLE',
              detail:
                err instanceof Error
                  ? err.message
                  : 'ClamAV nie je dostupný',
            },
          ],
          engines,
        }
      }
    }
  } else if (requireClamav()) {
    return {
      verdict: 'error',
      findings: [
        {
          code: 'CLAMAV_REQUIRED',
          detail: 'VIRUS_SCAN_REQUIRE_CLAMAV=1, ale CLAMAV_HOST nie je nastavený',
        },
      ],
      engines,
    }
  }

  if (findings.length > 0) {
    return { verdict: 'infected', findings, engines }
  }
  return { verdict: 'clean', findings, engines }
}

/**
 * Download via short-lived signed URL and scan before public share.
 */
export async function scanUploadThingFileForShare(args: {
  uploadthingKey: string
  fileName: string
  mimeType: string
  size: number
}): Promise<ShareVirusScanResult> {
  if (process.env.VITEST || process.env.VIRUS_SCAN === 'off') {
    return { verdict: 'skipped', findings: [], engines: ['skipped'] }
  }

  if (args.size > UPLOAD_LIMITS.maxFileSizeBytes) {
    return {
      verdict: 'error',
      findings: [
        {
          code: 'TOO_LARGE',
          detail: 'Súbor je príliš veľký na sken pred zdieľaním',
        },
      ],
      engines: [],
    }
  }

  const { utapi } = await import('#/server/utapi.server')
  const { ufsUrl } = await utapi.generateSignedURL(args.uploadthingKey, {
    expiresIn: 60,
  })

  const response = await fetch(ufsUrl)
  if (!response.ok) {
    return {
      verdict: 'error',
      findings: [
        {
          code: 'FETCH_FAILED',
          detail: `Nepodarilo sa stiahnuť súbor na sken (HTTP ${response.status})`,
        },
      ],
      engines: [],
    }
  }

  const buffer = new Uint8Array(await response.arrayBuffer())
  return scanBytesForShare(buffer, {
    fileName: args.fileName,
    mimeType: args.mimeType,
  })
}

type ClamResult = { infected: boolean; signature?: string; raw: string }

async function scanWithClamav(
  bytes: Uint8Array,
  cfg: { host: string; port: number },
): Promise<ClamResult> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: cfg.host, port: cfg.port })
    const chunks: Buffer[] = []
    let settled = false

    const fail = (err: Error) => {
      if (settled) return
      settled = true
      socket.destroy()
      reject(err)
    }

    const ok = (result: ClamResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(30_000)
    socket.on('timeout', () => fail(new Error('ClamAV timeout')))
    socket.on('error', (err) => fail(err))
    socket.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    socket.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').replace(/\0/g, '').trim()
      // e.g. "stream: Eicar-Test-Signature FOUND" or "stream: OK"
      const infected = /\sFOUND$/i.test(raw)
      const signature = infected
        ? raw.replace(/^stream:\s*/i, '').replace(/\sFOUND$/i, '').trim()
        : undefined
      ok({ infected, signature, raw })
    })

    socket.on('connect', () => {
      // zINSTREAM null-terminated
      socket.write(Buffer.from('zINSTREAM\0'))
      const chunkSize = 64 * 1024
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const slice = bytes.subarray(offset, offset + chunkSize)
        const header = Buffer.alloc(4)
        header.writeUInt32BE(slice.length, 0)
        socket.write(header)
        socket.write(Buffer.from(slice))
      }
      const end = Buffer.alloc(4)
      end.writeUInt32BE(0, 0)
      socket.write(end)
    })
  })
}

export function virusScanBlockMessage(result: ShareVirusScanResult): string {
  if (result.verdict === 'infected') {
    const codes = result.findings.map((f) => f.code).join(', ')
    return `Zdieľanie zablokované — detekcia malware (${codes || 'unknown'}).`
  }
  if (result.verdict === 'error') {
    return (
      result.findings[0]?.detail ??
      'Zdieľanie zablokované — sken súboru zlyhal.'
    )
  }
  return 'Zdieľanie zablokované — sken súboru.'
}
