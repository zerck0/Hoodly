import { apiClient } from '../../lib/axios';
import type { IServicesListResponse } from '../../types/service.types';

export interface ServicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  statut?: string;
}

export const servicesApi = {
  getAll: async (params: ServicesQueryParams = {}) => {
    const { data } = await apiClient.get<IServicesListResponse>('/services', { params });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/services/${id}`);
    return data;
  },
};
