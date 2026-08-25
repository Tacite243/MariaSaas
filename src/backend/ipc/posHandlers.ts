import { ipcMain } from 'electron'
import { procedure } from '../lib/procedure'
import { cashSessionService } from '../services/CashSessionService'
import { printService } from '../services/PrintService'
import { auditService } from '../services/auditService'
import { lanClientService } from '../services/LanClientService'
import { prisma } from '../lib/prisma'
import {
  cashSessionCloseSchema,
  cashSessionOpenSchema,
  printReceiptSchema,
  printSettingsSchema,
  productByCodeSchema
} from '../../shared/schemas/pos.schema'
import { z } from 'zod'

export function setupPosHandlers() {
  ipcMain.removeHandler('pos:open-session')
  ipcMain.removeHandler('pos:close-session')
  ipcMain.removeHandler('pos:get-active-session')
  ipcMain.removeHandler('pos:get-z-report')
  ipcMain.removeHandler('pos:print-receipt')
  ipcMain.removeHandler('pos:get-printers')
  ipcMain.removeHandler('pos:get-print-settings')
  ipcMain.removeHandler('pos:update-print-settings')
  ipcMain.removeHandler('pos:find-product-by-code')
  ipcMain.removeHandler('pos:get-audit-logs')

  ipcMain.handle(
    'pos:open-session',
    procedure.input(cashSessionOpenSchema).mutation(async (input) => {
      return cashSessionService.openSession(input)
    })
  )

  ipcMain.handle(
    'pos:close-session',
    procedure.input(cashSessionCloseSchema).mutation(async (input) => {
      return cashSessionService.closeSession(input)
    })
  )

  ipcMain.handle('pos:get-active-session', async (_event, cashierId: string) => {
    if (!cashierId) return { success: false, error: { message: 'cashierId requis', code: 'VALIDATION_FAILED' } }
    const data = await cashSessionService.getActiveSession(cashierId)
    return { success: true, data }
  })

  ipcMain.handle(
    'pos:get-z-report',
    procedure.input(z.object({ sessionId: z.string().uuid() })).query(async (input) => {
      return cashSessionService.getZReport(input.sessionId)
    })
  )

  ipcMain.handle(
    'pos:print-receipt',
    procedure.input(printReceiptSchema).mutation(async (input) => {
      const result = await printService.printReceipt(input)
      return result
    })
  )

  ipcMain.handle('pos:get-printers', async () => {
    const data = await printService.getPrinters()
    return { success: true, data }
  })

  ipcMain.handle('pos:get-print-settings', async () => {
    const data = await printService.getSettings()
    return { success: true, data }
  })

  ipcMain.handle(
    'pos:update-print-settings',
    procedure.input(printSettingsSchema).mutation(async (input) => {
      return printService.updateSettings(input)
    })
  )

  ipcMain.handle(
    'pos:find-product-by-code',
    procedure.input(productByCodeSchema).query(async (input) => {
      if (await lanClientService.isClient()) {
        const product = await lanClientService.findProductByCode(input.code)
        if (!product) throw new Error(`Produit introuvable pour le code: ${input.code}`)
        return product
      }
      const product = await prisma.product.findFirst({
        where: {
          OR: [{ code: input.code }, { codeCip7: input.code }],
          currentStock: { gt: 0 }
        },
        include: {
          lots: {
            where: { quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
            take: 1
          }
        }
      })
      if (!product) throw new Error(`Produit introuvable pour le code: ${input.code}`)
      return product
    })
  )

  ipcMain.handle('pos:get-audit-logs', async () => {
    const data = await auditService.list()
    return { success: true, data }
  })
}
