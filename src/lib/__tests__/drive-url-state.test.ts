import { describe, expect, it } from 'vitest'

import {
  kindFilterParser,
  previewIdParser,
  qParser,
  uploadOpenParser,
  viewParser,
} from '#/lib/drive-url-state'

describe('viewParser', () => {
  it('parses grid and list', () => {
    expect(viewParser.parse('grid')).toBe('grid')
    expect(viewParser.parse('list')).toBe('list')
  })

  it('rejects unknown values', () => {
    expect(viewParser.parse('masonry')).toBeNull()
  })
})

describe('kindFilterParser', () => {
  it('defaults to all', () => {
    expect(kindFilterParser.defaultValue).toBe('all')
  })

  it('parses known kinds', () => {
    expect(kindFilterParser.parse('image')).toBe('image')
    expect(kindFilterParser.parse('pdf')).toBe('pdf')
    expect(kindFilterParser.parse('bogus')).toBeNull()
  })
})

describe('qParser', () => {
  it('defaults to empty string', () => {
    expect(qParser.defaultValue).toBe('')
    expect(qParser.parse('hello')).toBe('hello')
  })
})

describe('uploadOpenParser', () => {
  it('defaults to true and parses booleans', () => {
    expect(uploadOpenParser.defaultValue).toBe(true)
    expect(uploadOpenParser.parse('true')).toBe(true)
    expect(uploadOpenParser.parse('false')).toBe(false)
  })
})

describe('previewIdParser', () => {
  it('keeps string ids or null', () => {
    expect(previewIdParser.parse('abc-123')).toBe('abc-123')
    expect(previewIdParser.parse(null)).toBeNull()
  })
})
