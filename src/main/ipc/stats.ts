import { ipcMain } from 'electron';
import { statsService } from '../services/statsService';

export function setupStatsHandlers() {
    ipcMain.removeHandler('stats:get-dashboard');

    ipcMain.handle('stats:get-dashboard', async () => {
        try {
            const data = await statsService.getDashboardStats();
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: { message: e.message } };
        }
    });
}