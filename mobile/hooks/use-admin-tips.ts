import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TradingTip } from '../../shared/types/tip';

export function useAdminTips() {
  return useQuery({
    queryKey: ['admin-tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_tips')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as TradingTip[];
    },
    staleTime: 30_000,
  });
}
