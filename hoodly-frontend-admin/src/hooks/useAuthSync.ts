import { useAuth0 } from '@auth0/auth0-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { syncUser } from '../services/api/auth';
import { useAuthStore } from '../stores/auth.store';

// Synchronise le user Auth0 avec MongoDB via TanStack Query
export function useAuthSync() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const setDbUser = useAuthStore((s) => s.setDbUser);

  const query = useQuery({
    queryKey: ['auth-sync'],
    queryFn: async () => {
      const token = await getAccessTokenSilently();
      return syncUser(token);
    },
    // N'exécute la requête que si l'utilisateur est authentifié
    enabled: isAuthenticated && !isLoading,
    // Pas de retry agressif — une seule tentative suffit au login
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Synchronise le résultat dans le store Zustand
  useEffect(() => {
    if (query.data) setDbUser(query.data);
  }, [query.data, setDbUser]);

  return {
    user: query.data ?? null,
    syncing: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
