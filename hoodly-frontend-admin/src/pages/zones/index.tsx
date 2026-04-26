import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Search, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { zonesApi } from '@/services/api/zones';
import type { IZoneResponse } from '@/types/zone.types';
import CreateZoneDialog from './CreateZoneDialog';
import { useNavigate } from 'react-router-dom';

export default function ZonesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['zones', page, search],
    queryFn: () =>
      zonesApi.getAll({
        page,
        limit: 10,
        search: search || undefined,
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => zonesApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => zonesApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['zones'] }),
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
              Radar Ouvertures
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Quartier
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
                      {data?.zones.map((zone) => (
                        <tr key={zone.id} className="border-t border-gray-800">
                          <td className="px-4 py-3 text-sm">{zone.nom}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{zone.ville}</td>
                          <td className="px-4 py-3 text-sm">{zone.membresCount}</td>
                          <td className="px-4 py-3">
                            <Badge variant={zone.statut === 'active' ? 'default' : 'destructive'}>
                              {zone.statut === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(zone)}
                            >
                              {zone.statut === 'active' ? 'Désactiver' : 'Réactiver'}
                            </Button>
                          </td>
                        </tr>
                      ))}
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

      <CreateZoneDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </DashboardLayout>
  );
}