import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../shared/constants/colors';
import { 
  ChevronLeft, 
  Bell, 
  User, 
  Mail, 
  Phone, 
  Edit, 
  ChevronRight,
  LogOut,
  Trash2,
  FileText,
  Shield,
  HelpCircle,
  Info,
  Settings,
  Lightbulb
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      
      // Fetch additional profile data
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhoneNumber(profileData.phone_number || '');
      } else {
        // Use user metadata if profile doesn't exist
        setFullName(session.user.user_metadata?.full_name || '');
        setPhoneNumber(session.user.user_metadata?.phone_number || '');
      }
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    } else {
      const name = fullName.trim();
      const parts = name.split(/\s+/).filter(Boolean);
      await supabase.auth.updateUser({
        data: {
          full_name: name || undefined,
          first_name: parts[0] ?? undefined,
          last_name: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
          phone: phoneNumber.trim() || undefined,
        },
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
      fetchUserProfile();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (s?.user) {
              await supabase.from('push_tokens').delete().eq('user_id', s.user.id);
            }
            const { error } = await supabase.auth.signOut();
            if (!error) {
              router.replace('/auth/login');
            } else {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Manage your notification settings',
      route: '/notifications',
    },
    {
      icon: Settings,
      title: 'Notification Preferences',
      subtitle: 'Customize what you receive',
      route: '/notification-preferences',
    },
    {
      icon: Lightbulb,
      title: 'Tips & Quotes',
      subtitle: 'Daily trading tips and inspiration',
      route: '/tips',
    },
    {
      icon: FileText,
      title: 'Terms & Conditions',
      subtitle: 'Read our terms of service',
      route: '/terms',
    },
    {
      icon: Shield,
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      route: '/privacy',
    },
    {
      icon: Info,
      title: 'About AllyTZ Panel',
      subtitle: 'Learn more about us',
      route: '/about',
    },
    {
      icon: HelpCircle,
      title: 'FAQ',
      subtitle: 'Frequently asked questions',
      route: '/faq',
    },
    {
      icon: Trash2,
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and data',
      route: '/delete-account',
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
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileIconLarge}>
            <User size={48} color={Colors.gold} strokeWidth={2} />
          </View>
          
          {isEditing ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#666666"
                  selectionColor={Colors.gold}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.disabledInput}>
                  <Mail size={16} color="#666666" strokeWidth={2} />
                  <Text style={styles.disabledInputText}>
                    {user?.email || 'Not available'}
                  </Text>
                </View>
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#666666"
                  keyboardType="phone-pad"
                  selectionColor={Colors.gold}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{fullName || 'User'}</Text>
              
              <View style={styles.profileDetail}>
                <Mail size={16} color="#A0A0A0" strokeWidth={2} />
                <Text style={styles.profileDetailText}>
                  {user?.email || 'Not available'}
                </Text>
              </View>

              {phoneNumber && (
                <View style={styles.profileDetail}>
                  <Phone size={16} color="#A0A0A0" strokeWidth={2} />
                  <Text style={styles.profileDetailText}>{phoneNumber}</Text>
                </View>
              )}

              <View style={styles.accountStatusBadge}>
                <Text style={styles.accountStatusTitle}>AllyTZ Panel member</Text>
                <Text style={styles.accountStatusHint}>
                  Free access. Adjust updates in Notification Preferences.
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>SETTINGS & INFORMATION</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>
                <item.icon size={22} color={Colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: Colors.gold,
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  profileIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Axiforma-Bold',
    marginBottom: 12,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileDetailText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Axiforma-Regular',
    marginLeft: 8,
  },
  accountStatusBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    maxWidth: '100%',
  },
  accountStatusTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  accountStatusHint: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  disabledInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  disabledInputText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Axiforma-Regular',
    marginLeft: 10,
  },
  helperText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.gold,
    fontSize: 12,
    fontFamily: 'Axiforma-Bold',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-SemiBold',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#A0A0A0',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Axiforma-Bold',
    marginLeft: 10,
  },
  versionText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Axiforma-Regular',
    textAlign: 'center',
    marginTop: 8,
  },
});
