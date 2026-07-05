import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import { useUser } from '../hooks/useUser'
import { eventsApi } from '../services/api/events'
import { SwipeCard } from '../components/events-page/SwipeCard'
import {
  Loader2, PartyPopper, Calendar, MapPin, Users, Check, Plus,
  MessageSquare, ChevronDown, ChevronUp, Award, Gift, Coins, Camera, X, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import type { CreateEventDto, Event } from '../types/event.types'
import { useTranslation } from 'react-i18next'

type Tab = 'decouvrir' | 'interets' | 'participations' | 'mesCreations'

const CATEGORIES = ['Sport', 'Culture', 'Cuisine', 'Jardinage', 'Musique', 'Collecte', 'Autre']

const EMPTY_FORM: CreateEventDto = {
  titre: '',
  description: '',
  date: '',
  lieu: {
    adresse: '',
    ville: '',
  },
  capacite: 10,
  categorie: 'Sport',
  payant: false,
  pointsCout: 0,
  pointsCreateur: 0,
  pointsParticipant: 0,
}

const minDate = new Date().toISOString().slice(0, 16)

export default function EventsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useUser()
  const {
    events, recommendations, isLoading,
    toggleInteret, participer, createEvent, isCreating,
    validerEvenement, isValidating, deleteEvent,
  } = useEvents()

  const [tab, setTab] = useState<Tab>('decouvrir')
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState<CreateEventDto>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [validatingEventId, setValidatingEventId] = useState<string | null>(null)
  const [presentSelection, setPresentSelection] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const userId = user?.id ?? ''

  const deck = events.filter(
    (e) =>
      e.createurId !== userId &&
      !e.interesses.includes(userId) &&
      !e.participants.includes(userId) &&
      !removedIds.has(e.id),
  )

  const mesInterets = events.filter((e) => e.interesses.includes(userId))
  const mesParticipations = events.filter((e) => e.participants.includes(userId))
  const mesCreations = events.filter((e) => e.createurId === userId)

  const handleSwipeLeft = () => {
    if (deck.length === 0) return
    const id = deck[0].id
    setTimeout(() => setRemovedIds((prev) => new Set(prev).add(id)), 350)
  }

  const handleSwipeRight = async () => {
    if (deck.length === 0) return
    const id = deck[0].id
    setTimeout(() => setRemovedIds((prev) => new Set(prev).add(id)), 350)
    try {
      await toggleInteret(id)
      toast.success(t('events.toasts.addedToInterests'))
    } catch {
      toast.error(t('events.errors.saveInterestFailed'))
    }
  }

  const handleParticiperToggle = async (event: Event) => {
    try {
      const result = await participer(event.id)
      if (result.participating && event.payant && event.pointsCout) {
        toast.success(t('events.toasts.registeredPaid', { title: event.titre, points: event.pointsCout }))
      } else if (!result.participating && event.payant && event.pointsCout) {
        toast.success(t('events.toasts.unregisteredPaid', { title: event.titre, points: event.pointsCout }))
      } else {
        toast.success(result.participating ? t('events.toasts.registered', { title: event.titre }) : t('events.toasts.unregistered', { title: event.titre }))
      }
    } catch (err: any) {
      const errorData = err?.response?.data
      toast.error(errorData?.message ?? t('events.errors.registerFailed'))
    }
  }

  const handleValider = async (eventId: string) => {
    try {
      await validerEvenement({ id: eventId, presentIds: Array.from(presentSelection) })
      toast.success(t('events.toasts.validatedSuccess'))
      setValidatingEventId(null)
      setPresentSelection(new Set())
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? t('events.errors.validationFailed'))
    }
  }

  const handleCancelEvent = async (id: string) => {
    if (window.confirm(t('events.confirm.cancelEvent'))) {
      try {
        await deleteEvent(id)
        toast.success(t('events.toasts.cancelledSuccess'))
      } catch (err: any) {
        toast.error(err?.response?.data?.message || t('events.errors.cancelFailed'))
      }
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('events.errors.photoTooLarge'))
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form.titre || !form.date || !form.categorie) {
      toast.error(t('events.errors.requiredFields'))
      return
    }
    try {
      let photoUrl: string | undefined
      if (photoFile) {
        try {
          const res = await eventsApi.uploadPhoto(photoFile)
          photoUrl = res.data.fileUrl
        } catch {
          toast.error(t('events.errors.photoUploadFailed'))
        }
      }
      await createEvent({ ...form, photoUrl })
      toast.success(t('events.toasts.createdSuccess'))
      setForm(EMPTY_FORM)
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowCreateModal(false)
      setTab('mesCreations')
    } catch {
      toast.error(t('events.errors.createFailed'))
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'decouvrir', label: t('events.tabs.discover') },
    { key: 'interets', label: t('events.tabs.myInterests'), count: mesInterets.length },
    { key: 'participations', label: t('events.tabs.participating'), count: mesParticipations.length },
    { key: 'mesCreations', label: t('events.tabs.myCreations'), count: mesCreations.length },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('events.title')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-light">
            {t('events.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-5 rounded-2xl bg-[#2c308e] hover:bg-[#2c308e]/95 text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t('events.buttons.createEvent')}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200/50 w-fit">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === key ? 'bg-white text-[#2c308e] shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#2c308e] text-white text-[10px] font-black">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'decouvrir' && (
        <div className="flex flex-col items-center pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#2c308e]" />
              <p className="text-xs font-bold">{t('events.loading')}</p>
            </div>
          ) : deck.length === 0 ? (
            <div className="w-full max-w-lg space-y-6">
              <div className="flex flex-col items-center gap-4 py-10 text-center text-gray-400">
                <PartyPopper className="h-12 w-12 text-gray-300" />
                <div>
                  <p className="font-bold text-gray-800">{t('events.empty.allSeen')}</p>
                  <p className="text-sm mt-1">{t('events.empty.allSeenHint')}</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#2c308e] text-white text-xs font-bold hover:bg-[#2c308e]/90 transition-all cursor-pointer"
                >
                  {t('events.buttons.createEvent')}
                </button>
              </div>
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1e224e] uppercase tracking-wider">{t('events.suggestions')}</span>
                    <span className="text-[10px] text-[#2c308e] bg-[#e9eaf6] px-2 py-0.5 rounded-full font-bold">Neo4j ✦</span>
                  </div>
                  <EventList
                    events={recommendations}
                    isLoading={false}
                    userId={userId}
                    emptyLabel=""
                    emptyHint=""
                    onParticiperToggle={handleParticiperToggle}
                    onVoirDiscussion={(convId) => navigate(`/messages?id=${convId}`)}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm">
                {deck.length > 2 && (
                  <div className="absolute inset-x-4 top-3 h-full bg-white rounded-[2rem] border border-gray-100 shadow-sm" />
                )}
                {deck.length > 1 && (
                  <div className="absolute inset-x-2 top-1.5 h-full bg-white rounded-[2rem] border border-gray-100 shadow" />
                )}
                <div className="relative">
                  <SwipeCard
                    key={deck[0].id}
                    event={deck[0]}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                  />
                </div>
              </div>
              <p className="mt-6 text-xs text-gray-400">
                {t('events.deckCount', { count: deck.length })}
              </p>
            </>
          )}
        </div>
      )}

      {tab === 'interets' && (
        <EventList
          events={mesInterets}
          isLoading={isLoading}
          userId={userId}
          emptyLabel={t('events.empty.noInterests')}
          emptyHint={t('events.empty.noInterestsHint')}
          onParticiperToggle={handleParticiperToggle}
          onVoirDiscussion={(convId) => navigate(`/messages?id=${convId}`)}
        />
      )}

      {tab === 'participations' && (
        <EventList
          events={mesParticipations}
          isLoading={isLoading}
          userId={userId}
          emptyLabel={t('events.empty.noParticipations')}
          emptyHint={t('events.empty.noParticipationsHint')}
          onParticiperToggle={handleParticiperToggle}
          onVoirDiscussion={(convId) => navigate(`/messages?id=${convId}`)}
        />
      )}

      {tab === 'mesCreations' && (
        <MyCreations
          events={mesCreations}
          isLoading={isLoading}
          validatingEventId={validatingEventId}
          presentSelection={presentSelection}
          isValidating={isValidating}
          onStartValidation={(event) => {
            setValidatingEventId(event.id)
            setPresentSelection(new Set(event.participants))
          }}
          onCancelValidation={() => { setValidatingEventId(null); setPresentSelection(new Set()) }}
          onTogglePresent={(id) => {
            const next = new Set(presentSelection)
            if (next.has(id)) {
              next.delete(id)
            } else {
              next.add(id)
            }
            setPresentSelection(next)
          }}
          onValider={handleValider}
          onVoirDiscussion={(convId) => navigate(`/messages?id=${convId}`)}
          onCreateFirst={() => setShowCreateModal(true)}
          onCancelEvent={handleCancelEvent}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#1e224e] text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t('events.createModal.title')}
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                {photoPreview ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden">
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#2c308e] hover:text-[#2c308e] transition-all cursor-pointer bg-gray-50 hover:bg-[#fafafe]"
                  >
                    <Camera className="h-8 w-8" />
                    <span className="text-xs font-semibold">{t('events.createModal.addPhoto')}</span>
                    <span className="text-[10px]">{t('events.createModal.photoFormatHint')}</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t('events.createModal.titleLabel')}</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder={t('events.createModal.titlePlaceholder')}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t('events.createModal.categoryLabel')}</label>
                <select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20 bg-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{t('events.categories.' + c.toLowerCase(), { defaultValue: c })}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t('events.createModal.descriptionLabel')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('events.createModal.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t('events.createModal.dateLabel')}</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  min={minDate}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t('events.createModal.addressLabel')}</label>
                  <input
                    type="text"
                    value={form.lieu.adresse ?? ''}
                    onChange={(e) => setForm({ ...form, lieu: { ...form.lieu, adresse: e.target.value } })}
                    placeholder={t('events.createModal.addressPlaceholder')}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">{t('events.createModal.cityLabel')}</label>
                  <input
                    type="text"
                    value={form.lieu.ville ?? ''}
                    onChange={(e) => setForm({ ...form, lieu: { ...form.lieu, ville: e.target.value } })}
                    placeholder={t('events.createModal.cityPlaceholder')}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">{t('events.createModal.capacityLabel')}</label>
                <input
                  type="number"
                  min={2}
                  value={form.capacite}
                  onChange={(e) => setForm({ ...form, capacite: parseInt(e.target.value) || 10 })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/20"
                  required
                />
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#fafafe]/50 p-6 space-y-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {t('events.createModal.participationFeeLabel')}
                </label>
                
                <div className="flex bg-gray-100/80 rounded-xl p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, payant: false, pointsCout: 0 })}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      !form.payant
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t('events.createModal.freeOption')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, payant: true, pointsCout: 5 })}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      form.payant
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t('events.createModal.paidOption')}
                  </button>
                </div>

                {form.payant && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="relative w-28">
                        <input
                          type="number"
                          min={1}
                          value={form.pointsCout ?? 5}
                          onChange={(e) => setForm({ ...form, pointsCout: Math.max(1, parseInt(e.target.value) || 0) })}
                          className="h-10 w-full rounded-xl bg-white border border-gray-200 focus:border-[#2c308e] text-center font-bold text-[#1f224e] outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1f224e] uppercase tracking-wider block">{t('events.createModal.pointsPerParticipant')}</span>
                        <span className="text-[10px] text-gray-400 font-light block">{t('events.createModal.suggestedPointsHint')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-11 rounded-xl bg-[#2c308e] text-white text-sm font-bold hover:bg-[#2c308e]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('events.buttons.createEventConfirm')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


function MyCreations({
  events, isLoading,
  validatingEventId, presentSelection, isValidating,
  onStartValidation, onCancelValidation, onTogglePresent, onValider,
  onVoirDiscussion, onCreateFirst, onCancelEvent,
}: {
  events: Event[]
  isLoading: boolean
  validatingEventId: string | null
  presentSelection: Set<string>
  isValidating: boolean
  onStartValidation: (event: Event) => void
  onCancelValidation: () => void
  onTogglePresent: (id: string) => void
  onValider: (id: string) => void
  onVoirDiscussion: (convId: string) => void
  onCreateFirst: () => void
  onCancelEvent: (id: string) => void
}) {
  const { t } = useTranslation()

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#2c308e]" /></div>

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
        <Award className="h-10 w-10 text-gray-300" />
        <div>
          <p className="font-bold text-gray-800">{t('events.myCreations.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('events.myCreations.emptyHint')}</p>
        </div>
        <button onClick={onCreateFirst} className="px-5 py-2.5 rounded-xl bg-[#2c308e] text-white text-xs font-bold hover:bg-[#2c308e]/90 transition-all cursor-pointer">
          {t('events.buttons.createEvent')}
        </button>
      </div>
    )
  }

  const active = events.filter((e) => e.statut !== 'terminé' && e.statut !== 'annulé')
  const done = events.filter((e) => e.statut === 'terminé' || e.statut === 'annulé')

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div className="space-y-4">
          {active.map((event) => (
            <CreationCard
              key={event.id}
              event={event}
              validatingEventId={validatingEventId}
              presentSelection={presentSelection}
              isValidating={isValidating}
              onStartValidation={onStartValidation}
              onCancelValidation={onCancelValidation}
              onTogglePresent={onTogglePresent}
              onValider={onValider}
              onVoirDiscussion={onVoirDiscussion}
              onCancelEvent={onCancelEvent}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t('events.myCreations.pastEvents')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {done.map((event) => (
            <CreationCard
              key={event.id}
              event={event}
              validatingEventId={validatingEventId}
              presentSelection={presentSelection}
              isValidating={isValidating}
              onStartValidation={onStartValidation}
              onCancelValidation={onCancelValidation}
              onTogglePresent={onTogglePresent}
              onValider={onValider}
              onVoirDiscussion={onVoirDiscussion}
              onCancelEvent={onCancelEvent}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreationCard({
  event, validatingEventId, presentSelection, isValidating,
  onStartValidation, onCancelValidation, onTogglePresent, onValider, onVoirDiscussion, onCancelEvent,
}: {
  event: Event
  validatingEventId: string | null
  presentSelection: Set<string>
  isValidating: boolean
  onStartValidation: (event: Event) => void
  onCancelValidation: () => void
  onTogglePresent: (id: string) => void
  onValider: (id: string) => void
  onVoirDiscussion: (convId: string) => void
  onCancelEvent: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const isPast = new Date(event.date) < new Date()
  const isValidated = event.statut === 'terminé'
  const isCancelled = event.statut === 'annulé'
  const isValidatingThis = validatingEventId === event.id
  const fullList = event.participantsFull ?? []

  const formattedDate = new Date(event.date).toLocaleDateString(i18n.language, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  const lieu = event.lieu?.ville || event.lieu?.adresse || t('events.card.noLocation')

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isValidated ? 'border-emerald-100' : isCancelled ? 'border-gray-100 opacity-70' : 'border-gray-100'}`}>
      {event.photoUrl && (
        <div className="h-36 w-full overflow-hidden">
          <img src={event.photoUrl} alt={event.titre} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-[#1e224e] text-sm leading-tight">{event.titre}</p>
            {event.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-[10px]">
              {t('events.categories.' + event.categorie.toLowerCase(), { defaultValue: event.categorie })}
            </Badge>
            {isValidated && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{t('events.card.validatedStatus')}</span>}
            {isCancelled && <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">{t('events.card.cancelledStatus')}</span>}
            {!isValidated && !isCancelled && isPast && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">{t('events.card.toValidateStatus')}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 text-[#2c308e]" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-[#2c308e]" />
            <span>{lieu}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 text-[#2c308e]" />
            <span>{t('events.card.registeredCount', { current: event.participants.length, max: event.capacite })}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {event.pointsCreateur > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#2c308e] bg-[#e9eaf6] px-2.5 py-1 rounded-full">
              <Award className="h-3 w-3" />{t('events.card.organizerPoints', { points: event.pointsCreateur })}
            </span>
          )}
          {event.pointsParticipant > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Gift className="h-3 w-3" />{t('events.card.participantPoints', { points: event.pointsParticipant })}
            </span>
          )}
          {event.payant && event.pointsCout && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <Coins className="h-3 w-3" />{t('events.card.entryPoints', { points: event.pointsCout })}
            </span>
          )}
        </div>

        {isPast && !isValidated && !isCancelled && (
          <div className="border-t border-gray-100 pt-3">
            {!isValidatingThis ? (
              <button
                type="button"
                onClick={() => onStartValidation(event)}
                className="w-full py-2.5 rounded-xl bg-[#2c308e] text-white text-xs font-bold hover:bg-[#2c308e]/90 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                {t('events.card.buttons.validateAndDistribute')}
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-gray-700">{t('events.card.checkAttendeesLabel')}</p>
                {fullList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">{t('events.card.noParticipants')}</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {fullList.map((p) => (
                      <label key={p.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={presentSelection.has(p.id)}
                          onChange={() => onTogglePresent(p.id)}
                          className="h-4 w-4 rounded accent-[#2c308e] cursor-pointer"
                        />
                        <Avatar className="h-7 w-7 border border-gray-100">
                          <AvatarImage src={p.picture} alt={p.name} />
                          <AvatarFallback className="bg-[#2c308e] text-white text-[9px] font-bold">
                            {p.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400">
                  {t('events.card.presentCount', { count: presentSelection.size })}
                  {presentSelection.size > 0 && (presentSelection.size * event.pointsParticipant + event.pointsCreateur) > 0 && t('events.card.pointsDistributed', { points: presentSelection.size * event.pointsParticipant + event.pointsCreateur })}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={onCancelValidation} className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer">
                    {t('events.buttons.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => onValider(event.id)}
                    disabled={isValidating}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {isValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {t('events.buttons.confirm')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isValidated && event.participantsPresents.length > 0 && (
          <p className="text-[10px] text-emerald-600 font-semibold border-t border-gray-100 pt-2">
            {t('events.card.validatedParticipants', { count: event.participantsPresents.length })}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          {event.conversationId && (
            <button
              onClick={() => onVoirDiscussion(event.conversationId!)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2c308e] hover:underline cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {t('events.card.buttons.seeGroupChat')}
            </button>
          )}

          {!isPast && !isCancelled && !isValidated && (
            <button
              type="button"
              onClick={() => onCancelEvent(event.id)}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" />
              {t('events.card.buttons.cancelEvent')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EventList({
  events, isLoading, userId, emptyLabel, emptyHint, onParticiperToggle, onVoirDiscussion,
}: {
  events: Event[]
  isLoading: boolean
  userId: string
  emptyLabel: string
  emptyHint: string
  onParticiperToggle: (event: Event) => void
  onVoirDiscussion: (convId: string) => void
}) {
  const { t, i18n } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [now] = useState(() => new Date().getTime())

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#2c308e]" /></div>

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
        <PartyPopper className="h-10 w-10 text-gray-300" />
        <div>
          <p className="font-bold text-gray-800">{emptyLabel}</p>
          <p className="text-sm mt-1">{emptyHint}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => {
        const isParticipant = event.participants.includes(userId)
        const isFull = event.participants.length >= event.capacite && !isParticipant
        const eventDate = new Date(event.date)
        const isTooLateToCancel = isParticipant && (eventDate.getTime() - now < 24 * 60 * 60 * 1000)
        const formattedDate = eventDate.toLocaleDateString(i18n.language, {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        })
        const lieu = event.lieu?.ville || event.lieu?.adresse || t('events.card.noLocation')
        const fullList = event.participantsFull ?? []
        const isExpanded = expandedId === event.id
        const MAX_PREVIEW = 4

        return (
          <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {event.photoUrl && (
              <div className="h-36 w-full overflow-hidden">
                <img src={event.photoUrl} alt={event.titre} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#1e224e] text-sm leading-tight">{event.titre}</p>
                  {event.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {t('events.categories.' + event.categorie.toLowerCase(), { defaultValue: event.categorie })}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5 text-[#2c308e]" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 text-[#2c308e]" />
                  <span>{lieu}</span>
                </div>
                <button
                  type="button"
                  onClick={() => fullList.length > 0 && setExpandedId(isExpanded ? null : event.id)}
                  className={`flex items-center gap-1.5 text-xs text-gray-500 w-full text-left ${fullList.length > 0 ? 'hover:text-[#2c308e] cursor-pointer' : 'cursor-default'}`}
                >
                  <Users className="h-3.5 w-3.5 text-[#2c308e] shrink-0" />
                  <span>{t('events.card.registeredCount', { current: event.participants.length, max: event.capacite })}</span>
                  {fullList.length > 0 && (
                    <>
                      <div className="flex -space-x-1.5 ml-1">
                        {fullList.slice(0, MAX_PREVIEW).map((p) => (
                          <Avatar key={p.id} className="h-5 w-5 border border-white">
                            <AvatarImage src={p.picture} alt={p.name} />
                            <AvatarFallback className="bg-[#2c308e] text-white text-[7px] font-bold">
                              {p.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {fullList.length > MAX_PREVIEW && (
                          <div className="h-5 w-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[7px] font-bold text-gray-500">
                            +{fullList.length - MAX_PREVIEW}
                          </div>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-auto shrink-0" /> : <ChevronDown className="h-3 w-3 ml-auto shrink-0" />}
                    </>
                  )}
                </button>
              </div>

              {isExpanded && fullList.length > 0 && (
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-2 animate-in fade-in duration-150">
                  {fullList.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-gray-100">
                        <AvatarImage src={p.picture} alt={p.name} />
                        <AvatarFallback className="bg-[#2c308e] text-white text-[9px] font-bold">
                          {p.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                      {p.id === userId && <span className="ml-auto text-[9px] font-bold text-[#2c308e] bg-[#e9eaf6] px-2 py-0.5 rounded-full">{t('events.card.you')}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {event.payant && event.pointsCout ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    <Coins className="h-2.5 w-2.5" />{t('events.card.entryPoints', { points: event.pointsCout })}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{t('events.card.free')}</span>
                )}
                {event.pointsParticipant > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#2c308e] bg-[#e9eaf6] px-2 py-0.5 rounded-full border border-[#2c308e]/10">
                    <Gift className="h-2.5 w-2.5" />{t('events.card.pointsOnParticipation', { points: event.pointsParticipant })}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {event.createurId === userId ? (
                  <span className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#e9eaf6] text-[#2c308e] flex items-center justify-center gap-1.5 border border-[#2c308e]/10">
                    <Award className="h-3.5 w-3.5" /> {t('events.card.yourEvent')}
                  </span>
                ) : (
                  <button
                    onClick={() => onParticiperToggle(event)}
                    disabled={isFull || isTooLateToCancel}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isParticipant
                        ? isTooLateToCancel
                          ? 'bg-green-50/50 border border-green-100 text-green-600/60 cursor-not-allowed'
                          : 'bg-green-50 border border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 cursor-pointer'
                        : isFull
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2c308e] text-white hover:bg-[#2c308e]/90 cursor-pointer'
                    }`}
                  >
                    {isParticipant 
                      ? isTooLateToCancel 
                        ? <><Check className="h-3.5 w-3.5 text-green-500/50" /> {t('events.card.buttons.registeredLocked')}</>
                        : <><Check className="h-3.5 w-3.5" /> {t('events.card.buttons.participating')}</> 
                      : isFull 
                      ? t('events.card.buttons.full')
                      : event.payant && event.pointsCout 
                      ? t('events.card.buttons.participatePaid', { points: event.pointsCout }) 
                      : t('events.card.buttons.participate')}
                  </button>
                )}
                {(isParticipant || event.createurId === userId) && event.conversationId && (
                  <button
                    onClick={() => onVoirDiscussion(event.conversationId!)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-[#e9eaf6] hover:text-[#2c308e] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />{t('events.card.buttons.discussion')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
