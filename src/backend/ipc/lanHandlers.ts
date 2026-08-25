import { ipcMain } from 'electron'
import { procedure } from '../lib/procedure'
import { lanServerService } from '../services/LanServerService'
import { lanClientService } from '../services/LanClientService'
import { lanConfigSchema, lanPairSchema } from '../../shared/schemas/lan.schema'

export function setupLanHandlers() {
  ipcMain.removeHandler('lan:get-status')
  ipcMain.removeHandler('lan:configure')
  ipcMain.removeHandler('lan:start-server')
  ipcMain.removeHandler('lan:stop-server')
  ipcMain.removeHandler('lan:pair-client')

  ipcMain.handle('lan:get-status', async () => {
    const settings = await lanClientService.getConfig()
    const data =
      settings.lanMode === 'SERVER'
        ? await lanServerService.getStatus()
        : await lanClientService.getStatus()
    return { success: true, data }
  })

  ipcMain.handle(
    'lan:configure',
    procedure.input(lanConfigSchema).mutation(async (input) => {
      return lanServerService.configure(input)
    })
  )

  ipcMain.handle('lan:start-server', async () => {
    const data = await lanServerService.start()
    return { success: true, data }
  })

  ipcMain.handle('lan:stop-server', async () => {
    await lanServerService.stop()
    return { success: true, data: true }
  })

  ipcMain.handle(
    'lan:pair-client',
    procedure.input(lanPairSchema).mutation(async (input) => {
      return lanClientService.pair(input)
    })
  )
}
