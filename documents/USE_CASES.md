# Use Cases - Hoodly

## Acteurs

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│  Habitant   │  │ Modérateur  │  │Administrateur│
│  (USER)     │  │(MODERATOR)  │  │   (ADMIN)    │
└─────────────┘  └─────────────┘  └──────────────┘
```

---

## UC1 — S'authentifier

| | |
|---|---|
| **Acteur** | Habitant, Modérateur, Administrateur |
| **Application** | Web (client + admin) + Java Desktop |
| **Précondition** | Aucune |
| **Scénario nominal** | 1. Utilisateur accède à l'application → 2. Redirection vers Auth0 → 3. Saisie email/mot de passe → 4. Validation Auth0 → 5. Réception JWT → 6. Sync profil Auth0 → MongoDB → 7. Accès à l'application |
| **Scénario alternatif** | 4a. MFA requis → saisie code TOTP → 5. Pour l'app Java : flux PKCE (Proof Key for Code Exchange) au lieu d'un redirect classique. |
| **Postcondition** | Utilisateur authentifié, profil synchronisé |

---

## UC2 — Créer et gérer les zones (Admin)

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Web admin + Java Desktop |
| **Précondition** | Authentifié en tant qu'ADMIN |
| **Scénario nominal** | 1. Admin accède à la gestion des zones → 2. Crée une zone (nom, ville, polygone GeoJSON via Mapbox) → 3. Zone disponible pour les habitants |
| **Scénario alternatif** | 2a. Admin consulte les demandes de création de zone → accepte ou refuse avec commentaire → zone créée automatiquement si accepté |
| **Postcondition** | Zone créée et visible |

---

## UC3 — Demander la création d'un quartier

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, pas de demande en attente |
| **Scénario nominal** | 1. Habitant clique "Proposer un quartier" → 2. Remplit le formulaire (nom, ville, code postal, description) → 3. Soumission → 4. Demande en attente de validation |
| **Scénario alternatif** | 3a. Demande déjà en attente → message d'erreur |
| **Postcondition** | Demande créée, notifiée aux admins |

---

## UC4 — Rejoindre un quartier

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, zone existante, pas déjà membre |
| **Scénario nominal** | 1. Habitant consulte les zones disponibles → 2. Sélectionne une zone → 3. Upload justificatif de domicile + pièce d'identité → 4. Soumission → 5. Demande d'adhésion en attente → 6. Modérateur vérifie les pièces → 7. Acceptation → habitant membre de la zone |
| **Scénario alternatif** | 6a. Refus avec motif → habitant notifié. 6b. Utilisateur à cheval sur 2 zones → proposition des 2 zones possibles |
| **Postcondition** | Habitant membre de la zone |

---

## UC5 — Consulter la carte des quartiers

| | |
|---|---|
| **Acteur** | Habitant, Modérateur, Administrateur |
| **Application** | Web client + admin |
| **Précondition** | Authentifié |
| **Scénario nominal** | 1. Utilisateur ouvre la carte → 2. Affichage des quartiers sur Mapbox → 3. Sélection d'un quartier → 4. Affichage des détails (habitants, incidents, événements) |
| **Scénario alternatif** | 2a. Habitant non localisé → saisie manuelle d'une adresse → affichage du quartier correspondant |
| **Postcondition** | Quartier visualisé |

---

## UC6 — Publier un service entre voisins

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, membre d'une zone |
| **Scénario nominal** | 1. Habitant crée une annonce (offre ou demande de service) → 2. Choisit gratuit ou payant → 3. Si payant : définit le nombre de points (ex: babysitting 3h = 4 points, cours 1h = 2 points) → 4. Publication dans sa zone |
| **Scénario alternatif** | 3a. Service payant → création automatique d'un contrat obligatoire → attente de signature par les deux parties |
| **Postcondition** | Service visible par les voisins de la zone |

---

## UC7 — Signer un contrat de service

| | |
|---|---|
| **Acteur** | Habitant (prestataire + demandeur) |
| **Application** | Web client |
| **Précondition** | Service payant créé, contrat généré |
| **Scénario nominal** | 1. Prestataire consulte le contrat → 2. Import du PDF → 3. Ajout de zones de signature/initiales → 4. Signature numérique sécurisée → 5. Demandeur consulte et signe → 6. Contrat archivé → 7. Points transférés |
| **Scénario alternatif** | 4a. MFA requis avant signature → validation 2 facteurs |
| **Postcondition** | Contrat signé, archivé, points transférés |

---

## UC8 — Signaler un incident

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, membre d'une zone |
| **Scénario nominal** | 1. Habitant clique "Signaler un incident" → 2. Remplit le formulaire (type, description, photo, priorité, localisation) → 3. Soumission → 4. Incident créé et visible par l'admin |
| **Postcondition** | Incident créé dans la zone concernée |

---

## UC9 — Gérer les incidents (Dashboard Java)

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Java Desktop |
| **Précondition** | Authentifié via l'app Java |
| **Scénario nominal** | 1. Admin ouvre le dashboard → 2. Vue des incidents avec statistiques (signalés, en cours, résolus) → 3. Sélectionne un incident → 4. Change le statut/priorité → 5. Sauvegarde → synchronisation avec le backend |
| **Scénario alternatif** | 1a. Pas de connexion → mode offline → données locales SQLite affichées → modifications en file d'attente → sync automatique à la reconnexion avec résolution de conflits |
| **Postcondition** | Incident mis à jour |

---

## UC10 — Créer un événement

| | |
|---|---|
| **Acteur** | Habitant, Modérateur, Administrateur |
| **Application** | Web client |
| **Précondition** | Authentifié, membre d'une zone |
| **Scénario nominal** | 1. Utilisateur crée un événement (soirée, atelier, collecte) → 2. Remplit les détails (titre, date, lieu, description) → 3. Publication → 4. Les voisins de la zone sont notifiés |
| **Scénario alternatif** | 2a. Swipe d'intérêt : un voisin indique son intérêt sans s'inscrire formellement |
| **Postcondition** | Événement visible et ouvert aux inscriptions |

---

## UC11 — Participer à un événement

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, événement ouvert |
| **Scénario nominal** | 1. Habitant consulte les événements de sa zone → 2. Sélectionne un événement → 3. S'inscrit → 4. Reçoit une confirmation |
| **Scénario alternatif** | 2a. Suggestions automatiques Neo4j : "Vous pourriez intéresser cet événement car vos voisins X et Y y participent" |
| **Postcondition** | Habitant inscrit, relation enregistrée dans Neo4j |

---

## UC12 — Envoyer un message

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, membre d'une zone |
| **Scénario nominal** | 1. Habitant ouvre la messagerie → 2. Sélectionne un destinataire → 3. Rédige un message texte → 4. Envoi → 5. Destinataire notifié en temps réel (WebSocket) |
| **Scénario alternatif** | 3a. Envoi d'une photo ou d'un message vocal. 3b. Appel vidéo (bonus). 5a. Destinataire hors ligne → message stocké → notification à la reconnexion |
| **Postcondition** | Message délivré, historique mis à jour |

---

## UC13 — Créer et participer à un sondage

| | |
|---|---|
| **Acteur** | Admin/Modérateur (création), Habitant (vote) |
| **Application** | Web admin (création) + Web client (vote) |
| **Précondition** | Authentifié, sondage ouvert |
| **Scénario nominal** | 1. Admin crée un sondage (titre, description, options, dates de début/fin) → 2. Publication dans la zone → 3. Habitant consulte le sondage → 4. Vote pour une option → 5. Vérification anti-double-vote → 6. Résultats mis à jour en temps réel |
| **Postcondition** | Vote enregistré, résultats calculés |

---

## UC14 — Consulter les recommandations

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, historique d'interactions |
| **Scénario nominal** | 1. Habitant consulte ses recommandations → 2. Affichage de voisins fiables (basé sur les services HELPED dans Neo4j) → 3. Événements pertinents (ATTENDED) → 4. Services compatibles (INTERESTED_IN) |
| **Algorithme** | Requêtes Neo4j sur le graphe social des interactions |
| **Postcondition** | Recommandations affichées |

---

## UC15 — Gérer ses données personnelles (RGPD)

| | |
|---|---|
| **Acteur** | Habitant, Modérateur, Administrateur |
| **Application** | Web client + admin |
| **Précondition** | Authentifié |
| **Scénario nominal** | 1. Utilisateur accède aux paramètres → 2. Choix : exporter ses données → 3. Génération d'un JSON contenant toutes les données personnelles → 4. Téléchargement |
| **Scénario alternatif** | 2a. "Supprimer mon compte" → anonymisation des données → suppression définitive. 2b. "Modifier mes informations" → rectification en temps réel |
| **Postcondition** | Données exportées/modifiées/supprimées |

---

## UC16 — Synchronisation offline/online (Java)

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Java Desktop |
| **Précondition** | App Java lancée, données synchronisées au moins une fois |
| **Scénario nominal** | 1. Connexion perdue → basculement automatique en mode offline → 2. Consultation des incidents/statistiques depuis SQLite local → 3. Ajout/modification possible → 4. Connexion rétablie → 5. Synchronisation automatique → 6. Résolution des conflits (dernier modifié gagne) |
| **Scénario alternatif** | 6a. Conflit détecté (même incident modifié offline et online) → priorité à la version serveur + notification |
| **Postcondition** | Données synchronisées, conflits résolus |

---

## UC17 — Gérer les utilisateurs (Admin)

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Web admin |
| **Précondition** | Authentifié en tant qu'ADMIN |
| **Scénario nominal** | 1. Admin accède à la liste des utilisateurs → 2. Filtre/recherche (par nom, rôle, statut) → 3. Sélectionne un utilisateur → 4. Modifie rôle/statut → 5. Sauvegarde |
| **Scénario alternatif** | 3a. Suppression d'un compte → anonymisation des données (RGPD) |
| **Postcondition** | Utilisateur mis à jour |

---

## UC18 — Gérer les plugins et thèmes (Java)

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Java Desktop |
| **Précondition** | App Java installée |
| **Scénario nominal** | 1. Admin accède aux paramètres → 2. Active/désactive des plugins (export statistiques, analyse sociale, calendrier local) → 3. Personnalise le thème (couleurs, polices, disposition) → 4. Mise à jour automatique depuis le serveur central |
| **Scénario alternatif** | 4a. Admin désinstalle l'app depuis l'interface |
| **Postcondition** | App personnalisée, plugins configurés |

---

## UC19 — Interroger MongoDB avec le langage custom

| | |
|---|---|
| **Acteur** | Administrateur |
| **Application** | Web admin |
| **Précondition** | Authentifié, connaissances du DSL |
| **Scénario nominal** | 1. Admin saisit une requête en DSL custom (ex: `FIND users WHERE role = "ADMIN"`) → 2. Le parser (lex/yacc) analyse la syntaxe → 3. Traduction en requête MongoDB → 4. Exécution → 5. Affichage des résultats |
| **Scénario alternatif** | 2a. Erreur de syntaxe → message d'erreur avec position |
| **Postcondition** | Résultats affichés |

---

## UC20 — Documents et signatures en ligne

| | |
|---|---|
| **Acteur** | Habitant |
| **Application** | Web client |
| **Précondition** | Authentifié, document partagé dans la zone |
| **Scénario nominal** | 1. Utilisateur importe un PDF → 2. Définit les zones de signature et d'initiales → 3. Partage avec les destinataires → 4. Chaque destinataire signe numériquement → 5. Document archivé |
| **Scénario alternatif** | 4a. MFA requis avant signature. 4b. Historique des signatures traçable |
| **Postcondition** | Document signé et archivé |

---

## Matrice des permissions

| Fonctionnalité | USER | MODERATOR | ADMIN |
|----------------|------|-----------|-------|
| Consulter zones/carte | ✅ | ✅ | ✅ |
| Demander création zone | ✅ | ✅ | ✅ |
| Valider demande zone | ❌ | ❌ | ✅ |
| Rejoindre un quartier | ✅ | ✅ | ✅ |
| Valider adhésion | ❌ | ✅ | ✅ |
| Publier un service | ✅ | ✅ | ✅ |
| Signer un contrat/document | ✅ | ✅ | ✅ |
| Signaler incident | ✅ | ✅ | ✅ |
| Gérer incidents | ❌ | ❌ | ✅ |
| Créer événement | ✅ | ✅ | ✅ |
| Participer événement | ✅ | ✅ | ✅ |
| Envoyer message | ✅ | ✅ | ✅ |
| Créer sondage | ❌ | ✅ | ✅ |
| Voter | ✅ | ✅ | ✅ |
| Voir recommandations | ✅ | ✅ | ✅ |
| Export RGPD | ✅ | ✅ | ✅ |
| Dashboard Java | ❌ | ❌ | ✅ |
| Langage custom MongoDB | ❌ | ❌ | ✅ |
| Gérer plugins/thèmes | ❌ | ❌ | ✅ |
