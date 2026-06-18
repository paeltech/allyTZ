import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../shared/constants/colors';
import {
  ChevronLeft,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Calendar,
  Lightbulb,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getMobileNotificationRoute } from '../../../shared/utils/notification-routes';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
}

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(80);

    if (error) {
      Alert.alert('Error', 'Failed to load notifications.');
    } else {
      setNotifications(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchNotifications();

    const channel = supabase
      .channel('admin-notifications-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        void fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    void markAsRead(notification.id);
    const route = getMobileNotificationRoute(notification, { isAdmin: true });
    if (route) {
      router.push(route as never);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal':
        return <TrendingUp size={20} color={Colors.gold} strokeWidth={2} />;
      case 'event':
        return <Calendar size={20} color={Colors.gold} strokeWidth={2} />;
      case 'tip':
        return <Lightbulb size={20} color={Colors.gold} strokeWidth={2} />;
      case 'system':
        return <MessageSquare size={20} color={Colors.gold} strokeWidth={2} />;
      case 'success':
        return <CheckCircle2 size={20} color="#22C55E" strokeWidth={2} />;
      case 'warning':
        return <AlertCircle size={20} color="#FFBF00" strokeWidth={2} />;
      default:
        return <Info size={20} color={Colors.gold} strokeWidth={2} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[styles.notificationCard, !notification.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.85}
    >
      <View style={styles.notificationIcon}>{getNotificationIcon(notification.notification_type)}</View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{formatDate(notification.created_at)}</Text>
      </View>
      {!notification.read ? <View style={styles.unreadDot} /> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin alerts</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardCheck size={56} color="#666" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>User messages, feedback, and assistance requests will appear here.</Text>
          </View>
        ) : (
          notifications.map(renderNotification)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, color: '#FFF', fontSize: 18, fontFamily: 'Axiforma-Bold', textAlign: 'center' },
  markAllButton: { paddingVertical: 6, paddingHorizontal: 4 },
  markAllText: { color: Colors.gold, fontSize: 12, fontFamily: 'Axiforma-SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  unreadCard: { backgroundColor: '#2A2A2A', borderLeftWidth: 3, borderLeftColor: Colors.gold },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: { flex: 1 },
  notificationTitle: { color: '#FFF', fontFamily: 'Axiforma-SemiBold', fontSize: 15, marginBottom: 4 },
  notificationMessage: { color: '#A0A0A0', fontFamily: 'Axiforma-Regular', fontSize: 13, lineHeight: 18 },
  notificationTime: { color: '#666', fontFamily: 'Axiforma-Regular', fontSize: 11, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold, marginTop: 6 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 24 },
  emptyTitle: { color: '#FFF', fontFamily: 'Axiforma-Bold', fontSize: 18, marginTop: 16 },
  emptyText: { color: Colors.rainyGrey, fontFamily: 'Axiforma-Regular', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
