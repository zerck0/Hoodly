import type { Service, ServiceCreator } from './service.types'

export interface MessageSender {
  _id: string
  name: string
  picture?: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId?: string | MessageSender
  content?: string
  system: boolean
  edited?: boolean
  imageUrl?: string
  createdAt: string
  updatedAt?: string
}

export interface Creneau {
  date: string
  debut: string
  fin: string
  statut: 'en_attente' | 'confirme' | 'annule'
  proposeurId?: string
}

export interface Conversation {
  _id: string
  serviceId?: Service
  eventId?: string
  nom?: string
  participants: ServiceCreator[]
  statut: 'active' | 'archived'
  prestationStatut?: 'aucun' | 'valide' | 'en_cours' | 'termine' | 'refuse'
  realisationValidee?: boolean
  creneau?: Creneau
  createdAt: string
  updatedAt: string
}
