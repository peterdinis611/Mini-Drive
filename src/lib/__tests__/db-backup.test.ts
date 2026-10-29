import { describe, expect, it } from 'vitest'

import {
  DB_BACKUP_MAGIC,
  decryptDbBackup,
  defaultBackupFileName,
  encryptDbBackup,
} from '#/lib/db-backup'

const PASSPHRASE = 'test-backup-key-32chars!!!!'

describe('encryptDbBackup / decryptDbBackup', () => {
  it('round-trips sqlite-like bytes', () => {
    const plaintext = Buffer.from('SQLite format 3\0fake-db-bytes')
    const { blob } = encryptDbBackup(plaintext, PASSPHRASE)
    expect(blob.subarray(0, 5).equals(DB_BACKUP_MAGIC)).toBe(true)
    expect(blob.length).toBeGreaterThan(plaintext.length)
    expect(decryptDbBackup(blob, PASSPHRASE).equals(plaintext)).toBe(true)
  })

  it('rejects wrong passphrase', () => {
    const { blob } = encryptDbBackup(Buffer.from('secret'), PASSPHRASE)
    expect(() => decryptDbBackup(blob, 'wrong-passphrase!!!!')).toThrow()
  })

  it('rejects short passphrase', () => {
    expect(() => encryptDbBackup(Buffer.from('x'), 'short')).toThrow(/16/)
  })

  it('rejects bad magic', () => {
    expect(() => decryptDbBackup(Buffer.alloc(64, 7), PASSPHRASE)).toThrow(
      /MDBK1/,
    )
  })
})

describe('defaultBackupFileName', () => {
  it('includes stamp and .db.enc', () => {
    const name = defaultBackupFileName(new Date('2026-10-24T15:30:45Z'))
    expect(name.startsWith('mini-drive-')).toBe(true)
    expect(name.endsWith('.db.enc')).toBe(true)
  })
})
