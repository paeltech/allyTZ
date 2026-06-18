import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../shared/constants/colors';
import {
  User,
  Bell,
  TrendingUp,
  BarChart3,
  FolderOpen,
  Edit3,
  Lightbulb,
  Calendar as CalendarIcon,
  HelpCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';
import {
  formatSignalOrderType,
  getSignalEntryPriceShortLabel,
} from '../../shared/constants/signals';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

export default function HomeScreen() {
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [latestSignalUpdateCount, setLatestSignalUpdateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotificationsCount, refreshCount } = useUnreadNotificationsCount();

  useFocusEffect(
    useCallback(() => {
      refreshCount();
    }, [refreshCount])
  );

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/auth/login');
    } else {
      setUser(session.user);
    }
  };

  const fetchLatestSignal = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching signal:', error);
        setLatestSignal(null);
        setLatestSignalUpdateCount(0);
        return;
      }

      setLatestSignal(data);

      if (data?.id) {
        const { count, error: countError } = await supabase
          .from('signal_updates')
          .select('*', { count: 'exact', head: true })
          .eq('signal_id', data.id)
          .eq('revision_type', 'update');
        if (!countError && count != null) {
          setLatestSignalUpdateCount(count);
        } else {
          setLatestSignalUpdateCount(0);
        }
      } else {
        setLatestSignalUpdateCount(0);
      }
    } catch (error) {
      console.error('Error fetching signal:', error);
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    checkAuth();
    fetchLatestSignal();

    const signalsChannel = supabase
      .channel('signals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signals' },
        () => { fetchLatestSignal(true); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signal_updates' },
        () => { fetchLatestSignal(true); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(signalsChannel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLatestSignal(true),
      refreshCount(),
    ]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.profileIcon}>
              <User size={24} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>
                {(() => {
                  const name = user?.user_metadata?.full_name || 'Trader';
                  return name.charAt(0).toUpperCase() + name.slice(1);
                })()}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={Colors.gold} strokeWidth={2} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.signalCard}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        ) : latestSignal ? (
          <TouchableOpacity
            style={styles.signalCard}
            onPress={() => router.push(`/signals/${latestSignal.id}`)}
            activeOpacity={0.85}
          >
            <View style={styles.signalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <Text style={styles.signalPair}>{latestSignal.trading_pair}</Text>
                <Text style={styles.signalOrderType}>
                  {formatSignalOrderType(latestSignal.order_type ?? 'market')}
                </Text>
                {latestSignal.entry_price != null && (
                  <Text style={styles.signalEntry}>
                    {getSignalEntryPriceShortLabel(latestSignal.order_type ?? 'market')}: {String(latestSignal.entry_price)}
                  </Text>
                )}
              </View>
              <View style={[
                styles.signalTypeButton,
                latestSignal.signal_type === 'buy' && styles.buyButton,
              ]}>
                <Text style={styles.signalTypeText}>
                  {latestSignal.signal_type.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.signalInfo}>
              <View style={styles.signalInfoItem}>
                <Text style={styles.signalInfoLabel}>SL:</Text>
                <Text style={styles.signalInfoValue}>{String(latestSignal.stop_loss)}</Text>
              </View>
              {latestSignal.take_profit_1 != null && (
                <View style={styles.signalInfoItem}>
                  <Text style={styles.signalInfoLabel}>TP1:</Text>
                  <Text style={styles.signalInfoValue}>{String(latestSignal.take_profit_1)}</Text>
                </View>
              )}
              {latestSignal.take_profit_2 != null && (
                <View style={styles.signalInfoItem}>
                  <Text style={styles.signalInfoLabel}>TP2:</Text>
                  <Text style={styles.signalInfoValue}>{String(latestSignal.take_profit_2)}</Text>
                </View>
              )}
            </View>
            <View style={styles.signalTextBlock}>
              <Text style={styles.signalTextLabel}>Reason for decision</Text>
              <Text style={styles.signalTextValue}>{latestSignal.title}</Text>
            </View>
            {latestSignal.analysis ? (
              <View style={styles.signalTextBlock}>
                <Text style={styles.signalTextLabel}>Notes</Text>
                <Text style={styles.signalTextValue} numberOfLines={2}>{latestSignal.analysis}</Text>
              </View>
            ) : null}
            <View style={styles.signalFooter}>
              <Text style={styles.signalTimestamp}>
                {(() => {
                  const now = new Date();
                  const createdAt = new Date(latestSignal.created_at);
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
              {latestSignal.confidence_level && (
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    Confidence: {latestSignal.confidence_level.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            {latestSignalUpdateCount > 0 && (
              <View style={styles.signalUpdateBadge}>
                <Edit3 size={12} color="#FFF" strokeWidth={2.5} />
                <Text style={styles.signalUpdateBadgeText}>
                  {latestSignalUpdateCount} update{latestSignalUpdateCount === 1 ? '' : 's'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.signalCard}>
            <Text style={styles.noSignalText}>No active signals at the moment</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trading Hub</Text>
          <Text style={styles.sectionSubtitle}>CORE MODULES</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={[styles.featureCard, { marginRight: 6 }]}
              onPress={() => router.push('/signals')}
            >
              <View style={styles.featureIcon}>
                <TrendingUp size={18} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Signals</Text>
              <Text style={styles.featureDescription}>Live trade signals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.featureCard, { marginLeft: 6 }]}
              onPress={() => router.push('/analysis')}
            >
              <View style={styles.featureIcon}>
                <BarChart3 size={18} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Analysis</Text>
              <Text style={styles.featureDescription}>Daily pair breakdowns</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>RESOURCES</Text>
          <TouchableOpacity
            style={styles.wideCard}
            onPress={() => router.push('/tips')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, styles.wideCardIcon]}>
              <Lightbulb size={18} color={Colors.gold} strokeWidth={2.5} />
            </View>
            <View style={styles.wideCardText}>
              <Text style={[styles.featureTitle, styles.wideCardTitle]}>Tips & Quotes</Text>
              <Text style={[styles.featureDescription, styles.wideCardDescription]}>
                Daily trading wisdom
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.wideCard, { marginTop: 10 }]}
            onPress={() => router.push('/documents')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, styles.wideCardIcon]}>
              <FolderOpen size={18} color={Colors.gold} strokeWidth={2.5} />
            </View>
            <View style={styles.wideCardText}>
              <Text style={[styles.featureTitle, styles.wideCardTitle]}>Documents</Text>
              <Text style={[styles.featureDescription, styles.wideCardDescription]}>
                Guides and resources (view only)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>More</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={[styles.supportCard, { marginRight: 6 }]}
              onPress={() => router.push('/events')}
            >
              <View style={styles.supportIcon}>
                <CalendarIcon size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.supportLabel}>Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.supportCard, { marginLeft: 6 }]}
              onPress={() => router.push('/help')}
            >
              <View style={styles.supportIcon}>
                <HelpCircle size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.supportLabel}>Help</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  welcomeText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
  },
  userName: {
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
    overflow: 'visible',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    lineHeight: 13,
  },
  signalCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    marginTop: 8,
    position: 'relative',
  },
  signalUpdateBadge: {
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
  signalUpdateBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  signalPair: {
    color: '#FFFFFF',
    fontSize: 24,
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
    marginBottom: 12,
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
  signalTypeButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  buyButton: {
    backgroundColor: '#22C55E',
  },
  signalTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
  },
  noSignalText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  signalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    marginRight: 2,
  },
  signalInfoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
  signalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  signalTimestamp: {
    color: '#9A9A9A',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
  },
  confidenceBadge: {
    backgroundColor: '#222A2A',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  confidenceText: {
    color: '#9d9d9d',
    fontFamily: 'Axiforma-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: 'row',
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    minHeight: 132,
  },
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
  },
  wideCardIcon: {
    marginBottom: 0,
  },
  wideCardText: {
    flex: 1,
    marginLeft: 4,
  },
  wideCardTitle: {
    textAlign: 'left',
  },
  wideCardDescription: {
    textAlign: 'left',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: '#A0A0A0',
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 15,
  },
  supportSection: {
    backgroundColor: '#EBEBEB',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
  },
  supportTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 12,
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
  },
});
