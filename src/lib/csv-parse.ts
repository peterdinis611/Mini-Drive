/** Minimal RFC4180-ish CSV/TSV parser (quoted fields, escaped quotes). */
export function parseDelimitedText(
  text: string,
  options?: { maxRows?: number; maxCols?: number },
): { rows: string[][]; delimiter: string } {
  const maxRows = options?.maxRows ?? 200
  const maxCols = options?.maxCols ?? 40
  const sample = text.slice(0, 4_000)
  const delimiter = detectDelimiter(sample)

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  const pushCell = () => {
    if (row.length < maxCols) row.push(cell)
    cell = ''
  }
  const pushRow = () => {
    // Keep trailing empty cells only if row has content
    if (row.length > 0 || cell.length > 0) {
      pushCell()
      rows.push(row)
      row = []
    } else {
      cell = ''
    }
  }

  for (let i = 0; i < text.length; i += 1) {
    if (rows.length >= maxRows) break
    const ch = text[i]!
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      pushCell()
      continue
    }
    if (ch === '\n') {
      pushRow()
      continue
    }
    if (ch === '\r') {
      if (next === '\n') i += 1
      pushRow()
      continue
    }
    cell += ch
  }

  if (cell.length > 0 || row.length > 0) pushRow()

  return { rows, delimiter }
}

function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? ''
  const counts = {
    ',': (firstLine.match(/,/g) ?? []).length,
    ';': (firstLine.match(/;/g) ?? []).length,
    '\t': (firstLine.match(/\t/g) ?? []).length,
    '|': (firstLine.match(/\|/g) ?? []).length,
  }
  const best = (Object.entries(counts) as Array<[string, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0]
  if (!best || best[1] === 0) return ','
  return best[0]
}

export function columnLabel(index: number): string {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}
