/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { MessageSquarePlus, Search, HeartHandshake, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'

const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string }> = {
  Jardinage: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-700', border: 'border-l-4 border-l-emerald-500' },
  Bricolage: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-700', border: 'border-l-4 border-l-amber-500' },
  Cours: { bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-700', border: 'border-l-4 border-l-blue-500' },
  Garde: { bg: 'bg-rose-50 text-rose-700 border-rose-100', text: 'text-rose-700', border: 'border-l-4 border-l-rose-500' },
  Courses: { bg: 'bg-teal-50 text-teal-700 border-teal-100', text: 'text-teal-700', border: 'border-l-4 border-l-teal-500' },
  Animaux: { bg: 'bg-purple-50 text-purple-700 border-purple-100', text: 'text-purple-700', border: 'border-l-4 border-l-purple-500' }
}

interface ConversationSidebarProps {
  conversations: any[]
  isLoadingInbox: boolean
  activeId: string | null
  onSelectConversation: (id: string) => void
  onlineUsers: Set<string>
  onOpenSearchModal: () => void
  currentUserEmail?: string
}

export function ConversationSidebar({
  conversations,
  isLoadingInbox,
  activeId,
  onSelectConversation,
  onlineUsers,
  onOpenSearchModal,
  currentUserEmail
}: ConversationSidebarProps) {
  const [inboxSearch, setInboxSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'general'>('all')

  const getOtherParticipant = (conv: any) => {
    return conv.participants.find((p: any) => p.email !== currentUserEmail)
  }

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = getOtherParticipant(conv)
    const matchesSearch = otherParticipant?.name?.toLowerCase().includes(inboxSearch.toLowerCase()) ?? true
    if (!matchesSearch) return false

    if (activeTab === 'services') {
      return !!conv.serviceId
    }
    if (activeTab === 'general') {
      return !conv.serviceId
    }
    return true
  })

  return (
    <div className="w-80 shrink-0 border-r border-gray-200 bg-[#fefefa] flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Discussions
          </h2>
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="h-8 w-8 rounded-full bg-gray-50 hover:bg-[#e9eaf6] text-gray-500 hover:text-[#2c308e] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-98 border border-gray-200/40"
            title="Nouvelle discussion générale"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder="Rechercher un voisin..."
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all"
          />
        </div>

        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-[#2c308e] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white text-[#2c308e] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-[#2c308e] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Général
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingInbox ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400 space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-50/50 flex items-center justify-center text-[#2c308e] border border-indigo-100/50">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {activeTab === 'general' ? 'Aucune discussion générale' : activeTab === 'services' ? 'Aucun service en cours' : 'Aucune discussion'}
              </p>
              <p className="text-[10px] mt-1 text-gray-400 max-w-[200px] mx-auto leading-relaxed font-light">
                {activeTab === 'general'
                  ? "Vous n'avez pas encore de conversation générale avec vos voisins."
                  : activeTab === 'services'
                  ? "Aucune discussion liée à un service n'a été commencée."
                  : "Lancez une discussion en proposant ou acceptant un service !"}
              </p>
            </div>
            {activeTab === 'general' && (
              <Button
                type="button"
                onClick={onOpenSearchModal}
                className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white text-[10px] font-bold rounded-xl px-4 py-2 shadow-sm cursor-pointer transition-all hover:scale-102 active:scale-98"
              >
                Faire connaissance avec un voisin
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv)
            const isSelected = activeId === conv._id
            const hasServiceLink = !!conv.serviceId
            const categoryStyle = hasServiceLink && conv.serviceId ? CATEGORY_STYLES[conv.serviceId.categorie] : null

            return (
              <button
                key={conv._id}
                type="button"
                onClick={() => onSelectConversation(conv._id)}
                className={`flex w-full items-center gap-3 p-3 transition-all text-left outline-none cursor-pointer ${
                  categoryStyle ? `${categoryStyle.border} rounded-r-2xl rounded-l-none` : 'rounded-2xl'
                } ${
                  isSelected
                    ? 'bg-[#e9eaf6] text-gray-900 shadow-xs'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={other?.picture} alt={other?.name} />
                    <AvatarFallback className="bg-[#2c308e] text-white font-bold text-sm">
                      {other?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {other && (
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      onlineUsers.has(other.id || other._id) ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {other?.name || 'Voisin'}
                    </p>
                    <p className="text-[9px] text-gray-400 shrink-0">
                      {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 justify-between">
                    <p className="text-[11px] text-gray-500 truncate leading-relaxed">
                      {conv.serviceId ? `Entraide : ${conv.serviceId.titre}` : 'Discussion générale'}
                    </p>
                    {hasServiceLink && conv.serviceId && categoryStyle && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${categoryStyle.bg}`}>
                        {conv.serviceId.categorie}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
