import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api';
import { LoginInput } from '../shared/schemas/authSchema';
import { CreateUserInput, UpdateUserInput } from '@shared/schemas/userSchema';

// Tu peux créer un type UserDTO shared pour éviter d'importer Prisma ici
// Pour simplifier, disons any[] pour l'instant ou crée un type User sans password
interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        login: (data: LoginInput) => Promise<ApiResponse>;
        logout: () => Promise<ApiResponse<void>>;
      },
      users: {
        getAll: () => Promise<ApiResponse<UserDTO[]>>;
        create: (data: CreateUserInput) => Promise<ApiResponse<UserDTO>>;
        update: (data: UpdateUserInput) => Promise<ApiResponse<UserDTO>>;
        delete: (id: string, currentUserId: string) => Promise<ApiResponse<void>>
      }
    }
  }
}
