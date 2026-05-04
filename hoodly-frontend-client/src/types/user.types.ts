import { ZoneMembershipStatus } from './status.enum'

export interface User {
  id: string
  auth0Id: string
  email: string
  name?: string
  picture?: string
  phone?: string
  role: 'user' | 'moderator' | 'admin'
  isActive: boolean
  zoneStatut: ZoneMembershipStatus
  zoneId?: string
  createdAt?: Date
  updatedAt?: Date
  refusalReason?: string
  refusalType?: 'zone' | 'membership'
}
