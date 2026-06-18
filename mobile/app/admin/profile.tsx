import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../shared/constants/colors';
import { ChevronLeft, LogOut, Mail, Shield, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import {
  formatDisplayName,
  resolveUserDisplayName,
} from '../../../shared/utils/user-display-name';

export default function AdminProfileScreen() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/auth/login');
        return;
      }

      setEmail(session.user.email ?? '');

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      const name = resolveUserDisplayName({
        profileFullName: profileData?.full_name,
        userMetadata: session.user.user_metadata,
        email: session.user.email,
      });
      setDisplayName(formatDisplayName(name));
    }
    void load();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('push_tokens').delete().eq('user_id', session.user.id);
          }
          await supabase.auth.signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.gold} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Shield size={32} color={Colors.gold} strokeWidth={2} />
          </View>
          <Text style={styles.name}>{displayName || 'Admin'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Administrator</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <User size={18} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{displayName || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Mail size={18} color={Colors.gold} strokeWidth={2} />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {email || '—'}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          Admin accounts use the mobile insights panel only. Manage content and settings from the web dashboard.
        </Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#F87171" strokeWidth={2} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginBottom: 24,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginBottom: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(244, 196, 100, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
  },
  infoCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    width: 48,
  },
  infoValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Medium',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 14,
  },
  note: {
    color: Colors.rainyGrey,
    fontSize: 13,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    height: 52,
    gap: 8,
  },
  logoutText: {
    color: '#F87171',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
  },
});
