import { apiClient } from '../../lib/axios';
import type { IIncidentResponse, IUpdateIncidentStatutDto } from '../../types/incident.types';

export interface IncidentsQueryParams {
  zoneId?: string;
  statut?: string;
  criticite?: string;
}

export const incidentsApi = {
  getAll: async (params: IncidentsQueryParams = {}) => {
    const { data } = await apiClient.get<IIncidentResponse[]>('/incidents', { params });
    return data;
  },

  updateStatut: async (id: string, body: IUpdateIncidentStatutDto) => {
    const { data } = await apiClient.patch<IIncidentResponse>(`/incidents/${id}`, body);
    return data;
  },
};
