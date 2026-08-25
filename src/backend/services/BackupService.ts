import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { prisma, getDatabasePath } from '../lib/prisma'
import {
  BackupCreateInput,
  BackupExportInput,
  BackupRestoreInput,
  BackupSettingsInput,
  BackupVerifyInput
} from '../../shared/schemas/backup.schema'
import {
  BackupRecordDTO,
  BackupStatusDTO,
  BackupVerifyResultDTO,
  RemovableDriveDTO
} from '../../shared/types/backup.types'
import {
  applyRetentionPolicy,
  computeFileSha256,
  formatBackupFileName,
  hoursSince,
  needsBackupAlert,
  buildMsBackupBuffer,
  parseMsBackupBuffer,
  APP_VERSION
} from '../../shared/utils/backupIntegrity'
import bcrypt from 'bcryptjs'

const escapeSqlPath = (p: string): string => p.replace(/'/g, "''")

export class BackupService {
  private getBackupDir(): string {
    const dir = path.join(app.getPath('userData'), 'backups')
    fs.mkdirSync(dir, { recursive: true })
    return dir
  }

  private async ensureSettings() {
    let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: 'default' } })
    }
    return settings
  }

  listRemovableDrives(): RemovableDriveDTO[] {
    const drives: RemovableDriveDTO[] = []

    if (process.platform === 'win32') {
      for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
        const drivePath = `${letter}:\\`
        try {
          fs.accessSync(drivePath, fs.constants.W_OK)
          drives.push({ path: drivePath, label: `Lecteur ${letter}:`, isRemovable: true })
        } catch {
          /* lecteur absent */
        }
      }
    } else {
      for (const base of ['/media', '/mnt', '/Volumes']) {
        if (!fs.existsSync(base)) continue
        for (const entry of fs.readdirSync(base)) {
          const full = path.join(base, entry)
          try {
            if (fs.statSync(full).isDirectory()) {
              fs.accessSync(full, fs.constants.W_OK)
              drives.push({ path: full, label: entry, isRemovable: true })
            }
          } catch {
            /* ignoré */
          }
        }
      }
    }

    return drives
  }

  async getStatus(): Promise<BackupStatusDTO> {
    const settings = await this.ensureSettings()
    const localBackupCount = await prisma.backupRecord.count({
      where: { destination: 'LOCAL' }
    })
    const lastBackupAt = settings.lastBackupAt?.toISOString() ?? null

    return {
      lastBackupAt,
      hoursSinceLastBackup: hoursSince(lastBackupAt),
      needsAlert: needsBackupAlert(lastBackupAt),
      retentionCount: settings.backupRetentionCount,
      autoOnZReport: settings.backupAutoOnZReport,
      localBackupCount
    }
  }

  async listHistory(): Promise<BackupRecordDTO[]> {
    const rows = await prisma.backupRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return rows.map((r) => this.mapRecord(r))
  }

  async updateSettings(data: BackupSettingsInput) {
    return prisma.appSettings.update({
      where: { id: 'default' },
      data: {
        ...(data.backupRetentionCount !== undefined
          ? { backupRetentionCount: data.backupRetentionCount }
          : {}),
        ...(data.backupAutoOnZReport !== undefined
          ? { backupAutoOnZReport: data.backupAutoOnZReport }
          : {})
      }
    })
  }

  /** Backup silencieux déclenché après clôture Z */
  async createSilentBackup(): Promise<BackupRecordDTO | null> {
    const settings = await this.ensureSettings()
    if (!settings.backupAutoOnZReport) return null
    try {
      return await this.createBackup({})
    } catch (err) {
      console.error('[Backup] Échec backup auto Z-Report:', err)
      return null
    }
  }

  async createBackup(data: BackupCreateInput): Promise<BackupRecordDTO> {
    const settings = await this.ensureSettings()
    const fileName = formatBackupFileName()
    const targetDir = data.drivePath ?? data.destinationPath ?? this.getBackupDir()
    fs.mkdirSync(targetDir, { recursive: true })

    const destPath = path.join(targetDir, fileName)
    const destination: BackupRecordDTO['destination'] = data.drivePath ? 'USB' : 'LOCAL'

    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(FULL)')
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escapeSqlPath(destPath)}'`)

    const sha256 = await computeFileSha256(destPath)
    const sizeBytes = fs.statSync(destPath).size

    const record = await prisma.backupRecord.create({
      data: { fileName, filePath: destPath, sizeBytes, sha256, destination }
    })

    await prisma.appSettings.update({
      where: { id: 'default' },
      data: { lastBackupAt: new Date() }
    })

    if (destination === 'LOCAL') {
      await this.applyRetention(settings.backupRetentionCount)
    }

    return this.mapRecord(record)
  }

  private async applyRetention(retentionCount: number) {
    const localRecords = await prisma.backupRecord.findMany({
      where: { destination: 'LOCAL' },
      orderBy: { createdAt: 'desc' }
    })
    const mapped = localRecords.map((r) => this.mapRecord(r))
    const { purge } = applyRetentionPolicy(mapped, retentionCount)

    for (const old of purge) {
      try {
        if (fs.existsSync(old.filePath)) fs.unlinkSync(old.filePath)
      } catch {
        /* fichier déjà supprimé */
      }
      await prisma.backupRecord.delete({ where: { id: old.id } })
    }
  }

  async exportMsBackup(data: BackupExportInput): Promise<BackupRecordDTO> {
    const tmpDb = path.join(os.tmpdir(), `mariasaas_export_${Date.now()}.db`)
    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(FULL)')
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escapeSqlPath(tmpDb)}'`)

    const dbBuffer = fs.readFileSync(tmpDb)
    fs.unlinkSync(tmpDb)

    const { buffer } = buildMsBackupBuffer(dbBuffer, { password: data.password })
    const fileName = `mariasaas_${new Date().toISOString().slice(0, 10)}.msbackup`
    const filePath = path.join(data.destinationPath, fileName)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, buffer)

    const sha256 = await computeFileSha256(filePath)
    const record = await prisma.backupRecord.create({
      data: {
        fileName,
        filePath,
        sizeBytes: buffer.length,
        sha256,
        destination: 'EXPORT'
      }
    })

    await prisma.appSettings.update({
      where: { id: 'default' },
      data: { lastBackupAt: new Date() }
    })

    return this.mapRecord(record)
  }

  async verifyFile(data: BackupVerifyInput): Promise<BackupVerifyResultDTO> {
    try {
      if (data.filePath.endsWith('.msbackup')) {
        const buf = fs.readFileSync(data.filePath)
        const { manifest } = parseMsBackupBuffer(buf, data.password)
        return {
          valid: true,
          sha256: manifest.sha256,
          appVersion: manifest.appVersion,
          createdAt: manifest.createdAt,
          encrypted: manifest.encrypted,
          schemaCompatible: manifest.schemaVersion.startsWith('5'),
          message: 'Archive .msbackup valide'
        }
      }

      if (!fs.existsSync(data.filePath)) {
        return {
          valid: false,
          sha256: '',
          appVersion: APP_VERSION,
          createdAt: new Date().toISOString(),
          encrypted: false,
          schemaCompatible: false,
          message: 'Fichier introuvable'
        }
      }

      const sha256 = await computeFileSha256(data.filePath)
      return {
        valid: true,
        sha256,
        appVersion: APP_VERSION,
        createdAt: new Date(fs.statSync(data.filePath).mtime).toISOString(),
        encrypted: false,
        schemaCompatible: true,
        message: 'Fichier SQLite valide'
      }
    } catch (err) {
      return {
        valid: false,
        sha256: '',
        appVersion: APP_VERSION,
        createdAt: new Date().toISOString(),
        encrypted: Boolean(data.password),
        schemaCompatible: false,
        message: err instanceof Error ? err.message : 'Fichier invalide'
      }
    }
  }

  async restoreBackup(data: BackupRestoreInput): Promise<{ requiresRestart: boolean }> {
    const admin = await prisma.user.findUnique({ where: { email: data.adminEmail } })
    if (!admin) throw new Error('Administrateur introuvable')
    if (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN') {
      throw new Error('Seul un administrateur peut restaurer une sauvegarde')
    }
    const valid = await bcrypt.compare(data.adminPassword, admin.password)
    if (!valid) throw new Error('Mot de passe administrateur incorrect')

    const verify = await this.verifyFile({ filePath: data.backupPath })
    if (!verify.valid) throw new Error(verify.message ?? 'Sauvegarde invalide')

    let dbBuffer: Buffer
    if (data.backupPath.endsWith('.msbackup')) {
      const parsed = parseMsBackupBuffer(fs.readFileSync(data.backupPath))
      dbBuffer = parsed.dbBuffer
    } else {
      dbBuffer = fs.readFileSync(data.backupPath)
    }

    const dbPath = getDatabasePath()
    const backupCurrent = `${dbPath}.pre-restore-${Date.now()}`
    if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, backupCurrent)

    await prisma.$disconnect()
    fs.writeFileSync(dbPath, dbBuffer)

    return { requiresRestart: true }
  }

  private mapRecord(r: {
    id: string
    fileName: string
    filePath: string
    sizeBytes: number
    sha256: string
    destination: string
    createdAt: Date
  }): BackupRecordDTO {
    return {
      id: r.id,
      fileName: r.fileName,
      filePath: r.filePath,
      sizeBytes: r.sizeBytes,
      sha256: r.sha256,
      createdAt: r.createdAt.toISOString(),
      destination: r.destination as BackupRecordDTO['destination']
    }
  }
}

export const backupService = new BackupService()
