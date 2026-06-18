import type { NotificationData } from '../../shared/types/notification';
import { supabase } from './supabase';

export async function createNotificationForUser(
  userId: string,
  notificationData: NotificationData
) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      ...notificationData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createNotificationForUsers(
  userIds: string[],
  notificationData: NotificationData
) {
  if (userIds.length === 0) return [];

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    ...notificationData,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) throw error;
  return data ?? [];
}
