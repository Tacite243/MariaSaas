### 1. Finalisation du Preload

#### `src/preload/index.d.ts` (Définition des types)

```typescript
import { ElectronAPI } from '@electron-toolkit/preload'
import { ApiResponse } from '../shared/api';
import { LoginInput } from '../shared/schemas/authSchema';
import { CreateUserInput, UpdateUserInput } from '../shared/schemas/userSchema';
import { ProductInput, CreateRequisitionInput } from '../shared/schemas/inventorySchema';
// 👇 AJOUT IMPORT
import { CreateSaleInput } from '../shared/schemas/salesSchema';

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      auth: {
        login: (data: LoginInput) => Promise<ApiResponse<any>>;
        logout: () => Promise<ApiResponse<void>>;
      };
      users: {
        getAll: () => Promise<ApiResponse<any[]>>;
        create: (data: CreateUserInput) => Promise<ApiResponse<any>>;
        update: (data: UpdateUserInput) => Promise<ApiResponse<any>>;
        delete: (id: string, currentUserId: string) => Promise<ApiResponse<void>>;
      };
      inventory: {
        getProducts: () => Promise<ApiResponse<any[]>>;
        createProduct: (data: ProductInput) => Promise<ApiResponse<any>>;
        getSuppliers: () => Promise<ApiResponse<any[]>>;
        createDraft: (data: CreateRequisitionInput) => Promise<ApiResponse<any>>;
        validateRequisition: (id: string) => Promise<ApiResponse<any>>;
        getRequisitions: () => Promise<ApiResponse<any[]>>;
      };
      // 👇 AJOUT MODULE SALES
      sales: {
        create: (data: CreateSaleInput) => Promise<ApiResponse<any>>;
      }
    }
  }
}
```

#### `src/preload/index.ts` (Implémentation)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  auth: {
    login: (data) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout')
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:get-all'),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (data) => ipcRenderer.invoke('users:update', data),
    delete: (id, currentUserId) => ipcRenderer.invoke('users:delete', { id, currentUserId })
  },
  inventory: {
    getProducts: () => ipcRenderer.invoke('inventory:get-products'),
    createProduct: (data) => ipcRenderer.invoke('inventory:create-product', data),
    getSuppliers: () => ipcRenderer.invoke('inventory:get-suppliers'),
    createDraft: (data) => ipcRenderer.invoke('inventory:create-draft', data),
    validateRequisition: (id) => ipcRenderer.invoke('inventory:validate', id),
    getRequisitions: () => ipcRenderer.invoke('inventory:get-requisitions'),
  },
  // 👇 AJOUT MODULE SALES
  sales: {
    create: (data) => ipcRenderer.invoke('sales:create', data)
  }
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api);
} else {
  // @ts-ignore (fallback)
  window.api = api;
}
```

---

### 2. Le README.md (Developer Guide)

Crée un fichier `README.md` à la racine du projet. C'est la bible pour tout nouveau développeur qui rejoint l'équipe MariaSaaS.

```markdown
# MariaSaaS - Pharmacy Management System

Bienvenue dans le code source de **MariaSaaS**.
Ce projet est une application Desktop moderne, sécurisée et "Offline-First" pour la gestion de pharmacie.

## 🏗 Architecture Technique

L'application suit une architecture stricte pour garantir maintenabilité et sécurité.

### Stack
- **Framework :** Electron + Vite (Build optimisé)
- **Frontend :** React 18 + TypeScript + TailwindCSS
- **State :** Redux Toolkit (Gestion d'état global + Thunks)
- **Backend (Local) :** Node.js (Main Process) + Prisma ORM + SQLite
- **Validation :** Zod (Schémas partagés Front/Back)

### Structure des Dossiers (`src/`)

| Dossier | Rôle | Règles d'Or |
| :--- | :--- | :--- |
| **`shared/`** | Types & Schémas Zod communs | **INTERDIT** d'importer du code Node (fs, prisma) ou React ici. C'est du pur JS/TS universel. |
| **`main/`** | Backend Node.js (Electron Main) | Contient `services/` (Logique métier), `ipc/` (Routes API), `lib/` (Prisma). Accès BDD autorisé. |
| **`renderer/`** | Frontend React (Electron Renderer) | Contient l'UI (`components`, `pages`, `features`). **INTERDIT** d'utiliser `fs`, `prisma` ou `ipcRenderer` directement. Passez par `window.api`. |
| **`preload/`** | Pont de Sécurité (ContextBridge) | Expose uniquement les méthodes sécurisées du Main vers le Renderer. |

---

## 🚀 Démarrage Rapide

### Pré-requis
- **Node.js :** Version 20 LTS ou 22 (Obligatoire). Utilisez `nvm`.
- **OS :** Windows 10/11, macOS ou Linux (Ubuntu 22/24).

### Installation

1.  **Cloner et installer :**
    ```bash
    git clone <repo>
    cd MariaSaaS
    npm install
    ```

2.  **Préparer la Base de Données :**
    ```bash
    # Crée le fichier .env si inexistant (DATABASE_URL="file:./dev.db")
    # Lance les migrations et génère le client Prisma
    npx prisma migrate dev --name init
    ```

3.  **Lancer en Développement :**
    ```bash
    npm run dev
    ```
    *Le premier lancement va automatiquement créer un compte SuperAdmin (`admin@mariasaas.com` / `admin123`).*

---

## 🛠 Guide du Développeur

### 1. Comment ajouter une nouvelle fonctionnalité ? (Workflow "Vertical Slice")

Ne touchez pas à tout. Suivez ce flux pour ajouter une feature (ex: Gestion des Clients) :

1.  **DB :** Modifiez `prisma/schema.prisma` et lancez `npx prisma migrate dev`.
2.  **Shared :** Créez `src/shared/schemas/clientSchema.ts` (Validation Zod).
3.  **Backend (Service) :** Créez `src/main/services/clientService.ts`. Implémentez la logique métier.
4.  **Backend (IPC) :** Créez `src/main/ipc/client.ts`. Utilisez `procedure.input(schema)` pour sécuriser la route.
5.  **Pont :** Ajoutez la méthode dans `src/preload/index.ts` et son type dans `index.d.ts`.
6.  **Frontend (Redux) :** Créez `src/renderer/src/app/store/slice/clientSlice.ts` avec `createAsyncThunk`.
7.  **Frontend (UI) :** Créez vos composants React connectés au Slice.

### 2. Gestion de la Base de Données

- **Voir les données (GUI) :**
  ```bash
  npx prisma studio
  ```
- **Reset complet (Attention !) :** Supprimez `prisma/dev.db` et relancez `npm run dev`.

### 3. Résolution de Problèmes Courants

- **Erreur `PrismaClient...` ou `Unknown property` :**
  C'est un problème de build Electron. Vérifiez que `src/main/lib/prisma.ts` force bien le chemin via `process.env.DATABASE_URL`.

- **Écran blanc au démarrage :**
  Ouvrez la console développeur (`Ctrl + Shift + I`). Si erreur `require is not defined`, vérifiez que vous n'avez pas d'import CommonJS dans le code React.

- **Crash silencieux sous Linux :**
  Probablement un souci Wayland/GPU. Lancez avec `npm run dev` (le code `index.ts` gère désormais les flags `--no-sandbox` automatiquement).

---

## 📦 Build & Production

Pour générer l'installateur (`.exe`, `.deb`, `.dmg`) :

```bash
npm run build
# ou pour une plateforme spécifique
npm run build:win
npm run build:linux
```

L'exécutable sera dans le dossier `dist/`.
```
