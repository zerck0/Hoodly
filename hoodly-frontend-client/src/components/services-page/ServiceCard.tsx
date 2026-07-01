/* eslint-disable @typescript-eslint/no-explicit-any */
import { Calendar, Clock } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import type { Service } from '../../types/service.types'

const CATEGORY_IMAGES: Record<string, string> = {
  Jardinage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=600',
  Cours: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
  Bricolage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600',
  Garde: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=600',
  Courses: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
  Animaux: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600'
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1521791136368-1a8b27493fa9?auto=format&fit=crop&q=80&w=600'

const CATEGORY_STYLES: Record<string, { bg: string, text: string }> = {
  Jardinage: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' },
  Bricolage: { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900' },
  Cours: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900' },
  Garde: { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900' },
  Courses: { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900' },
  Animaux: { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900' }
}

const formatPlanification = (planif: string | undefined) => {
  if (!planif) return 'Date flexible'
  if (/[a-zA-Z]/.test(planif) || planif.includes(' ')) {
    return planif
  }
  const date = new Date(planif)
  if (!isNaN(date.getTime())) {
    return `Le ${date.toLocaleDateString()}`
  }
  return planif
}

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const imageUrl = service.photoUrl || CATEGORY_IMAGES[service.categorie] || DEFAULT_IMAGE
  const categoryStyle = CATEGORY_STYLES[service.categorie] || { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300 border-gray-100 dark:border-gray-700' }
  const creator = typeof service.createurId === 'object' ? service.createurId : null

  const getPriceLabel = () => {
    if (service.gratuit) return 'Gratuit'
    return `${service.points || 0} pts`
  }

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group h-full">
      <div className="h-44 w-full relative overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={service.titre}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs border ${
            service.type === 'offre' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900'
          }`}>
            {service.type === 'offre' ? 'Offre' : 'Demande'}
          </span>
          <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs border ${categoryStyle.bg} ${categoryStyle.text}`}>
            {service.categorie}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs px-3 py-1 rounded-xl shadow-2xs border border-gray-100 dark:border-gray-850">
          <span className="text-[10px] font-extrabold text-[#2c308e] dark:text-indigo-400">
            {getPriceLabel()}
          </span>
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#2c308e] dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2 h-8">
            {service.titre}
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-400 font-light leading-relaxed line-clamp-2 h-7">
            {service.description}
          </p>

          <div className="pt-2 flex flex-col gap-1.5 text-[9px] text-gray-400 dark:text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span>
                {service.recurrente ? 'Service récurrent (hebdomadaire)' : formatPlanification(service.datePlanification)}
              </span>
            </div>
            {service.disponibilites && service.disponibilites.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span className="truncate max-w-[200px]">
                  {service.disponibilites.map(d => d.replace('semaine_', 'Semaine ')).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-850 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 border border-gray-100 dark:border-gray-800 shrink-0">
              <AvatarImage src={creator?.picture} alt={creator?.name} />
              <AvatarFallback className="bg-[#2c308e] dark:bg-indigo-600 text-white font-bold text-[8px]">
                {creator?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate font-semibold">
              {creator?.name || 'Voisin'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelect(service)}
            className="text-[10px] font-bold text-[#2c308e] dark:text-indigo-400 hover:text-[#2c308e]/80 dark:hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            Détails
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
