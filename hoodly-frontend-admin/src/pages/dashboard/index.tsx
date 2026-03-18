import { useAuthSync } from '../../hooks/useAuthSync';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Users, AlertTriangle, CalendarDays, Wrench } from 'lucide-react';

const STATS = [
  { label: 'Utilisateurs', icon: Users },
  { label: 'Incidents ouverts', icon: AlertTriangle },
  { label: 'Événements actifs', icon: CalendarDays },
  { label: 'Services en cours', icon: Wrench },
];

export default function DashboardPage() {
  useAuthSync();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
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
    </DashboardLayout>
  );
}
