import api from '../../lib/axios'
import type { User } from '../../types/user.types'

export const usersApi = {
  updateProfile: (data: { 
    name?: string; 
    phone?: string; 
    picture?: string; 
    bio?: string; 
    points?: number;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    civility?: string;
    interests?: string[];
    material?: string;
    residentType?: string;
    languages?: string;
  }) =>
    api.patch<User>('/auth/me', data),

  claimMission: (missionId: string) =>
    api.post<User>(`/auth/me/missions/${missionId}/claim`),

  searchVoisins: (search?: string, global?: boolean) =>
    api.get<{ id: string; name: string; email: string; picture?: string; zoneId?: string }[]>('/users/search-voisins', {
      params: { search, global: global ? 'true' : 'false' },
    }),

  applyForModerator: (motivation: string) =>
    api.post('/users/apply-moderator', { motivation }),

  getModeratorApplicationStatus: () =>
    api.get<{ _id: string; motivation: string; status: 'pending' | 'approved' | 'rejected' } | null>('/users/moderator-application/status'),

  getAllModeratorApplications: () =>
    api.get<{ _id: string; userId: { _id: string; name: string; email: string }; motivation: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }[]>('/users/admin/moderator-applications'),

  decideModeratorApplication: (id: string, approved: boolean) =>
    api.post(`/users/admin/moderator-applications/${id}/decide`, { approved }),
}
