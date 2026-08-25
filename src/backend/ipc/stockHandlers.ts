import { ipcMain } from 'electron'
import { procedure } from '../lib/procedure'
import { stockService } from '../services/StockService'
import {
  writeOffSchema,
  stockAuditCreateSchema,
  stockAuditAddItemsSchema,
  stockAuditCompleteSchema
} from '../../shared/schemas/stock.schema'
import { z } from 'zod'

export function setupStockHandlers() {
  ipcMain.removeHandler('stock:get-expiring-batches')
  ipcMain.removeHandler('stock:write-off')
  ipcMain.removeHandler('stock:create-audit')
  ipcMain.removeHandler('stock:add-audit-items')
  ipcMain.removeHandler('stock:complete-audit')
  ipcMain.removeHandler('stock:list-audits')
  ipcMain.removeHandler('stock:get-audit')

  ipcMain.handle('stock:get-expiring-batches', async () => {
    const data = await stockService.getExpiringBatches()
    return { success: true, data }
  })

  ipcMain.handle(
    'stock:write-off',
    procedure.input(writeOffSchema).mutation(async (input) => stockService.writeOffLot(input))
  )

  ipcMain.handle(
    'stock:create-audit',
    procedure.input(stockAuditCreateSchema).mutation(async (input) => stockService.createAudit(input))
  )

  ipcMain.handle(
    'stock:add-audit-items',
    procedure.input(stockAuditAddItemsSchema).mutation(async (input) => stockService.addAuditItems(input))
  )

  ipcMain.handle(
    'stock:complete-audit',
    procedure.input(stockAuditCompleteSchema).mutation(async (input) => stockService.completeAudit(input))
  )

  ipcMain.handle('stock:list-audits', async () => {
    const data = await stockService.listAudits()
    return { success: true, data }
  })

  ipcMain.handle(
    'stock:get-audit',
    procedure.input(z.object({ auditId: z.string().uuid() })).query(async (input) =>
      stockService.getAudit(input.auditId)
    )
  )
}
