import { describe, expect, it } from 'vitest'

import { columnLabel, parseDelimitedText } from '#/lib/csv-parse'

describe('parseDelimitedText', () => {
  it('parses quoted commas', () => {
    const { rows, delimiter } = parseDelimitedText(
      'name,city\n"Doe, Jane",Bratislava\n',
    )
    expect(delimiter).toBe(',')
    expect(rows).toEqual([
      ['name', 'city'],
      ['Doe, Jane', 'Bratislava'],
    ])
  })

  it('detects semicolon and tab', () => {
    expect(parseDelimitedText('a;b\n1;2').delimiter).toBe(';')
    expect(parseDelimitedText('a\tb\n1\t2').delimiter).toBe('\t')
  })
})

describe('columnLabel', () => {
  it('uses Excel-style letters', () => {
    expect(columnLabel(0)).toBe('A')
    expect(columnLabel(25)).toBe('Z')
    expect(columnLabel(26)).toBe('AA')
  })
})
