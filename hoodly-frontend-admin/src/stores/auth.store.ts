import { create } from 'zustand';
import type { IUserResponse } from '../types/user.types';

interface AuthState {
  dbUser: IUserResponse | null;
  setDbUser: (user: IUserResponse) => void;
  clearDbUser: () => void;
}

// Store global pour le user MongoDB
export const useAuthStore = create<AuthState>((set) => ({
  dbUser: null,
  setDbUser: (user) => set({ dbUser: user }),
  clearDbUser: () => set({ dbUser: null }),
}));
