# Descriptif fonctionnel - Hoodly

## Présentation

Hoodly est une plateforme collaborative sécurisée de quartiers permettant aux habitants d'échanger des services, de signer des documents numériques, de participer à des événements et de communiquer via une messagerie multimédia.

---

## Acteurs du système

| Acteur | Description |
|--------|-------------|
| **Habitant** | Utilisateur standard. Peut consulter, créer des annonces, participer aux événements, voter. |
| **Modérateur** | Valide les demandes d'adhésion aux zones, modère les contenus. |
| **Administrateur** | Gère les zones, les utilisateurs, les incidents, crée des sondages. Accède au dashboard Java. |

---

## Fonctionnalités Web

### 1. Authentification & Sécurité

| Fonctionnalité | Description |
|----------------|-------------|
| Connexion via Auth0 | Login SSO avec email/mot de passe ou providers sociaux |
| Synchronisation profil | Auth0 → MongoDB à chaque connexion |
| Gestion des rôles | 3 niveaux : USER, MODERATOR, ADMIN |
| Guards JWT | Protection des routes sensibles |
| MFA (2FA) | Authentification multi-facteurs pour actions sensibles (connexion, modif email/tel/mdp, signatures) |
| SSO Java/Web | Même session Auth0 entre web et desktop via PKCE flow |

### 2. Gestion des utilisateurs

| Fonctionnalité | Description |
|----------------|-------------|
| Liste des utilisateurs | Vue paginée avec recherche et filtres (rôle, statut) |
| Détail utilisateur | Consultation du profil complet |
| Mise à jour | Modification du rôle et du statut actif |
| Suppression | Suppression d'un compte |

### 3. Gestion des zones (quartiers)

| Fonctionnalité | Description |
|----------------|-------------|
| Création de zone | Admin crée un quartier (nom, ville, polygone GeoJSON) |
| Demande de création | Utilisateur propose un nouveau quartier |
| Validation/refus demande | Admin accepte ou refuse avec commentaire |
| Demande d'adhésion | Utilisateur demande à rejoindre une zone avec justificatifs |
| Validation/refus adhésion | Modérateur/admin valide avec vérification des pièces |
| Modélisation géographique | Polygones GeoJSON pour délimiter les quartiers |
| Gestion des limites | Utilisateur à cheval sur plusieurs zones, détection automatique |
| Carte interactive | Visualisation des zones sur Mapbox |

### 4. Gestion des incidents

| Fonctionnalité | Description |
|----------------|-------------|
| Création d'incident | Signalement avec type, description, photo, priorité |
| Liste des incidents | Affichage avec filtres (statut, priorité, zone) |
| Gestion des statuts | Transitions : signalé → en_cours → résolu → fermé |
| Dashboard admin | Vue admin pour gérer les incidents |

### 5. Services entre voisins

| Fonctionnalité | Description |
|----------------|-------------|
| Annonces (offre/demande) | Publication de services gratuits ou payants |
| Système de points | Calcul automatique des points pour services payants |
| Contrats automatiques | Génération de contrat obligatoire pour services payants |
| Documents et signatures | Upload PDF, zones de signature/initiales, archivage sécurisé |
| Signature numérique | Signature électronique sécurisée avec historique |

### 6. Événements et activités

| Fonctionnalité | Description |
|----------------|-------------|
| CRUD événements | Création, consultation, modification, suppression |
| Inscription/désinscription | Participation aux événements |
| Swipe d'intérêt | Indiquer son intérêt sans s'inscrire |
| Suggestions automatiques | Recommandations Neo4j basées sur interactions passées |

### 7. Messagerie multimédia sécurisée

| Fonctionnalité | Description |
|----------------|-------------|
| Chat texte | Messages entre utilisateurs |
| Médias | Partage de photos et messages vocaux |
| Présence temps réel | Statut online/offline via WebSocket |
| Appels vidéo (bonus) | Communication vidéo P2P |
| Chiffrement | Sécurisation des échanges |

### 8. Votes et sondages

| Fonctionnalité | Description |
|----------------|-------------|
| Création de sondages | Admin/modérateur crée un vote paramétrable et extensible |
| Vote des habitants | Participation avec protection anti-double-vote |
| Résultats en temps réel | Affichage des résultats calculés |

### 9. Conformité RGPD

| Fonctionnalité | Description |
|----------------|-------------|
| Droit d'accès | Export des données personnelles |
| Droit de rectification | Modification des données personnelles |
| Droit de suppression | Suppression du compte et anonymisation des données |
| Droit à la portabilité | Export dans un format standard |

### 10. Internationalisation

| Fonctionnalité | Description |
|----------------|-------------|
| Multilingue | Support français/anglais minimum |
| Messages traduits | Erreurs, labels, contenus dynamiques |

### 11. Extension

| Fonctionnalité | Description |
|----------------|-------------|
| Modules supplémentaires | Possibilité d'ajouter des modules sans modifier le code existant |
| Langage d'interrogation custom | DSL via lex/yacc pour interroger MongoDB |

---

## Application Java Desktop (Administrateur)

| Fonctionnalité | Description |
|----------------|-------------|
| Dashboard incidents | Liste des incidents avec statistiques et graphiques |
| Gestion des incidents | Modifier le statut/priorité des incidents signalés |
| Authentification PKCE | Connexion via Auth0 (flux sécurisé sans secret client) |
| Mode offline-first | Fonctionnement sans internet avec base SQLite locale |
| Synchronisation auto | Sync automatique à la reconnexion avec résolution de conflits |
| Consultation hors ligne | Accès aux incidents et statistiques en mode déconnecté |
| Ajout hors ligne | Création de données en mode déconnecté, sync différée |
| Plugins | Export statistiques (PDF/CSV), analyse sociale, calendrier local |
| Thèmes | Personnalisation complète (couleurs, polices, disposition) |
| Mises à jour auto | Téléchargement et installation depuis serveur central |
| Désinstallation | Depuis l'interface de l'application |

---

## Base de données

| Base | Usage |
|------|-------|
| **MongoDB** | Documents (contrats, signatures), événements, messages, utilisateurs, zones |
| **Neo4j** | Graphe social des interactions (qui a aidé qui, événements communs) |
| **SQLite** (Java) | Base locale embarquée pour mode offline-first |

---

## Documentation API

| Fonctionnalité | Description |
|----------------|-------------|
| Swagger UI | Interface de test des endpoints |
| Documentation OpenAPI | Spécification auto-générée |
| Documentation technique | Use cases, MCD, architecture, algorithmes |
