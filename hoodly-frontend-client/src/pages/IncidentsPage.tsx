import { useState, useRef } from 'react'
import { useUser } from '../hooks/useUser'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { incidentsApi } from '../services/api/incidents'
import { servicesApi } from '../services/api/services'
import { eventsApi } from '../services/api/events'
import {
  AlertTriangle,
  Zap,
  Droplet,
  Wrench,
  Trees,
  Trash2,
  Lightbulb,
  Dog,
  MoreHorizontal,
  Clock,
  ShieldAlert,
  VolumeX,
  Camera,
  X,
  Loader2,
  Info,
  Calendar,
  Users,
  CheckCircle,
  AlertOctagon,
  Sparkles
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { toast } from 'sonner'
import type { IncidentPriority, IncidentContext, IncidentStatus } from '../types/incident.types'
import { useTranslation } from 'react-i18next'

const getCategoryTranslationKey = (name: string) => {
  switch (name) {
    case 'Électricité': return 'electricity';
    case 'Eau / Fuite': return 'waterLeak';
    case 'Voirie / Route': return 'roadway';
    case 'Espaces Verts': return 'greenSpaces';
    case 'Déchets': return 'waste';
    case 'Éclairage': return 'lighting';
    case 'Animaux': return 'animals';
    case 'Autre': return 'other';
    case 'Matériel endommagé': return 'damagedEquipment';
    case 'Retard / Absence': return 'delayAbsence';
    case 'Comportement': return 'behavior';
    case 'Nuisance sonore': return 'noiseNuisance';
    case 'Dégradation lieu': return 'venueDamage';
    case 'Sécurité': return 'security';
    default: return name;
  }
}

const QUARTIER_CATEGORIES = [
  { name: 'Électricité', icon: Zap },
  { name: 'Eau / Fuite', icon: Droplet },
  { name: 'Voirie / Route', icon: AlertOctagon },
  { name: 'Espaces Verts', icon: Trees },
  { name: 'Déchets', icon: Trash2 },
  { name: 'Éclairage', icon: Lightbulb },
  { name: 'Animaux', icon: Dog },
  { name: 'Autre', icon: MoreHorizontal }
]

const SERVICE_CATEGORIES = [
  { name: 'Matériel endommagé', icon: Wrench },
  { name: 'Retard / Absence', icon: Clock },
  { name: 'Comportement', icon: ShieldAlert },
  { name: 'Autre', icon: MoreHorizontal }
]

const EVENT_CATEGORIES = [
  { name: 'Nuisance sonore', icon: VolumeX },
  { name: 'Dégradation lieu', icon: AlertTriangle },
  { name: 'Sécurité', icon: ShieldAlert },
  { name: 'Autre', icon: MoreHorizontal }
]

export default function IncidentsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create')

  const [contexte, setContexte] = useState<IncidentContext>('quartier')
  const [nature, setNature] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState<IncidentPriority>('normale')

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents', user?.zoneId],
    queryFn: async () => {
      if (!user?.zoneId) return []
      const { data } = await incidentsApi.getAll({ zoneId: user.zoneId })
      return data
    },
    enabled: !!user?.zoneId
  })

  const { data: servicesData } = useQuery({
    queryKey: ['my-involved-services', user?.id],
    queryFn: async () => {
      if (!user?.id) return { services: [] }
      const { data } = await servicesApi.getAll({ limit: 100 })
      return data
    },
    enabled: !!user?.id && contexte === 'service'
  })

  const { data: eventsData } = useQuery({
    queryKey: ['my-involved-events', user?.id],
    queryFn: async () => {
      if (!user?.id) return { events: [] }
      const { data } = await eventsApi.getAll({ limit: 100 })
      return data
    },
    enabled: !!user?.id && contexte === 'evenement'
  })

  const myServices = (servicesData?.services || []).filter((s: any) => {
    const creatorIdStr = typeof s.createurId === 'object' ? s.createurId?._id || s.createurId?.id : s.createurId
    const responderIdStr = typeof s.responderId === 'object' ? s.responderId?._id || s.responderId?.id : s.responderId
    return creatorIdStr === user?.id || responderIdStr === user?.id
  })

  const myEvents = (eventsData?.events || []).filter((e: any) => {
    const creatorIdStr = typeof e.createurId === 'object' ? e.createurId?._id || e.createurId?.id : e.createurId
    const isParticipant = (e.participants || []).some((p: any) => {
      const pid = typeof p === 'object' ? p._id || p.id : p
      return pid === user?.id
    })
    const isInterested = (e.interesses || []).some((p: any) => {
      const pid = typeof p === 'object' ? p._id || p.id : p
      return pid === user?.id
    })
    return creatorIdStr === user?.id || isParticipant || isInterested
  })

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('incidents.errors.photoTooLarge'))
        return
      }
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetForm = () => {
    setNature('')
    setSelectedServiceId('')
    setSelectedEventId('')
    setDescription('')
    setPriorite('normale')
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nature) {
      toast.error(t('incidents.errors.natureRequired'))
      return
    }

    if (contexte === 'service' && !selectedServiceId) {
      toast.error(t('incidents.errors.serviceRequired'))
      return
    }

    if (contexte === 'evenement' && !selectedEventId) {
      toast.error(t('incidents.errors.eventRequired'))
      return
    }

    if (!description.trim()) {
      toast.error(t('incidents.errors.descriptionRequired'))
      return
    }

    setSubmitting(true)
    try {
      let photoUrl = ''
      if (photoFile) {
        try {
          const uploadRes = await incidentsApi.uploadPhoto(photoFile)
          photoUrl = uploadRes.data.fileUrl
        } catch {
          toast.error(t('incidents.errors.photoUploadFailed'))
        }
      }

      await incidentsApi.create({
        type: nature,
        description,
        photoUrl: photoUrl || undefined,
        contexte,
        serviceId: contexte === 'service' ? selectedServiceId : undefined,
        eventId: contexte === 'evenement' ? selectedEventId : undefined,
        priorite,
        zoneId: user?.zoneId,
        signaledPar: user?.name || user?.email || 'Habitant'
      })

      toast.success(t('incidents.toasts.createSuccess'))
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      resetForm()
      setActiveTab('list')
    } catch (err) {
      console.error(err)
      toast.error(t('incidents.errors.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const getCategories = () => {
    if (contexte === 'service') return SERVICE_CATEGORIES
    if (contexte === 'evenement') return EVENT_CATEGORIES
    return QUARTIER_CATEGORIES
  }

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'signale':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolu':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ferme':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: IncidentStatus) => {
    switch (status) {
      case 'signale':
        return t('incidents.status.signale')
      case 'en_cours':
        return t('incidents.status.en_cours')
      case 'resolu':
        return t('incidents.status.resolu')
      case 'ferme':
        return t('incidents.status.ferme')
      default:
        return status
    }
  }

  const getPriorityBadgeColor = (prio: IncidentPriority) => {
    switch (prio) {
      case 'basse':
        return 'bg-gray-50 text-gray-600'
      case 'normale':
        return 'bg-blue-50 text-blue-600'
      case 'haute':
        return 'bg-orange-50 text-orange-600'
      case 'urgente':
        return 'bg-rose-50 text-rose-600 border border-rose-100 font-bold'
      default:
        return ''
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-16">
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#2c308e] uppercase tracking-widest block mb-1">
            {t('incidents.titleLabel')}
          </span>
          <h1 className="text-4xl font-extrabold text-[#1e224e] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('incidents.titlePart1')} <span className="text-[#2c308e]">{t('incidents.titlePart2')}</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-xl leading-relaxed">
            {t('incidents.subtitle')}
          </p>
        </div>

        <div className="flex bg-gray-100/80 rounded-2xl p-1.5 self-center sm:self-end shadow-inner">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t('incidents.tabs.newReport')}
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t('incidents.tabs.followUp', { count: incidents.length })}
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {t('incidents.form.contextHeader')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setContexte('quartier')
                      setNature('')
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                      contexte === 'quartier'
                        ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e]'
                        : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/50'
                    }`}
                  >
                    <Trees className="h-5 w-5 mb-2" />
                    <span className="text-xs font-bold">{t('incidents.form.contextQuartier')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContexte('service')
                      setNature('')
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                      contexte === 'service'
                        ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e]'
                        : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/50'
                    }`}
                  >
                    <Users className="h-5 w-5 mb-2" />
                    <span className="text-xs font-bold">{t('incidents.form.contextService')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContexte('evenement')
                      setNature('')
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                      contexte === 'evenement'
                        ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e]'
                        : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/50'
                    }`}
                  >
                    <Calendar className="h-5 w-5 mb-2" />
                    <span className="text-xs font-bold">{t('incidents.form.contextEvent')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {t('incidents.form.natureHeader')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {getCategories().map((cat) => {
                    const isSelected = nature === cat.name
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setNature(cat.name)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                          isSelected
                            ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e] shadow-sm'
                            : 'border-gray-100 hover:border-gray-200 text-gray-600 bg-gray-50/30'
                        }`}
                      >
                        <cat.icon className="h-5 w-5 mb-2" />
                        <span className="text-xs font-semibold text-center leading-tight">
                          {t('incidents.categories.' + getCategoryTranslationKey(cat.name), { defaultValue: cat.name })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {contexte === 'service' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {t('incidents.form.selectServiceLabel')}
                  </label>
                  {myServices.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      {t('incidents.form.noServicesHint')}
                    </div>
                  ) : (
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm focus:border-[#2c308e] focus:outline-none"
                    >
                      <option value="">{t('incidents.form.selectServicePlaceholder')}</option>
                      {myServices.map((s: any) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.titre} ({s.type === 'offre' ? t('incidents.form.offer') : t('incidents.form.request')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {contexte === 'evenement' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {t('incidents.form.selectEventLabel')}
                  </label>
                  {myEvents.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      {t('incidents.form.noEventsHint')}
                    </div>
                  ) : (
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm focus:border-[#2c308e] focus:outline-none"
                    >
                      <option value="">{t('incidents.form.selectEventPlaceholder')}</option>
                      {myEvents.map((e: any) => (
                        <option key={e._id || e.id} value={e._id || e.id}>
                          {e.titre} - {new Date(e.date).toLocaleDateString(i18n.language)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('incidents.form.detailsHeader')}
                </label>
                <div className="space-y-4">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('incidents.form.descriptionPlaceholder')}
                    className="min-h-[120px] rounded-2xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm leading-relaxed p-4"
                  />

                  <div>
                    <span className="block text-xs font-semibold text-gray-500 mb-2">
                      {t('incidents.form.visualEvidence')}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex gap-4 items-center">
                      <button
                        type="button"
                        onClick={handlePhotoClick}
                        className="h-24 w-24 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-[#2c308e] hover:border-[#2c308e] hover:bg-[#e9eaf6]/10 transition-all duration-200"
                      >
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('incidents.form.addPhoto')}</span>
                      </button>

                      {photoPreview && (
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-sm rounded-2xl py-6 transition-all hover:scale-101 flex items-center justify-center gap-2 shadow-md shadow-[#2c308e]/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('incidents.form.submittingText')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('incidents.form.submitButton')}</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
                  {t('incidents.form.submitDisclaimer')}
                </p>
              </div>

            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {t('incidents.priorityHeader')}
              </label>

              <div className="space-y-3">
                <div
                  onClick={() => setPriorite('normale')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    priorite === 'normale'
                      ? 'border-[#2c308e] bg-[#e9eaf6]/20'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      priorite === 'normale' ? 'border-[#2c308e]' : 'border-gray-300'
                    }`}>
                      {priorite === 'normale' && (
                        <div className="h-2 w-2 rounded-full bg-[#2c308e]" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{t('incidents.priority.normale')}</span>
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t('incidents.priority.normalHint')}</p>
                  </div>
                </div>

                <div
                  onClick={() => setPriorite('urgente')}
                  className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    priorite === 'urgente'
                      ? 'border-rose-300 bg-rose-50/50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="mt-0.5">
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      priorite === 'urgente' ? 'border-rose-500' : 'border-gray-300'
                    }`}>
                      {priorite === 'urgente' && (
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700">{t('incidents.priority.urgente')}</span>
                      <AlertOctagon className="h-4 w-4 text-rose-500" />
                    </div>
                    <p className="text-[10px] text-rose-600/80 mt-0.5 font-medium">{t('incidents.priority.urgentHint')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#e9eaf6]/40 rounded-[2rem] border border-[#2c308e]/10 p-6 space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-[#e9eaf6] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#2c308e]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{t('incidents.howItWorks.title')}</h3>
              <ul className="text-xs text-gray-600 space-y-2 leading-relaxed list-disc list-inside">
                <li>{t('incidents.howItWorks.step1')}</li>
                <li>{t('incidents.howItWorks.step2')}</li>
                <li>
                  {t('incidents.howItWorks.step3Part1')}{' '}
                  <strong>{t('incidents.howItWorks.step3Part2')}</strong>{' '}
                  {t('incidents.howItWorks.step3Part3')}
                </li>
                <li>{t('incidents.howItWorks.step4')}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t('incidents.followUp.title')}</h2>

          {loadingIncidents ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 text-[#2c308e] animate-spin" />
              <span className="text-xs text-gray-500">{t('incidents.followUp.loading')}</span>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-800">{t('incidents.followUp.allGoodTitle')}</h3>
              <p className="text-xs text-gray-500 mt-1">{t('incidents.followUp.allGoodHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                      <AlertTriangle className="h-5 w-5 text-gray-500" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {t('incidents.categories.' + getCategoryTranslationKey(incident.type), { defaultValue: incident.type })}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                          {t('incidents.context.' + incident.contexte, { defaultValue: incident.contexte })}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityBadgeColor(incident.priorite)} capitalize`}>
                          {t('incidents.priority.' + incident.priorite, { defaultValue: incident.priorite })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {incident.description}
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                        <span>{t('incidents.card.reportedBy', { name: incident.signaledPar })}</span>
                        <span>•</span>
                        <span>{incident.createdAt ? new Date(incident.createdAt).toLocaleDateString(i18n.language) : t('incidents.card.unknownDate')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {incident.photoUrl && (
                      <a
                        href={incident.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-[#2c308e] hover:underline"
                      >
                        {t('incidents.card.viewPhoto')}
                      </a>
                    )}
                    <span className={`text-xs px-3 py-1.5 rounded-xl border font-bold ${getStatusColor(incident.statut)}`}>
                      {getStatusLabel(incident.statut)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
