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
import { Plus, Calendar } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useAdminEvents } from '../../../hooks/use-admin-events';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';

export default function AdminEventsListScreen() {
  const { data: events = [], isLoading, refetch } = useAdminEvents();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete event', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('events').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ['admin-events'] });
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
        <AdminScreenHeader title="Events" subtitle="Create and manage events" showBack />

        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/admin/events/new')}>
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>New event</Text>
        </TouchableOpacity>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/events/preview/${event.id}`)}
              >
                <View style={styles.cardHeader}>
                  <Calendar size={18} color={Colors.gold} strokeWidth={2} />
                  <View style={styles.cardText}>
                    <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.meta}>{event.organizer} · {event.type}</Text>
                  </View>
                  <Text style={styles.status}>{event.status}</Text>
                </View>
                <Text style={styles.meta}>
                  {event.registration_count ?? 0} registrations · {event.price_type === 'Free' ? 'Free' : `$${event.price}`}
                </Text>
                <Text style={styles.timestamp}>
                  Created {formatActivityTimestamp(event.created_at)}
                  {event.updated_at !== event.created_at ? ` · Updated ${formatActivityTimestamp(event.updated_at)}` : ''}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/admin/events/${event.id}`)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(event.id, event.title)}>
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
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  createButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
  card: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardText: { flex: 1 },
  title: { color: '#FFF', fontFamily: 'Axiforma-Bold', fontSize: 15 },
  meta: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 12, marginTop: 4 },
  timestamp: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 11, marginTop: 4 },
  status: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 11, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: Colors.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(248,113,113,0.5)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: { color: '#F87171', fontFamily: 'Axiforma-Bold', fontSize: 13 },
});
