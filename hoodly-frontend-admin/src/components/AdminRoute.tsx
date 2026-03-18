import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useAuthSync } from '../hooks/useAuthSync';
import { LoadingScreen } from './LoadingScreen';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();
  const { syncing } = useAuthSync();
  const dbUser = useAuthStore((s) => s.dbUser);

  if (auth0Loading || syncing)
    return <LoadingScreen />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace />;

  if (dbUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
          <p className="text-gray-400 mb-4">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Votre rôle actuel : <span className="font-medium">{dbUser?.role || 'inconnu'}</span>
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
