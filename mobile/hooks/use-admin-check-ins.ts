import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DailyCheckIn } from '../../shared/types/check-in';

export type CheckInWithProfile = DailyCheckIn & {
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
};

export async function fetchAdminCheckIns(): Promise<CheckInWithProfile[]> {
  const { data: checkIns, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .order('check_in_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  if (!checkIns?.length) return [];

  const userIds = [...new Set(checkIns.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, phone_number')
    .in('id', userIds);

  return checkIns.map((checkIn) => {
    const profile = profiles?.find((p) => p.id === checkIn.user_id);
    return {
      ...(checkIn as DailyCheckIn),
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone_number: profile?.phone_number ?? null,
    };
  });
}

export function useAdminCheckIns() {
  return useQuery({
    queryKey: ['admin-check-ins'],
    queryFn: fetchAdminCheckIns,
    staleTime: 60_000,
  });
}
