import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { AdminTradeAnalysis } from '../../../../hooks/use-admin-analyses';
import { AdminPreviewShell } from '../../../../components/admin/AdminPreviewShell';
import { AdminDetailRow, AdminPreviewSection } from '../../../../components/admin/AdminPreviewSection';
import { supabase } from '../../../../lib/supabase';
import { formatActivityTimestamp } from '../../../../../shared/utils/admin-timestamp';

export default function AdminAnalysisPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AdminTradeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('trade_analyses').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load analysis');
        router.back();
        return;
      }
      setAnalysis(data as AdminTradeAnalysis);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminPreviewShell
      title="XAUUSD Analysis"
      subtitle={analysis?.analysis_date}
      editHref={`/admin/analyses/${id}`}
      loading={loading}
    >
      {analysis ? (
        <>
          {analysis.chart_image_url ? (
            <Image source={{ uri: analysis.chart_image_url }} style={styles.chart} resizeMode="cover" />
          ) : null}
          <AdminPreviewSection title="Details">
            <AdminDetailRow label="Pair" value={analysis.trading_pair} />
            <AdminDetailRow label="Date" value={analysis.analysis_date} />
            <AdminDetailRow label="Risk level" value={analysis.risk_level} />
          </AdminPreviewSection>
          <AdminPreviewSection title="Content">
            <Text style={styles.body}>{analysis.content}</Text>
          </AdminPreviewSection>
          <AdminPreviewSection title="Timestamps">
            <AdminDetailRow label="Created" value={formatActivityTimestamp(analysis.created_at)} />
            <AdminDetailRow label="Updated" value={formatActivityTimestamp(analysis.updated_at)} />
          </AdminPreviewSection>
        </>
      ) : null}
    </AdminPreviewShell>
  );
}

const styles = StyleSheet.create({
  chart: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16, backgroundColor: '#2A2A2A' },
  body: { color: '#E5E5E5', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 20 },
});
