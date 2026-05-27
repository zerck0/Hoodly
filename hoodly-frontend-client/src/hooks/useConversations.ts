/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '../services/api/conversations'
import { useSocket } from './useSocket'

export function useConversations(conversationId?: string) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const inboxQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await conversationsApi.getAll()
      return data
    },
    staleTime: 1000 * 5,
  })

  const detailQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const { data } = await conversationsApi.getById(conversationId)
      return data
    },
    enabled: !!conversationId,
  })

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const { data } = await conversationsApi.getMessages(conversationId)
      return data
    },
    enabled: !!conversationId,
  })

  useEffect(() => {
    if (!socket || !conversationId) return

    socket.emit('joinConversation', { conversationId })

    const handleNewMessage = (message: any) => {
      if (message.conversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldMessages: any[] | undefined) => {
          const existing = oldMessages || []
          if (existing.some((m) => m._id === message._id)) {
            return existing
          }
          return [...existing, message]
        })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      }
    }

    const handleMessageUpdated = (updatedMessage: any) => {
      if (updatedMessage.conversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldMessages: any[] | undefined) => {
          if (!oldMessages) return []
          return oldMessages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
        })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
      }
    }

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['messages', conversationId], (oldMessages: any[] | undefined) => {
        if (!oldMessages) return []
        return oldMessages.filter((m) => m._id !== messageId)
      })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('messageUpdated', handleMessageUpdated)
    socket.on('messageDeleted', handleMessageDeleted)

    return () => {
      socket.emit('leaveConversation', { conversationId })
      socket.off('newMessage', handleNewMessage)
      socket.off('messageUpdated', handleMessageUpdated)
      socket.off('messageDeleted', handleMessageDeleted)
    }
  }, [socket, conversationId, queryClient])

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error('Aucune conversation active')
      const { data } = await conversationsApi.sendMessage(conversationId, content)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const startMutation = useMutation({
    mutationFn: async ({ serviceId, destinataireId }: { serviceId?: string; destinataireId: string }) => {
      const { data } = await conversationsApi.getOrCreate(serviceId, destinataireId)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const proposerMutation = useMutation({
    mutationFn: async ({ id, date, debut, fin }: { id: string; date: string; debut: string; fin: string }) => {
      const { data } = await conversationsApi.proposerCreneau(id, date, debut, fin)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const accepterCreneauMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await conversationsApi.accepterCreneau(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const refuserCreneauMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await conversationsApi.refuserCreneau(id)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      if (!conversationId) throw new Error('Aucune conversation active')
      const { data } = await conversationsApi.editMessage(conversationId, messageId, content)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!conversationId) throw new Error('Aucune conversation active')
      await conversationsApi.deleteMessage(conversationId, messageId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
  })

  return {
    conversations: inboxQuery.data || [],
    isLoadingInbox: inboxQuery.isLoading,

    conversation: detailQuery.data || null,
    isLoadingDetail: detailQuery.isLoading,

    messages: messagesQuery.data || [],
    isLoadingMessages: messagesQuery.isLoading,

    sendMessage: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,

    startConversation: startMutation.mutateAsync,
    isStarting: startMutation.isPending,

    proposerCreneau: proposerMutation.mutateAsync,
    isProposing: proposerMutation.isPending,

    accepterCreneau: accepterCreneauMutation.mutateAsync,
    isAcceptingCreneau: accepterCreneauMutation.isPending,

    refuserCreneau: refuserCreneauMutation.mutateAsync,
    isRefusingCreneau: refuserCreneauMutation.isPending,

    editMessage: editMutation.mutateAsync,
    isEditingMessage: editMutation.isPending,
    deleteMessage: deleteMutation.mutateAsync,
    isDeletingMessage: deleteMutation.isPending,
  }
}
