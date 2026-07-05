import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversations } from '../hooks/useConversations'
import { useServices } from '../hooks/useServices'
import { useUser } from '../hooks/useUser'
import { useEvents } from '../hooks/useEvents'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Play,
  CheckCircle2,
  Award,
  X,
  PartyPopper,
  MapPin,
  Users,
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { toast } from 'sonner'
import type { Conversation } from '../types/conversation.types'
import type { Event } from '../types/event.types'

const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string, bgHover: string }> = {
  Jardinage: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', bgHover: 'hover:bg-emerald-100/70', text: 'text-emerald-700', border: 'border-l-4 border-l-emerald-500' },
  Bricolage: { bg: 'bg-amber-50 text-amber-700 border-amber-100', bgHover: 'hover:bg-amber-100/70', text: 'text-amber-700', border: 'border-l-4 border-l-amber-500' },
  Cours: { bg: 'bg-blue-50 text-blue-700 border-blue-100', bgHover: 'hover:bg-blue-100/70', text: 'text-blue-700', border: 'border-l-4 border-l-blue-500' },
  Garde: { bg: 'bg-rose-50 text-rose-700 border-rose-100', bgHover: 'hover:bg-rose-100/70', text: 'text-rose-700', border: 'border-l-4 border-l-rose-500' },
  Courses: { bg: 'bg-teal-50 text-teal-700 border-teal-100', bgHover: 'hover:bg-teal-100/70', text: 'text-teal-700', border: 'border-l-4 border-l-teal-500' },
  Animaux: { bg: 'bg-purple-50 text-purple-700 border-purple-100', bgHover: 'hover:bg-purple-100/70', text: 'text-purple-700', border: 'border-l-4 border-l-purple-500' }
}

const DEFAULT_STYLE = { bg: 'bg-gray-50 text-gray-700 border-gray-100', bgHover: 'hover:bg-gray-100', text: 'text-gray-700', border: 'border-l-4 border-l-gray-400' }
const EVENT_STYLE = { bg: 'bg-[#e9eaf6] text-[#2c308e] border-[#2c308e]/20', bgHover: 'hover:bg-[#e9eaf6]/80', text: 'text-[#2c308e]', border: 'border-l-4 border-l-[#2c308e]' }

type SelectedItem =
  | { type: 'service'; data: Conversation }
  | { type: 'event'; data: Event }

export default function PlanningPage() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const { conversations } = useConversations()
  const { demarrerService, terminerService, validerService } = useServices()
  const { events } = useEvents()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)

  const userId = user?.id ?? ''

  const confirmedBookings = conversations.filter(
    (c) => c.serviceId && c.creneau && c.creneau.statut === 'confirme' && (c.serviceId.gratuit || c.prestationStatut !== 'aucun')
  )
  const upcomingBookings = confirmedBookings.filter(
    (b) => b.prestationStatut !== 'termine' && !b.realisationValidee
  )

  const myEvents = events.filter(
    (e) => e.createurId === userId || e.participants.includes(userId)
  )
  const upcomingEvents = myEvents.filter(
    (e) => new Date(e.date) >= new Date() && e.statut !== 'annulé' && e.statut !== 'terminé'
  )

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month + 1, 0).getDate()

  const daysArray: (number | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null)
  for (let d = 1; d <= totalDays; d++) daysArray.push(d)

  const monthName = currentDate.toLocaleString(i18n.language, { month: 'long', year: 'numeric' })

  const getServicesForDay = (day: number) =>
    confirmedBookings.filter((b) => {
      const d = new Date(b.creneau!.date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

  const getEventsForDay = (day: number) =>
    myEvents.filter((e) => {
      const d = new Date(e.date)
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year
    })

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p.email !== user?.email)

  const handleStart = async (conv: Conversation) => {
    if (!conv.serviceId) return
    try {
      await demarrerService({ id: conv.serviceId._id, body: { conversationId: conv._id } })
      toast.success(t('planning.toast.start_success'))
      setSelectedItem(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('planning.toast.start_error'))
    }
  }

  const handleFinish = async (conv: Conversation) => {
    if (!conv.serviceId) return
    try {
      await terminerService({ id: conv.serviceId._id, body: { conversationId: conv._id } })
      toast.success(t('planning.toast.finish_success'))
      setSelectedItem(null)
    } catch {
      toast.error(t('planning.toast.finish_error'))
    }
  }

  const handleValidate = async (conv: Conversation) => {
    if (!conv.serviceId) return
    try {
      await validerService({ id: conv.serviceId._id, body: { conversationId: conv._id } })
      toast.success(t('planning.toast.validate_success'))
      setSelectedItem(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('planning.toast.validate_error'))
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('planning.title')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-light leading-relaxed">
            {t('planning.description')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/messages')}
          className="self-start sm:self-center bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-full px-5 py-2.5 flex items-center gap-2 shadow-sm text-xs font-bold"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{t('planning.schedule_appointment_button')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 capitalize leading-none">{monthName}</h3>
            <div className="flex gap-1 bg-gray-50 rounded-xl p-1 border">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:text-gray-900 rounded-lg text-gray-400 transition-all shadow-xs">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:text-gray-900 rounded-lg text-gray-400 transition-all shadow-xs">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[
              t('planning.days.mon'),
              t('planning.days.tue'),
              t('planning.days.wed'),
              t('planning.days.thu'),
              t('planning.days.fri'),
              t('planning.days.sat'),
              t('planning.days.sun')
            ].map((d) => (
              <div key={d} className="text-center py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}

            {daysArray.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/30 rounded-2xl border border-dashed border-gray-100" />

              const dayServices = getServicesForDay(day)
              const dayEvents = getEventsForDay(day)
              const total = dayServices.length + dayEvents.length
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()

              return (
                <div
                  key={`day-${day}`}
                  className={`aspect-square rounded-2xl border p-2 flex flex-col justify-between transition-all overflow-hidden ${
                    isToday ? 'border-[#2c308e] bg-indigo-50/20' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-[#2c308e]' : 'text-gray-400'}`}>{day}</span>

                  <div className="space-y-1 overflow-hidden mt-1 flex-1 flex flex-col justify-end">
                    {dayServices.slice(0, 1).map((s) => {
                      const style = s.serviceId ? (CATEGORY_STYLES[s.serviceId.categorie] || DEFAULT_STYLE) : DEFAULT_STYLE
                      return (
                        <button
                          key={s._id}
                          onClick={() => setSelectedItem({ type: 'service', data: s })}
                          className={`w-full text-left p-1 text-[8px] font-bold rounded-lg truncate ${style.bg} ${style.border} ${style.bgHover} transition-colors border shrink-0`}
                        >
                          {s.creneau?.debut} {s.serviceId?.titre}
                        </button>
                      )
                    })}
                    {dayEvents.slice(0, dayServices.length > 0 ? 0 : 1).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedItem({ type: 'event', data: e })}
                        className={`w-full text-left p-1 text-[8px] font-bold rounded-lg truncate ${EVENT_STYLE.bg} ${EVENT_STYLE.border} ${EVENT_STYLE.bgHover} transition-colors border shrink-0`}
                      >
                        🎉 {e.titre}
                      </button>
                    ))}
                    {total > 1 && (
                      <span className="text-[7px] text-gray-400 text-center font-bold">{t('planning.other_count', { count: total - 1 })}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
              <span className="text-[10px] text-gray-400 font-medium">{t('planning.legend.services')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#2c308e]" />
              <span className="text-[10px] text-gray-400 font-medium">{t('planning.legend.events')}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 leading-none">{t('planning.upcoming.title')}</h3>

          <div className="space-y-3">
            {upcomingBookings.length === 0 && upcomingEvents.length === 0 ? (
              <div className="p-8 bg-white border border-dashed rounded-[2rem] text-center text-gray-400">
                <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-900">{t('planning.upcoming.empty_title')}</p>
                <p className="text-[10px] mt-1 leading-relaxed">
                  {t('planning.upcoming.empty_description')}
                </p>
              </div>
            ) : (
              <>
                {upcomingBookings.map((booking) => {
                  const other = getOtherParticipant(booking)
                  const bookingDate = new Date(booking.creneau!.date)
                  const monthShort = bookingDate.toLocaleDateString(i18n.language, { month: 'short' })
                  const dayNumber = bookingDate.getDate()
                  const style = booking.serviceId ? (CATEGORY_STYLES[booking.serviceId.categorie] || DEFAULT_STYLE) : DEFAULT_STYLE
                  return (
                    <Card
                      key={booking._id}
                      onClick={() => setSelectedItem({ type: 'service', data: booking })}
                      className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all p-4 cursor-pointer shadow-xs flex items-center gap-4 hover:-translate-y-0.5"
                    >
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex flex-col items-center justify-center border shrink-0">
                        <span className="text-xs font-extrabold text-[#2c308e] leading-none uppercase">{monthShort}</span>
                        <span className="text-lg font-extrabold text-gray-900 leading-none mt-0.5">{dayNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.bg} ${style.text}`}>{t('categories.' + booking.serviceId?.categorie)}</span>
                          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">{booking.creneau?.debut} - {booking.creneau?.fin}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 truncate mt-1">{booking.serviceId?.titre}</h4>
                        <p className="text-[9px] text-gray-400 truncate font-light">{t('planning.upcoming.voisin', { name: other?.name || t('planning.voisin_fallback') })}</p>
                      </div>
                    </Card>
                  )
                })}

                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.date)
                  const monthShort = eventDate.toLocaleDateString(i18n.language, { month: 'short' })
                  const dayNumber = eventDate.getDate()
                  const timeStr = eventDate.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
                  const isOrganizer = event.createurId === userId
                  return (
                    <Card
                      key={event.id}
                      onClick={() => setSelectedItem({ type: 'event', data: event })}
                      className="bg-white rounded-2xl border border-[#2c308e]/10 hover:border-[#2c308e]/30 transition-all p-4 cursor-pointer shadow-xs flex items-center gap-4 hover:-translate-y-0.5"
                    >
                      <div className="h-12 w-12 rounded-xl bg-[#e9eaf6] flex flex-col items-center justify-center border border-[#2c308e]/20 shrink-0">
                        <span className="text-xs font-extrabold text-[#2c308e] leading-none uppercase">{monthShort}</span>
                        <span className="text-lg font-extrabold text-[#2c308e] leading-none mt-0.5">{dayNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-[#e9eaf6] text-[#2c308e] border-[#2c308e]/20">
                            🎉 {t('categories.' + event.categorie)}
                          </span>
                          <span className="text-[8px] text-gray-400 font-bold">{timeStr}</span>
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 truncate mt-1">{event.titre}</h4>
                        <p className="text-[9px] text-gray-400 font-light">
                          {isOrganizer ? t('planning.organizer') : t('planning.participant')} · {event.participants.length}/{event.capacite}
                        </p>
                      </div>
                    </Card>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {selectedItem?.type === 'service' && (() => {
        const ev = selectedItem.data
        const service = ev.serviceId!
        const creneau = ev.creneau!
        const other = getOtherParticipant(ev)
        const dateStr = new Date(creneau.date).toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        const isCreator = typeof service.createurId === 'object' ? service.createurId.email === user?.email : service.createurId === user?.id
        const isProvider = service.type === 'demande' ? !isCreator : isCreator
        const isClient = service.type === 'demande' ? isCreator : !isCreator
        const prestationStatut = ev.prestationStatut || 'aucun'
        const realisationValidee = ev.realisationValidee || false

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl max-w-md w-full flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 relative">
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors z-10">
                <X className="h-4 w-4" />
              </button>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <Badge className="bg-[#e9eaf6] text-[#2c308e] text-[9px] font-bold uppercase tracking-wider px-3 py-1 border-0">
                    🪙 {service.gratuit ? t('planning.modal.free') : t('planning.modal.points', { count: service.points || 0 })}
                  </Badge>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                    {prestationStatut === 'valide' ? t('planning.status.scheduled') : prestationStatut === 'en_cours' ? t('planning.status.in_progress') : t('planning.status.completed')}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 leading-snug">{service.titre}</h3>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-light">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{t('planning.modal.from')} <strong>{creneau.debut}</strong> {t('planning.modal.to')} <strong>{creneau.fin}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('planning.modal.associated_neighbor')}</h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-gray-100">
                      <AvatarImage src={other?.picture} />
                      <AvatarFallback className="bg-[#2c308e] text-white">{other?.name?.charAt(0).toUpperCase() || 'V'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{other?.name || t('planning.voisin_fallback')}</p>
                      <p className="text-xs text-gray-400">{other?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  {prestationStatut === 'valide' && isProvider && (
                    <Button onClick={() => handleStart(ev)} className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-md flex items-center justify-center gap-2">
                      <Play className="h-4 w-4 fill-white" /><span>{t('planning.modal.start_button')}</span>
                    </Button>
                  )}
                  {prestationStatut === 'en_cours' && isProvider && (
                    <Button onClick={() => handleFinish(ev)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 text-xs font-bold shadow-md flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /><span>{t('planning.modal.complete_button')}</span>
                    </Button>
                  )}
                  {prestationStatut === 'termine' && !realisationValidee && isClient && (
                    <Button onClick={() => handleValidate(ev)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 text-xs font-bold shadow-md flex items-center justify-center gap-2">
                      <Award className="h-4 w-4" /><span>{t('planning.modal.validate_button')}</span>
                    </Button>
                  )}


                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setSelectedItem(null); navigate(`/messages?id=${ev._id}`) }} className="flex-1 rounded-xl py-5 text-xs font-semibold flex items-center justify-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-500" /><span>{t('planning.modal.write_neighbor_button')}</span>
                    </Button>
                    <Button variant="ghost" onClick={() => setSelectedItem(null)} className="rounded-xl px-4">{t('planning.modal.close_button')}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {selectedItem?.type === 'event' && (() => {
        const event = selectedItem.data
        const isOrganizer = event.createurId === userId
        const isParticipant = event.participants.includes(userId)
        const eventDate = new Date(event.date)
        const dateStr = eventDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const timeStr = eventDate.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
        const lieu = event.lieu?.adresse || event.lieu?.ville ? `${event.lieu.adresse ?? ''} ${event.lieu.ville ?? ''}`.trim() : null

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl max-w-md w-full flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 relative">
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors z-10">
                <X className="h-4 w-4" />
              </button>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <Badge className="bg-[#e9eaf6] text-[#2c308e] text-[9px] font-bold uppercase tracking-wider px-3 py-1 border-0">
                    🎉 {t('categories.' + event.categorie)}
                  </Badge>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                    isOrganizer
                      ? 'text-amber-600 bg-amber-50 border-amber-100'
                      : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                  }`}>
                    {isOrganizer ? t('planning.organizer') : t('planning.participant')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[#e9eaf6] flex items-center justify-center shrink-0">
                      <PartyPopper className="h-6 w-6 text-[#2c308e]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {event.titre}
                    </h3>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 font-light leading-relaxed">{event.description}</p>
                  )}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <CalendarIcon className="h-4 w-4 text-[#2c308e] shrink-0" />
                      <span className="capitalize">{t('planning.modal.event_date_time', { date: dateStr, time: timeStr })}</span>
                    </div>
                    {lieu && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-4 w-4 text-[#2c308e] shrink-0" />
                        <span>{lieu}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Users className="h-4 w-4 text-[#2c308e] shrink-0" />
                      <span>{t('planning.modal.participants_count', { count: event.participants.length, max: event.capacite })}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 flex gap-2">
                  {isParticipant && event.conversationId && (
                    <Button
                      onClick={() => { setSelectedItem(null); navigate(`/messages?id=${event.conversationId}`) }}
                      className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" /><span>{t('planning.modal.view_chat_button')}</span>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedItem(null)} className="rounded-xl px-4">{t('planning.modal.close_button')}</Button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
