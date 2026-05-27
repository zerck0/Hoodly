import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useServices } from '../hooks/useServices'
import { useConversations } from '../hooks/useConversations'
import { Plus, HeartHandshake, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Service } from '../types/service.types'

import { ServiceCard } from '../components/services-page/ServiceCard'
import { ServiceFilters } from '../components/services-page/ServiceFilters'
import { ServiceDetailModal } from '../components/services-page/ServiceDetailModal'
import { PromoCTA } from '../components/services-page/PromoCTA'

export default function ServicesPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [searchParamsRoute, setSearchParamsRoute] = useSearchParams()
  const filterParam = searchParamsRoute.get('filter') || 'local'

  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tous')
  const [filterType, setFilterType] = useState<'tous' | 'offre' | 'demande'>('tous')
  const [filterTarif, setFilterTarif] = useState<'tous' | 'gratuit' | 'payant'>('tous')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const searchParams = {
    zoneId: user?.zoneId,
    search: searchText || undefined,
    categorie: activeCategory !== 'Tous' ? activeCategory : undefined,
    type: filterParam === 'local' ? (filterType !== 'tous' ? filterType : undefined) : undefined,
    limit: 50
  }

  const { services, isLoading, refetch } = useServices(searchParams)
  const { startConversation } = useConversations()

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
      toast.error("Impossible d'ouvrir la messagerie.")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {filterParam === 'mine' ? 'Mes annonces d\'entraide' : 'Entraide du quartier'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-light leading-relaxed">
            {filterParam === 'mine'
              ? 'Gérez vos offres de services déposées et vos demandes d\'aide en cours.'
              : 'Découvrez les services proposés par vos voisins ou publiez un besoin d\'entraide.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/50 text-[10px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setSearchParamsRoute({ filter: 'local' })}
              className={`py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                filterParam === 'local' ? 'bg-white text-[#2c308e] shadow-3xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Services locaux
            </button>
            <button
              type="button"
              onClick={() => setSearchParamsRoute({ filter: 'mine' })}
              className={`py-1.5 px-3 rounded-md transition-all cursor-pointer ${
                filterParam === 'mine' ? 'bg-white text-[#2c308e] shadow-3xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mes services
            </button>
          </div>

          <Link
            to="/services/nouveau"
            className="h-10 px-5 rounded-2xl bg-[#2c308e] hover:bg-[#2c308e]/95 text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Créer une annonce</span>
          </Link>
        </div>
      </div>

      <ServiceFilters
        searchText={searchText}
        onSearchChange={setSearchText}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        filterType={filterType}
        onTypeChange={setFilterType}
        filterTarif={filterTarif}
        onTarifChange={setFilterTarif}
      />

      {isLoading ? (
        <div className="flex justify-center items-center py-24 flex-col text-gray-400 gap-3">
          <Loader2 className="h-8 w-8 text-[#2c308e] animate-spin" />
          <p className="text-xs font-bold">Chargement des services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <HeartHandshake className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-800">Aucun service trouvé pour l'instant</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed font-light">
              Soyez le premier à proposer un service d'entraide ou à formuler une demande de bon voisinage dans votre quartier !
            </p>
          </div>
          {filterParam === 'local' && <PromoCTA />}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service._id} className="h-full">
              <ServiceCard service={service} onSelect={setSelectedService} />
            </div>
          ))}
          {filterParam === 'local' && <PromoCTA />}
        </div>
      )}

      <ServiceDetailModal
        service={activeService}
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        currentUser={user}
        onOpenChat={handleOpenChat}
        onActionComplete={refetch}
      />
    </div>
  )
}
