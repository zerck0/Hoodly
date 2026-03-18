export function getRoleBadgeVariant(role: string) {
  const variants = {
    admin: 'destructive',
    moderator: 'default',
    user: 'secondary',
  } as const;
  
  return variants[role as keyof typeof variants] || 'secondary';
}

export function getStatusBadgeVariant(isActive?: boolean) {
  return isActive ? 'default' : 'secondary';
}

export function getStatusLabel(isActive?: boolean) {
  return isActive ? 'Actif' : 'Inactif';
}
