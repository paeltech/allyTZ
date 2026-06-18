import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserDirectMessage } from '../../shared/types/direct-message';

export function useDirectMessages(threadUserId?: string) {
  return useQuery({
    queryKey: ['direct-messages', threadUserId ?? 'all'],
    enabled: Boolean(threadUserId),
    queryFn: async () => {
      if (!threadUserId) return [];

      const { data, error } = await supabase
        .from('user_direct_messages')
        .select('*')
        .eq('thread_user_id', threadUserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as UserDirectMessage[];
    },
    staleTime: 10_000,
  });
}

export type ConversationPreview = {
  thread_user_id: string;
  full_name: string | null;
  email: string | null;
  last_message: string;
  last_at: string;
  from_admin: boolean;
};

export function useAdminConversations() {
  return useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('user_direct_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;
      if (!messages?.length) return [] as ConversationPreview[];

      const byThread = new Map<string, UserDirectMessage>();
      for (const msg of messages as UserDirectMessage[]) {
        if (!byThread.has(msg.thread_user_id)) {
          byThread.set(msg.thread_user_id, msg);
        }
      }

      const userIds = [...byThread.keys()];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      return userIds.map((threadUserId) => {
        const latest = byThread.get(threadUserId)!;
        const profile = profiles?.find((p) => p.id === threadUserId);
        return {
          thread_user_id: threadUserId,
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          last_message: latest.body,
          last_at: latest.created_at,
          from_admin: latest.author_id !== threadUserId,
        } satisfies ConversationPreview;
      });
    },
    staleTime: 15_000,
  });
}
