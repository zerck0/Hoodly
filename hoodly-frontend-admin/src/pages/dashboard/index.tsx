import { useAuth0 } from '@auth0/auth0-react';
import { useAuthSync } from '../../hooks/useAuthSync';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  LayoutDashboard, Users, AlertTriangle,
  CalendarDays, Wrench, Vote, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Utilisateurs', icon: Users, active: false },
  { label: 'Incidents', icon: AlertTriangle, active: false },
  { label: 'Événements', icon: CalendarDays, active: false },
  { label: 'Services', icon: Wrench, active: false },
  { label: 'Votes', icon: Vote, active: false },
];

const STATS = [
  { label: 'Utilisateurs', icon: Users },
  { label: 'Incidents ouverts', icon: AlertTriangle },
  { label: 'Événements actifs', icon: CalendarDays },
  { label: 'Services en cours', icon: Wrench },
];

export default function DashboardPage() {
  const { user: auth0User, logout } = useAuth0();
  useAuthSync(); // déclenche la sync TanStack Query + alimente le store Zustand
  const dbUser = useAuthStore((s) => s.dbUser); // lecture depuis Zustand

  const initials = auth0User?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">H</div>
          <div>
            <p className="font-bold text-sm">HOODLY</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <Button key={label} variant={active ? 'default' : 'ghost'} size="sm" className="w-full justify-start gap-2.5 h-9">
              <Icon size={15} />
              {label}
            </Button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <Avatar className="h-7 w-7">
              <AvatarImage src={auth0User?.picture} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{auth0User?.name}</p>
              <Badge className="text-xs mt-0.5">{dbUser?.role ?? '...'}</Badge>
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start gap-2 text-gray-500 hover:text-red-400 text-xs"
            onClick={() => logout({ logoutParams: { returnTo: `${window.location.origin}/login` } })}
          >
            <LogOut size={13} /> Se déconnecter
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {STATS.map(({ label, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <Icon size={18} className="text-gray-500 mb-3" />
                <p className="text-2xl font-bold">—</p>
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
