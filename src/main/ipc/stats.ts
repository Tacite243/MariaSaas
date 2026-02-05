import { ipcMain } from 'electron';
import { statsService } from '../services/statsService';

export function setupStatsHandlers() {
    // Nettoyage (Anti-Crash HMR)
    ipcMain.removeHandler('stats:get-dashboard');

    // Enregistrement de la route
    ipcMain.handle('stats:get-dashboard', async () => {
        try {
            const data = await statsService.getDashboardStats();
            return { success: true, data };
        } catch (e: any) {
            console.error("Stats Error:", e);
            return { success: false, error: { message: e.message } };
        }
    });
}