import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  StockAuditCreateInput,
  StockAuditAddItemsInput,
  StockAuditCompleteInput,
  WriteOffInput
} from '@shared/schemas/stock.schema'
import { ExpiryAlertSummaryDTO, StockAuditDTO } from '@shared/types/stock.types'

interface StockState {
  expiryAlerts: ExpiryAlertSummaryDTO | null
  audits: StockAuditDTO[]
  activeAudit: StockAuditDTO | null
  isLoading: boolean
  error: string | null
}

export const fetchExpiryAlerts = createAsyncThunk('stock/fetchExpiryAlerts', async () => {
  const res = await window.api.stock.getExpiringBatches()
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Erreur alertes')
  return res.data
})

export const writeOffLot = createAsyncThunk('stock/writeOff', async (data: WriteOffInput) => {
  const res = await window.api.stock.writeOff(data)
  if (!res.success) throw new Error(res.error?.message || 'Erreur déclassement')
  return res.data
})

export const createStockAudit = createAsyncThunk(
  'stock/createAudit',
  async (data: StockAuditCreateInput) => {
    const res = await window.api.stock.createAudit(data)
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Erreur création')
    return res.data as StockAuditDTO
  }
)

export const addStockAuditItems = createAsyncThunk(
  'stock/addAuditItems',
  async (data: StockAuditAddItemsInput) => {
    const res = await window.api.stock.addAuditItems(data)
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Erreur saisie')
    return res.data
  }
)

export const completeStockAudit = createAsyncThunk(
  'stock/completeAudit',
  async (data: StockAuditCompleteInput) => {
    const res = await window.api.stock.completeAudit(data)
    if (!res.success) throw new Error(res.error?.message || 'Erreur validation')
    return res.data
  }
)

export const fetchStockAudits = createAsyncThunk('stock/listAudits', async () => {
  const res = await window.api.stock.listAudits()
  if (!res.success || !res.data) throw new Error(res.error?.message || 'Erreur liste')
  return res.data
})

const stockSlice = createSlice({
  name: 'stock',
  initialState: {
    expiryAlerts: null,
    audits: [],
    activeAudit: null,
    isLoading: false,
    error: null
  } as StockState,
  reducers: {
    setActiveAudit: (state, action) => {
      state.activeAudit = action.payload
    },
    clearStockError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpiryAlerts.fulfilled, (state, action) => {
        state.expiryAlerts = action.payload
        state.isLoading = false
      })
      .addCase(addStockAuditItems.fulfilled, (state, action) => {
        state.activeAudit = action.payload
      })
      .addCase(fetchStockAudits.fulfilled, (state, action) => {
        state.audits = action.payload
      })
  }
})

export const { setActiveAudit, clearStockError } = stockSlice.actions
export default stockSlice.reducer
