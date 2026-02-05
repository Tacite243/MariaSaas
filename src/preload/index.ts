import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { LoginInput } from '../shared/schemas/authSchema'
import { CreateUserInput, UpdateUserInput } from '@shared/schemas/userSchema'



// Api typée
const api = {
  auth: {
    login: (data: LoginInput) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout')
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:get-all'),
    create: (data: CreateUserInput) => ipcRenderer.invoke('users:create', data),
    update: (data: UpdateUserInput) => ipcRenderer.invoke('users:update', data),
    delete: (id: string, currentUserId: string) => ipcRenderer.invoke('users:delete', { id, currentUserId })
  },
  inventory: {
    getProducts: () => ipcRenderer.invoke('inventory:get-products'),
    createProduct: (data) => ipcRenderer.invoke('inventory:create-product', data),
    getSuppliers: () => ipcRenderer.invoke('inventory:get-suppliers'),
    createDraft: (data) => ipcRenderer.invoke('inventory:create-draft', data),
    validateRequisition: (id) => ipcRenderer.invoke('inventory:validate', id),
    getRequisitions: () => ipcRenderer.invoke('inventory:get-requisitions'),
  },
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data),
  },
  finance: {
    getRate: () => ipcRenderer.invoke('finance:get-rate'),
    setRate: (data) => ipcRenderer.invoke('finance:set-rate', data),
  },
  stats: {
    getDashboard: () => ipcRenderer.invoke('stats:get-dashboard')
  },
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
