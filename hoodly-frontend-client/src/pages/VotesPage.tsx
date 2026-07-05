import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '../hooks/useUser'
import { useSocket } from '../hooks/useSocket'
import { votesApi } from '../services/api/votes'
import type {
  Vote,
} from '../types/vote.types'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Plus,
  Lock,
  Globe,
  AlertCircle,
  TrendingUp,
  X,
  Loader2,
  Trash2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import CreateVoteModal from '../components/votes/CreateVoteModal'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'

export default function VotesPage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleVoteUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] })
    }

    socket.on('voteUpdated', handleVoteUpdated)

    return () => {
      socket.off('voteUpdated', handleVoteUpdated)
    }
  }, [socket, queryClient])

  const [activeTab, setActiveTab] = useState<'active' | 'proposals' | 'closed' | 'moderation'>('active')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [rejectingVoteId, setRejectingVoteId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingRejection, setSubmittingRejection] = useState(false)
  const [forcedAnonymity, setForcedAnonymity] = useState<Record<string, boolean>>({})

  const { data: votes = [], isLoading, isError } = useQuery<Vote[]>({
    queryKey: ['votes', user?.zoneId],
    queryFn: async () => {
      if (!user?.zoneId) return []
      const { data } = await votesApi.getAllByZone(user.zoneId)
      return data
    },
    enabled: !!user?.zoneId,
  })

  const voteMutation = useMutation({
    mutationFn: async ({ voteId, option }: { voteId: string; option: string }) => {
      const { data } = await votesApi.castVote(voteId, option)
      return data
    },
    onSuccess: () => {
      toast.success(t('votes.toasts.voteRecorded'))
      queryClient.invalidateQueries({ queryKey: ['votes'] })
      queryClient.invalidateQueries({ queryKey: ['global-feed'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || t('votes.errors.voteRecordFailed')
      toast.error(msg)
    }
  })

  const approveMutation = useMutation({
    mutationFn: async ({ voteId, isAnonymous }: { voteId: string; isAnonymous?: boolean }) => {
      const { data } = await votesApi.approve(voteId, isAnonymous)
      return data
    },
    onSuccess: () => {
      toast.success(t('votes.toasts.approvedSuccess'))
      queryClient.invalidateQueries({ queryKey: ['votes'] })
      queryClient.invalidateQueries({ queryKey: ['global-feed'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('votes.errors.approveFailed'))
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ voteId, reason }: { voteId: string; reason: string }) => {
      const { data } = await votesApi.reject(voteId, reason)
      return data
    },
    onSuccess: () => {
      toast.success(t('votes.toasts.rejectedSuccess'))
      setRejectingVoteId(null)
      setRejectionReason('')
      queryClient.invalidateQueries({ queryKey: ['votes'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('votes.errors.rejectFailed'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (voteId: string) => {
      await votesApi.delete(voteId)
    },
    onSuccess: () => {
      toast.success(t('votes.toasts.deletedSuccess'))
      queryClient.invalidateQueries({ queryKey: ['votes'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('votes.errors.deleteFailed'))
    }
  })

  const closeMutation = useMutation({
    mutationFn: async (voteId: string) => {
      const { data } = await votesApi.close(voteId)
      return data
    },
    onSuccess: () => {
      toast.success(t('votes.toasts.closedSuccess'))
      queryClient.invalidateQueries({ queryKey: ['votes'] })
      queryClient.invalidateQueries({ queryKey: ['global-feed'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('votes.errors.closeFailed'))
    }
  })

  const isModeratorOrAdmin = user?.role === 'moderator' || user?.role === 'admin'

  const handleVoteSubmit = (voteId: string) => {
    const option = selectedOptions[voteId]
    if (!option) {
      toast.error(t('votes.errors.selectOptionRequired'))
      return
    }
    voteMutation.mutate({ voteId, option })
  }

  const handleApprove = (voteId: string, currentAnonymity: boolean) => {
    const isForced = forcedAnonymity[voteId]
    approveMutation.mutate({
      voteId,
      isAnonymous: isForced ? true : currentAnonymity
    })
  }

  const openRejectDialog = (voteId: string) => {
    setRejectingVoteId(voteId)
    setRejectionReason('')
  }

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error(t('votes.errors.refusalReasonRequired'))
      return
    }
    setSubmittingRejection(true)
    rejectMutation.mutate(
      { voteId: rejectingVoteId!, reason: rejectionReason.trim() },
      {
        onSettled: () => setSubmittingRejection(false)
      }
    )
  }

  const hasVoted = (vote: Vote) => {
    return vote.votedUsers.some(vu => vu.userId === user?.id || vu.userId === user?.auth0Id)
  }

  const getResults = (vote: Vote) => {
    const totals: Record<string, number> = {}
    vote.options.forEach(opt => {
      totals[opt] = 0
    })
    vote.votedUsers.forEach(vu => {
      if (totals[vu.option] !== undefined) {
        totals[vu.option]++
      }
    })
    const totalVotes = vote.votedUsers.length
    return { totals, totalVotes }
  }

  const activeVotes = votes.filter(v => v.status === 'active')
  const closedVotes = votes.filter(v => v.status === 'closed')
  const pendingVotes = votes.filter(v => v.status === 'pending')
  const userProposals = votes.filter(v => v.creatorId === user?.id || v.creatorId === user?.auth0Id)

  return (
    <div className="p-6 max-w-4xl mx-auto pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('votes.title')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('votes.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl shadow-md flex items-center gap-1.5 font-bold h-11"
        >
          <Plus className="h-4 w-4" />
          <span>{t('votes.buttons.proposeVote')}</span>
        </Button>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {t('votes.tabs.active', { count: activeVotes.length })}
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'proposals'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {t('votes.tabs.proposals', { count: userProposals.length })}
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'closed'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {t('votes.tabs.closed', { count: closedVotes.length })}
        </button>
        {isModeratorOrAdmin && (
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'moderation'
                ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-200'
                : 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            {t('votes.tabs.moderation', { count: pendingVotes.length })}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100">
          <Loader2 className="h-8 w-8 text-[#2c308e] animate-spin mb-3" />
          <p className="text-sm text-gray-500">{t('votes.loading')}</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 text-red-500">
          <AlertCircle className="h-8 w-8 mb-3" />
          <p className="text-sm font-semibold">{t('votes.errors.fetchFailed')}</p>
        </div>
      ) : (
        <div className="space-y-6">

          {activeTab === 'active' && (
            activeVotes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border border-gray-100">
                <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t('votes.empty.noActive')}</p>
              </div>
            ) : (
              activeVotes.map((vote) => {
                const voted = hasVoted(vote)
                const { totals, totalVotes } = getResults(vote)

                return (
                  <Card key={vote._id} className="rounded-3xl border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-[#1e224e]">{vote.title}</h3>
                          {vote.description && (
                            <p className="text-gray-500 text-sm leading-relaxed">{vote.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1 text-[10px] font-bold">
                            {vote.isAnonymous ? (
                              <>
                                <Lock className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">{t('votes.card.anonymousLabel')}</span>
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 text-amber-600" />
                                <span className="text-amber-700">{t('votes.card.publicLabel')}</span>
                              </>
                            )}
                          </Badge>
                          <Badge className="bg-[#2c308e]/10 text-[#2c308e] hover:bg-[#2c308e]/20 border-none flex items-center gap-1 text-[10px] font-bold">
                            <Clock className="h-3 w-3" />
                            <span>{t('votes.card.expiresAt', { date: new Date(vote.expirationDate).toLocaleDateString() })}</span>
                          </Badge>
                        </div>
                      </div>

                      {!voted ? (
                        <div className="mt-5 space-y-3">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                            {t('votes.card.makeChoice')}
                          </label>
                          <div className="grid gap-2.5">
                            {vote.options.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setSelectedOptions({ ...selectedOptions, [vote._id]: opt })}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all duration-150 ${
                                  selectedOptions[vote._id] === opt
                                    ? 'border-[#2c308e] bg-[#e9eaf6]/30 text-[#2c308e] ring-1 ring-[#2c308e]'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  selectedOptions[vote._id] === opt
                                    ? 'border-[#2c308e] bg-[#2c308e]'
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {selectedOptions[vote._id] === opt && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </div>
                                <span>{opt}</span>
                              </button>
                            ))}
                          </div>

                          {!vote.isAnonymous && (
                            <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-2">
                              {t('votes.card.publicWarning')}
                            </p>
                          )}

                          <div className="pt-4 flex justify-end">
                            <Button
                              onClick={() => handleVoteSubmit(vote._id)}
                              disabled={voteMutation.isPending || !selectedOptions[vote._id]}
                              className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold rounded-xl px-6 h-10 shadow-sm"
                            >
                              {voteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : null}
                              {t('votes.card.buttons.vote')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>{t('votes.card.currentResults')}</span>
                            <span className="text-[#2c308e] flex items-center gap-1 normal-case font-bold">
                              <TrendingUp className="h-3 w-3" /> {t('votes.card.votedInfo', { count: totalVotes })}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {vote.options.map((opt) => {
                              const count = totals[opt] || 0
                              const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0

                              return (
                                <div key={opt} className="space-y-1">
                                  <div className="flex justify-between text-sm font-semibold text-gray-700">
                                    <span>{opt}</span>
                                    <span>{pct.toFixed(0)}% ({count})</span>
                                  </div>
                                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#2c308e] rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  {!vote.isAnonymous && count > 0 && (
                                    <div className="text-[10px] text-gray-400 pl-1">
                                      {t('votes.card.votersPrefix')}{vote.votedUsers
                                        .filter(vu => vu.option === opt)
                                        .map(vu => vu.userId === user?.id ? t('votes.card.you') : t('votes.card.neighbor', { id: vu.userId?.substring(0, 5) }))
                                        .join(', ')}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {isModeratorOrAdmin && (
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-2.5 mt-4">
                          <Button
                            onClick={() => closeMutation.mutate(vote._id)}
                            variant="outline"
                            className="border-gray-200 text-gray-600 rounded-xl text-xs font-bold"
                          >
                            {t('votes.card.buttons.closePoll')}
                          </Button>
                          <Button
                            onClick={() => deleteMutation.mutate(vote._id)}
                            variant="destructive"
                            className="bg-red-50 hover:bg-red-100 text-red-600 border-none rounded-xl text-xs font-bold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {t('votes.card.buttons.delete')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )
          )}

          {activeTab === 'proposals' && (
            userProposals.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border border-gray-100">
                <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t('votes.empty.noProposals')}</p>
              </div>
            ) : (
              userProposals.map((vote) => (
                <Card key={vote._id} className="rounded-3xl border-gray-100 overflow-hidden shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#1e224e]">{vote.title}</h3>
                        {vote.description && (
                          <p className="text-gray-500 text-sm leading-relaxed mt-1">{vote.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                         {vote.status === 'pending' && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold text-[10px]">
                            {t('votes.card.status.pending')}
                          </Badge>
                        )}
                        {vote.status === 'active' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold text-[10px]">
                            {t('votes.card.status.active')}
                          </Badge>
                        )}
                        {vote.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 font-bold text-[10px]">
                            {t('votes.card.status.rejected')}
                          </Badge>
                        )}
                        {vote.status === 'closed' && (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-200 font-bold text-[10px]">
                            {t('votes.card.status.closed')}
                          </Badge>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {t('votes.card.createdAt', { date: vote.createdAt ? new Date(vote.createdAt).toLocaleDateString() : t('votes.na') })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 gap-2">
                        <span>{t('votes.card.optionsPrefix')}{vote.options.join(', ')}</span>
                        <span>{t('votes.card.modePrefix')}{vote.isAnonymous ? t('votes.card.modeAnonymous') : t('votes.card.modePublic')}</span>
                      </div>

                      {vote.status === 'rejected' && vote.refusalReason && (
                        <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-xl text-xs text-red-700">
                          <p className="font-bold flex items-center gap-1">
                            <XCircle className="h-4 w-4" /> {t('votes.card.refusalReasonLabel')}
                          </p>
                          <p className="mt-1 leading-relaxed">{vote.refusalReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}

          {activeTab === 'closed' && (
            closedVotes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border border-gray-100">
                <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t('votes.empty.noClosed')}</p>
              </div>
            ) : (
              closedVotes.map((vote) => {
                const { totals, totalVotes } = getResults(vote)

                return (
                  <Card key={vote._id} className="rounded-3xl border-gray-100 overflow-hidden shadow-sm bg-gray-50/30">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-600 line-through">{vote.title}</h3>
                          {vote.description && (
                            <p className="text-gray-400 text-sm leading-relaxed mt-1">{vote.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-gray-100 text-gray-500 border-none font-bold text-[10px]">
                            {t('votes.card.status.closedLabel')}
                          </Badge>
                          <Badge variant="outline" className="text-gray-400 border-gray-200 font-bold text-[10px]">
                            {vote.isAnonymous ? t('votes.card.modeAnonymous') : t('votes.card.modePublic')}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>{t('votes.card.finalResults')}</span>
                          <span>{t('votes.card.participantsCount', { count: totalVotes })}</span>
                        </div>

                        <div className="space-y-3">
                          {vote.options.map((opt) => {
                            const count = totals[opt] || 0
                            const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0

                            return (
                              <div key={opt} className="space-y-1">
                                <div className="flex justify-between text-sm font-medium text-gray-600">
                                  <span>{opt}</span>
                                  <span>{pct.toFixed(0)}% ({count})</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gray-400 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>

                                {!vote.isAnonymous && count > 0 && (
                                  <div className="text-[10px] text-gray-400 pl-1">
                                    {t('votes.card.votersPrefix')}{vote.votedUsers
                                      .filter(vu => vu.option === opt)
                                      .map(vu => vu.userId === user?.id ? t('votes.card.you') : t('votes.card.neighbor', { id: vu.userId?.substring(0, 5) }))
                                      .join(', ')}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {isModeratorOrAdmin && (
                        <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                          <Button
                            onClick={() => deleteMutation.mutate(vote._id)}
                            variant="destructive"
                            className="bg-red-50 hover:bg-red-100 text-red-600 border-none rounded-xl text-xs font-bold h-9"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {t('votes.card.buttons.deleteHistory')}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )
          )}

          {activeTab === 'moderation' && isModeratorOrAdmin && (
            pendingVotes.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-3xl border border-gray-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">{t('votes.moderation.allProcessed')}</p>
              </div>
            ) : (
              pendingVotes.map((vote) => {
                const isForced = forcedAnonymity[vote._id] || false

                return (
                  <Card key={vote._id} className="rounded-3xl border-gray-100 shadow-sm border-l-4 border-l-amber-400 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[#1e224e]">{vote.title}</h3>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] font-bold">
                              {t('votes.card.status.waiting')}
                            </Badge>
                          </div>
                          {vote.description && (
                            <p className="text-gray-500 text-sm leading-relaxed">{vote.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-gray-700">{t('votes.card.proposedByResident')}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {t('votes.card.requestedExpiration', { date: new Date(vote.expirationDate).toLocaleDateString() })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>{t('votes.card.proposedOptionsPrefix')}<strong className="text-gray-700">{vote.options.join(', ')}</strong></p>
                          <p>{t('votes.card.configuredAnonymityPrefix')}<strong className="text-gray-700">{vote.isAnonymous ? t('votes.card.modeAnonymous') : t('votes.card.modePublic')}</strong></p>
                        </div>

                        {!vote.isAnonymous && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 shrink-0">
                            <input
                              type="checkbox"
                              id={`force-anon-${vote._id}`}
                              checked={isForced}
                              onChange={(e) => setForcedAnonymity({ ...forcedAnonymity, [vote._id]: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <label htmlFor={`force-anon-${vote._id}`} className="text-xs font-bold text-amber-800 cursor-pointer select-none">
                              {t('votes.moderation.forceAnonymous')}
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end gap-3">
                        <Button
                          onClick={() => openRejectDialog(vote._id)}
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold h-10 text-xs"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {t('votes.buttons.reject')}
                        </Button>
                        <Button
                          onClick={() => handleApprove(vote._id, vote.isAnonymous)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-10 text-xs px-5 shadow-sm"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          {t('votes.buttons.approveAndPublish')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )
          )}

        </div>
      )}

      {rejectingVoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1e224e]/40 backdrop-blur-sm" onClick={() => setRejectingVoteId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setRejectingVoteId(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-[#1e224e] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('votes.rejectModal.title')}
            </h3>
            <p className="text-gray-500 text-xs mb-4">
              {t('votes.rejectModal.hint')}
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('votes.rejectModal.placeholder')}
              className="min-h-[100px] rounded-xl border-gray-200 p-3 text-sm focus:border-[#2c308e] mb-4"
              disabled={submittingRejection}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setRejectingVoteId(null)}
                className="flex-1 rounded-xl"
                disabled={submittingRejection}
              >
                {t('votes.buttons.cancel')}
              </Button>
              <Button
                onClick={handleRejectSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                disabled={submittingRejection}
              >
                {submittingRejection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('votes.rejectModal.confirmRefusal')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {user?.zoneId && (
        <CreateVoteModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          zoneId={user.zoneId}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['votes'] })
          }}
        />
      )}
    </div>
  )
}
