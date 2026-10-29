/** Light pretty-print for XML (does not fully validate). */
export function prettyPrintXml(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const compact = trimmed.replace(/>\s+</g, '><')
  const parts = compact.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n')
  let indent = 0
  const lines: string[] = []

  for (const part of parts) {
    const line = part.trim()
    if (!line) continue
    if (/^<\/.+>/.test(line)) indent = Math.max(indent - 1, 0)
    lines.push(`${'  '.repeat(indent)}${line}`)
    if (/^<[^!?][^>]*[^/]>/.test(line) && !/^<[^>]*>.*<\/[^>]+>$/.test(line)) {
      indent += 1
    }
  }

  return lines.join('\n')
}

export type XmlToken =
  | { type: 'tag'; value: string }
  | { type: 'attr-name'; value: string }
  | { type: 'attr-value'; value: string }
  | { type: 'text'; value: string }
  | { type: 'comment'; value: string }
  | { type: 'plain'; value: string }

/** Tokenize one XML line for lightweight syntax coloring. */
export function tokenizeXmlLine(line: string): XmlToken[] {
  if (line.includes('<!--') || line.trimStart().startsWith('<!--')) {
    return [{ type: 'comment', value: line }]
  }

  const tokens: XmlToken[] = []
  const tagRe = /(<\/?[A-Za-z_][\w:.-]*|[=\s/>]+|"[^"]*"|'[^']*'|[^<\s="'/>]+)/g
  let last = 0
  let match: RegExpExecArray | null
  const working = line

  if (!working.includes('<')) {
    return [{ type: 'text', value: working }]
  }

  while ((match = tagRe.exec(working)) !== null) {
    if (match.index > last) {
      tokens.push({ type: 'plain', value: working.slice(last, match.index) })
    }
    const chunk = match[0]
    if (chunk.startsWith('</') || chunk.startsWith('<')) {
      tokens.push({ type: 'tag', value: chunk })
    } else if (
      (chunk.startsWith('"') && chunk.endsWith('"')) ||
      (chunk.startsWith("'") && chunk.endsWith("'"))
    ) {
      tokens.push({ type: 'attr-value', value: chunk })
    } else if (/^[A-Za-z_][\w:.-]*$/.test(chunk)) {
      tokens.push({ type: 'attr-name', value: chunk })
    } else {
      tokens.push({ type: 'plain', value: chunk })
    }
    last = match.index + chunk.length
  }

  if (last < working.length) {
    tokens.push({ type: 'plain', value: working.slice(last) })
  }

  return tokens.length > 0 ? tokens : [{ type: 'plain', value: line }]
}
