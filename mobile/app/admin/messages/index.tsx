import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import { MessageSquare, Search, Users } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useAdminConversations } from '../../../hooks/use-direct-messages';
import { useAdminUsers } from '../../../hooks/use-admin-users';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';

function displayName(fullName: string | null, email: string | null): string {
  return fullName?.trim() || email?.split('@')[0] || 'User';
}

export default function AdminMessagesIndexScreen() {
  const [search, setSearch] = useState('');
  const { data: conversations = [], isLoading, refetch } = useAdminConversations();
  const { data: users = [] } = useAdminUsers();
  const [refreshing, setRefreshing] = useState(false);

  const traders = useMemo(
    () => users.filter((u) => u.role === 'user'),
    [users]
  );

  const filteredTraders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return traders.slice(0, 20);
    return traders.filter((u) =>
      [u.full_name, u.email, u.phone_number].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [traders, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <AdminScreenHeader title="Messages" subtitle="Contact users & get feedback" showBack />

        <Text style={styles.sectionTitle}>RECENT CONVERSATIONS</Text>
        {isLoading && !refreshing ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: 16 }} />
        ) : conversations.length === 0 ? (
          <Text style={styles.empty}>No conversations yet. Message a user below.</Text>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.thread_user_id}
              style={styles.convCard}
              onPress={() => router.push(`/admin/messages/${conv.thread_user_id}`)}
            >
              <View style={styles.convIcon}>
                <MessageSquare size={18} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.convText}>
                <Text style={styles.convName}>{displayName(conv.full_name, conv.email)}</Text>
                <Text style={styles.convPreview} numberOfLines={1}>
                  {conv.from_admin ? 'You: ' : ''}{conv.last_message}
                </Text>
              </View>
              <Text style={styles.convTime}>{formatActivityTimestamp(conv.last_at)}</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>MESSAGE A USER</Text>
        <View style={styles.searchWrap}>
          <Search size={18} color={Colors.rainyGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search traders..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
            selectionColor={Colors.gold}
          />
        </View>

        {filteredTraders.map((user) => (
          <TouchableOpacity
            key={user.user_id}
            style={styles.userRow}
            onPress={() => router.push(`/admin/messages/${user.user_id}`)}
          >
            <Users size={16} color={Colors.rainyGrey} />
            <View style={styles.userText}>
              <Text style={styles.userName}>{displayName(user.full_name ?? null, user.email)}</Text>
              {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: Colors.gold, fontSize: 12, fontFamily: 'Axiforma-Regular', letterSpacing: 0.6, marginBottom: 10 },
  empty: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', marginBottom: 8 },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', borderRadius: 14, padding: 14, marginBottom: 8 },
  convIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  convText: { flex: 1 },
  convName: { color: '#FFF', fontFamily: 'Axiforma-Bold', fontSize: 14 },
  convPreview: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 12, marginTop: 2 },
  convTime: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 10, marginLeft: 8 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10, gap: 8 },
  searchInput: { flex: 1, color: '#FFF', fontFamily: 'Axiforma-Regular' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  userText: { flex: 1 },
  userName: { color: '#FFF', fontFamily: 'Axiforma-Medium', fontSize: 14 },
  userEmail: { color: Colors.rainyGrey, fontSize: 12, fontFamily: 'Axiforma-Regular' },
});
