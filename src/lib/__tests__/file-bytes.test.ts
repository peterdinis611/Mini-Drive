import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { getFileBytes, getFileBytesSync } from '#/lib/file-bytes'

describe('file-bytes bridge', () => {
  it('returns sync and async sizes for a real file', async () => {
    const path = join(tmpdir(), `mini-drive-file-bytes-${Date.now()}.txt`)
    writeFileSync(path, 'hello-drive')

    expect(getFileBytesSync(path)).toBe(11)
    await expect(getFileBytes(path)).resolves.toBe(11)
  })
})
