import { scanBuffer, Verdict, type ScanOptions } from 'pompelmi'

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

/** Resolve pompelmi / ClamAV connection from env. */
export function resolveClamavOptions(): ScanOptions | null {
  const socket = process.env.CLAMAV_SOCKET?.trim()
  if (socket) {
    return {
      socket,
      timeout: Number(process.env.CLAMAV_TIMEOUT_MS ?? '30000') || 30_000,
    }
  }

  const host = process.env.CLAMAV_HOST?.trim()
  if (host) {
    const port = Number(process.env.CLAMAV_PORT ?? '3310')
    if (!Number.isFinite(port) || port <= 0) return null
    return {
      host,
      port,
      timeout: Number(process.env.CLAMAV_TIMEOUT_MS ?? '30000') || 30_000,
    }
  }

  // Spawn local `clamscan` (pompelmi installs / finds the binary).
  if (process.env.CLAMAV_LOCAL === '1') {
    return {}
  }

  return null
}

function requireClamav(): boolean {
  return process.env.VIRUS_SCAN_REQUIRE_CLAMAV === '1'
}

/** Skip network/AV in Vitest unless VIRUS_SCAN=force. */
function virusScanDisabled(): boolean {
  if (process.env.VIRUS_SCAN === 'off') return true
  if (process.env.VIRUS_SCAN === 'force') return false
  return Boolean(process.env.VITEST)
}

/**
 * Scan file bytes before creating a public share.
 * Always runs heuristics; ClamAV via pompelmi when configured.
 */
export async function scanBytesForShare(
  bytes: Uint8Array,
  meta: { fileName: string; mimeType: string },
): Promise<ShareVirusScanResult> {
  if (virusScanDisabled()) {
    return { verdict: 'skipped', findings: [], engines: ['skipped'] }
  }

  const findings: VirusScanFinding[] = []
  const engines: string[] = []

  const heuristic = scanBufferHeuristics(bytes, meta)
  engines.push(heuristic.engine)
  findings.push(...heuristic.findings)

  const clam = resolveClamavOptions()
  if (clam) {
    try {
      const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
      const verdict = await scanBuffer(buffer, clam)
      engines.push('pompelmi')

      if (verdict === Verdict.Malicious) {
        findings.push({
          code: 'CLAMAV',
          detail: 'ClamAV (pompelmi): Malicious',
        })
      } else if (verdict === Verdict.ScanError) {
        engines.push('pompelmi-error')
        if (requireClamav()) {
          return {
            verdict: 'error',
            findings: [
              {
                code: 'CLAMAV_UNAVAILABLE',
                detail: 'ClamAV sken zlyhal (ScanError)',
              },
            ],
            engines,
          }
        }
      }
      // Verdict.Clean — continue
    } catch (err) {
      engines.push('pompelmi-error')
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
          detail:
            'VIRUS_SCAN_REQUIRE_CLAMAV=1, ale chýba CLAMAV_HOST / CLAMAV_SOCKET / CLAMAV_LOCAL=1',
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
  if (virusScanDisabled()) {
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
