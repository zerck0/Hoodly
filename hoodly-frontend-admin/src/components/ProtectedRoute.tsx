import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading)
    return <LoadingScreen />;
  if (!isAuthenticated)
    return <Navigate to="/login" replace />;
  return <>{children}</>;
}
