/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Send,
  Loader2,
  HeartHandshake,
  MessageSquare,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { useConversations } from '../../hooks/useConversations'
import { useServices } from '../../hooks/useServices'
import { toast } from 'sonner'
import { SchedulerModal } from './SchedulerModal'

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
    editMessage,
    deleteMessage
  } = useConversations(activeId as string)

  const {
    accepterService,
    demarrerService,
    terminerService,
    validerService
  } = useServices()

  const [newMessage, setNewMessage] = useState('')
  const [showScheduler, setShowScheduler] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

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

  const otherParticipant = activeConv.participants.find((p: any) => p.email !== currentUser?.email)
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

  const handleSend = async (e?: React.FormEvent) => {
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

  const renderChatBannerActions = (service: any) => {
    const isCreator = typeof service.createurId === 'object'
      ? service.createurId.email === currentUser?.email
      : service.createurId === currentUser?.id

    const otherId = otherParticipant?.id || otherParticipant?._id || ''
    const isProvider = service.type === 'demande' ? !isCreator : isCreator
    const isClient = service.type === 'demande' ? isCreator : !isCreator

    if (activeConv.prestationStatut === 'aucun' || !activeConv.prestationStatut) {
      if (isProvider) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await accepterService({ id: service._id, body: { responderId: otherId } })
                toast.success("Vous avez accepté de rendre ce service d'entraide ! Le calendrier est ouvert.")
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || "Erreur lors de l'acceptation."
                toast.error(errMsg)
              }
            }}
            className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-lg text-xs"
          >
            Se proposer pour ce service
          </Button>
        )
      }
      return (
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wider shrink-0">
          En attente de proposition d'aide
        </span>
      )
    }

    if (activeConv.prestationStatut === 'refuse') {
      return (
        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-wider shrink-0">
          Entraide refusée ou annulée
        </span>
      )
    }

    if (activeConv.prestationStatut === 'valide') {
      if (!activeConv.creneau || activeConv.creneau.statut !== 'confirme') {
        return (
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wider shrink-0">
            💬 Proposez un créneau d'agenda ci-dessous
          </span>
        )
      }

      if (isProvider) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await demarrerService({ id: service._id, body: { conversationId: activeConv._id } })
                toast.success('Service démarré avec succès !')
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || "Erreur lors du démarrage."
                toast.error(errMsg)
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
          >
            Démarrer la réalisation
          </Button>
        )
      }

      return (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 uppercase tracking-wider shrink-0 animate-pulse">
          En attente du démarrage par le prestataire
        </span>
      )
    }

    if (activeConv.prestationStatut === 'en_cours') {
      if (isProvider) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await terminerService({ id: service._id, body: { conversationId: activeConv._id } })
                toast.success('Réalisation déclarée terminée ! En attente de validation du bénéficiaire.')
              } catch (err: any) {
                const errMsg = err?.response?.data?.message || "Erreur lors de la finalisation."
                toast.error(errMsg)
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs animate-pulse"
          >
            Déclarer la réalisation terminée
          </Button>
        )
      }

      return (
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-wider shrink-0 animate-pulse">
          ⚡ Entraide en cours de réalisation...
        </span>
      )
    }

    if (activeConv.prestationStatut === 'termine') {
      if (isClient) {
        return (
          <Button
            size="sm"
            onClick={async () => {
              try {
                await validerService({ id: service._id, body: { conversationId: activeConv._id } })
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
    <div className="flex-1 flex flex-col h-full bg-[#fcfbfa]">
      <div className="p-4 border-b border-gray-100 bg-[#fefefa] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-gray-100 shrink-0">
            <AvatarImage src={otherParticipant?.picture} alt={otherParticipant?.name} />
            <AvatarFallback className="bg-[#2c308e] text-white font-bold text-sm">
              {otherParticipant?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">
              {otherParticipant?.name || 'Voisin'}
            </h3>
            <p className={`text-[10px] flex items-center gap-1.5 font-semibold ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
      </div>

      {activeConv.serviceId && (
        <div className="bg-white border-b border-gray-100 p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0 text-[#2c308e]">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border ${
                  activeConv.serviceId.type === 'offre' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {activeConv.serviceId.type === 'offre' ? 'Offre' : 'Demande'}
                </span>
                <h4 className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[200px]">
                  {activeConv.serviceId.titre}
                </h4>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed font-light">
                Contrepartie de <strong>{activeConv.serviceId.points || 0} points</strong> · Statut : <strong className="capitalize">{activeConv.prestationStatut === 'aucun' ? 'Proposition' : activeConv.prestationStatut}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderChatBannerActions(activeConv.serviceId)}
          </div>
        </div>
      )}

      {activeConv.creneau && activeConv.creneau.statut !== 'annule' && (
        <div className="bg-[#f0f4fa]/60 border-b border-[#e4ecf5] p-3.5 shrink-0 flex items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-[#2c308e]" />
            <div className="text-[10px] text-gray-700">
              🗓️ RDV proposé le <strong className="font-bold">{new Date(activeConv.creneau.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</strong> de <strong className="font-bold bg-white text-indigo-900 border border-indigo-100 shadow-3xs px-1.5 py-0.5 rounded-md">{activeConv.creneau.debut} à {activeConv.creneau.fin}</strong>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeConv.creneau.statut === 'en_attente' ? (
              (() => {
                const isCreator = activeConv.serviceId && (typeof activeConv.serviceId.createurId === 'object'
                  ? activeConv.serviceId.createurId.email === currentUser?.email
                  : activeConv.serviceId.createurId === currentUser?.id)
                const isClient = activeConv.serviceId && (activeConv.serviceId.type === 'demande' ? isCreator : !isCreator)

                if (isClient) {
                  return (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await refuserCreneau(activeConv._id)
                            toast.success('Proposition déclinée.')
                          } catch {
                            toast.error('Erreur lors du refus.')
                          }
                        }}
                        className="text-[9px] font-bold px-2.5 py-1.5 text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-colors shadow-3xs"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await accepterCreneau(activeConv._id)
                            toast.success('Rendez-vous planifié et confirmé dans votre agenda !')
                          } catch {
                            toast.error('Erreur lors de la confirmation.')
                          }
                        }}
                        className="text-[9px] font-bold px-3 py-1.5 text-white bg-[#2c308e] hover:bg-[#2c308e]/95 rounded-lg cursor-pointer transition-colors shadow-3xs"
                      >
                        Accepter
                      </button>
                    </>
                  )
                }

                return (
                  <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase tracking-wider animate-pulse">
                    En attente du bénéficiaire
                  </span>
                )
              })()
            ) : (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-wider shrink-0">
                ✓ Confirmé
              </span>
            )}
          </div>
        </div>
      )}

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

            const isMe = msg.senderId === currentUser?.id
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
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white shrink-0 flex gap-2 items-center">
        {activeConv.serviceId && (() => {
          const isCreator = activeConv.serviceId && (typeof activeConv.serviceId.createurId === 'object'
            ? activeConv.serviceId.createurId.email === currentUser?.email
            : activeConv.serviceId.createurId === currentUser?.id)
          const isClient = activeConv.serviceId && (activeConv.serviceId.type === 'demande' ? isCreator : !isCreator)

          if (!isClient) return null

          return (
            <button
              type="button"
              onClick={() => setShowScheduler(true)}
              className="h-11 w-11 rounded-2xl bg-indigo-50 hover:bg-[#e9eaf6] text-[#2c308e] flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-3xs"
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
