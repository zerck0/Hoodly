import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthStore } from '../stores/auth.store'
import api from '../lib/axios'
import { ZoneMembershipStatus } from '../types/status.enum'

function CallbackPage() {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      navigate('/')
      return
    }

    const syncUser = async () => {
      try {
        const token = await getAccessTokenSilently()

        const response = await api.post('/auth/me', {}, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setUser(response.data)

        if (response.data.zoneStatut === ZoneMembershipStatus.ACTIVE) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      } catch {
        setError('Erreur lors de la connexion. Réessayez.')
      }
    }

    syncUser()
  }, [isAuthenticated, isLoading, navigate, setUser, getAccessTokenSilently])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 underline"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg text-gray-500">Connexion en cours...</p>
    </div>
  )
}

export default CallbackPage
