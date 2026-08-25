import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { LanStatusDTO, LanPairingInfoDTO } from '@shared/types/lan.types'
import { LanConfigInput, LanPairInput } from '@shared/schemas/lan.schema'

interface LanState {
  status: LanStatusDTO | null
  pairingInfo: LanPairingInfoDTO | null
  isLoading: boolean
  error: string | null
}

const initialState: LanState = {
  status: null,
  pairingInfo: null,
  isLoading: false,
  error: null
}

export const fetchLanStatus = createAsyncThunk('lan/status', async () => {
  const res = await window.api.lan.getStatus()
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Erreur LAN')
  return res.data
})

export const configureLan = createAsyncThunk('lan/configure', async (data: LanConfigInput) => {
  const res = await window.api.lan.configure(data)
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Configuration LAN échouée')
  return res.data
})

export const startLanServer = createAsyncThunk('lan/start', async () => {
  const res = await window.api.lan.startServer()
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Démarrage serveur échoué')
  return res.data
})

export const pairLanClient = createAsyncThunk('lan/pair', async (data: LanPairInput) => {
  const res = await window.api.lan.pairClient(data)
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Jumelage échoué')
  return res.data
})

const lanSlice = createSlice({
  name: 'lan',
  initialState,
  reducers: {
    clearLanError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLanStatus.fulfilled, (state, action) => {
        state.status = action.payload
      })
      .addCase(startLanServer.fulfilled, (state, action) => {
        state.pairingInfo = action.payload
      })
      .addCase(configureLan.pending, (state) => {
        state.isLoading = true
      })
      .addCase(configureLan.fulfilled, (state, action) => {
        state.isLoading = false
        state.status = action.payload
      })
      .addCase(configureLan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Erreur'
      })
  }
})

export const { clearLanError } = lanSlice.actions
export default lanSlice.reducer
