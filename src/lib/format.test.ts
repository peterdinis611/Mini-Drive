import { describe, expect, it } from 'vitest'

import { formatFileSize } from './format'

describe('formatFileSize', () => {
  it('formats zero and invalid values', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(-1)).toBe('0 B')
    expect(formatFileSize(Number.NaN)).toBe('0 B')
  })

  it('formats bytes through terabytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(5 * 1024 ** 3)).toBe('5 GB')
  })
})
