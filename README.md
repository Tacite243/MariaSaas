# 🏥 MariaSaaS - Open Source Pharmacy Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Build Status](https://github.com/VOTRE_NOM/MariaSaaS/actions/workflows/release.yml/badge.svg)](https://github.com/VOTRE_NOM/MariaSaaS/actions)

**MariaSaaS** est une solution de gestion de pharmacie de pointe, conçue pour être **moderne**, **sécurisée** et **Offline-First**. 

L'objectif de ce projet est de démocratiser l'accès à des outils de gestion pharmaceutique professionnels (ERP/POS) pour les officines indépendantes, particulièrement dans les zones à connectivité limitée (ex: RDC, Afrique francophone), tout en respectant les standards internationaux (GxP, FEFO).

## ✨ Vision & Impact
Dans de nombreuses régions, les pharmacies luttent avec des systèmes obsolètes ou coûteux. MariaSaaS offre :
- 🔒 **Souveraineté des données** : Stockage 100% local via SQLite et Prisma.
- ⚡ **Performance native** : Application desktop via Electron + Vite.
- 💰 **Double Devise Native** : Gestion fluide USD/Monnaie locale (ex: CDF) avec taux de change dynamique et calcul des marges intégré.
- 📦 **Traçabilité Totale** : Algorithme FEFO (First Expired, First Out) automatisé lors des ventes.

---

## 🏗 Architecture Technique

Le projet utilise une architecture **Vertical Slice** stricte (zéro `any` toléré) pour une scalabilité maximale.

| Couche | Technologie | Rôle |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TailwindCSS + Shadcn | Interface utilisateur réactive et typée. |
| **State** | Redux Toolkit | Source unique de vérité (Auth, Stock, Session, POS). |
| **Backend** | Node.js (Main Process) | Logique métier, sécurité et accès disque. |
| **Persistance**| Prisma + SQLite | ORM moderne pour une base de données locale robuste. |
| **Validation** | Zod | Schémas de données partagés (zéro duplication). |

---

## 🚀 Démarrage Rapide

### Pré-requis
- **Node.js :** v20+ ou v22+ (LTS recommandé). Utilisez `nvm`.
- **OS :** Windows, macOS ou Linux (Ubuntu 22/24).

### Installation

1.  **Cloner le projet :**
    ```bash
    git clone https://github.com/VOTRE_NOM/MariaSaaS.git
    cd MariaSaaS
    npm install
    ```

2.  **Initialiser la base de données locale :**
    ```bash
    # Créez un fichier .env à la racine : DATABASE_URL="file:./dev.db"
    npx prisma db push
    npx prisma generate
    ```

3.  **Lancer en mode développement :**
    ```bash
    npm run dev
    ```
    *Note Linux : Si la fenêtre ne s'ouvre pas sur Ubuntu/Wayland, la commande `npm run dev` force automatiquement le mode X11 et désactive la sandbox pour le développement.*

---

## 🧪 Tests & Qualité

Le projet est protégé par **Husky** et **Lint-staged**. Aucun commit contenant des erreurs de type ou des `console.log` non autorisés ne sera accepté.

```bash
# Lancer les tests unitaires (Vitest)
npm run test

# Vérifier le typage strict avant de commit
npm run typecheck