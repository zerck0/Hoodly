import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { ZoneMembershipStatus } from '../../types/status.enum'

interface DashboardGuardProps {
  children: React.ReactNode
}

function DashboardGuard({ children }: DashboardGuardProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isSyncing = useAuthStore((state) => state.isSyncing)

  useEffect(() => {
    if (!user || isSyncing) return

    if (
      user.zoneStatut !== ZoneMembershipStatus.ACTIVE &&
      user.zoneStatut !== ZoneMembershipStatus.PENDING_MEMBERSHIP &&
      user.zoneStatut !== ZoneMembershipStatus.VERIF_EN_COURS
    ) {
      navigate('/onboarding')
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

  if (
    user.zoneStatut !== ZoneMembershipStatus.ACTIVE &&
    user.zoneStatut !== ZoneMembershipStatus.PENDING_MEMBERSHIP &&
    user.zoneStatut !== ZoneMembershipStatus.VERIF_EN_COURS
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Redirection...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default DashboardGuard
