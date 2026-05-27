/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'
import { Button } from '../ui/button'

interface SchedulerModalProps {
  isOpen: boolean
  onClose: () => void
  activeConversation: any
  conversations: any[]
  onProposeSlot: (params: { id: string; date: string; debut: string; fin: string }) => Promise<void>
  isProposing: boolean
}

export function SchedulerModal({
  isOpen,
  onClose,
  activeConversation,
  conversations,
  onProposeSlot,
  isProposing
}: SchedulerModalProps) {
  const [slotDate, setSlotDate] = useState('')
  const [slotStart, setSlotStart] = useState('')
  const [slotEnd, setSlotEnd] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSlotDate(new Date().toISOString().split('T')[0])
      setSlotStart('')
      setSlotEnd('')
    }
  }, [isOpen])

  useEffect(() => {
    setSlotStart('')
    setSlotEnd('')
  }, [slotDate])

  if (!isOpen || !activeConversation) return null

  const formatDateToYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const parseLocalDateParts = (dateStr: string) => {
    const normalized = dateStr.replace(/\//g, '-')
    const parts = normalized.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return null

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
    const service = activeConversation?.serviceId
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

    if (propDateStr < todayStr) return false

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
    if (!dateStr || !start || !end || !activeConversation) return null

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return null

    const propDateStr = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`

    const providerId = activeConversation.participants.find((p: any) => p.email !== activeConversation.serviceId?.createurId?.email)?._id

    if (!providerId) return null

    const providerConvs = conversations.filter(c => {
      const isProv = c.participants.some((p: any) => p._id === providerId)
      return isProv && c._id !== activeConversation._id && c.creneau && c.creneau.statut === 'confirme'
    })

    const timeToNumber = (t: string) => Number(t.replace(':', ''))

    for (const pc of providerConvs) {
      if (!pc.creneau || !pc.creneau.date) continue
      const pcParts = parseLocalDateParts(pc.creneau.date)
      if (!pcParts) continue
      const pcDateStr = `${pcParts.year}-${String(pcParts.month).padStart(2, '0')}-${String(pcParts.day).padStart(2, '0')}`

      if (pcDateStr === propDateStr) {
        const s1 = timeToNumber(start)
        const e1 = timeToNumber(end)
        const s2 = timeToNumber(pc.creneau.debut)
        const e2 = timeToNumber(pc.creneau.fin)

        const overlap = Math.max(s1, s2) < Math.min(e1, e2)
        if (overlap) {
          const otherNeighbor = pc.participants.find((p: any) => p._id !== providerId)
          return { neighborName: otherNeighbor?.name || 'Un autre voisin', debut: pc.creneau.debut, fin: pc.creneau.fin }
        }
      }
    }
    return null
  }

  const getEndTime = (startTime: string) => {
    if (!startTime) return ''
    const [h, m] = startTime.split(':').map(Number)
    const endH = (h + 1) % 24
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getAvailableTimeSlots = (dateStr: string) => {
    const morningSlots = [
      { start: '08:00', label: '8h00 - 9h00' },
      { start: '09:00', label: '9h00 - 10h00' },
      { start: '10:00', label: '10h00 - 11h00' },
      { start: '11:00', label: '11h00 - 12h00' }
    ]
    const afternoonSlots = [
      { start: '14:00', label: '14h00 - 15h00' },
      { start: '15:00', label: '15h00 - 16h00' },
      { start: '16:00', label: '16h00 - 17h00' },
      { start: '17:00', label: '17h00 - 18h00' }
    ]
    const eveningSlots = [
      { start: '18:00', label: '18h00 - 19h00' },
      { start: '19:00', label: '19h00 - 20h00' },
      { start: '20:00', label: '20h00 - 21h00' },
      { start: '21:00', label: '21h00 - 22h00' }
    ]

    const service = activeConversation?.serviceId
    if (!service || service.type !== 'offre' || !service.disponibilites || service.disponibilites.length === 0) {
      return [...morningSlots, ...afternoonSlots, ...eveningSlots]
    }

    const parts = parseLocalDateParts(dateStr)
    if (!parts) return []

    const dateObj = new Date(parts.year, parts.month - 1, parts.day)
    const dayOfWeek = dateObj.getDay()

    let slots: any[] = []

    if (dayOfWeek === 6 || dayOfWeek === 0) {
      slots = [...morningSlots, ...afternoonSlots, ...eveningSlots]
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

  const handlePropose = async () => {
    if (!slotDate || !slotStart || !slotEnd) return
    await onProposeSlot({ id: activeConversation._id, date: slotDate, debut: slotStart, fin: slotEnd })
  }

  const timeSlots = getAvailableTimeSlots(slotDate)
  const isDateAvail = getIsDateAvailable(slotDate)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-sm w-full space-y-6 animate-in zoom-in-95 duration-200 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            📅 Planifier un rendez-vous
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-light leading-relaxed">
            Sélectionnez un créneau d'une heure. Woodly s'assure du respect des disponibilités et des conflits de planning.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Date du rendez-vous
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                min={formatDateToYYYYMMDD(new Date())}
                className="h-11 w-full rounded-2xl bg-gray-50 border border-gray-200 pl-11 pr-4 text-xs outline-none focus:bg-white focus:border-[#2c308e] focus:ring-1 focus:ring-[#2c308e]/10 transition-all font-semibold"
              />
            </div>
          </div>

          {!isDateAvail ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-[10px] text-rose-700 leading-relaxed font-semibold">
              ⚠️ Le prestataire n'est pas disponible ce jour-là. Veuillez choisir un autre jour.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Créneaux horaires disponibles
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {timeSlots.map((ts) => {
                    const isValid = getIsTimeSlotValid(slotDate, ts.start)
                    const clashing = getClashingBooking(slotDate, ts.start, getEndTime(ts.start))
                    const isSelected = slotStart === ts.start

                    return (
                      <button
                        key={ts.start}
                        type="button"
                        disabled={!isValid || !!clashing}
                        onClick={() => {
                          setSlotStart(ts.start)
                          setSlotEnd(getEndTime(ts.start))
                        }}
                        className={`p-2.5 rounded-xl border text-[10px] font-semibold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2c308e] border-[#2c308e] text-white shadow-xs'
                            : !isValid
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through'
                            : clashing
                            ? 'bg-amber-50/50 border-amber-100 text-amber-500 hover:bg-amber-50'
                            : 'bg-white border-gray-200/80 text-gray-700 hover:border-[#2c308e] hover:text-[#2c308e]'
                        }`}
                        title={clashing ? `Conflit avec un rendez-vous déjà planifié` : ''}
                      >
                        {ts.label}
                        {clashing && <span className="block text-[7px] text-amber-600 font-bold mt-0.5">⚠️ Occupé</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {slotStart && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-800 leading-relaxed font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span>⏰ Horaire sélectionné :</span>
                    <strong className="font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100 shadow-2xs">
                      {slotStart} - {slotEnd}
                    </strong>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-5 text-xs font-semibold h-11 cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handlePropose}
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
    </div>
  )
}
