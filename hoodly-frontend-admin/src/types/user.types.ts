export interface IUserResponse {
  id: string;
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
  role: 'user' | 'moderator' | 'admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUsersListResponse {
  users: IUserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUpdateUserDto {
  role?: 'user' | 'moderator' | 'admin';
  isActive?: boolean;
}
