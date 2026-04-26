import api from '../../lib/axios'
import type { Zone, ZoneMembership, ZoneRequest } from '../../types/zone.types'

export const zonesApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<{ items: Zone[]; total: number; page: number }>(
      `/zones?page=${page}&limit=${limit}`,
    ),

  search: (nom?: string, ville?: string) =>
    api.get<Zone[]>('/zones/search', {
      params: { nom, ville },
    }),

  findNearby: (lat: number, lng: number) =>
    api.get<Zone[]>('/zones/nearby', {
      params: { lat, lng },
    }),

  getMyZone: () => api.get<Zone>('/zones/my'),

  createMembership: (data: {
    zoneId: string
    justificatifUrl: string
    pieceIdentiteUrl: string
  }) => api.post<ZoneMembership>('/zones/memberships', data),

  createZoneRequest: (data: {
    nomQuartier: string
    ville: string
    codePostal: string
    description: string
    latitude: number
    longitude: number
  }) => api.post<ZoneRequest>('/zones/requests', data),

  intentMembership: (zoneId: string) =>
    api.post(`/zones/memberships/intent/${zoneId}`),

  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
