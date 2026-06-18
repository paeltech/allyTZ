import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../../shared/constants/colors';
import { AdminScreenHeader } from '../../../../components/admin/AdminScreenHeader';
import { AdminSignalPostForm, type ReplyTarget } from '../../../../components/admin/AdminSignalPostForm';
import { ThreadedSignalPostsList } from '../../../../components/ThreadedSignalPostsList';
import { supabase } from '../../../../lib/supabase';
import type { Signal, SignalPost, SignalUpdate } from '../../../../../shared/types/signal';
import { useAdminUsers } from '../../../../hooks/use-admin-users';
import { formatActivityTimestamp } from '../../../../../shared/utils/admin-timestamp';

export default function AdminSignalDiscussionScreen() {
  const { signalId } = useLocalSearchParams<{ signalId: string }>();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [updates, setUpdates] = useState<SignalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const { data: users = [] } = useAdminUsers();

  const load = useCallback(async (isRefresh = false) => {
    if (!signalId) return;
    if (!isRefresh) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setMyId(session?.user?.id ?? null);

      const [signalRes, postsRes, updatesRes] = await Promise.all([
        supabase.from('signals').select('*').eq('id', signalId).single(),
        supabase
          .from('signal_posts')
          .select('*')
          .eq('signal_id', signalId)
          .order('created_at', { ascending: true }),
        supabase
          .from('signal_updates')
          .select('*')
          .eq('signal_id', signalId)
          .order('created_at', { ascending: false }),
      ]);

      setSignal(signalRes.data as Signal | null);
      setPosts((postsRes.data ?? []) as SignalPost[]);
      setUpdates((updatesRes.data ?? []) as SignalUpdate[]);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, [signalId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!signalId) return;
    const channel = supabase
      .channel(`admin-signal-posts-${signalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signal_posts', filter: `signal_id=eq.${signalId}` },
        () => { void load(true); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [signalId, load]);

  const recipientNames = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.user_id] = u.full_name?.trim() || u.email?.split('@')[0] || 'User';
    });
    return map;
  }, [users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const handleReplyToAll = (post: SignalPost) => {
    setReplyTarget({
      parentPostId: post.id,
      parentPostType: post.post_type,
      replyToAuthorId: post.author_id,
      replyToAuthorName: post.author_display_name || 'user',
      mode: 'all_users',
    });
  };

  const handleReplyToAuthor = (post: SignalPost) => {
    setReplyTarget({
      parentPostId: post.id,
      parentPostType: post.post_type,
      replyToAuthorId: post.author_id,
      replyToAuthorName: post.author_display_name || 'user',
      mode: 'specific_user',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <AdminScreenHeader
          title="Signal discussion"
          subtitle={signal ? `${signal.trading_pair} · ${signal.title}` : 'Feedback & updates'}
          showBack
        />

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          <>
            <AdminSignalPostForm
              signalId={signalId!}
              traders={users}
              replyTarget={replyTarget}
              onClearReply={() => setReplyTarget(null)}
              onPosted={() => { void load(true); setReplyTarget(null); }}
            />

            <Text style={styles.sectionTitle}>FEEDBACK & POSTS ({posts.length})</Text>
            <ThreadedSignalPostsList
              posts={posts}
              currentUserId={myId}
              recipientNames={recipientNames}
              isAdminView
              onReplyToAll={handleReplyToAll}
              onReplyToAuthor={handleReplyToAuthor}
              emptyText="No feedback or updates yet on this signal."
            />

            {updates.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  SIGNAL REVISIONS ({updates.length})
                </Text>
                {updates.map((rev) => (
                  <View key={rev.id} style={styles.revisionCard}>
                    <Text style={styles.revisionType}>
                      {rev.revision_type === 'initial' ? 'Initial snapshot' : 'Field update'}
                    </Text>
                    <Text style={styles.revisionTime}>{formatActivityTimestamp(rev.created_at)}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },
  revisionCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revisionType: { color: '#FFF', fontFamily: 'Axiforma-Medium', fontSize: 13 },
  revisionTime: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 11 },
});
