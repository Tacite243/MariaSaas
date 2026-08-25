import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CreateSaleInput, CartItemInput } from '@shared/schemas/salesSchema'
import { RootState } from '../store'

import { PrescriptionInput } from '@shared/schemas/stock.schema'

export interface PrescriptionCartData extends Omit<PrescriptionInput, 'productId' | 'quantityDispensed'> {
  quantityDispensed: number
}

// Type pour un article dans le panier (UI)
export interface CartItemUI extends CartItemInput {
  name: string
  code: string
  maxStock: number
  isPrescriptionRequired?: boolean
  isNarcotic?: boolean
  fefoExpiryDate?: string | null
  fefoDaysUntilExpiry?: number | null
  prescription?: PrescriptionCartData | null
}

// Type partiel pour l'affichage historique
export interface SaleHistoryItem {
  id: string
  reference: string
  date: string
  totalAmount: number
  paymentMethod: string
  seller: { name: string }
  items: { product: { name: string } }[]
}

export interface SalesState {
  cart: CartItemUI[]
  currentCustomer: string | null
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE'
  discount: number
  isLoading: boolean
  error: string | null
  lastSaleId: string | null

  history: SaleHistoryItem[] // NEW: Historique des ventes
}

const initialState: SalesState = {
  cart: [],
  currentCustomer: null,
  paymentMethod: 'CASH',
  discount: 0,
  isLoading: false,
  error: null,
  lastSaleId: null,
  history: []
}

// --- THUNK : VALIDER LA VENTE ---
export const processCheckout = createAsyncThunk(
  'sales/checkout',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const { cart, paymentMethod, discount, currentCustomer } = state.sales
    const { user } = state.auth
    const { currency, exchangeRate } = state.session
    const { activeSession } = state.cashSession

    if (!user) return rejectWithValue('Vendeur non identifié')
    if (cart.length === 0) return rejectWithValue('Panier vide')

    const rxMissing = cart.filter(
      (i) => (i.isPrescriptionRequired || i.isNarcotic) && !i.prescription
    )
    if (rxMissing.length > 0) {
      return rejectWithValue('Ordonnance requise pour un ou plusieurs produits')
    }

    const payload: CreateSaleInput = {
      sellerId: user.id,
      clientId: currentCustomer || undefined,
      paymentMethod,
      discountAmount: discount,
      currency,
      exchangeRate,
      cashSessionId: activeSession?.id,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    }

    try {
      const response = await window.api.sales.create(payload)
      if (!response.success) throw new Error(response.error?.message)

      const sale = response.data
      const rxItems = cart.filter((i) => i.isPrescriptionRequired || i.isNarcotic)
      if (rxItems.length > 0 && sale?.id) {
        await window.api.prescription.create({
          saleId: sale.id,
          validatedById: user.id,
          entries: rxItems.map((i) => ({
            productId: i.productId,
            quantityDispensed: i.quantity,
            prescriberName: i.prescription!.prescriberName,
            prescriberQualification: i.prescription!.prescriberQualification,
            prescriberLicense: i.prescription!.prescriberLicense,
            patientName: i.prescription!.patientName,
            patientAge: i.prescription!.patientAge,
            patientIdDocument: i.prescription!.patientIdDocument,
            prescriptionDate: i.prescription!.prescriptionDate
          }))
        })
      }

      return sale
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message)
    }
  }
)

// --- THUNK : RECUPERER L'HISTORIQUE ---
export const fetchSalesHistory = createAsyncThunk(
  'sales/fetchHistory',
  async (
    dateRange: { from: Date | string; to: Date | string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await window.api.sales.getHistory(dateRange)
      if (!response.success) throw new Error(response.error?.message)
      return response.data as unknown as SaleHistoryItem[]
    } catch (err: unknown) {
      const error = err as Error
      return rejectWithValue(error.message)
    }
  }
)

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItemUI>) => {
      const existing = state.cart.find((i) => i.productId === action.payload.productId)
      if (existing) {
        if (existing.quantity < existing.maxStock) {
          existing.quantity += 1
        }
      } else {
        state.cart.push(action.payload)
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter((i) => i.productId !== action.payload)
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const item = state.cart.find((i) => i.productId === action.payload.id)
      if (item) {
        const validQty = Math.max(1, Math.min(action.payload.qty, item.maxStock))
        item.quantity = validQty
      }
    },
    setPaymentMethod: (state, action: PayloadAction<SalesState['paymentMethod']>) => {
      state.paymentMethod = action.payload
    },
    setItemPrescription: (
      state,
      action: PayloadAction<{ productId: string; prescription: PrescriptionCartData }>
    ) => {
      const item = state.cart.find((i) => i.productId === action.payload.productId)
      if (item) item.prescription = action.payload.prescription
    },
    clearCart: (state) => {
      state.cart = []
      state.error = null
      state.lastSaleId = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Checkout
      .addCase(processCheckout.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(processCheckout.fulfilled, (state, action) => {
        state.isLoading = false
        state.cart = []
        state.lastSaleId = action.payload?.id || null
      })
      .addCase(processCheckout.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      // History
      .addCase(fetchSalesHistory.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSalesHistory.fulfilled, (state, action) => {
        state.isLoading = false
        state.history = action.payload
      })
      .addCase(fetchSalesHistory.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  }
})

export const { addToCart, removeFromCart, updateQuantity, setPaymentMethod, setItemPrescription, clearCart } =
  salesSlice.actions
export default salesSlice.reducer
