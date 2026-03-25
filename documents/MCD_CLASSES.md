# MCD et Diagramme de classes - Hoodly

## Modèle Conceptuel de Données (MCD)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    USER      │         │    ZONE      │         │  INCIDENT    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ _id (PK)     │    N    │ _id (PK)     │    N    │ _id (PK)     │
│ auth0Id      │─────────│ nom          │─────────│ type         │
│ email        │  membre │ ville        │contient │ description  │
│ name         │  de     │ geometry     │         │ photoUrl     │
│ picture      │    1    │ createdPar   │    1    │ statut       │
│ role         │         │ statut       │         │ priorite     │
│ isActive     │         │ createdAt    │         │ signaledPar  │
│ createdAt    │         │ updatedAt    │         │ zoneId (FK)  │
│ updatedAt    │         └──────────────┘         │ createdAt    │
└──────────────┘                                  │ updatedAt    │
       │                                          └──────────────┘
       │
       │         ┌──────────────┐         ┌──────────────┐
       │         │ ZONE_REQUEST │         │   SERVICE    │
       │         ├──────────────┤         ├──────────────┤
       │         │ _id (PK)     │         │ _id (PK)     │
       └─────────│ userId (FK)  │         │ titre        │
         crée    │ nomQuartier  │         │ description  │
                 │ ville        │         │ type (offre/ │
                 │ codePostal   │         │   demande)   │
                 │ description  │         │ gratuit      │
                 │ statut       │         │ points       │
                 │ commentaire  │         │ createdBy    │
                 │ traitePar    │         │ zoneId (FK)  │
                 │ traiteLe     │         │ createdAt    │
                 │ createdAt    │         │ updatedAt    │
                 └──────────────┘         └──────────────┘
                                                   │
       ┌──────────────┐                            │
       │  MEMBERSHIP  │                            │
       ├──────────────┤                            │
       │ _id (PK)     │         ┌──────────────┐   │
       │ userId (FK)  │         │   CONTRAT    │   │
       │ zoneId (FK)  │         ├──────────────┤   │
       │ justificatif │         │ _id (PK)     │───┘
       │ pieceIdent.  │         │ serviceId(FK)│  génère
       │ statut       │         │ prestataire  │
       │ createdAt    │         │ demandeur    │
       └──────────────┘         │ points       │
                                │ statut       │
       ┌──────────────┐         │ signeLe      │
       │    EVENT     │         └──────────────┘
       │              │
       ├──────────────┤         ┌──────────────┐
       │ _id (PK)     │         │   MESSAGE    │
       │ titre        │         │              │
       │ description  │         ├──────────────┤
       │ dateDebut    │         │ _id (PK)     │
       │ dateFin      │         │ expediteurId │
       │ lieu         │         │ destinataire │
       │ createdBy    │         │ contenu      │
       │ zoneId (FK)  │         │ type (text/  │
       │ createdAt    │         │  photo/audio)│
       └──────────────┘         │ lu           │
                                │ createdAt    │
       ┌──────────────┐         └──────────────┘
       │    VOTE      │
       │              │         ┌──────────────┐
       ├──────────────┤         │ DOCUMENT     │
       │ _id (PK)     │         │              │
       │ titre        │         ├──────────────┤
       │ description  │         │ _id (PK)     │
       │ options[]    │         │ titre        │
       │ createdBy    │         │ fichierUrl   │
       │ zoneId (FK)  │         │ type         │
       │ statut       │         │ zones_sign[] │
       │ startDate    │         │ createdBy    │
       │ endDate      │         │ signataires[]│
       │ createdAt    │         │ archive      │
       └──────────────┘         │ createdAt    │
                                └──────────────┘
       ┌──────────────┐
       │  USER_VOTE   │
       ├──────────────┤
       │ _id (PK)     │
       │ pollId (FK)  │
       │ userId (FK)  │
       │ optionIndex  │
       │ createdAt    │
       └──────────────┘
```

---

## Relations principales

| Relation | Type | Description |
|----------|------|-------------|
| User -- Zone | N:N (via Membership) | Un user peut être membre de plusieurs zones (rare mais possible) |
| Zone -- Incident | 1:N | Une zone contient plusieurs incidents |
| User -- Incident | 1:N (signaledPar) | Un user peut signaler plusieurs incidents |
| User -- ZoneRequest | 1:N | Un user peut faire plusieurs demandes de zone |
| Zone -- Service | 1:N | Une zone contient plusieurs services |
| Service -- Contrat | 1:1 | Chaque service payant génère un contrat |
| Zone -- Event | 1:N | Une zone contient plusieurs événements |
| User -- Event | N:N (participants) | Un user peut participer à plusieurs événements |
| User -- Message | N:N (conversations) | Un user peut envoyer/recevoir des messages |
| Zone -- Vote | 1:N | Une zone peut avoir plusieurs sondages |
| User -- Vote | N:N (via UserVote) | Un user peut voter sur plusieurs sondages |

---

## Diagramme de classes simplifié (backend NestJS)

```
┌─────────────────────────────────────────────────────────┐
│                    AppModule                             │
│  imports: [AuthModule, UsersModule, ZonesModule,        │
│            IncidentsModule]                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    AuthModule                            │
├─────────────────────────────────────────────────────────┤
│  AuthController                                         │
│    + syncUser(req) → UserResponseDto                    │
│    + getMe(req) → UserResponseDto                       │
│                                                         │
│  AuthService                                            │
│    + syncFromAuth0(auth0Id, profile) → User             │
│    + getProfileByAuth0Id(auth0Id) → User                │
│                                                         │
│  JwtStrategy                                            │
│    + validate(payload) → JwtPayloadDto                  │
│                                                         │
│  JwtGuard / RolesGuard                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    UsersModule                           │
├─────────────────────────────────────────────────────────┤
│  UsersController                                        │
│    + findAll(page, limit, search, role, isActive)       │
│    + findOne(id) → User                                 │
│    + update(id, dto) → User                             │
│    + remove(id) → User                                  │
│                                                         │
│  UsersService                                           │
│    + findAll(...) → {users, total, page, ...}           │
│    + findById(id) → User                                │
│    + updateUser(id, dto) → User                         │
│    + deleteUser(id) → User                              │
│    + syncFromAuth0(auth0Id, profile) → User             │
│    + getProfileByAuth0Id(auth0Id) → User                │
│                                                         │
│  Schemas: User (auth0Id, email, name, role, ...)        │
│  DTOs: UserResponseDto, UpdateUserDto, UsersListDto     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ZonesModule                           │
├─────────────────────────────────────────────────────────┤
│  ZonesController                                        │
│    + findAll() → Zone[]                                 │
│    + search(nom, ville) → Zone[]                        │
│    + create(dto, user) → Zone                           │
│                                                         │
│  ZoneRequestsController (via ZonesController)           │
│    + createZoneRequest(dto, user) → ZoneRequest         │
│    + findAllZoneRequests() → ZoneRequest[]              │
│    + acceptZoneRequest(id, user, body) → Zone           │
│    + refuseZoneRequest(id, user, body) → ZoneRequest    │
│                                                         │
│  ZoneMembershipsController (via ZonesController)        │
│    + createMembership(dto, user) → ZoneMembership       │
│    + findAllMemberships() → ZoneMembership[]            │
│    + acceptMembership(id, user) → ZoneMembership        │
│    + refuseMembership(id, user, body) → ZoneMembership  │
│                                                         │
│  Schemas: Zone, ZoneRequest, ZoneMembership             │
│  DTOs: CreateZoneDto, CreateZoneRequestDto,             │
│         CreateMembershipDto, AdminActionDto             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  IncidentsModule                         │
├─────────────────────────────────────────────────────────┤
│  IncidentsController                                    │
│    + findAll() → Incident[]                             │
│    + create(dto) → Incident                             │
│                                                         │
│  IncidentsService                                       │
│    + findAll() → Incident[]                             │
│    + create(dto) → Incident                             │
│                                                         │
│  Schema: Incident (type, description, statut,           │
│          priorite, signaledPar, zoneId, ...)            │
│  DTOs: CreateIncidentDto, UpdateIncidentDto             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Shared                                  │
├─────────────────────────────────────────────────────────┤
│  MongoIdValidationPipe                                  │
│    + transform(value) → string (valid ObjectId)         │
└─────────────────────────────────────────────────────────┘
```

---

## Schéma MongoDB (User)

```json
{
  "_id": ObjectId,
  "auth0Id": "auth0|abc123",
  "email": "user@example.com",
  "name": "Jean Dupont",
  "picture": "https://...",
  "role": "USER | MODERATOR | ADMIN",
  "isActive": true,
  "zoneStatut": "NO_ZONE | PENDING_ZONE | MEMBER",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Schéma MongoDB (Zone)

```json
{
  "_id": ObjectId,
  "nom": "Quartier des Lilas",
  "ville": "Paris",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  },
  "createdPar": ObjectId (ref: User),
  "statut": "active | inactive",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Schéma MongoDB (Incident)

```json
{
  "_id": ObjectId,
  "type": "bruit | degradation | securite | ...",
  "description": "Description de l'incident",
  "photoUrl": "https://...",
  "statut": "signale | en_cours | resolu | ferme",
  "priorite": "basse | normale | haute | urgente",
  "signaledPar": "user123",
  "zoneId": ObjectId (ref: Zone),
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Schéma MongoDB (Service)

{
  "_id": ObjectId,
  "titre": "Babysitting 3 heures",
  "description": "Garde d'enfant le samedi après-midi",
  "type": "offre | demande",
  "gratuit": false,
  "points": 4,
  "createdBy": ObjectId (ref: User),
  "zoneId": ObjectId (ref: Zone),
  "createdAt": ISODate,
  "updatedAt": ISODate
}

## Schéma MongoDB (Contrat)

{
  "_id": ObjectId,
  "serviceId": ObjectId (ref: Service),
  "prestataireId": ObjectId (ref: User),
  "demandeurId": ObjectId (ref: User),
  "points": 4,
  "statut": "en_attente | signe | annule",
  "signeLe": ISODate,
  "documentUrl": "https://...",
  "createdAt": ISODate
}

## Schéma MongoDB (Event)

{
  "_id": ObjectId,
  "titre": "Soirée quartier",
  "description": "Rencontre entre voisins",
  "dateDebut": ISODate,
  "dateFin": ISODate,
  "lieu": "Place du marché",
  "createdBy": ObjectId (ref: User),
  "zoneId": ObjectId (ref: Zone),
  "participants": [ObjectId (ref: User)],
  "interesses": [ObjectId (ref: User)],
  "createdAt": ISODate,
  "updatedAt": ISODate
}

## Schéma MongoDB (Message)

{
  "_id": ObjectId,
  "expediteurId": ObjectId (ref: User),
  "destinataireId": ObjectId (ref: User),
  "contenu": "Bonjour !",
  "type": "text | photo | audio",
  "mediaUrl": "https://...",
  "lu": false,
  "createdAt": ISODate
}

## Schéma MongoDB (Vote / Poll)

{
  "_id": ObjectId,
  "titre": "Nouveau playground ?",
  "description": "Votez pour l'installation d'un playground",
  "options": ["Oui", "Non", "Peut-être"],
  "createdBy": ObjectId (ref: User),
  "zoneId": ObjectId (ref: Zone),
  "statut": "ouvert | ferme",
  "startDate": ISODate,
  "endDate": ISODate,
  "createdAt": ISODate
}

## Schéma MongoDB (UserVote)

{
  "_id": ObjectId,
  "pollId": ObjectId (ref: Vote),
  "userId": ObjectId (ref: User),
  "optionIndex": 0,
  "createdAt": ISODate
}

## Schéma MongoDB (Document)

{
  "_id": ObjectId,
  "titre": "Contrat de babysitting",
  "fichierUrl": "https://...",
  "type": "contrat | justificatif | autre",
  "zonesSignature": [{ x: number, y: number, page: number }],
  "createdBy": ObjectId (ref: User),
  "signataires": [{ userId: ObjectId, signeLe: ISODate }],
  "archive": false,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
