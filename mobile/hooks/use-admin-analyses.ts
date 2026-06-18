import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TradeAnalysis } from '../../shared/types/analysis';

export type AdminTradeAnalysis = TradeAnalysis & {
  chart_image_url?: string | null;
};

export function useAdminAnalyses() {
  return useQuery({
    queryKey: ['admin-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trade_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AdminTradeAnalysis[];
    },
    staleTime: 30_000,
  });
}
