export type ServiceType = 'offre' | 'demande'

export type ServiceStatus = 'actif' | 'en_cours' | 'termine' | 'annule'

export interface ServiceCreator {
  id?: string
  _id?: string
  name?: string
  email?: string
  picture?: string
}

export interface Service {
  id?: string
  _id: string
  titre: string
  description: string
  type: ServiceType
  categorie: string
  gratuit: boolean
  points?: number
  statut: ServiceStatus
  createurId: ServiceCreator | string
  zoneId: string
  responderId?: ServiceCreator | string
  refusedResponders?: string[]
  realisationValidee?: boolean
  recurrente?: boolean
  disponibilites?: string[]
  datePlanification?: string
  contractId?: string
  photoUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateServiceDto {
  titre: string
  description: string
  type: ServiceType
  categorie: string
  gratuit: boolean
  points?: number
  zoneId?: string
  photoUrl?: string
  recurrente?: boolean
  disponibilites?: string[]
  datePlanification?: string
}

export interface PaginatedServices {
  services: Service[]
  total: number
  page: number
  limit: number
  totalPages: number
}
