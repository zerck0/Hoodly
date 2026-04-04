import { create } from 'zustand'

interface AuthState {
  user: { id: string; email: string; name?: string; role: string } | null
  setUser: (user: AuthState['user']) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
