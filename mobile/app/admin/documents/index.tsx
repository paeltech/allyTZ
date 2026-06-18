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
import { Plus, FileText } from 'lucide-react-native';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { useAdminDocuments } from '../../../hooks/use-admin-documents';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { formatActivityTimestamp } from '../../../../shared/utils/admin-timestamp';
import { PANEL_DOCUMENT_CATEGORIES } from '../../../../shared/types/document';

export default function AdminDocumentsListScreen() {
  const { data: documents = [], isLoading, refetch } = useAdminDocuments();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string, title: string, filePath: string) => {
    Alert.alert('Delete document', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.storage.from('panel-documents').remove([filePath]);
          const { error } = await supabase.from('panel_documents').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
        },
      },
    ]);
  };

  const categoryLabel = (value: string) =>
    PANEL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <AdminScreenHeader title="Documents" subtitle="Guides and resources" showBack />

        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/admin/documents/new')}>
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Upload document</Text>
        </TouchableOpacity>

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 24 }} />
        ) : (
          documents.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/documents/preview/${doc.id}`)}
              >
                <View style={styles.cardHeader}>
                  <FileText size={18} color={Colors.gold} />
                  <View style={styles.cardText}>
                    <Text style={styles.title}>{doc.title}</Text>
                    <Text style={styles.meta}>{categoryLabel(doc.category)} · {doc.file_name}</Text>
                  </View>
                  <Text style={[styles.badge, !doc.published && styles.badgeDraft]}>
                    {doc.published ? 'Live' : 'Draft'}
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  Uploaded {formatActivityTimestamp(doc.created_at)}
                  {doc.updated_at !== doc.created_at ? ` · Updated ${formatActivityTimestamp(doc.updated_at)}` : ''}
                </Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/admin/documents/${doc.id}`)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(doc.id, doc.title, doc.file_path)}>
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
  badge: { color: '#4ADE80', fontFamily: 'Axiforma-Bold', fontSize: 11 },
  badgeDraft: { color: Colors.rainyGrey },
  timestamp: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 11, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, borderWidth: 1, borderColor: Colors.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 13 },
  deleteBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(248,113,113,0.5)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  deleteBtnText: { color: '#F87171', fontFamily: 'Axiforma-Bold', fontSize: 13 },
});
