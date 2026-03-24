# Architecture du Backend Hoodly

## Vue d'ensemble

Le backend Hoodly suit une architecture **Feature Modules** (aussi appelée architecture modulaire par domaine), recommandée par NestJS pour les applications scalables et maintenables.

## Structure du projet

```
src/
├── core/                           # Fonctionnalités essentielles de l'application
│   └── auth/
│       ├── decorators/             # @CurrentUser, @Roles, @Public
│       ├── dto/                    # jwt-payload.dto.ts
│       ├── guards/                 # JwtGuard, RolesGuard
│       ├── strategies/             # JWT Strategy (Auth0)
│       ├── auth.controller.ts
│       ├── auth.module.ts
│       └── auth.service.ts
│
├── shared/                         # Code partagé entre modules
│   └── pipes/
│       └── mongo-id-validation.pipe.ts
│
├── modules/                        # Modules métier (domaines fonctionnels)
│   ├── users/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── enums/
│   │   └── users.module.ts
│   │
│   ├── zones/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── enums/
│   │   └── zones.module.ts
│   │
│   └── incidents/
│       ├── controllers/
│       ├── services/
│       ├── dto/
│       ├── schemas/
│       ├── enums/
│       └── incidents.module.ts
│
├── app.module.ts                   # Module racine
└── main.ts                         # Point d'entrée
```

## Principes architecturaux

### 1. Séparation des responsabilités

- **core/** : Contient les fonctionnalités essentielles et transversales de l'application (authentification, autorisation, configuration)
- **shared/** : Contient les utilitaires génériques réutilisables par tous les modules (pipes de validation, etc.)
- **modules/** : Contient la logique métier organisée par domaine fonctionnel

### 2. Organisation par domaine (Feature Modules)

Chaque module métier est autonome et suit une structure cohérente :

```
module/
├── controllers/    # Routes HTTP et gestion des requêtes
├── services/       # Logique métier
├── dto/           # Data Transfer Objects (validation des données)
├── schemas/       # Modèles MongoDB/Mongoose
├── enums/         # Énumérations (évite les magic strings)
└── *.module.ts    # Configuration du module NestJS
```

### 3. Cohésion des modules

Chaque élément appartient au module qui possède l'entité concernée :
- `UserResponseDto` est dans `modules/users/dto/` (pas dans auth)
- `JwtPayloadDto` est dans `core/auth/dto/` (concerne l'authentification)

## Modules métier

### Users
Gestion des utilisateurs de l'application.
- CRUD utilisateurs
- Synchronisation avec Auth0
- Gestion des rôles (USER, MODERATOR, ADMIN)

### Zones
Gestion des quartiers et des adhésions.
- Création de zones par les admins
- Demandes de création de zone par les utilisateurs
- Demandes d'adhésion avec justificatifs
- Validation par les modérateurs/admins

### Incidents
Gestion des signalements d'incidents dans les quartiers.
- Création d'incidents
- Suivi des statuts et priorités

## Sécurité et validation

### Authentification (Auth0)
- JWT Strategy avec validation des tokens
- Guards globaux pour protéger les routes
- Décorateurs personnalisés (@CurrentUser, @Roles)

### Autorisation (RBAC)
- 3 rôles : USER, MODERATOR, ADMIN
- RolesGuard pour contrôler l'accès aux routes
- Permissions granulaires par endpoint

### Validation
- DTOs avec class-validator pour valider les entrées
- MongoIdValidationPipe pour valider les ObjectIds
- Enums pour éviter les valeurs invalides

## Technologies utilisées

- **Framework** : NestJS 10
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : Auth0 (JWT)
- **Validation** : class-validator, class-transformer
- **Langage** : TypeScript

## Avantages de cette architecture

### Maintenabilité
- Structure prévisible et cohérente
- Facile de trouver le code (organisation par domaine)
- Tests organisés avec le code

### Scalabilité
- Facile d'ajouter de nouveaux modules
- Modules indépendants et découplés
- Dépendances explicites entre modules

### Collaboration
- Plusieurs développeurs peuvent travailler sur des modules différents
- Conventions claires et documentées
- Compatible avec les outils NestJS CLI

## Bonnes pratiques appliquées

1. ✅ **Schemas** au lieu de entities (adapté à MongoDB/Mongoose)
2. ✅ **Séparation controllers/services** pour la testabilité
3. ✅ **DTOs avec validation** pour la sécurité des données
4. ✅ **Enums** pour éviter les magic strings
5. ✅ **Guards et decorators** pour la sécurité
6. ✅ **Pipes de validation** pour protéger les routes
7. ✅ **Organisation modulaire** pour la scalabilité

---

**Architecture validée et prête pour la production Hoodly** 🚀
