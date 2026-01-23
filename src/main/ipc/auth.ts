import { ipcMain } from 'electron';
import { authService } from '../services/authService';
import { procedure } from '../lib/procedure';
import { loginSchema } from '../../shared/schemas/authSchema';

export function setupAuthHandlers() {
  
  // 🟢 C'EST ICI LA CORRECTION :
  // On supprime les anciennes routes pour éviter le conflit "Second handler"
  // lors du rechargement de l'application.
  ipcMain.removeHandler('auth:login');
  ipcMain.removeHandler('auth:logout');

  // 1. Route LOGIN
  ipcMain.handle(
    'auth:login', 
    procedure
      .input(loginSchema)
      .mutation(async (input) => {
        return await authService.login(input);
      })
  );

  // 2. Route LOGOUT
  ipcMain.handle('auth:logout', async () => {
    return { success: true };
  });
}
