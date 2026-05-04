import { Routes, Route } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import LandingPage from './pages/LandingPage'
import CallbackPage from './pages/CallbackPage'
import OnboardingPage from './pages/OnboardingPage'
import WaitingPage from './pages/WaitingPage'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/shared/AppLayout'
import ProtectedRoute from './components/shared/ProtectedRoute'
import OnboardingGuard from './components/shared/OnboardingGuard'
import DashboardGuard from './components/shared/DashboardGuard'
import { useAuthSync } from './hooks/useAuthSync'

function App() {
  useAuthSync()
  const { loginWithRedirect } = useAuth0()

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLogin={() => loginWithRedirect()} />} />
      <Route path="/callback" element={<CallbackPage />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <OnboardingPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/waiting"
        element={
          <ProtectedRoute>
            <WaitingPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardGuard>
              <AppLayout />
            </DashboardGuard>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
