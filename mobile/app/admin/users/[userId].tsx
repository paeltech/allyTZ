import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminDetailRow, AdminPreviewSection } from '../../../components/admin/AdminPreviewSection';
import { supabase } from '../../../lib/supabase';
import { useAdminUsers } from '../../../hooks/use-admin-users';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';
import {
  MENTAL_STATE_OPTIONS,
  TRADING_SESSION_OPTIONS,
} from '../../../../shared/constants/check-in';
import type { DailyCheckIn } from '../../../../shared/types/check-in';
import type { UserDirectMessage } from '../../../../shared/types/direct-message';
import type { SignalPost } from '../../../../shared/types/signal';
import { getSignalPostTypeLabel } from '../../../../shared/utils/signal-posts';
import { MessageSquare, HelpCircle } from 'lucide-react-native';

export default function AdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data: users = [] } = useAdminUsers();
  const user = users.find((u) => u.user_id === userId);

  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [messages, setMessages] = useState<UserDirectMessage[]>([]);
  const [queries, setQueries] = useState<(SignalPost & { trading_pair?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [checkInsRes, messagesRes, postsRes] = await Promise.all([
      supabase.from('daily_check_ins').select('*').eq('user_id', userId).order('check_in_date', { ascending: false }).limit(30),
      supabase.from('user_direct_messages').select('*').eq('thread_user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('signal_posts').select('*, signals(trading_pair)').eq('author_id', userId).order('created_at', { ascending: false }).limit(30),
    ]);

    setCheckIns((checkInsRes.data ?? []) as DailyCheckIn[]);
    setMessages((messagesRes.data ?? []) as UserDirectMessage[]);
    setQueries(
      (postsRes.data ?? []).map((p) => ({
        ...(p as SignalPost),
        trading_pair: (p as { signals?: { trading_pair?: string } }).signals?.trading_pair,
      }))
    );
  }, [userId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const displayName = user?.full_name?.trim() || user?.email?.split('@')[0] || 'User';
  const mentalLabel = (v: string) => MENTAL_STATE_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <AdminScreenHeader title={displayName} subtitle="User profile & activity" showBack />

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          <>
            <AdminPreviewSection title="Profile">
              <AdminDetailRow label="Email" value={user?.email} />
              <AdminDetailRow label="Phone" value={user?.phone_number} />
              <AdminDetailRow label="Role" value={user?.role} />
              <AdminDetailRow label="Joined" value={user ? formatActivityTimestamp(user.created_at) : '—'} />
            </AdminPreviewSection>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/admin/messages/${userId}`)}>
              <MessageSquare size={18} color={Colors.gold} />
              <Text style={styles.actionBtnText}>Open message thread</Text>
            </TouchableOpacity>

            <AdminPreviewSection title={`Check-ins (${checkIns.length})`}>
              {checkIns.length === 0 ? (
                <Text style={styles.empty}>No check-ins recorded yet.</Text>
              ) : (
                checkIns.slice(0, 10).map((c) => (
                  <View key={c.id} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{c.check_in_date}</Text>
                    <Text style={styles.itemMeta}>
                      {c.is_active ? 'Active' : 'Not trading'} · {mentalLabel(c.mental_state)}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Sessions: {c.trading_sessions.map((s) => TRADING_SESSION_OPTIONS.find((o) => o.value === s)?.label ?? s).join(', ') || 'None'}
                    </Text>
                    {c.needs_assistance ? <Text style={styles.alert}>Needs assistance{c.assistance_note ? `: ${c.assistance_note}` : ''}</Text> : null}
                    <Text style={styles.itemTime}>{formatActivityTimestamp(c.created_at)}</Text>
                  </View>
                ))
              )}
            </AdminPreviewSection>

            <AdminPreviewSection title={`Messages (${messages.length})`}>
              {messages.length === 0 ? (
                <Text style={styles.empty}>No direct messages yet.</Text>
              ) : (
                messages.slice(0, 5).map((m) => (
                  <View key={m.id} style={styles.itemCard}>
                    <Text style={styles.itemMeta}>{m.author_display_name || 'User'}</Text>
                    <Text style={styles.itemBody} numberOfLines={3}>{m.body}</Text>
                    {m.attachment_path ? <Text style={styles.itemMeta}>📎 Attachment</Text> : null}
                    <Text style={styles.itemTime}>{formatActivityTimestamp(m.created_at)}</Text>
                  </View>
                ))
              )}
            </AdminPreviewSection>

            <AdminPreviewSection title={`Signal feedback & queries (${queries.length})`}>
              {queries.length === 0 ? (
                <Text style={styles.empty}>No signal posts from this user.</Text>
              ) : (
                queries.slice(0, 10).map((q) => (
                  <View key={q.id} style={styles.itemCard}>
                    <View style={styles.queryHeader}>
                      <HelpCircle size={14} color={Colors.gold} />
                      <Text style={styles.itemTitle}>{getSignalPostTypeLabel(q.post_type)} · {q.trading_pair ?? 'Signal'}</Text>
                    </View>
                    <Text style={styles.itemBody} numberOfLines={4}>{q.summary}</Text>
                    <Text style={styles.itemTime}>{formatActivityTimestamp(q.created_at)}</Text>
                  </View>
                ))
              )}
            </AdminPreviewSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.gold, borderRadius: 12, padding: 14, marginBottom: 20, justifyContent: 'center' },
  actionBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 14 },
  empty: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 13 },
  itemCard: { borderBottomWidth: 1, borderBottomColor: '#1A1A1A', paddingVertical: 10 },
  itemTitle: { color: '#FFF', fontFamily: 'Axiforma-Bold', fontSize: 13 },
  itemMeta: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 12, marginTop: 2 },
  itemBody: { color: '#E5E5E5', fontFamily: 'Axiforma-Regular', fontSize: 13, marginTop: 4, lineHeight: 18 },
  itemTime: { color: Colors.gold, fontFamily: 'Axiforma-Regular', fontSize: 10, marginTop: 6 },
  alert: { color: '#F87171', fontFamily: 'Axiforma-Medium', fontSize: 12, marginTop: 4 },
  queryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
