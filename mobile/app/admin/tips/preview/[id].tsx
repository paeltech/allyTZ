import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { TradingTip } from '../../../../../shared/types/tip';
import { AdminPreviewShell } from '../../../../components/admin/AdminPreviewShell';
import { AdminDetailRow, AdminPreviewSection } from '../../../../components/admin/AdminPreviewSection';
import { supabase } from '../../../../lib/supabase';
import { formatActivityTimestamp } from '../../../../../shared/utils/admin-timestamp';

export default function AdminTipPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tip, setTip] = useState<TradingTip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('trading_tips').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load tip');
        router.back();
        return;
      }
      setTip(data as TradingTip);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminPreviewShell
      title={tip?.title ?? 'Tip'}
      subtitle={tip?.content_kind === 'quote' ? 'Quote' : 'Tip'}
      editHref={`/admin/tips/${id}`}
      loading={loading}
    >
      {tip ? (
        <>
          <AdminPreviewSection title="Details">
            <AdminDetailRow label="Kind" value={tip.content_kind} />
            <AdminDetailRow label="Sort order" value={tip.sort_order} />
            <AdminDetailRow label="Status" value={tip.active ? 'Active' : 'Inactive'} />
          </AdminPreviewSection>
          <AdminPreviewSection title="Content">
            <Text style={styles.body}>{tip.body}</Text>
          </AdminPreviewSection>
          <AdminPreviewSection title="Timestamps">
            <AdminDetailRow label="Created" value={formatActivityTimestamp(tip.created_at)} />
          </AdminPreviewSection>
        </>
      ) : null}
    </AdminPreviewShell>
  );
}

const styles = StyleSheet.create({
  body: { color: '#E5E5E5', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
});
