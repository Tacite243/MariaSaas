import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  BackupRecordDTO,
  BackupStatusDTO,
  BackupVerifyResultDTO,
  RemovableDriveDTO
} from '@shared/types/backup.types'
import { BackupSettingsInput } from '@shared/schemas/backup.schema'

interface BackupState {
  status: BackupStatusDTO | null
  history: BackupRecordDTO[]
  drives: RemovableDriveDTO[]
  isLoading: boolean
  error: string | null
  lastVerify: BackupVerifyResultDTO | null
}

const initialState: BackupState = {
  status: null,
  history: [],
  drives: [],
  isLoading: false,
  error: null,
  lastVerify: null
}

export const fetchBackupStatus = createAsyncThunk('backup/status', async () => {
  const res = await window.api.backup.getStatus()
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Erreur statut backup')
  return res.data
})

export const fetchBackupHistory = createAsyncThunk('backup/history', async () => {
  const res = await window.api.backup.listHistory()
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Erreur historique')
  return res.data
})

export const fetchRemovableDrives = createAsyncThunk('backup/drives', async () => {
  const res = await window.api.backup.listDrives()
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Erreur lecteurs')
  return res.data
})

export const createBackupNow = createAsyncThunk(
  'backup/create',
  async (opts?: { drivePath?: string }) => {
    const res = await window.api.backup.create({ drivePath: opts?.drivePath })
    if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Backup échoué')
    return res.data
  }
)

export const updateBackupSettings = createAsyncThunk(
  'backup/settings',
  async (data: BackupSettingsInput) => {
    const res = await window.api.backup.updateSettings(data)
    if (!res.success) throw new Error(res.error?.message ?? 'Erreur paramètres')
    return data
  }
)

const backupSlice = createSlice({
  name: 'backup',
  initialState,
  reducers: {
    setLastVerify: (state, action) => {
      state.lastVerify = action.payload
    },
    clearBackupError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBackupStatus.fulfilled, (state, action) => {
        state.status = action.payload
      })
      .addCase(fetchBackupHistory.fulfilled, (state, action) => {
        state.history = action.payload
      })
      .addCase(fetchRemovableDrives.fulfilled, (state, action) => {
        state.drives = action.payload
      })
      .addCase(createBackupNow.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createBackupNow.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(createBackupNow.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Erreur'
      })
  }
})

export const { setLastVerify, clearBackupError } = backupSlice.actions
export default backupSlice.reducer
