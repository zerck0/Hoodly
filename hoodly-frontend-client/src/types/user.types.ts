export interface User {
  id: string
  auth0Id: string
  email: string
  name?: string
  picture?: string
  phone?: string
  role: 'user' | 'moderator' | 'admin'
  isActive: boolean
  zoneStatut: 'sans_zone' | 'en_attente_zone' | 'en_attente_adh' | 'verif_en_cours' | 'actif'
  zoneId?: string
  createdAt?: Date
  updatedAt?: Date
  refusalReason?: string
  refusalType?: 'zone' | 'membership'
}
