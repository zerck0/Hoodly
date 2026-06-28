import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { incidentsApi } from '../../services/api/incidents';
import type { IIncidentResponse } from '../../types/incident.types';
import { toast } from 'sonner';

const CRITICITY_STYLES = {
  elevee: { label: 'Élevée', bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-900/50' },
  moyenne: { label: 'Moyenne', bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-900/50' },
  faible: { label: 'Faible', bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-900/50' },
};

const STATUS_STYLES = {
  ouvert: { label: 'Ouvert', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  en_cours: { label: 'En cours', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  resolu: { label: 'Résolu', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [criticiteFilter, setCriticiteFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<IIncidentResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: incidents, isLoading, refetch } = useQuery({
    queryKey: ['incidents', 'list'],
    queryFn: () => incidentsApi.getAll(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: 'ouvert' | 'en_cours' | 'resolu' }) =>
      incidentsApi.updateStatut(id, { statut }),
    onSuccess: () => {
      toast.success('Statut de l\'incident mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setIsDetailOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de la modification de l\'incident');
    },
  });

  const filteredIncidents = useMemo(() => {
    if (!incidents) return [];
    return incidents.filter((incident) => {
      const matchesSearch =
        incident.titre.toLowerCase().includes(search.toLowerCase()) ||
        incident.description.toLowerCase().includes(search.toLowerCase()) ||
        incident.categorie.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || incident.statut === statusFilter;
      const matchesCriticite = criticiteFilter === 'all' || incident.criticite === criticiteFilter;

      return matchesSearch && matchesStatus && matchesCriticite;
    });
  }, [incidents, search, statusFilter, criticiteFilter]);

  const totalPages = Math.ceil(filteredIncidents.length / 10);

  const paginatedIncidents = useMemo(() => {
    return filteredIncidents.slice((page - 1) * 10, page * 10);
  }, [filteredIncidents, page]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, criticiteFilter]);

  const handleOpenDetail = (incident: IIncidentResponse) => {
    setSelectedIncident(incident);
    setIsDetailOpen(true);
  };

  const handleChangeStatus = (newStatus: 'ouvert' | 'en_cours' | 'resolu') => {
    if (!selectedIncident) return;
    const id = selectedIncident.id || selectedIncident._id;
    if (id) {
      updateStatusMutation.mutate({ id, statut: newStatus });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-500" />
              Supervision des Incidents
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Gérez, inspectez et modérez les signalements d'anomalies remontés par les habitants du quartier
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white"
          >
            <RefreshCw size={14} className="mr-2" />
            Rafraîchir
          </Button>
        </div>

        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un incident..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-950 border-gray-800 text-gray-200 focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-gray-500 shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-gray-950 border-gray-800 text-gray-300">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="ouvert">Ouvert</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="resolu">Résolu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={criticiteFilter} onValueChange={setCriticiteFilter}>
                <SelectTrigger className="w-[140px] bg-gray-950 border-gray-800 text-gray-300">
                  <SelectValue placeholder="Criticité" />
                </SelectTrigger>
                <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                  <SelectItem value="all">Toutes criticités</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="elevee">Élevée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16 text-gray-500">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                Chargement des signalements...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-16 text-gray-500 italic">
                <AlertCircle size={32} className="text-gray-600 mx-auto mb-3" />
                Aucun incident ne correspond aux critères de recherche.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4">Titre & Catégorie</th>
                      <th className="px-6 py-4">Quartier</th>
                      <th className="px-6 py-4">Criticité</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Date de signalement</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {paginatedIncidents.map((incident) => {
                      const id = incident.id || incident._id;
                      const crit = CRITICITY_STYLES[incident.criticite] || CRITICITY_STYLES.faible;
                      const stat = STATUS_STYLES[incident.statut] || STATUS_STYLES.ouvert;
                      const zoneNom = typeof incident.zoneId === 'object' ? incident.zoneId?.nom : 'Quartier local';

                      return (
                        <tr key={id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{incident.titre}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-semibold">
                              {incident.categorie}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 font-medium">{zoneNom}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${crit.bg} ${crit.text} ${crit.border} border text-[10px] px-2 py-0.5 rounded-md`}>
                              {crit.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`${stat.bg} ${stat.text} ${stat.border} border text-[10px] px-2 py-0.5 rounded-md`}>
                              {stat.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(incident.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold px-3"
                              onClick={() => handleOpenDetail(incident)}
                            >
                              <Eye size={12} className="mr-1.5" />
                              Inspecter
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-950/20">
                    <p className="text-xs text-gray-400">
                      Page {page} sur {totalPages} ({filteredIncidents.length} signalements)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white h-8 text-xs font-semibold px-3"
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white h-8 text-xs font-semibold px-3"
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="text-indigo-400" size={20} />
              Détails de l'incident
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              Modération et changement de statut du signalement citoyen
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4 py-3">
              <div className="bg-gray-900 border border-gray-850 p-4 rounded-xl space-y-2">
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Titre du signalement</p>
                <p className="text-sm font-semibold text-white">{selectedIncident.titre}</p>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/60 border border-gray-850 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Catégorie</p>
                  <p className="text-xs font-semibold text-gray-200 mt-1 capitalize">{selectedIncident.categorie}</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-850 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Signalé par</p>
                  <p className="text-xs font-semibold text-gray-200 mt-1 truncate">
                    {typeof selectedIncident.signaledPar === 'object'
                      ? selectedIncident.signaledPar?.name || selectedIncident.signaledPar?.email
                      : 'Habitant de la zone'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-850 pt-4 space-y-2">
                <p className="text-xs text-gray-400 font-bold">Changer le statut administratif :</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className={`border-gray-800 text-xs font-semibold h-9 ${
                      selectedIncident.statut === 'ouvert' ? 'bg-red-950/30 text-red-400 border-red-900/60' : 'hover:bg-gray-900 hover:text-white'
                    }`}
                    onClick={() => handleChangeStatus('ouvert')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Clock size={12} className="mr-1.5" />
                    Ouvert
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-gray-800 text-xs font-semibold h-9 ${
                      selectedIncident.statut === 'en_cours' ? 'bg-blue-950/30 text-blue-400 border-blue-900/60' : 'hover:bg-gray-900 hover:text-white'
                    }`}
                    onClick={() => handleChangeStatus('en_cours')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <RefreshCw size={12} className="mr-1.5" />
                    En cours
                  </Button>
                  <Button
                    variant="outline"
                    className={`border-gray-800 text-xs font-semibold h-9 ${
                      selectedIncident.statut === 'resolu' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/60' : 'hover:bg-gray-900 hover:text-white'
                    }`}
                    onClick={() => handleChangeStatus('resolu')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 size={12} className="mr-1.5" />
                    Résolu
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-gray-850 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDetailOpen(false)}
              className="text-gray-500 hover:text-white text-xs"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
