import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { ChevronLeft, Bell, TrendingUp, Calendar, Users, Lightbulb } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function NotificationPreferencesScreen() {
  const [preferences, setPreferences] = useState({
    email_signals: true,
    email_analyses: true,
    email_events: true,
    push_signals: true,
    push_analyses: true,
    push_events: true,
    push_tips: true,
    marketing_emails: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!error && data) {
        setPreferences({
          email_signals: data.email_signals ?? true,
          email_analyses: data.email_analyses ?? true,
          email_events: data.email_events ?? true,
          push_signals: data.push_signals ?? true,
          push_analyses: data.push_analyses ?? true,
          push_events: data.push_events ?? true,
          push_tips: data.push_tips ?? true,
          marketing_emails: data.marketing_emails ?? false,
        });
      }
    }
    setIsLoading(false);
  };

  const updatePreference = async (key: string, value: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    setPreferences(prev => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  const preferenceGroups = [
    {
      title: 'Email Notifications',
      subtitle: 'Receive updates via email',
      items: [
        {
          icon: TrendingUp,
          label: 'Trading Signals',
          description: 'Get notified about new signals',
          key: 'email_signals',
          value: preferences.email_signals,
        },
        {
          icon: Users,
          label: 'Trade Analyses',
          description: 'Updates on new market analyses',
          key: 'email_analyses',
          value: preferences.email_analyses,
        },
        {
          icon: Calendar,
          label: 'Events',
          description: 'Upcoming webinars and workshops',
          key: 'email_events',
          value: preferences.email_events,
        },
      ],
    },
    {
      title: 'Push Notifications',
      subtitle: 'Receive updates on your device',
      items: [
        {
          icon: TrendingUp,
          label: 'Trading Signals',
          description: 'Instant signal notifications',
          key: 'push_signals',
          value: preferences.push_signals,
        },
        {
          icon: Users,
          label: 'Trade Analyses',
          description: 'New analysis alerts',
          key: 'push_analyses',
          value: preferences.push_analyses,
        },
        {
          icon: Calendar,
          label: 'Events',
          description: 'Event reminders',
          key: 'push_events',
          value: preferences.push_events,
        },
        {
          icon: Lightbulb,
          label: 'Daily tips & quotes',
          description: 'Tip of the day on your device',
          key: 'push_tips',
          value: preferences.push_tips,
        },
      ],
    },
    {
      title: 'Marketing',
      subtitle: 'Promotional content',
      items: [
        {
          icon: Bell,
          label: 'Marketing Emails',
          description: 'Special offers and promotions',
          key: 'marketing_emails',
          value: preferences.marketing_emails,
        },
      ],
    },
  ];

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
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageDescription}>
          Customize how and when you want to receive notifications from AllyTZ Panel.
        </Text>

        {preferenceGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <Text style={styles.sectionSubtitle}>{group.subtitle}</Text>
            </View>

            {group.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.preferenceItem}>
                <View style={styles.preferenceIconContainer}>
                  <item.icon size={20} color={Colors.gold} strokeWidth={2} />
                </View>
                <View style={styles.preferenceTextContainer}>
                  <Text style={styles.preferenceLabel}>{item.label}</Text>
                  <Text style={styles.preferenceDescription}>{item.description}</Text>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={(value) => updatePreference(item.key, value)}
                  trackColor={{ false: '#3A3A3A', true: Colors.gold }}
                  thumbColor={item.value ? '#FFFFFF' : '#A0A0A0'}
                  ios_backgroundColor="#3A3A3A"
                />
              </View>
            ))}
          </View>
        ))}

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            💡 <Text style={styles.noteBold}>Note:</Text> Some critical notifications cannot be disabled to ensure you don't miss important account-related information.
          </Text>
        </View>
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
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  pageDescription: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  preferenceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 2,
  },
  preferenceDescription: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
  noteContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  noteText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
  },
  noteBold: {
    fontFamily: 'Axiforma-Bold',
    color: '#FFFFFF',
  },
});
