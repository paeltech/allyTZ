import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import { Search } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { StatCard } from '../../../components/admin/StatCard';
import { BarChart } from '../../../components/admin/BarChart';
import { useAdminUsers } from '../../../hooks/use-admin-users';
import type { UserWithRole } from '../../../lib/admin';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getDisplayName(user: UserWithRole): string {
  return user.full_name?.trim() || user.email?.split('@')[0] || 'Unknown user';
}

function RoleBadge({ role }: { role: UserWithRole['role'] }) {
  const colors: Record<UserWithRole['role'], { bg: string; text: string }> = {
    admin: { bg: 'rgba(244, 196, 100, 0.2)', text: Colors.gold },
    moderator: { bg: 'rgba(96, 165, 250, 0.2)', text: '#60A5FA' },
    user: { bg: 'rgba(160, 160, 160, 0.2)', text: Colors.rainyGrey },
  };
  const style = colors[role];

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{role}</Text>
    </View>
  );
}

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading, refetch } = useAdminUsers();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length;
    const moderators = users.filter((u) => u.role === 'moderator').length;
    const regular = users.filter((u) => u.role === 'user').length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter(
      (u) => new Date(u.created_at).getTime() >= sevenDaysAgo
    ).length;

    return { total: users.length, admins, moderators, regular, recentSignups };
  }, [users]);

  const roleChart = useMemo(
    () => [
      { label: 'Traders', value: stats.regular, color: Colors.gold },
      { label: 'Moderators', value: stats.moderators, color: '#60A5FA' },
      { label: 'Admins', value: stats.admins, color: '#4ADE80' },
    ],
    [stats]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      const haystack = [
        user.full_name,
        user.email,
        user.phone_number,
        user.role,
        user.user_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

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
        <AdminScreenHeader title="Users" subtitle="Member overview" showBack />

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={styles.loader} />
        ) : (
          <>
            <View style={styles.statRow}>
              <StatCard label="Total" value={stats.total} style={{ marginRight: 6 }} />
              <StatCard
                label="New (7d)"
                value={stats.recentSignups}
                subtitle="Recent signups"
                style={{ marginLeft: 6 }}
              />
            </View>

            <View style={styles.chartWrap}>
              <BarChart title="Role distribution" items={roleChart} />
            </View>

            <View style={styles.searchWrap}>
              <Search size={18} color={Colors.rainyGrey} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, email, phone..."
                placeholderTextColor="#666666"
                value={search}
                onChangeText={setSearch}
                selectionColor={Colors.gold}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.listTitle}>
              {filteredUsers.length} member{filteredUsers.length === 1 ? '' : 's'}
            </Text>

            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.user_id}
                style={styles.userCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/users/${user.user_id}`)}
              >
                <View style={styles.userCardHeader}>
                  <Text style={styles.userName}>{getDisplayName(user)}</Text>
                  <RoleBadge role={user.role} />
                </View>
                {user.email ? (
                  <Text style={styles.userMeta}>{user.email}</Text>
                ) : null}
                {user.phone_number ? (
                  <Text style={styles.userMeta}>{user.phone_number}</Text>
                ) : null}
                <Text style={styles.userDate}>Joined {formatDate(user.created_at)}</Text>
              </TouchableOpacity>
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
    marginBottom: 14,
  },
  chartWrap: {
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Regular',
  },
  listTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  userCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Axiforma-Bold',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Axiforma-Bold',
    textTransform: 'capitalize',
  },
  userMeta: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 2,
  },
  userDate: {
    color: '#666666',
    fontSize: 11,
    fontFamily: 'Axiforma-Regular',
    marginTop: 4,
  },
});
