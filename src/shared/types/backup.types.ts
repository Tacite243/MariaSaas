export interface BackupRecordDTO {
  id: string
  fileName: string
  filePath: string
  sizeBytes: number
  sha256: string
  createdAt: string
  destination: 'LOCAL' | 'USB' | 'EXPORT'
}

export interface BackupStatusDTO {
  lastBackupAt: string | null
  hoursSinceLastBackup: number | null
  needsAlert: boolean
  retentionCount: number
  autoOnZReport: boolean
  localBackupCount: number
}

export interface RemovableDriveDTO {
  path: string
  label: string
  isRemovable: boolean
}

export interface BackupVerifyResultDTO {
  valid: boolean
  sha256: string
  appVersion: string
  createdAt: string
  encrypted: boolean
  schemaCompatible: boolean
  message?: string
}

export interface MsBackupManifest {
  magic: 'MSBK'
  version: 1
  appVersion: string
  createdAt: string
  sha256: string
  encrypted: boolean
  compressed: boolean
  schemaVersion: string
}
