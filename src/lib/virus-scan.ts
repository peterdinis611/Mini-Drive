/** Well-known antivirus test signature (not malware; used by AV labs). */
export const EICAR_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'

export type VirusScanVerdict = 'clean' | 'infected' | 'skipped' | 'error'

export type VirusScanFinding = {
  code: string
  detail: string
}

export type HeuristicScanResult = {
  verdict: Exclude<VirusScanVerdict, 'skipped' | 'error'>
  findings: VirusScanFinding[]
  engine: 'heuristics'
}

const DOUBLE_EXT =
  /\.(pdf|png|jpe?g|gif|webp|txt|doc|docx|xlsx?|csv|zip)\.(exe|dll|scr|bat|cmd|com|msi|ps1)$/i

/**
 * Lightweight local heuristics before (optional) ClamAV.
 * Detects EICAR, suspicious double extensions, and MIME/magic mismatches.
 */
export function scanBufferHeuristics(
  bytes: Uint8Array,
  meta: { fileName: string; mimeType: string },
): HeuristicScanResult {
  const findings: VirusScanFinding[] = []
  const textHead = bufferToLatin1(bytes, 0, Math.min(bytes.length, 4096))

  if (textHead.includes(EICAR_SIGNATURE) || bufferContainsEicar(bytes)) {
    findings.push({
      code: 'EICAR',
      detail: 'Detegovaný EICAR test signature',
    })
  }

  if (DOUBLE_EXT.test(meta.fileName)) {
    findings.push({
      code: 'DOUBLE_EXT',
      detail: `Podozrivá dvojitá prípona: ${meta.fileName}`,
    })
  }

  const isPe = bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a // MZ
  const claimsSafe =
    meta.mimeType.startsWith('image/') ||
    meta.mimeType.startsWith('audio/') ||
    meta.mimeType.startsWith('video/') ||
    meta.mimeType === 'application/pdf' ||
    meta.mimeType.startsWith('text/')

  if (isPe && claimsSafe) {
    findings.push({
      code: 'PE_POLYGLOT',
      detail: `PE/MZ hlavička v súbore deklarovanom ako ${meta.mimeType}`,
    })
  }

  const elf =
    bytes.length >= 4 &&
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  if (elf && claimsSafe) {
    findings.push({
      code: 'ELF_POLYGLOT',
      detail: `ELF binárka v súbore deklarovanom ako ${meta.mimeType}`,
    })
  }

  return {
    verdict: findings.length > 0 ? 'infected' : 'clean',
    findings,
    engine: 'heuristics',
  }
}

function bufferToLatin1(bytes: Uint8Array, start: number, end: number): string {
  let out = ''
  for (let i = start; i < end; i++) {
    out += String.fromCharCode(bytes[i]!)
  }
  return out
}

function bufferContainsEicar(bytes: Uint8Array): boolean {
  const needle = EICAR_SIGNATURE
  if (bytes.length < needle.length) return false
  // Search first 8 KiB only — EICAR fixtures are tiny.
  const limit = Math.min(bytes.length, 8192)
  const hay = bufferToLatin1(bytes, 0, limit)
  return hay.includes(needle)
}
