export interface IUserResponse {
  id: string;
  auth0Id: string;
  email: string;
  name?: string;
  picture?: string;
  role: 'user' | 'moderator' | 'admin';
}
