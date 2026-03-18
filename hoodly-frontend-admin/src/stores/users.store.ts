import { create } from 'zustand';

interface UsersFilters {
  search: string;
  role: string;
  isActive: string;
}

interface UsersState {
  filters: UsersFilters;
  setFilters: (filters: Partial<UsersFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: UsersFilters = {
  search: '',
  role: 'all',
  isActive: 'all',
};

export const useUsersStore = create<UsersState>((set) => ({
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
