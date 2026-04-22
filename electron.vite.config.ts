import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/backend/index.ts')
      },
      rollupOptions: {
        // bcryptjs et @prisma/client doivent absolument rester externes
        external: ['bcryptjs', '@prisma/client']
      }
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/preload/index.ts')
      }
    }
  },
  renderer: {
    // On définit la racine du projet frontend
    root: resolve(__dirname, 'src/frontend'),
    build: {
      rollupOptions: {
        // L'input doit être relatif au "root" défini juste au-dessus
        input: resolve(__dirname, 'src/frontend/index.html')
      },
      // On s'assure que le dossier de sortie est correct
      outDir: resolve(__dirname, 'out/renderer')
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/frontend/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [react()]
  }
})