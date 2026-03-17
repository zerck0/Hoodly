import type { IUserResponse } from '../../types/user.types';

const API_URL = import.meta.env.VITE_API_URL as string;

export async function syncUser(token: string): Promise<IUserResponse> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok)
    throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<IUserResponse>;
}
