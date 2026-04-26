import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  CalendarDays,
  Wrench,
  Vote,
  LogOut,
  MapPin,
  FileText,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Utilisateurs', icon: Users, path: '/users' },
  { label: 'Incidents', icon: AlertTriangle, path: '/incidents' },
  { label: 'Catalogue Quartiers', icon: MapPin, path: '/zones' },
  { label: 'Radar Ouvertures', icon: FileText, path: '/zones/map' },
  { label: 'Vérification Résidents', icon: Users, path: '/zones/memberships' },
  { label: 'Événements', icon: CalendarDays, path: '/events' },
  { label: 'Services', icon: Wrench, path: '/services' },
  { label: 'Votes', icon: Vote, path: '/votes' },
];


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user: auth0User, logout } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const dbUser = useAuthStore((s) => s.dbUser);

  const initials = auth0User?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="fixed top-0 left-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
            H
          </div>
          <div>
            <p className="font-bold text-sm">HOODLY</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <Button
              key={label}
              variant={location.pathname === path ? 'default' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-2.5 h-9"
              onClick={() => navigate(path)}
            >
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
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-gray-500 hover:text-red-400 text-xs"
            onClick={() =>
              logout({
                logoutParams: { returnTo: `${window.location.origin}/login` },
              })
            }
          >
            <LogOut size={13} /> Se déconnecter
          </Button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
