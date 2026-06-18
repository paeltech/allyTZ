import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft, FileText, Bell, FolderOpen } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import type { PanelDocument } from '../../../shared/types/document';
import { PANEL_DOCUMENT_CATEGORIES } from '../../../shared/types/document';
import { formatDocumentFileSize } from '../../../shared/utils/document-view';
import { useUnreadNotificationsCount } from '../../hooks/use-unread-notifications';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<PanelDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { unreadCount } = useUnreadNotificationsCount();

  const fetchDocuments = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    const { data, error } = await supabase
      .from('panel_documents')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data as PanelDocument[]);
    }
    if (!isRefresh) setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDocuments(false);
  }, [fetchDocuments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments(true);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return documents;
    return documents.filter((d) => d.category === categoryFilter);
  }, [documents, categoryFilter]);

  const categoryLabel = (value: string) =>
    PANEL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label || value;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => router.push('/notifications')}>
          <Bell size={22} color={Colors.gold} strokeWidth={2} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
          onPress={() => setCategoryFilter('all')}
        >
          <Text style={[styles.filterText, categoryFilter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {PANEL_DOCUMENT_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.filterChip, categoryFilter === c.value && styles.filterChipActive]}
            onPress={() => setCategoryFilter(c.value)}
          >
            <Text style={[styles.filterText, categoryFilter === c.value && styles.filterTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderOpen size={40} color={Colors.gold} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No documents available yet.</Text>
          </View>
        ) : (
          filtered.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.card}
              onPress={() => router.push(`/documents/${doc.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardIcon}>
                <FileText size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{doc.title}</Text>
                {doc.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>{doc.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>{categoryLabel(doc.category)}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>{formatDocumentFileSize(doc.file_size_bytes)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  bellWrap: { padding: 4, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#1A1A1A', fontSize: 9, fontWeight: '700' },
  filterRow: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { color: '#A0A0A0', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#1A1A1A' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: '#A0A0A0', fontSize: 15 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardDescription: { color: '#A0A0A0', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: Colors.gold, fontSize: 12, fontWeight: '600' },
  metaDot: { color: '#666666', fontSize: 12 },
});
