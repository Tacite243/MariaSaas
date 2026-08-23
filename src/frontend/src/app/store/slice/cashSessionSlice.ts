import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  CashSessionCloseInput,
  CashSessionOpenInput
} from '@shared/schemas/pos.schema'
import { CashSessionDTO } from '@shared/types/pos.types'

interface CashSessionState {
  activeSession: CashSessionDTO | null
  isLoading: boolean
  error: string | null
}

const mapSession = (raw: Record<string, unknown>): CashSessionDTO => ({
  id: raw.id as string,
  status: raw.status as CashSessionDTO['status'],
  openedAt: String(raw.openedAt),
  closedAt: raw.closedAt ? String(raw.closedAt) : null,
  cashierId: raw.cashierId as string,
  cashierName: (raw.cashier as { name: string })?.name ?? '',
  exchangeRate: raw.exchangeRate as number,
  initialUsdCents: raw.initialUsdCents as number,
  initialCdfCents: raw.initialCdfCents as number,
  systemUsdCents: (raw.systemUsdCents as number) ?? null,
  systemCdfCents: (raw.systemCdfCents as number) ?? null,
  declaredUsdCents: (raw.declaredUsdCents as number) ?? null,
  declaredCdfCents: (raw.declaredCdfCents as number) ?? null,
  discrepancyUsdCents: (raw.discrepancyUsdCents as number) ?? null,
  discrepancyCdfCents: (raw.discrepancyCdfCents as number) ?? null
})

export const fetchActiveCashSession = createAsyncThunk(
  'cashSession/fetchActive',
  async (cashierId: string, { rejectWithValue }) => {
    try {
      const res = await window.api.cashSession.getActive(cashierId)
      if (!res.success) throw new Error(res.error?.message)
      return res.data ? mapSession(res.data as Record<string, unknown>) : null
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const openCashSession = createAsyncThunk(
  'cashSession/open',
  async (data: CashSessionOpenInput, { rejectWithValue }) => {
    try {
      const res = await window.api.cashSession.open(data)
      if (!res.success) throw new Error(res.error?.message)
      return mapSession(res.data as Record<string, unknown>)
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

export const closeCashSession = createAsyncThunk(
  'cashSession/close',
  async (data: CashSessionCloseInput, { rejectWithValue }) => {
    try {
      const res = await window.api.cashSession.close(data)
      if (!res.success) throw new Error(res.error?.message)
      return res.data
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message)
    }
  }
)

const cashSessionSlice = createSlice({
  name: 'cashSession',
  initialState: {
    activeSession: null,
    isLoading: false,
    error: null
  } as CashSessionState,
  reducers: {
    clearCashSessionError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveCashSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchActiveCashSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.activeSession = action.payload
      })
      .addCase(fetchActiveCashSession.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(openCashSession.fulfilled, (state, action) => {
        state.activeSession = action.payload
        state.isLoading = false
      })
      .addCase(closeCashSession.fulfilled, (state) => {
        state.activeSession = null
        state.isLoading = false
      })
  }
})

export const { clearCashSessionError } = cashSessionSlice.actions
export default cashSessionSlice.reducer
