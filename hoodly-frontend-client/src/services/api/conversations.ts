import api from '../../lib/axios'
import type { Conversation, Message } from '../../types/conversation.types'

export const conversationsApi = {
  getOrCreate: (serviceId: string | undefined, destinataireId: string) =>
    api.post<Conversation>('/conversations', { serviceId, destinataireId }),

  getAll: () =>
    api.get<Conversation[]>('/conversations/me'),

  getById: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`),

  getMessages: (id: string) =>
    api.get<Message[]>(`/conversations/${id}/messages`),

  sendMessage: (id: string, content: string) =>
    api.post<Message>(`/conversations/${id}/messages`, { content }),

  editMessage: (id: string, messageId: string, content: string) =>
    api.patch<Message>(`/conversations/${id}/messages/${messageId}`, { content }),

  deleteMessage: (id: string, messageId: string) =>
    api.delete<void>(`/conversations/${id}/messages/${messageId}`),

  proposerCreneau: (id: string, date: string, debut: string, fin: string) =>
    api.patch<Conversation>(`/conversations/${id}/creneau/proposer`, { date, debut, fin }),

  accepterCreneau: (id: string) =>
    api.patch<Conversation>(`/conversations/${id}/creneau/accepter`),

  refuserCreneau: (id: string) =>
    api.patch<Conversation>(`/conversations/${id}/creneau/refuser`),

  annulerPrestation: (id: string) =>
    api.patch<Conversation>(`/conversations/${id}/annuler`),
}
