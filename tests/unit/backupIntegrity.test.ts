import { describe, it, expect } from 'vitest'
import {
  applyRetentionPolicy,
  computeBufferSha256,
  needsBackupAlert,
  buildMsBackupBuffer,
  parseMsBackupBuffer
} from '@shared/utils/backupIntegrity'
import { BackupRecordDTO } from '@shared/types/backup.types'

describe('backupIntegrity', () => {
  it('calcule le hash SHA-256 d\'un buffer', () => {
    const hash = computeBufferSha256(Buffer.from('mariasaas-test'))
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]+$/)
  })

  it('applique la rétention sur 30 sauvegardes', () => {
    const records: BackupRecordDTO[] = Array.from({ length: 35 }, (_, i) => ({
      id: String(i),
      fileName: `backup_${i}.db`,
      filePath: `/tmp/backup_${i}.db`,
      sizeBytes: 1000,
      sha256: 'abc',
      destination: 'LOCAL',
      createdAt: new Date(2026, 0, i + 1).toISOString()
    }))

    const { keep, purge } = applyRetentionPolicy(records, 30)
    expect(keep).toHaveLength(30)
    expect(purge).toHaveLength(5)
  })

  it('déclenche une alerte après 24h sans backup', () => {
    const recent = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const old = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()

    expect(needsBackupAlert(recent)).toBe(false)
    expect(needsBackupAlert(old)).toBe(true)
    expect(needsBackupAlert(null)).toBe(true)
  })

  it('exporte et parse un fichier .msbackup', () => {
    const db = Buffer.from('SQLite fake db content for test')
    const { buffer } = buildMsBackupBuffer(db)
    const parsed = parseMsBackupBuffer(buffer)
    expect(parsed.dbBuffer.toString()).toBe(db.toString())
  })

  it('chiffre et déchiffre un export .msbackup', () => {
    const db = Buffer.from('encrypted backup test payload')
    const { buffer } = buildMsBackupBuffer(db, { password: 'secret-pharmacy' })
    const parsed = parseMsBackupBuffer(buffer, 'secret-pharmacy')
    expect(parsed.manifest.encrypted).toBe(true)
    expect(parsed.dbBuffer.toString()).toBe(db.toString())
  })
})
