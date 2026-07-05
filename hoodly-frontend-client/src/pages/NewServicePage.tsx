import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useServices } from '../hooks/useServices'
import { servicesApi } from '../services/api/services'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Wrench,
  BookOpen,
  Sprout,
  Dog,
  ShoppingBag,
  Camera,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { toast } from 'sonner'
import type { ServiceType } from '../types/service.types'

const CATEGORY_CARDS = [
  { name: 'Bricolage', icon: Wrench },
  { name: 'Cours', icon: BookOpen },
  { name: 'Jardinage', icon: Sprout },
  { name: 'Animaux', icon: Dog },
  { name: 'Courses', icon: ShoppingBag }
]

export default function NewServicePage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialType = searchParams.get('type') === 'demande' ? 'demande' : 'offre'
  const [type, setType] = useState<ServiceType>(initialType)

  const [titre, setTitre] = useState('')
  const [categorie, setCategorie] = useState('Cours')
  const [description, setDescription] = useState('')
  const [gratuit, setGratuit] = useState(false)
  const [points, setPoints] = useState(10)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [weeklyAvail, setWeeklyAvail] = useState<Record<string, string[]>>({
    Lundi: [], Mardi: [], Mercredi: [], Jeudi: [], Vendredi: [], Samedi: [], Dimanche: []
  })
  const [dispoRemarks, setDispoRemarks] = useState('')
  const [tarifType, setTarifType] = useState<'horaire' | 'fixe'>('horaire')
  const [planifChoice, setPlanifChoice] = useState<'asap' | 'date_unique' | 'plage_dates' | 'regulier'>('asap')
  const [singleDate, setSingleDate] = useState('')
  const [singleStartHour, setSingleStartHour] = useState('08:00')
  const [singleEndHour, setSingleEndHour] = useState('12:00')
  const [rangeStartDate, setRangeStartDate] = useState('')
  const [rangeEndDate, setRangeEndDate] = useState('')
  const [rangeAllDay, setRangeAllDay] = useState(true)
  const [rangeStartHour, setRangeStartHour] = useState('08:00')
  const [rangeEndHour, setRangeEndHour] = useState('18:00')
  const [regularDays, setRegularDays] = useState<string[]>([])
  const [regularPeriods, setRegularPeriods] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createService } = useServices()

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const formatDateFr = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('newService.toastErrorPhotoSize'))
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

  const toggleWeeklyAvail = (day: string, period: string) => {
    setWeeklyAvail(prev => {
      const current = prev[day] || []
      const next = current.includes(period) ? current.filter(p => p !== period) : [...current, period]
      return { ...prev, [day]: next }
    })
  }

  const toggleRegularDay = (day: string) => {
    setRegularDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleRegularPeriod = (period: string) => {
    setRegularPeriods(prev =>
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titre.trim()) {
      toast.error(t('newService.toastErrorTitleRequired'))
      return
    }
    if (!categorie) {
      toast.error(t('newService.toastErrorCategoryRequired'))
      return
    }
    if (!description.trim()) {
      toast.error(t('newService.toastErrorDescriptionRequired'))
      return
    }
    if (!gratuit && (points === undefined || points < 1)) {
      toast.error(t('newService.toastErrorPointsRequired'))
      return
    }

    if (type === 'demande') {
      if (planifChoice === 'date_unique' && !singleDate) {
        toast.error(t('newService.toastErrorSingleDateRequired'))
        return
      }
      if (planifChoice === 'plage_dates' && (!rangeStartDate || !rangeEndDate)) {
        toast.error(t('newService.toastErrorRangeDatesRequired'))
        return
      }
      if (planifChoice === 'regulier' && (regularDays.length === 0 || regularPeriods.length === 0)) {
        toast.error(t('newService.toastErrorRegularRequired'))
        return
      }
    }

    setSubmitting(true)
    try {
      let uploadedPhotoUrl = ''

      if (photoFile) {
        try {
          const uploadRes = await servicesApi.uploadPhoto(photoFile)
          uploadedPhotoUrl = uploadRes.data.fileUrl
        } catch {
          toast.error(t('newService.toastErrorPhotoUpload'))
        }
      }

      let datePlanification: string | undefined = undefined
      if (type === 'demande') {
        if (planifChoice === 'asap') {
          datePlanification = t('newService.planifStringASAP')
        } else if (planifChoice === 'date_unique') {
          datePlanification = t('newService.planifStringSingleDate', { date: formatDateFr(singleDate), start: singleStartHour, end: singleEndHour })
        } else if (planifChoice === 'plage_dates') {
          if (rangeAllDay) {
            datePlanification = t('newService.planifStringRangeAllDay', { startDate: formatDateFr(rangeStartDate), endDate: formatDateFr(rangeEndDate) })
          } else {
            datePlanification = t('newService.planifStringRangeHours', { startDate: formatDateFr(rangeStartDate), endDate: formatDateFr(rangeEndDate), start: rangeStartHour, end: rangeEndHour })
          }
        } else if (planifChoice === 'regulier') {
          const translatedDays = regularDays.map(day => t(`newService.days.${day}`)).join(', ')
          const translatedPeriods = regularPeriods.map(p => t(`newService.periods.${p}`)).join(', ')
          datePlanification = t('newService.planifStringRegular', { days: translatedDays, periods: translatedPeriods })
        }
      }

      let computedDispos: string[] | undefined = undefined
      if (type === 'offre') {
        computedDispos = []
        const weekdays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
        const hasMatin = weekdays.some(day => weeklyAvail[day]?.includes('Matin'))
        const hasAprem = weekdays.some(day => weeklyAvail[day]?.includes('Après-midi'))
        const hasSoir = weekdays.some(day => weeklyAvail[day]?.includes('Soirée'))

        if (hasMatin) computedDispos.push('semaine_matin')
        if (hasAprem) computedDispos.push('semaine_aprem')
        if (hasSoir) computedDispos.push('semaine_soir')

        if (weeklyAvail['Samedi'] && weeklyAvail['Samedi'].length > 0) computedDispos.push('samedi')
        if (weeklyAvail['Dimanche'] && weeklyAvail['Dimanche'].length > 0) computedDispos.push('dimanche')
      }

      let finalDescription = description.trim()
      if (type === 'offre' && dispoRemarks.trim()) {
        finalDescription += `\n\nDisponibilités détaillées : ${dispoRemarks.trim()}`
      }

      await createService({
        titre,
        description: finalDescription,
        type,
        categorie,
        gratuit,
        points: gratuit ? undefined : points,
        zoneId: user?.zoneId,
        photoUrl: uploadedPhotoUrl || undefined,
        recurrente: type === 'offre' ? true : undefined,
        disponibilites: type === 'offre' ? computedDispos : undefined,
        datePlanification
      })

      toast.success(
        type === 'offre'
          ? t('newService.toastSuccessOffer')
          : t('newService.toastSuccessRequest')
      )
      navigate('/services')
    } catch {
      toast.error(t('newService.toastErrorPublish'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto pb-16">
      <button
        onClick={() => navigate('/services')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('newService.backToCatalogue')}</span>
      </button>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {type === 'offre' ? t('newService.titleOffer') : t('newService.titleRequest')}
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-light leading-relaxed">
            {type === 'offre'
              ? t('newService.descOffer')
              : t('newService.descRequest')}
          </p>
        </div>

        <div className="flex bg-gray-50 rounded-xl p-1 mb-8">
          <button
            type="button"
            onClick={() => setType('offre')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              type === 'offre'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('newService.tabOffer')}
          </button>
          <button
            type="button"
            onClick={() => setType('demande')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              type === 'demande'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t('newService.tabRequest')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {type === 'offre' ? t('newService.labelWhatServiceOffer') : t('newService.labelWhatServiceRequest')}
            </label>
            <Input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={type === 'offre' ? t('newService.placeholderOfferTitle') : t('newService.placeholderRequestTitle')}
              className="h-12 rounded-xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {t('newService.labelCategory')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {CATEGORY_CARDS.map((card) => {
                const isSelected = categorie === card.name
                return (
                  <button
                    key={card.name}
                    type="button"
                    onClick={() => setCategorie(card.name)}
                    disabled={submitting}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-[#2c308e] bg-[#e9eaf6]/40 text-[#2c308e] ring-1 ring-[#2c308e]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 bg-white'
                    }`}
                  >
                    <card.icon className="h-6 w-6 mb-2" />
                    <span className="text-xs font-semibold">{t(`newService.categories.${card.name}`)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {t('newService.labelServiceDetails')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'offre' ? t('newService.placeholderOfferDetails') : t('newService.placeholderRequestDetails')}
              className="min-h-[140px] rounded-2xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm leading-relaxed p-4"
              disabled={submitting}
            />
          </div>

          {type === 'offre' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('newService.labelWeeklyAvailabilities')}
                </label>
                <p className="text-xs text-gray-400 mb-4 font-light">
                  {t('newService.descWeeklyAvailabilities')}
                </p>

                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-gray-50/30">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-1/4">{t('newService.tableHeaderDay')}</th>
                        {['Matin', 'Après-midi', 'Soirée'].map((p) => (
                          <th key={p} className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">{t(`newService.periods.${p}`)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                        <tr key={day} className="border-b border-gray-100/60 last:border-0 hover:bg-gray-50/50">
                          <td className="p-3 text-xs font-bold text-gray-700">{t(`newService.days.${day}`)}</td>
                          {['Matin', 'Après-midi', 'Soirée'].map((period) => {
                            const isChecked = weeklyAvail[day]?.includes(period)
                            return (
                              <td key={period} className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleWeeklyAvail(day, period)}
                                  disabled={submitting}
                                  className={`w-6 h-6 rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center ${
                                    isChecked
                                      ? 'bg-[#2c308e] border-[#2c308e] text-white shadow-xs'
                                      : 'bg-white border-gray-200 hover:border-gray-300 text-transparent'
                                  }`}
                                >
                                  ✓
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {t('newService.labelDispoRemarks')}
                </label>
                <Textarea
                  value={dispoRemarks}
                  onChange={(e) => setDispoRemarks(e.target.value)}
                  placeholder={t('newService.placeholderDispoRemarks')}
                  className="min-h-[80px] rounded-2xl border-gray-200 focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 text-sm p-3"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {type === 'demande' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('newService.labelPlanningNeed')}
                </label>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { key: 'asap', label: t('newService.planifASAP') },
                    { key: 'date_unique', label: t('newService.planifSingleDate') },
                    { key: 'plage_dates', label: t('newService.planifRangeDates') },
                    { key: 'regulier', label: t('newService.planifRegular') }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPlanifChoice(opt.key as 'asap' | 'date_unique' | 'plage_dates' | 'regulier')}
                      disabled={submitting}
                      className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all text-left ${
                        planifChoice === opt.key
                          ? 'bg-[#2c308e] border-[#2c308e] text-white shadow-xs'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {planifChoice === 'date_unique' && (
                  <div className="p-5 rounded-3xl border border-gray-100 bg-[#fafafe]/60 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelSelectDate')}</span>
                      <Input
                        type="date"
                        value={singleDate}
                        onChange={(e) => setSingleDate(e.target.value)}
                        className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] w-full bg-white"
                        disabled={submitting}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelFromHour')}</span>
                        <Input
                          type="time"
                          value={singleStartHour}
                          onChange={(e) => setSingleStartHour(e.target.value)}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                          disabled={submitting}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelToHour')}</span>
                        <Input
                          type="time"
                          value={singleEndHour}
                          onChange={(e) => setSingleEndHour(e.target.value)}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {planifChoice === 'plage_dates' && (
                  <div className="p-5 rounded-3xl border border-gray-100 bg-[#fafafe]/60 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelStartDate')}</span>
                        <Input
                          type="date"
                          value={rangeStartDate}
                          onChange={(e) => setRangeStartDate(e.target.value)}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                          disabled={submitting}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelEndDate')}</span>
                        <Input
                          type="date"
                          value={rangeEndDate}
                          onChange={(e) => setRangeEndDate(e.target.value)}
                          className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRangeAllDay(!rangeAllDay)}
                        className={`w-5 h-5 rounded-md border transition-all cursor-pointer flex items-center justify-center text-xs ${
                          rangeAllDay ? 'bg-[#2c308e] border-[#2c308e] text-white' : 'bg-white border-gray-200 text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                      <span className="text-xs font-semibold text-gray-600">{t('newService.labelAllDay')}</span>
                    </div>

                    {!rangeAllDay && (
                      <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelFromHour')}</span>
                          <Input
                            type="time"
                            value={rangeStartHour}
                            onChange={(e) => setRangeStartHour(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                            disabled={submitting}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('newService.labelToHour')}</span>
                          <Input
                            type="time"
                            value={rangeEndHour}
                            onChange={(e) => setRangeEndHour(e.target.value)}
                            className="h-11 rounded-xl border-gray-200 focus:border-[#2c308e] bg-white"
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {planifChoice === 'regulier' && (
                  <div className="p-5 rounded-3xl border border-gray-100 bg-[#fafafe]/60 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('newService.labelConcernedDays')}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => {
                          const isSel = regularDays.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleRegularDay(day)}
                              className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                                isSel ? 'bg-[#2c308e] border-[#2c308e] text-white shadow-2xs' : 'bg-white border-gray-200 text-gray-500'
                              }`}
                            >
                              {t(`newService.daysShort.${day}`)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('newService.labelPeriodOfDay')}</span>
                      <div className="flex gap-2">
                        {['Matinée', 'Après-midi', 'Soirée'].map((p) => {
                          const isSel = regularPeriods.includes(p)
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => toggleRegularPeriod(p)}
                              className={`flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer text-center ${
                                isSel ? 'bg-[#2c308e] border-[#2c308e] text-white shadow-2xs' : 'bg-white border-gray-200 text-gray-500'
                              }`}
                            >
                              {t(`newService.periods.${p}`)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {type === 'offre' ? (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {t('newService.labelServicePricing')}
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setGratuit(false)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('newService.btnPayingPoints')}
                </button>
                <button
                  type="button"
                  onClick={() => setGratuit(true)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('newService.btnFreeMutualAid')}
                </button>
              </div>

              {!gratuit && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex bg-gray-50 rounded-xl p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setTarifType('horaire')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        tarifType === 'horaire'
                          ? 'bg-white text-[#2c308e] shadow-sm'
                          : 'text-gray-400'
                      }`}
                    >
                      {t('newService.tarifHourly')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarifType('fixe')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        tarifType === 'fixe'
                          ? 'bg-white text-[#2c308e] shadow-sm'
                          : 'text-gray-400'
                      }`}
                    >
                      {t('newService.tarifFixed')}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative w-28">
                      <Input
                        type="number"
                        min={1}
                        value={points}
                        onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
                        className="h-10 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2c308e] text-center font-bold text-[#1f224e]"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1f224e] uppercase tracking-wider block">
                        {tarifType === 'horaire' ? t('newService.pointsPerHour') : t('newService.pointsPerPrestation')}
                      </span>
                      <span className="text-[10px] text-gray-400 font-light block mt-0.5">
                        {t('newService.labelRecommendedRate', { rate: t(`newService.suggestedRates.${categorie}`) || t('newService.suggestedRates.default') })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                {t('newService.labelAllocatedPointsBudget')}
              </label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setGratuit(false)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    !gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('newService.btnOfferPoints')}
                </button>
                <button
                  type="button"
                  onClick={() => setGratuit(true)}
                  disabled={submitting}
                  className={`px-5 py-3 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    gratuit
                      ? 'bg-[#1f224e] text-white border-[#1f224e] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('newService.btnFreeVolunteerAid')}
                </button>
              </div>

              {!gratuit && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="relative w-28">
                    <Input
                      type="number"
                      min={1}
                      value={points}
                      onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
                      className="h-10 rounded-xl bg-gray-50 border-gray-200 focus:border-[#2c308e] text-center font-bold text-[#1f224e]"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1f224e] uppercase tracking-wider block">{t('newService.labelPointsForTask')}</span>
                    <span className="text-[10px] text-gray-400 font-light block mt-0.5">
                      {t('newService.labelRecommendedRate', { rate: t(`newService.suggestedRates.${categorie}`) || t('newService.suggestedRates.default') })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              {t('newService.labelPhotos')}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div
              onClick={handlePhotoClick}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed cursor-pointer transition-colors ${
                photoPreview
                  ? 'border-gray-300 bg-gray-50/50'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
              }`}
            >
              {photoPreview ? (
                <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={submitting}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <Camera className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-[#1f224e]">{t('newService.clickToAddPhotos')}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{t('newService.photoFormatHint')}</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-sm rounded-2xl py-6 transition-all hover:scale-101 flex items-center justify-center gap-2 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('newService.publishingInProgress')}</span>
                </>
              ) : (
                <>
                  <span>{t('newService.publishAnnouncement')}</span>
                </>
              )}
            </Button>
            <p className="text-[10px] text-gray-400 text-center">
              {t('newService.termsAcceptanceHint')}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
