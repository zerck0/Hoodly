import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'

interface OnboardingGuardProps {
  children: React.ReactNode
}

function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isSyncing = useAuthStore((state) => state.isSyncing)

  useEffect(() => {
    if (!user || isSyncing) return

    if (
      user.zoneStatut === 'actif' || 
      user.zoneStatut === 'en_attente_adh' ||
      user.zoneStatut === 'verif_en_cours'
    ) {
      navigate('/dashboard')
    }
 else if (user.zoneStatut === 'en_attente_zone') {
      navigate('/waiting')
    }
  }, [user, isSyncing, navigate])

  if (isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Chargement...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default OnboardingGuard
