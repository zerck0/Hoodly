/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { Calendar, Clock, X, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { servicesApi } from '../../services/api/services'
import { toast } from 'sonner'
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

interface ServiceDetailModalProps {
  service: Service | null
  isOpen: boolean
  onClose: () => void
  currentUser: any
  onOpenChat: (service: Service) => Promise<void>
  onActionComplete: () => void
}

export function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  currentUser,
  onOpenChat,
  onActionComplete
}: ServiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPoints, setEditPoints] = useState(10)
  const [editDatePlanification, setEditDatePlanification] = useState('')
  const [editRecurrente, setEditRecurrente] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  useEffect(() => {
    if (service) {
      setEditTitle(service.titre)
      setEditDescription(service.description)
      setEditCategory(service.categorie)
      setEditPoints(service.points ?? 10)
      setEditDatePlanification(service.datePlanification || '')
      setEditRecurrente(service.recurrente || false)
    }
    setIsEditing(false)
  }, [service, isOpen])

  if (!isOpen || !service) return null

  const isCreator = typeof service.createurId === 'object'
    ? service.createurId.email === currentUser?.email
    : service.createurId === currentUser?.id

  const creator = typeof service.createurId === 'object' ? service.createurId : null
  const imageUrl = service.photoUrl || CATEGORY_IMAGES[service.categorie] || DEFAULT_IMAGE

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingEdit(true)
    try {
      await servicesApi.update(service._id, {
        titre: editTitle,
        description: editDescription,
        categorie: editCategory,
        points: editPoints,
        recurrente: editRecurrente,
        datePlanification: editRecurrente ? undefined : editDatePlanification || undefined
      })
      toast.success('Annonce modifiée avec succès !')
      setIsEditing(false)
      onActionComplete()
    } catch {
      toast.error("Erreur lors de la modification de l'annonce.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
      try {
        await servicesApi.delete(service._id)
        toast.success('Annonce supprimée avec succès.')
        onClose()
        onActionComplete()
      } catch {
        toast.error('Erreur lors de la suppression de l\'annonce.')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-2xl max-w-lg w-full space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto relative no-scrollbar">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full p-2 transition-colors cursor-pointer z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                ✏️ Modifier l'annonce
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-light">
                Ajustez les détails de votre offre ou demande d'entraide.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Titre de l'annonce
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-10 w-full rounded-xl bg-gray-50 border border-gray-200 px-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Catégorie
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="h-10 w-full rounded-xl bg-gray-50 border border-gray-200 px-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all font-semibold"
                  >
                    <option value="Jardinage">Jardinage</option>
                    <option value="Bricolage">Bricolage</option>
                    <option value="Cours">Cours de soutien</option>
                    <option value="Garde">Garde d'enfants</option>
                    <option value="Courses">Courses & Livraison</option>
                    <option value="Animaux">Animaux & Promenades</option>
                  </select>
                </div>

                {!service.gratuit && (
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Valeur en points
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={editPoints}
                      onChange={(e) => setEditPoints(Number(e.target.value))}
                      className="h-10 w-full rounded-xl bg-gray-50 border border-gray-200 px-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 mt-2">
                <input
                  type="checkbox"
                  id="editRecurrente"
                  checked={editRecurrente}
                  onChange={(e) => setEditRecurrente(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#2c308e] focus:ring-[#2c308e]/30 cursor-pointer"
                />
                <label htmlFor="editRecurrente" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                  Service récurrent hebdomadaire
                </label>
              </div>

              {!editRecurrente && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    value={editDatePlanification}
                    onChange={(e) => setEditDatePlanification(e.target.value)}
                    className="h-10 w-full rounded-xl bg-gray-50 border border-gray-200 px-3 text-xs outline-none focus:bg-white focus:border-[#2c308e] transition-all font-semibold"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl h-10 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSavingEdit}
                className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl h-10 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center"
              >
                {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="h-48 w-full rounded-[2rem] overflow-hidden relative shadow-2xs border border-gray-100 shrink-0">
              <img
                src={imageUrl}
                alt={service.titre}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs border ${
                  service.type === 'offre' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {service.type === 'offre' ? 'Offre' : 'Demande'}
                </span>
                <span className="text-[8px] font-bold bg-white text-indigo-700 border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  {service.categorie}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl shadow-2xs border border-gray-100">
                <span className="text-xs font-extrabold text-[#2c308e]">
                  {service.gratuit ? 'Gratuit' : `${service.points || 0} points`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                {service.titre}
              </h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-[2rem] bg-gray-50 border border-gray-100/50 text-[10px] text-gray-500 font-semibold font-sans">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-[#2c308e]" />
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Date planifiée</span>
                  <span>
                    {service.recurrente ? 'Hebdomadaire (Récurrent)' : service.datePlanification ? new Date(service.datePlanification).toLocaleDateString() : 'Flexible'}
                  </span>
                </div>
              </div>
              {service.disponibilites && service.disponibilites.length > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-[#2c308e]" />
                  <div>
                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Disponibilités</span>
                    <span className="truncate max-w-[150px] block">
                      {service.disponibilites.map(d => d.replace('semaine_', 'Semaine ')).join(', ')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-100">
                  <AvatarImage src={creator?.picture} alt={creator?.name} />
                  <AvatarFallback className="bg-[#2c308e] text-white font-bold text-sm">
                    {creator?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Proposé par</span>
                  <span className="text-xs text-gray-900 font-bold">{creator?.name || 'Voisin'}</span>
                </div>
              </div>

              {!isCreator && (
                <div className="text-right text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-xl font-bold uppercase tracking-wider">
                  🤝 Quartier Hoodly
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              {isCreator ? (
                <>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl h-11 text-xs font-bold shadow-md cursor-pointer"
                  >
                    Modifier l'annonce
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex-1 rounded-xl h-11 text-xs font-bold shadow-md cursor-pointer"
                  >
                    Supprimer l'annonce
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={() => onOpenChat(service)}
                  className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl h-11 text-xs font-extrabold shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  💬 Contacter le voisin
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
