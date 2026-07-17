import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Search, FileText, X, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { zonesApi } from '@/services/api/zones';
import type { IZoneResponse } from '@/types/zone.types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ZonesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<IZoneResponse | null>(null);

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['zone-members', selectedZone?.id],
    queryFn: () => zonesApi.getMembers(selectedZone!.id),
    enabled: !!selectedZone,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['zones', page, debouncedSearch],
    queryFn: () =>
      zonesApi.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => zonesApi.deactivate(id),
    onSuccess: () => {
      toast.success('Le quartier a été désactivé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: () => {
      toast.error('Erreur lors de la désactivation du quartier');
    }
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => zonesApi.activate(id),
    onSuccess: () => {
      toast.success('Le quartier a été activé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'activation du quartier');
    }
  });

  const handleToggleStatus = (zone: IZoneResponse) => {
    if (zone.statut === 'active') {
      deactivateMutation.mutate(zone.id);
    } else {
      activateMutation.mutate(zone.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Catalogue des Quartiers</h1>
            <p className="text-muted-foreground">
              Liste et statistiques des zones actives sur Hoodly
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/zones/map')}>
              <FileText className="h-4 w-4 mr-2" />
              Ouverture & Tracé
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-400" />
              Quartiers enregistrés ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou ville..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1)}}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : data?.zones.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune zone trouvée
              </div>
            ) : (
              <>
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium">Nom</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Ville</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Membres</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Statut</th>
                        <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.zones.map((zone) => {
                        const isDeactivating = deactivateMutation.isPending && deactivateMutation.variables === zone.id;
                        const isActivating = activateMutation.isPending && activateMutation.variables === zone.id;
                        const isMutatingThisZone = isDeactivating || isActivating;

                        return (
                          <tr
                            key={zone.id}
                            onClick={() => setSelectedZone(zone)}
                            className="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-all"
                          >
                            <td className="px-4 py-3 text-sm font-semibold">{zone.nom}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{zone.ville}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-indigo-400">{zone.membresCount}</td>
                            <td className="px-4 py-3">
                              <Badge variant={zone.statut === 'active' ? 'default' : 'destructive'}>
                                {zone.statut === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isMutatingThisZone}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(zone);
                                }}
                                className={
                                  zone.statut === 'active'
                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-950/20 h-8 gap-1.5'
                                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 h-8 gap-1.5'
                                }
                              >
                                {isMutatingThisZone ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                {zone.statut === 'active' ? 'Désactiver' : 'Réactiver'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {data.page} sur {data.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.totalPages}
                        onClick={() => setPage((p) => p + 1)}
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

      {selectedZone && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
            onClick={() => setSelectedZone(null)}
          />

          <div className="fixed top-0 right-0 h-full w-[480px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                  {selectedZone.nom}
                </h3>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {selectedZone.ville} • {selectedZone.membresCount} habitant(s)
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedZone(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Liste des habitants ({selectedZone.membresCount})
              </h4>

              {isLoadingMembers ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/20 rounded-lg animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-gray-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/3" />
                        <div className="h-2 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !members || members.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4 text-center">
                  Aucun habitant certifié dans ce quartier.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {members.map((member: any) => (
                    <div
                      key={member._id || member.id}
                      className="flex items-center justify-between p-3.5 bg-gray-800/30 rounded-xl border border-gray-800 hover:bg-gray-850/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {member.picture ? (
                            <img
                              src={member.picture}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-900/50 text-indigo-200 border border-indigo-850 flex items-center justify-center font-bold text-sm">
                              {member.firstName?.charAt(0) || member.name?.charAt(0) || 'H'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {member.firstName || member.lastName
                              ? `${member.firstName || ''} ${member.lastName || ''}`.trim()
                              : member.name || 'Habitant'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={
                            member.role === 'admin'
                              ? 'bg-red-950/40 text-red-400 border border-red-900/50 text-[10px]'
                              : member.role === 'moderator'
                              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 text-[10px]'
                              : 'bg-gray-800 text-gray-400 border border-gray-700 text-[10px]'
                          }
                        >
                          {member.role === 'admin'
                            ? 'Admin'
                            : member.role === 'moderator'
                            ? 'Modérateur'
                            : 'Habitant'}
                        </Badge>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30">
                          {member.points || 0} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}