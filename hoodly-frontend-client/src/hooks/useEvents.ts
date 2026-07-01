import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../services/api/events'
import type { CreateEventDto } from '../types/event.types'

export function useEvents() {
  const queryClient = useQueryClient()

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await eventsApi.getAll({ limit: 100 })
      return data
    },
    staleTime: 1000 * 30,
  })

  const recommendationsQuery = useQuery({
    queryKey: ['events', 'recommendations'],
    queryFn: async () => {
      const { data } = await eventsApi.getRecommendations()
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation({
    mutationFn: async (dto: CreateEventDto) => {
      const { data } = await eventsApi.create(dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const interetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await eventsApi.toggleInteret(id)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const participerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await eventsApi.participer(id)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const validerMutation = useMutation({
    mutationFn: async ({ id, presentIds }: { id: string; presentIds: string[] }) => {
      const { data } = await eventsApi.valider(id, presentIds)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await eventsApi.delete(id)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  return {
    events: eventsQuery.data?.events ?? [],
    recommendations: recommendationsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    refetch: eventsQuery.refetch,
    createEvent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleInteret: interetMutation.mutateAsync,
    isTogglingInteret: interetMutation.isPending,
    participer: participerMutation.mutateAsync,
    isParticipating: participerMutation.isPending,
    validerEvenement: validerMutation.mutateAsync,
    isValidating: validerMutation.isPending,
    deleteEvent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
