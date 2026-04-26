import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthStore } from '../../stores/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth0()
  const navigate = useNavigate()
  const isSyncing = useAuthStore((state) => state.isSyncing)

  useEffect(() => {
    if (isLoading || isSyncing) return

    if (!isAuthenticated) {
      console.log('ProtectedRoute: User not authenticated, redirecting to home')
      navigate('/')
    }
  }, [isAuthenticated, isLoading, isSyncing, navigate])

  if (isLoading || isSyncing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ed]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-500 font-medium">Chargement de votre session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Redirection...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
