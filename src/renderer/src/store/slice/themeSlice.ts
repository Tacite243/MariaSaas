import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../store'

type Theme = 'light' | 'dark'

export interface ThemeState {
  mode: Theme
}

// Fonction utilitaire pour récupérer le thème au démarrage
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme') as Theme
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const initialState: ThemeState = {
  mode: getInitialTheme(),
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
      // Side effect : on sauvegarde direct (ou via un middleware, mais ici c'est simple)
      localStorage.setItem('theme', state.mode)
    },
    setTheme: (state, action) => {
      state.mode = action.payload
      localStorage.setItem('theme', action.payload)
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions

// Selectors
export const selectTheme = (state: RootState) => state.theme.mode
export const selectIsDarkMode = (state: RootState) => state.theme.mode === 'dark'

export default themeSlice.reducer