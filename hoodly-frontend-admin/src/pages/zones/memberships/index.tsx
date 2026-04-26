import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Check, X, Eye, ShieldAlert, Clock, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { zonesApi } from '@/services/api/zones';
import { usersApi } from '@/services/api/users';
import { toast } from 'sonner';

export default function MembershipsPage() {
  const queryClient = useQueryClient();
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. Demandes complètes (avec documents)
  const { data: memberships, isLoading: isLoadingMemberships } = useQuery({
    queryKey: ['memberships'],
    queryFn: () => zonesApi.getMemberships(),
  });

  // 2. Intentions d'adhésion (sans documents encore)
  const { data: pendingUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'pending-adh'],
    queryFn: () => usersApi.getAll({ zoneStatut: 'en_attente_adh' }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => zonesApi.acceptMembership(id),
    onSuccess: () => {
      toast.success('Résident validé !');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsPreviewOpen(false);
    },
  });

  const refuseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      zonesApi.refuseMembership(id, reason),
    onSuccess: () => {
      toast.success('Demande refusée');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsPreviewOpen(false);
    },
  });

  const handlePreview = (membership: any) => {
    setSelectedMembership(membership);
    setIsPreviewOpen(true);
  };

  const handleRefuse = () => {
    const reason = window.prompt('Pourquoi refusez-vous ce dossier ? (Motif affiché à l\'habitant)', 'Documents illisibles ou invalides');
    if (reason) {
      refuseMutation.mutate({ 
        id: selectedMembership?.id || selectedMembership?._id, 
        reason 
      });
    }
  };

  const getResidentName = (user: any) => {
    if (!user) return 'Inconnu';
    if (user.nom || user.prenom) return `${user.nom || ''} ${user.prenom || ''}`.trim();
    return user.name || 'Anonyme';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Vérification Résidents</h1>
          <p className="text-muted-foreground">Gérez les adhésions aux quartiers existants</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-400 font-bold">
              <ShieldAlert className="h-5 w-5" /> Dossiers à certifier ({memberships?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMemberships ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : memberships?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic">Aucun dossier en attente.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-4">Résident</th>
                      <th className="px-6 py-4">Quartier</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {memberships?.map((m: any) => (
                      <tr key={m.id || m._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{getResidentName(m.userId)}</div>
                          <div className="text-[10px] text-gray-500">{m.userId?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{m.zoneId?.nom || 'Zone inconnue'}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(m.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8" onClick={() => handlePreview(m)}>Vérifier</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-500/80 text-sm font-medium">
              <Clock className="h-4 w-4" /> Intentions d'adhésion (docs attendus)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="text-center py-4 text-gray-500">Chargement...</div>
            ) : pendingUsers?.users.length === 0 ? (
              <div className="text-center py-4 text-gray-600 text-xs italic">Aucun utilisateur en attente de justificatifs.</div>
            ) : (
              <div className="overflow-x-auto opacity-70">
                <table className="w-full text-xs text-left text-gray-400">
                  <tbody className="divide-y divide-gray-800/50">
                    {pendingUsers?.users.map((u: any) => (
                      <tr key={u.id || u._id}>
                        <td className="px-6 py-3 font-medium text-gray-300">{u.name || `${u.nom || ''} ${u.prenom || ''}`}</td>
                        <td className="px-6 py-3">{u.email}</td>
                        <td className="px-6 py-3 text-right text-[10px] uppercase tracking-wider text-amber-600">En attente de documents</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Documents de {getResidentName(selectedMembership?.userId)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-6">
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Justificatif de domicile</p>
              <div className="relative aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center group">
                {selectedMembership?.justificatifUrl ? (
                  <>
                    <img src={selectedMembership.justificatifUrl} className="max-h-full max-w-full object-contain" alt="Justificatif" />
                    <a href={selectedMembership.justificatifUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                      <ExternalLink className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium">Ouvrir l'original</span>
                    </a>
                  </>
                ) : <span className="text-gray-600 text-xs italic">Aucun fichier</span>}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Pièce d'identité</p>
              <div className="relative aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center group">
                {selectedMembership?.pieceIdentiteUrl ? (
                  <>
                    <img src={selectedMembership.pieceIdentiteUrl} className="max-h-full max-w-full object-contain" alt="Identité" />
                    <a href={selectedMembership.pieceIdentiteUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200">
                      <ExternalLink className="h-6 w-6 mb-2" />
                      <span className="text-xs font-medium">Ouvrir l'original</span>
                    </a>
                  </>
                ) : <span className="text-gray-600 text-xs italic">Aucun fichier</span>}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3 border-t border-gray-800 pt-6 mt-2">
            <div className="flex-1">
               <Button variant="ghost" className="text-gray-500 hover:text-red-400" onClick={handleRefuse} disabled={refuseMutation.isPending || acceptMutation.isPending}>
                <X className="h-4 w-4 mr-2" /> Refuser le dossier
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="border-gray-800 text-gray-400">Annuler</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8" onClick={() => acceptMutation.mutate(selectedMembership?.id || selectedMembership?._id)} disabled={refuseMutation.isPending || acceptMutation.isPending}>
              <Check className="h-4 w-4 mr-2" /> Approuver le résident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
