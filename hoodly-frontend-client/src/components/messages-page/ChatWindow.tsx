/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Send,
  Loader2,
  HeartHandshake,
  MessageSquare,
  Pencil,
  Trash2,
  PartyPopper,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { useConversations } from '../../hooks/useConversations'
import { useServices } from '../../hooks/useServices'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '../../services/api/contracts'
import { documentsApi } from '../../services/api/documents'
import { SchedulerModal } from './SchedulerModal'

const parsePlanificationToCreneau = (planif: string | undefined) => {
  if (!planif) return null

  const singleDayRegex = /Le\s+(\d{2})\/(\d{2})\/(\d{4})\s+de\s+(\d{2}:\d{2})\s+à\s+(\d{2}:\d{2})/i
  const matchSingle = planif.match(singleDayRegex)
  if (matchSingle) {
    const [_, day, month, year, debut, fin] = matchSingle
    return {
      date: `${year}-${month}-${day}`,
      debut,
      fin
    }
  }

  const rangeRegex = /Du\s+(\d{2})\/(\d{2})\/(\d{4})\s+au\s+\d{2}\/\d{2}\/\d{4}\s+de\s+(\d{2}:\d{2})\s+à\s+(\d{2}:\d{2})/i
  const matchRange = planif.match(rangeRegex)
  if (matchRange) {
    const [_, day, month, year, debut, fin] = matchRange
    return {
      date: `${year}-${month}-${day}`,
      debut,
      fin
    }
  }

  const rangeAllDayRegex = /Du\s+(\d{2})\/(\d{2})\/(\d{4})\s+au\s+(\d{2})\/(\d{2})\/(\d{4})\s+\(toute la journée\)/i
  const matchRangeAllDay = planif.match(rangeAllDayRegex)
  if (matchRangeAllDay) {
    const [_, day, month, year] = matchRangeAllDay
    return {
      date: `${year}-${month}-${day}`,
      debut: '09:00',
      fin: '18:00'
    }
  }

  return null
}
import { Badge } from '../ui/badge'

interface ChatWindowProps {
  activeId: string | null
  currentUser: any
  onlineUsers: Set<string>
  conversations: any[]
}

export function ChatWindow({
  activeId,
  currentUser,
  onlineUsers,
  conversations
}: ChatWindowProps) {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    annulerPrestation,
    isCancelling,
    editMessage,
    deleteMessage
  } = useConversations(activeId as string)

  const contractId = activeConv && typeof activeConv.serviceId === 'object' ? activeConv.serviceId?.contractId : undefined

  const { data: contract } = useQuery({
    queryKey: ['contract-detail', contractId],
    queryFn: async () => {
      if (!contractId) return null
      const { data } = await contractsApi.getOne(contractId)
      return data
    },
    enabled: !!contractId,
  })

  const {
    accepterService,
    demarrerService,
    terminerService,
    validerService
  } = useServices()

  const queryClient = useQueryClient()
  const [downloading, setDownloading] = useState(false)

  const handleDownloadContract = async () => {
    const signedDocId = contract?.signedDocumentId?._id || contract?.signedDocumentId
    if (!signedDocId) return
    try {
      setDownloading(true)
      const response = await documentsApi.downloadPdf(signedDocId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const titre = activeConv?.serviceId && typeof activeConv.serviceId === 'object' ? activeConv.serviceId.titre : 'service'
      link.setAttribute('download', `contrat_final_${titre.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Téléchargement du contrat PDF signé démarré !')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du téléchargement du contrat PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const [newMessage, setNewMessage] = useState('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [showParticipants, setShowParticipants] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setNewMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }, [activeId])

  if (!activeId || !activeConv) {
    return (
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
    )
  }

  const isGroup = !!activeConv.eventId
  const otherParticipant = isGroup ? null : activeConv.participants.find((p: any) => p.email !== currentUser?.email)
  const isOnline = otherParticipant ? onlineUsers.has(otherParticipant.id || otherParticipant._id || '') : false

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
      handleSend()
    }
  }

  const handleSend = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || isSending || !activeId) return

    try {
      await sendMessage(newMessage)
      setNewMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'
      }
    } catch {
      toast.error("Erreur lors de l'envoi du message")
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



  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfbfa]">
      <div className="p-4 border-b border-gray-100 bg-[#fefefa] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <div className="h-10 w-10 rounded-full bg-[#e9eaf6] border border-[#2c308e]/20 flex items-center justify-center shrink-0">
              <PartyPopper className="h-5 w-5 text-[#2c308e]" />
            </div>
          ) : (
            <Avatar className="h-10 w-10 border border-gray-100 shrink-0">
              <AvatarImage src={otherParticipant?.picture} alt={otherParticipant?.name} />
              <AvatarFallback className="bg-[#2c308e] text-white font-bold text-sm">
                {otherParticipant?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">
              {isGroup ? (activeConv.nom || 'Événement') : (otherParticipant?.name || 'Voisin')}
            </h3>
            {isGroup ? (
              <button
                type="button"
                onClick={() => setShowParticipants((v) => !v)}
                className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-[#2c308e] transition-colors cursor-pointer"
              >
                {activeConv.participants.length} participant{activeConv.participants.length > 1 ? 's' : ''}
                {showParticipants ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            ) : (
              <p className="text-[10px] font-semibold text-gray-400">
                <span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {isGroup && showParticipants && (
        <div className="bg-[#fafafa] border-b border-gray-100 px-4 py-3 shrink-0 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">Participants</p>
          <div className="flex flex-wrap gap-2">
            {activeConv.participants.map((p: any) => (
              <div key={p._id || p.id} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-2 py-1 shadow-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={p.picture} alt={p.name} />
                  <AvatarFallback className="bg-[#2c308e] text-white text-[7px] font-bold">
                    {p.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-semibold text-gray-700">{p.name}</span>
                {(p._id || p.id) === currentUser?.id && (
                  <span className="text-[8px] font-bold text-[#2c308e]">· Vous</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(() => {
        const service = activeConv.serviceId
        if (!service) return null

        const isPaid = service && (service.points || 0) > 0 && !service.gratuit
        const isCreator = typeof service.createurId === 'object'
          ? service.createurId.email === currentUser?.email
          : service.createurId === currentUser?.id

        const otherId = otherParticipant?.id || otherParticipant?._id || ''
        const isProvider = service.type === 'demande' ? !isCreator : isCreator
        const isClient = service.type === 'demande' ? isCreator : !isCreator

        let currentStep = 1
        if (activeConv.prestationStatut === 'aucun' || !activeConv.prestationStatut) {
          if (isPaid && contract) {
            currentStep = 3
          } else {
            currentStep = 1
          }
        } else if (activeConv.prestationStatut === 'valide') {
          if (!activeConv.creneau || activeConv.creneau.statut !== 'confirme') {
            currentStep = 2
          } else if (isPaid && contract && contract.status === 'pending') {
            currentStep = 3
          } else {
            currentStep = 4
          }
        } else if (activeConv.prestationStatut === 'en_cours') {
          currentStep = 4
        } else if (activeConv.prestationStatut === 'termine') {
          if (isPaid && contract && contract.status === 'completed') {
            currentStep = 6
          } else if (!isPaid && activeConv.realisationValidee) {
            currentStep = 6
          } else {
            currentStep = 5
          }
        } else if (activeConv.prestationStatut === 'refuse') {
          currentStep = 7
        }

        if (contract && contract.status === 'completed') {
          currentStep = 6
        }

        if (contract && contract.status === 'cancelled') {
          currentStep = 7
        }

        let cardTitle = ''
        let cardDescription = ''
        let cardIcon = null
        let primaryAction = null
        let secondaryAction = null

        const rdvDateStr = activeConv.creneau?.date
          ? new Date(activeConv.creneau.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })
          : ''
        const rdvTimeStr = activeConv.creneau?.debut && activeConv.creneau?.fin
          ? `de ${activeConv.creneau.debut} à ${activeConv.creneau.fin}`
          : ''

        switch (currentStep) {
          case 1:
            if (service.type === 'offre') {
              cardTitle = "Demande d'entraide"
              cardDescription = !isCreator
                ? "Sollicitez cette offre d'aide pour ouvrir l'agenda et planifier les détails."
                : "En attente qu'un voisin sollicite votre offre d'aide."
            } else {
              cardTitle = "Proposition d'aide"
              cardDescription = !isCreator
                ? "Proposez votre aide pour ce service pour ouvrir l'agenda et planifier les détails."
                : "En attente qu'un voisin se propose pour vous aider."
            }
            cardIcon = <HeartHandshake className="h-5 w-5 text-[#2c308e]" />
            if (!isCreator) {
              primaryAction = (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const responderId = currentUser?.id || currentUser?._id || ''
                      await accepterService({ id: service._id, body: { responderId } })
                      queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                      toast.success(
                        service.type === 'offre'
                          ? "Vous avez sollicité cette offre d'aide ! L'agenda est ouvert."
                          : "Vous avez proposé votre aide ! L'agenda est ouvert."
                      )
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Erreur de validation.")
                    }
                  }}
                  className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-xs rounded-xl"
                >
                  {service.type === 'offre' ? 'Accepter cette offre d’aide' : 'Se proposer pour ce service'}
                </Button>
              )
            }
            break

          case 2:
            cardTitle = "Planification du rendez-vous"
            cardIcon = <Calendar className="h-5 w-5 text-amber-500" />
            if (activeConv.creneau?.statut === 'en_attente') {
              const iProposed = activeConv.creneau.proposeurId === currentUser?.id
              if (iProposed) {
                cardDescription = `Rendez-vous proposé le ${rdvDateStr} ${rdvTimeStr}. En attente de confirmation de votre voisin.`
              } else {
                cardDescription = `Votre voisin propose un rendez-vous le ${rdvDateStr} ${rdvTimeStr}.`
                primaryAction = (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await accepterCreneau(activeConv._id)
                        queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                        toast.success('Rendez-vous planifié et confirmé !')
                      } catch {
                        toast.error('Erreur lors de la confirmation.')
                      }
                    }}
                    className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-xs rounded-xl"
                  >
                    Accepter
                  </Button>
                )
                secondaryAction = (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await refuserCreneau(activeConv._id)
                        queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                        toast.success('Proposition déclinée.')
                      } catch {
                        toast.error('Erreur lors du refus.')
                      }
                    }}
                    className="border-gray-200 text-gray-500 font-bold text-xs rounded-xl hover:bg-gray-50"
                  >
                    Refuser
                  </Button>
                )
              }
            } else {
              const parsedCreneau = parsePlanificationToCreneau(service.datePlanification)
              if (service.type === 'demande' && parsedCreneau) {
                cardDescription = `L'auteur de la demande a fixé le rendez-vous pour le : ${service.datePlanification}.`
                primaryAction = (
                  <Button
                    size="sm"
                    disabled={isProposing}
                    onClick={async () => {
                      try {
                        await proposerCreneau({
                          id: activeConv._id,
                          date: parsedCreneau.date,
                          debut: parsedCreneau.debut,
                          fin: parsedCreneau.fin
                        })
                        queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                        toast.success("Horaire de la demande validé avec succès !")
                      } catch {
                        toast.error("Erreur lors de la validation de l'horaire.")
                      }
                    }}
                    className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Valider cet horaire
                  </Button>
                )
              } else {
                cardDescription = "Proposez un créneau horaire dans l'agenda pour planifier la réalisation."
                primaryAction = (
                  <Button
                    size="sm"
                    onClick={() => setShowScheduler(true)}
                    className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Calendar className="h-4 w-4" />
                    Planifier
                  </Button>
                )
              }
            }
            break

          case 3:
            cardTitle = "Signature du contrat requise"
            cardIcon = <FileText className="h-5 w-5 text-indigo-500" />
            if (contract) {
              const clientSigned = contract.clientSignature.signed
              const providerSigned = contract.providerSignature.signed
              const iHaveSigned = isClient ? clientSigned : isProvider ? providerSigned : true

              cardDescription = `Rendez-vous confirmé. Veuillez signer le contrat pour sécuriser les ${service.points || 0} points dans la cagnotte.`

              if (!iHaveSigned) {
                primaryAction = (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/contrats/${contract._id}?fromChat=${activeConv._id}`)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl animate-pulse"
                  >
                    Signer le contrat
                  </Button>
                )
              }

              secondaryAction = (
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className={`px-2 py-0.5 rounded-full border ${clientSigned ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    Client : {clientSigned ? '✓ Signé' : '⏳ Attente'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border ${providerSigned ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    Prestataire : {providerSigned ? '✓ Signé' : '⏳ Attente'}
                  </span>
                </div>
              )
            }
            break

          case 4:
            cardTitle = isPaid ? "Cagnotte sécurisée active" : "Rendez-vous confirmé"
            cardIcon = <ShieldCheck className="h-5 w-5 text-emerald-500" />
            cardDescription = isPaid
              ? `Points sécurisés (${service.points} pts). Service planifié le ${rdvDateStr} ${rdvTimeStr}.`
              : `Entraide gratuite planifiée le ${rdvDateStr} ${rdvTimeStr}.`

            if (isProvider) {
              primaryAction = (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      if (activeConv.prestationStatut === 'valide') {
                        await demarrerService({ id: service._id, body: { conversationId: activeConv._id } })
                      }
                      await terminerService({ id: service._id, body: { conversationId: activeConv._id } })
                      queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                      toast.success('Réalisation déclarée terminée !')
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Erreur lors de la validation de fin.")
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Déclarer terminé
                </Button>
              )
            } else {
              cardDescription += " Votre voisin réalisera le service à l'heure convenue."
            }
            break

          case 5:
            cardTitle = "Validation de la réalisation"
            cardIcon = <Clock className="h-5 w-5 text-amber-500" />
            cardDescription = isClient
              ? `Le prestataire a déclaré le service terminé. Validez pour libérer les points et clore la transaction.`
              : "Le service a été déclaré terminé. En attente de validation par votre voisin."

            if (isClient) {
              primaryAction = (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await validerService({ id: service._id, body: { conversationId: activeConv._id } })
                      queryClient.invalidateQueries({ queryKey: ['conversation', activeConv._id] })
                      if (isPaid && contract) {
                        queryClient.invalidateQueries({ queryKey: ['contract-detail', contract._id] })
                      }
                      toast.success(isPaid ? 'Réalisation validée et points transférés !' : 'Service validé avec succès !')
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Erreur lors de la validation.")
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  {isPaid && contract ? 'Valider la réalisation' : isPaid ? `Valider & Payer ${service.points} pts` : 'Valider la réalisation'}
                </Button>
              )
            }
            break

          case 6:
            cardTitle = "Service finalisé et clos"
            cardIcon = <CheckCircle className="h-5 w-5 text-emerald-600" />
            cardDescription = isPaid
              ? `Le service est terminé. Les ${service.points} points ont été transférés.`
              : "Le service d'entraide gratuit a été clôturé avec succès."

            if (isPaid && contract) {
              primaryAction = (
                <Button
                  size="sm"
                  onClick={handleDownloadContract}
                  disabled={downloading}
                  className="bg-[#0c3383] hover:bg-[#0c3383]/95 text-white font-bold text-[10px] h-8 px-3 rounded-lg flex items-center gap-1.5"
                >
                  {downloading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  Télécharger le contrat signé
                </Button>
              )
            }
            break

          case 7:
            cardTitle = "Annulé ou refusé"
            cardIcon = <XCircle className="h-5 w-5 text-rose-500" />
            cardDescription = "Cette entraide a été annulée."
            break
        }

        return (
          <div className="bg-white border-b border-gray-100 p-4 shrink-0 shadow-2xs font-sans">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">
                  {cardIcon}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                      service.type === 'offre' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {service.type === 'offre' ? 'Offre' : 'Demande'}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">
                      {service.titre}
                    </h4>
                    {isPaid ? (
                      <Badge className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0">
                        {service.points} pts
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0">
                        Gratuit
                      </Badge>
                    )}
                  </div>
                  <h5 className="text-[11px] font-bold text-slate-800 tracking-tight leading-none mt-1">
                    {cardTitle}
                  </h5>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-light">
                    {cardDescription}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                {secondaryAction}
                {primaryAction}
                {currentStep >= 2 && currentStep <= 5 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isCancelling}
                    onClick={async () => {
                      if (window.confirm("Êtes-vous sûr de vouloir annuler cette prestation ?")) {
                        try {
                          await annulerPrestation(activeConv._id)
                          toast.success("Prestation annulée avec succès.")
                        } catch {
                          toast.error("Erreur lors de l'annulation.")
                        }
                      }
                    }}
                    className="border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs rounded-xl h-9"
                  >
                    Annuler l'entraide
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <HeartHandshake className="h-12 w-12 mb-3 text-gray-300 animate-pulse" />
            <p className="text-xs font-bold text-gray-900">Aucun message pour l'instant</p>
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

            const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId
            const senderName = typeof msg.senderId === 'object' ? msg.senderId?.name : null
            const senderPicture = typeof msg.senderId === 'object' ? msg.senderId?.picture : null
            const isMe = senderIdStr === currentUser?.id
            return (
              <div
                key={msg._id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out`}
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
                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {isGroup && !isMe && senderName && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <Avatar className="h-5 w-5 shrink-0">
                          <AvatarImage src={senderPicture ?? undefined} />
                          <AvatarFallback className="bg-[#2c308e] text-white text-[8px] font-bold">
                            {senderName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-bold text-[#2c308e]">{senderName}</span>
                      </div>
                    )}
                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-[#2c308e] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className="font-light whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 font-sans">
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
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white shrink-0 flex gap-2 items-center">


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
          className="h-11 w-11 rounded-2xl bg-[#2c308e] hover:bg-[#2c308e]/95 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-[#2c308e] cursor-pointer"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4.5 w-4.5" />
          )}
        </button>
      </form>

      <SchedulerModal
        isOpen={showScheduler}
        onClose={() => setShowScheduler(false)}
        activeConversation={activeConv}
        conversations={conversations}
        onProposeSlot={async ({ id, date, debut, fin }: { id: string; date: string; debut: string; fin: string }) => {
          try {
            await proposerCreneau({ id, date, debut, fin })
            setShowScheduler(false)
            toast.success('Proposition de rendez-vous envoyée à votre voisin !')
          } catch {
            toast.error('Erreur lors de la soumission de la proposition.')
          }
        }}
        isProposing={isProposing}
      />
    </div>
  )
}
