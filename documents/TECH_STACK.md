# APIs et Frameworks extérieurs - Hoodly

## Backend (Node.js / NestJS)

### Framework principal

| Librairie | Rôle |
|-----------|------|
| **NestJS** | Framework backend (au-dessus d'Express.js) |
| **Express.js** | Serveur HTTP sous-jacent (intégré dans NestJS) |
| **TypeScript** | Langage principal (typage statif) |

### Base de données

| Librairie | Rôle |
|-----------|------|
| **MongoDB** | Base de données NoSQL principale |
| **Mongoose** | ODM (Object Document Mapping) pour MongoDB |
| **@nestjs/mongoose** | Intégration Mongoose dans NestJS |

### Authentification

| Librairie | Rôle |
|-----------|------|
| **Auth0** | Service d'identité (login, MFA, SSO) |
| **passport** | Framework d'authentification modulaire |
| **passport-jwt** | Stratégie JWT pour Passport |
| **jwks-rsa** | Récupération des clés publiques JWKS d'Auth0 |
| **jsonwebtoken** | Décodage/vérification de tokens JWT |

### Validation

| Librairie | Rôle |
|-----------|------|
| **class-validator** | Validation déclarative des DTOs |
| **class-transformer** | Transformation des objets (plain → class) |

### Documentation

| Librairie | Rôle |
|-----------|------|
| **@nestjs/swagger** | Auto-génération de la doc OpenAPI |
| **Swagger UI** | Interface web pour tester l'API |

### Qualité du code

| Librairie | Rôle |
|-----------|------|
| **ESLint** | Linter (qualité + conventions) |
| **Prettier** | Formateur de code |
| **Jest** | Framework de tests unitaires |

---

## Frontend Admin + Client (React)

### Framework & Build

| Librairie | Rôle |
|-----------|------|
| **React** | Framework UI |
| **React DOM** | Rendu DOM pour React |
| **TypeScript** | Langage (typage statif) |
| **Vite** | Bundler / dev server (HMR rapide) |

### Routage

| Librairie | Rôle |
|-----------|------|
| **React Router DOM** | Routage SPA (navigation entre pages) |

### État & Données

| Librairie | Rôle |
|-----------|------|
| **TanStack Query (React Query)** | Fetching, cache et synchronisation des données serveur |
| **Zustand** | State management global léger (alternative à Redux) |
| **Axios** | Client HTTP pour les appels API REST |

### Authentification

| Librairie | Rôle |
|-----------|------|
| **@auth0/auth0-react** | SDK Auth0 pour React (login, logout, token management) |

### UI & Design System

| Librairie | Rôle |
|-----------|------|
| **Tailwind CSS** | Framework CSS utilitaire (styles inline) |
| **Radix UI** | Composants UI accessibles (dialog, select, avatar, separator) |
| **Lucide React** | Icônes SVG modernes et customisables |

### Cartographie (à intégrer)

| Librairie | Rôle |
|-----------|------|
| **Mapbox GL JS** | Carte interactive pour la délimitation des zones géographiques |

Mapbox permettra :
- Affichage de la carte des quartiers
- Dessin des polygones de délimitation des zones
- Affichage des incidents sur la carte
- Géolocalisation des utilisateurs

---

## Application Java Desktop (JavaFX)

| Librairie | Rôle |
|-----------|------|
| **Java 21** | Langage principal |
| **JavaFX** | Framework UI desktop (TableView, FXML, CSS) |
| **OkHttp** | Client HTTP pour appels REST au backend |
| **Jackson** | Sérialisation/désérialisation JSON |
| **Maven** | Gestion des dépendances + build |
| **SQLite** | Base locale embarquée pour mode offline-first |

---

## Infrastructure & Outils

| Outil | Rôle |
|-------|------|
| **Docker** | Conteneurisation des services |
| **Docker Compose** | Orchestration multi-conteneurs |
| **Git** | Versionnement du code source |
| **GitHub** | Hébergement du code + issues + PR |
| **pnpm** | Gestionnaire de packages Node.js (rapide, efficace) |

---

## Flux des dépendances critiques

```
                    Auth0 (SaaS)
                   ╱            ╲
        JWT Token                   PKCE Flow
           │                            │
           ▼                            ▼
    ┌──────────────┐            ┌──────────────┐
    │  Backend     │◄──REST─────│  App Java    │
    │  NestJS      │            │  JavaFX      │
    │              │            │  + OkHttp    │
    └──────┬───────┘            └──────┬───────┘
           │                           │
           ▼                           ▼
    ┌──────────────┐             ┌──────────────┐
    │  MongoDB     │             │  SQLite      │
    │  (données)   │             │  (local)     │
    └──────────────┘             └──────────────┘
           ▲
           │ REST + JWT
           │
    ┌──────────────┐
    │  Frontend    │
    │  React       │
    │  + TanStack  │
    │  + Zustand   │
    │  + Auth0     │
    └──────────────┘
```
