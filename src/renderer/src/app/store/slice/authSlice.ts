import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { LoginInput } from '@shared/schemas/authSchema';
import { UserRole } from '@shared/types';

// Type utilisateur (Front)
interface UserState {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: UserState | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 1. Initialisation Intelligente : On vérifie s'il y a une session sauvegardée
const getInitialState = (): AuthState => {
  const savedUser = localStorage.getItem('auth_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      return {
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    } catch (e) {
      localStorage.removeItem('auth_user');
    }
  }
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState: AuthState = getInitialState();

// Type étendu pour l'argument du Thunk
interface LoginPayload extends LoginInput {
  rememberMe: boolean;
}

// --- THUNK : LOGIN ---
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await window.api.auth.login({ email, password });

      if (!response.success) {
        return rejectWithValue(response.error?.message || 'Erreur de connexion');
      }

      // On retourne les données ET le choix de persistance
      return { user: response.data, rememberMe };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur critique');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await window.api.auth.logout();
  // Nettoyage impératif lors du logout
  localStorage.removeItem('auth_user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;

        // 2. Persistance Conditionnelle
        if (action.payload.rememberMe) {
          localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        } else {
          // Si l'utilisateur ne veut pas être "souvenu", on nettoie le storage 
          // (il restera connecté tant que l'app est ouverte grâce au state Redux)
          localStorage.removeItem('auth_user');
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
