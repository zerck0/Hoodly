import { Auth0Provider } from '@auth0/auth0-react';
import type { AppState } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import ProtectedRoute from './components/ProtectedRoute';

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
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

export default function App() {
  return (
    <Router>
      <Auth0ProviderWithNavigate>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </Auth0ProviderWithNavigate>
    </Router>
  );
}
