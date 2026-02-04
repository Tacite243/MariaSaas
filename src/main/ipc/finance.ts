import { ipcMain } from 'electron';
import { procedure } from '../lib/procedure';
import { financeService } from '../services/financeService';
import { financeSchema } from '@shared/schemas/financeSchema';


export default function setupFinanceHandlers() {
    ipcMain.removeHandler('finance:getLatestRate');

    ipcMain.handle(
        'finance:getLatestRate',
        procedure.input(financeSchema).mutation(async () => {
            return await financeService.getLatestRate();
        })
    )
}