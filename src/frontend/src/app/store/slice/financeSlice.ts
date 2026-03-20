import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { CashJournalEntry, CreateMovementInput } from '@shared/types'
import { AppDispatch } from '../store'

export interface FinanceState {
    movements: CashJournalEntry[]
    isLoading: boolean
    error: string | null
}

const initialState: FinanceState = {
    movements: [],
    isLoading: false,
    error: null
}

// THUNK : Récupérer l'historique unifié (Ventes + Mouvements)
export const fetchCashHistory = createAsyncThunk<
    CashJournalEntry[],
    { from: Date | string; to: Date | string }
>(
    'finance/fetchHistory',
    async (filter, { rejectWithValue }) => {
        try {
            const res = await window.api.finance.getHistory(filter)
            if (!res.success) throw new Error(res.error?.message || 'Erreur de chargement')
            return res.data as CashJournalEntry[]
        } catch (err: unknown) {
            return rejectWithValue((err as Error).message)
        }
    }
)

// THUNK : Créer un mouvement manuel et rafraîchir l'historique
export const createCashMovement = createAsyncThunk<
    void,
    CreateMovementInput,
    { dispatch: AppDispatch }
>(
    'finance/createMovement',
    async (payload, { dispatch, rejectWithValue }) => {
        try {
            const res = await window.api.finance.createMovement(payload)
            if (!res.success) throw new Error(res.error?.message || 'Erreur de création')

            // Auto-refresh du journal pour inclure le nouveau mouvement trié
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const endOfToday = new Date()
            endOfToday.setHours(23, 59, 59, 999)

            dispatch(fetchCashHistory({ from: today, to: endOfToday }))
        } catch (err: unknown) {
            return rejectWithValue((err as Error).message)
        }
    }
)

const financeSlice = createSlice({
    name: 'finance',
    initialState,
    reducers: {
        clearFinanceError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCashHistory.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchCashHistory.fulfilled, (state, action: PayloadAction<CashJournalEntry[]>) => {
                state.isLoading = false
                state.movements = action.payload
            })
            .addCase(fetchCashHistory.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            .addCase(createCashMovement.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(createCashMovement.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string
            })
            .addCase(createCashMovement.fulfilled, (state) => {
                state.isLoading = false
                // Pas besoin d'ajouter manuellement au state, fetchCashHistory s'en charge !
            })
    }
})

export const { clearFinanceError } = financeSlice.actions
export default financeSlice.reducer