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
})
