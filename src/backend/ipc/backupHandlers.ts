import { ipcMain, dialog } from 'electron'
import { procedure } from '../lib/procedure'
import { backupService } from '../services/BackupService'
import {
  backupCreateSchema,
  backupExportSchema,
  backupRestoreSchema,
  backupSettingsSchema,
  backupVerifySchema
} from '../../shared/schemas/backup.schema'

export function setupBackupHandlers() {
  ipcMain.removeHandler('backup:get-status')
  ipcMain.removeHandler('backup:list-history')
  ipcMain.removeHandler('backup:list-drives')
  ipcMain.removeHandler('backup:create')
  ipcMain.removeHandler('backup:export')
  ipcMain.removeHandler('backup:verify-file')
  ipcMain.removeHandler('backup:restore')
  ipcMain.removeHandler('backup:update-settings')
  ipcMain.removeHandler('backup:pick-restore-file')
  ipcMain.removeHandler('backup:pick-export-folder')

  ipcMain.handle('backup:get-status', async () => {
    const data = await backupService.getStatus()
    return { success: true, data }
  })

  ipcMain.handle('backup:list-history', async () => {
    const data = await backupService.listHistory()
    return { success: true, data }
  })

  ipcMain.handle('backup:list-drives', async () => {
    const data = backupService.listRemovableDrives()
    return { success: true, data }
  })

  ipcMain.handle(
    'backup:create',
    procedure.input(backupCreateSchema).mutation(async (input) => {
      return backupService.createBackup(input)
    })
  )

  ipcMain.handle(
    'backup:export',
    procedure.input(backupExportSchema).mutation(async (input) => {
      return backupService.exportMsBackup(input)
    })
  )

  ipcMain.handle(
    'backup:verify-file',
    procedure.input(backupVerifySchema).query(async (input) => {
      return backupService.verifyFile(input)
    })
  )

  ipcMain.handle(
    'backup:restore',
    procedure.input(backupRestoreSchema).mutation(async (input) => {
      return backupService.restoreBackup(input)
    })
  )

  ipcMain.handle(
    'backup:update-settings',
    procedure.input(backupSettingsSchema).mutation(async (input) => {
      return backupService.updateSettings(input)
    })
  )

  ipcMain.handle('backup:pick-restore-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Sélectionner une sauvegarde',
      filters: [
        { name: 'Sauvegardes MariaSaaS', extensions: ['db', 'msbackup'] },
        { name: 'Tous', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return { success: true, data: null }
    return { success: true, data: result.filePaths[0] }
  })

  ipcMain.handle('backup:pick-export-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Dossier de destination export',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return { success: true, data: null }
    return { success: true, data: result.filePaths[0] }
  })
}
