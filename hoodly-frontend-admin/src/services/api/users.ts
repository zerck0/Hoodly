import { apiClient } from '../../lib/axios';
import type {
  IUsersListResponse,
  IUserResponse,
  IUpdateUserDto,
} from '../../types/user.types';

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  zoneStatut?: string;
}

export const usersApi = {
  getAll: async (params: UsersQueryParams = {}) => {
    const { data } = await apiClient.get<IUsersListResponse>('/users', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<IUserResponse>(`/users/${id}`);
    return data;
  },

  update: async (id: string, updates: IUpdateUserDto) => {
    const { data } = await apiClient.patch<IUserResponse>(`/users/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },
};
