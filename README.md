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