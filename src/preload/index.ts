// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { LoginInput } from '../shared/schemas/authSchema'
import { CreateUserInput, UpdateUserInput, UpdateProfileInput } from '@shared/schemas/userSchema'
import { CreateClientInput, UpdateClientInput } from '../shared/schemas/clientSchema'
import { CreateSupplierInput, UpdateSupplierInput } from '@shared/schemas/supplierSchema'
import { ProductInput } from '@shared/schemas/inventorySchema'

const api = {
  auth: {
    login: (data: LoginInput) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    updateProfile: (data: UpdateProfileInput) => ipcRenderer.invoke('auth:update-profile', data)
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:get-all'),
    create: (data: CreateUserInput) => ipcRenderer.invoke('users:create', data),
    update: (data: UpdateUserInput) => ipcRenderer.invoke('users:update', data),
    delete: (id: string, currentUserId: string) =>
      ipcRenderer.invoke('users:delete', { id, currentUserId })
  },
  inventory: {
    getProducts: () => ipcRenderer.invoke('inventory:get-products'),
    updateProduct: (id: string, data: Partial<ProductInput>) => ipcRenderer.invoke('inventory:update-product', { id, data }),
    deleteProduct: (id: string) => ipcRenderer.invoke('inventory:delete-product', id),
    createProduct: (data) => ipcRenderer.invoke('inventory:create-product', data),
    getSuppliers: () => ipcRenderer.invoke('inventory:get-suppliers'),
    createDraft: (data) => ipcRenderer.invoke('inventory:create-draft', data),
    validateRequisition: (id) => ipcRenderer.invoke('inventory:validate', id),
    getRequisitions: () => ipcRenderer.invoke('inventory:get-requisitions'),
    createSupplier: (data: CreateSupplierInput, role: string) =>
      ipcRenderer.invoke('inventory:create-supplier', { data, role }),
    updateSupplier: (data: UpdateSupplierInput, role: string) =>
      ipcRenderer.invoke('inventory:update-supplier', { data, role }),
    deleteSupplier: (id: string, role: string) =>
      ipcRenderer.invoke('inventory:delete-supplier', { id, role })
  },
  clients: {
    list: (query?: string) => ipcRenderer.invoke('clients:list', query),
    create: (data: CreateClientInput, role: string) =>
      ipcRenderer.invoke('clients:create', { data, role }),
    update: (data: UpdateClientInput, role: string) =>
      ipcRenderer.invoke('clients:update', { data, role }),
    delete: (id: string, role: string) => ipcRenderer.invoke('clients:delete', { id, role })
  },
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data),
    getHistory: (filter) => ipcRenderer.invoke('sales:history', filter)
  },
  finance: {
    getRate: () => ipcRenderer.invoke('finance:get-rate'),
    setRate: (data) => ipcRenderer.invoke('finance:set-rate', data),
    getHistory: (filter) => ipcRenderer.invoke('finance:get-history', filter),
    createMovement: (data) => ipcRenderer.invoke('finance:create-movement', data)
  },
  stats: {
    getDashboard: () => ipcRenderer.invoke('stats:get-dashboard')
  },
  pos: {
    openSession: (data) => ipcRenderer.invoke('pos:open-session', data),
    closeSession: (data) => ipcRenderer.invoke('pos:close-session', data),
    getActiveSession: (cashierId: string) => ipcRenderer.invoke('pos:get-active-session', cashierId),
    getZReport: (sessionId: string) => ipcRenderer.invoke('pos:get-z-report', { sessionId }),
    printReceipt: (data) => ipcRenderer.invoke('pos:print-receipt', data),
    getPrinters: () => ipcRenderer.invoke('pos:get-printers'),
    getPrintSettings: () => ipcRenderer.invoke('pos:get-print-settings'),
    updatePrintSettings: (data) => ipcRenderer.invoke('pos:update-print-settings', data),
    findProductByCode: (code: string) => ipcRenderer.invoke('pos:find-product-by-code', { code }),
    getAuditLogs: () => ipcRenderer.invoke('pos:get-audit-logs')
  },
  cashSession: {
    open: (data) => ipcRenderer.invoke('pos:open-session', data),
    close: (data) => ipcRenderer.invoke('pos:close-session', data),
    getActive: (cashierId: string) => ipcRenderer.invoke('pos:get-active-session', cashierId),
    getZReport: (sessionId: string) => ipcRenderer.invoke('pos:get-z-report', { sessionId })
  },
  qr: {
    generate: (text: string, size?: number) => ipcRenderer.invoke('qr:generate', { text, size })
  },
  stock: {
    getExpiringBatches: () => ipcRenderer.invoke('stock:get-expiring-batches'),
    writeOff: (data) => ipcRenderer.invoke('stock:write-off', data),
    createAudit: (data) => ipcRenderer.invoke('stock:create-audit', data),
    addAuditItems: (data) => ipcRenderer.invoke('stock:add-audit-items', data),
    completeAudit: (data) => ipcRenderer.invoke('stock:complete-audit', data),
    listAudits: () => ipcRenderer.invoke('stock:list-audits'),
    getAudit: (auditId: string) => ipcRenderer.invoke('stock:get-audit', { auditId })
  },
  prescription: {
    create: (data) => ipcRenderer.invoke('prescription:create', data),
    list: (filter) => ipcRenderer.invoke('prescription:list', filter),
    print: (filter) => ipcRenderer.invoke('prescription:print', filter)
  },
  backup: {
    getStatus: () => ipcRenderer.invoke('backup:get-status'),
    listHistory: () => ipcRenderer.invoke('backup:list-history'),
    listDrives: () => ipcRenderer.invoke('backup:list-drives'),
    create: (data) => ipcRenderer.invoke('backup:create', data),
    export: (data) => ipcRenderer.invoke('backup:export', data),
    verifyFile: (data) => ipcRenderer.invoke('backup:verify-file', data),
    restore: (data) => ipcRenderer.invoke('backup:restore', data),
    updateSettings: (data) => ipcRenderer.invoke('backup:update-settings', data),
    pickRestoreFile: () => ipcRenderer.invoke('backup:pick-restore-file'),
    pickExportFolder: () => ipcRenderer.invoke('backup:pick-export-folder')
  },
  lan: {
    getStatus: () => ipcRenderer.invoke('lan:get-status'),
    configure: (data) => ipcRenderer.invoke('lan:configure', data),
    startServer: () => ipcRenderer.invoke('lan:start-server'),
    stopServer: () => ipcRenderer.invoke('lan:stop-server'),
    pairClient: (data) => ipcRenderer.invoke('lan:pair-client', data)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
