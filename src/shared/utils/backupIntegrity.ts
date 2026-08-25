import { createHash, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { gzipSync, gunzipSync } from 'node:zlib'
import { BackupRecordDTO, MsBackupManifest } from '../types/backup.types'

export const MSBACKUP_MAGIC = 'MSBK'
export const DEFAULT_RETENTION_COUNT = 30
export const BACKUP_ALERT_HOURS = 24
export const MSBACKUP_VERSION = 1
export const APP_VERSION = '1.0.0'

export const computeFileSha256 = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })

export const computeBufferSha256 = (buffer: Buffer): string =>
  createHash('sha256').update(buffer).digest('hex')

/** Conserve les N sauvegardes les plus récentes (tri par date décroissante). */
export const applyRetentionPolicy = (
  records: BackupRecordDTO[],
  retentionCount: number
): { keep: BackupRecordDTO[]; purge: BackupRecordDTO[] } => {
  const sorted = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return {
    keep: sorted.slice(0, retentionCount),
    purge: sorted.slice(retentionCount)
  }
}

export const hoursSince = (isoDate: string | null, now = new Date()): number | null => {
  if (!isoDate) return null
  const diff = now.getTime() - new Date(isoDate).getTime()
  return diff / (1000 * 60 * 60)
}

export const needsBackupAlert = (
  lastBackupAt: string | null,
  alertHours = BACKUP_ALERT_HOURS
): boolean => {
  const hours = hoursSince(lastBackupAt)
  if (hours === null) return true
  return hours >= alertHours
}

export const formatBackupFileName = (date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `mariasaas_backup_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.db`
}

const deriveKey = (password: string, salt: Buffer): Buffer =>
  scryptSync(password, salt, 32)

export const encryptPayload = (plain: Buffer, password: string): Buffer => {
  const salt = randomBytes(16)
  const key = deriveKey(password, salt)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([salt, iv, tag, encrypted])
}

export const decryptPayload = (payload: Buffer, password: string): Buffer => {
  const salt = payload.subarray(0, 16)
  const iv = payload.subarray(16, 28)
  const tag = payload.subarray(28, 44)
  const data = payload.subarray(44)
  const key = deriveKey(password, salt)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()])
}

export const buildMsBackupBuffer = (
  dbBuffer: Buffer,
  options?: { password?: string }
): { buffer: Buffer; manifest: MsBackupManifest } => {
  const compressed = gzipSync(dbBuffer)
  const sha256 = computeBufferSha256(dbBuffer)
  const encrypted = Boolean(options?.password)
  const payload = encrypted && options?.password
    ? encryptPayload(compressed, options.password)
    : compressed

  const manifest: MsBackupManifest = {
    magic: MSBACKUP_MAGIC,
    version: MSBACKUP_VERSION,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    sha256,
    encrypted,
    compressed: true,
    schemaVersion: '5.22.0'
  }

  const manifestJson = Buffer.from(JSON.stringify(manifest), 'utf8')
  const header = Buffer.alloc(8)
  header.write(MSBACKUP_MAGIC, 0, 4, 'ascii')
  header.writeUInt32BE(manifestJson.length, 4)

  return { buffer: Buffer.concat([header, manifestJson, payload]), manifest }
}

export const parseMsBackupBuffer = (
  fileBuffer: Buffer,
  password?: string
): { manifest: MsBackupManifest; dbBuffer: Buffer } => {
  const magic = fileBuffer.subarray(0, 4).toString('ascii')
  if (magic !== MSBACKUP_MAGIC) throw new Error('Fichier .msbackup invalide (magic)')

  const manifestLen = fileBuffer.readUInt32BE(4)
  const manifestJson = fileBuffer.subarray(8, 8 + manifestLen).toString('utf8')
  const manifest = JSON.parse(manifestJson) as MsBackupManifest
  let payload = fileBuffer.subarray(8 + manifestLen)

  if (manifest.encrypted) {
    if (!password) throw new Error('Mot de passe requis pour ce fichier chiffré')
    payload = decryptPayload(payload, password)
  }

  const dbBuffer = manifest.compressed ? gunzipSync(payload) : payload
  const sha256 = computeBufferSha256(dbBuffer)
  if (sha256 !== manifest.sha256) throw new Error('Checksum SHA-256 invalide — fichier corrompu')

  return { manifest, dbBuffer }
}
