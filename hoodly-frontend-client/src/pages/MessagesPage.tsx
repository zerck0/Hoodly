/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useConversations } from '../hooks/useConversations'
import { useServices } from '../hooks/useServices'
import { useSocket } from '../hooks/useSocket'
import { usersApi } from '../services/api/user'
import {
  MessageSquare,
  MessageSquarePlus,
  Globe,
  Send,
  Loader2,
  Inbox,
  HeartHandshake,
  Search,
  Calendar,
  X,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { Input } from '../components/ui/input'
import { toast } from 'sonner'
import type { Service } from '../types/service.types'

const CATEGORY_IMAGES: Record<string, string> = {
  Jardinage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600',
  Cours: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
  Bricolage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600',
  Garde: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
  Courses: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
  Animaux: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600'
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1521791136368-1a8b27493fa9?auto=format&fit=crop&q=80&w=600'

const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string }> = {
  Jardinage: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'text-emerald-700', border: 'border-l-4 border-l-emerald-500' },
  Bricolage: { bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-700', border: 'border-l-4 border-l-amber-500' },
  Cours: { bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-700', border: 'border-l-4 border-l-blue-500' },
  Garde: { bg: 'bg-rose-50 text-rose-700 border-rose-100', text: 'text-rose-700', border: 'border-l-4 border-l-rose-500' },
  Courses: { bg: 'bg-teal-50 text-teal-700 border-teal-100', text: 'text-teal-700', border: 'border-l-4 border-l-teal-500' },
  Animaux: { bg: 'bg-purple-50 text-purple-700 border-purple-100', text: 'text-purple-700', border: 'border-l-4 border-l-purple-500' }
}


export default function MessagesPage() {
  const { user } = useUser()
  const { socket } = useSocket()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeIdFromUrl = searchParams.get('id')

  const [inboxSearch, setInboxSearch] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'services' | 'general'>('all')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { conversations, isLoadingInbox } = useConversations()

  const activeId = activeIdFromUrl || (conversations.length > 0 ? conversations[0]._id : null)

  const {
    messages,
    sendMessage,
    conversation: activeConv,
    isLoadingMessages,
    isSending,
    proposerCreneau,
    isProposing,
    accepterCreneau,
    refuserCreneau,
    startConversation,
    editMessage,
    deleteMessage,
  } = useConversations(activeId || undefined)

  const {
    accepterService,
    refuserService,
    demarrerService,
    terminerService,
    validerService
  } = useServices()

  const [showScheduler, setShowScheduler] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchGlobal, setSearchGlobal] = useState(false)
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string; picture?: string; zoneId?: string }[]>([])
  const [isSearchingNeighbors, setIsSearchingNeighbors] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

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
    if (!showNewChatModal) {
      setSearchQuery('')
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingNeighbors(true)
      try {
        const { data } = await usersApi.searchVoisins(searchQuery, searchGlobal)
        setSearchResults(data)
      } catch {
        toast.error('Erreur lors de la recherche des voisins.')
      } finally {
        setIsSearchingNeighbors(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, searchGlobal, showNewChatModal])

  const handleStartGeneralChat = async (voisinId: string) => {
    try {
      const conv = await startConversation({ destinataireId: voisinId })
      setShowNewChatModal(false)
      setSearchParams({ id: conv._id })
      toast.success('Discussion générale démarrée !')
    } catch {
      toast.error('Impossible de démarrer la discussion.')
    }
  }

  const [slotDate, setSlotDate] = useState('')
  const [slotStart, setSlotStart] = useState('')
  const [slotEnd, setSlotEnd] = useState('')

  useEffect(() => {
    setSlotStart('')
    setSlotEnd('')
  }, [slotDate])

  const handleProposeSlot = async () => {
    if (!activeId || !slotDate || !slotStart || !slotEnd) return
    try {
      await proposerCreneau({ id: activeId, date: slotDate, debut: slotStart, fin: slotEnd })
      setShowScheduler(false)
      toast.success('Proposition de rendez-vous envoyée à votre voisin !')
    } catch {
      toast.error('Erreur lors de la soumission de la proposition.')
    }
  }

  const formatDateToYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const parseLocalDateParts = (dateStr: string) => {
    const normalized = dateStr.replace(/\//g, '-')
    const parts = normalized.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) {
      return null
    }

    let year = parts[0]
    let month = parts[1]
    let day = parts[2]

    if (parts[2] >= 1000) {
      year = parts[2]
      day = parts[0]
      month = parts[1]
    }
    if (month > 12) {
      const temp = month
      month = day
      day = temp
    }
    return { year, month, day }
  }

  const getIsDateAvailable = (dateStr: string) => {
    if (!dateStr) return true
    const service = activeConv?.serviceId
    if (!service || service.type !== 'offre' || !service.disponibilites || service.disponibilites.length === 0) {
      return true
    }

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return true

    const dateObj = new Date(parts.year, parts.month - 1, parts.day)
    const dayOfWeek = dateObj.getDay()

    const hasWeekdays = service.disponibilites.some((d: string) => d.startsWith('semaine_'))
    const hasSaturday = service.disponibilites.includes('samedi')
    const hasSunday = service.disponibilites.includes('dimanche')

    if (dayOfWeek === 0) return hasSunday
    if (dayOfWeek === 6) return hasSaturday
    return hasWeekdays
  }

  const getIsTimeSlotValid = (dateStr: string, start: string) => {
    if (!dateStr || !start) return true

    const today = new Date()
    const todayStr = formatDateToYYYYMMDD(today)

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return true

    const propDateStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`

    if (propDateStr < todayStr) {
      return false
    }

    if (propDateStr === todayStr) {
      const [slotH, slotM] = start.split(':').map(Number)
      const currentHours = today.getHours()
      const currentMins = today.getMinutes()

      if (slotH < currentHours || (slotH === currentHours && slotM <= currentMins)) {
        return false
      }
    }
    return true
  }

  const getClashingBooking = (dateStr: string, start: string, end: string) => {
    if (!dateStr || !start || !end || !activeConv) return null

    const service = activeConv.serviceId
    if (!service) return null

    const isCreator = typeof service.createurId === 'object'
      ? (service.createurId._id || service.createurId).toString()
      : service.createurId.toString()

    const visitor = activeConv.participants.find(p => {
      const pid = (p.id || p._id || '').toString()
      return pid && pid !== isCreator
    })
    const visitorId = visitor ? (visitor.id || visitor._id || '').toString() : ''
    const providerId = service.type === 'demande' ? visitorId : isCreator

    if (!providerId) return null

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return null

    return conversations.find(pc => {
      if (pc._id === activeConv._id) return false

      const hasActiveCreneau = pc.creneau && pc.creneau.statut && ['en_attente', 'confirme'].includes(pc.creneau.statut)
      if (!hasActiveCreneau) return false

      const isProviderParticipant = pc.participants.some(p => {
        const pid = (p.id || p._id || p).toString()
        return pid === providerId
      })
      if (!isProviderParticipant) return false

      const d = new Date(pc.creneau!.date)
      if (d.getFullYear() !== parts.year || d.getMonth() !== (parts.month - 1) || d.getDate() !== parts.day) {
        return false
      }

      const start1 = start
      const end1 = end
      const start2 = pc.creneau!.debut
      const end2 = pc.creneau!.fin

      return start1 < end2 && start2 < end1
    })
  }

  const getEndTime = (startTime: string) => {
    if (!startTime) return '00:00'
    const [h, m] = startTime.split(':').map(Number)
    const endH = (h + 1) % 24
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getAvailableTimeSlots = (dateStr: string) => {
    if (!dateStr || !activeConv) return []

    const service = activeConv.serviceId
    if (!service) return []

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return []

    const dateObj = new Date(parts.year, parts.month - 1, parts.day)
    const dayOfWeek = dateObj.getDay()

    const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00']
    const afternoonSlots = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']
    const eveningSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

    if (service.type !== 'offre' || !service.disponibilites || service.disponibilites.length === 0) {
      return [...morningSlots, ...afternoonSlots, ...eveningSlots]
    }

    let slots: string[] = []

    if (dayOfWeek === 6) {
      if (service.disponibilites.includes('samedi')) {
        slots = [...morningSlots, ...afternoonSlots, ...eveningSlots]
      }
    } else if (dayOfWeek === 0) {
      if (service.disponibilites.includes('dimanche')) {
        slots = [...morningSlots, ...afternoonSlots, ...eveningSlots]
      }
    } else {
      if (service.disponibilites.includes('semaine_matin')) {
        slots = [...slots, ...morningSlots]
      }
      if (service.disponibilites.includes('semaine_aprem')) {
        slots = [...slots, ...afternoonSlots]
      }
      if (service.disponibilites.includes('semaine_soir')) {
        slots = [...slots, ...eveningSlots]
      }
      if (slots.length === 0 && service.disponibilites.some((d: string) => d.startsWith('semaine_'))) {
        slots = [...morningSlots, ...afternoonSlots, ...eveningSlots]
      }
    }
    return slots
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!activeIdFromUrl && conversations.length > 0) {
      setSearchParams({ id: conversations[0]._id })
    }
  }, [conversations, activeIdFromUrl, setSearchParams])

  useEffect(() => {
    setNewMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }, [activeId])

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(120, Math.max(44, scrollHeight))}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || isSending || !activeId) return

    try {
      await sendMessage(newMessage)
      setNewMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'
      }
    } catch {
      toast.error('Erreur lors de l\'envoi du message')
    }
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return
    try {
      await editMessage({ messageId, content: editingContent })
      setEditingMessageId(null)
      setEditingContent('')
      toast.success('Message modifié !')
    } catch {
      toast.error('Erreur lors de la modification du message')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce message ?')) return
    try {
      await deleteMessage(messageId)
      toast.success('Message supprimé !')
    } catch {
      toast.error('Erreur lors de la suppression du message')
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipant = conv.participants.find(p => p.email !== user?.email)
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

  const getOtherParticipant = (conv: any) => {
    return conv.participants.find((p: any) => p.email !== user?.email)
  }



  const renderChatBannerActions = (service: Service) => {
    const isCreator = typeof service.createurId === 'object'
      ? service.createurId.email === user?.email
      : service.createurId === user?.id

    const otherParticipant = activeConv?.participants.find(p => p.email !== user?.email)
    const otherId = otherParticipant?.id || otherParticipant?._id || ''

    const isProvider = service.type === 'demande' ? !isCreator : isCreator
    const isClient = service.type === 'demande' ? isCreator : !isCreator

    const prestationStatut = activeConv?.prestationStatut || 'aucun'
    const realisationValidee = activeConv?.realisationValidee || false

    const isOtherRefused = prestationStatut === 'refuse' || service.refusedResponders?.includes(otherId)

    if (isOtherRefused) {
      return (
        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wider shrink-0">
          Refusé
        </span>
      )
    }

    if (prestationStatut === 'aucun') {
      if (isCreator) {
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (otherId) {
                  try {
                    await accepterService({ id: service._id, body: { responderId: otherId } })
                    toast.success('Proposition acceptée !')
                  } catch {
                    toast.error("Erreur lors de l'acceptation.")
                  }
                }
              }}
              className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-lg text-xs"
            >
              Accepter
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (otherId) {
                  try {
                    await refuserService({ id: service._id, body: { responderId: otherId } })
                    toast.success('Candidat refusé.')
                  } catch {
                    toast.error("Erreur lors du refus.")
                  }
                }
              }}
              className="font-bold rounded-lg text-xs"
            >
              Refuser
            </Button>
          </div>
        )
      }

      return (
        <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border uppercase tracking-wider shrink-0">
          En attente de validation
        </span>
      )
    }

    if (prestationStatut === 'valide') {
      if (isProvider) {
        const hasPendingCreneau = activeConv?.creneau && activeConv.creneau.statut === 'en_attente';
        return (
          <Button
            size="sm"
            disabled={hasPendingCreneau}
            onClick={async () => {
              try {
                await demarrerService({ id: service._id, body: { conversationId: activeConv?._id } })
                toast.success('Service démarré avec succès !')
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || "Erreur lors du démarrage."
                toast.error(errMsg)
              }
            }}
            className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-lg text-xs disabled:opacity-50"
          >
            {hasPendingCreneau ? 'En attente de planification' : 'Démarrer le service'}
          </Button>
        )
      }

      return (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 uppercase tracking-wider shrink-0 animate-pulse">
          En attente de démarrage
        </span>
      )
    }

    if (prestationStatut === 'en_cours') {
      if (isProvider) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await terminerService({ id: service._id, body: { conversationId: activeConv?._id } })
                toast.success('Service marqué comme accompli avec succès !')
              } catch {
                toast.error("Erreur lors de la finalisation.")
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
          >
            Marquer comme accompli
          </Button>
        )
      }

      return (
        <span className="text-[10px] font-bold text-[#2c308e] bg-[#e9eaf6] px-3 py-1.5 rounded-lg border border-[#2c308e]/20 uppercase tracking-wider shrink-0 animate-pulse">
          Service en cours de réalisation
        </span>
      )
    }

    if (prestationStatut === 'termine') {
      if (realisationValidee) {
        return (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider shrink-0">
            ✓ Service Clos
          </span>
        )
      }

      if (isClient) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await validerService({ id: service._id, body: { conversationId: activeConv?._id } })
                toast.success('Félicitations, réalisation validée et transaction de points réglée !')
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || "Erreur lors de la validation."
                toast.error(errMsg)
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
          >
            Valider la réalisation
          </Button>
        )
      }

      return (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 uppercase tracking-wider shrink-0 animate-pulse">
          En attente de confirmation du bénéficiaire
        </span>
      )
    }

    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f3ed]">
      <div className="w-80 shrink-0 border-r border-gray-200 bg-[#fefefa] flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Discussions
            </h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="h-8 w-8 rounded-full bg-gray-50 hover:bg-[#e9eaf6] text-gray-500 hover:text-[#2c308e] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95 border border-gray-200/40"
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
              onClick={() => setActiveTab('all')}
              className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center ${
                activeTab === 'all'
                  ? 'bg-white text-[#2c308e] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center ${
                activeTab === 'services'
                  ? 'bg-white text-[#2c308e] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 text-[10px] font-bold py-1 px-2 rounded-md transition-all uppercase tracking-wider text-center ${
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
                  onClick={() => setShowNewChatModal(true)}
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
                  onClick={() => setSearchParams({ id: conv._id })}
                  className={`flex w-full items-center gap-3 p-3 transition-all text-left outline-none ${
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

      <div className="flex-1 flex flex-col h-full bg-[#f8f9fc]">
        {activeConv ? (
          <>
            <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-gray-100">
                  <AvatarImage src={getOtherParticipant(activeConv)?.picture} />
                  <AvatarFallback className="bg-[#2c308e] text-white">
                    {getOtherParticipant(activeConv)?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-snug">
                    {getOtherParticipant(activeConv)?.name}
                  </p>
                  <p className={`text-[10px] flex items-center gap-1.5 font-semibold ${
                    getOtherParticipant(activeConv) && onlineUsers.has(getOtherParticipant(activeConv)!.id || getOtherParticipant(activeConv)!._id)
                      ? 'text-emerald-500'
                      : 'text-gray-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      getOtherParticipant(activeConv) && onlineUsers.has(getOtherParticipant(activeConv)!.id || getOtherParticipant(activeConv)!._id)
                        ? 'bg-emerald-500'
                        : 'bg-gray-400'
                    }`} />
                    {getOtherParticipant(activeConv) && onlineUsers.has(getOtherParticipant(activeConv)!.id || getOtherParticipant(activeConv)!._id)
                      ? 'Voisin connecté'
                      : 'Hors ligne'}
                  </p>
                </div>
              </div>
            </div>

            {activeConv.serviceId && (
              <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0 justify-between shadow-xs z-10 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <img
                    src={activeConv.serviceId.photoUrl || CATEGORY_IMAGES[activeConv.serviceId.categorie] || DEFAULT_IMAGE}
                    alt={activeConv.serviceId.titre}
                    className="h-12 w-12 rounded-xl object-cover border border-gray-200/60 shrink-0 shadow-xs"
                  />
                  <div className="overflow-hidden flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {activeConv.serviceId.titre}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-[10px] font-bold text-[#2c308e]">
                        {activeConv.serviceId.gratuit ? 'Gratuit / Entraide' : `${activeConv.serviceId.points || 0} points`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {renderChatBannerActions(activeConv.serviceId)}
                </div>
              </div>
            )}

            {activeConv.serviceId && activeConv.creneau && activeConv.creneau.statut !== 'annule' && (() => {
              const isCreator = typeof activeConv.serviceId.createurId === 'object'
                ? activeConv.serviceId.createurId.email === user?.email
                : activeConv.serviceId.createurId === user?.id;

              return (
                <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/30 border border-indigo-100 rounded-2xl flex items-center justify-between shrink-0 shadow-xs animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-[#2c308e] shadow-xs shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-gray-900 leading-snug">
                        {activeConv.creneau.statut === 'en_attente' ? '📅 Proposition de rendez-vous' : '✓ Prestation planifiée'}
                      </h5>
                      <p className="text-[10px] text-gray-500 font-light mt-0.5 leading-normal">
                        Date : <strong>{new Date(activeConv.creneau.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</strong> de <strong>{activeConv.creneau.debut}</strong> à <strong>{activeConv.creneau.fin}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {activeConv.creneau.statut === 'en_attente' ? (
                      (activeConv.serviceId.type === 'demande' ? !isCreator : isCreator) ? (
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            onClick={async () => {
                              try {
                                await accepterCreneau(activeConv._id)
                                toast.success('Rendez-vous validé !')
                              } catch {
                                toast.error('Erreur lors de la validation.')
                              }
                            }}
                            className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-lg text-[10px] px-3 py-1.5 h-auto shadow-xs"
                          >
                            Accepter
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                await refuserCreneau(activeConv._id)
                                toast.success('Rendez-vous décliné.')
                              } catch {
                                toast.error('Erreur lors du refus.')
                              }
                            }}
                            className="font-bold rounded-lg text-[10px] px-3 py-1.5 h-auto"
                          >
                            Décliner
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 uppercase tracking-wider shrink-0 animate-pulse">
                          En attente de réponse du voisin
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider shrink-0">
                        ✓ Confirmé
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 text-gray-300 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                  <HeartHandshake className="h-12 w-12 mb-3 text-gray-300" />
                  <p className="text-xs font-bold text-gray-950">Aucun message pour l'instant</p>
                  <p className="text-[10px] mt-1">Commencez la discussion locale par message.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.system) {
                    return (
                      <div key={msg._id} className="flex justify-center my-4 animate-in fade-in duration-200">
                        <div className="bg-white border border-gray-200/80 text-gray-500 rounded-2xl px-5 py-3 text-[11px] text-center max-w-sm font-semibold shadow-xs leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                    )
                  }

                  const isMe = msg.senderId === user?.id
                  return (
                    <div
                      key={msg._id}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-center gap-2 group animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out`}
                    >
                      {isMe && !msg.system && editingMessageId !== msg._id && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-150 shrink-0 order-first">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessageId(msg._id)
                              setEditingContent(msg.content)
                            }}
                            className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-[#e9eaf6] text-gray-400 hover:text-[#2c308e] flex items-center justify-center transition-all cursor-pointer"
                            title="Modifier le message"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="h-6 w-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title="Supprimer le message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {editingMessageId === msg._id ? (
                        <div className="flex flex-col gap-1.5 p-3 bg-white border border-[#2c308e]/20 rounded-2xl max-w-[70%] shadow-md animate-in zoom-in-95 duration-150">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full min-w-[200px] text-xs p-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#2c308e] resize-none h-16 leading-relaxed"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="text-[9px] font-bold px-2.5 py-1 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(msg._id)}
                              className="text-[9px] font-bold px-2.5 py-1 text-white bg-[#2c308e] hover:bg-[#2c308e]/90 rounded-lg cursor-pointer transition-colors"
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[70%] leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-[#2c308e] text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                          <p className="font-light whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {msg.edited && (
                              <span className={`text-[7px] font-light italic ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                                (modifié)
                              </span>
                            )}
                            <p className={`text-[8px] font-light ${
                              isMe ? 'text-white/60' : 'text-gray-400'
                            }`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white shrink-0 flex gap-2 items-center">
              {activeConv.serviceId && (() => {
                const isCreator = typeof activeConv.serviceId.createurId === 'object'
                  ? activeConv.serviceId.createurId.email === user?.email
                  : activeConv.serviceId.createurId === user?.id;

                const isClient = activeConv.serviceId.type === 'demande' ? isCreator : !isCreator;
                if (!isClient) return null;

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setSlotDate(new Date().toISOString().split('T')[0])
                      setShowScheduler(true)
                    }}
                    className="h-11 w-11 rounded-2xl bg-indigo-50 hover:bg-[#e9eaf6] text-[#2c308e] flex items-center justify-center transition-colors shrink-0"
                    title="Planifier un rendez-vous"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                )
              })()}

              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez un message à votre voisin..."
                disabled={isSending}
                rows={1}
                className="flex-1 rounded-2xl bg-gray-50 border border-gray-200/60 px-4 py-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all disabled:opacity-50 resize-none h-[44px] min-h-[44px] max-h-[120px] overflow-y-auto leading-relaxed"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="h-11 w-11 rounded-2xl bg-[#2c308e] hover:bg-[#2c308e]/95 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-[#2c308e]"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4.5 w-4.5" />
                )}
              </button>
            </form>

            {showScheduler && activeConv && (() => {
              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-200 relative">
                    <button
                      type="button"
                      onClick={() => setShowScheduler(false)}
                      className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        📅 Planifier un rendez-vous
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-light leading-relaxed">
                        Sélectionnez une date puis l'un des horaires proposés ci-dessous. La séance durera par défaut 1 heure.
                      </p>
                    </div>

                    {activeConv.serviceId && activeConv.serviceId!.type === 'offre' && activeConv.serviceId!.disponibilites && activeConv.serviceId!.disponibilites.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1.5 animate-in fade-in duration-200">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Disponibilités indiquées par le voisin :
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeConv.serviceId!.disponibilites.map((d: string) => {
                            let label = ''
                            if (d === 'semaine_matin') label = 'Matin (Semaine : 8h-12h)'
                            if (d === 'semaine_aprem') label = 'Aprem (Semaine : 12h-18h)'
                            if (d === 'semaine_soir') label = 'Soir (Semaine : 18h-22h)'
                            if (d === 'samedi') label = 'Samedi (Toute la journée)'
                            if (d === 'dimanche') label = 'Dimanche (Toute la journée)'
                            return (
                              <span key={d} className="bg-indigo-50 border border-indigo-100 text-[#2c308e] text-[9px] font-bold px-2.5 py-1 rounded-full">
                                {label || d}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Date du rendez-vous
                        </label>
                        <Input
                          type="date"
                          value={slotDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setSlotDate(e.target.value)}
                          className={`h-10 rounded-xl cursor-pointer ${
                            slotDate && !getIsDateAvailable(slotDate)
                              ? 'border-rose-300 focus-visible:ring-rose-500 bg-rose-50/20 text-rose-700'
                              : ''
                          }`}
                        />
                        {slotDate && !getIsDateAvailable(slotDate) && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1.5 leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-100 animate-in fade-in duration-200">
                            ⚠️ Ce voisin propose ses services uniquement :{' '}
                            <strong>
                              {activeConv.serviceId!.disponibilites
                                ?.map((d: string) => {
                                  if (d === 'samedi') return 'le Samedi'
                                  if (d === 'dimanche') return 'le Dimanche'
                                  return 'en Semaine'
                                })
                                .filter((v: string, i: number, self: string[]) => self.indexOf(v) === i)
                                .join(', ')}
                            </strong>
                            . Veuillez choisir un jour correspondant.
                          </p>
                        )}
                      </div>

                      {slotDate && getIsDateAvailable(slotDate) && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Sélectionnez un horaire (séance d'une heure)
                          </label>
                          {getAvailableTimeSlots(slotDate).length === 0 ? (
                            <p className="text-xs text-rose-500 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
                              Aucun créneau disponible pour ce jour.
                            </p>
                          ) : (
                            <>
                              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                                {getAvailableTimeSlots(slotDate).map((time) => {
                                  const isSelected = slotStart === time

                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      onClick={() => {
                                        setSlotStart(time)
                                        setSlotEnd(getEndTime(time))
                                      }}
                                      className={`py-2 px-1 rounded-xl text-center text-[10px] font-bold transition-all border cursor-pointer ${
                                        isSelected
                                          ? "bg-[#2c308e] text-white border-[#2c308e] shadow-sm scale-[1.02]"
                                          : "bg-white text-gray-700 border-gray-200 hover:border-[#2c308e] hover:text-[#2c308e] hover:bg-[#2c308e]/5"
                                      }`}
                                    >
                                      {time}
                                    </button>
                                  )
                                })}
                              </div>

                              {slotStart && slotEnd && (() => {
                                const isValid = getIsTimeSlotValid(slotDate, slotStart)
                                const clash = getClashingBooking(slotDate, slotStart, slotEnd)

                                return (
                                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    {!isValid && (
                                      <p className="text-[10px] text-rose-500 font-bold leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                        ⚠️ L'horaire de début choisi est déjà passé. Veuillez sélectionner un horaire futur.
                                      </p>
                                    )}
                                    {clash && clash.creneau && (
                                      <p className="text-[10px] text-rose-500 font-bold leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                                        ⚠️ Ce créneau horaire chevauche un rendez-vous déjà réservé ou proposé avec ce voisin ({clash.creneau.debut} - {clash.creneau.fin}). Veuillez choisir un autre horaire.
                                      </p>
                                    )}
                                    {isValid && !clash && (
                                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-semibold p-3 rounded-xl flex items-center justify-between">
                                        <span>⏰ Horaire sélectionné :</span>
                                        <strong className="font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-2xs">
                                          {slotStart} - {slotEnd}
                                        </strong>
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowScheduler(false)}
                        className="flex-1 rounded-xl py-5 text-xs font-semibold h-11 cursor-pointer"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleProposeSlot}
                        disabled={
                          isProposing ||
                          !slotDate ||
                          !slotStart ||
                          !slotEnd ||
                          !getIsDateAvailable(slotDate) ||
                          !getIsTimeSlotValid(slotDate, slotStart) ||
                          !!getClashingBooking(slotDate, slotStart, slotEnd)
                        }
                        className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-md h-11 flex items-center justify-center disabled:opacity-50 cursor-pointer"
                      >
                        {isProposing ? 'Envoi...' : 'Proposer'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 mb-4 text-[#2c308e]">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              Vos Discussions de Quartier
            </h3>
            <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed font-light">
              Sélectionnez une discussion dans la boîte de réception à gauche pour commencer à échanger avec un voisin ou organiser des services.
            </p>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowNewChatModal(false)}
              className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                💬 Nouveau message privé
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-light leading-relaxed">
                Trouvez un voisin et commencez à discuter directement avec lui.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="h-11 w-full rounded-2xl bg-gray-50 border border-gray-200 pl-10 pr-4 text-xs outline-none focus:bg-white focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-200/50">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#2c308e]" />
                  <span className="text-xs font-semibold text-gray-700 select-none">
                    Recherche à l'échelle de Woodly
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="searchGlobal"
                  checked={searchGlobal}
                  onChange={(e) => setSearchGlobal(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#2c308e] focus:ring-[#2c308e]/30 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Résultats ({searchResults.length})
                </label>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-sans">
                  {isSearchingNeighbors ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-5 w-5 text-gray-300 animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-gray-50/20 rounded-2xl border border-dashed border-gray-200">
                      <Inbox className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] font-semibold">Aucun voisin trouvé</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Saisissez un nom ou changez de filtre.</p>
                    </div>
                  ) : (
                    searchResults.map((voisin) => (
                      <button
                        key={voisin.id}
                        onClick={() => handleStartGeneralChat(voisin.id)}
                        className="flex w-full items-center gap-3 p-2.5 rounded-2xl hover:bg-[#e9eaf6]/40 border border-transparent hover:border-gray-200/30 transition-all text-left group cursor-pointer"
                      >
                        <Avatar className="h-9 w-9 border border-gray-100 shrink-0">
                          <AvatarImage src={voisin.picture} alt={voisin.name} />
                          <AvatarFallback className="bg-[#2c308e] text-white font-bold text-xs">
                            {voisin.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#2c308e] transition-colors">
                            {voisin.name}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {voisin.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
