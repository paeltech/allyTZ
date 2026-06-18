import React, { useEffect, useState } from 'react';
import { Text, Image, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { AdminEvent } from '../../../../hooks/use-admin-events';
import { AdminPreviewShell } from '../../../../components/admin/AdminPreviewShell';
import { AdminDetailRow, AdminPreviewSection } from '../../../../components/admin/AdminPreviewSection';
import { supabase } from '../../../../lib/supabase';
import { formatActivityTimestamp } from '../../../../../shared/utils/admin-timestamp';

export default function AdminEventPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load event');
        router.back();
        return;
      }
      setEvent(data as AdminEvent);
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminPreviewShell
      title={event?.title ?? 'Event'}
      subtitle={event?.organizer}
      editHref={`/admin/events/${id}`}
      loading={loading}
    >
      {event ? (
        <>
          {event.cover_image_url ? (
            <Image source={{ uri: event.cover_image_url }} style={styles.cover} resizeMode="cover" />
          ) : null}
          <AdminPreviewSection title="Details">
            <AdminDetailRow label="Category" value={event.category} />
            <AdminDetailRow label="Type" value={event.type} />
            <AdminDetailRow label="Status" value={event.status} />
            <AdminDetailRow label="Location" value={event.location} />
            <AdminDetailRow label="Capacity" value={event.capacity} />
            <AdminDetailRow
              label="Price"
              value={event.price_type === 'Free' ? 'Free' : `$${event.price}`}
            />
            <AdminDetailRow label="Featured" value={event.is_featured ? 'Yes' : 'No'} />
            <AdminDetailRow label="Start" value={event.start_date} />
            <AdminDetailRow label="End" value={event.end_date} />
          </AdminPreviewSection>
          {event.description ? (
            <AdminPreviewSection title="Description">
              <Text style={styles.body}>{event.description}</Text>
            </AdminPreviewSection>
          ) : null}
          <AdminPreviewSection title="Timestamps">
            <AdminDetailRow label="Created" value={formatActivityTimestamp(event.created_at)} />
            <AdminDetailRow label="Updated" value={formatActivityTimestamp(event.updated_at)} />
          </AdminPreviewSection>
        </>
      ) : null}
    </AdminPreviewShell>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 180, borderRadius: 14, marginBottom: 16, backgroundColor: '#2A2A2A' },
  body: { color: '#E5E5E5', fontFamily: 'Axiforma-Regular', fontSize: 14, lineHeight: 20 },
});
