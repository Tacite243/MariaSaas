import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api';
import { LoginInput } from '../shared/schemas/authSchema';
import { CreateUserInput, UpdateUserInput } from '../shared/schemas/userSchema';
import { ProductInput, CreateRequisitionInput } from '../shared/schemas/inventorySchema';
import { CreateSaleInput } from '@shared/schemas/salesSchema';


declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        login: (data: LoginInput) => Promise<ApiResponse<any>>;
        logout: () => Promise<ApiResponse<void>>;
      };
      users: {
        getAll: () => Promise<ApiResponse<any[]>>;
        create: (data: CreateUserInput) => Promise<ApiResponse<any>>;
        update: (data: UpdateUserInput) => Promise<ApiResponse<any>>;
        delete: (id: string, currentUserId: string) => Promise<ApiResponse<void>>;
      };
      inventory: {
        getProducts: () => Promise<ApiResponse<any[]>>;
        createProduct: (data: ProductInput) => Promise<ApiResponse<any>>;
        getSuppliers: () => Promise<ApiResponse<any[]>>;
        createDraft: (data: CreateRequisitionInput) => Promise<ApiResponse<any>>;
        validateRequisition: (id: string) => Promise<ApiResponse<any>>;
        getRequisitions: () => Promise<ApiResponse<any[]>>;
      };
      sales: {
        create: (data: CreateSaleInput) => Promise<ApiResponse<any>>;
      };
      finance: {
        getLatestRate: () => Promise<ApiResponse<any>>;
      };
    }
  }
}