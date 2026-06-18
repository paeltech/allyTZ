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
  GraduationCap, 
  Users, 
  UserRound,
  Calendar as CalendarIcon,
  Calculator,
  TrendingDown,
  FolderOpen,
  Edit3,
  Lightbulb
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import type { Signal } from '../../shared/types/signal';
import { useUnreadNotificationsCount } from '../hooks/use-unread-notifications';

export default function HomeScreen() {
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [latestSignalUpdateCount, setLatestSignalUpdateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { unreadCount: unreadNotificationsCount, refreshCount } = useUnreadNotificationsCount();

  // Refresh unread count when screen gains focus (e.g. after marking as read on notifications screen)
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

    // Subscribe to real-time updates for signals and signal_updates
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
      refreshCount()
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
        {/* Header Section */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.notificationIcon}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={20} color={Colors.gold} strokeWidth={2} />
              {unreadNotificationsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 11, 
                    fontFamily: 'Axiforma-Bold',
                    lineHeight: 13
                  }}>
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Trading Signal Card */}
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
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <Text style={styles.signalPair}>{latestSignal.trading_pair}</Text>
                 {latestSignal.entry_price != null && (
                   <Text style={{ 
                     marginLeft: 8,
                     color: '#A0A0A0',
                     fontSize: 14,
                     fontFamily: 'Axiforma-Regular'
                   }}>
                     Entry: {String(latestSignal.entry_price)}
                   </Text>
                 )}
               </View>
              <View style={[
                styles.sellButton,
                latestSignal.signal_type === 'buy' && styles.buyButton
              ]}>
                <Text style={styles.sellButtonText}>
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
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
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
                     Confidence: {latestSignal.confidence_level.toUpperCase()}
                   </Text>
                 </View>
               )}
             </View>
             {latestSignalUpdateCount > 0 && (
               <View style={styles.signalUpdateBadge}>
                 <Edit3 size={12} color="#FFF" strokeWidth={2.5} />
                 <Text style={styles.signalUpdateBadgeText}>{latestSignalUpdateCount} update{latestSignalUpdateCount === 1 ? '' : 's'}</Text>
               </View>
             )}
          </TouchableOpacity>
        ) : (
          <View style={styles.signalCard}>
            <Text style={styles.noSignalText}>No active signals at the moment</Text>
          </View>
        )}

        {/* Trade with AllyTZ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trade with AllyTZ</Text>
          <Text style={styles.sectionSubtitle}>PIPS HUNTING</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.featureCard, { marginRight: 6 }]}
              onPress={() => router.push('/signals')}
            >
              <View style={styles.featureIcon}>
                <TrendingUp size={16} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Signals</Text>
              <Text style={styles.featureDescription}>Real-time trade signals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.featureCard, { marginLeft: 6 }]}
              onPress={() => router.push('/analysis')}
            >
              <View style={styles.featureIcon}>
                <BarChart3 size={16} color={Colors.gold} strokeWidth={2.5} />
              </View>
              <Text style={styles.featureTitle}>Analysis</Text>
              <Text style={styles.featureDescription}>Daily trade pair analysis</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.tipsWideCard}
            onPress={() => router.push('/tips')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, styles.tipsWideIcon]}>
              <Lightbulb size={16} color={Colors.gold} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text style={[styles.featureTitle, { textAlign: 'left' }]}>Tips & Quotes</Text>
              <Text style={[styles.featureDescription, { textAlign: 'left' }]}>Daily trading wisdom and inspiration</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tipsWideCard, { marginTop: 10 }]}
            onPress={() => router.push('/documents')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, styles.tipsWideIcon]}>
              <FolderOpen size={16} color={Colors.gold} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text style={[styles.featureTitle, { textAlign: 'left' }]}>Documents</Text>
              <Text style={[styles.featureDescription, { textAlign: 'left' }]}>Guides and resources (view only)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Learn the Craft Section */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>LEARN THE CRAFT</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.learnIcon} onPress={() => router.push('/academy')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <GraduationCap size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Academy</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/mentorship')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <Users size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Mentorship</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/events')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <CalendarIcon size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>Events</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.learnIcon, { marginLeft: 8 }]} onPress={() => router.push('/one-on-one')}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.learnIconCircle}>
                  <UserRound size={30} color="#1A1A1A" strokeWidth={2} />
                </View>
                <Text style={styles.learnIconLabel}>1 on 1</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tools of the game Section */}
        <View style={styles.toolsSection}>
          <Text style={styles.toolsTitle}>Tools of the game</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.toolIcon} onPress={() => router.push('/calculator')}>
              <View style={styles.toolIconCircle}>
                <Calculator size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Calculator</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/calendar')}>
              <View style={styles.toolIconCircle}>
                <CalendarIcon size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/sentiment')}>
              <View style={styles.toolIconCircle}>
                <TrendingDown size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Sentiment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolIcon, { marginLeft: 8 }]} onPress={() => router.push('/help')}>
              <View style={styles.toolIconCircle}>
                <FolderOpen size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <Text style={styles.toolIconLabel}>Help</Text>
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
  signalCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 48,
    marginTop: 24,
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
  },
  sellButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
  },
  buyButton: {
    backgroundColor: '#22C55E',
  },
  sellButtonText: {
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
  signalTimestamp: {
    color: '#9A9A9A',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginTop: 0,
  },
  section: {
    marginBottom: 28,
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
  },
  tipsWideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  tipsWideIcon: {
    marginBottom: 0,
  },
  featureIcon: {
    width: 32,
    height: 32,
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
    fontSize: 10,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    lineHeight: 15,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 0,
  },
  learnIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  learnIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  learnIconLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    textAlign: 'center',
  },
  toolsSection: {
    backgroundColor: '#EBEBEB',
    borderRadius: 16,
    padding: 20,
    marginTop: 4,
  },
  toolsTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  toolIcon: {
    alignItems: 'center',
    flex: 1,
  },
  toolIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    borderWidth: 0,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolIconLabel: {
    color: '#1A1A1A',
    fontSize: 12,
    fontFamily: 'Axiforma-Medium',
    textAlign: 'center',
  },
});
