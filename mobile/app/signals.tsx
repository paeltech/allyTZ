import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';
import {
  formatSignalOrderType,
  getSignalEntryPriceShortLabel,
} from '../../shared/constants/signals';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

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

  const renderSignalCard = (signal: Signal) => {
    const hasUpdates = updateCount(signal) > 0;
    const orderType = signal.order_type ?? 'market';
    const entryLabel = getSignalEntryPriceShortLabel(orderType);
    return (
      <TouchableOpacity
        key={signal.id}
        style={styles.signalCard}
        onPress={() => router.push(`/signals/${signal.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.signalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <Text style={styles.signalPair}>{signal.trading_pair}</Text>
            <Text style={styles.signalOrderType}>{formatSignalOrderType(orderType)}</Text>
            {signal.entry_price != null && (
              <Text style={styles.signalEntry}>
                {entryLabel}: {String(signal.entry_price)}
              </Text>
            )}
          </View>
          <View style={[
            styles.signalButton,
            signal.signal_type === 'buy' ? styles.buyButton : styles.sellButton
          ]}>
            <Text style={styles.signalButtonText}>
              {signal.signal_type.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.signalInfo}>
          <View style={styles.signalInfoItem}>
            <Text style={styles.signalInfoLabel}>SL:</Text>
            <Text style={styles.signalInfoValue}>{String(signal.stop_loss)}</Text>
          </View>
          {signal.take_profit_1 != null && (
            <View style={styles.signalInfoItem}>
              <Text style={styles.signalInfoLabel}>TP1:</Text>
              <Text style={styles.signalInfoValue}>{String(signal.take_profit_1)}</Text>
            </View>
          )}
          {signal.take_profit_2 != null && (
            <View style={styles.signalInfoItem}>
              <Text style={styles.signalInfoLabel}>TP2:</Text>
              <Text style={styles.signalInfoValue}>{String(signal.take_profit_2)}</Text>
            </View>
          )}
        </View>
        <View style={styles.signalTextBlock}>
          <Text style={styles.signalTextLabel}>Reason for decision</Text>
          <Text style={styles.signalTextValue}>{signal.title}</Text>
        </View>
        {signal.analysis ? (
          <View style={styles.signalTextBlock}>
            <Text style={styles.signalTextLabel}>Notes</Text>
            <Text style={styles.signalTextValue} numberOfLines={3}>{signal.analysis}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={styles.signalTimestamp}>
            {(() => {
              const now = new Date();
              const createdAt = new Date(signal.created_at);
              const diffMs = now.getTime() - createdAt.getTime();
              const diffSec = Math.floor(diffMs / 1000);
              if (diffSec < 60) return `${diffSec} sec${diffSec === 1 ? '' : 's'} ago`;
              const diffMin = Math.floor(diffSec / 60);
              if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
              const diffHr = Math.floor(diffMin / 60);
              if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
              const diffDay = Math.floor(diffHr / 24);
              return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
            })()}
          </Text>
          {signal.confidence_level && (
            <View style={{ 
              backgroundColor: '#222A2A', 
              borderRadius: 8, 
              paddingVertical: 4, 
              paddingHorizontal: 10,
              marginLeft: 8
            }}>
              <Text style={{ 
                color: '#9d9d9d', 
                fontFamily: 'Axiforma-Bold', 
                fontSize: 12, 
                letterSpacing: 0.5
              }}>
                Confidence: {signal.confidence_level.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        {hasUpdates && (
          <View style={styles.updateBadge}>
            <Edit3 size={12} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.updateBadgeText}>{updateCount(signal)} update{updateCount(signal) === 1 ? '' : 's'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
  signalCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  updateBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
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
    marginRight: 8,
  },
  signalOrderType: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    marginRight: 8,
    textTransform: 'uppercase',
  },
  signalEntry: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  signalTextBlock: {
    marginBottom: 10,
  },
  signalTextLabel: {
    color: '#9A9A9A',
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  signalTextValue: {
    color: '#E5E5E5',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  signalButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  buyButton: {
    backgroundColor: '#22C55E',
  },
  sellButton: {
    backgroundColor: '#FF4444',
  },
  signalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
  },
  signalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingRight: 8,
  },
  signalInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  signalInfoLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    marginRight: 4,
  },
  signalInfoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
  signalTimestamp: {
    color: '#9A9A9A',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginTop: 0,
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
