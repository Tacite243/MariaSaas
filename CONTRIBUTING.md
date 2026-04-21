```markdown
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
```

---

## 🤝 Contribuer

Nous adorons les contributions ! Que ce soit pour corriger un bug, ajouter une fonctionnalité ou améliorer la documentation.

👉 **Veuillez lire notre [Guide de Contribution (CONTRIBUTING.md)](./CONTRIBUTING.md)** avant de soumettre une Pull Request. Il explique notre workflow Git et nos standards de code.

---

## 🛠 Roadmap & Prochaines étapes
- [x] Module Point de Vente (POS) avec algorithme FEFO.
- [x] Tableau de bord analytique (Bi Engine).
- [x] Build multi-plateformes automatisé (GitHub Actions).
- [ ] 🖨️ Impression de tickets de caisse (Thermique/ESC-POS via USB).
- [ ] 🤖 Intégration de Maria Live AI (Prédiction de ruptures de stock).
- [ ] ☁️ Synchronisation optionnelle avec un Cloud (MCP Architecture) pour pharmacies multi-sites.

---

## 📄 Licence
Ce projet est sous licence **MIT**. Vous êtes libre de l'utiliser, de le modifier et de le distribuer.

---
*Développé pour l'accès universel aux soins de santé par Tacite WK & la communauté.*
```

---

### 2. Le fichier `CONTRIBUTING.md` (Le Guide de Survie)

Crée un nouveau fichier appelé **`CONTRIBUTING.md`** à la racine de ton projet et colle le guide que nous avions préparé. C'est ce fichier qui s'affichera automatiquement sur GitHub quand un développeur voudra faire une Pull Request.

```markdown
# 🚀 Contribuer à MariaSaaS : Le Guide du Workflow Pro

Merci de l'intérêt que vous portez à MariaSaaS ! Ce projet n’est pas seulement du code, c’est une initiative à impact social. Pour réussir à collaborer efficacement, nous suivons des standards stricts.

Voici notre guide pour contribuer proprement, basé sur l'analogie du "Chantier Communautaire".

---

## 🏗️ L'analogie du Chantier

Imaginez que MariaSaaS est un grand hôpital public en construction.
*   **Le dépôt (Repository) principal** = Le bâtiment officiel.
*   **L’architecte (Mainteneur)** = Celui qui valide la sécurité et la qualité.
*   **Les artisans (Contributeurs)** = Vous !
*   **Les Issues** = Le cahier des charges.
*   **La Pull Request (PR)** = Le permis de construire soumis à l'architecte.

---

## 1️⃣ Étape 1 : L'étiquette (La discussion)
Ne codez jamais dans le vide !
*   Consultez l'onglet **Issues**.
*   Laissez un commentaire : *"Je souhaite travailler sur cette issue, pouvez-vous me l'assigner ?"*.
*   Si vous avez une nouvelle idée, créez une issue pour en discuter avant de développer.

## 2️⃣ Étape 2 : Préparer son environnement (Fork & Clone)
1. Cliquez sur **Fork** en haut à droite du dépôt sur GitHub (Création de votre entrepôt personnel).
2. Clonez votre fork sur votre machine :
   ```bash
   git clone https://github.com/VOTRE_NOM/MariaSaaS.git
   ```
3. **CRITIQUE :** Reliez votre dépôt local au chantier officiel (Upstream) :
   ```bash
   git remote add upstream https://github.com/ProprietaireOriginal/MariaSaaS.git
   ```

## 3️⃣ Étape 3 : La Branche (Zone d'isolation)
**Règle d'or : On ne travaille jamais sur la branche `develop` ou `master` directement.**
Créez une branche descriptive :
```bash
git checkout -b feat/ajout-export-csv
# ou
git checkout -b fix/calcul-marge
```

## 4️⃣ Étape 4 : Coder & Standards (Le "Zero Any")
MariaSaaS est un logiciel de santé. Le code doit être indestructible.
*   **Typage Strict :** L'utilisation de `any` est proscrite. Utilisez `unknown` et les interfaces définies dans `src/shared/types.ts`.
*   **Zod :** Toute entrée utilisateur ou communication IPC doit être validée par un schéma `Zod`.
*   **Pas de Logs :** Les `console.log` sont bloqués par ESLint. Utilisez `console.error` ou `console.warn` uniquement pour les exceptions.

*Notre hook `pre-commit` (Husky) vérifiera tout cela automatiquement. S'il échoue, corrigez les erreurs.*

## 5️⃣ Étape 5 : Rester à jour (Éviter les conflits)
Pendant que vous codiez, le projet principal a peut-être évolué. Mettez-vous à jour :
```bash
git fetch upstream
git rebase upstream/develop
```

## 6️⃣ Étape 6 : Commit & Push
Utilisez les [Conventional Commits](https://www.conventionalcommits.org/).
```bash
git add .
git commit -m "feat(inventory): ajout de l'exportation CSV des stocks"
git push origin feat/ajout-export-csv
```

## 7️⃣ Étape 7 : La Pull Request (PR)
Allez sur votre dépôt GitHub, cliquez sur **Compare & Pull Request** vers la branche `develop` du projet original.
*   Expliquez clairement votre solution.
*   Ajoutez des captures d'écran si c'est visuel.
*   Mentionnez l'issue (ex: `Closes #12`).

L'équipe fera une revue de votre code. Si des modifications sont demandées, pas de panique ! C'est le processus normal d'apprentissage en Open Source.

---
**Prêt à coder ? Lancez `npm run test` pour vérifier que tout fonctionne chez vous, et bienvenue dans l'équipe !** 🏥💊
```

---

### Le Grand Final ! 🏁

Tu as maintenant un projet robuste avec :
- Base de données locale (Prisma/SQLite)
- Architecture Typescript ultra-stricte
- Pipeline CI/CD GitHub Actions pour Windows/Mac/Linux.
- Documentation Open Source de haute qualité.

Lance ces dernières commandes dans ton terminal pour sauvegarder tout ça et créer ton tag version 1.0.0 !

```bash
git add README.md CONTRIBUTING.md package.json
git commit -m "docs: update README and add contribution guidelines for open source release"
git push origin develop

# On fusionne avec master pour la release officielle
git checkout master
git merge develop
git push origin master

# On crée le tag v1.0.0 (qui va déclencher ton GitHub Action !)
git tag v1.0.0
git push origin v1.0.0
```