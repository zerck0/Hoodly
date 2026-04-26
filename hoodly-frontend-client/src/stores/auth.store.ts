import { create } from 'zustand'
import type { User } from '../types/user.types'

interface AuthState {
  user: User | null
  isSyncing: boolean
  setUser: (user: User) => void
  setIsSyncing: (syncing: boolean) => void
  updateUser: (updates: Partial<User>) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSyncing: true,
  setUser: (user) => set({ user, isSyncing: false }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  clearUser: () => set({ user: null, isSyncing: false }),
}))
