import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Colors } from '../../../../shared/constants/colors';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminPickerField, AdminTextField } from '../../../components/admin/AdminFormFields';
import { supabase } from '../../../lib/supabase';
import { notifyAllUsersForEvent, uploadPublicImage } from '../../../lib/admin-actions';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminEvent } from '../../../hooks/use-admin-events';

const CATEGORIES = ['Networking', 'Workshop', 'Webinar', 'Conference', 'Seminar', 'Other'];

const emptyForm = {
  title: '',
  organizer: '',
  description: '',
  category: 'Workshop',
  type: 'Physical' as AdminEvent['type'],
  price_type: 'Free' as AdminEvent['price_type'],
  price: '0',
  location: '',
  capacity: '100',
  status: 'draft' as AdminEvent['status'],
  is_featured: false,
  start_date: '',
  end_date: '',
  cover_image_url: null as string | null,
};

export default function AdminEventFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');

  useEffect(() => {
    if (isNew) return;
    async function load() {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load event');
        router.back();
        return;
      }
      const e = data as AdminEvent;
      setForm({
        title: e.title,
        organizer: e.organizer,
        description: e.description,
        category: e.category,
        type: e.type,
        price_type: e.price_type,
        price: String(e.price),
        location: e.location ?? '',
        capacity: String(e.capacity),
        status: e.status,
        is_featured: e.is_featured,
        start_date: e.start_date?.slice(0, 10) ?? '',
        end_date: e.end_date?.slice(0, 10) ?? '',
        cover_image_url: e.cover_image_url,
      });
      setLoading(false);
    }
    void load();
  }, [id, isNew]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageMime(result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const handleSave = async () => {
    if (form.title.trim().length < 5 || form.description.trim().length < 20) {
      Alert.alert('Validation', 'Check title and description length.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let coverUrl = form.cover_image_url;
      if (imageUri) {
        coverUrl = await uploadPublicImage('event-covers', 'event-covers', imageUri, imageMime);
      }

      const payload = {
        title: form.title.trim(),
        organizer: form.organizer.trim(),
        description: form.description.trim(),
        category: form.category,
        type: form.type,
        price_type: form.price_type,
        price: parseFloat(form.price) || 0,
        location: form.location.trim() || null,
        capacity: parseInt(form.capacity, 10) || 100,
        status: form.status,
        is_featured: form.is_featured,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        cover_image_url: coverUrl,
        created_by: session?.user?.id ?? null,
      };

      if (isNew) {
        const { data, error } = await supabase.from('events').insert(payload).select().single();
        if (error) throw error;
        if (data.status === 'published') {
          await notifyAllUsersForEvent(data);
        }
      } else {
        const { error } = await supabase.from('events').update(payload).eq('id', id);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-events'] });
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

  const previewUri = imageUri || form.cover_image_url;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AdminScreenHeader title={isNew ? 'New event' : 'Edit event'} showBack />

        <AdminTextField label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <AdminTextField label="Organizer" value={form.organizer} onChangeText={(v) => setForm((f) => ({ ...f, organizer: v }))} />
        <AdminTextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline style={{ minHeight: 100, textAlignVertical: 'top' }} />
        <AdminPickerField label="Category" value={form.category} options={CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={(v) => setForm((f) => ({ ...f, category: v }))} />
        <AdminPickerField label="Type" value={form.type} options={[{ value: 'Physical', label: 'Physical' }, { value: 'Virtual', label: 'Virtual' }, { value: 'Hybrid', label: 'Hybrid' }]} onChange={(v) => setForm((f) => ({ ...f, type: v }))} />
        <AdminPickerField label="Price type" value={form.price_type} options={[{ value: 'Free', label: 'Free' }, { value: 'Paid', label: 'Paid' }]} onChange={(v) => setForm((f) => ({ ...f, price_type: v }))} />
        <AdminTextField label="Price" value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} keyboardType="decimal-pad" />
        <AdminTextField label="Location" value={form.location} onChangeText={(v) => setForm((f) => ({ ...f, location: v }))} />
        <AdminTextField label="Capacity" value={form.capacity} onChangeText={(v) => setForm((f) => ({ ...f, capacity: v }))} keyboardType="number-pad" />
        <AdminTextField label="Start date (YYYY-MM-DD)" value={form.start_date} onChangeText={(v) => setForm((f) => ({ ...f, start_date: v }))} />
        <AdminTextField label="End date (YYYY-MM-DD)" value={form.end_date} onChangeText={(v) => setForm((f) => ({ ...f, end_date: v }))} />
        <AdminPickerField label="Status" value={form.status} options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'completed', label: 'Completed' }]} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Featured event</Text>
          <Switch value={form.is_featured} onValueChange={(v) => setForm((f) => ({ ...f, is_featured: v }))} trackColor={{ true: Colors.gold }} />
        </View>

        <Text style={styles.label}>Cover image</Text>
        {previewUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: previewUri }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.removeBtn} onPress={() => { setImageUri(null); setForm((f) => ({ ...f, cover_image_url: null })); }}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <ImagePlus size={18} color={Colors.gold} />
            <Text style={styles.attachText}>Upload cover</Text>
          </TouchableOpacity>
        )}

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
  label: { color: '#A0A0A0', fontSize: 12, fontFamily: 'Axiforma-Regular', marginBottom: 6, textTransform: 'uppercase' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  switchLabel: { color: '#FFF', fontFamily: 'Axiforma-Medium' },
  imageWrap: { position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  image: { width: '100%', height: 180, backgroundColor: '#2A2A2A' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  attachBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A', borderStyle: 'dashed', borderRadius: 10, padding: 12, marginBottom: 14 },
  attachText: { color: Colors.gold, fontFamily: 'Axiforma-Regular' },
  saveButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
