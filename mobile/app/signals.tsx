import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';
import { SignalListCard } from '../components/SignalListCard';

export default function SignalsScreen() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [updateCountBySignalId, setUpdateCountBySignalId] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useUnreadNotificationsCount();

  const fetchSignals = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching signals:', error);
        setSignals([]);
        setUpdateCountBySignalId({});
        return;
      }

      const list = data || [];
      setSignals(list);

      if (list.length === 0) {
        setUpdateCountBySignalId({});
        return;
      }

      const signalIds = list.map((s: Signal) => s.id);
      const { data: updatesData, error: updatesError } = await supabase
        .from('signal_updates')
        .select('signal_id')
        .in('signal_id', signalIds)
        .eq('revision_type', 'update');

      const counts: Record<string, number> = {};
      signalIds.forEach((sid: string) => { counts[sid] = 0; });
      if (!updatesError && updatesData) {
        updatesData.forEach((row: { signal_id: string }) => {
          counts[row.signal_id] = (counts[row.signal_id] ?? 0) + 1;
        });
      }
      setUpdateCountBySignalId(counts);
    } catch (error) {
      console.error('Error fetching signals:', error);
      setSignals([]);
      setUpdateCountBySignalId({});
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSignals();

    // Subscribe to real-time updates for signals and signal_updates
    const channel = supabase
      .channel('signals-changes-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        () => { fetchSignals(true); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signal_updates' },
        () => { fetchSignals(true); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSignals(true);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options).replace(',', '');
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isYesterday = (dateString: string) => {
    const date = new Date(dateString);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const todaySignals = signals.filter(signal => isToday(signal.created_at));
  const yesterdaySignals = signals.filter(signal => isYesterday(signal.created_at));
  const olderSignals = signals.filter(
    signal => !isToday(signal.created_at) && !isYesterday(signal.created_at)
  );

  const updateCount = (signal: Signal) => updateCountBySignalId[signal.id] ?? 0;

  const renderSignalCard = (signal: Signal) => (
    <SignalListCard
      key={signal.id}
      signal={signal}
      updateCount={updateCount(signal)}
      onPress={() => router.push(`/signals/${signal.id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={28} color={Colors.gold} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signals</Text>
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
        showsVerticalScrollIndicator={false as boolean}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Trade signals</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : (
          <>
            {/* Today's Signals */}
            {todaySignals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TODAY'S TRADE SIGNALS</Text>
                {todaySignals.map(renderSignalCard)}
              </View>
            )}

            {/* Yesterday's Signals */}
            {yesterdaySignals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>YESTERDAY TRADE SIGNALS</Text>
                {yesterdaySignals.map(renderSignalCard)}
              </View>
            )}

            {/* Older Signals */}
            {olderSignals.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PREVIOUS TRADE SIGNALS</Text>
                {olderSignals.map(renderSignalCard)}
              </View>
            )}

            {signals.length === 0 && (
              <Text style={styles.noSignalsText}>No signals available</Text>
            )}
          </>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noSignalsText: {
    color: '#A0A0A0',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
