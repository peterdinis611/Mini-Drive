import { beforeEach, describe, expect, it, vi } from 'vitest'

import { applyRenamePattern } from '#/lib/batch-rename'
import { SHARE_PASSWORD_RATE_LIMIT, SHARE_RATE_LIMIT } from '#/lib/constants'
import { parseDelimitedText } from '#/lib/csv-parse'
import { filterDriveFiles } from '#/lib/drive-filters'
import {
  buildDriveSearchItems,
  createDriveFuse,
  searchDriveItems,
} from '#/lib/drive-search'
import { buildFolderTree, flattenFolderRows } from '#/lib/folder-tree'
import { checkRateLimit, resetRateLimitStore } from '#/lib/rate-limit'
import { hashAuditIp } from '#/lib/share-audit-hash'
import { generateShareToken } from '#/lib/share-token'
import { checkStorageQuota } from '#/lib/storage-quota'

const MIME_CYCLE = [
  'image/png',
  'application/pdf',
  'video/mp4',
  'audio/mpeg',
  'text/plain',
  'application/zip',
] as const

const EXT_FOR_MIME: Record<(typeof MIME_CYCLE)[number], string> = {
  'image/png': 'png',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'text/plain': 'txt',
  'application/zip': 'zip',
}

function makeFiles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const mimeType = MIME_CYCLE[i % MIME_CYCLE.length]!
    return {
      id: `file-${i}`,
      name: `súbor-${i % 97}-${i}.${EXT_FOR_MIME[mimeType]}`,
      mimeType,
      size: (i % 500) * 1024,
      folderId: i % 10 === 0 ? null : `folder-${i % 40}`,
    }
  })
}

function makeFolders(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `folder-${i}`,
    parentId: i === 0 ? null : `folder-${Math.floor((i - 1) / 4)}`,
    name: `Priečinok ${i}`,
    fileCount: i % 7,
  }))
}

describe('stress: rate-limit', () => {
  beforeEach(() => {
    resetRateLimitStore()
    vi.useRealTimers()
  })

  it('survives a flood of distinct keys', async () => {
    const started = performance.now()
    let allowed = 0
    for (let i = 0; i < 5_000; i += 1) {
      const result = await checkRateLimit(`ip:${i}`, SHARE_RATE_LIMIT)
      if (result.ok) allowed += 1
    }
    expect(allowed).toBe(5_000)
    expect(performance.now() - started).toBeLessThan(1_500)
  })

  it('blocks share resolve bursts past SHARE_RATE_LIMIT', async () => {
    const key = 'ip:burst'
    let blocked = 0
    for (let i = 0; i < SHARE_RATE_LIMIT.limit + 40; i += 1) {
      if (!(await checkRateLimit(key, SHARE_RATE_LIMIT)).ok) blocked += 1
    }
    expect(blocked).toBe(40)
  })

  it('reopens the window after expiry (mocked clock)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const key = 'ip:window'
    for (let i = 0; i < SHARE_PASSWORD_RATE_LIMIT.limit; i += 1) {
      expect((await checkRateLimit(key, SHARE_PASSWORD_RATE_LIMIT)).ok).toBe(true)
    }
    expect((await checkRateLimit(key, SHARE_PASSWORD_RATE_LIMIT)).ok).toBe(false)

    vi.advanceTimersByTime(SHARE_PASSWORD_RATE_LIMIT.windowMs + 1)
    expect((await checkRateLimit(key, SHARE_PASSWORD_RATE_LIMIT)).ok).toBe(true)
    vi.useRealTimers()
  })
})

describe('stress: drive filter + search (mocked corpus)', () => {
  it('filters 5k files by kind under budget', () => {
    const files = makeFiles(5_000)
    const started = performance.now()
    const images = filterDriveFiles(files, 'image', '')
    expect(images.length).toBeGreaterThan(700)
    expect(images.every((f) => f.mimeType.startsWith('image/'))).toBe(true)
    expect(performance.now() - started).toBeLessThan(500)
  })

  it('fuzzy-searches a large corpus and respects limit', () => {
    const folders = makeFolders(80)
    const files = makeFiles(4_000)
    const items = buildDriveSearchItems(folders, files)
    const fuse = createDriveFuse(items)

    const started = performance.now()
    const hits = searchDriveItems(fuse, items, 'súbor-12', 24)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(24)
    expect(performance.now() - started).toBeLessThan(2_500)
  })
})

describe('stress: folder tree', () => {
  it('builds and flattens a wide nested tree', () => {
    const folders = makeFolders(1_200)
    const started = performance.now()
    const tree = buildFolderTree(folders)
    const rows = flattenFolderRows(tree, {
      open: {},
      activeFolderId: 'folder-500',
      defaultOpenDepth: 2,
    })
    expect(tree.length).toBe(1)
    expect(rows.length).toBeGreaterThan(10)
    expect(performance.now() - started).toBeLessThan(2_000)
  })

  it('filters a large tree with Fuse without hanging', () => {
    const tree = buildFolderTree(makeFolders(600))
    const started = performance.now()
    const rows = flattenFolderRows(tree, {
      open: {},
      activeFolderId: null,
      filter: 'Priečinok 42',
      defaultOpenDepth: 1,
    })
    expect(rows.some((r) => r.name.includes('42'))).toBe(true)
    expect(performance.now() - started).toBeLessThan(2_500)
  })
})

describe('stress: csv / rename / quota / tokens', () => {
  it('clamps a huge CSV to maxRows/maxCols', () => {
    const lines = Array.from({ length: 5_000 }, (_, i) =>
      Array.from({ length: 80 }, (_, j) => `c${i}_${j}`).join(','),
    ).join('\n')
    const started = performance.now()
    const { rows } = parseDelimitedText(lines, { maxRows: 200, maxCols: 40 })
    expect(rows).toHaveLength(200)
    expect(rows[0]).toHaveLength(40)
    expect(performance.now() - started).toBeLessThan(1_500)
  })

  it('renames 2k files deterministically', () => {
    const names = Array.from({ length: 2_000 }, (_, i) => `IMG_${i}.JPG`)
    const started = performance.now()
    const out = names.map((name, i) =>
      applyRenamePattern(name, 'foto-{n}-{name}{ext}', i + 1),
    )
    expect(out[0]).toBe('foto-1-IMG_0.JPG')
    expect(out[1999]).toBe('foto-2000-IMG_1999.JPG')
    expect(new Set(out).size).toBe(2_000)
    expect(performance.now() - started).toBeLessThan(500)
  })

  it('runs many quota checks without false rejects', () => {
    const quotaBytes = 1 * 1024 ** 2
    let ok = 0
    let rejected = 0
    for (let i = 0; i < 2_000; i += 1) {
      const result = checkStorageQuota({
        usedBytes: i * 2_048,
        additionalBytes: 4_096,
        quotaBytes,
      })
      if (result.ok) ok += 1
      else rejected += 1
    }
    expect(ok).toBeGreaterThan(100)
    expect(rejected).toBeGreaterThan(100)
    expect(ok + rejected).toBe(2_000)
  })

  it('generates unique share tokens in bulk', () => {
    const tokens = new Set<string>()
    for (let i = 0; i < 1_000; i += 1) {
      tokens.add(generateShareToken(16))
    }
    expect(tokens.size).toBe(1_000)
  })

  it('hashes many audit IPs stably', () => {
    const pepper = 'stress-pepper-secret'
    const first = hashAuditIp('203.0.113.1', pepper)
    for (let i = 0; i < 2_000; i += 1) {
      const hash = hashAuditIp(`203.0.113.${i % 250}`, pepper)
      expect(hash).toMatch(/^[a-f0-9]{32}$|^unknown$/)
    }
    expect(hashAuditIp('203.0.113.1', pepper)).toBe(first)
  })
})
