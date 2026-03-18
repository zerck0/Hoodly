export function prepareUsersFilters(filters: {
  search: string;
  role: string;
  isActive: string;
}) {
  return {
    search: filters.search || undefined,
    role: filters.role !== 'all' ? filters.role : undefined,
    isActive: filters.isActive !== 'all' ? filters.isActive === 'true' : undefined,
  };
}
