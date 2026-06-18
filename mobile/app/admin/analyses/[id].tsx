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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { Colors } from '../../../../shared/constants/colors';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminPickerField, AdminTextField } from '../../../components/admin/AdminFormFields';
import { supabase } from '../../../lib/supabase';
import { uploadPublicImage } from '../../../lib/admin-actions';
import { useQueryClient } from '@tanstack/react-query';
import { getEatDateString } from '../../../../shared/utils/eat-time';
import type { AdminTradeAnalysis } from '../../../hooks/use-admin-analyses';

const TRADING_PAIR = 'XAUUSD';

const emptyForm = {
  analysis_date: getEatDateString(),
  content: '',
  risk_level: '' as '' | 'low' | 'medium' | 'high',
  chart_image_url: null as string | null,
};

function autoTitle(date: string) {
  return `XAUUSD Analysis ${date}`;
}

export default function AdminAnalysisFormScreen() {
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
      const { data, error } = await supabase.from('trade_analyses').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load analysis');
        router.back();
        return;
      }
      const a = data as AdminTradeAnalysis;
      setForm({
        analysis_date: a.analysis_date,
        content: a.content,
        risk_level: a.risk_level ?? '',
        chart_image_url: a.chart_image_url ?? null,
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
    if (form.content.trim().length < 20) {
      Alert.alert('Validation', 'Content must be at least 20 characters.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let chartUrl = form.chart_image_url;
      if (imageUri) {
        chartUrl = await uploadPublicImage('trade-analysis-charts', 'trade-analysis-charts', imageUri, imageMime);
      }

      const payload = {
        trading_pair: TRADING_PAIR,
        analysis_date: form.analysis_date,
        title: autoTitle(form.analysis_date),
        content: form.content.trim(),
        summary: null,
        price: 0,
        risk_level: form.risk_level || null,
        chart_image_url: chartUrl,
        created_by: session?.user?.id ?? null,
      };

      if (isNew) {
        const { error } = await supabase.from('trade_analyses').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trade_analyses').update(payload).eq('id', id);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-analyses'] });
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

  const previewUri = imageUri || form.chart_image_url;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AdminScreenHeader title={isNew ? 'New analysis' : 'Edit analysis'} showBack />

        <View style={styles.pairBadge}>
          <Text style={styles.pairBadgeText}>{TRADING_PAIR}</Text>
        </View>

        <AdminTextField
          label="Analysis date (YYYY-MM-DD)"
          value={form.analysis_date}
          onChangeText={(v) => setForm((f) => ({ ...f, analysis_date: v }))}
        />
        <AdminTextField
          label="Content"
          value={form.content}
          onChangeText={(v) => setForm((f) => ({ ...f, content: v }))}
          multiline
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
        <AdminPickerField
          label="Risk level"
          value={form.risk_level || 'medium'}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          onChange={(v) => setForm((f) => ({ ...f, risk_level: v }))}
        />

        <Text style={styles.label}>Chart image</Text>
        {previewUri ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: previewUri }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => {
                setImageUri(null);
                setForm((f) => ({ ...f, chart_image_url: null }));
              }}
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
            <ImagePlus size={18} color={Colors.gold} />
            <Text style={styles.attachText}>Upload chart</Text>
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
  pairBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 196, 100, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  pairBadgeText: { color: Colors.gold, fontFamily: 'Axiforma-Bold', fontSize: 14 },
  label: { color: '#A0A0A0', fontSize: 12, fontFamily: 'Axiforma-Regular', marginBottom: 6, textTransform: 'uppercase' },
  imageWrap: { position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  image: { width: '100%', height: 180, backgroundColor: '#2A2A2A' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  attachBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A', borderStyle: 'dashed', borderRadius: 10, padding: 12, marginBottom: 14 },
  attachText: { color: Colors.gold, fontFamily: 'Axiforma-Regular' },
  saveButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
