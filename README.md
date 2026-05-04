<div align="center">

# 🏘️ HOODLY
### *"Ensemble, c'est mieux !"*

[![ESGI](https://img.shields.io/badge/ESGI-3ème%20année-blue)](https://www.esgi.fr)
[![2025-2026](https://img.shields.io/badge/année-2025--2026-brightgreen)](https://www.esgi.fr)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-In%20Development-yellow)](https://github.com)

Plateforme collaborative de quartier permettant aux habitants d'**échanger des services**, **signer des documents**, **participer à des événements**, **voter** et **signaler des incidents**.

**👥 Équipe :** Ivan Zazic • Tom Georgin • Clara Louise Lisika

</div>

---

## 📚 Table des matières

- [🎯 Stack technique](#-stack-technique)
- [📁 Structure du projet](#-structure-du-projet)
- [🚀 Lancer le projet en local](#-lancer-le-projet-en-local)
- [✨ Fonctionnalités](#-fonctionnalités)

---

## 🎯 Stack technique

### 🔐 Authentification
- **Auth0** - SSO (Single Sign-On), JWT RS256, Google OAuth, MFA

### 💾 Base de données
- **MongoDB** - Base de données principale (NoSQL)
- **Mongoose** - ODM pour MongoDB
- **Neo4j** - Base de données graphe (recommandations)

### 🔙 Backend
- **NestJS** - Framework Node.js
- **Passport** - Authentification middleware
- **TypeScript** - Langage typé

### 🌐 Frontend
- **React 19** - Framework UI
- **Vite** - Build tool moderne
- **TypeScript** - Langage typé

### 🎨 UI & Styling
- **Radix UI** - Composants headless accessibles
- **Tailwind CSS** - CSS utility-first
- **ShadcnUI** - Composants pré-stylés
- **Lucide React** - Icônes

### 📊 State Management & Data Fetching
- **Zustand** - State management léger
- **TanStack Query** - Gestion des requêtes API + cache

### 🌐 HTTP & Temps réel
- **Axios** - Client HTTP
- **Socket.io** - Communication temps réel

### 🐳 DevOps
- **Docker** - Conteneurisation
- **Railway** - Déploiement cloud

---

## 📁 Structure du projet

```
Hoodly/
├── 🔙 hoodly-backend/          → API REST NestJS (port 3000)
├── 🌐 hoodly-frontend-client/  → App web habitant (port 5173)
├── ⚙️ hoodly-frontend-admin/   → Back-office admin (port 5174)
└── 💻 hoodly-desktop/          → Client Java Desktop (offline-first)
```

```
hoodly-frontend-client/
|___src/
    ├── assets/          # Images, logos, ressources statiques
    ├── components/      # UI réutilisable
    │   ├── animate-ui/  # Animations et micro-interactions
    │   ├── dashboard/   # UI spécifique au dashboard
    │   ├── landing/     # Sections de la landing page
    │   ├── onboarding/  # Flow d'inscription par étapes
    │   ├── shared/      # Layouts et protections de routes
    │   └── ui/          # Composants de base (atomes)
    ├── hooks/           # Logique métier React personnalisée
    ├── lib/             # Config outils tiers (Axios) et utils
    ├── pages/           # Pages racines (routes)
    ├── services/api/    # Communication avec le backend
    ├── stores/          # État global (Zustand)
    └── types/           # Centralisation TypeScript (interfaces/enums)
```

---

## 🚀 Lancer le projet en local

### ✅ Prérequis

> **📋 Avant de commencer, assurez-vous d'avoir :**

- ✔️ Node.js 20+
- ✔️ pnpm
- ✔️ MongoDB local (Compass)
- ✔️ Compte Auth0 configuré

### 🔙 Backend

```bash
cd hoodly-backend
pnpm install
pnpm run start:dev # Lance avec dotenvx
```

### 🌐 Frontend Habitant
```bash
cd hoodly-frontend-client
pnpm install
pnpm run dev # Lance avec dotenvx
```

---

### ⚙️ Frontend Admin

```bash
cd hoodly-frontend-admin
pnpm install
pnpm run dev # Lance avec dotenvx
```

---

### 💻 Client Desktop (JavaFX)

```bash
cd hoodly-desktop
dotenvx run -- ./mvnw javafx:run
```