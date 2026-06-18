import React, { useEffect, useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { Colors } from '../../../shared/constants/colors';
import {
  Users,
  ClipboardCheck,
  Shield,
  User,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Lightbulb,
  Bell,
} from 'lucide-react-native';
import { StatCard } from '../../components/admin/StatCard';
import { useAdminUsers } from '../../hooks/use-admin-users';
import { useAdminCheckIns } from '../../hooks/use-admin-check-ins';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';
import { getEatDateString } from '../../../shared/utils/eat-time';
import { supabase } from '../../lib/supabase';
import {
  formatDisplayName,
  resolveUserDisplayName,
} from '../../../shared/utils/user-display-name';

export default function AdminDashboardScreen() {
  const [displayName, setDisplayName] = useState('');
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { data: checkIns = [], isLoading: checkInsLoading, refetch: refetchCheckIns } = useAdminCheckIns();
  const { unreadCount } = useUnreadNotificationsCount();
  const [refreshing, setRefreshing] = useState(false);

  const today = getEatDateString();

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      const name = resolveUserDisplayName({
        profileFullName: profileData?.full_name,
        userMetadata: session.user.user_metadata,
        email: session.user.email,
      });
      setDisplayName(formatDisplayName(name));
    }
    void loadProfile();
  }, []);

  const stats = useMemo(() => {
    const regularUsers = users.filter((u) => u.role === 'user');
    const todayCheckIns = checkIns.filter((c) => c.check_in_date === today);
    const todayUserIds = new Set(todayCheckIns.map((c) => c.user_id));
    const needsAssistance = todayCheckIns.filter((c) => c.needs_assistance);
    const activeToday = todayCheckIns.filter((c) => c.is_active);

    const checkInRate =
      regularUsers.length > 0
        ? Math.round((todayUserIds.size / regularUsers.length) * 100)
        : 0;

    return {
      totalUsers: users.length,
      regularUsers: regularUsers.length,
      todayCheckIns: todayUserIds.size,
      checkInRate,
      needsAssistance: needsAssistance.length,
      activeToday: activeToday.length,
    };
  }, [users, checkIns, today]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUsers(), refetchCheckIns()]);
    setRefreshing(false);
  };

  const isLoading = usersLoading || checkInsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/admin/profile')}>
            <View style={styles.profileIcon}>
              <Shield size={22} color={Colors.gold} strokeWidth={2} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Admin panel</Text>
              <Text style={styles.userName}>{displayName || '…'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/admin/notifications')}>
              <Bell size={20} color={Colors.gold} strokeWidth={2} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/admin/profile')}>
              <User size={20} color={Colors.gold} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.sectionSubtitle}>TODAY&apos;S OVERVIEW</Text>
            <View style={styles.statRow}>
              <StatCard
                label="Users"
                value={stats.totalUsers}
                subtitle={`${stats.regularUsers} traders`}
                style={{ marginRight: 6 }}
              />
              <StatCard
                label="Checked in"
                value={stats.todayCheckIns}
                subtitle={`${stats.checkInRate}% of traders`}
                style={{ marginLeft: 6 }}
              />
            </View>
            <View style={[styles.statRow, { marginTop: 10 }]}>
              <StatCard
                label="Active today"
                value={stats.activeToday}
                subtitle="Trading today"
                accent="#4ADE80"
                style={{ marginRight: 6 }}
              />
              <StatCard
                label="Need help"
                value={stats.needsAssistance}
                subtitle="Assistance requests"
                accent={stats.needsAssistance > 0 ? '#F87171' : Colors.gold}
                style={{ marginLeft: 6 }}
              />
            </View>

            {stats.needsAssistance > 0 ? (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => router.push('/admin/check-ins')}
                activeOpacity={0.85}
              >
                <AlertTriangle size={20} color="#F87171" strokeWidth={2} />
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>
                    {stats.needsAssistance} user{stats.needsAssistance === 1 ? '' : 's'} need assistance
                  </Text>
                  <Text style={styles.alertSubtitle}>Tap to review today&apos;s check-ins</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.sectionSubtitle, { marginTop: 24 }]}>INSIGHTS</Text>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/admin/users')}
              activeOpacity={0.85}
            >
              <View style={styles.navIcon}>
                <Users size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Users</Text>
                <Text style={styles.navDescription}>
                  Browse members, roles, and signup trends
                </Text>
              </View>
              <TrendingUp size={18} color={Colors.rainyGrey} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navCard, { marginTop: 10 }]}
              onPress={() => router.push('/admin/check-ins')}
              activeOpacity={0.85}
            >
              <View style={styles.navIcon}>
                <ClipboardCheck size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Check-ins</Text>
                <Text style={styles.navDescription}>
                  Mental state, sessions, and user progress
                </Text>
              </View>
              <TrendingUp size={18} color={Colors.rainyGrey} strokeWidth={2} />
            </TouchableOpacity>

            <Text style={[styles.sectionSubtitle, { marginTop: 24 }]}>MANAGEMENT</Text>
            <TouchableOpacity style={styles.navCard} onPress={() => router.push('/admin/signals')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <TrendingUp size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Signals</Text>
                <Text style={styles.navDescription}>Create, edit, and publish trade signals</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navCard, { marginTop: 10 }]} onPress={() => router.push('/admin/analyses')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <BarChart3 size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Analysis</Text>
                <Text style={styles.navDescription}>Manage trade analysis reports</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navCard, { marginTop: 10 }]} onPress={() => router.push('/admin/events')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <Calendar size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Events</Text>
                <Text style={styles.navDescription}>Create and manage events</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navCard, { marginTop: 10 }]} onPress={() => router.push('/admin/messages')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <MessageSquare size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Messages</Text>
                <Text style={styles.navDescription}>Contact users and collect feedback</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navCard, { marginTop: 10 }]} onPress={() => router.push('/admin/documents')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <FileText size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Documents</Text>
                <Text style={styles.navDescription}>Upload and manage panel resources</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navCard, { marginTop: 10 }]} onPress={() => router.push('/admin/tips')} activeOpacity={0.85}>
              <View style={styles.navIcon}>
                <Lightbulb size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.navText}>
                <Text style={styles.navTitle}>Tips & Quotes</Text>
                <Text style={styles.navDescription}>Manage daily tips and quotes</Text>
              </View>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Axiforma-Bold',
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
  headerText: {
    marginLeft: 12,
  },
  welcomeText: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
  },
  loader: {
    marginTop: 40,
  },
  sectionSubtitle: {
    color: Colors.gold,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: 14,
    marginTop: 16,
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
  },
  alertSubtitle: {
    color: Colors.rainyGrey,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginTop: 2,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 196, 100, 0.08)',
  },
  navText: {
    flex: 1,
    marginHorizontal: 14,
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  navDescription: {
    color: Colors.rainyGrey,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 16,
  },
});
