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

<table>
<tr>
<td><b>🔙 Backend</b></td>
<td>NestJS · TypeScript · Mongoose</td>
</tr>
<tr>
<td><b>🌐 Frontend Web</b></td>
<td>React 18 · Vite · TanStack Query · Zustand · Shadcn/ui · Tailwind</td>
</tr>
<tr>
<td><b>⚙️ Admin</b></td>
<td>React 18 · Vite · TanStack Query · Zustand · Shadcn/ui · Tailwind</td>
</tr>
<tr>
<td><b>💻 Desktop</b></td>
<td>Java 21 · JavaFX · SQLite</td>
</tr>
<tr>
<td><b>🔐 Authentication</b></td>
<td>Auth0 (JWT RS256 · Google SSO · MFA)</td>
</tr>
<tr>
<td><b>📊 BDD principale</b></td>
<td>MongoDB</td>
</tr>
<tr>
<td><b>🔗 BDD graphe</b></td>
<td>Neo4j</td>
</tr>
<tr>
<td><b>⚡ Temps réel</b></td>
<td>Socket.io</td>
</tr>
<tr>
<td><b>🐳 Conteneurisation</b></td>
<td>Docker</td>
</tr>
<tr>
<td><b>🚀 Déploiement</b></td>
<td>Railway</td>
</tr>
</table>

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
