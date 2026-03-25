# Synchronisation - Hoodly

## 1. Flux de synchronisation Auth0 ↔ MongoDB

### Principe

L'application utilise Auth0 comme source de vérité pour l'identité, et MongoDB comme source de vérité pour les données métier. La synchronisation se fait à la demande (lazy sync).

### Algorithme

```
1. Utilisateur se connecte via Auth0 → reçoit un JWT
2. Le JWT est envoyé au backend à chaque requête
3. Le JwtGuard vérifie la signature du token (via JWKS)
4. Si POST /api/auth/me :
   a. Extraire le sub (ID Auth0) du payload
   b. Chercher l'utilisateur dans MongoDB par auth0Id
   c. Si trouvé → mettre à jour les champs modifiables
   d. Si non trouvé → créer le document User dans MongoDB
   e. Retourner le profil MongoDB
5. Si autre endpoint :
   a. Vérifier que l'utilisateur existe dans MongoDB
   b. Continuer le traitement
```

### Code simplifié

```typescript
// auth.service.ts
async syncFromAuth0(auth0Id: string, profile: Auth0Profile): Promise<User> {
  let user = await this.userModel.findOne({ auth0Id });

  if (!user) {
    user = new this.userModel({
      auth0Id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      role: UserRole.USER, // rôle par défaut
    });
  } else {
    user.email = profile.email;
    user.name = profile.name;
    user.picture = profile.picture;
  }

  return user.save();
}
```

---

## 2. Synchronisation Java Desktop ↔ Backend

### Mode online (par défaut)

```
App Java → Auth0 (PKCE flow) → JWT Token
                                    ↓
App Java → Backend API (avec JWT) → Données JSON
                                    ↓
App Java ← Affichage dans JavaFX
```

### Mode offline

```
1. Au premier lancement :
   - Tenter la connexion au backend
   - Si succès → synchroniser les données dans SQLite local
   - Stocker le token JWT en local (secure storage)

2. En mode hors ligne :
   - Lire depuis SQLite local
   - Les modifications sont mises en file d'attente (queue)
   - Marquer les entrées comme "sync_pending"

3. À la reconnexion :
   - Détecter la disponibilité du réseau
   - Envoyer les modifications en attente
   - Résoudre les conflits (dernier modifié gagne)
   - Mettre à jour la base locale
```

### Algorithme de résolution de conflits

```
Pour chaque entrée "sync_pending" :
  1. Récupérer la version serveur de l'entité
  2. Comparer les timestamps :
     - Si version locale > version serveur → envoyer la modification
     - Si version serveur > version locale → garder la version serveur
     - Si même timestamp → garder la version serveur (arbitrage)
  3. Marquer comme "synced"
```

---

## 3. Synchronisation entre composants web

### Frontend Admin ↔ Backend

- Communication REST classique (HTTP + JSON)
- JWT envoyé dans le header `Authorization: Bearer <token>`
- Rafraîchissement des données : polling ou WebSocket (pour les incidents en temps réel)

### Frontend Utilisateur ↔ Backend

- Même pattern REST
- WebSocket pour la messagerie temps réel
- Upload de médias via multipart/form-data
