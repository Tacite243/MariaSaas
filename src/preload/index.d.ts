import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api';
import { LoginInput } from '../shared/schemas/authSchema';

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        login: (data: LoginInput) => Promise<ApiResponse>;
        logout: () => Promise<ApiResponse<void>>;
      }
    }
  }
}
