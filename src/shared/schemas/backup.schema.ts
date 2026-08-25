import { z } from 'zod'

export const backupCreateSchema = z.object({
  destinationPath: z.string().optional(),
  drivePath: z.string().optional()
})

export const backupRestoreSchema = z.object({
  backupPath: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(1)
})

export const backupExportSchema = z.object({
  destinationPath: z.string().min(1),
  password: z.string().optional()
})

export const backupVerifySchema = z.object({
  filePath: z.string().min(1),
  password: z.string().optional()
})

export const backupSettingsSchema = z.object({
  backupRetentionCount: z.number().int().min(1).max(365).optional(),
  backupAutoOnZReport: z.boolean().optional()
})

export type BackupCreateInput = z.infer<typeof backupCreateSchema>
export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>
export type BackupExportInput = z.infer<typeof backupExportSchema>
export type BackupVerifyInput = z.infer<typeof backupVerifySchema>
export type BackupSettingsInput = z.infer<typeof backupSettingsSchema>
