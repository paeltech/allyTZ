import React, { useCallback, useEffect, useState } from 'react';
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
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft, Bell, History, Edit3, MessageSquare } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { Signal, SignalPost, SignalUpdate } from '../../../shared/types/signal';
import {
  SIGNAL_FIELD_LABELS,
  formatSignalOrderType,
  getSignalEntryPriceShortLabel,
} from '../../../shared/constants/signals';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';
import { useIsAdmin } from '../../hooks/use-is-admin';
import { SignalPostForm } from '../../components/SignalPostForm';
import { SignalPostsList } from '../../components/SignalPostsList';

const FIELD_LABELS: Record<string, string> = {
  ...SIGNAL_FIELD_LABELS,
  entry_price: 'Entry price',
};

export default function SignalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [updates, setUpdates] = useState<SignalUpdate[]>([]);
  const [posts, setPosts] = useState<SignalPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useUnreadNotificationsCount();
  const { isAdmin } = useIsAdmin();

  const fetchSignalAndUpdates = useCallback(async (isRefreshing = false) => {
    if (!id) return;
    try {
      if (!isRefreshing) setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);

      const [signalRes, updatesRes, postsRes] = await Promise.all([
        supabase.from('signals').select('*').eq('id', id).single(),
        supabase
          .from('signal_updates')
          .select('*')
          .eq('signal_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('signal_posts')
          .select('*')
          .eq('signal_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (signalRes.error) {
        console.error('Error fetching signal:', signalRes.error);
        setSignal(null);
      } else {
        setSignal(signalRes.data);
      }
      if (updatesRes.error) {
        console.error('Error fetching signal updates:', updatesRes.error);
        setUpdates([]);
      } else {
        setUpdates(updatesRes.data || []);
      }
      if (postsRes.error) {
        console.error('Error fetching signal posts:', postsRes.error);
        setPosts([]);
      } else {
        setPosts(postsRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isRefreshing) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchSignalAndUpdates();
  }, [id, fetchSignalAndUpdates]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`signal-posts-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signal_posts', filter: `signal_id=eq.${id}` },
        () => { fetchSignalAndUpdates(true); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchSignalAndUpdates]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSignalAndUpdates(true);
    setRefreshing(false);
  };

  const initialSnapshot = updates.find((u) => u.revision_type === 'initial');
  const updateRevisions = updates.filter((u) => u.revision_type === 'update');

  // Fields that differ from initial snapshot → highlight in gold on Current card
  const currentChangedFields = (() => {
    const base = initialSnapshot?.snapshot;
    if (!signal || !base || typeof base !== 'object') return new Set<string>();
    const changed = new Set<string>();
    const keys: (keyof Signal)[] = [
      'trading_pair', 'signal_type', 'order_type', 'entry_price', 'stop_loss',
      'take_profit_1', 'take_profit_2', 'take_profit_3',
      'title', 'analysis', 'confidence_level', 'status',
    ];
    for (const key of keys) {
      const a = signal[key];
      const b = (base as Record<string, unknown>)[key];
      const norm = (v: unknown) => (v == null ? null : typeof v === 'number' ? v : String(v));
      if (norm(a) !== norm(b)) changed.add(key);
    }
    return changed;
  })();

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderValue = (v: number | string | null) =>
    v == null ? '—' : String(v);

  if (isLoading && !signal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Signal details</Text>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!signal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Signal details</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Signal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderType = signal.order_type ?? 'market';
  const entryLabel = getSignalEntryPriceShortLabel(orderType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signal details</Text>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={20} color={Colors.gold} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* Current state (from signals row) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current</Text>
          <View style={styles.card}>
            <View style={styles.signalHeader}>
              <Text style={[
                styles.signalPair,
                currentChangedFields.has('trading_pair') && styles.valueChanged,
              ]}>
                {signal.trading_pair}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  signal.signal_type === 'buy' ? styles.buyBadge : styles.sellBadge,
                  currentChangedFields.has('signal_type') && styles.typeBadgeChanged,
                ]}
              >
                <Text style={styles.typeBadgeText}>{signal.signal_type.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Order type</Text>
              <Text style={[
                styles.value,
                currentChangedFields.has('order_type') && styles.valueChanged,
              ]}>
                {formatSignalOrderType(orderType)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{entryLabel}</Text>
              <Text style={[
                styles.value,
                currentChangedFields.has('entry_price') && styles.valueChanged,
              ]}>
                {renderValue(signal.entry_price)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Stop loss</Text>
              <Text style={[
                styles.value,
                currentChangedFields.has('stop_loss') && styles.valueChanged,
              ]}>
                {renderValue(signal.stop_loss)}
              </Text>
            </View>
            {signal.take_profit_1 != null && (
              <View style={styles.row}>
                <Text style={styles.label}>TP1</Text>
                <Text style={[
                  styles.value,
                  currentChangedFields.has('take_profit_1') && styles.valueChanged,
                ]}>
                  {renderValue(signal.take_profit_1)}
                </Text>
              </View>
            )}
            {signal.take_profit_2 != null && (
              <View style={styles.row}>
                <Text style={styles.label}>TP2</Text>
                <Text style={[
                  styles.value,
                  currentChangedFields.has('take_profit_2') && styles.valueChanged,
                ]}>
                  {renderValue(signal.take_profit_2)}
                </Text>
              </View>
            )}
            {signal.take_profit_3 != null && (
              <View style={styles.row}>
                <Text style={styles.label}>TP3</Text>
                <Text style={[
                  styles.value,
                  currentChangedFields.has('take_profit_3') && styles.valueChanged,
                ]}>
                  {renderValue(signal.take_profit_3)}
                </Text>
              </View>
            )}
            {signal.confidence_level && (
              <View style={styles.row}>
                <Text style={styles.label}>Confidence</Text>
                <Text style={[
                  styles.value,
                  currentChangedFields.has('confidence_level') && styles.valueChanged,
                ]}>
                  {signal.confidence_level}
                </Text>
              </View>
            )}
            <View style={[styles.textBlock, currentChangedFields.has('title') && styles.textBlockChanged]}>
              <Text style={styles.textBlockLabel}>Reason for decision</Text>
              <Text style={styles.textBlockValue}>{signal.title}</Text>
            </View>
            {signal.analysis ? (
              <View style={[styles.textBlock, currentChangedFields.has('analysis') && styles.textBlockChanged]}>
                <Text style={styles.textBlockLabel}>Notes</Text>
                <Text style={styles.textBlockValue}>{signal.analysis}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text style={[
                styles.value,
                currentChangedFields.has('status') && styles.valueChanged,
              ]}>
                {signal.status}
              </Text>
            </View>
            <Text style={styles.meta}>Updated {formatTime(signal.updated_at)}</Text>
          </View>
        </View>

        {/* Initial state (from first snapshot if any) */}
        {initialSnapshot?.snapshot && typeof initialSnapshot.snapshot === 'object' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Initial (at first update)</Text>
            <View style={styles.card}>
              <Text style={styles.updateTime}>
                {formatTime(initialSnapshot.created_at)}
              </Text>
              {Object.entries(initialSnapshot.snapshot).map(([key, val]) => (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{FIELD_LABELS[key] || key}</Text>
                  <Text style={styles.value}>{renderValue(val as number | string | null)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Update history */}
        {updateRevisions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <History size={18} color={Colors.gold} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Updates ({updateRevisions.length})</Text>
            </View>
            {updateRevisions.map((rev, idx) => (
              <View key={rev.id} style={styles.updateCard}>
                <View style={styles.updateHeader}>
                  <Edit3 size={16} color={Colors.gold} strokeWidth={2} />
                  <Text style={styles.updateTime}>{formatTime(rev.created_at)}</Text>
                </View>
                {rev.changes &&
                  typeof rev.changes === 'object' &&
                  Object.entries(rev.changes).map(([field, change]) => {
                    const c = change as { old?: number | string | null; new?: number | string | null };
                    return (
                      <View key={field} style={styles.changeRow}>
                        <Text style={styles.label}>{FIELD_LABELS[field] || field}</Text>
                        <Text style={styles.changeText}>
                          {renderValue(c.old ?? null)} → {renderValue(c.new ?? null)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MessageSquare size={18} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Discussion ({posts.length})</Text>
          </View>
          <Text style={styles.sectionHint}>
            Post feedback for everyone or send a question privately to admin.
          </Text>
          <SignalPostForm
            signalId={signal.id}
            isAdmin={isAdmin}
            onPosted={() => fetchSignalAndUpdates(true)}
          />
          <SignalPostsList posts={posts} currentUserId={currentUserId} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
  },
  headerPlaceholder: { width: 44, height: 44 },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 12,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#A0A0A0', fontSize: 16, fontFamily: 'Axiforma-Regular' },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHint: {
    color: '#6A6A6A',
    fontFamily: 'Axiforma-Regular',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  updateCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  updateTime: {
    color: '#9A9A9A',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 8,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  signalPair: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  buyBadge: { backgroundColor: '#22C55E' },
  sellBadge: { backgroundColor: '#FF4444' },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  changeRow: { paddingVertical: 4 },
  label: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
  },
  valueChanged: {
    color: Colors.gold,
    fontFamily: 'Axiforma-Bold',
  },
  typeBadgeChanged: {
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  changeText: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginLeft: 4,
  },
  textBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  textBlockChanged: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
    paddingLeft: 8,
  },
  textBlockLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textBlockValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  meta: {
    color: '#6A6A6A',
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
    marginTop: 12,
  },
});
