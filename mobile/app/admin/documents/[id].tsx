import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { FileUp } from 'lucide-react-native';
import { Colors } from '../../../../shared/constants/colors';
import {
  PANEL_DOCUMENT_CATEGORIES,
  type PanelDocument,
  type PanelDocumentCategory,
} from '../../../../shared/types/document';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminPickerField, AdminTextField } from '../../../components/admin/AdminFormFields';
import { supabase } from '../../../lib/supabase';
import { uploadPanelDocument } from '../../../lib/upload-panel-document';
import { useQueryClient } from '@tanstack/react-query';

const emptyForm = {
  title: '',
  description: '',
  category: 'general' as PanelDocumentCategory,
  sort_order: '0',
  published: true,
};

export default function AdminDocumentFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const [existing, setExisting] = useState<PanelDocument | null>(null);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      const { data, error } = await supabase.from('panel_documents').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load document');
        router.back();
        return;
      }
      const doc = data as PanelDocument;
      setExisting(doc);
      setForm({
        title: doc.title,
        description: doc.description ?? '',
        category: doc.category,
        sort_order: String(doc.sort_order),
        published: doc.published,
      });
      setLoading(false);
    }
    void load();
  }, [id, isNew]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/octet-stream',
      });
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (isNew && !pickedFile) {
      Alert.alert('Validation', 'Please select a file to upload.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let fileMeta: {
        file_path: string;
        file_name: string;
        mime_type: string;
        file_size_bytes: number;
      } | null = null;

      if (pickedFile) {
        fileMeta = await uploadPanelDocument(pickedFile.uri, pickedFile.name, pickedFile.mimeType);
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        sort_order: parseInt(form.sort_order, 10) || 0,
        published: form.published,
        uploaded_by: session?.user?.id ?? null,
        ...(fileMeta ?? {}),
      };

      if (isNew) {
        const { error } = await supabase.from('panel_documents').insert(payload);
        if (error) throw error;
      } else {
        if (fileMeta && existing) {
          await supabase.storage.from('panel-documents').remove([existing.file_path]);
        }
        const { error } = await supabase.from('panel_documents').update(payload).eq('id', id);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      router.back();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AdminScreenHeader title={isNew ? 'Upload document' : 'Edit document'} showBack />

        <AdminTextField label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <AdminTextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
        <AdminPickerField
          label="Category"
          value={form.category}
          options={PANEL_DOCUMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
        />
        <AdminTextField label="Sort order" value={form.sort_order} onChangeText={(v) => setForm((f) => ({ ...f, sort_order: v }))} keyboardType="number-pad" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Published</Text>
          <Switch value={form.published} onValueChange={(v) => setForm((f) => ({ ...f, published: v }))} trackColor={{ true: Colors.gold }} />
        </View>

        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <FileUp size={18} color={Colors.gold} />
          <Text style={styles.fileBtnText}>
            {pickedFile?.name ?? existing?.file_name ?? 'Choose PDF or image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  switchLabel: { color: '#FFF', fontFamily: 'Axiforma-Medium' },
  fileBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A', borderStyle: 'dashed', borderRadius: 10, padding: 14, marginBottom: 16 },
  fileBtnText: { color: Colors.gold, fontFamily: 'Axiforma-Regular', flex: 1 },
  saveButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
