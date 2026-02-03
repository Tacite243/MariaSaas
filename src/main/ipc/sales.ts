import { ipcMain } from 'electron';
import { procedure } from '../lib/procedure';
import { salesService } from '../services/salesService';
import { createSaleSchema } from '../../shared/schemas/salesSchema';

export function setupSalesHandlers() {
    ipcMain.removeHandler('sales:create');

    ipcMain.handle(
        'sales:create',
        procedure.input(createSaleSchema).mutation(async (input) => {
            return await salesService.processSale(input);
        })
    );
}