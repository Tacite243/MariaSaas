import { ipcMain } from 'electron';
import { financeService } from '../services/financeService';

export function setupFinanceHandlers() {
    // Nettoyage (Anti-doublons HMR)
    ipcMain.removeHandler('finance:get-rate');
    ipcMain.removeHandler('finance:set-rate');

    // 1. GET RATE
    ipcMain.handle('finance:get-rate', async () => {
        try {
            const rate = await financeService.getLatestRate();
            // On renvoie TOUJOURS { success: true, data: ... }
            return { success: true, data: rate };
        } catch (error: any) {
            return { success: false, error: { message: error.message } };
        }
    });

    // 2. SET RATE
    ipcMain.handle('finance:set-rate', async (_event, { rate, userId }) => {
        try {
            await financeService.setDailyRate(rate, userId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: { message: error.message } };
        }
    });
}