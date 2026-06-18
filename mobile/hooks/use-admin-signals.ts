import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';

export function useAdminSignals() {
  return useQuery({
    queryKey: ['admin-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Signal[];
    },
    staleTime: 30_000,
  });
}
