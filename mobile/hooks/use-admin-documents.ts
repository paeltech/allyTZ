import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PanelDocument } from '../../shared/types/document';

export function useAdminDocuments() {
  return useQuery({
    queryKey: ['admin-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panel_documents')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PanelDocument[];
    },
    staleTime: 30_000,
  });
}
