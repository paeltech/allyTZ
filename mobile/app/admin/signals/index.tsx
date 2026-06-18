import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import { Plus, TrendingUp, MessageSquare } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useAdminSignals } from '../../../hooks/use-admin-signals';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';

function statusColor(status: string) {
  if (status === 'active') return '#4ADE80';
  if (status === 'closed') return Colors.rainyGrey;
  return '#F87171';
}

export default function AdminSignalsListScreen() {
  const { data: signals = [], isLoading, refetch } = useAdminSignals();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete signal', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('signals').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ['admin-signals'] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <AdminScreenHeader title="Signals" subtitle="Create and manage trade signals" showBack />

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/admin/signals/new')}
        >
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>New signal</Text>
        </TouchableOpacity>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          signals.map((signal) => (
            <View key={signal.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/signals/preview/${signal.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <TrendingUp size={18} color={Colors.gold} strokeWidth={2} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.pair}>{signal.trading_pair}</Text>
                    <Text style={styles.title} numberOfLines={2}>{signal.title}</Text>
                  </View>
                  <Text style={[styles.status, { color: statusColor(signal.status) }]}>
                    {signal.status}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {signal.signal_type.toUpperCase()} · {signal.order_type} · Entry {signal.entry_price}
                </Text>
                <Text style={styles.timestamp}>
                  Created {formatActivityTimestamp(signal.created_at)}
                  {signal.updated_at !== signal.created_at
                    ? ` · Updated ${formatActivityTimestamp(signal.updated_at)}`
                    : ''}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.discussBtn}
                  onPress={() => router.push(`/admin/signals/discussion/${signal.id}`)}
                >
                  <MessageSquare size={14} color={Colors.gold} strokeWidth={2} />
                  <Text style={styles.discussBtnText}>Discussion</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push(`/admin/signals/${signal.id}`)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(signal.id, signal.title)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  createButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardText: { flex: 1 },
  pair: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  title: { color: '#FFF', fontFamily: 'Axiforma-Medium', fontSize: 15, marginTop: 2 },
  status: { fontFamily: 'Axiforma-Bold', fontSize: 11, textTransform: 'uppercase' },
  meta: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 12, marginTop: 8 },
  timestamp: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  discussBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  discussBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 12 },
  editBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  deleteBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#F87171', fontFamily: 'Axiforma-Bold', fontSize: 13 },
});
