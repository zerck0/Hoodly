import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth.store'
import { ZoneMembershipStatus } from '../../types/status.enum'
import { toast } from 'sonner'

export default function VerifiedRouteGuard() {
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE

  useEffect(() => {
    if (user && !isVerified) {
      toast.error(
        "Accès restreint : Veuillez d'abord faire vérifier votre compte avec vos justificatifs de domicile et d'identité.",
        {
          id: 'unverified-access-error',
          duration: 5000,
        }
      )
    }
  }, [user, isVerified])

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!isVerified) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
