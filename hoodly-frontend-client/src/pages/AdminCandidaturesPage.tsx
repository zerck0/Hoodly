import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../services/api/user'
import { useState } from 'react'
import {
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  FileText,
  Clock,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUser } from '../hooks/useUser'

export default function AdminCandidaturesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useUser()
  const [decidingId, setDecidingId] = useState<string | null>(null)

  const { data: applications = [], isLoading, error } = useQuery({
    queryKey: ['admin-moderator-applications'],
    queryFn: async () => {
      const { data } = await usersApi.getAllModeratorApplications()
      return data
    },
    enabled: user?.role === 'admin',
  })

  const decideMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      await usersApi.decideModeratorApplication(id, approved)
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.approved
          ? 'Candidature acceptée avec succès ! L\'habitant est maintenant modérateur.'
          : 'Candidature refusée.'
      )
      queryClient.invalidateQueries({ queryKey: ['admin-moderator-applications'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      setDecidingId(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Une erreur est survenue.')
      setDecidingId(null)
    },
  })

  const handleDecision = (id: string, approved: boolean) => {
    setDecidingId(id)
    decideMutation.mutate({ id, approved })
  }

  const pendingApps = applications.filter((app) => app.status === 'pending')
  const historyApps = applications.filter((app) => app.status !== 'pending')

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm font-semibold text-gray-700">Accès non autorisé</p>
          <p className="text-xs text-gray-500 font-light max-w-xs">Cette page est exclusivement réservée aux administrateurs de la plateforme.</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-[#0c3383] text-white text-xs px-4 py-2 rounded-xl mt-2 cursor-pointer">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-[#0c3383]" />
          <span className="text-sm font-semibold text-gray-500 font-sans">Chargement des candidatures...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <Shield size={14} className="text-[#0c3383]" />
            Espace Administration
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Candidatures Modérateurs
          </h1>
          <p className="text-xs text-gray-400 font-light">
            Examinez et nommez les modérateurs de votre quartier.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/profil')}
          className="rounded-xl font-bold text-xs px-4 py-2 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer w-max"
        >
          <ArrowLeft size={14} /> Retour au profil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">Demandes en attente</CardTitle>
                <CardDescription className="text-[10px] text-gray-400 font-light mt-0.5">
                  Habitants souhaitant aider à modérer le quartier.
                </CardDescription>
              </div>
              <Badge className="bg-[#e9eaf6] text-[#2c308e] text-[10px] font-bold rounded-full px-2.5 py-0.5">
                {pendingApps.length} en attente
              </Badge>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-gray-100 space-y-6">
              {pendingApps.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Clock size={20} />
                  </div>
                  <p className="text-xs font-semibold text-gray-400">Aucune demande en attente</p>
                  <p className="text-[10px] text-gray-400 font-light">Toutes les candidatures ont été traitées.</p>
                </div>
              ) : (
                pendingApps.map((app, index) => (
                  <div key={app._id} className={`pt-6 first:pt-0 space-y-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-[#0c3383] font-bold text-sm">
                          {app.userId?.name?.charAt(0).toUpperCase() || 'H'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{app.userId?.name || 'Habitant'}</p>
                          <p className="text-[10px] text-gray-400 font-light">{app.userId?.email || ''}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-light">
                        Le {format(new Date(app.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-light text-gray-600 leading-relaxed font-sans italic">
                      "{app.motivation}"
                    </div>

                    <div className="flex justify-end gap-2.5">
                      <Button
                        disabled={decidingId !== null}
                        onClick={() => handleDecision(app._id, false)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/50 rounded-xl font-bold text-[10px] px-4 py-2 cursor-pointer flex items-center gap-1"
                      >
                        {decidingId === app._id && !decideMutation.variables?.approved ? (
                          <Loader2 className="animate-spin h-3 w-3" />
                        ) : (
                          <UserX size={12} />
                        )}
                        Rejeter
                      </Button>
                      <Button
                        disabled={decidingId !== null}
                        onClick={() => handleDecision(app._id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[10px] px-4 py-2 cursor-pointer flex items-center gap-1"
                      >
                        {decidingId === app._id && decideMutation.variables?.approved ? (
                          <Loader2 className="animate-spin h-3 w-3" />
                        ) : (
                          <UserCheck size={12} />
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
          <Card className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xs overflow-hidden">
            <CardHeader className="border-b border-slate-50 p-6">
              <CardTitle className="text-sm font-bold text-gray-900">Historique des décisions</CardTitle>
              <CardDescription className="text-[10px] text-gray-400 font-light mt-0.5">
                Suivi des anciennes candidatures.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 divide-y divide-gray-50 space-y-4">
              {historyApps.length === 0 ? (
                <div className="text-center py-6 space-y-1">
                  <p className="text-xs text-gray-400 font-light">Aucun historique disponible</p>
                </div>
              ) : (
                historyApps.map((app) => (
                  <div key={app._id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-800">{app.userId?.name || 'Habitant'}</span>
                      {app.status === 'approved' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1">
                          <CheckCircle size={8} /> Accepté
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-bold rounded-full px-2 py-0.5 flex items-center gap-1">
                          <XCircle size={8} /> Refusé
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-light italic truncate">
                      "{app.motivation}"
                    </p>
                    <p className="text-[8px] text-gray-400 font-light text-right">
                      Le {format(new Date(app.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
