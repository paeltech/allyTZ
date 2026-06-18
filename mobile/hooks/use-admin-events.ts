import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface AdminEvent {
  id: string;
  title: string;
  organizer: string;
  description: string;
  category: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  price_type: 'Free' | 'Paid';
  price: number;
  location: string | null;
  capacity: number;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  registration_count?: number;
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsWithCounts = await Promise.all(
        (eventsData ?? []).map(async (event) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .in('registration_status', ['pending', 'confirmed']);

          return {
            ...event,
            registration_count: count ?? 0,
          } as AdminEvent;
        })
      );

      return eventsWithCounts;
    },
    staleTime: 30_000,
  });
}
