# Justification de l'architecture logicielle - Hoodly

## 1. Choix du framework backend : NestJS

### Pourquoi NestJS et non Express.js pur ?

Le sujet impose Node.js + Express. NestJS utilise Express.js (ou FastAPI) comme serveur HTTP sous-jacent, tout en apportant une couche d'abstraction supérieure :

| Critère | Express.js pur | NestJS |
|---------|---------------|--------|
| Structure du projet | Libre, souvent désorganisé | Imposée et cohérente |
| Injection de dépendances | Manuelle | Native (IoC container) |
| TypeScript support | Ajouté après coup | Natif depuis la conception |
| Modules | Aucun | Système de modules complet |
| Guards / Middlewares | Écrits à la main | Prêts à l'emploi |
| Documentation API | Manuelle | Auto-générée (Swagger) |
| Scalabilité | Complexité croissante | Linéaire |

**Conclusion :** NestJS est un super-set d'Express.js. Le code produit fonctionne sur Express, respecte l'esprit du sujet, et permet une maintenabilité supérieure sur un projet de cette envergure.

---

## 2. Architecture Feature Modules (Hybride)

### Structure adoptée

```
src/
├── core/          # Fonctionnalités transversales (auth, config)
├── shared/        # Utilitaires réutilisables (pipes, helpers)
├── modules/       # Logique métier par domaine
│   ├── users/
│   ├── zones/
│   ├── incidents/
│   ├── services/
│   ├── events/
│   ├── messages/
│   ├── votes/
│   ├── documents/
│   └── ...
└── main.ts
```

### Pourquoi cette architecture ?

**1. Séparation par domaine métier**
Chaque module (users, zones, incidents) regroupe tout ce qui le concerne : controller, service, DTOs, schema, enums. Chercher du code lié aux "zones" ? Tout est dans `modules/zones/`.

**2. Découplage entre modules**
Les modules ne dépendent pas directement les uns des autres. Le module `incidents` importe `users` uniquement pour le type `UserRole`, pas la logique complète.

**3. Scalabilité**
Ajouter un nouveau module "services" consiste à créer `modules/services/` avec la même structure. Aucun fichier existant n'est modifié hormis `app.module.ts` (1 ligne d'import).

**4. Réutilisabilité**
Le dossier `shared/` contient des éléments utilisés partout (ex: `MongoIdValidationPipe`). Le dossier `core/` contient l'authentification, critique pour tous les modules.

### Alternatives considérées

- **Architecture flat** (`src/auth/`, `src/users/`, etc.) : Simple au début mais ingérable avec 10+ modules. C'est l'ancienne architecture qu'on a remplacée.
- **Architecture hexagonale** (ports & adapters) : Trop complexe pour ce projet, plus adapté aux applications d'entreprise avec de multiples protocoles d'entrée/sortie.

---

## 3. Choix de la base de données : MongoDB

### Pourquoi MongoDB et non PostgreSQL/MySQL ?

| Critère | SQL (PostgreSQL) | NoSQL (MongoDB) |
|---------|------------------|-----------------|
| Schéma | Rigide, migrations nécessaires | Flexible, évolutif |
| Données imbriquées | Jointures coûteuses | Documents natifs |
| Géolocalisation | PostGIS (extension) | GeoJSON natif |
| Scalabilité horizontale | Complexe | Native (sharding) |
| Adapté à | Relations complexes | Documents semi-structurés |

**Pour Hoodly :**
- Les zones ont des polygones GeoJSON → MongoDB supporte nativement
- Les événements/documents ont des structures variables → schéma flexible
- Les messages contiennent des médias imbriqués → documents JSON naturels
- Le sujet impose MongoDB

### ORM choisi : Mongoose

Mongoose apporte la validation des schémas, les hooks (pre/post save), et le typage TypeScript via `@nestjs/mongoose`. C'est le standard NestJS pour MongoDB.

---

## 4. Authentification : Auth0 + JWT

### Flux d'authentification

```
Frontend/Java App → Auth0 (login) → JWT Token
                                        ↓
Backend NestJS ← JWT Token → Validation via JWKS
                                        ↓
                              Extraction du payload
                                        ↓
                              Sync Auth0 → MongoDB
```

### Pourquoi Auth0 ?

- **SSO** entre le site web et l'app Java (exigence du sujet)
- **MFA** prêt à l'emploi (exigence du sujet)
- **PKCE flow** pour l'app Java (sécurisé, sans secret client)
- **Gestion des rôles** via les claims JWT

### Pourquoi JWT stateless ?

- Pas de session côté serveur → scalabilité
- Le token contient les infos utilisateur → pas de requête DB à chaque appel
- Validation via JWKS (JSON Web Key Set) → Auth0 gère les clés

---

## 5. Validation des données

### Double couche de validation

1. **class-validator** sur les DTOs : validation déclarative des champs
2. **MongoIdValidationPipe** : validation des ObjectIds MongoDB dans les routes

### Exemple concret

```typescript
// DTO - validation des champs
export class CreateZoneDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;
}

// Pipe - validation de l'ID dans la route
@Param('id', MongoIdValidationPipe) id: string
```

Cela empêche les erreurs avant même d'atteindre la base de données.

---

## 6. Conteneurisation (à venir)

L'architecture en modules facilite la conteneurisation :
- Chaque service (backend, MongoDB, Neo4j) sera dans un conteneur Docker séparé
- `docker-compose.yml` orchestrera l'ensemble
- Variables d'environnement par environnement (dev/staging/prod)

---

## 7. Résumé des choix technologiques

| Composant | Choix | Justification |
|-----------|-------|---------------|
| Runtime | Node.js 22 | Imposé par le sujet |
| Framework | NestJS 11 | Au-dessus d'Express, structure + DX |
| Base de données | MongoDB + Mongoose | Imposé + GeoJSON natif |
| Auth | Auth0 + JWT | SSO, MFA, PKCE pour Java |
| Validation | class-validator | Déclaratif, intégré à NestJS |
| Documentation | Swagger/OpenAPI | Auto-généré, exigence du sujet |
| Langage | TypeScript | Typage statif, qualité du code |
