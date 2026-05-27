import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useServices } from '../hooks/useServices'
import { useConversations } from '../hooks/useConversations'
import { servicesApi } from '../services/api/services'
import {
  Plus,
  Search,
  Map as MapIcon,
  ArrowRight,
  HeartHandshake,
  Filter,
  X,
  Wrench,
  Sprout,
  BookOpen,
  Baby,
  ShoppingBag,
  Dog,
  Loader2,
  Calendar,
  Clock,
  User
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar'
import { toast } from 'sonner'
import type { Service } from '../types/service.types'

const CATEGORIES = [
  { name: 'Tous les services', value: 'Tous' },
  { name: 'Jardinage', value: 'Jardinage', icon: Sprout },
  { name: 'Bricolage', value: 'Bricolage', icon: Wrench },
  { name: 'Cours', value: 'Cours', icon: BookOpen },
  { name: 'Garde', value: 'Garde', icon: Baby },
  { name: 'Courses', value: 'Courses', icon: ShoppingBag },
  { name: 'Animaux', value: 'Animaux', icon: Dog }
]

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

export default function ServicesPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [searchParamsRoute, setSearchParams] = useSearchParams()
  const filterParam = searchParamsRoute.get('filter') || 'local'

  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<'tous' | 'offre' | 'demande'>('tous')
  const [filterTarif, setFilterTarif] = useState<'tous' | 'gratuit' | 'payant'>('tous')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPoints, setEditPoints] = useState(10)
  const [editDatePlanification, setEditDatePlanification] = useState('')
  const [editRecurrente, setEditRecurrente] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const handleStartEdit = (service: Service) => {
    setEditTitle(service.titre)
    setEditDescription(service.description)
    setEditCategory(service.categorie)
    setEditPoints(service.points ?? 10)
    setEditDatePlanification(service.datePlanification || '')
    setEditRecurrente(service.recurrente || false)
    setIsEditing(true)
  }

  const handleCloseDetail = () => {
    setSelectedService(null)
    setIsEditing(false)
  }

  const searchParams = {
    zoneId: user?.zoneId,
    search: searchText || undefined,
    categorie: activeCategory !== 'Tous' ? activeCategory : undefined,
    type: filterParam === 'local' ? (filterType !== 'tous' ? filterType : undefined) : undefined,
    limit: 50
  }

  const { services, isLoading } = useServices(searchParams)
  const { startConversation, isStarting } = useConversations()

  const activeService = selectedService
    ? (services.find(s => s._id === selectedService._id) || selectedService)
    : null

  const filteredServices = services.filter(service => {
    const isCreator = typeof service.createurId === 'object'
      ? service.createurId.email === user?.email
      : service.createurId === user?.id

    const isFinishedPonctuel = service.statut === 'termine' && !service.recurrente
    if (isFinishedPonctuel) return false

    if (filterParam === 'local' && isCreator) return false
    if (filterParam === 'mine' && !isCreator) return false

    if (filterTarif === 'gratuit' && !service.gratuit) return false
    if (filterTarif === 'payant' && service.gratuit) return false
    return true
  })

  const getPriceBadge = (service: Service) => {
    if (service.gratuit) {
      return 'Gratuit'
    }
    return `${service.points || 0} pts`
  }

  const handleOpenChat = async (service: Service) => {
    const isCreator = typeof service.createurId === 'object'
      ? service.createurId.email === user?.email
      : service.createurId === user?.id

    const creator = typeof service.createurId === 'object' ? service.createurId : null
    const creatorId = creator?.id || creator?._id || (service.createurId as string)

    const responder = typeof service.responderId === 'object' ? service.responderId : null
    const responderId = responder?.id || responder?._id || (service.responderId as string)

    const destinataireId = isCreator ? responderId : creatorId

    if (!destinataireId) {
      toast.error("Impossible d'ouvrir la discussion : aucun voisin n'est associé à cette action.")
      return
    }

    try {
      setSelectedService(null)
      const conv = await startConversation({
        serviceId: service._id,
        destinataireId
      })
      navigate(`/messages?id=${conv._id}`)
    } catch {
      toast.error('Impossible d\'ouvrir la messagerie.')
    }
  }

  const renderDetailModalActions = (service: Service) => {
    const isCreator = typeof service.createurId === 'object'
      ? service.createurId.email === user?.email
      : service.createurId === user?.id

    const isResponder = typeof service.responderId === 'object'
      ? service.responderId?.email === user?.email
      : service.responderId === user?.id

    if (isCreator) {
      if (service.statut === 'actif') {
        return (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-2 w-full">
              <Button
                onClick={() => handleStartEdit(service)}
                className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-sm"
              >
                Modifier l'annonce
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
                    try {
                      await servicesApi.delete(service._id)
                      toast.success('Annonce supprimée avec succès')
                      handleCloseDetail()
                      window.location.reload()
                    } catch {
                      toast.error('Erreur lors de la suppression')
                    }
                  }
                }}
                className="flex-1 rounded-xl py-5 text-xs font-bold"
              >
                Supprimer l'annonce
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center leading-normal">
              Annonce active, en attente de réponses de vos voisins.
            </p>
          </div>
        )
      }

      if (service.statut === 'en_cours') {
        return (
          <Button
            onClick={() => handleOpenChat(service)}
            className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-md"
          >
            Ouvrir la discussion avec l'intervenant
          </Button>
        )
      }

      if (service.statut === 'termine') {
        return (
          <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-center rounded-xl py-3.5 text-xs font-bold">
            ✓ Service accompli et validé
          </div>
        )
      }
    } else {
      if (service.statut === 'actif') {
        return (
          <Button
            onClick={() => handleOpenChat(service)}
            className="w-full bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-md"
          >
            Contacter le voisin
          </Button>
        )
      }

      if (service.statut === 'en_cours') {
        if (isResponder) {
          return (
            <Button
              onClick={() => handleOpenChat(service)}
              className="w-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl py-5 text-xs font-bold shadow-sm"
            >
              Ouvrir la discussion (En cours)
            </Button>
          )
        }
        return (
          <div className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-center rounded-xl py-3.5 text-xs font-bold">
            Ce service est actuellement en cours de réalisation
          </div>
        )
      }

      if (service.statut === 'termine') {
        return (
          <div className="w-full bg-gray-50 border border-gray-200 text-gray-500 text-center rounded-xl py-3.5 text-xs font-bold">
            Ce service est clôturé (Terminé)
          </div>
        )
      }
    }

    return null
  }

  return (
    <div className="relative p-6 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Services &amp; Entraide
          </h1>
          <p className="text-gray-500 mt-1 max-w-2xl text-sm leading-relaxed font-light">
            {filterParam === 'mine'
              ? 'Consultez et gérez vos annonces d\'offres et de demandes d\'entraide publiées dans votre quartier.'
              : 'Trouvez ou proposez de l\'aide au sein de votre communauté. Échangez des points contre de l\'expertise et renforcez les liens de votre quartier.'}
          </p>
        </div>

        <Link to="/services/nouveau" className="self-start sm:self-center shrink-0">
          <Button className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-full px-6 py-5 flex items-center gap-2 shadow-md transition-all hover:scale-102">
            <Plus className="h-5 w-5" />
            <span className="font-semibold text-sm">Créer une annonce</span>
          </Button>
        </Link>
      </div>

      <div className="flex justify-center sm:justify-start mb-6">
        <div className="bg-[#e9eaf6]/40 p-1 rounded-2xl flex gap-1 border border-gray-200/50 backdrop-blur-sm shadow-inner max-w-md w-full sm:w-auto relative animate-in fade-in duration-300">
          <button
            onClick={() => setSearchParams({ filter: 'local' })}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              filterParam === 'local'
                ? 'bg-white text-[#2c308e] shadow-sm border border-gray-200/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5 text-[#2c308e]" />
            Services locaux
          </button>
          <button
            onClick={() => setSearchParams({ filter: 'mine' })}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              filterParam === 'mine'
                ? 'bg-white text-[#2c308e] shadow-sm border border-gray-200/20'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            <User className="h-3.5 w-3.5 text-[#2c308e]" />
            Mes services
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Recherche du jardinage, des cours ou de l'aide au déménagement..."
          className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm outline-none shadow-sm transition-all focus:border-[#2c308e] focus:ring-2 focus:ring-[#2c308e]/10"
        />
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  activeCategory === cat.value
                    ? 'bg-[#2c308e] text-white border-[#2c308e] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full px-4 h-9 flex items-center gap-2 text-xs font-semibold ${
              showFilters ? 'bg-gray-100 text-gray-900 border-gray-300' : 'text-gray-600 border-gray-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Plus de filtres</span>
            {(filterType !== 'tous' || filterTarif !== 'tous') && (
              <span className="h-2 w-2 rounded-full bg-[#2c308e]" />
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type d'annonce</label>
              <div className="flex gap-2">
                {(['tous', 'offre', 'demande'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      filterType === t
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'tous' ? 'Tous' : t === 'offre' ? 'Offres' : 'Demandes'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tarification</label>
              <div className="flex gap-2">
                {(['tous', 'gratuit', 'payant'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterTarif(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      filterTarif === p
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'tous' ? 'Toutes' : p === 'gratuit' ? 'Gratuit' : 'Payant en Points'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-[380px] rounded-3xl bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-300 text-center h-[340px]">
            <HeartHandshake className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Aucun service trouvé</h3>
          </div>

          <Card className="bg-[#1f224e] border-0 text-white rounded-[2rem] overflow-hidden flex flex-col justify-between p-8 h-[340px] relative shadow-lg">
            <div className="absolute right-4 top-4 text-white/10">
              <HeartHandshake className="h-32 w-32" />
            </div>
            <div className="z-10">
              <h3 className="text-2xl font-bold tracking-tight leading-snug">Besoin d'autre chose ?</h3>
              <p className="text-white/80 text-sm mt-4 leading-relaxed font-light">
                Vous ne trouvez pas le service spécifique que vous recherchez ? Publiez une demande sur le tableau communautaire.
              </p>
            </div>
            <Link to="/services/nouveau?type=demande" className="z-10">
              <button className="w-full bg-white hover:bg-gray-100 text-[#1f224e] font-bold text-sm rounded-2xl py-3.5 transition-colors shadow-sm">
                Publier une demande
              </button>
            </Link>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const catStyle = CATEGORY_STYLES[service.categorie] || { bg: 'bg-gray-50', text: 'text-gray-700' }
            const coverImage = service.photoUrl || CATEGORY_IMAGES[service.categorie] || DEFAULT_IMAGE
            const creator = typeof service.createurId === 'object' ? service.createurId : null

            return (
              <Card
                key={service._id}
                onClick={() => setSelectedService(service)}
                className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-[380px] hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative h-44 overflow-hidden shrink-0">
                  <img
                    src={coverImage}
                    alt={service.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-[#1f224e] text-white text-xs font-bold rounded-full px-3 py-1.5 shadow-md">
                    {getPriceBadge(service)}
                  </div>
                </div>

                <CardContent className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <div className="mb-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text}`}>
                        {service.categorie}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 line-clamp-1 mb-2">
                      {service.titre}
                    </h3>

                    <p className="text-gray-500 text-xs font-light leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 shrink-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Avatar className="h-8 w-8 border border-gray-100 shrink-0">
                        <AvatarImage src={creator?.picture} alt={creator?.name || "Avatar"} />
                        <AvatarFallback className="bg-[#2c308e] text-white text-xs">
                          {creator?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {creator?.name || 'Voisin'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {service.statut === 'actif' ? 'Disponible' : service.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                        </p>
                      </div>
                    </div>

                    <button
                      className="h-8 w-8 rounded-full bg-gray-50 hover:bg-[#e9eaf6] text-gray-400 hover:text-[#2c308e] flex items-center justify-center transition-colors shrink-0 group-hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedService(service)
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredServices.length > 0 && (
            <Card className="bg-[#1f224e] border-0 text-white rounded-[2rem] overflow-hidden flex flex-col justify-between p-8 h-[380px] relative shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="absolute right-4 top-4 text-white/5">
                <HeartHandshake className="h-36 w-36" />
              </div>
              <div className="z-10">
                <h3 className="text-2xl font-bold tracking-tight leading-snug">Besoin d'autre chose ?</h3>
                <p className="text-white/80 text-sm mt-4 leading-relaxed font-light">
                  Vous ne trouvez pas le service spécifique que vous recherchez ? Publiez une demande sur le tableau communautaire.
                </p>
              </div>
              <Link to="/services/nouveau?type=demande" className="z-10">
                <button className="w-full bg-white hover:bg-gray-100 text-[#1f224e] font-bold text-sm rounded-2xl py-3.5 transition-colors shadow-sm">
                  Publier une demande
                </button>
              </Link>
            </Card>
          )}
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => navigate('/map')}
          className="bg-white hover:bg-gray-50 text-[#1f224e] hover:text-[#2c308e] border border-gray-200/80 rounded-full px-6 py-5 flex items-center gap-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl font-semibold text-xs"
        >
          <MapIcon className="h-4 w-4 text-[#2c308e]" />
          <span>Voir la carte locale</span>
        </Button>
      </div>

      {activeService && (
        <div
          onClick={handleCloseDetail}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            {isEditing ? (
              <div className="p-8 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Modifier mon annonce
                  </h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Titre de l'annonce</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c308e] focus:bg-white transition-all"
                      placeholder="Ex: Tonte de pelouse..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c308e] focus:bg-white transition-all resize-none font-light leading-relaxed"
                      placeholder="Décrivez les détails de votre annonce..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Catégorie</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c308e] focus:bg-white transition-all cursor-pointer font-medium"
                      >
                        {CATEGORIES.filter(c => c.value !== 'Tous').map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {!activeService.gratuit && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Points</label>
                        <input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c308e] focus:bg-white transition-all"
                        />
                      </div>
                    )}
                  </div>

                  {activeService.type === 'offre' ? (
                    <div className="flex items-center gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="editRecurrente"
                        checked={editRecurrente}
                        onChange={(e) => setEditRecurrente(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#2c308e] focus:ring-[#2c308e]/30 cursor-pointer"
                      />
                      <label htmlFor="editRecurrente" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        🔄 Ce service est récurrent / régulier
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Planification</label>
                      <input
                        type="text"
                        value={editDatePlanification}
                        onChange={(e) => setEditDatePlanification(e.target.value)}
                        className="w-full h-11 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2c308e] focus:bg-white transition-all"
                        placeholder="Ex: Dès que possible, ou une date"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-5 border-t border-gray-100">
                  <Button
                    onClick={async () => {
                      if (!editTitle.trim() || !editDescription.trim()) {
                        toast.error('Veuillez remplir le titre et la description')
                        return
                      }
                      try {
                        setIsSavingEdit(true)
                        await servicesApi.update(activeService._id, {
                          titre: editTitle,
                          description: editDescription,
                          categorie: editCategory,
                          points: activeService.gratuit ? undefined : editPoints,
                          recurrente: activeService.type === 'offre' ? editRecurrente : undefined,
                          datePlanification: activeService.type === 'demande' ? editDatePlanification : undefined
                        })
                        toast.success('Annonce modifiée avec succès')
                        handleCloseDetail()
                        window.location.reload()
                      } catch {
                        toast.error('Erreur lors de la modification')
                      } finally {
                        setIsSavingEdit(false)
                      }
                    }}
                    disabled={isSavingEdit}
                    className="flex-1 bg-[#2c308e] hover:bg-[#2c308e]/95 text-white rounded-xl py-5 text-xs font-bold shadow-md transition-all"
                  >
                    {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-xl py-5 text-xs font-bold border-gray-200 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative h-56 shrink-0 bg-gray-100">
                  <img
                    src={activeService.photoUrl || CATEGORY_IMAGES[activeService.categorie] || DEFAULT_IMAGE}
                    alt={activeService.titre}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleCloseDetail}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-4 left-4 bg-[#1f224e] text-white text-xs font-bold rounded-full px-3 py-1.5 shadow-md">
                    {getPriceBadge(activeService)}
                  </div>
                </div>

                <div className="p-8 overflow-y-auto space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        CATEGORY_STYLES[activeService.categorie]?.bg || 'bg-gray-50'
                      } ${CATEGORY_STYLES[activeService.categorie]?.text || 'text-gray-700'}`}>
                        {activeService.categorie}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        activeService.type === 'offre'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {activeService.type === 'offre' ? 'Offre' : 'Demande'}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      activeService.statut === 'actif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : activeService.statut === 'en_cours'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}>
                      {activeService.statut === 'actif'
                        ? 'Disponible'
                        : activeService.statut === 'en_cours'
                        ? 'En cours'
                        : activeService.statut === 'termine'
                        ? 'Terminé'
                        : 'Annulé'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                      {activeService.titre}
                    </h2>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed font-light whitespace-pre-line">
                      {activeService.description}
                    </p>
                  </div>

                  {activeService.type === 'offre' ? (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fréquence :</span>
                        {activeService.recurrente ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            🔄 Récurrent / Régulier
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            📍 Ponctuel
                          </span>
                        )}
                      </div>
                      {activeService.disponibilites && activeService.disponibilites.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            Disponibilités
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {activeService.disponibilites.map((dispoKey) => {
                              const labels: Record<string, string> = {
                                semaine_matin: 'Matinée',
                                semaine_aprem: 'Après-midi',
                                semaine_soir: 'Soirée',
                                samedi: 'Samedi',
                                dimanche: 'Dimanche'
                              }
                              return (
                                <span
                                  key={dispoKey}
                                  className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                >
                                  {labels[dispoKey] || dispoKey}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        Planification prévue
                      </h4>
                      {activeService.datePlanification && (
                        <div className="flex items-center gap-2">
                          {activeService.datePlanification.includes('Dès que possible') || isNaN(Date.parse(activeService.datePlanification)) ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              ⚡ {activeService.datePlanification}
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              📅 {new Date(activeService.datePlanification).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

=                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Publié par</h4>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarImage src={typeof activeService.createurId === 'object' ? activeService.createurId.picture : undefined} />
                        <AvatarFallback className="bg-[#2c308e] text-white">
                          {typeof activeService.createurId === 'object' ? activeService.createurId.name?.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {typeof activeService.createurId === 'object' ? activeService.createurId.name : 'Voisin'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {typeof activeService.createurId === 'object' ? activeService.createurId.email : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeService.responderId && (
                    <div className="border-t border-gray-100 pt-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        {activeService.type === 'offre' ? 'Bénéficiaire' : 'Intervenant'}
                      </h4>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-gray-100">
                          <AvatarImage src={typeof activeService.responderId === 'object' ? activeService.responderId.picture : undefined} />
                          <AvatarFallback className="bg-emerald-600 text-white">
                            {typeof activeService.responderId === 'object' ? activeService.responderId.name?.charAt(0).toUpperCase() : 'V'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {typeof activeService.responderId === 'object' ? activeService.responderId.name : 'Voisin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {typeof activeService.responderId === 'object' ? activeService.responderId.email : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-6">
                    {renderDetailModalActions(activeService)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isStarting && (
        <div className="fixed inset-0 bg-white/65 backdrop-blur-xs z-50 flex items-center justify-center flex-col">
          <Loader2 className="h-8 w-8 text-[#2c308e] animate-spin" />
          <p className="text-xs font-bold mt-3 text-gray-900">Initialisation de la messagerie...</p>
        </div>
      )}
    </div>
  )
}
