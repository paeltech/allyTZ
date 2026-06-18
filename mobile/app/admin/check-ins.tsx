import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../shared/constants/colors';
import { AdminScreenHeader } from '../../components/admin/AdminScreenHeader';
import { StatCard } from '../../components/admin/StatCard';
import { BarChart } from '../../components/admin/BarChart';
import { useAdminCheckIns } from '../../hooks/use-admin-check-ins';
import { useAdminUsers } from '../../hooks/use-admin-users';
import { getEatDateString } from '../../../shared/utils/eat-time';
import {
  MENTAL_STATE_OPTIONS,
  TRADING_SESSION_OPTIONS,
} from '../../../shared/constants/check-in';
import type { CheckInWithProfile } from '../../hooks/use-admin-check-ins';

type FilterMode = 'today' | 'all' | 'assistance';

function getDisplayName(checkIn: CheckInWithProfile): string {
  return (
    checkIn.full_name?.trim() ||
    checkIn.email?.split('@')[0] ||
    'Unknown user'
  );
}

function mentalLabel(value: string): string {
  return MENTAL_STATE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function sessionLabels(sessions: string[]): string {
  if (!sessions.length) return 'None';
  return sessions
    .map((s) => TRADING_SESSION_OPTIONS.find((o) => o.value === s)?.label ?? s)
    .join(', ');
}

export default function AdminCheckInsScreen() {
  const [filter, setFilter] = useState<FilterMode>('today');
  const { data: checkIns = [], isLoading, refetch } = useAdminCheckIns();
  const { data: users = [] } = useAdminUsers();
  const [refreshing, setRefreshing] = useState(false);

  const today = getEatDateString();
  const traderCount = users.filter((u) => u.role === 'user').length;

  const scopedCheckIns = useMemo(() => {
    if (filter === 'today') {
      return checkIns.filter((c) => c.check_in_date === today);
    }
    if (filter === 'assistance') {
      return checkIns.filter((c) => c.needs_assistance);
    }
    return checkIns;
  }, [checkIns, filter, today]);

  const stats = useMemo(() => {
    const todayCheckIns = checkIns.filter((c) => c.check_in_date === today);
    const uniqueToday = new Set(todayCheckIns.map((c) => c.user_id)).size;
    const active = todayCheckIns.filter((c) => c.is_active).length;
    const assistance = todayCheckIns.filter((c) => c.needs_assistance).length;
    const rate = traderCount > 0 ? Math.round((uniqueToday / traderCount) * 100) : 0;

    return { uniqueToday, active, assistance, rate };
  }, [checkIns, today, traderCount]);

  const mentalChart = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedCheckIns.forEach((c) => {
      counts[c.mental_state] = (counts[c.mental_state] ?? 0) + 1;
    });

    const colors = ['#F4C464', '#60A5FA', '#F87171', '#A78BFA', '#4ADE80', '#FB923C', '#F472B6', '#34D399'];

    return MENTAL_STATE_OPTIONS.map((opt, index) => ({
      label: opt.label,
      value: counts[opt.value] ?? 0,
      color: colors[index % colors.length],
    })).filter((item) => item.value > 0 || filter === 'today');
  }, [scopedCheckIns, filter]);

  const sessionChart = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedCheckIns.forEach((c) => {
      c.trading_sessions.forEach((session) => {
        counts[session] = (counts[session] ?? 0) + 1;
      });
    });

    return TRADING_SESSION_OPTIONS.map((opt) => ({
      label: opt.label.replace(' session', ''),
      value: counts[opt.value] ?? 0,
      color: Colors.gold,
    }));
  }, [scopedCheckIns]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        <AdminScreenHeader title="Check-ins" subtitle="User progress & wellbeing" showBack />

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={styles.loader} />
        ) : (
          <>
            <View style={styles.statRow}>
              <StatCard
                label="Today"
                value={stats.uniqueToday}
                subtitle={`${stats.rate}% of traders`}
                style={{ marginRight: 6 }}
              />
              <StatCard
                label="Active"
                value={stats.active}
                subtitle="Trading today"
                accent="#4ADE80"
                style={{ marginLeft: 6 }}
              />
            </View>

            <View style={[styles.statRow, { marginTop: 10, marginBottom: 14 }]}>
              <StatCard
                label="Need help"
                value={stats.assistance}
                subtitle="Assistance flagged"
                accent={stats.assistance > 0 ? '#F87171' : Colors.gold}
              />
            </View>

            <View style={styles.filterRow}>
              {(['today', 'assistance', 'all'] as FilterMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.filterChip, filter === mode && styles.filterChipActive]}
                  onPress={() => setFilter(mode)}
                >
                  <Text style={[styles.filterText, filter === mode && styles.filterTextActive]}>
                    {mode === 'today' ? 'Today' : mode === 'assistance' ? 'Needs help' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartWrap}>
              <BarChart
                title="Mental state"
                items={mentalChart}
                emptyMessage="No check-ins for this filter"
              />
            </View>

            <View style={styles.chartWrap}>
              <BarChart
                title="Trading sessions"
                items={sessionChart}
                emptyMessage="No session data yet"
              />
            </View>

            <Text style={styles.listTitle}>
              {scopedCheckIns.length} check-in{scopedCheckIns.length === 1 ? '' : 's'}
            </Text>

            {scopedCheckIns.slice(0, 50).map((checkIn) => (
              <View
                key={checkIn.id}
                style={[
                  styles.checkInCard,
                  checkIn.needs_assistance && styles.checkInCardAlert,
                ]}
              >
                <View style={styles.checkInHeader}>
                  <Text style={styles.checkInName}>{getDisplayName(checkIn)}</Text>
                  <Text style={styles.checkInDate}>{checkIn.check_in_date}</Text>
                </View>
                <Text style={styles.checkInMeta}>
                  {checkIn.is_active ? 'Active trader' : 'Not trading'} · {mentalLabel(checkIn.mental_state)}
                </Text>
                <Text style={styles.checkInMeta}>Sessions: {sessionLabels(checkIn.trading_sessions)}</Text>
                {checkIn.needs_assistance ? (
                  <Text style={styles.assistanceNote}>
                    Needs assistance
                    {checkIn.assistance_note ? `: ${checkIn.assistance_note}` : ''}
                  </Text>
                ) : null}
              </View>
            ))}
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
  loader: {
    marginTop: 40,
  },
  statRow: {
    flexDirection: 'row',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterChipActive: {
    backgroundColor: 'rgba(244, 196, 100, 0.15)',
    borderColor: Colors.gold,
  },
  filterText: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
  },
  filterTextActive: {
    color: Colors.gold,
  },
  chartWrap: {
    marginBottom: 14,
  },
  listTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  checkInCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  checkInCardAlert: {
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  checkInName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
    flex: 1,
    marginRight: 8,
  },
  checkInDate: {
    color: '#666666',
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
  },
  checkInMeta: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 2,
  },
  assistanceNote: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: 'Axiforma-Medium',
    marginTop: 6,
  },
});
