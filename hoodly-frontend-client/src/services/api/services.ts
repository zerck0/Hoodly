import api from '../../lib/axios'
import type { Service, CreateServiceDto, PaginatedServices } from '../../types/service.types'

export interface GetServicesParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  statut?: string
  categorie?: string
  zoneId?: string
  createurId?: string
  responderId?: string
}

export const servicesApi = {
  getAll: (params?: GetServicesParams) =>
    api.get<PaginatedServices>('/services', { params }),

  getById: (id: string) =>
    api.get<Service>(`/services/${id}`),

  create: (data: CreateServiceDto) =>
    api.post<Service>('/services', data),

  update: (id: string, data: Partial<CreateServiceDto>) =>
    api.patch<Service>(`/services/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/services/${id}`),

  uploadPhoto: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  accepter: (id: string, body?: { responderId?: string }) =>
    api.patch<Service>(`/services/${id}/accepter`, body),

  refuser: (id: string, body: { responderId: string }) =>
    api.patch<Service>(`/services/${id}/refuser`, body),

  demarrer: (id: string, body?: { conversationId?: string }) =>
    api.patch<Service>(`/services/${id}/demarrer`, body),

  terminer: (id: string, body?: { conversationId?: string }) =>
    api.patch<Service>(`/services/${id}/terminer`, body),

  valider: (id: string, body?: { conversationId?: string }) =>
    api.patch<Service>(`/services/${id}/valider`, body),
}

