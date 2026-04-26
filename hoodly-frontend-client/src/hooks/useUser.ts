import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api/auth'
import { useAuthStore } from '../stores/auth.store'

export function useUser() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  const profileQuery = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await authApi.getMe()
      setUser(data)
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const refreshProfile = () => {
    return queryClient.invalidateQueries({ queryKey: ['user-profile'] })
  }

  return {
    user: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    isRefreshing: profileQuery.isFetching,
    refreshProfile,
  }
}
