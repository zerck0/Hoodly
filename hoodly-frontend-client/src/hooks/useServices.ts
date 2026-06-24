import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../services/api/services'
import type { GetServicesParams } from '../services/api/services'
import type { CreateServiceDto } from '../types/service.types'

export function useServices(params: GetServicesParams = {}) {
  const queryClient = useQueryClient()

  const servicesQuery = useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const { data } = await servicesApi.getAll(params)
      return data
    },
    staleTime: 1000 * 30,
  })

  const createMutation = useMutation({
    mutationFn: async (newService: CreateServiceDto) => {
      const { data } = await servicesApi.create(newService)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const accepterMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: { responderId?: string } }) => {
      const { data } = await servicesApi.accepter(id, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const terminerMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: { conversationId?: string } }) => {
      const { data } = await servicesApi.terminer(id, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const refuseMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { responderId: string } }) => {
      const { data } = await servicesApi.refuser(id, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const demarrerMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: { conversationId?: string } }) => {
      const { data } = await servicesApi.demarrer(id, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const validerMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body?: { conversationId?: string } }) => {
      const { data } = await servicesApi.valider(id, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })

  return {
    services: servicesQuery.data?.services || [],
    pagination: {
      total: servicesQuery.data?.total || 0,
      page: servicesQuery.data?.page || 1,
      limit: servicesQuery.data?.limit || 12,
      totalPages: servicesQuery.data?.totalPages || 1,
    },
    isLoading: servicesQuery.isLoading,
    isError: servicesQuery.isError,
    isFetching: servicesQuery.isFetching,
    refetch: servicesQuery.refetch,
    createService: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    accepterService: accepterMutation.mutateAsync,
    isAccepting: accepterMutation.isPending,
    terminerService: terminerMutation.mutateAsync,
    isCompleting: terminerMutation.isPending,
    refuserService: refuseMutation.mutateAsync,
    isRefusing: refuseMutation.isPending,
    demarrerService: demarrerMutation.mutateAsync,
    isStarting: demarrerMutation.isPending,
    validerService: validerMutation.mutateAsync,
    isValidating: validerMutation.isPending,
  }
}

