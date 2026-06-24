import { useState, useRef } from 'react'
import { X, Heart, MapPin, Users, Calendar } from 'lucide-react'
import type { Event } from '../../types/event.types'

const CATEGORY_COLORS: Record<string, string> = {
  Sport: 'bg-green-100 text-green-700',
  Culture: 'bg-purple-100 text-purple-700',
  Cuisine: 'bg-orange-100 text-orange-700',
  Jardinage: 'bg-lime-100 text-lime-700',
  Musique: 'bg-pink-100 text-pink-700',
  Collecte: 'bg-blue-100 text-blue-700',
  Autre: 'bg-gray-100 text-gray-600',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Sport: '⚽',
  Culture: '🎨',
  Cuisine: '🍳',
  Jardinage: '🌱',
  Musique: '🎵',
  Collecte: '🤝',
  Autre: '✨',
}

const SWIPE_THRESHOLD = 80

interface SwipeCardProps {
  event: Event
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function SwipeCard({ event, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null)
  const startXRef = useRef(0)

  const colorClass = CATEGORY_COLORS[event.categorie] ?? CATEGORY_COLORS['Autre']
  const emoji = CATEGORY_EMOJIS[event.categorie] ?? '✨'

  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const lieu = event.lieu?.ville || event.lieu?.adresse || 'Lieu à définir'
  const placesLeft = event.capacite - event.participants.length

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (exitDir) return
    setExitDir(dir)
    setDragX(0)
    if (dir === 'right') onSwipeRight()
    else onSwipeLeft()
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (exitDir) return
    startXRef.current = e.clientX
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || exitDir) return
    setDragX(e.clientX - startXRef.current)
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > SWIPE_THRESHOLD) triggerSwipe('right')
    else if (dragX < -SWIPE_THRESHOLD) triggerSwipe('left')
    else setDragX(0)
  }

  const rotation = isDragging ? dragX * 0.07 : 0

  const cardStyle: React.CSSProperties = exitDir
    ? {
        transform: exitDir === 'right'
          ? 'translateX(150%) rotate(20deg)'
          : 'translateX(-150%) rotate(-20deg)',
        opacity: 0,
        transition: 'transform 350ms ease, opacity 350ms ease',
      }
    : {
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        opacity: 1,
        transition: isDragging ? 'none' : 'transform 300ms ease',
      }

  const showInterested = dragX > 40 || exitDir === 'right'
  const showPass = dragX < -40 || exitDir === 'left'

  return (
    <div className="relative flex flex-col items-center select-none">
      <div
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ ...cardStyle, minHeight: 460, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {event.photoUrl ? (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={event.photoUrl} alt={event.titre} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
            <span className={`absolute bottom-3 left-4 px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
              {event.categorie}
            </span>
          </div>
        ) : (
          <div className="bg-linear-to-br from-[#2c308e]/10 to-[#2c308e]/5 p-8 pb-6 flex flex-col items-center gap-3">
            <span className="text-6xl">{emoji}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
              {event.categorie}
            </span>
          </div>
        )}

        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-[#1e224e] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {event.titre}
          </h2>

          {event.description && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-[#2c308e] shrink-0" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-[#2c308e] shrink-0" />
              <span>{lieu}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-[#2c308e] shrink-0" />
              <span>
                {event.participants.length}/{event.capacite} inscrits
                {placesLeft > 0
                  ? ` · ${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}`
                  : ' · Complet'}
              </span>
            </div>
          </div>
        </div>

        {showInterested && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 pointer-events-none">
            <div className="border-4 border-green-500 rounded-xl px-6 py-2 -rotate-12">
              <span className="text-green-500 font-black text-2xl tracking-widest">INTÉRESSÉ</span>
            </div>
          </div>
        )}
        {showPass && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 pointer-events-none">
            <div className="border-4 border-red-400 rounded-xl px-6 py-2 rotate-12">
              <span className="text-red-400 font-black text-2xl tracking-widest">PASSER</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-8 mt-8">
        <button
          onClick={() => triggerSwipe('left')}
          disabled={!!exitDir}
          className="h-16 w-16 rounded-full bg-white border-2 border-gray-200 shadow-md flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => triggerSwipe('right')}
          disabled={!!exitDir}
          className="h-16 w-16 rounded-full bg-[#2c308e] shadow-md flex items-center justify-center text-white hover:bg-[#2c308e]/90 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Heart className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </div>

      <p className="mt-4 text-[11px] text-gray-400">Glisse ou utilise les boutons</p>
    </div>
  )
}
