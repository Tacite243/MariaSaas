import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api'
import { LoginInput } from '../shared/schemas/authSchema'
import { CreateUserInput, UpdateUserInput, UpdateProfileInput } from '../shared/schemas/userSchema'
import { ProductInput, CreateRequisitionInput } from '../shared/schemas/inventorySchema'
import { CreateSaleInput } from '../shared/schemas/salesSchema'
import { CreateClientInput, UpdateClientInput } from '../shared/schemas/clientSchema'
import { CreateSupplierInput, UpdateSupplierInput } from '../shared/schemas/supplierSchema'
import {
  UserDTO,
  ProductDTO,
  SaleDTO,
  RequisitionDTO,
  CashMovementDTO,
  DashboardStatsDTO,
  SupplierDTO,
  ClientDTO,
} from '../shared/types'



declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        login: (data: LoginInput) => Promise<ApiResponse<UserDTO>>
        logout: () => Promise<ApiResponse<void>>
        updateProfile: (data: UpdateProfileInput) => Promise<ApiResponse<UserDTO>>
      }
      users: {
        getAll: () => Promise<ApiResponse<UserDTO[]>>
        create: (data: CreateUserInput) => Promise<ApiResponse<UserDTO>>
        update: (data: UpdateUserInput) => Promise<ApiResponse<UserDTO>>
        delete: (id: string, currentUserId: string) => Promise<ApiResponse<void>>
      }
      inventory: {
        getProducts: () => Promise<ApiResponse<ProductDTO[]>>
        createProduct: (data: ProductInput) => Promise<ApiResponse<ProductDTO>>
        updateProduct: (id: string, data: Partial<ProductInput>) => Promise<ApiResponse<ProductDTO>>
        deleteProduct: (id: string) => Promise<ApiResponse<void>>
        createSupplier: (data: CreateSupplierInput, role: string) => Promise<ApiResponse<SupplierDTO>>
        updateSupplier: (data: UpdateSupplierInput, role: string) => Promise<ApiResponse<SupplierDTO>>
        deleteSupplier: (id: string, role: string) => Promise<ApiResponse<void>>
        getSuppliers: () => Promise<ApiResponse<SupplierDTO[]>>
        createDraft: (data: CreateRequisitionInput) => Promise<ApiResponse<RequisitionDTO>>
        validateRequisition: (id: string) => Promise<ApiResponse<RequisitionDTO>>
        getRequisitions: () => Promise<ApiResponse<RequisitionDTO[]>>
      }
      sales: {
        create: (data: CreateSaleInput) => Promise<ApiResponse<SaleDTO>>
        getHistory: (filter?: {
          from: Date | string
          to: Date | string
        }) => Promise<ApiResponse<SaleDTO[]>>
      }
      finance: {
        getRate: () => Promise<ApiResponse<number>>
        setRate: (data: { rate: number; userId: string }) => Promise<ApiResponse<void>>
        getHistory: (filter?: {
          from: Date | string
          to: Date | string
        }) => Promise<ApiResponse<CashMovementDTO[]>>
        createMovement: (data: {
          type: 'IN' | 'OUT'
          amount: number
          description: string
          performedBy: string
        }) => Promise<ApiResponse<CashMovementDTO>>
      }
      stats: {
        getDashboard: () => Promise<ApiResponse<DashboardStatsDTO>>
      }
      clients: {
        list: (query?: string) => Promise<ApiResponse<ClientDTO[]>>
        create: (data: CreateClientInput, role: string) => Promise<ApiResponse<ClientDTO>>
        update: (data: UpdateClientInput, role: string) => Promise<ApiResponse<ClientDTO>>
        delete: (id: string, role: string) => Promise<ApiResponse<void>>
      }
      pos: {
        openSession: (data: import('../shared/schemas/pos.schema').CashSessionOpenInput) => Promise<ApiResponse<unknown>>
        closeSession: (data: import('../shared/schemas/pos.schema').CashSessionCloseInput) => Promise<ApiResponse<unknown>>
        getActiveSession: (cashierId: string) => Promise<ApiResponse<unknown>>
        getZReport: (sessionId: string) => Promise<ApiResponse<unknown>>
        printReceipt: (data: import('../shared/schemas/pos.schema').PrintReceiptInput) => Promise<ApiResponse<{ success: boolean }>>
        getPrinters: () => Promise<ApiResponse<{ name: string; displayName: string; isDefault: boolean }[]>>
        getPrintSettings: () => Promise<ApiResponse<unknown>>
        updatePrintSettings: (data: import('../shared/schemas/pos.schema').PrintSettingsInput) => Promise<ApiResponse<unknown>>
        findProductByCode: (code: string) => Promise<ApiResponse<unknown>>
        getAuditLogs: () => Promise<ApiResponse<unknown[]>>
      }
      cashSession: {
        open: (data: import('../shared/schemas/pos.schema').CashSessionOpenInput) => Promise<ApiResponse<unknown>>
        close: (data: import('../shared/schemas/pos.schema').CashSessionCloseInput) => Promise<ApiResponse<unknown>>
        getActive: (cashierId: string) => Promise<ApiResponse<unknown>>
        getZReport: (sessionId: string) => Promise<ApiResponse<unknown>>
      }
      qr: {
        generate: (text: string, size?: number) => Promise<ApiResponse<string>>
      }
    }
  }
}