import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api';
import { LoginInput } from '../shared/schemas/authSchema';
import { CreateUserInput, UpdateUserInput } from '../shared/schemas/userSchema';
import { ProductInput, CreateRequisitionInput } from '../shared/schemas/inventorySchema';
import { CreateSaleInput } from '@shared/schemas/salesSchema';
import { ApiResponse } from '../shared/api';


interface DashboardStats {
  revenueToday: number;
  salesCount: number;
  lowStockCount: number;
  stockValue: number;
  recentSales: any[]; // Typage à affiner selon la structure des ventes
}

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
        getHistory: (filter?: { from: Date | string; to: Date | string }) => Promise<ApiResponse<any[]>>;
      };
      finance: {
        getRate: () => Promise<ApiResponse<number>>;
        setRate: (data: { rate: number; userId: string }) => Promise<ApiResponse<void>>;
        getHistory: (filter?: { from: Date | string; to: Date | string }) => Promise<ApiResponse<any[]>>;
        createMovement: (data: any) => Promise<ApiResponse<any>>;
      };
      stats: {
        getDashboard: () => Promise<ApiResponse<any>>;
      };
    }
  }
}