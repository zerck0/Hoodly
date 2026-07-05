import { useState, useEffect, useRef } from 'react'
import { MessageSquarePlus, Search, HeartHandshake, Loader2, PartyPopper, Trash2, ArchiveRestore } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const [inboxSearch, setInboxSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'events' | 'general' | 'archived'>('all')
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hoodly_archived_convs') || '[]')
    } catch {
      return []
    }
  })

  const prevActiveId = useRef(activeId)

  useEffect(() => {
    if (activeId && activeId !== prevActiveId.current) {
      if (archivedIds.includes(activeId)) {
        const updated = archivedIds.filter(id => id !== activeId)
        setArchivedIds(updated)
        localStorage.setItem('hoodly_archived_convs', JSON.stringify(updated))
      }
    }
    prevActiveId.current = activeId
  }, [activeId, archivedIds])

  const getOtherParticipant = (conv: any) => {
    return conv.participants.find((p: any) => p.email !== currentUserEmail)
  }

  const handleArchive = (id: string) => {
    if (window.confirm(t('messages.sidebar.confirmArchive', 'Voulez-vous masquer cette discussion de votre boîte de réception ?'))) {
      let nextSelectedId = ''
      if (activeId === id) {
        const currentIndex = filteredConversations.findIndex((c) => c._id === id)
        if (currentIndex !== -1) {
          if (filteredConversations[currentIndex + 1]) {
            nextSelectedId = filteredConversations[currentIndex + 1]._id
          } else if (filteredConversations[currentIndex - 1]) {
            nextSelectedId = filteredConversations[currentIndex - 1]._id
          }
        }
      }

      const updated = [...archivedIds, id]
      setArchivedIds(updated)
      localStorage.setItem('hoodly_archived_convs', JSON.stringify(updated))
      toast.success(t('messages.sidebar.archiveSuccess', "Discussion masquée. Vous pouvez la retrouver dans l'onglet 'Masqués'."))
      
      if (activeId === id) {
        onSelectConversation(nextSelectedId)
      }
    }
  }

  const handleUnarchive = (id: string) => {
    const updated = archivedIds.filter((item) => item !== id)
    setArchivedIds(updated)
    localStorage.setItem('hoodly_archived_convs', JSON.stringify(updated))
    toast.success(t('messages.sidebar.unarchiveSuccess', "Discussion restaurée dans votre boîte de réception !"))
  }

  const filteredConversations = conversations.filter((conv) => {
    const isArchived = archivedIds.includes(conv._id)
    if (activeTab === 'archived') {
      if (!isArchived) return false
    } else {
      if (isArchived) return false
    }

    const otherParticipant = getOtherParticipant(conv)
    const matchesSearch = otherParticipant?.name?.toLowerCase().includes(inboxSearch.toLowerCase()) ?? true
    if (!matchesSearch) return false

    if (activeTab === 'services') {
      return !!conv.serviceId
    }
    if (activeTab === 'events') {
      return !!conv.eventId
    }
    if (activeTab === 'general') {
      return !conv.serviceId && !conv.eventId
    }
    return true
  })

  return (
    <div className="w-80 shrink-0 border-r border-gray-200 bg-[#fefefa] flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('messages.sidebar.title', 'Discussions')}
          </h2>
          <div className="flex items-center gap-1.5">
            {archivedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'archived' ? 'all' : 'archived')}
                className={`h-8 px-2.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                  activeTab === 'archived'
                    ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-2xs scale-105'
                    : 'bg-gray-50 border-gray-200/40 hover:bg-[#e9eaf6] text-gray-500 hover:text-[#2c308e]'
                }`}
                title={activeTab === 'archived' ? t('messages.sidebar.backToChats', 'Retour aux discussions') : t('messages.sidebar.viewHiddenChats', 'Voir les discussions masquées')}
              >
                <ArchiveRestore className="h-4 w-4" />
                <span className="text-[10px]">{archivedIds.length}</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="h-8 w-8 rounded-full bg-gray-50 hover:bg-[#e9eaf6] text-gray-500 hover:text-[#2c308e] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-98 border border-gray-200/40"
              title={t('messages.sidebar.newChatTooltip', 'Nouvelle discussion générale')}
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder={t('messages.sidebar.searchPlaceholder', 'Rechercher un voisin...')}
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all"
          />
        </div>

        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/50">
          {[
            { id: 'all', label: t('messages.sidebar.tabs.all', 'Tous') },
            { id: 'services', label: t('messages.sidebar.tabs.services', 'Services') },
            { id: 'events', label: t('messages.sidebar.tabs.events', 'Événements') },
            { id: 'general', label: t('messages.sidebar.tabs.general', 'Général') }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 text-[9px] font-extrabold py-1 px-1 rounded-md transition-all uppercase tracking-wider text-center cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#2c308e] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
                {activeTab === 'general'
                  ? t('messages.sidebar.empty.noGeneralTitle', 'Aucune discussion générale')
                  : activeTab === 'services'
                  ? t('messages.sidebar.empty.noServicesTitle', 'Aucun service en cours')
                  : activeTab === 'events'
                  ? t('messages.sidebar.empty.noEventsTitle', 'Aucun événement en cours')
                  : activeTab === 'archived'
                  ? t('messages.sidebar.empty.noArchivedTitle', 'Aucune discussion masquée')
                  : t('messages.sidebar.empty.noChatsTitle', 'Aucune discussion')}
              </p>
              <p className="text-[10px] mt-1 text-gray-400 max-w-[200px] mx-auto leading-relaxed font-light">
                {activeTab === 'general'
                  ? t('messages.sidebar.empty.noGeneralDesc', "Vous n'avez pas encore de conversation générale directe avec vos voisins.")
                  : activeTab === 'services'
                  ? t('messages.sidebar.empty.noServicesDesc', "Aucune discussion liée à un service n'a été commencée.")
                  : activeTab === 'events'
                  ? t('messages.sidebar.empty.noEventsDesc', "Vous n'avez pas de discussion de groupe pour des événements.")
                  : activeTab === 'archived'
                  ? t('messages.sidebar.empty.noArchivedDesc', "Vous n'avez masqué aucune discussion pour le moment.")
                  : t('messages.sidebar.empty.noChatsDesc', "Lancez une discussion en proposant ou acceptant un service !")}
              </p>
            </div>
            {activeTab === 'general' && (
              <Button
                type="button"
                onClick={onOpenSearchModal}
                className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white text-[10px] font-bold rounded-xl px-4 py-2 shadow-sm cursor-pointer transition-all hover:scale-102 active:scale-98"
              >
                {t('messages.sidebar.empty.btnFindNeighbor', 'Faire connaissance avec un voisin')}
              </Button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = !!conv.eventId
            const other = isGroup ? null : getOtherParticipant(conv)
            const isSelected = activeId === conv._id
            const hasServiceLink = !!conv.serviceId
            const categoryStyle = hasServiceLink && conv.serviceId ? CATEGORY_STYLES[conv.serviceId.categorie] : null

             return (
              <div key={conv._id} className="relative group">
                <button
                   type="button"
                   onClick={() => onSelectConversation(conv._id)}
                   className={`flex w-full items-center gap-3 p-3 transition-all text-left outline-none cursor-pointer ${
                     isGroup ? 'border-l-4 border-l-[#2c308e] rounded-r-2xl rounded-l-none' :
                     categoryStyle ? `${categoryStyle.border} rounded-r-2xl rounded-l-none` : 'rounded-2xl'
                   } ${
                     isSelected
                       ? 'bg-[#e9eaf6] text-gray-900 shadow-xs'
                       : 'hover:bg-gray-50 text-gray-600'
                   }`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? (
                      <div className="h-10 w-10 rounded-full bg-[#e9eaf6] border border-[#2c308e]/20 flex items-center justify-center">
                        <PartyPopper className="h-5 w-5 text-[#2c308e]" />
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {isGroup ? (conv.nom || t('messages.sidebar.eventFallback', 'Événement')) : (other?.name || t('messages.sidebar.neighborFallback', 'Voisin'))}
                      </p>
                      <p className="text-[9px] text-gray-400 shrink-0">
                        {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 justify-between">
                      <p className="text-[11px] text-gray-500 truncate leading-relaxed">
                        {isGroup
                          ? t('messages.sidebar.groupParticipantsCount', { count: conv.participants.length, defaultValue: `Groupe · ${conv.participants.length} participants` })
                          : conv.serviceId 
                            ? t('messages.sidebar.servicePrefix', { title: conv.serviceId.titre, defaultValue: `Entraide : ${conv.serviceId.titre}` }) 
                            : t('messages.sidebar.generalChat', 'Discussion générale')}
                      </p>
                      {isGroup && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border bg-[#e9eaf6] text-[#2c308e] border-[#2c308e]/20">
                          {t('messages.sidebar.eventBadge', 'Événement')}
                        </span>
                      )}
                      {!isGroup && hasServiceLink && conv.serviceId && categoryStyle && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${categoryStyle.bg}`}>
                          {t('categories.' + conv.serviceId.categorie, { defaultValue: conv.serviceId.categorie })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                
                {activeTab === 'archived' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnarchive(conv._id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white border border-gray-150 hover:bg-emerald-50 hover:border-emerald-100 text-gray-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer z-10 mr-1"
                    title={t('messages.sidebar.restoreChatTooltip', 'Restaurer cette discussion')}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleArchive(conv._id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white border border-gray-150 hover:bg-rose-50 hover:border-rose-100 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer z-10 mr-1"
                    title={t('messages.sidebar.hideChatTooltip', 'Masquer cette discussion')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
