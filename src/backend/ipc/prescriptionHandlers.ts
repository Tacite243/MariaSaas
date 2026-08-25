import { ipcMain } from 'electron'
import { procedure } from '../lib/procedure'
import { prescriptionService } from '../services/PrescriptionService'
import { createPrescriptionsSchema, prescriptionFilterSchema } from '../../shared/schemas/stock.schema'

export function setupPrescriptionHandlers() {
  ipcMain.removeHandler('prescription:create')
  ipcMain.removeHandler('prescription:list')

  ipcMain.handle(
    'prescription:create',
    procedure.input(createPrescriptionsSchema).mutation(async (input) =>
      prescriptionService.createRegisters(input)
    )
  )

  ipcMain.handle(
    'prescription:list',
    procedure.input(prescriptionFilterSchema.optional()).query(async (input) =>
      prescriptionService.list(input)
    )
  )
}
