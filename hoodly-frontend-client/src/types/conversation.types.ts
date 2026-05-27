import type { Service, ServiceCreator } from './service.types'

export interface Message {
  _id: string
  conversationId: string
  senderId?: string
  content: string
  system: boolean
  edited?: boolean
  createdAt: string
  updatedAt?: string
}

export interface Creneau {
  date: string
  debut: string
  fin: string
  statut: 'en_attente' | 'confirme' | 'annule'
}

export interface Conversation {
  _id: string
  serviceId?: Service
  participants: ServiceCreator[]
  statut: 'active' | 'archived'
  prestationStatut?: 'aucun' | 'valide' | 'en_cours' | 'termine' | 'refuse'
  realisationValidee?: boolean
  creneau?: Creneau
  createdAt: string
  updatedAt: string
}
