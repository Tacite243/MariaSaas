import { ipcMain } from 'electron'
import { procedure } from '../lib/procedure'
import { qrCodeService } from '../services/QrCodeService'
import { z } from 'zod'

const generateQrSchema = z.object({
  text: z.string().min(1).max(500),
  size: z.number().int().min(40).max(400).optional()
})

export function setupQrHandlers() {
  ipcMain.removeHandler('qr:generate')

  ipcMain.handle(
    'qr:generate',
    procedure.input(generateQrSchema).query(async (input) => {
      return qrCodeService.toDataUrl(input.text, input.size ?? 80)
    })
  )
}
