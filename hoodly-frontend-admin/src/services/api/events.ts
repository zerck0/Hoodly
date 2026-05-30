import { apiClient } from '../../lib/axios';
import type { IEventsListResponse } from '../../types/event.types';

export interface EventsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categorie?: string;
  statut?: string;
}

export const eventsApi = {
  getAll: async (params: EventsQueryParams = {}) => {
    const { data } = await apiClient.get<IEventsListResponse>('/events', { params });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/events/${id}`);
    return data;
  },
};
