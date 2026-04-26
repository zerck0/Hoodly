import { apiClient } from '../../lib/axios';
import type {
  IZoneResponse,
  IZonesListResponse,
  ICreateZoneDto,
  IUpdateZoneDto,
  IZoneRequestResponse,
  IZoneMembershipResponse,
  IZoneStatsResponse,
} from '../../types/zone.types';

export interface ZonesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const zonesApi = {
  getAll: async (params: ZonesQueryParams = {}) => {
    const { data } = await apiClient.get<IZonesListResponse>('/zones', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<IZoneResponse>(`/zones/${id}`);
    return data;
  },

  create: async (body: ICreateZoneDto) => {
    const { data } = await apiClient.post<IZoneResponse>('/zones', body);
    return data;
  },

  update: async (id: string, body: IUpdateZoneDto) => {
    const { data } = await apiClient.patch<IZoneResponse>(`/zones/${id}`, body);
    return data;
  },

  deactivate: async (id: string) => {
    const { data } = await apiClient.delete<IZoneResponse>(`/zones/${id}`);
    return data;
  },

  activate: async (id: string) => {
    const { data } = await apiClient.post<IZoneResponse>(`/zones/${id}/activate`);
    return data;
  },

  getMembers: async (id: string) => {
    const { data } = await apiClient.get(`/zones/${id}/members`);
    return data;
  },

  getStats: async (id: string) => {
    const { data } = await apiClient.get<IZoneStatsResponse>(`/zones/${id}/stats`);
    return data;
  },

  getIncidents: async (id: string) => {
    const { data } = await apiClient.get(`/zones/${id}/incidents`);
    return data;
  },

  getEvents: async (id: string) => {
    const { data } = await apiClient.get(`/zones/${id}/events`);
    return data;
  },

  getServices: async (id: string) => {
    const { data } = await apiClient.get(`/zones/${id}/services`);
    return data;
  },

  getRequests: async () => {
    const { data } = await apiClient.get<IZoneRequestResponse[]>('/zones/requests');
    return data;
  },

  acceptRequest: async (id: string, commentaire?: string) => {
    const { data } = await apiClient.put<IZoneResponse>(`/zones/requests/${id}/accept`, {
      commentaire,
    });
    return data;
  },

  bulkAcceptRequests: async (body: {
    requestIds: string[];
    nomQuartier: string;
    ville: string;
    polygone: { type: string; coordinates: number[][][] };
    commentaire?: string;
  }) => {
    const { data } = await apiClient.post<IZoneResponse>('/zones/requests/bulk-accept', body);
    return data;
  },

  refuseRequest: async (id: string, commentaire: string) => {
    const { data } = await apiClient.put<IZoneRequestResponse>(`/zones/requests/${id}/refuse`, {
      commentaire,
    });
    return data;
  },

  getMemberships: async () => {
    const { data } = await apiClient.get<IZoneMembershipResponse[]>('/zones/memberships');
    return data;
  },

  acceptMembership: async (id: string) => {
    const { data } = await apiClient.put(`/zones/memberships/${id}/accept`);
    return data;
  },

  refuseMembership: async (id: string, commentaire: string) => {
    const { data } = await apiClient.put(`/zones/memberships/${id}/refuse`, { commentaire });
    return data;
  },
};