import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, CheckCircle2, AlertCircle, Info, TrendingUp, Calendar, Lightbulb, MessageSquare } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getMobileNotificationRoute } from '../../shared/utils/notification-routes';

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

export default function NotificationsScreen() {
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
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications.');
    } else {
      setNotifications(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
        console.log('Notification change received!', payload);
        fetchNotifications();
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
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
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
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      Alert.alert('Success', 'All notifications marked as read.');
    } else {
      Alert.alert('Error', 'Failed to mark all as read.');
    }
  };

  const getActionRoute = (notification: Notification): string | null =>
    getMobileNotificationRoute(notification, { isAdmin: false });

  const handleNotificationPress = (notification: Notification) => {
    void markAsRead(notification.id);
    const route = getActionRoute(notification);
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
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupNotificationsByDate = (allNotifications: Notification[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayNotifications: Notification[] = [];
    const yesterdayNotifications: Notification[] = [];
    const olderNotifications: Notification[] = [];

    allNotifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at);
      notificationDate.setHours(0, 0, 0, 0);

      if (notificationDate.getTime() === today.getTime()) {
        todayNotifications.push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        yesterdayNotifications.push(notification);
      } else {
        olderNotifications.push(notification);
      }
    });

    return { todayNotifications, yesterdayNotifications, olderNotifications };
  };

  const { todayNotifications, yesterdayNotifications, olderNotifications } = groupNotificationsByDate(notifications);

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[styles.notificationCard, !notification.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(notification.notification_type)}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{formatDate(notification.created_at)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 50 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#666666" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>You're all caught up! Check back later.</Text>
          </View>
        ) : (
          <>
            {todayNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>TODAY</Text>
                {todayNotifications.map(renderNotification)}
              </View>
            )}

            {yesterdayNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>YESTERDAY</Text>
                {yesterdayNotifications.map(renderNotification)}
              </View>
            )}

            {olderNotifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>OLDER</Text>
                {olderNotifications.map(renderNotification)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: Colors.gold,
    fontSize: 14,
    fontFamily: 'Axiforma-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  unreadCard: {
    backgroundColor: '#2A2A2A',
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 4,
  },
  notificationMessage: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Axiforma-Bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
  },
});
