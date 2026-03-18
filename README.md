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
├── 🌐 hoodly-frontend/         → App web habitant (port 5173)
├── ⚙️ hoodly-frontend-admin/   → Back-office admin (port 5174)
└── 💻 hoodly-desktop/          → Client Java Desktop (offline-first)
```

---

## 🚀 Lancer le projet en local

### ✅ Prérequis

> **📋 Avant de commencer, assurez-vous d'avoir :**

- ✔️ Node.js 20+
- ✔️ pnpm
- ✔️ MongoDB local ou Atlas
- ✔️ Compte Auth0 configuré

### 🔙 Backend

```bash
cd hoodly-backend
pnpm install
pnpm run start:dev
```

### ⚙️ Frontend Admin

```bash
cd hoodly-frontend-admin
pnpm install
pnpm run dev
```

---

## ✨ Fonctionnalités

### ✅ Implémentées
- ✅ Authentification Auth0 (Google SSO, JWT, guard global)
- ✅ Synchronisation user MongoDB au login
- ✅ Dashboard admin
- ✅ Gestion des utilisateurs (CRUD, pagination, filtres, rôles)

### 🔄 En développement
- 🔲 Modélisation géographique
- 🔲 Services entre voisins
- 🔲 Documents et signatures numériques
- 🔲 Événements communautaires
- 🔲 Messagerie temps réel
- 🔲 Votes et sondages
- 🔲 Gestion des incidents
- 🔲 Moteur de recommandations (Neo4j)
- 🔲 Client Java Desktop (offline-first)
- 🔲 Internationalisation (fr/en)
