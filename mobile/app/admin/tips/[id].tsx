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
import { Colors } from '../../../../shared/constants/colors';
import type { TradingTip, TradingTipContentKind } from '../../../../shared/types/tip';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminPickerField, AdminTextField } from '../../../components/admin/AdminFormFields';
import { supabase } from '../../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminTips } from '../../../hooks/use-admin-tips';

const emptyForm = {
  title: '',
  body: '',
  content_kind: 'tip' as TradingTipContentKind,
  sort_order: '0',
  active: true,
};

export default function AdminTipFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const { data: tips = [] } = useAdminTips();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isNew) {
      const nextOrder = tips.length ? Math.max(...tips.map((t) => t.sort_order)) + 1 : 0;
      setForm((f) => ({ ...f, sort_order: String(nextOrder) }));
      return;
    }
    async function load() {
      const { data, error } = await supabase.from('trading_tips').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load tip');
        router.back();
        return;
      }
      const tip = data as TradingTip;
      setForm({
        title: tip.title,
        body: tip.body,
        content_kind: tip.content_kind,
        sort_order: String(tip.sort_order),
        active: tip.active,
      });
      setLoading(false);
    }
    void load();
  }, [id, isNew, tips.length]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Validation', 'Title and body are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        content_kind: form.content_kind,
        sort_order: parseInt(form.sort_order, 10) || 0,
        active: form.active,
      };

      if (isNew) {
        const { error } = await supabase.from('trading_tips').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trading_tips').update(payload).eq('id', id);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-tips'] });
      router.back();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AdminScreenHeader title={isNew ? 'New tip / quote' : 'Edit tip / quote'} showBack />

        <AdminTextField label="Title" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <AdminPickerField
          label="Kind"
          value={form.content_kind}
          options={[
            { value: 'tip', label: 'Tip' },
            { value: 'quote', label: 'Quote' },
          ]}
          onChange={(v) => setForm((f) => ({ ...f, content_kind: v }))}
        />
        <AdminTextField label="Body" value={form.body} onChangeText={(v) => setForm((f) => ({ ...f, body: v }))} multiline style={{ minHeight: 120, textAlignVertical: 'top' }} />
        <AdminTextField label="Sort order" value={form.sort_order} onChangeText={(v) => setForm((f) => ({ ...f, sort_order: v }))} keyboardType="number-pad" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch value={form.active} onValueChange={(v) => setForm((f) => ({ ...f, active: v }))} trackColor={{ true: Colors.gold }} />
        </View>

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
  saveButton: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
