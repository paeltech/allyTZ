export type NotificationRouteInput = {
  notification_type: string;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Resolve an expo-router path from a notification row (mobile).
 */
export function getMobileNotificationRoute(
  notification: NotificationRouteInput,
  options: { isAdmin?: boolean } = {}
): string | null {
  const meta = (notification.metadata ?? {}) as Record<string, unknown>;
  const isAdmin = options.isAdmin ?? false;
  const actionUrl = notification.action_url?.trim() || null;

  if (notification.notification_type === 'system') {
    if (isAdmin) {
      if (meta.thread_user_id) return `/admin/messages/${meta.thread_user_id}`;
      if (meta.user_id) return `/admin/users/${meta.user_id}`;
      if (meta.signal_id) return `/admin/signals/discussion/${meta.signal_id}`;
      if (meta.check_in_id) return '/admin/check-ins';
      return actionUrl ?? '/admin/messages';
    }
    return actionUrl ?? '/messages';
  }

  switch (notification.notification_type) {
    case 'signal': {
      const signalId = meta.signal_id as string | undefined;
      if (isAdmin && signalId) {
        const audience = meta.audience as string | undefined;
        if (audience === 'admin_only' || actionUrl?.includes('/admin/')) {
          return `/admin/signals/discussion/${signalId}`;
        }
      }
      if (signalId) return `/signals/${signalId}`;
      return isAdmin ? '/admin/signals' : '/signals';
    }
    case 'event': {
      const eventId = meta.event_id as string | undefined;
      if (eventId) return `/events/${eventId}`;
      return '/events';
    }
    case 'announcement': {
      const analysisId = meta.analysis_id as string | undefined;
      if (analysisId) return `/analysis/${analysisId}`;
      return '/analysis';
    }
    case 'tip':
      return actionUrl ?? '/tips';
    default:
      return actionUrl;
  }
}
