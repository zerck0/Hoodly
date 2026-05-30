import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Vote,
  Users,
  Clock,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Inbox,
  Lock,
} from 'lucide-react';
import { votesApi } from '../../services/api/votes';
import { zonesApi } from '../../services/api/zones';
import type { IVoteResponse } from '../../types/vote.types';
import { toast } from 'sonner';

export default function VotesPage() {
  const queryClient = useQueryClient();
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');

  // 1. Fetch de toutes les zones actives pour alimenter le sélecteur
  const { data: zonesData } = useQuery({
    queryKey: ['zones', 'all-for-votes'],
    queryFn: () => zonesApi.getAll({ limit: 100 }),
  });

  // 2. Fetch des votes de la zone sélectionnée (ou chargement conditionnel)
  const { data: votes, isLoading: loadingVotes, refetch } = useQuery({
    queryKey: ['votes', 'zone', selectedZoneId],
    queryFn: () => votesApi.getAllByZone(selectedZoneId),
    enabled: selectedZoneId !== 'all' && selectedZoneId !== '',
  });

  // 3. Mutation pour clore un scrutin
  const closeMutation = useMutation({
    mutationFn: (id: string) => votesApi.close(id),
    onSuccess: () => {
      toast.success('Le scrutin a été clos avec succès !');
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    },
    onError: () => {
      toast.error('Erreur lors de la clôture du vote');
    },
  });

  // 4. Mutation pour supprimer un vote
  const deleteMutation = useMutation({
    mutationFn: (id: string) => votesApi.delete(id),
    onSuccess: () => {
      toast.success('Le scrutin a été supprimé !');
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du vote');
    },
  });

  const handleClose = (id: string) => {
    if (window.confirm('Voulez-vous clore manuellement ce scrutin ? Les habitants ne pourront plus voter.')) {
      closeMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce scrutin ?')) {
      deleteMutation.mutate(id);
    }
  };

  // Liste des zones du sélecteur
  const zonesList = zonesData?.zones || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Vote className="text-indigo-400" />
              Centre de Scrutin & Sondages
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              Supervisez les consultations citoyennes, sondages et referendums organisés par quartiers
            </p>
          </div>
          {selectedZoneId !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-gray-800 bg-gray-900 text-gray-300 hover:text-white"
            >
              <RefreshCw size={14} className="mr-2" />
              Rafraîchir
            </Button>
          )}
        </div>

        {/* Sélecteur de quartier (obligatoire pour charger les scrutins locaux) */}
        <Card className="bg-gray-900 border-gray-800 shadow-lg">
          <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Sélectionnez un quartier</p>
              <p className="text-xs text-gray-400">Les votes sont des consultations strictement locales rattachées à un périmètre</p>
            </div>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger className="w-full sm:w-[260px] bg-gray-950 border-gray-800 text-gray-200">
                <SelectValue placeholder="Choisir un quartier..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-800 text-gray-200">
                <SelectItem value="all">Choisir...</SelectItem>
                {zonesList.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.nom} ({zone.ville})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Liste des scrutins */}
        {selectedZoneId === 'all' ? (
          <Card className="bg-gray-900/40 border-dashed border-gray-800 py-16 text-center text-gray-500">
            <Inbox size={40} className="mx-auto text-gray-700 mb-3" />
            <p className="text-sm font-semibold">Veuillez sélectionner un quartier ci-dessus pour charger les scrutins.</p>
          </Card>
        ) : loadingVotes ? (
          <div className="text-center py-16 text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            Chargement des referendums locaux...
          </div>
        ) : !votes || votes.length === 0 ? (
          <div className="text-center py-16 text-gray-500 italic border-dashed border border-gray-800 rounded-xl bg-gray-900/30">
            <AlertCircle size={32} className="text-gray-600 mx-auto mb-3" />
            Aucun scrutin ou referendum n'est actuellement en cours dans ce quartier.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {votes.map((vote) => {
              const id = vote.id || vote._id;
              const isActive = vote.statut === 'actif';
              const totalVotes = vote.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

              return (
                <Card key={id} className="bg-gray-900 border-gray-800 overflow-hidden shadow-xl hover:border-gray-750 transition-all">
                  <div className="bg-gray-950/40 px-6 py-4 border-b border-gray-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-white text-base">{vote.titre}</h3>
                        <Badge className={`text-[9px] px-2 rounded ${
                          isActive ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {isActive ? 'Scrutin Actif' : 'Clôturé'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{vote.description}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {isActive && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-gray-850 hover:bg-gray-800 text-[10px] h-7 px-2.5 font-bold"
                          onClick={() => id && handleClose(id)}
                          disabled={closeMutation.isPending}
                        >
                          <Lock size={10} className="mr-1" />
                          Clore
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 text-[10px] h-7 px-2.5 font-bold"
                        onClick={() => id && handleDelete(id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={10} className="mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-5">
                    {/* Participation */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 bg-gray-950/20 p-3 rounded-lg border border-gray-850/60 max-w-sm">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                        <Users size={13} className="text-indigo-400" />
                        <span>{totalVotes} participants</span>
                      </div>
                      <span className="text-gray-700">|</span>
                      <div className="flex items-center gap-1.5 font-semibold text-gray-300">
                        <Clock size={13} className="text-amber-400" />
                        <span>Fermeture le {new Date(vote.dateFin).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Options et barres de progression */}
                    <div className="space-y-4 max-w-xl">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-indigo-400" /> Résultats partiels
                      </p>
                      {vote.options.map((option, idx) => {
                        const optVotes = option.votes?.length || 0;
                        const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-gray-200">{option.texte}</span>
                              <span className="text-gray-400">{optVotes} voix ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-850">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
