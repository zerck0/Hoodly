import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useConversations } from '../hooks/useConversations'
import { useSocket } from '../hooks/useSocket'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { ConversationSidebar } from '../components/messages-page/ConversationSidebar'
import { ChatWindow } from '../components/messages-page/ChatWindow'
import { NeighborSearchModal } from '../components/messages-page/NeighborSearchModal'

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const { socket } = useSocket()
  const [searchParams, setSearchParams] = useSearchParams()

  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const { conversations, isLoadingInbox, startConversation } = useConversations()

  const activeId = searchParams.get('id') || (conversations.length > 0 ? conversations[0]._id : null)

  useEffect(() => {
    if (!socket) return

    socket.emit('getOnlineUsers', {}, (userIds: string[]) => {
      setOnlineUsers(new Set(userIds))
    })

    const handleUserPresence = ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        if (status === 'online') {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    }

    socket.on('userPresence', handleUserPresence)
    return () => {
      socket.off('userPresence', handleUserPresence)
    }
  }, [socket])

  useEffect(() => {
    if (!searchParams.get('id') && conversations.length > 0) {
      setSearchParams({ id: conversations[0]._id })
    }
  }, [conversations, searchParams, setSearchParams])

  const handleStartGeneralChat = async (voisinId: string) => {
    try {
      const conv = await startConversation({ destinataireId: voisinId })
      setShowNewChatModal(false)
      setSearchParams({ id: conv._id })
      toast.success(t('messages.toasts.chatStarted'))
    } catch {
      toast.error(t('messages.toasts.startFailed'))
    }
  }

  const handleSelectConversation = (id: string) => {
    setSearchParams({ id })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f3ed]">
      <ConversationSidebar
        conversations={conversations}
        isLoadingInbox={isLoadingInbox}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onlineUsers={onlineUsers}
        onOpenSearchModal={() => setShowNewChatModal(true)}
        currentUserEmail={user?.email}
      />

      <ChatWindow
        activeId={activeId}
        currentUser={user}
        onlineUsers={onlineUsers}
        conversations={conversations}
      />

      <NeighborSearchModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartConversation={handleStartGeneralChat}
      />
    </div>
  )
}
