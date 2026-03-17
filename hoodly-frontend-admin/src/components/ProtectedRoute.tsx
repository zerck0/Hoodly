import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

// Wrapper de route protégée
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400 text-sm">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
