import { describe, expect, it } from 'vitest'

import { applyRenamePattern } from '#/lib/batch-rename'

describe('applyRenamePattern', () => {
  it('supports n / name / ext tokens', () => {
    expect(applyRenamePattern('IMG_001.JPG', 'foto-{n}{ext}', 1)).toBe(
      'foto-1.JPG',
    )
    expect(applyRenamePattern('report.pdf', '{name}-v{n}{ext}', 3)).toBe(
      'report-v3.pdf',
    )
    expect(applyRenamePattern('readme', 'doc-{n}', 2)).toBe('doc-2')
  })

  it('keeps multi-dot names on the last extension', () => {
    expect(applyRenamePattern('archive.tar.gz', '{name}-copy{ext}', 1)).toBe(
      'archive.tar-copy.gz',
    )
  })

  it('leaves unknown tokens untouched', () => {
    expect(applyRenamePattern('a.txt', 'x-{id}{ext}', 1)).toBe('x-{id}.txt')
  })
})
