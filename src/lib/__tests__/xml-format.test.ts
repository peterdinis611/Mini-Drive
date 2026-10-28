import { describe, expect, it } from 'vitest'

import { prettyPrintXml, tokenizeXmlLine } from '#/lib/xml-format'

describe('prettyPrintXml', () => {
  it('indents nested tags', () => {
    const pretty = prettyPrintXml('<root><item>1</item></root>')
    expect(pretty).toContain('<root>')
    expect(pretty).toContain('  <item>1</item>')
    expect(pretty).toContain('</root>')
  })
})

describe('tokenizeXmlLine', () => {
  it('marks tags and attributes', () => {
    const tokens = tokenizeXmlLine('<item id="1">')
    expect(tokens.some((token) => token.type === 'tag')).toBe(true)
    expect(tokens.some((token) => token.type === 'attr-name')).toBe(true)
    expect(tokens.some((token) => token.type === 'attr-value')).toBe(true)
  })
})
