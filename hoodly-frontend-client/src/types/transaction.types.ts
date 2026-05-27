import type { Service } from './service.types'
import type { User } from './user.types'

export interface Transaction {
  _id: string
  payerId?: User
  recipientId?: User
  amount: number
  serviceId?: Service
  description: string
  type: 'service_payment' | 'welcome_grant' | 'admin_adjustment'
  createdAt: string
  updatedAt: string
}
