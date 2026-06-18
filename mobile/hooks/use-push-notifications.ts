import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import {
  registerForPushNotificationsAsync,
  getPushPlatform,
  getRouteFromPushData,
} from '../lib/push-notifications';

/**
 * Registers push token with backend and sets up notification listeners.
 * Call once when user is authenticated (e.g. in root layout when session exists).
 */
async function savePushToken(userId: string): Promise<boolean> {
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    console.warn(
      '[Push] No token – use a production/dev build on a physical device. On iOS, ensure APNs credentials are configured in EAS (expo.dev → Credentials → iOS).'
    );
    return false;
  }

  const platform = getPushPlatform();
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,expo_push_token',
    }
  );

  if (error) {
    console.error('[Push] Failed to save token to push_tokens:', error.message, error.details ?? error);
    return false;
  }

  if (__DEV__) console.log('[Push] Token saved to push_tokens for user', userId, 'platform', platform);
  return true;
}

export function usePushNotifications(userId: string | undefined) {
  const listenerRefs = useRef<{ received: Notifications.EventSubscription; response: Notifications.EventSubscription } | null>(null);
  const registerToken = useCallback(async () => {
    if (!userId) return;
    await savePushToken(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    (async () => {
      if (!isMounted) return;
      await registerToken();
    })();

    const received = Notifications.addNotificationReceivedListener(() => {
      // Optional: refresh in-app notification list or badge
    });

    const response = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const { data: { session } } = await supabase.auth.getSession();
      let isAdmin = false;
      if (session?.user) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
        isAdmin = roleRow?.role === 'admin';
      }
      const route = getRouteFromPushData(data, { isAdmin });
      if (route) router.push(route as never);
      const notificationId = data?.notification_id as string | undefined;
      if (notificationId) {
        supabase.from('notifications').update({ read: true }).eq('id', notificationId).then(() => {});
      }
    });

    listenerRefs.current = { received, response };

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        registerToken();
      }
    });

    return () => {
      isMounted = false;
      received.remove();
      response.remove();
      appStateSub.remove();
      listenerRefs.current = null;
    };
  }, [userId, registerToken]);
}

/**
 * Handle app opened from quit state via notification tap.
 * Call once on app startup (e.g. in root layout).
 */
export async function handleInitialNotificationResponse(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  const data = response.notification.request.content.data as Record<string, unknown> | null;
  const { data: { session } } = await supabase.auth.getSession();
  let isAdmin = false;
  if (session?.user) {
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    isAdmin = roleRow?.role === 'admin';
  }
  const route = getRouteFromPushData(data, { isAdmin });
  if (route) router.push(route as never);
  const notificationId = data?.notification_id as string | undefined;
  if (notificationId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  }
}
