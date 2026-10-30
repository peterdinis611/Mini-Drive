import { describe, expect, it } from 'vitest'

import { prettyPrintXml, tokenizeXmlLine } from '#/lib/xml-format'

describe('prettyPrintXml', () => {
  it('indents nested tags', () => {
    const pretty = prettyPrintXml('<root><item>1</item></root>')
    expect(pretty).toContain('<root>')
    expect(pretty).toContain('  <item>1</item>')
    expect(pretty).toContain('</root>')
  })

  it('returns empty for blank input', () => {
    expect(prettyPrintXml('   ')).toBe('')
  })
})

describe('tokenizeXmlLine', () => {
  it('marks tags and attributes', () => {
    const tokens = tokenizeXmlLine('<item id="1">')
    expect(tokens.some((token) => token.type === 'tag')).toBe(true)
    expect(tokens.some((token) => token.type === 'attr-name')).toBe(true)
    expect(tokens.some((token) => token.type === 'attr-value')).toBe(true)
  })

  it('treats comments and plain text specially', () => {
    expect(tokenizeXmlLine('<!-- hi -->')).toEqual([
      { type: 'comment', value: '<!-- hi -->' },
    ])
    expect(tokenizeXmlLine('plain text')).toEqual([
      { type: 'text', value: 'plain text' },
    ])
  })
})
