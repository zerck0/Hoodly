import { Auth0Provider } from '@auth0/auth0-react';
import type { AppState } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { setTokenGetter } from './lib/axios';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import UsersPage from './pages/users';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ZonesPage from './pages/zones';
import ZoneMapManagement from './pages/zones/ZoneMapManagement';
import MembershipsPage from './pages/zones/memberships';
import { Toaster } from 'sonner';

function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo ?? '/dashboard', { replace: true });
  };
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/dashboard`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      <TokenSetup />
      {children}
    </Auth0Provider>
  );
}

function TokenSetup() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(async () => await getAccessTokenSilently());
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return null;
}

export default function App() {
  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/zones"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ZonesPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/zones/map"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ZoneMapManagement />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/zones/memberships"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <MembershipsPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}
