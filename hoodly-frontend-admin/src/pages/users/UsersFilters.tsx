import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users.store';

export function UsersFilters() {
  const { filters, setFilters, resetFilters } = useUsersStore();

  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      <Select value={filters.role} onValueChange={(role) => setFilters({ role })}>
        <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Tous les rôles" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="all">Tous les rôles</SelectItem>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="moderator">Moderator</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.isActive}
        onValueChange={(isActive) => setFilters({ isActive })}
      >
        <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="true">Actif</SelectItem>
          <SelectItem value="false">Inactif</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={resetFilters} className="border-gray-700 text-white hover:bg-gray-800">
        Réinitialiser
      </Button>
    </div>
  );
}
