import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Signal } from '../../../../../shared/types/signal';
import { AdminPreviewShell } from '../../../../components/admin/AdminPreviewShell';
import { AdminDetailRow, AdminPreviewSection } from '../../../../components/admin/AdminPreviewSection';
import { supabase } from '../../../../lib/supabase';
import { formatActivityTimestamp } from '../../../../../shared/utils/admin-timestamp';

export default function AdminSignalPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('signals').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load signal');
        router.back();
        return;
      }
      setSignal(data as Signal);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminPreviewShell
      title={signal?.trading_pair ?? 'Signal'}
      subtitle={signal?.title}
      editHref={`/admin/signals/${id}`}
      loading={loading}
    >
      {signal ? (
        <>
          <AdminPreviewSection title="Trade setup">
            <AdminDetailRow label="Pair" value={signal.trading_pair} />
            <AdminDetailRow label="Type" value={signal.signal_type.toUpperCase()} />
            <AdminDetailRow label="Order" value={signal.order_type} />
            <AdminDetailRow label="Entry" value={signal.entry_price} />
            <AdminDetailRow label="Stop loss" value={signal.stop_loss} />
            <AdminDetailRow label="TP1" value={signal.take_profit_1} />
            <AdminDetailRow label="TP2" value={signal.take_profit_2} />
            <AdminDetailRow label="TP3" value={signal.take_profit_3} />
            <AdminDetailRow label="Confidence" value={signal.confidence_level} />
            <AdminDetailRow label="Status" value={signal.status} />
          </AdminPreviewSection>
          {signal.analysis ? (
            <AdminPreviewSection title="Analysis">
              <Text style={styles.body}>{signal.analysis}</Text>
            </AdminPreviewSection>
          ) : null}
          <AdminPreviewSection title="Timestamps">
            <AdminDetailRow label="Created" value={formatActivityTimestamp(signal.created_at)} />
            <AdminDetailRow label="Updated" value={formatActivityTimestamp(signal.updated_at)} />
          </AdminPreviewSection>
        </>
      ) : null}
    </AdminPreviewShell>
  );
}

const styles = StyleSheet.create({
  body: { color: '#E5E5E5', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 20 },
});
