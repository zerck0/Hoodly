import api from '../../lib/axios'
import type { User } from '../../types/user.types'

export const usersApi = {
  updateProfile: (data: { name?: string; phone?: string; picture?: string }) =>
    api.patch<User>('/auth/me', data),

  searchVoisins: (search?: string, global?: boolean) =>
    api.get<{ id: string; name: string; email: string; picture?: string; zoneId?: string }[]>('/users/search-voisins', {
      params: { search, global: global ? 'true' : 'false' },
    }),
}
