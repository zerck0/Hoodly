import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthStore } from '../stores/auth.store'
import { authApi } from '../services/api/auth'

export function useAuthSync() {
  const { isAuthenticated, isLoading } = useAuth0()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const setIsSyncing = useAuthStore((state) => state.setIsSyncing)

  useEffect(() => {
    if (isLoading) return

    const fetchProfile = async () => {
      if (isAuthenticated) {
        if (!user) {
          try {
            const { data } = await authApi.getMe()
            setUser(data)
          } catch (err) {
            console.error('Erreur sync profil:', err)
            setIsSyncing(false)
          }
        } else {
          setIsSyncing(false)
        }
      } else {
        const timer = setTimeout(() => {
          setIsSyncing(false)
        }, 500)
        return () => clearTimeout(timer)
      }
    }

    fetchProfile()
  }, [isAuthenticated, isLoading, user, setUser, setIsSyncing])
}
