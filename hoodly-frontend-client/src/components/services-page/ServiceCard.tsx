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
  Jardinage: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-100' },
  Bricolage: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-100' },
  Cours: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-100' },
  Garde: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-100' },
  Courses: { bg: 'bg-teal-50', text: 'text-teal-700 border-teal-100' },
  Animaux: { bg: 'bg-purple-50', text: 'text-purple-700 border-purple-100' }
}

interface ServiceCardProps {
  service: Service
  onSelect: (service: Service) => void
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const imageUrl = service.photoUrl || CATEGORY_IMAGES[service.categorie] || DEFAULT_IMAGE
  const categoryStyle = CATEGORY_STYLES[service.categorie] || { bg: 'bg-gray-50', text: 'text-gray-700 border-gray-100' }
  const creator = typeof service.createurId === 'object' ? service.createurId : null

  const getPriceLabel = () => {
    if (service.gratuit) return 'Gratuit'
    return `${service.points || 0} pts`
  }

  return (
    <Card className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group h-full">
      <div className="h-44 w-full relative overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={service.titre}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs border ${
            service.type === 'offre' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            {service.type === 'offre' ? 'Offre' : 'Demande'}
          </span>
          <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs border ${categoryStyle.bg} ${categoryStyle.text}`}>
            {service.categorie}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-xl shadow-2xs border border-gray-100">
          <span className="text-[10px] font-extrabold text-[#2c308e]">
            {getPriceLabel()}
          </span>
        </div>
      </div>

      <CardContent className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#2c308e] transition-colors leading-snug line-clamp-2 h-8">
            {service.titre}
          </h3>
          <p className="text-[10px] text-gray-400 font-light leading-relaxed line-clamp-2 h-7">
            {service.description}
          </p>

          <div className="pt-2 flex flex-col gap-1.5 text-[9px] text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>
                {service.recurrente ? 'Service récurrent (hebdomadaire)' : service.datePlanification ? `Le ${new Date(service.datePlanification).toLocaleDateString()}` : 'Date flexible'}
              </span>
            </div>
            {service.disponibilites && service.disponibilites.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="truncate max-w-[200px]">
                  {service.disponibilites.map(d => d.replace('semaine_', 'Semaine ')).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 border border-gray-100 shrink-0">
              <AvatarImage src={creator?.picture} alt={creator?.name} />
              <AvatarFallback className="bg-[#2c308e] text-white font-bold text-[8px]">
                {creator?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-gray-600 truncate font-semibold">
              {creator?.name || 'Voisin'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelect(service)}
            className="text-[10px] font-bold text-[#2c308e] hover:text-[#2c308e]/80 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            Détails
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
