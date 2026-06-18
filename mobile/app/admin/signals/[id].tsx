import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../shared/constants/colors';
import type { Signal } from '../../../../shared/types/signal';
import { DEFAULT_SIGNAL_TRADING_PAIR, SIGNAL_ORDER_TYPES, SIGNAL_TRADING_PAIRS } from '../../../../shared/constants/signals';
import { AdminScreenHeader } from '../../../components/admin/AdminScreenHeader';
import { AdminPickerField, AdminTextField } from '../../../components/admin/AdminFormFields';
import { supabase } from '../../../lib/supabase';
import { notifySignalSubscribers, trySendWhatsAppForSignal } from '../../../lib/admin-actions';
import { useQueryClient } from '@tanstack/react-query';

const emptyForm = {
  trading_pair: DEFAULT_SIGNAL_TRADING_PAIR as string,
  signal_type: 'buy' as Signal['signal_type'],
  order_type: 'market' as Signal['order_type'],
  entry_price: '',
  stop_loss: '',
  take_profit_1: '',
  take_profit_2: '',
  take_profit_3: '',
  title: '',
  analysis: '',
  confidence_level: 'medium' as NonNullable<Signal['confidence_level']>,
  status: 'active' as Signal['status'],
};

export default function AdminSignalFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (isNew) return;

    async function load() {
      const { data, error } = await supabase.from('signals').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load signal');
        router.back();
        return;
      }
      const s = data as Signal;
      setForm({
        trading_pair: s.trading_pair as typeof form.trading_pair,
        signal_type: s.signal_type,
        order_type: s.order_type,
        entry_price: String(s.entry_price),
        stop_loss: String(s.stop_loss),
        take_profit_1: s.take_profit_1 != null ? String(s.take_profit_1) : '',
        take_profit_2: s.take_profit_2 != null ? String(s.take_profit_2) : '',
        take_profit_3: s.take_profit_3 != null ? String(s.take_profit_3) : '',
        title: s.title,
        analysis: s.analysis ?? '',
        confidence_level: s.confidence_level ?? 'medium',
        status: s.status,
      });
      setLoading(false);
    }
    void load();
  }, [id, isNew]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseNum = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  };

  const handleSave = async () => {
    const entry = parseNum(form.entry_price);
    const sl = parseNum(form.stop_loss);
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Reason for decision is required.');
      return;
    }
    if (!Number.isFinite(entry) || !Number.isFinite(sl)) {
      Alert.alert('Validation', 'Entry and stop loss must be valid numbers.');
      return;
    }

    const payload = {
      trading_pair: form.trading_pair,
      signal_type: form.signal_type,
      order_type: form.order_type,
      entry_price: entry,
      stop_loss: sl,
      take_profit_1: form.take_profit_1 ? parseNum(form.take_profit_1) : null,
      take_profit_2: form.take_profit_2 ? parseNum(form.take_profit_2) : null,
      take_profit_3: form.take_profit_3 ? parseNum(form.take_profit_3) : null,
      title: form.title.trim(),
      analysis: form.analysis.trim() || null,
      confidence_level: form.confidence_level,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('signals')
          .insert({ ...payload, status: 'active' })
          .select()
          .single();
        if (error) throw error;
        await notifySignalSubscribers(data as Signal);
        void trySendWhatsAppForSignal(data.id);
        Alert.alert('Created', 'Signal published to subscribers.');
      } else {
        const { error } = await supabase.from('signals').update(payload).eq('id', id);
        if (error) throw error;
        Alert.alert('Saved', 'Signal updated.');
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-signals'] });
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
        <AdminScreenHeader
          title={isNew ? 'New signal' : 'Edit signal'}
          subtitle="Trading signal details"
          showBack
        />

        <AdminPickerField
          label="Trading pair"
          value={form.trading_pair}
          options={SIGNAL_TRADING_PAIRS.map((p) => ({ value: p, label: p }))}
          onChange={(v) => set('trading_pair', v)}
        />
        <AdminPickerField
          label="Type"
          value={form.signal_type}
          options={[
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell' },
          ]}
          onChange={(v) => set('signal_type', v)}
        />
        <AdminPickerField
          label="Order type"
          value={form.order_type}
          options={SIGNAL_ORDER_TYPES.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => set('order_type', v)}
        />
        <AdminTextField label="Entry price" value={form.entry_price} onChangeText={(v) => set('entry_price', v)} keyboardType="decimal-pad" />
        <AdminTextField label="Stop loss" value={form.stop_loss} onChangeText={(v) => set('stop_loss', v)} keyboardType="decimal-pad" />
        <AdminTextField label="Take profit 1" value={form.take_profit_1} onChangeText={(v) => set('take_profit_1', v)} keyboardType="decimal-pad" />
        <AdminTextField label="Take profit 2" value={form.take_profit_2} onChangeText={(v) => set('take_profit_2', v)} keyboardType="decimal-pad" />
        <AdminTextField label="Take profit 3" value={form.take_profit_3} onChangeText={(v) => set('take_profit_3', v)} keyboardType="decimal-pad" />
        <AdminTextField label="Reason for decision" value={form.title} onChangeText={(v) => set('title', v)} />
        <AdminTextField label="Notes" value={form.analysis} onChangeText={(v) => set('analysis', v)} multiline style={{ minHeight: 96, textAlignVertical: 'top' }} />
        <AdminPickerField
          label="Confidence"
          value={form.confidence_level ?? 'medium'}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
          onChange={(v) => set('confidence_level', v)}
        />
        {!isNew ? (
          <AdminPickerField
            label="Status"
            value={form.status}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            onChange={(v) => set('status', v)}
          />
        ) : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>{isNew ? 'Create signal' : 'Save changes'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  saveButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#000', fontFamily: 'Axiforma-Bold', fontSize: 15 },
});
