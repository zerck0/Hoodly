import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { usersApi } from '../../services/api/users';
import { toast } from 'sonner';


export default function CandidaturesPage() {
  const queryClient = useQueryClient();
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['moderator-applications'],
    queryFn: () => usersApi.getAllModeratorApplications(),
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      usersApi.decideModeratorApplication(id, approved),
    onSuccess: (_, variables) => {
      toast.success(
        variables.approved
          ? "Candidature acceptée ! L'habitant est maintenant modérateur."
          : 'Candidature refusée.'
      );
      queryClient.invalidateQueries({ queryKey: ['moderator-applications'] });
      setDecidingId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Une erreur est survenue.');
      setDecidingId(null);
    },
  });

  const handleDecision = (id: string, approved: boolean) => {
    setDecidingId(id);
    decideMutation.mutate({ id, approved });
  };

  const pendingApps = useMemo(() => {
    return applications.filter((app: any) => app.status === 'pending');
  }, [applications]);

  const historyApps = useMemo(() => {
    return applications.filter((app: any) => app.status !== 'pending');
  }, [applications]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="text-indigo-500" />
            Candidatures Modérateurs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Examinez et nommez les modérateurs qui veilleront à la convivialité de la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-bold">Demandes en attente</CardTitle>
                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {pendingApps.length} en attente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-gray-800/60 space-y-6">
                {isLoading ? (
                  <div className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-4" />
                    Chargement des candidatures...
                  </div>
                ) : pendingApps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 italic">
                    Aucune candidature en attente de traitement.
                  </div>
                ) : (
                  pendingApps.map((app: any, idx: number) => (
                    <div key={app._id} className={`pt-6 first:pt-0 space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-950 border border-indigo-900 rounded-full flex items-center justify-center font-bold text-indigo-300">
                            {app.userId?.name?.charAt(0).toUpperCase() || 'H'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-200">{app.userId?.name || 'Habitant'}</p>
                            <p className="text-xs text-gray-500">{app.userId?.email || ''}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="bg-gray-950/65 border border-gray-850 p-4 rounded-xl text-sm italic text-gray-400 leading-relaxed font-sans">
                        "{app.motivation}"
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <Button
                          disabled={decidingId !== null}
                          onClick={() => handleDecision(app._id, false)}
                          className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-xl font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
                        >
                          {decidingId === app._id && !decideMutation.variables?.approved ? (
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                          ) : (
                            <UserX size={13} />
                          )}
                          Rejeter
                        </Button>
                        <Button
                          disabled={decidingId !== null}
                          onClick={() => handleDecision(app._id, true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
                        >
                          {decidingId === app._id && decideMutation.variables?.approved ? (
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                          ) : (
                            <UserCheck size={13} />
                          )}
                          Nommer Modérateur
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-base font-bold">Historique des décisions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-gray-800/40 space-y-4">
                {isLoading ? (
                  <div className="text-center py-6 text-gray-500">
                    Chargement...
                  </div>
                ) : historyApps.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 italic text-xs">
                    Aucun historique de décision disponible.
                  </div>
                ) : (
                  historyApps.map((app: any) => (
                    <div key={app._id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-300">{app.userId?.name || 'Habitant'}</span>
                        {app.status === 'approved' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Accepté
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1">
                            <XCircle size={10} /> Refusé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 italic truncate">
                        "{app.motivation}"
                      </p>
                      <p className="text-[10px] text-gray-600 text-right">
                        Le {new Date(app.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
