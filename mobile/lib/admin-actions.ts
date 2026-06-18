import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../../shared/constants/supabase';
import { formatSignalNotification } from '../../shared/utils/notifications';
import type { Signal } from '../../shared/types/signal';
import { createNotificationForUsers } from './notifications';
import { supabase } from './supabase';
import { uploadImageToBucket } from './upload-storage-image';

export async function notifySignalSubscribers(signal: Signal) {
  const { data: subscriptions, error } = await supabase
    .from('signal_subscriptions')
    .select('user_id')
    .eq('status', 'active');

  if (error || !subscriptions?.length) return;

  const userIds = subscriptions.map((s) => s.user_id);
  const { title, message } = formatSignalNotification({
    title: signal.title,
    trading_pair: signal.trading_pair,
    signal_type: signal.signal_type,
    entry_price: String(signal.entry_price),
  });

  await createNotificationForUsers(userIds, {
    notification_type: 'signal',
    title,
    message,
    action_url: '/signals',
    metadata: {
      signal_id: signal.id,
      trading_pair: signal.trading_pair,
      signal_type: signal.signal_type,
    },
  });
}

export async function trySendWhatsAppForSignal(signalId: string) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ signalId }),
    });
  } catch {
    // Non-blocking
  }
}

export async function notifyAllUsersForEvent(event: {
  id: string;
  title: string;
  type: string;
  start_date: string | null;
}) {
  const { data: profiles, error } = await supabase.from('user_profiles').select('id');
  if (error || !profiles?.length) return;

  const userIds = profiles.map((p) => p.id);
  await createNotificationForUsers(userIds, {
    notification_type: 'event',
    title: `📅 New Event: ${event.title}`,
    message: `${event.type} starting ${
      event.start_date ? new Date(event.start_date).toLocaleDateString() : 'soon'
    }`,
    action_url: '/events',
    metadata: { event_id: event.id },
  });
}

export async function uploadPublicImage(
  bucket: string,
  folder: string,
  localUri: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split('/').pop()?.replace('jpeg', 'jpg') || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  await uploadImageToBucket(bucket, path, localUri, mimeType);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
