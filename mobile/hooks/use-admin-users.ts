import { useQuery } from '@tanstack/react-query';
import { fetchAdminUsers } from '../lib/admin';

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    staleTime: 60_000,
  });
}
