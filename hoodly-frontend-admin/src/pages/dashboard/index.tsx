import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthSync } from '../../hooks/useAuthSync';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Users,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { usersApi } from '../../services/api/users';
import { zonesApi } from '../../services/api/zones';
import { incidentsApi } from '../../services/api/incidents';
import { eventsApi } from '../../services/api/events';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  useAuthSync();
  const navigate = useNavigate();

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', { limit: 1 }],
    queryFn: () => usersApi.getAll({ limit: 1 }),
  });

  const { data: zonesData, isLoading: loadingZones } = useQuery({
    queryKey: ['zones', { limit: 1 }],
    queryFn: () => zonesApi.getAll({ limit: 1 }),
  });

  const { data: incidentsData, isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents', 'dashboard'],
    queryFn: () => incidentsApi.getAll(),
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events', { limit: 1 }],
    queryFn: () => eventsApi.getAll({ limit: 1 }),
  });

  const { data: membershipsData, isLoading: loadingMemberships } = useQuery({
    queryKey: ['memberships', 'dashboard'],
    queryFn: () => zonesApi.getMemberships(),
  });

  const stats = useMemo(() => {
    const totalUsers = usersData?.total ?? 0;
    const totalZones = zonesData?.total ?? 0;
    const openIncidents = incidentsData?.filter((i) => i.statut !== 'resolu').length ?? 0;
    const totalEvents = eventsData?.total ?? 0;
    const pendingVerifications = membershipsData?.filter((m) => m.statut === 'en_attente').length ?? 0;

    return {
      totalUsers,
      totalZones,
      openIncidents,
      totalEvents,
      pendingVerifications,
    };
  }, [usersData, zonesData, incidentsData, eventsData, membershipsData]);

  const isAnyLoading = loadingUsers || loadingZones || loadingIncidents || loadingEvents || loadingMemberships;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-gray-900 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Supervision Générale
            </h1>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
              <Activity size={12} className="text-indigo-400" />
              Télémétrie en temps réel connectée au backend de la plateforme Hoodly
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-right">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date système</p>
            <p className="text-sm font-semibold text-gray-200">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="bg-gray-900 border-gray-800 hover:border-indigo-500/20 hover:bg-gray-900/80 transition-all duration-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users size={18} className="text-indigo-400" />
                <Badge variant="secondary" className="bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 text-[10px]">
                  Résidents
                </Badge>
              </div>
              {isAnyLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-20 bg-gray-800 animate-pulse rounded" />
                  <div className="h-3 w-28 bg-gray-800/60 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-white">{stats.totalUsers}</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Résidents inscrits</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:border-emerald-500/20 hover:bg-gray-900/80 transition-all duration-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <MapPin size={18} className="text-emerald-400" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-emerald-400 hover:bg-gray-850"
                  onClick={() => navigate('/zones')}
                >
                  <ArrowUpRight size={14} />
                </Button>
              </div>
              {isAnyLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-12 bg-gray-800 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-800/60 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-white">{stats.totalZones}</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Quartiers cartographiés</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:border-rose-500/20 hover:bg-gray-900/80 transition-all duration-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle size={18} className="text-rose-400" />
                <Badge variant="secondary" className="bg-rose-950/40 text-rose-400 border border-rose-900/50 text-[10px]">
                  Signalements
                </Badge>
              </div>
              {isAnyLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-16 bg-gray-800 animate-pulse rounded" />
                  <div className="h-3 w-28 bg-gray-800/60 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-white">{stats.openIncidents}</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Incidents actifs</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 hover:border-amber-500/20 hover:bg-gray-900/80 transition-all duration-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <ShieldCheck size={18} className="text-amber-400" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-amber-400 hover:bg-gray-850"
                  onClick={() => navigate('/zones/memberships')}
                >
                  <ArrowUpRight size={14} />
                </Button>
              </div>
              {isAnyLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-10 bg-gray-800 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-800/60 animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-white">{stats.pendingVerifications}</p>
                  <p className="text-gray-400 text-xs font-medium mt-1">Dossiers à certifier</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
