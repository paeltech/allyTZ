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
import { Plus, BarChart3 } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useAdminAnalyses } from '../../../hooks/use-admin-analyses';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';

export default function AdminAnalysesListScreen() {
  const { data: analyses = [], isLoading, refetch } = useAdminAnalyses();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete analysis', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trade_analyses').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ['admin-analyses'] });
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
        <AdminScreenHeader title="Analysis" subtitle="Trade analysis reports" showBack />

        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/admin/analyses/new')}>
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>New analysis</Text>
        </TouchableOpacity>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          analyses.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/analyses/preview/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <BarChart3 size={18} color={Colors.gold} strokeWidth={2} />
                  <View style={styles.cardText}>
                    <Text style={styles.pair}>{item.trading_pair}</Text>
                    <Text style={styles.title} numberOfLines={2}>{item.analysis_date}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  {item.risk_level ? `${item.risk_level} risk` : 'No risk level set'}
                </Text>
                <Text style={styles.timestamp}>
                  Created {formatActivityTimestamp(item.created_at)}
                  {item.updated_at !== item.created_at ? ` · Updated ${formatActivityTimestamp(item.updated_at)}` : ''}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/admin/analyses/${item.id}`)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
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
  card: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardText: { flex: 1 },
  pair: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  title: { color: '#FFF', fontFamily: 'Axiforma-Medium', fontSize: 15, marginTop: 2 },
  meta: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 12, marginTop: 8 },
  timestamp: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: Colors.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(248,113,113,0.5)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: { color: '#F87171', fontFamily: 'Axiforma-Bold', fontSize: 13 },
});
