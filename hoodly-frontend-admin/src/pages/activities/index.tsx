import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  CalendarDays,
  Wrench,
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  Trash2,
  AlertCircle,
  RefreshCw,
  HandHelping,
  HeartHandshake,
  Inbox,
} from 'lucide-react';
import { eventsApi } from '../../services/api/events';
import { servicesApi } from '../../services/api/services';
import { toast } from 'sonner';

const EVENT_CATEGORY_LABELS: Record<string, string> = {
  fete: 'Fête de quartier',
  entraide: 'Solidarité & Entraide',
  sport: 'Sport & Loisirs',
  ecologie: 'Écologie & Propreté',
  autre: 'Autre rassemblement',
};

const EVENT_STATUS_STYLES = {
  planifie: { label: 'Planifié', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  termine: { label: 'Terminé', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  annule: { label: 'Annulé', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const SERVICE_STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ouvert: { label: 'Ouvert', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  en_attente: { label: 'Candidat choisi', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  en_cours: { label: 'En cours', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  termine: { label: 'Accompli', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  valide: { label: 'Validé & Clôturé', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
};

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'events' | 'services'>('events');

  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventPage, setEventPage] = useState(1);

  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [servicePage, setServicePage] = useState(1);

  const { data: eventsData, isLoading: loadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['events', 'list', eventPage, eventSearch, eventStatusFilter],
    queryFn: () =>
      eventsApi.getAll({
        page: eventPage,
        limit: 10,
        search: eventSearch || undefined,
        statut: eventStatusFilter === 'all' ? undefined : eventStatusFilter,
      }),
    enabled: activeTab === 'events',
  });

  const { data: servicesData, isLoading: loadingServices, refetch: refetchServices } = useQuery({
    queryKey: ['services', 'list', servicePage, serviceSearch, serviceTypeFilter],
    queryFn: () =>
      servicesApi.getAll({
        page: servicePage,
        limit: 10,
        search: serviceSearch || undefined,
        type: serviceTypeFilter === 'all' ? undefined : serviceTypeFilter,
      }),
    enabled: activeTab === 'services',
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      toast.success('Événement supprimé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de l\'événement');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => {
      toast.success('Annonce d\'entraide retirée de la plateforme !');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => {
      toast.error('Erreur lors du retrait de l\'annonce');
    },
  });

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteEventMutation.mutate(id);
    }
  };

  const handleDeleteService = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir retirer cette annonce d\'entraide ?')) {
      deleteServiceMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-900 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Vie Locale
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Modérez les initiatives collectives, les rassemblements ainsi que les échanges de services entre voisins
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (activeTab === 'events' ? refetchEvents() : refetchServices())}
            className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white"
          >
            <RefreshCw size={14} className="mr-2" />
            Rafraîchir
          </Button>
        </div>

        <div className="flex gap-2 border-b border-gray-800 pb-px">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === 'events'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <CalendarDays size={16} />
            Événements de Quartier
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === 'services'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Wrench size={16} />
            Services d'Entraide
          </button>
        </div>

        {activeTab === 'events' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher un événement..."
                    value={eventSearch}
                    onChange={(e) => {
                      setEventSearch(e.target.value);
                      setEventPage(1);
                    }}
                    className="pl-9 bg-gray-950 border-gray-800 text-gray-200 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
                  <Select
                    value={eventStatusFilter}
                    onValueChange={(val) => {
                      setEventStatusFilter(val);
                      setEventPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px] bg-gray-950 border-gray-800 text-gray-300">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="planifie">Planifié</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {loadingEvents ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    Chargement des événements...
                  </div>
                ) : !eventsData || eventsData.events.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 italic">
                    <Inbox size={32} className="text-gray-600 mx-auto mb-3" />
                    Aucun événement citoyen répertorié.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-800">
                          <tr>
                            <th className="px-6 py-4">Titre & Description</th>
                            <th className="px-6 py-4">Catégorie</th>
                            <th className="px-6 py-4">Lieu & Horaires</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Participants</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {eventsData.events.map((event) => {
                            const id = event.id || event._id;
                            const stat = EVENT_STATUS_STYLES[event.statut] || EVENT_STATUS_STYLES.planifie;
                             const eventDate = event.date || event.dateDebut;
                             const dateText = eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', {
                               day: '2-digit',
                               month: 'short',
                               hour: '2-digit',
                               minute: '2-digit',
                             }) : 'Non planifié';
 
                             return (
                               <tr key={id} className="hover:bg-gray-800/20 transition-colors">
                                 <td className="px-6 py-4 max-w-sm">
                                   <div className="font-semibold text-white">{event.titre}</div>
                                   <div className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                     {event.description}
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                   <Badge variant="outline" className="border-gray-800 text-gray-300 bg-gray-950/20 capitalize">
                                     {EVENT_CATEGORY_LABELS[event.categorie] || event.categorie}
                                   </Badge>
                                 </td>
                                 <td className="px-6 py-4 text-xs space-y-1">
                                   <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                                     <MapPin size={12} className="text-indigo-400 shrink-0" />
                                     <span className="truncate max-w-[150px]">{event.adresse || event.lieu?.adresse || 'Lieu non renseigné'}</span>
                                   </div>
                                   <div className="flex items-center gap-1.5 text-gray-500">
                                     <Clock size={12} className="shrink-0" />
                                     <span>Le {dateText}</span>
                                   </div>
                                 </td>
                                <td className="px-6 py-4">
                                  <Badge className={`${stat.bg} ${stat.text} ${stat.border} border text-[10px] px-2 py-0.5 rounded-md`}>
                                    {stat.label}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-bold text-white">{event.membresPresents?.length || 0}</span>
                                  <span className="text-gray-500 text-xs ml-1">présents</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 h-8 font-semibold text-xs transition-all"
                                    onClick={() => id && handleDeleteEvent(id)}
                                    disabled={deleteEventMutation.isPending}
                                  >
                                    <Trash2 size={12} className="mr-1.5" />
                                    Supprimer
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {eventsData.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4 bg-gray-950/20">
                        <p className="text-xs text-gray-500">
                          Page {eventsData.page} sur {eventsData.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={eventPage <= 1}
                            onClick={() => setEventPage((p) => p - 1)}
                            className="border-gray-800 text-gray-400 bg-gray-900"
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={eventPage >= eventsData.totalPages}
                            onClick={() => setEventPage((p) => p + 1)}
                            className="border-gray-800 text-gray-400 bg-gray-900"
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-lg">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher une annonce..."
                    value={serviceSearch}
                    onChange={(e) => {
                      setServiceSearch(e.target.value);
                      setServicePage(1);
                    }}
                    className="pl-9 bg-gray-950 border-gray-800 text-gray-200 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
                  <Select
                    value={serviceTypeFilter}
                    onValueChange={(val) => {
                      setServiceTypeFilter(val);
                      setServicePage(1);
                    }}
                  >
                    <SelectTrigger className="w-[160px] bg-gray-950 border-gray-800 text-gray-300">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="offre">Offres d'aide</SelectItem>
                      <SelectItem value="demande">Demandes d'aide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                {loadingServices ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    Chargement des services...
                  </div>
                ) : !servicesData || servicesData.services.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 italic">
                    <Inbox size={32} className="text-gray-600 mx-auto mb-3" />
                    Aucune annonce d'entraide trouvée.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-300">
                        <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-800">
                          <tr>
                            <th className="px-6 py-4">Titre & Description</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Catégorie</th>
                            <th className="px-6 py-4">Créateur</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                          {servicesData.services.map((service) => {
                            const id = service.id || service._id;
                            const stat = SERVICE_STATUS_STYLES[service.statut] || SERVICE_STATUS_STYLES.ouvert;
                            const isOffre = service.type === 'offre';
                            const creatorNom = typeof service.createurId === 'object' ? service.createurId?.name || service.createurId?.email : 'Résident';

                            return (
                              <tr key={id} className="hover:bg-gray-800/20 transition-colors">
                                <td className="px-6 py-4 max-w-sm">
                                  <div className="font-semibold text-white">{service.titre}</div>
                                  <div className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                    {service.description}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge className={`border text-[10px] px-2 py-0.5 rounded-md ${
                                    isOffre ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50' : 'bg-rose-950/40 text-rose-400 border-rose-900/50'
                                  }`}>
                                    {isOffre ? <HandHelping size={10} className="inline mr-1" /> : <HeartHandshake size={10} className="inline mr-1" />}
                                    {isOffre ? 'Offre' : 'Demande'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 capitalize text-gray-300 font-medium">{service.categorie}</td>
                                <td className="px-6 py-4 text-gray-400 truncate max-w-[150px]">{creatorNom}</td>
                                <td className="px-6 py-4">
                                  <Badge className={`${stat.bg} ${stat.text} ${stat.border} border text-[10px] px-2 py-0.5 rounded-md`}>
                                    {stat.label}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 h-8 font-semibold text-xs transition-all"
                                    onClick={() => id && handleDeleteService(id)}
                                    disabled={deleteServiceMutation.isPending}
                                  >
                                    <Trash2 size={12} className="mr-1.5" />
                                    Retirer
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {servicesData.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4 bg-gray-950/20">
                        <p className="text-xs text-gray-500">
                          Page {servicesData.page} sur {servicesData.totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={servicePage <= 1}
                            onClick={() => setServicePage((p) => p - 1)}
                            className="border-gray-800 text-gray-400 bg-gray-900"
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={servicePage >= servicesData.totalPages}
                            onClick={() => setServicePage((p) => p + 1)}
                            className="border-gray-800 text-gray-400 bg-gray-900"
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
