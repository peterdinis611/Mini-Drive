import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

/** Mini-Drive Backup Keyed v1 */
export const DB_BACKUP_MAGIC = Buffer.from('MDBK1')

const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1

export type EncryptedBackup = {
  ciphertext: Buffer
  /** Full file bytes including magic + salt + iv + tag + ciphertext */
  blob: Buffer
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  if (!passphrase || passphrase.length < 16) {
    throw new Error('BACKUP_ENCRYPTION_KEY musí mať aspoň 16 znakov')
  }
  return scryptSync(passphrase, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  })
}

/** AES-256-GCM encrypt a SQLite dump (or any bytes). */
export function encryptDbBackup(
  plaintext: Buffer,
  passphrase: string,
): EncryptedBackup {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = deriveKey(passphrase, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  const blob = Buffer.concat([DB_BACKUP_MAGIC, salt, iv, tag, ciphertext])
  return { ciphertext, blob }
}

/** Decrypt a blob produced by {@link encryptDbBackup}. */
export function decryptDbBackup(blob: Buffer, passphrase: string): Buffer {
  const minLen = DB_BACKUP_MAGIC.length + SALT_LEN + IV_LEN + TAG_LEN
  if (blob.length < minLen) {
    throw new Error('Neplatný alebo poškodený backup súbor')
  }
  if (!blob.subarray(0, DB_BACKUP_MAGIC.length).equals(DB_BACKUP_MAGIC)) {
    throw new Error('Neznámy formát backupu (očakávaný MDBK1)')
  }

  let offset = DB_BACKUP_MAGIC.length
  const salt = blob.subarray(offset, offset + SALT_LEN)
  offset += SALT_LEN
  const iv = blob.subarray(offset, offset + IV_LEN)
  offset += IV_LEN
  const tag = blob.subarray(offset, offset + TAG_LEN)
  offset += TAG_LEN
  const ciphertext = blob.subarray(offset)

  const key = deriveKey(passphrase, salt)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function defaultBackupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')
  return `mini-drive-${stamp}.db.enc`
}
