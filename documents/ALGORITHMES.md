# Algorithmes complexes - Hoodly

## 1. Gestion des rôles et permissions (RBAC)

### Hiérarchie des rôles

```
ADMIN > MODERATOR > USER
```

### Algorithme de vérification des droits

```
Entrée : utilisateur courant (depuis JWT), rôle requis pour l'endpoint
Sortie : accès autorisé ou refusé (403)

1. Extraire le rôle de l'utilisateur depuis le JWT (payload.role)
2. Récupérer les rôles requis pour l'endpoint (via décorateur @Roles)
3. Si aucun rôle requis → accès autorisé
4. Si le rôle de l'utilisateur est dans la liste des rôles requis → accès autorisé
5. Sinon → accès refusé (403 Forbidden)
```

### Implémentation (RolesGuard)

```typescript
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
    ROLES_KEY,
    [context.getHandler(), context.getClass()],
  );
  if (!requiredRoles) return true;

  const request = context.switchToHttp().getRequest();
  const user = request.user;
  return requiredRoles.some((role) => user?.role === role);
}
```

---

## 2. Gestion des demandes de zone

### Algorithme de création d'une zone par demande

```
1. Utilisateur soumet une demande (nom, ville, code postal, description)
2. Vérifier qu'il n'a pas déjà une demande en attente
3. Créer la demande avec statut "en_attente"
4. Mettre à jour le statut de l'utilisateur ("pending_zone")

Lorsqu'un admin accepte :
5. Créer la zone dans MongoDB
6. Marquer la demande comme "accepté"
7. Stocker le commentaire admin et la date de traitement
8. Réinitialiser le statut utilisateur ("no_zone")

Lorsqu'un admin refuse :
9. Marquer la demande comme "refusé"
10. Stocker le commentaire et la date
11. Réinitialiser le statut utilisateur
```

### Gestion des limites de zone

```
1. Stocker les coordonnées du quartier comme polygone GeoJSON
2. Pour vérifier si un utilisateur est dans une zone :
   a. Obtenir les coordonnées GPS de l'adresse
   b. Tester si le point est à l'intérieur du polygone (ray casting)
   c. Si oui → appartient à cette zone
   d. Si non → chercher la zone la plus proche

Cas limites :
- Utilisateur à cheval sur 2 zones → proposer les 2 zones, l'utilisateur choisit
- Utilisateur hors de toute zone → proposer de créer une nouvelle demande
```

---

## 3. Gestion des adhésions

### Algorithme de demande d'adhésion

```
1. Utilisateur choisit une zone
2. Fournit un justificatif de domicile (URL) et une pièce d'identité (URL)
3. Créer la demande d'adhésion avec statut "en_attente"
4. Un modérateur ou admin valide :
   - Accepté → l'utilisateur rejoint la zone
   - Refusé → l'utilisateur est notifié avec le motif
```

---

## 4. Authentification JWT (flux complet)

### Algorithme de validation du token

```
Entrée : requête HTTP avec header Authorization: Bearer <token>
Sortie : utilisateur authentifié ou rejeté (401)

1. Extraire le token du header Authorization
2. Décoder le header du JWT pour obtenir le kid (key ID)
3. Récupérer la clé publique correspondante depuis JWKS d'Auth0
4. Vérifier la signature du token avec la clé publique
5. Vérifier l'expiration (exp claim)
6. Vérifier l'émetteur (iss claim = domaine Auth0)
7. Vérifier l'audience (aud claim = client ID)
8. Si tout OK → injecter le payload dans la requête
9. Sinon → rejeter avec 401 Unauthorized
```

### Implémentation (JwtStrategy)

```typescript
async validate(payload: unknown): Promise<JwtPayloadDto> {
  // payload déjà validé par passport-jwt + JWKS
  return payload as JwtPayloadDto;
}
```

---

## 5. Gestion des incidents

### Algorithme de transition de statut

```
Statuts possibles : signalé → en_cours → résolu → fermé

Règles :
- signalé peut passer à en_cours ou fermé
- en_cours peut passer à résolu ou fermé
- résolu peut passer à fermé ou en_cours (réouverture)
- fermé est un état final (sauf réouverture par admin)

Pour chaque changement de statut :
1. Vérifier que la transition est valide
2. Mettre à jour le statut
3. Enregistrer la date de modification
4. Notifier les parties concernées
```

---

## 6. Système de points

### Algorithme de calcul des points

```
Pour chaque service payant :
1. Récupérer la durée du service (en heures)
2. Récupérer le type de service (babysitting, cours, etc.)
3. Calculer les points :
   points = durée * coefficient_type_service
   - Babysitting : 1.33 pts/heure
   - Cours particulier : 2 pts/heure
   - Jardinage : 1 pt/heure
   - etc.

4. Créditer les points au prestataire
5. Débiter les points du demandeur
6. Créer un contrat automatique avec les détails
```
