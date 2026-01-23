import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LoginInput } from '@shared/schemas/authSchema';
import { UserRole } from '@shared/types';

// 1. Définition du type de l'utilisateur stocké dans le Front
// (On évite de stocker tout l'objet Prisma, juste ce qui sert à l'UI)
interface UserState {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// 2. État du module Auth
interface AuthState {
  user: UserState | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// --- THUNK : ACTION ASYNCHRONE (LOGIN) ---
// C'est ici qu'on appelle le pont "window.api"
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginInput, { rejectWithValue }) => {
    try {
      // Appel au Backend (IPC)
      const response = await window.api.auth.login(credentials);

      // Si le backend renvoie success: false
      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Erreur de connexion');
      }

      // Si succès, on retourne les données de l'utilisateur
      return response.data; 
    } catch (err: any) {
      // Crash inattendu (réseau, bug code...)
      return rejectWithValue(err.message || 'Erreur critique');
    }
  }
);

// --- THUNK : LOGOUT ---
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await window.api.auth.logout();
  // Pas de valeur de retour nécessaire
});

// --- SLICE ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action synchrone pour nettoyer les erreurs manuellement
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 1. PENDING (Chargement en cours...)
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // 2. FULFILLED (Succès !)
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<UserState>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      // 3. REJECTED (Erreur / Mot de passe faux)
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // 4. LOGOUT (Déconnexion)
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;