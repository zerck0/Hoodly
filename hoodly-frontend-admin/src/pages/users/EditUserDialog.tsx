import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { IUserResponse, IUpdateUserDto } from '@/types/user.types';

interface EditUserDialogProps {
  user: IUserResponse | null;
  open: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: IUpdateUserDto) => void;
}

export function EditUserDialog({
  user,
  open,
  onClose,
  onSave,
}: EditUserDialogProps) {
  const [role, setRole] = useState<string>('user');
  const [isActive, setIsActive] = useState<string>('true');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setIsActive(user.isActive ? 'true' : 'false');
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    onSave(user.id, {
      role: role as IUpdateUserDto['role'],
      isActive: isActive === 'true',
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Modifier l'utilisateur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Email</label>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Rôle</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Statut</label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-white hover:bg-gray-800">
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
