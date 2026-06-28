import { apiClient } from '../../lib/axios';
import type { IVoteResponse } from '../../types/vote.types';

export const votesApi = {
  getAllByZone: async (zoneId: string) => {
    const { data } = await apiClient.get<IVoteResponse[]>(`/votes/zone/${zoneId}`);
    return data;
  },

  create: async (body: {
    zoneId: string;
    title: string;
    description?: string;
    options: string[];
    expirationDate?: string;
    isAnonymous?: boolean;
  }) => {
    const { data } = await apiClient.post<IVoteResponse>('/votes', body);
    return data;
  },

  close: async (id: string) => {
    const { data } = await apiClient.patch<IVoteResponse>(`/votes/${id}/close`, {});
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/votes/${id}`);
    return data;
  },
};
