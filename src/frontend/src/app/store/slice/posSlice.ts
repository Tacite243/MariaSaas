import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CartItemUI } from './salesSlice'
import { HeldCartSnapshot } from '@shared/types/pos.types'

const MAX_HELD_CARTS = 5

export interface PosUIState {
  heldCarts: HeldCartSnapshot[]
  paymentModalOpen: boolean
  closeSessionModalOpen: boolean
  heldCartsModalOpen: boolean
  printSettingsModalOpen: boolean
  zReportData: unknown | null
}

const initialState: PosUIState = {
  heldCarts: [],
  paymentModalOpen: false,
  closeSessionModalOpen: false,
  heldCartsModalOpen: false,
  printSettingsModalOpen: false,
  zReportData: null
}

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    holdCurrentCart: (
      state,
      action: PayloadAction<{
        cart: CartItemUI[]
        paymentMethod: HeldCartSnapshot['paymentMethod']
        discount: number
        currentCustomer: string | null
      }>
    ) => {
      if (action.payload.cart.length === 0) return
      if (state.heldCarts.length >= MAX_HELD_CARTS) {
        state.heldCarts.shift()
      }
      state.heldCarts.push({
        id: `held-${Date.now()}`,
        label: `Attente ${state.heldCarts.length + 1}`,
        savedAt: Date.now(),
        cart: action.payload.cart.map((i) => ({ ...i })),
        paymentMethod: action.payload.paymentMethod,
        discount: action.payload.discount,
        currentCustomer: action.payload.currentCustomer
      })
    },
    restoreHeldCart: (state, action: PayloadAction<string>) => {
      state.heldCarts = state.heldCarts.filter((c) => c.id !== action.payload)
    },
    removeHeldCart: (state, action: PayloadAction<string>) => {
      state.heldCarts = state.heldCarts.filter((c) => c.id !== action.payload)
    },
    setPaymentModalOpen: (state, action: PayloadAction<boolean>) => {
      state.paymentModalOpen = action.payload
    },
    setCloseSessionModalOpen: (state, action: PayloadAction<boolean>) => {
      state.closeSessionModalOpen = action.payload
    },
    setHeldCartsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.heldCartsModalOpen = action.payload
    },
    setPrintSettingsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.printSettingsModalOpen = action.payload
    },
    setZReportData: (state, action: PayloadAction<unknown | null>) => {
      state.zReportData = action.payload
    }
  }
})

export const {
  holdCurrentCart,
  restoreHeldCart,
  removeHeldCart,
  setPaymentModalOpen,
  setCloseSessionModalOpen,
  setHeldCartsModalOpen,
  setPrintSettingsModalOpen,
  setZReportData
} = posSlice.actions

export default posSlice.reducer
