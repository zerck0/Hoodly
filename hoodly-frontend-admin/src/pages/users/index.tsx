import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users as UsersIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usersApi } from '@/services/api/users';
import { useUsersStore } from '@/stores/users.store';
import { useAuthStore } from '@/stores/auth.store';
import { prepareUsersFilters } from '@/lib/utils/filters';
import { UsersFilters } from './UsersFilters';
import { UsersTable } from './UsersTable';
import { EditUserDialog } from './EditUserDialog';
import { UsersPagination } from './UsersPagination';
import type { IUserResponse, IUpdateUserDto } from '@/types/user.types';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { filters } = useUsersStore();
  const dbUser = useAuthStore((s) => s.dbUser);
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<IUserResponse | null>(null);

  // Récupération des utilisateurs
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, filters],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit: 10,
        ...prepareUsersFilters(filters),
      }),
  });

  // Mettre à jour un utilisateur
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: IUpdateUserDto }) =>
      usersApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  // Supprimer un utilisateur
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (user: IUserResponse) => {
    setEditingUser(user);
  };

  const handleSave = (userId: string, updates: IUpdateUserDto) => {
    updateMutation.mutate({ id: userId, updates });
  };

  const handleDelete = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">
              Gérez les utilisateurs et leurs permissions
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Utilisateurs ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsersFilters />

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : data?.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <>
                <UsersTable
                  users={data?.users || []}
                  currentUserId={dbUser?.id}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                {data && data.totalPages > 1 && (
                  <UsersPagination
                    currentPage={page}
                    totalPages={data.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}
